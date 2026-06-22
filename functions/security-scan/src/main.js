// Raidar — security-scan function
// Returns live malware-scan results for the installer hash from VirusTotal and
// MetaDefender. If a provider has no report for the hash yet, the function
// AUTO-SUBMITS the installer (pulled from the private GitHub release via PAT) so
// the scan happens with zero manual steps. API keys stay server-side.
//
// Required env vars:
//   VIRUSTOTAL_API_KEY    — VirusTotal v3 API key
//   METADEFENDER_API_KEY  — OPSWAT MetaDefender Cloud API key
//   GITHUB_PAT            — token with read access to the release repo (for auto-submit)
//   DEFAULT_HASH         — installer SHA-256 (used when no ?hash= is given AND as the
//                          guard that decides whether auto-submit is allowed)
// Optional:
//   REPO_OWNER (default JirkaachS), REPO_NAME (default raidar-app)

const SHA256_RE = /^[a-fA-F0-9]{64}$/;

function parseQuery(qs) {
  const out = {};
  for (const pair of (qs || '').split('&')) {
    if (!pair) continue;
    const i = pair.indexOf('=');
    const k = decodeURIComponent(i < 0 ? pair : pair.slice(0, i));
    const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1));
    out[k] = v;
  }
  return out;
}

// ── Pull the installer bytes from the latest GitHub release (private repo) ──
async function getInstaller(pat, owner, repo, log) {
  const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github+json', 'User-Agent': 'raidar-security-scan' },
  });
  if (!relRes.ok) throw new Error(`github release lookup ${relRes.status}`);
  const rel = await relRes.json();
  const asset = (rel.assets || []).find((a) => /setup\.exe$/i.test(a.name));
  if (!asset) throw new Error('no setup.exe asset in latest release');

  const dlRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`, {
    headers: { Authorization: `token ${pat}`, Accept: 'application/octet-stream', 'User-Agent': 'raidar-security-scan' },
    redirect: 'follow',
  });
  if (!dlRes.ok) throw new Error(`github asset download ${dlRes.status}`);
  const buffer = await dlRes.arrayBuffer();
  log(`Fetched installer ${asset.name} (${buffer.byteLength} bytes)`);
  return { buffer, filename: asset.name };
}

// ── VirusTotal ──
async function vtLookup(hash, key, log) {
  if (!key) return { error: 'not_configured' };
  try {
    const r = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': key, Accept: 'application/json' },
    });
    if (r.status === 404) return { found: false };
    if (!r.ok) { log(`VT lookup ${r.status}`); return { error: `http_${r.status}` }; }
    const data = await r.json();
    const s = data?.data?.attributes?.last_analysis_stats || {};
    const malicious = s.malicious || 0;
    const suspicious = s.suspicious || 0;
    const total = malicious + suspicious + (s.harmless || 0) + (s.undetected || 0) + (s.timeout || 0);
    return { found: true, detections: malicious + suspicious, total, permalink: `https://www.virustotal.com/gui/file/${hash}` };
  } catch (e) { log(`VT lookup error: ${e.message}`); return { error: 'fetch_failed' }; }
}

async function vtSubmit(buffer, filename, key, log) {
  if (!key) return { error: 'not_configured' };
  try {
    // Files >32MB require a dedicated upload URL.
    const urlRes = await fetch('https://www.virustotal.com/api/v3/files/upload_url', {
      headers: { 'x-apikey': key, Accept: 'application/json' },
    });
    if (!urlRes.ok) { log(`VT upload_url ${urlRes.status}`); return { error: 'submit_failed' }; }
    const uploadUrl = (await urlRes.json()).data;

    const form = new FormData();
    form.append('file', new Blob([buffer]), filename);
    const up = await fetch(uploadUrl, { method: 'POST', headers: { 'x-apikey': key }, body: form });
    if (!up.ok) { log(`VT submit ${up.status}`); return { error: 'submit_failed' }; }
    log('VT: installer submitted for analysis');
    return { submitted: true };
  } catch (e) { log(`VT submit error: ${e.message}`); return { error: 'submit_failed' }; }
}

// ── MetaDefender ──
async function mdLookup(hash, key, log) {
  if (!key) return { error: 'not_configured' };
  try {
    const r = await fetch(`https://api.metadefender.com/v4/hash/${hash}`, {
      headers: { apikey: key, Accept: 'application/json' },
    });
    if (r.status === 404) return { found: false };
    if (!r.ok) { log(`MD lookup ${r.status}`); return { error: `http_${r.status}` }; }
    const data = await r.json();
    const sr = data?.scan_results || {};
    // If still scanning, scan_results.progress_percentage < 100.
    if (sr.progress_percentage !== undefined && sr.progress_percentage < 100) {
      return { submitted: true };
    }
    return {
      found: true,
      detections: sr.total_detected_avs || 0,
      totalEngines: sr.total_avs || 0,
      permalink: `https://metadefender.com/results/hash/${hash}`,
    };
  } catch (e) { log(`MD lookup error: ${e.message}`); return { error: 'fetch_failed' }; }
}

async function mdSubmit(buffer, filename, key, log) {
  if (!key) return { error: 'not_configured' };
  try {
    const up = await fetch('https://api.metadefender.com/v4/file', {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/octet-stream', filename },
      body: buffer,
    });
    if (!up.ok) { log(`MD submit ${up.status}`); return { error: 'submit_failed' }; }
    log('MD: installer submitted for analysis');
    return { submitted: true };
  } catch (e) { log(`MD submit error: ${e.message}`); return { error: 'submit_failed' }; }
}

export default async ({ req, res, log }) => {
  const query = parseQuery(req.queryString || (req.url || '').split('?').slice(1).join('?') || '');
  const defaultHash = (process.env.DEFAULT_HASH || '').trim().toLowerCase();
  const hash = (query.hash || defaultHash || '').trim().toLowerCase();
  if (!SHA256_RE.test(hash)) return res.json({ error: 'invalid_or_missing_hash' }, 400);

  const VT_KEY = process.env.VIRUSTOTAL_API_KEY;
  const MD_KEY = process.env.METADEFENDER_API_KEY;
  const PAT = process.env.GITHUB_PAT;
  const owner = process.env.REPO_OWNER || 'JirkaachS';
  const repo = process.env.REPO_NAME || 'raidar-app';

  log(`Scanning hash ${hash}`);

  let [virustotal, metadefender] = await Promise.all([
    vtLookup(hash, VT_KEY, log),
    mdLookup(hash, MD_KEY, log),
  ]);

  // Auto-submit the installer if a provider has no report yet. Only do this for the
  // known release hash, and only if we can pull the file from GitHub.
  const needVt = virustotal.found === false && VT_KEY;
  const needMd = metadefender.found === false && MD_KEY;
  const allowSubmit = hash === defaultHash && PAT;

  if ((needVt || needMd) && allowSubmit) {
    try {
      const { buffer, filename } = await getInstaller(PAT, owner, repo, log);
      const submits = await Promise.all([
        needVt ? vtSubmit(buffer, filename, VT_KEY, log) : Promise.resolve(null),
        needMd ? mdSubmit(buffer, filename, MD_KEY, log) : Promise.resolve(null),
      ]);
      if (submits[0]) virustotal = submits[0];
      if (submits[1]) metadefender = submits[1];
    } catch (e) {
      log(`Auto-submit skipped: ${e.message}`);
    }
  }

  return res.json({ hash, virustotal, metadefender });
};
