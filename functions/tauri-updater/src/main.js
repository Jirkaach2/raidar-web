export default async ({ req, res, log, error }) => {
  const GITHUB_PAT = process.env.GITHUB_PAT;
  const REPO_OWNER = process.env.REPO_OWNER || 'JirkaachS';
  const REPO_NAME = process.env.REPO_NAME || 'raidar-app';

  if (!GITHUB_PAT) {
    error('GITHUB_PAT environment variable is not set.');
    return res.json({ error: 'GitHub PAT configuration missing on server.' }, 500);
  }

  // Parse query parameters
  const rawQuery = req.queryString || (req.url || '').split('?').slice(1).join('?') || '';
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
  const query = parseQuery(rawQuery);
  const action = query.action;

  // Determine current host and scheme to construct URLs
  const proto = 'https';
  const host = req.headers['host'];
  const path = (req.path || '/').split('?')[0];
  const selfBase = `${proto}://${host}`;

  try {
    // ── ACTION: Download asset ──
    if (action === 'download') {
      const assetId = query.asset_id;
      if (!assetId) {
        return res.json({ error: 'Missing asset_id parameter.' }, 400);
      }

      log(`Proxying download for asset ID: ${assetId}`);

      const downloadRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${assetId}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/octet-stream',
            'User-Agent': 'Appwrite-Function-Updater'
          },
          redirect: 'manual' // Get the redirect URL without following it
        }
      );

      // We expect a 302/307 redirect from GitHub pointing to the signed S3 download URL
      if (downloadRes.status === 302 || downloadRes.status === 307) {
        const s3Url = downloadRes.headers.get('location');
        log(`Redirecting to signed S3 URL: ${s3Url.split('?')[0]}`);
        return res.redirect(s3Url, 302);
      }

      // If GitHub returns 200 directly or some error
      const status = downloadRes.status;
      const text = await downloadRes.text();
      error(`GitHub download API returned status ${status}: ${text}`);
      return res.json({ error: `GitHub asset fetch failed with status ${status}` }, status);
    }

    // ── ACTION: List all releases (incl. pre-releases) for the admin panel ──
    if (action === 'releases') {
      log(`Listing all releases for ${REPO_OWNER}/${REPO_NAME}`);

      const listRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases?per_page=30`,
        {
          headers: {
            'Authorization': `token ${GITHUB_PAT}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Appwrite-Function-Updater'
          }
        }
      );

      if (!listRes.ok) {
        const status = listRes.status;
        const text = await listRes.text();
        error(`GitHub releases list returned status ${status}: ${text}`);
        return res.json({ error: `Failed to list releases from GitHub (status ${status})` }, status);
      }

      const list = await listRes.json();
      // Drop drafts (incomplete/unpublished); KEEP pre-releases so admins can grab them.
      const releases = (Array.isArray(list) ? list : [])
        .filter((r) => !r.draft)
        .map((r) => {
          const installers = (r.assets || []).filter(
            (a) => /\.(exe|msi)$/i.test(a.name) && !/\.sig$/i.test(a.name)
          );
          return {
            tag: r.tag_name,
            name: r.name || r.tag_name,
            prerelease: !!r.prerelease,
            published_at: r.published_at,
            downloads: installers.map((a) => ({
              name: a.name,
              kind: /\.msi$/i.test(a.name) ? 'msi' : 'exe',
              asset_id: a.id,
            })),
          };
        });

      return res.json({ releases });
    }

    // ── DEFAULT ACTION: Check for updates (Serve latest.json) ──
    log(`Checking latest release for ${REPO_OWNER}/${REPO_NAME}`);

    const releaseRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`,
      {
        headers: {
          'Authorization': `token ${GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Appwrite-Function-Updater'
        }
      }
    );

    if (!releaseRes.ok) {
      const status = releaseRes.status;
      const text = await releaseRes.text();
      error(`GitHub releases API returned error status ${status}: ${text}`);
      return res.json({ error: `Failed to fetch latest release from GitHub (status ${status})` }, status);
    }

    const release = await releaseRes.json();
    const assets = release.assets || [];

    // Find the latest.json asset
    const manifestAsset = assets.find(a => a.name === 'latest.json');
    if (!manifestAsset) {
      error(`Could not find latest.json in the release assets of ${release.tag_name}`);
      return res.json({ error: 'latest.json manifest not found in the latest release assets.' }, 404);
    }

    log(`Found latest.json asset (ID: ${manifestAsset.id}) in release ${release.tag_name}. Fetching content...`);

    // Fetch the contents of latest.json
    const manifestRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${manifestAsset.id}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_PAT}`,
          'Accept': 'application/octet-stream',
          'User-Agent': 'Appwrite-Function-Updater'
        }
      }
    );

    if (!manifestRes.ok) {
      const status = manifestRes.status;
      error(`Failed to fetch latest.json contents (status ${status})`);
      return res.json({ error: `Failed to fetch latest.json contents from GitHub (status ${status})` }, status);
    }

    const manifest = await manifestRes.json();
    log(`Successfully fetched manifest. Version: ${manifest.version}`);

    // Rewrite download URLs to point back to this Appwrite function
    if (manifest.platforms) {
      for (const platformKey of Object.keys(manifest.platforms)) {
        const platform = manifest.platforms[platformKey];
        if (platform && platform.url) {
          // Extract filename from original URL (e.g. /releases/download/v1.0.1/filename.msi -> filename.msi)
          const originalUrl = platform.url;
          const fileName = originalUrl.substring(originalUrl.lastIndexOf('/') + 1);
          
          // Find the corresponding binary asset in the GitHub release
          const binaryAsset = assets.find(a => a.name === fileName);
          if (binaryAsset) {
            const rewrittenUrl = `${selfBase}${path}?action=download&asset_id=${binaryAsset.id}`;
            log(`Rewriting ${platformKey} download URL: ${originalUrl} -> ${rewrittenUrl}`);
            platform.url = rewrittenUrl;
          } else {
            log(`Warning: Could not find release asset matching filename "${fileName}" for platform "${platformKey}"`);
          }
        }
      }
    }

    // Expose all user-downloadable installers (exe + msi, excluding signatures) so
    // the website can offer every installer. We pass asset_id so the client can build
    // a correct proxied URL regardless of the host this function saw.
    const installerAssets = assets.filter(
      (a) => /\.(exe|msi)$/i.test(a.name) && !/\.sig$/i.test(a.name)
    );
    manifest.downloads = installerAssets.map((a) => ({
      name: a.name,
      kind: /\.msi$/i.test(a.name) ? 'msi' : 'exe',
      asset_id: a.id,
    }));

    return res.json(manifest);
  } catch (err) {
    error(`Unexpected error in updater function: ${err.message}`);
    return res.json({ error: err.message || 'Unexpected internal server error.' }, 500);
  }
};
