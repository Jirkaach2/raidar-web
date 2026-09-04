import { useState } from 'react';
import { Map, Cpu, Calculator, Store } from 'lucide-react';
import { SHOTS } from '../lib/shots';

/**
 * Hero product showcase built from real screenshots of the shipping desktop
 * client.
 *
 * Replaces the previous `AppWindow` component — a 68 kB hand-built DOM
 * recreation of the app with `setInterval` tickers and an infinitely
 * rotating conic-gradient radar sweep. That version cost hundreds of DOM
 * nodes, continuous repaints and a large slice of the JS bundle to show
 * fabricated data. WebP captures of the actual product are ~27 kB, paint
 * once, and are honest about what the software does.
 */

interface Screen {
  slug: string;
  tab: string;
  Icon: typeof Map;
  caption: string;
}

const SCREENS: Screen[] = [
  {
    slug: 'map',
    tab: 'Live Map',
    Icon: Map,
    caption:
      'Team positions, monument markers, world events and grid references, synced from the Rust+ companion API.',
  },
  {
    slug: 'devices',
    tab: 'Smart Devices',
    Icon: Cpu,
    caption:
      'Paired smart switches, alarms and tool cupboards across every linked server, with upkeep timers and remote toggles.',
  },
  {
    slug: 'raidcost',
    tab: 'Raid Calculator',
    Icon: Calculator,
    caption:
      'Explosive cost breakdowns per structure — sulfur, gunpowder and breach time compared across every method.',
  },
  {
    slug: 'vending',
    tab: 'Market Intel',
    Icon: Store,
    caption:
      'Vending machine scanning across the map to surface stock, pricing and arbitrage opportunities.',
  },
];

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
              src={`/shots/${s.slug}-1440.webp`}
              srcSet={`/shots/${s.slug}-960.webp 960w, /shots/${s.slug}-1440.webp 1440w`}
              sizes="(max-width: 1140px) 100vw, 1080px"
              width={m.w}
              height={m.h}
              alt={`Raidar desktop client — ${s.tab}`}
              /* The first screen is the LCP element, so it loads eagerly and
                 at high priority; the rest wait until their tab is chosen. */
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

      <p className="showcase-note">
        Screenshots from the shipping Windows client, v1.1.0.
      </p>
    </div>
  );
}
