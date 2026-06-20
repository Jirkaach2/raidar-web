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
  const action = (req.query && req.query.action) || 'login';

  const fail = (msg) => {
    error(`steam-auth: ${msg}`);
    return res.redirect(`${siteUrl}/login?error=steam&reason=${encodeURIComponent(msg)}`, 302);
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

    // ── 2. Steam returned: verify the assertion ──
    if (action === 'callback') {
      const q = req.query || {};
      if (q['openid.mode'] !== 'id_res') return fail('unexpected openid mode');

      // Echo every openid.* param back to Steam with mode=check_authentication.
      const verify = new URLSearchParams();
      for (const [k, v] of Object.entries(q)) {
        if (k.startsWith('openid.')) verify.append(k, String(v));
      }
      verify.set('openid.mode', 'check_authentication');

      const vr = await fetch(STEAM_OPENID, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: verify.toString(),
      });
      const vt = await vr.text();
      if (!/is_valid\s*:\s*true/i.test(vt)) return fail('assertion not valid');

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
      let exists = true;
      try { await users.get(userId); } catch { exists = false; }
      if (!exists) {
        // Steam gives us no email; create with a synthetic, non-routable one so
        // the create call always satisfies Appwrite's identifier requirement.
        const synthEmail = `${steamId}@steam.users.raidar.tech`;
        try {
          await users.create(userId, synthEmail, undefined, undefined, personaName);
        } catch (e) {
          // Fall back to an id-only user if the email path is rejected.
          log(`create with email failed (${e.message}); retrying id-only`);
          await users.create(userId, undefined, undefined, undefined, personaName);
        }
      }
      // Keep profile fresh + record the steam linkage in prefs.
      try {
        await users.updateName(userId, personaName);
        await users.updatePrefs(userId, { steamId, steamAvatar: avatar, provider: 'steam' });
      } catch (e) { log(`profile update skipped: ${e.message}`); }

      // Mint a custom token the browser can exchange for a session.
      let token;
      try {
        token = await users.createToken(userId, 64, 60); // 64-char secret, 60s TTL
      } catch (e) {
        return fail(`createToken failed: ${e.message}`);
      }
      const url = `${siteUrl}/auth/steam?userId=${encodeURIComponent(token.userId)}&secret=${encodeURIComponent(token.secret)}`;
      log(`steam login ok: ${steamId} → ${userId}`);
      return res.redirect(url, 302);
    }

    return fail(`unknown action: ${action}`);
  } catch (err) {
    return fail(err.message || 'unexpected error');
  }
};
