/**
 * Shipped release history.
 *
 * Sourced from the repository's actual release commits (each one bumped the
 * published version and the signed installer's SHA-256). Only versions that
 * were genuinely published are listed — this page exists to be verifiable,
 * so nothing here is invented.
 */

export interface Release {
  version: string;
  /** ISO date, or null when the exact publish date isn't recorded. */
  date: string | null;
  kind: 'feature' | 'fix' | 'security' | 'release';
  notes: string[];
}

export const RELEASES: Release[] = [
  {
    version: '1.3.1',
    date: null,
    kind: 'fix',
    notes: ['Installer re-signed and SHA-256 republished on the status page.'],
  },
  {
    version: '1.3.0',
    date: null,
    kind: 'feature',
    notes: [
      'Smart Switch automation: conditional triggers on nightfall, low upkeep and raid alarms.',
      'Device control panel groups paired entities per linked server.',
    ],
  },
  {
    version: '1.2.1',
    date: null,
    kind: 'fix',
    notes: ['Stability fixes in the Rust+ WebSocket reconnect path.'],
  },
  {
    version: '1.2.0',
    date: null,
    kind: 'feature',
    notes: [
      'Market intel: vending machine scanning with stock and price surfacing.',
      'New application icon and installer branding.',
    ],
  },
  {
    version: '1.1.9',
    date: null,
    kind: 'release',
    notes: ['Discord bot health checks moved to a dedicated always-on host.'],
  },
  {
    version: '1.1.5',
    date: null,
    kind: 'security',
    notes: [
      'Security scanning wired into the public status page.',
      'Installer hash verified before auto-submission to multi-engine scanners.',
    ],
  },
  {
    version: '1.1.0',
    date: null,
    kind: 'feature',
    notes: [
      'Raid cost calculator with per-structure explosive comparison.',
      'Loadout lab and recycler tooling.',
    ],
  },
  {
    version: '1.0.2',
    date: null,
    kind: 'fix',
    notes: ['Downloads routed through the authenticated updater proxy.'],
  },
  {
    version: '1.0.0',
    date: null,
    kind: 'release',
    notes: ['First public release: live tactical map, base alarms, Discord bot.'],
  },
];

/** Total published builds, including patch releases not itemized above. */
export const TOTAL_BUILDS = 21;
