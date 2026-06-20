import {
  Map as MapIcon, Users, Layers, Sparkles, Wrench, Eye, Settings,
  ChevronDown, Crosshair, Sun, Triangle, Hexagon, Heart, ShoppingCart,
} from 'lucide-react';
import Logo from './Logo';

const RAIL = [MapIcon, Users, Layers, Sparkles, Wrench, Eye];

const OVERLAYS: Array<[string, boolean]> = [
  ['Team Players', true],
  ['Roster Status', true],
  ['Death Markers', true],
  ['Vending Shops', true],
  ['Caves & Wells', true],
  ['Map Markers', false],
  ['Active Events', true],
  ['Day / Night', true],
];

// Monument blips scattered across the faux map (label, x%, y%).
const MONUMENTS: Array<[string, number, number]> = [
  ['LAUNCH SITE', 30, 64],
  ['AIRFIELD', 58, 40],
  ['OUTPOST', 47, 52],
  ['BANDIT CAMP', 62, 70],
  ['WATER TREATMENT', 24, 44],
  ['MILITARY TUNNEL', 40, 30],
  ['HARBOR', 72, 56],
  ['DOME', 52, 22],
  ['JUNKYARD', 35, 78],
  ['POWER PLANT', 68, 30],
];

const COORDS = Array.from({ length: 13 }, (_, i) => i);

/**
 * Faithful recreation of the Raidar desktop app's LIVE MAP screen — used as the
 * hero centerpiece. Mirrors the icon rail, map controls + tactical overlay
 * toggles, the coordinate-ruled grid map with monument blips, the floating
 * map-info panels and the dense bottom status bar.
 */
export default function AppWindow() {
  return (
    <div className="aw bracketed">
      {/* Titlebar */}
      <div className="aw-bar">
        <div className="aw-bar-left">
          <span className="aw-bar-logo"><Logo size={14} /></span>
          <span className="aw-bar-title">RAIDAR</span>
          <span className="aw-bar-ver">v1.0.0</span>
        </div>
        <div className="aw-win">
          <span className="aw-win-btn">–</span>
          <span className="aw-win-btn">▢</span>
          <span className="aw-win-btn aw-win-close">✕</span>
        </div>
      </div>

      <div className="aw-shell">
        {/* Icon rail */}
        <div className="aw-rail">
          {RAIL.map((Icon, i) => (
            <span key={i} className={`aw-rail-ic ${i === 0 ? 'active' : ''}`}><Icon size={16} /></span>
          ))}
          <span className="aw-rail-ic aw-rail-gear"><Settings size={16} /></span>
        </div>

        {/* Left control panel */}
        <div className="aw-panel">
          <div className="aw-panel-h"><MapIcon size={12} /> LIVE MAP <ChevronDown size={12} className="aw-chev" /></div>
          <div className="aw-stat"><span>ZOOM</span><b>128%</b></div>
          <div className="aw-stat"><span>SEED</span><b>31419926</b></div>

          <div className="aw-sub">
            <span><Users size={11} /> ROSTER STATUS</span><b className="aw-roster">0/1</b>
          </div>
          <div className="aw-roster-row"><i className="aw-on-dot" /> dana biely <span className="aw-off">OFF</span></div>

          <div className="aw-panel-h aw-panel-h--mt"><Layers size={12} /> TACTICAL OVERLAYS <ChevronDown size={12} className="aw-chev" /></div>
          <div className="aw-overlays">
            {OVERLAYS.map(([label, on]) => (
              <div className="aw-ov" key={label}>
                <span>{label}</span>
                <span className={`aw-tg ${on ? 'on' : 'off'}`}><i /></span>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="aw-map">
          <div className="aw-rule aw-rule-l">{COORDS.map((n) => <span key={n}>{n}</span>)}</div>
          <div className="aw-rule aw-rule-r">{COORDS.map((n) => <span key={n}>{n}</span>)}</div>
          <div className="aw-sweep" />

          {MONUMENTS.map(([label, x, y]) => (
            <div className="aw-mon" key={label} style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="aw-mon-dot" />
              <span className="aw-mon-label">{label}</span>
            </div>
          ))}

          {/* team blips */}
          <span className="aw-blip aw-blip--online" style={{ left: '46%', top: '57%' }} />
          <span className="aw-blip aw-blip--online" style={{ left: '49%', top: '60%' }} />

          {/* Floating info panels */}
          <div className="aw-mapinfo"><Crosshair size={11} /> MAP INFO</div>
          <div className="aw-float aw-events">
            <div className="aw-float-h">ACTIVE EVENTS</div>
            <div className="aw-ev"><Triangle size={10} /> Deep Sea active</div>
            <div className="aw-ev"><Hexagon size={10} /> OIL RIG unlocks <b>0:13</b></div>
          </div>
          <div className="aw-float aw-day">
            <div className="aw-day-top"><Sun size={12} /> DAYTIME <b>10:55 AM</b></div>
            <div className="aw-day-sub">Nightfall in 49m 44s</div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="aw-status">
        <span className="aw-st-conn"><i /> CONNECTED</span>
        <span className="aw-st-sep">87MS</span>
        <span>SURVIVORS.GG #5</span>
        <span className="aw-st-dim">· 3X SOLO/DUO/TRIO</span>
        <span className="aw-st-grow" />
        <span className="aw-st-ic"><ShoppingCart size={10} /> 81</span>
        <span className="aw-st-day">DAY</span>
        <span className="aw-st-ic"><Users size={10} /> 0/1</span>
        <span className="aw-st-ic players"><Heart size={10} /> 151/300</span>
        <span className="aw-st-clock">21:27:30</span>
      </div>
    </div>
  );
}
