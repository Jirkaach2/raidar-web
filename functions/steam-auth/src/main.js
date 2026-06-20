import { Client, Users } from 'node-appwrite';

/**
 * Steam login for Raidar via Steam OpenID 2.0 + Appwrite custom tokens.
 *
 * Steam is not an OAuth2 provider, so we run the OpenID handshake ourselves and
 * exchange the verified SteamID for an Appwrite custom token. The browser then
 * calls `account.createSession(userId, secret)` to obtain a real session.
 *
 * Flow:
 *   1. GET ?action=login    → 302 redirect to Steam's OpenID login.
 *   2. Steam returns to      ?action=callback with openid.* params.
 *   3. We verify the assertion with Steam, upsert the user, mint a token,
 *      then 302 redirect to  <SITE_URL>/auth/steam?userId=..&secret=..
 *
 * Required environment variables:
 *   APPWRITE_API_KEY   key with users.read + users.write
 *   SITE_URL           e.g. https://raidar.tech  (where to land after login)
 * Optional:
 *   STEAM_API_KEY      Steam Web API key — enriches name/avatar from the profile
 *   APPWRITE_FUNCTION_API_ENDPOINT / APPWRITE_FUNCTION_PROJECT_ID are auto-injected.
 */
export default async ({ req, res, log, error }) => {
  const VERSION = 'v3';
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
  const steamApiKey = process.env.STEAM_API_KEY;

  // This function's own public base URL (derived from the incoming request),
  // used as the OpenID realm + return_to so Steam echoes back to us.
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['host'];
  const path = (req.path || '/').split('?')[0];
  const selfBase = `${proto}://${host}`;
  const returnTo = `${selfBase}${path}?action=callback`;

  const STEAM_OPENID = 'https://steamcommunity.com/openid/login';

  // Parse a raw query string WITHOUT turning '+' into a space. Steam signs
  // fields such as `openid.response_nonce` that can contain a literal '+';
  // URLSearchParams / most parsers decode '+' → ' ', which corrupts the value
  // and makes Steam's signature check fail. decodeURIComponent preserves it.
  const parseQuery = (qs) => {
    const out = {};
    for (const pair of (qs || '').split('&')) {
      if (!pair) continue;
      const i = pair.indexOf('=');
      const k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
      const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1));
      out[k] = v;
    }
    return out;
  };

  const rawQuery = req.queryString || (req.url || '').split('?').slice(1).join('?') || '';
  const query = parseQuery(rawQuery);

  // Action can arrive via the OpenID GET (?action=) or a POST body (SDK call).
  let body = {};
  if (req.method === 'POST') {
    try { body = JSON.parse(req.bodyRaw || req.body || '{}'); } catch { /* ignore */ }
  }
  const action = query.action || body.action || 'login';

  const SYNTH_DOMAIN = '@steam.users.raidar.tech';
  const isSynthEmail = (e) => !e || e.endsWith(SYNTH_DOMAIN);

  const fail = (msg) => {
    error(`steam-auth[${VERSION}]: ${msg}`);
    return res.redirect(`${siteUrl}/login?error=steam&reason=${encodeURIComponent(`[${VERSION}] ${msg}`)}`, 302);
  };

  try {
    // ── 1. Kick off: redirect the browser to Steam ──
    if (action === 'login') {
      const params = new URLSearchParams({
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': returnTo,
        'openid.realm': selfBase,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      });
      return res.redirect(`${STEAM_OPENID}?${params.toString()}`, 302);
    }

    // ── Authenticated: let a signed-in Steam user attach a real email ──
    if (action === 'setEmail') {
      const callerId = req.headers['x-appwrite-user-id'];
      if (!callerId) return res.json({ error: 'Not authenticated.' }, 401);
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.json({ error: 'Enter a valid email address.' }, 400);
      if (email.endsWith(SYNTH_DOMAIN)) return res.json({ error: 'Please use a real email address.' }, 400);

      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
      const users = new Users(client);
      try {
        // Setting a new email clears the verified flag; the client then triggers
        // the normal verification email so the user confirms ownership.
        await users.updateEmail(callerId, email);
        return res.json({ ok: true });
      } catch (e) {
        const msg = /already|exists|unique/i.test(e.message) ? 'That email is already in use.' : (e.message || 'Could not save email.');
        return res.json({ error: msg }, 400);
      }
    }

    // ── 2. Steam returned: verify the assertion ──
    if (action === 'callback') {
      const q = query;
      log(`steam-auth[${VERSION}] callback: ${Object.keys(q).filter((k) => k.startsWith('openid.')).length} openid params; mode=${q['openid.mode']}; rawlen=${rawQuery.length}`);
      if (q['openid.mode'] !== 'id_res') return fail('unexpected openid mode');

      // Echo every openid.* param back to Steam with mode=check_authentication,
      // re-encoding with encodeURIComponent so '+' becomes %2B (not a space).
      const verify = Object.entries(q)
        .filter(([k]) => k.startsWith('openid.'))
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(k === 'openid.mode' ? 'check_authentication' : v)}`)
        .join('&');

      const vr = await fetch(STEAM_OPENID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verify,
      });
      const vt = await vr.text();
      log(`steam-auth[${VERSION}] check_authentication → ${vr.status}: ${vt.replace(/\s+/g, ' ').trim()}`);
      if (!/is_valid\s*:\s*true/i.test(vt)) {
        return fail(`assertion not valid (http ${vr.status}; steam: ${vt.replace(/\s+/g, ' ').trim().slice(0, 80)})`);
      }

      // claimed_id → .../openid/id/<steamid64>
      const claimed = String(q['openid.claimed_id'] || '');
      const m = claimed.match(/\/id\/(\d{17})$/);
      if (!m) return fail('could not parse steamid');
      const steamId = m[1];

      const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
      const users = new Users(client);

      // Optional profile enrichment from the Steam Web API.
      let personaName = `Steam ${steamId.slice(-4)}`;
      let avatar = '';
      if (steamApiKey) {
        try {
          const pr = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamApiKey}&steamids=${steamId}`);
          const pj = await pr.json();
          const p = pj?.response?.players?.[0];
          if (p) { personaName = p.personaname || personaName; avatar = p.avatarfull || ''; }
        } catch { /* enrichment is best-effort */ }
      }

      // Upsert: a deterministic, idempotent user id keyed on the SteamID.
      const userId = `steam_${steamId}`;
      let existing = null;
      try { existing = await users.get(userId); } catch { /* new user */ }
      if (!existing) {
        // Steam gives us no email; create with a synthetic, non-routable one so
        // the create call always satisfies Appwrite's identifier requirement.
        // The user is invited to attach a real email right after (two-step flow).
        const synthEmail = `${steamId}${SYNTH_DOMAIN}`;
        try {
          await users.create(userId, synthEmail, undefined, undefined, personaName);
        } catch (e) {
          log(`create with email failed (${e.message}); retrying id-only`);
          await users.create(userId, undefined, undefined, undefined, personaName);
        }
      }
      // Keep profile fresh + record the steam linkage in prefs.
      try {
        await users.updateName(userId, personaName);
        await users.updatePrefs(userId, { steamId, steamAvatar: avatar, provider: 'steam' });
      } catch (e) { log(`profile update skipped: ${e.message}`); }

      // Does this account still lack a real email? If so, the browser will route
      // the user to a page to add one and verify it.
      let needsEmail = !existing;
      try {
        const fresh = existing || (await users.get(userId));
        needsEmail = isSynthEmail(fresh.email);
      } catch { /* fall back to !existing */ }

      // Mint a custom token the browser can exchange for a session.
      let token;
      try {
        token = await users.createToken(userId, 64, 60); // 64-char secret, 60s TTL
      } catch (e) {
        return fail(`createToken failed: ${e.message}`);
      }
      const url = `${siteUrl}/auth/steam?userId=${encodeURIComponent(token.userId)}&secret=${encodeURIComponent(token.secret)}&needsEmail=${needsEmail ? 1 : 0}`;
      log(`steam login ok: ${steamId} → ${userId} (needsEmail=${needsEmail})`);
      return res.redirect(url, 302);
    }

    return fail(`unknown action: ${action}`);
  } catch (err) {
    return fail(err.message || 'unexpected error');
  }
};
