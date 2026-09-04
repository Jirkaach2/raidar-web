import { useState } from 'react';
import { Map, Calculator, Crosshair, Recycle } from 'lucide-react';
import { SHOTS } from '../lib/shots';

/**
 * Product showcase — four live captures of the shipping v1.1.0 desktop client
 * while connected to a real server (Survivors.gg 2x Solo/Duo, ~170/200 players
 * online), so the map, player counts, server name and calculator output are all
 * genuine game state.
 *
 * The zoomed panel crops that used to sit under the screenshot are gone. Eleven
 * images meant the hero read as a mosaic of unreadable fragments; a visitor
 * cannot parse a 240px-wide slice of a data table. One screen at a time, shown
 * large inside a titlebar frame that says "this is a desktop app", plus a short
 * bullet list of what is actually on that screen — the list does the job the
 * crops were trying to do, in text you can read.
 */

interface Screen {
  slug: string;
  tab: string;
  Icon: typeof Map;
  /** Window title shown in the frame's titlebar. */
  window: string;
  caption: string;
  /** Points to what is visible in THIS capture. Replaces the crop strip. */
  points: string[];
}

const SCREENS: Screen[] = [
  {
    slug: 'map',
    tab: 'Live map',
    Icon: Map,
    window: 'Raidar — Live map · SURVIVORS.GG 2x',
    caption:
      'The full procedural map with terrain, roads, rail and every monument, plus live teammate positions and world events streamed from the Rust+ API.',
    points: [
      'Generated terrain, biomes and monument markers',
      'Team roster with live grid references',
      'Per-layer overlays: caves, vendors, events',
    ],
  },
  {
    slug: 'raidcost',
    tab: 'Raid calculator',
    Icon: Calculator,
    window: 'Raidar — Raid calculator',
    caption:
      'Pick a structure, set its remaining HP, and get every breach method ranked by sulfur cost — with craft time, fuse time and workbench tier.',
    points: [
      'Cheapest verified method with full resource list',
      'All breach methods ranked cheapest first',
      'Structure picker using real in-game HP values',
    ],
  },
  {
    slug: 'loadout',
    tab: 'Loadout lab',
    Icon: Crosshair,
    window: 'Raidar — Loadout lab',
    caption:
      'Damage modelling per body part and range: shots to kill, time to kill, and armour protection across every gear preset.',
    points: [
      'Per-body-part damage and shots-to-kill',
      'Time-to-kill across engagement ranges',
      'Armour protection per gear preset',
    ],
  },
  {
    slug: 'recycler',
    tab: 'Recycler',
    Icon: Recycle,
    window: 'Raidar — Recycler yields',
    caption:
      'Component yields with the server gather multiplier detected automatically from the server name, split by monument and safe-zone recycler rates.',
    points: [
      'Server multiplier detected from the server name',
      'Monument and safe-zone recycler rates',
      'Full component breakdown per input stack',
    ],
  },
];

/** Build a srcSet from the widths actually emitted for this slug. */
function srcSetFor(slug: string): string {
  const meta = SHOTS[slug];
  if (!meta) return '';
  return meta.widths.map((w) => `/shots/${slug}-${w}.webp ${w}w`).join(', ');
}

function largestSrc(slug: string): string {
  const meta = SHOTS[slug];
  const w = meta ? Math.max(...meta.widths) : 960;
  return `/shots/${slug}-${w}.webp`;
}

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const current = SCREENS[active];

  return (
    <div className="showcase">
      <div className="showcase-tabs" role="tablist" aria-label="Product screens">
        {SCREENS.map((s, i) => (
          <button
            key={s.slug}
            role="tab"
            id={`shot-tab-${s.slug}`}
            aria-selected={i === active}
            aria-controls={`shot-panel-${s.slug}`}
            className={`showcase-tab ${i === active ? 'active' : ''}`}
            onClick={() => setActive(i)}
          >
            <s.Icon size={15} aria-hidden />
            <span>{s.tab}</span>
          </button>
        ))}
      </div>

      {/* No synthetic titlebar. The captures already contain the client's own
          window chrome — its wordmark, account chip and minimise/maximise/close
          — so adding a second set of traffic lights above them read as a
          mistake rather than a device. The frame is just a hard edge. */}
      <figure className="showcase-figure">
        <div
          className="showcase-frame"
          role="tabpanel"
          id={`shot-panel-${current.slug}`}
          aria-labelledby={`shot-tab-${current.slug}`}
          /* Ratio comes from the ACTIVE capture, not a hardcoded 16/9. The map
             is 1.68:1 and the tool screens are 1.40:1, so a fixed frame would
             letterbox one or the other. Setting it per-screen also keeps the
             box reserved, so switching tabs causes no layout shift. */
          style={{ aspectRatio: `${SHOTS[current.slug].w} / ${SHOTS[current.slug].h}` }}
        >
          {SCREENS.map((s, i) => {
            const m = SHOTS[s.slug];
            if (!m) return null;
            return (
              <img
                key={s.slug}
                className={`showcase-img ${i === active ? 'active' : ''}`}
                src={largestSrc(s.slug)}
                srcSet={srcSetFor(s.slug)}
                /* Full container width on desktop, so the client's own 11px UI
                   labels land near 1:1 instead of being downscaled to mush. */
                sizes="(max-width: 1280px) 100vw, 1240px"
                width={m.w}
                height={m.h}
                alt={`Raidar desktop client — ${s.tab}`}
                /* First screen is the LCP element: eager and high priority.
                   The rest wait until their tab is selected. */
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                decoding="async"
                style={{ backgroundImage: `url(${m.lqip})` }}
              />
            );
          })}
        </div>

        <figcaption className="showcase-caption">
          <p>{current.caption}</p>
          <ul className="showcase-points">
            {current.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <span className="showcase-note mono">
            Live capture · Windows client v1.1.0 · {current.window}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
