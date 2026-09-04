import { useState } from 'react';
import { Map, Cpu, Calculator, Store } from 'lucide-react';
import { SHOTS } from '../lib/shots';

/**
 * Hero product showcase, built from real captures of the shipping desktop
 * client. Replaces the previous `AppWindow` — a 68 kB hand-built DOM
 * recreation with setInterval tickers and an infinitely rotating
 * conic-gradient radar sweep, rendering fabricated data.
 *
 * Layout: one large full-bleed screen (the product proof, given real estate
 * because a thumbnail proves nothing) plus a row of detail crops beneath it
 * that zoom into individual panels of that same screen. The crops are real
 * pixels from the same capture, framed on one feature — that is how four
 * source files yield ten honest images without inventing any UI.
 */

interface Detail {
  slug: string;
  label: string;
}

interface Screen {
  slug: string;
  tab: string;
  Icon: typeof Map;
  caption: string;
  details: Detail[];
}

const SCREENS: Screen[] = [
  {
    slug: 'map',
    tab: 'Live map',
    Icon: Map,
    caption:
      'Team positions, monument markers, world events and grid references, synced live from the Rust+ companion API.',
    details: [
      { slug: 'detail-compound', label: 'Compound status — upkeep, resources, smart circuits' },
      { slug: 'detail-events', label: 'World event alerts with countdown timers' },
    ],
  },
  {
    slug: 'devices',
    tab: 'Smart devices',
    Icon: Cpu,
    caption:
      'Paired switches, alarms and tool cupboards across every linked server, with upkeep timers and remote toggles.',
    details: [
      { slug: 'detail-devices', label: 'Device grid — entity IDs, grid refs, live state' },
    ],
  },
  {
    slug: 'raidcost',
    tab: 'Raid calculator',
    Icon: Calculator,
    caption:
      'Explosive cost breakdowns per structure — sulfur, gunpowder and breach time compared across every method.',
    details: [
      { slug: 'detail-raidcost', label: 'Cheapest combination and resource totals' },
      { slug: 'detail-raidtable', label: 'Method comparison — count, cost, breach time, tier' },
    ],
  },
  {
    slug: 'vending',
    tab: 'Market intel',
    Icon: Store,
    caption:
      'Vending machine scanning across the map to surface stock, pricing and arbitrage opportunities.',
    details: [
      { slug: 'detail-market', label: 'Listings — price, stock, shop, grid and distance' },
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

      <figure className="showcase-figure">
        <div
          className="showcase-frame"
          role="tabpanel"
          id={`shot-panel-${current.slug}`}
          aria-labelledby={`shot-tab-${current.slug}`}
        >
          {SCREENS.map((s, i) => {
            const m = SHOTS[s.slug];
            return (
              <img
                key={s.slug}
                className={`showcase-img ${i === active ? 'active' : ''}`}
                src={largestSrc(s.slug)}
                srcSet={srcSetFor(s.slug)}
                sizes="(max-width: 1100px) 100vw, 1560px"
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
        <figcaption className="showcase-caption">{current.caption}</figcaption>
      </figure>

      {/* Detail crops for the selected screen */}
      <ul className="showcase-details">
        {current.details.map((d) => {
          const m = SHOTS[d.slug];
          if (!m) return null;
          return (
            <li className="showcase-detail" key={d.slug}>
              <img
                src={largestSrc(d.slug)}
                srcSet={srcSetFor(d.slug)}
                sizes="(max-width: 760px) 100vw, 480px"
                width={m.w}
                height={m.h}
                alt={d.label}
                loading="lazy"
                decoding="async"
                style={{ backgroundImage: `url(${m.lqip})` }}
              />
              <span className="showcase-detail-label">{d.label}</span>
            </li>
          );
        })}
      </ul>

      <p className="showcase-note">
        Captured from the shipping Windows client, v1.1.0.
      </p>
    </div>
  );
}
