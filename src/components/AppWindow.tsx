import { useState, type ReactNode } from 'react';
import {
  Users, List, Skull, ShoppingCart, Mountain, Radio, Zap as ZapIc, Sun as SunIc,
  ChevronDown, Search, Crosshair, Triangle, Hexagon, Moon, Siren, Power, ChevronRight, Send,
  ToggleRight, ToggleLeft, BellRing, Database, Trash2, Edit2,
} from 'lucide-react';
import Logo from './Logo';

type Page = 'map' | 'team' | 'vending' | 'devices' | 'tools' | 'spy' | 'settings';

// Exact NavRail icons from the desktop app.
const RAIL: Array<{ key: Page; path: ReactNode; sep?: boolean }> = [
  { key: 'map', path: <><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></> },
  { key: 'team', path: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { key: 'vending', path: <><rect x="4" y="2" width="16" height="20" rx="2" /><rect x="6" y="4" width="12" height="10" /><line x1="8" y1="18" x2="16" y2="18" /></> },
  { key: 'devices', path: <><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></>, sep: true },
  { key: 'tools', path: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z" /> },
  { key: 'spy', path: <><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></> },
  { key: 'settings', path: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
];

const OVERLAYS: Array<{ key: string; label: string; Icon: typeof Users }> = [
  { key: 'team', label: 'Team Players', Icon: Users },
  { key: 'roster', label: 'Roster Status', Icon: List },
  { key: 'death', label: 'Death Markers', Icon: Skull },
  { key: 'shops', label: 'Vending Shops', Icon: ShoppingCart },
  { key: 'caves', label: 'Caves & Wells', Icon: Mountain },
  { key: 'markers', label: 'Map Markers', Icon: Radio },
  { key: 'events', label: 'Active Events', Icon: ZapIc },
  { key: 'day', label: 'Day / Night', Icon: SunIc },
];

const MONUMENTS: Array<[string, number, number]> = [
  ['LAUNCH SITE', 28, 66], ['AIRFIELD', 58, 42], ['OUTPOST', 47, 54], ['BANDIT CAMP', 64, 72],
  ['WATER TREATMENT', 22, 46], ['MILITARY TUNNEL', 40, 30], ['HARBOR', 74, 58], ['DOME', 52, 22],
  ['JUNKYARD', 34, 80], ['POWER PLANT', 70, 32], ['TRAIN YARD', 44, 44],
];
const COORDS = Array.from({ length: 13 }, (_, i) => i);

function icon(s: string) { return `https://cdn.rusthelp.com/images/256/${s.replace(/[._]/g, '-')}.webp`; }
function hideErr(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.visibility = 'hidden'; }

const SWITCHES = [{ name: 'Base Lights', id: 31882 }, { name: 'Turret Power', id: 31904 }, { name: 'Furnace Bank', id: 32011 }];
const TC_ITEMS: Array<[string, string]> = [
  ['wood', '14.2k'], ['stones', '9.8k'], ['metal.fragments', '6.1k'], ['metal.refined', '420'],
  ['lowgradefuel', '1.1k'], ['scrap', '380'], ['cloth', '900'], ['sulfur', '2.4k'],
];

/** Interactive recreation of the Raidar desktop app — switch screens, flip toggles & switches. */
export default function AppWindow() {
  const [page, setPage] = useState<Page>('map');
  const [ov, setOv] = useState<Record<string, boolean>>({
    team: true, roster: true, death: true, shops: true, caves: true, markers: false, events: true, day: true,
  });
  const [sw, setSw] = useState<Record<string, boolean>>({ 'Base Lights': true, 'Turret Power': true, 'Furnace Bank': false });
  const [openTc, setOpenTc] = useState(false);
  const [vTab, setVTab] = useState<'search' | 'best'>('search');

  return (
    <div className="aw bracketed">
      {/* Titlebar */}
      <div className="aw-bar">
        <div className="aw-bar-left">
          <span className="aw-bar-logo"><Logo size={14} /></span>
          <span className="aw-bar-title">RAIDAR</span>
          <span className="aw-bar-ver">v1.0.0</span>
        </div>
        <div className="aw-win"><span>–</span><span>▢</span><span className="aw-win-close">✕</span></div>
      </div>

      <div className="aw-shell">
        {/* Rail */}
        <nav className="aw-rail">
          {RAIL.map((r) => (
            <span key={r.key}>
              <button className={`aw-rail-ic ${page === r.key ? 'active' : ''}`} onClick={() => setPage(r.key)} aria-label={r.key}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.path}</svg>
              </button>
              {r.sep && <span className="aw-rail-sep" />}
            </span>
          ))}
          <span className="aw-rail-grow" />
          <span className="aw-rail-conn" title="connected" />
        </nav>

        {/* Screen */}
        <div className="aw-content">
          {page === 'map' && (
            <div className="aw-map-screen">
              <div className="aw-map">
                <div className="aw-rule aw-rule-l">{COORDS.map((n) => <span key={n}>{n}</span>)}</div>
                <div className="aw-rule aw-rule-r">{COORDS.map((n) => <span key={n}>{n}</span>)}</div>
                <div className="aw-sweep" />
                {ov.markers !== undefined && MONUMENTS.map(([label, x, y]) => (
                  <div className="aw-mon" key={label} style={{ left: `${x}%`, top: `${y}%` }}>
                    <span className="aw-mon-dot" />
                    {ov.markers && <span className="aw-mon-label">{label}</span>}
                  </div>
                ))}
                {ov.team && <>
                  <span className="aw-blip aw-blip--online" style={{ left: '46%', top: '57%' }} />
                  <span className="aw-blip aw-blip--online" style={{ left: '50%', top: '60%' }} />
                  {ov.death && <span className="aw-blip aw-blip--dead" style={{ left: '38%', top: '72%' }} />}
                </>}
              </div>

              {/* Left floating panels */}
              <div className="aw-fl aw-fl-left">
                <div className="aw-glass aw-gp">
                  <div className="aw-gp-h"><svg className="aw-gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2" /></svg> LIVE MAP <ChevronDown size={11} className="aw-chev" /></div>
                  <div className="aw-gp-stat"><span>ZOOM</span><b>128%</b></div>
                  <div className="aw-gp-stat"><span>SEED</span><b>31419926</b></div>
                </div>
                {ov.roster && (
                  <div className="aw-glass aw-gp">
                    <div className="aw-gp-h"><Users size={11} className="aw-gp-ic" /> ROSTER STATUS <b className="aw-gp-count">1/1</b></div>
                    <div className="aw-roster-row"><span className="aw-on-dot" /> dana biely <span className="aw-rgrid">F12</span></div>
                  </div>
                )}
                <div className="aw-glass aw-gp">
                  <div className="aw-gp-h"><svg className="aw-gp-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg> TACTICAL OVERLAYS <ChevronDown size={11} className="aw-chev" /></div>
                  <div className="aw-ovlist">
                    {OVERLAYS.map(({ key, label, Icon }) => (
                      <div className="aw-ovrow" key={key}>
                        <span>{label}</span>
                        <button className={`aw-ovbtn ${ov[key] ? 'active' : ''}`} onClick={() => setOv((s) => ({ ...s, [key]: !s[key] }))}><Icon size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right floating panels */}
              <div className="aw-fl aw-fl-right">
                <div className="aw-mapinfo"><Crosshair size={10} /> MAP INFO</div>
                {ov.events && (
                  <div className="aw-glass aw-float">
                    <div className="aw-float-h">ACTIVE EVENTS</div>
                    <div className="aw-ev"><Triangle size={9} /> Deep Sea active</div>
                    <div className="aw-ev"><Hexagon size={9} /> OIL RIG unlocks <b>0:13</b></div>
                  </div>
                )}
                {ov.day && (
                  <div className="aw-glass aw-float aw-day">
                    <div className="aw-day-top"><SunIc size={11} /> DAYTIME <b>10:55</b></div>
                    <div className="aw-day-sub">Nightfall in 49m 44s</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {page === 'devices' && (
            <div className="aw-pad aw-devpanel">
              <h2 className="device-title">SMART DEVICES</h2>
              <p className="device-subtitle">Look at a smart device in-game, hold <b>E</b>, and click "Pair".</p>
              <div className="device-group-label">THIS SERVER</div>

              {SWITCHES.map(({ name, id }) => {
                const on = sw[name];
                return (
                  <div className={`device-card dev-switch ${on ? 'is-on-card' : ''}`} key={name}>
                    <div className="device-card-header">
                      <div className={`device-icon ${on ? 'is-active' : ''}`}>{on ? <ToggleRight /> : <ToggleLeft />}</div>
                      <div className="device-info">
                        <div className="device-name-row"><h3 className="device-name">{name}</h3><Edit2 className="dn-edit" /></div>
                        <div className="device-meta">ID: {id}</div>
                      </div>
                      <div className="device-actions">
                        <button className={`device-toggle ${on ? 'is-on' : 'is-off'}`} onClick={() => setSw((s) => ({ ...s, [name]: !s[name] }))}>{on ? 'ON' : 'OFF'}</button>
                        <button className="device-delete"><Trash2 /></button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Smart Alarm */}
              <div className="device-card dev-alarm is-on-card">
                <div className="device-card-header">
                  <div className="device-icon"><BellRing /></div>
                  <div className="device-info">
                    <div className="device-name-row"><h3 className="device-name">Main Base Alarm</h3></div>
                    <div className="device-meta">ID: 55021 · Smart Alarm</div>
                  </div>
                  <div className="device-actions"><span className="device-indicator is-quiet" /><button className="device-delete"><Trash2 /></button></div>
                </div>
              </div>

              {/* Storage Monitor — click to view contents */}
              <div className={`device-card dev-storage is-clickable ${openTc ? 'is-open' : ''}`} onClick={() => setOpenTc((o) => !o)}>
                <div className="device-card-header">
                  <div className="device-icon"><Database /></div>
                  <div className="device-info">
                    <div className="device-name-row"><h3 className="device-name">Tool Cupboard</h3></div>
                    <div className="device-meta">ID: 77104 · Storage Monitor · click to {openTc ? 'close' : 'view'}</div>
                  </div>
                  <ChevronRight className={`dev-caret ${openTc ? 'open' : ''}`} />
                </div>
                <div className="device-tc-info">
                  <div className="tc-row"><span className="tc-lbl">TC UPKEEP TIMER</span><span className="tc-good">2d 4h left</span></div>
                  <div className="tc-row"><span className="tc-lbl">TC STORAGE · 22/30 SLOTS</span><span className="tc-pct">73%</span></div>
                  <div className="device-storage-bar"><div className="storage-fill" style={{ width: '73%' }} /></div>
                </div>
                {openTc && (
                  <div className="tc-contents" onClick={(e) => e.stopPropagation()}>
                    {TC_ITEMS.map(([ic, qty]) => (
                      <div className="tc-slot" key={ic as string}>
                        <img src={icon(ic as string)} onError={hideErr} alt="" />
                        <span>{qty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="aw-auto-h"><ZapIc size={12} /> SWITCH AUTOMATIONS</div>
              <div className="aw-autorow"><span className="aw-auto-ic"><Moon size={11} /></span><div><b>Base Lights</b><small>at nightfall <ChevronRight size={8} /> turn ON</small></div><span className="aw-auto-on"><Power size={10} /></span></div>
              <div className="aw-autorow"><span className="aw-auto-ic"><Siren size={11} /></span><div><b>Raid Siren</b><small>on alarm <ChevronRight size={8} /> pulse 30s</small></div><span className="aw-auto-on"><Power size={10} /></span></div>
            </div>
          )}

          {page === 'vending' && (
            <div className="aw-pad">
              <div className="aw-vtabs">
                <button className={vTab === 'search' ? 'active' : ''} onClick={() => setVTab('search')}>MARKET SEARCH</button>
                <button className={vTab === 'best' ? 'active' : ''} onClick={() => setVTab('best')}>BEST SHOPS</button>
              </div>
              {vTab === 'search' ? <>
                <div className="aw-vsearch"><Search size={12} /> Search items to buy…</div>
                <div className="aw-vchips">{['WOOD', 'STONE', 'METAL', 'SULFUR', 'SCRAP', 'RIFLE'].map((c) => <span key={c}>{c}</span>)}</div>
                <div className="aw-vcat"><span className="aw-rgrid">T16</span> NPC Shop · 3.1km</div>
                {[['rifle.ak', '5×', 'Assault Rifle', '240'], ['explosive.timed', '2×', 'C4', '500'], ['metal.refined', '100×', 'HQM', '75']].map(([ic, q, n, p]) => (
                  <div className="aw-vrow" key={n}>
                    <span className="aw-vitem"><b>{q}</b> <img src={icon(ic)} onError={hideErr} alt="" /> {n}</span>
                    <span className="aw-vcost">{p} <img src={icon('scrap')} onError={hideErr} alt="" /></span>
                  </div>
                ))}
              </> : <>
                {[['Bandit Surplus', 'G14', '4.2k'], ['Hill Traders', 'K8', '2.8k'], ['The Vault', 'C19', '1.9k']].map(([n, g, s]) => (
                  <div className="aw-vrow" key={n}>
                    <span className="aw-vitem"><img src={icon('scrap')} onError={hideErr} alt="" /> {n} <span className="aw-rgrid">{g}</span></span>
                    <span className="aw-vcost" style={{ color: 'var(--color-success)' }}>{s}/day</span>
                  </div>
                ))}
              </>}
            </div>
          )}

          {page === 'team' && (
            <div className="aw-pad aw-team">
              <div className="aw-screen-h">TEAM · 2/3 ONLINE</div>
              {[['Viktor', 'online', 'F12', true], ['Dima', 'online', 'F12', false], ['Yuri', 'dead', 'H9', false]].map(([n, st, g, lead]) => (
                <div className="aw-troster" key={n as string}>
                  <span className={`aw-tdot ${st}`} />
                  <b>{n}{lead ? ' ★' : ''}</b>
                  <span className={`aw-rgrid ${st === 'dead' ? 'dead' : ''}`}>{st === 'dead' ? 'DEAD' : g}</span>
                </div>
              ))}
              <div className="aw-chatbox">
                <div className="aw-chatline"><span className="aw-chat-sys">System</span> Pushing launch, regroup F12</div>
                <div className="aw-chatinput"><span>Broadcast to team…</span><Send size={12} /></div>
              </div>
            </div>
          )}

          {(page === 'tools' || page === 'spy' || page === 'settings') && (
            <div className="aw-pad aw-generic">
              <div className="aw-screen-h">{page === 'tools' ? 'UTILITY TOOLS' : page === 'spy' ? 'RUST SPY' : 'SETTINGS'}</div>
              <div className="aw-gen-rows">
                {(page === 'tools' ? ['Raid Cost', 'Profit Scan', 'Recycler', 'CCTV Codes', 'Player Lookup', 'Loadout Lab']
                  : page === 'spy' ? ['Hostile · online 2h 14m', 'ZergClan · 4 online', 'Solo · offline 48m']
                    : ['Discord Integration', 'Notifications', 'RustMaps Key', 'Overlay Mode']).map((t) => (
                  <div className="aw-gen-row" key={t}>{t}<ChevronRight size={13} /></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="aw-status">
        <span className="aw-st-conn"><i /> CONNECTED</span>
        <span className="aw-st-sep">87MS</span>
        <span>SURVIVORS.GG #5</span>
        <span className="aw-st-dim">· 3X SOLO/DUO/TRIO</span>
        <span className="aw-st-grow" />
        <span className="aw-st-ic"><ShoppingCart size={10} /> 81</span>
        <span className="aw-st-day">DAY</span>
        <span className="aw-st-ic"><Users size={10} /> 1/1</span>
        <span className="aw-st-ic players">151/300</span>
        <span className="aw-st-clock">21:27:30</span>
      </div>
    </div>
  );
}
