// Raidar — security-scan function
// Fetches live malware-scan results for a file hash from VirusTotal and
// MetaDefender. API keys live only in this function's environment, so the
// browser never sees them. Called by the website Status page.
//
// Required env vars:
//   VIRUSTOTAL_API_KEY    — VirusTotal v3 API key (free tier is fine)
//   METADEFENDER_API_KEY  — OPSWAT MetaDefender Cloud API key
// Optional:
//   DEFAULT_HASH          — installer SHA-256 to use when no ?hash= is given

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

async function fetchVirusTotal(hash, apiKey, log) {
  if (!apiKey) return { error: 'not_configured' };
  try {
    const r = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    });
    if (r.status === 404) return { found: false };
    if (!r.ok) {
      log(`VirusTotal returned ${r.status}`);
      return { error: `http_${r.status}` };
    }
    const data = await r.json();
    const stats = data?.data?.attributes?.last_analysis_stats || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;
    const total = malicious + suspicious + harmless + undetected + (stats.timeout || 0);
    return {
      found: true,
      malicious,
      suspicious,
      harmless,
      undetected,
      total,
      detections: malicious + suspicious,
      permalink: `https://www.virustotal.com/gui/file/${hash}`,
    };
  } catch (e) {
    log(`VirusTotal error: ${e.message}`);
    return { error: 'fetch_failed' };
  }
}

async function fetchMetaDefender(hash, apiKey, log) {
  if (!apiKey) return { error: 'not_configured' };
  try {
    const r = await fetch(`https://api.metadefender.com/v4/hash/${hash}`, {
      headers: { apikey: apiKey, 'Accept': 'application/json' },
    });
    if (r.status === 404) return { found: false };
    if (!r.ok) {
      log(`MetaDefender returned ${r.status}`);
      return { error: `http_${r.status}` };
    }
    const data = await r.json();
    const sr = data?.scan_results || {};
    // total_avs / total_detected_avs are the engine counts.
    const totalEngines = sr.total_avs || 0;
    const detections = sr.total_detected_avs || 0;
    return {
      found: true,
      detections,
      totalEngines,
      result: sr.scan_all_result_a || 'Unknown',
      permalink: `https://metadefender.com/results/file/hash/${hash}/regular`,
    };
  } catch (e) {
    log(`MetaDefender error: ${e.message}`);
    return { error: 'fetch_failed' };
  }
}

export default async ({ req, res, log }) => {
  const rawQuery = req.queryString || (req.url || '').split('?').slice(1).join('?') || '';
  const query = parseQuery(rawQuery);

  let hash = (query.hash || process.env.DEFAULT_HASH || '').trim().toLowerCase();
  if (!SHA256_RE.test(hash)) {
    return res.json({ error: 'invalid_or_missing_hash' }, 400);
  }

  log(`Scanning hash ${hash}`);

  const [virustotal, metadefender] = await Promise.all([
    fetchVirusTotal(hash, process.env.VIRUSTOTAL_API_KEY, log),
    fetchMetaDefender(hash, process.env.METADEFENDER_API_KEY, log),
  ]);

  return res.json({ hash, virustotal, metadefender });
};
