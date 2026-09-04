/**
 * Single source of truth for the desktop download.
 *
 * The GitHub releases URL is deliberately NOT used as the public download link:
 * the account holding the repo is shadow-flagged, so a visitor (or a credit-
 * program reviewer) following it may hit a 404 or a sign-in wall. Raidar already
 * runs an auth-backed updater proxy in front of releases — that proxy is the
 * only download route the site should advertise.
 */

/** Public domain of the tauri-updater Appwrite function. */
export const UPDATER_BASE = 'https://tauri-updater.appwrite.network';

/**
 * Landing/CTA download target. Hits the updater's own entry point, which
 * resolves the newest signed installer server-side.
 */
export const DOWNLOAD_URL = `${UPDATER_BASE}/?action=download&channel=latest`;

/** Build a proxied download URL for a specific release asset. */
export function assetDownloadUrl(assetId: string | number): string {
  return `${UPDATER_BASE}/?action=download&asset_id=${assetId}`;
}
