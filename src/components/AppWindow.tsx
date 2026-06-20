import { useState, type ReactNode } from 'react';
import {
  Users, ShoppingCart, ChevronRight, ChevronDown, ChevronUp, Search, Send, Crown,
  ToggleRight, ToggleLeft, BellRing, Database, Trash2, Edit2, Zap as ZapIc, Moon, Siren, Power,
  Home, Clock, Lock, Flame, RefreshCw, DollarSign, Calculator, Compass, Video, Activity, Shield,
  ArrowUpDown, MapPin, Info, ExternalLink,
} from 'lucide-react';
import Logo from './Logo';

type Page = 'team' | 'vending' | 'devices' | 'tools' | 'spy' | 'settings';

const RAIL: Array<{ key: Page; path: ReactNode; sep?: boolean }> = [
  { key: 'team', path: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { key: 'vending', path: <><rect x="4" y="2" width="16" height="20" rx="2" /><rect x="6" y="4" width="12" height="10" /><line x1="8" y1="18" x2="16" y2="18" /></> },
  { key: 'devices', path: <><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></>, sep: true },
  { key: 'tools', path: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z" /> },
  { key: 'spy', path: <><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></> },
  { key: 'settings', path: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
];
const RAIL_LABELS: Record<Page, string> = { team: 'Team', vending: 'Market', devices: 'Smart Devices', tools: 'Tools', spy: 'Rust Spy', settings: 'Settings' };

function icon(s: string) { return `https://cdn.rusthelp.com/images/256/${s.replace(/[._]/g, '-')}.webp`; }
function hideErr(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.visibility = 'hidden'; }
function Av({ name, color }: { name: string; color: string }) {
  return <span className="aw-av" style={{ background: color }}>{name[0]}</span>;
}

const SWITCHES = [{ name: 'Base Lights', id: 31882 }, { name: 'Turret Power', id: 31904 }, { name: 'Furnace Bank', id: 32011 }];
const TC_ITEMS: Array<[string, string]> = [
  ['wood', '14.2k'], ['stones', '9.8k'], ['metal.fragments', '6.1k'], ['metal.refined', '420'],
  ['lowgradefuel', '1.1k'], ['scrap', '380'], ['cloth', '900'], ['sulfur', '2.4k'],
];

const TEAM = [
  { name: 'Viktor', status: 'online', grid: 'F12', health: 100, leader: true, color: '#ce422b', kd: 2.41, hs: 18.4, acc: 31.2, kills: 412, deaths: 171, hours: 3240 },
  { name: 'Dima', status: 'online', grid: 'F12', health: 64, leader: false, color: '#3a9fc4', kd: 1.88, hs: 14.1, acc: 27.6, kills: 288, deaths: 153, hours: 1870 },
  { name: 'Sasha', status: 'online', grid: 'G11', health: 38, leader: false, color: '#6fcf73', kd: 1.12, hs: 9.8, acc: 22.3, kills: 140, deaths: 125, hours: 920 },
  { name: 'Yuri', status: 'dead', grid: 'DEAD', health: 0, leader: false, color: '#e8a838', kd: 0.94, hs: 7.2, acc: 19.0, kills: 88, deaths: 94, hours: 540 },
  { name: 'Pavel', status: 'offline', grid: 'OFFLINE', health: 0, leader: false, color: '#8a8177', kd: 1.5, hs: 11, acc: 24, kills: 200, deaths: 133, hours: 1100 },
];

const VEND = [
  { name: 'Bandit Camp', grid: 'K14', dist: '1.2km', npc: true, orders: [
    { qty: 1, item: 'Assault Rifle', icon: 'rifle.ak', cost: 240, cur: 'Scrap', curIcon: 'scrap', stock: 4 },
    { qty: 100, item: 'Scrap', icon: 'scrap', cost: 1, cur: 'High Quality Metal', curIcon: 'metal.refined', stock: 60 },
  ] },
  { name: 'Big Boom Shop', grid: 'G7', dist: '640m', npc: false, orders: [
    { qty: 1, item: 'C4', icon: 'explosive.timed', cost: 500, cur: 'Scrap', curIcon: 'scrap', stock: 6 },
    { qty: 4, item: 'Satchel Charge', icon: 'explosive.satchel', cost: 120, cur: 'Scrap', curIcon: 'scrap', stock: 0 },
  ] },
  { name: 'Hill Traders', grid: 'C19', dist: '3.4km', npc: false, orders: [
    { qty: 100, item: 'High Quality Metal', icon: 'metal.refined', cost: 75, cur: 'Scrap', curIcon: 'scrap', stock: 320 },
    { qty: 1000, item: 'Sulfur', icon: 'sulfur', cost: 90, cur: 'Scrap', curIcon: 'scrap', stock: 4000 },
  ] },
];
const BEST = [
  { name: 'Big Boom Shop', grid: 'G7', sales: '4.2k', top: 'C4 ×38' },
  { name: 'Bandit Camp', grid: 'K14', sales: '3.1k', top: 'Scrap ×1.2k' },
  { name: 'Hill Traders', grid: 'C19', sales: '1.9k', top: 'HQM ×900' },
];

const TOOL_GROUPS: Array<{ label: string; tools: Array<[string, string, typeof Home]> }> = [
  { label: 'BASE & DEFENSE', tools: [['cupboard', 'Cupboard', Home], ['decay', 'Decay', Clock]] },
  { label: 'RAIDING', tools: [['crates', 'Locked Crates', Lock], ['raidcost', 'Raid Cost', Flame], ['loadout', 'Loadout Lab', Shield], ['recycler', 'Recycler', RefreshCw]] },
  { label: 'INTEL', tools: [['pricewatch', 'Price Watch', DollarSign], ['profit', 'Profit Scan', Calculator], ['richbase', 'Rich Bases', Compass], ['cctv', 'CCTV Codes', Video], ['activity', 'Activity', Activity], ['lookup', 'Player Lookup', Search]] },
];

const SET_TABS = ['General', 'Discord', 'Notifications', 'Map & API', 'Overlay'] as const;
const SET_ROWS: Record<string, Array<{ label: string; type: 'toggle' | 'value'; on?: boolean; val?: string }>> = {
  General: [{ label: 'Launch on startup', type: 'toggle', on: true }, { label: 'Auto-connect last server', type: 'toggle', on: true }, { label: 'Minimize to tray', type: 'toggle', on: false }],
  Discord: [{ label: 'Link status', type: 'value', val: 'Linked · SURVIVORS.GG #5' }, { label: 'Per-feature channels', type: 'toggle', on: true }, { label: 'Device whitelist', type: 'value', val: '3 members' }],
  Notifications: [{ label: 'Base alarms', type: 'toggle', on: true }, { label: 'Cargo & heli', type: 'toggle', on: true }, { label: 'New shops', type: 'toggle', on: false }, { label: 'Player bans', type: 'toggle', on: true }],
  'Map & API': [{ label: 'RustMaps API key', type: 'value', val: '••••••••' }, { label: 'BattleMetrics token', type: 'value', val: '••••••••' }, { label: 'Show caves & wells', type: 'toggle', on: true }],
  Overlay: [{ label: 'Game overlay mode', type: 'toggle', on: true }, { label: 'Click-through when idle', type: 'toggle', on: false }, { label: 'Opacity', type: 'value', val: '92%' }],
};

// Deterministic pseudo activity for the spy heatmap.
function bucket(seed: number, d: number, h: number): number {
  const peak = ((seed * 7) % 6) + 18; // evening peak hour
  const dist = Math.min(Math.abs(h - peak), Math.abs(h - peak + 24));
  let v = Math.max(0, 1 - dist / 5);
  if (h < 7) v *= 0.15;
  v *= 0.6 + ((seed * (d + 3) * (h + 1)) % 40) / 100;
  return Math.min(1, v);
}
function heat(v: number) {
  if (v <= 0.04) return 'rgba(255,255,255,0.04)';
  const g = Math.round(60 + v * 180);
  return `rgba(40, ${g}, 60, ${0.35 + v * 0.6})`;
}
const SPY = [
  { name: 'BridgeKing', online: true, group: 'Bridge Clan', gc: '#ce422b', raid: '8PM–2AM', seed: 3 },
  { name: 'zerg_ttv', online: false, group: 'Zerg D7', gc: '#58c6e8', raid: '6PM–12AM', seed: 7 },
  { name: 'soloRoamer', online: false, group: '', gc: '', raid: '11PM–3AM', seed: 5 },
  { name: 'Nightmare', online: true, group: 'Bridge Clan', gc: '#ce422b', raid: '9PM–1AM', seed: 9 },
];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function AppWindow() {
  const [page, setPage] = useState<Page>('devices');
  const [sw, setSw] = useState<Record<string, boolean>>({ 'Base Lights': true, 'Turret Power': true, 'Furnace Bank': false });
  const [openTc, setOpenTc] = useState(false);
  const [teamExp, setTeamExp] = useState<string | null>('Viktor');
  const [vView, setVView] = useState<'market' | 'best'>('market');
  const [vTab, setVTab] = useState<'buy' | 'sell'>('buy');
  const [vType, setVType] = useState<'all' | 'player' | 'npc'>('all');
  const [vChip, setVChip] = useState('');
  const [tool, setTool] = useState('raidcost');
  const [spyTab, setSpyTab] = useState<'team' | 'enemies' | 'history'>('enemies');
  const [spySel, setSpySel] = useState('BridgeKing');
  const [setTab, setSetTab] = useState<string>('General');
  const [setState, setSetState] = useState<Record<string, boolean>>({});

  const spyList = spyTab === 'team' ? [] : SPY;
  const sel = SPY.find((p) => p.name === spySel) || SPY[0];

  return (
    <div className="aw bracketed">
      <div className="aw-bar">
        <div className="aw-bar-left">
          <span className="aw-bar-logo"><Logo size={14} /></span>
          <span className="aw-bar-title">RAIDAR</span>
          <span className="aw-bar-ver">v1.0.0</span>
        </div>
        <div className="aw-win"><span>–</span><span>▢</span><span className="aw-win-close">✕</span></div>
      </div>

      <div className="aw-shell">
        <nav className="aw-rail">
          {RAIL.map((r) => (
            <span key={r.key}>
              <button className={`aw-rail-ic ${page === r.key ? 'active' : ''}`} onClick={() => setPage(r.key)} aria-label={r.key} title={RAIL_LABELS[r.key]}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{r.path}</svg>
              </button>
              {r.sep && <span className="aw-rail-sep" />}
            </span>
          ))}
          <span className="aw-rail-grow" />
          <span className="aw-rail-conn" title="connected" />
        </nav>

        <div className="aw-content">
          {/* ───────── DEVICES ───────── */}
          {page === 'devices' && (
            <div className="aw-scr aw-devpanel">
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
              <div className="device-card dev-alarm is-on-card">
                <div className="device-card-header">
                  <div className="device-icon"><BellRing /></div>
                  <div className="device-info"><div className="device-name-row"><h3 className="device-name">Main Base Alarm</h3></div><div className="device-meta">ID: 55021 · Smart Alarm</div></div>
                  <div className="device-actions"><span className="device-indicator is-quiet" /><button className="device-delete"><Trash2 /></button></div>
                </div>
              </div>
              <div className={`device-card dev-storage is-clickable ${openTc ? 'is-open' : ''}`} onClick={() => setOpenTc((o) => !o)}>
                <div className="device-card-header">
                  <div className="device-icon"><Database /></div>
                  <div className="device-info"><div className="device-name-row"><h3 className="device-name">Tool Cupboard</h3></div><div className="device-meta">ID: 77104 · click to {openTc ? 'close' : 'view contents'}</div></div>
                  <ChevronRight className={`dev-caret ${openTc ? 'open' : ''}`} />
                </div>
                <div className="device-tc-info">
                  <div className="tc-row"><span className="tc-lbl">TC UPKEEP TIMER</span><span className="tc-good">2d 4h left</span></div>
                  <div className="tc-row"><span className="tc-lbl">TC STORAGE · 22/30 SLOTS</span><span className="tc-pct">73%</span></div>
                  <div className="device-storage-bar"><div className="storage-fill" style={{ width: '73%' }} /></div>
                </div>
                {openTc && <div className="tc-contents" onClick={(e) => e.stopPropagation()}>{TC_ITEMS.map(([ic, qty]) => (<div className="tc-slot" key={ic}><img src={icon(ic)} onError={hideErr} alt="" /><span>{qty}</span></div>))}</div>}
              </div>
              <div className="device-group-label foreign">RUSTORIA · OFF-SERVER</div>
              <div className="device-card dev-switch is-foreign">
                <div className="device-card-header">
                  <div className="device-icon"><ToggleLeft /></div>
                  <div className="device-info"><div className="device-name-row"><h3 className="device-name">2nd Base Heater</h3></div><div className="device-meta">ID: 9931 · Rustoria</div></div>
                  <div className="device-actions"><button className="device-toggle is-off">OFF</button></div>
                </div>
              </div>
              <div className="aw-auto-h"><ZapIc size={12} /> SWITCH AUTOMATIONS</div>
              <div className="aw-autorow"><span className="aw-auto-ic"><Moon size={11} /></span><div><b>Base Lights</b><small>at nightfall <ChevronRight size={8} /> turn ON</small></div><span className="aw-auto-on"><Power size={10} /></span></div>
              <div className="aw-autorow"><span className="aw-auto-ic"><Siren size={11} /></span><div><b>Raid Siren</b><small>on alarm <ChevronRight size={8} /> pulse 30s</small></div><span className="aw-auto-on"><Power size={10} /></span></div>
            </div>
          )}

          {/* ───────── TEAM ───────── */}
          {page === 'team' && (
            <div className="aw-scr aw-team">
              <div className="aw-panel-head"><span className="aw-ph-title">TEAM CONTROL CENTER</span><span className="aw-ph-stat"><i className="aw-on-dot" /> 3 / 5 ACTIVE</span></div>
              <div className="aw-team-grid">
                <div className="aw-team-list">
                  <div className="aw-sec-lbl">ROSTER STATUS</div>
                  {TEAM.map((m) => {
                    const exp = teamExp === m.name;
                    return (
                      <div className={`aw-member ${m.status} ${exp ? 'exp' : ''}`} key={m.name} onClick={() => setTeamExp(exp ? null : m.name)}>
                        <div className="aw-member-h">
                          <Av name={m.name} color={m.color} />
                          <span className={`aw-mdot ${m.status}`} />
                          <span className={`aw-mname ${m.leader ? 'lead' : ''}`}>{m.name}</span>
                          {m.leader && <span className="aw-lead">LEAD</span>}
                          <span className={`aw-mgrid ${m.status === 'dead' ? 'dead' : m.status === 'offline' ? 'off' : ''}`}>{m.grid}</span>
                          {exp ? <ChevronUp size={13} className="aw-mcar" /> : <ChevronDown size={13} className="aw-mcar" />}
                        </div>
                        {m.status !== 'offline' && !exp && (
                          <div className="aw-hp"><div className="aw-hp-bg"><div className="aw-hp-fill" style={{ width: `${m.health}%`, background: m.health < 40 ? '#ef4444' : m.health < 75 ? '#f59e0b' : '#6fcf73' }} /></div><span>{m.health}% HP</span></div>
                        )}
                        {exp && (
                          <div className="aw-mstats" onClick={(e) => e.stopPropagation()}>
                            <div className="aw-mstats-top"><span><Clock size={11} /> {m.hours.toLocaleString()}h</span><span className="aw-msteam">Steam Profile <ExternalLink size={9} /></span></div>
                            <div className="aw-mstats-grid">
                              <div><span className="l">K/D RATIO</span><span className="v" style={{ color: '#ce422b' }}>{m.kd.toFixed(2)}</span><span className="s">{m.kills}K/{m.deaths}D</span></div>
                              <div><span className="l">HEADSHOT</span><span className="v" style={{ color: '#10b981' }}>{m.hs}%</span><span className="s">ratio</span></div>
                              <div><span className="l">ACCURACY</span><span className="v" style={{ color: '#06b6d4' }}>{m.acc}%</span><span className="s">hit rate</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="aw-chat">
                  <div className="aw-chat-h"><span className="aw-on-dot" /> TEAM RADIO</div>
                  <div className="aw-chat-msgs">
                    <div className="aw-cmsg"><span className="aw-ct">21:14</span><b style={{ color: '#ce422b' }}>Viktor:</b> pushing launch, regroup F12</div>
                    <div className="aw-cmsg"><span className="aw-ct">21:15</span><b style={{ color: '#3a9fc4' }}>Dima:</b> need 2 more rockets</div>
                    <div className="aw-cmsg"><span className="aw-ct">21:16</span><b style={{ color: '#6fcf73' }}>Sasha:</b> heli inbound, take cover</div>
                  </div>
                  <div className="aw-chat-in"><span>Broadcast to team…</span><Send size={12} /></div>
                </div>
              </div>
            </div>
          )}

          {/* ───────── MARKET / VENDING ───────── */}
          {page === 'vending' && (
            <div className="aw-scr aw-vend">
              <div className="aw-vviews">
                <button className={vView === 'market' ? 'active' : ''} onClick={() => setVView('market')}>MARKET SEARCH</button>
                <button className={vView === 'best' ? 'active' : ''} onClick={() => setVView('best')}>BEST SHOPS</button>
              </div>
              {vView === 'market' ? <>
                <div className="aw-vsearch"><Search size={13} /><input readOnly placeholder="Search items to BUY (e.g. rifle, scrap...)" /></div>
                <div className="aw-vchips">{['Wood', 'Stone', 'Metal', 'Sulfur', 'Scrap', 'Rifle', 'Ammo'].map((c) => <button key={c} className={vChip === c ? 'active' : ''} onClick={() => setVChip(vChip === c ? '' : c)}>{c}</button>)}</div>
                <div className="aw-vtabs">
                  <button className={`buy ${vTab === 'buy' ? 'active' : ''}`} onClick={() => setVTab('buy')}><ShoppingCart size={11} /> BUY ITEMS</button>
                  <button className={`sell ${vTab === 'sell' ? 'active' : ''}`} onClick={() => setVTab('sell')}><DollarSign size={11} /> SELL ITEMS</button>
                </div>
                <div className="aw-vctrl">
                  <div className="aw-vfilter">{(['all', 'player', 'npc'] as const).map((t) => <button key={t} className={vType === t ? 'active' : ''} onClick={() => setVType(t)}>{t === 'all' ? 'All Shops' : t === 'player' ? 'Player' : 'NPC'}</button>)}</div>
                  <div className="aw-vsort"><ArrowUpDown size={11} /> Cheapest First</div>
                </div>
                <div className="aw-vlist">
                  {VEND.filter((v) => vType === 'all' || (vType === 'npc' ? v.npc : !v.npc)).map((v) => (
                    <div className={`aw-vcard ${v.npc ? 'npc' : ''}`} key={v.name}>
                      <div className="aw-vcard-h">
                        <div>
                          <h3 style={{ color: v.npc ? '#3cc04c' : 'var(--color-text)' }}>{v.name}</h3>
                          <div className="aw-vbadges"><span className="aw-vgrid">{v.grid}</span><span className="aw-vdist"><MapPin size={8} /> {v.dist}</span><span className="aw-vnpc">{v.npc ? 'NPC Shop' : 'Player Shop'}</span></div>
                        </div>
                        <Info size={14} className="aw-vinfo" />
                      </div>
                      {v.orders.map((o, i) => (
                        <div className={`aw-vorder ${o.stock === 0 ? 'oos' : ''}`} key={i}>
                          <div className="aw-vo-row">
                            <span className="aw-vo-buy"><span className="aw-vqty">{o.qty}x</span><img src={icon(o.icon)} onError={hideErr} alt="" /> {o.item}</span>
                            <ChevronRight size={12} className="aw-vo-arrow" />
                            <span className="aw-vo-cost"><span className="aw-vcost">{o.cost}x</span><img src={icon(o.curIcon)} onError={hideErr} alt="" /> {o.cur}</span>
                          </div>
                          <span className={`aw-vstock ${o.stock === 0 ? 'no' : 'in'}`}>{o.stock === 0 ? 'OUT OF STOCK' : `STOCK: ${o.stock}`}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </> : (
                <div className="aw-vlist">
                  <div className="aw-sec-lbl">TOP EARNING SHOPS · LAST 24H</div>
                  {BEST.map((b, i) => (
                    <div className="aw-best" key={b.name}>
                      <span className={`aw-best-rank r${i + 1}`}>{i + 1}</span>
                      <div className="aw-best-info"><b>{b.name}</b><small>top seller · {b.top}</small></div>
                      <span className="aw-vgrid">{b.grid}</span>
                      <span className="aw-best-sales">{b.sales}<small>scrap</small></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────── TOOLS ───────── */}
          {page === 'tools' && (
            <div className="aw-scr aw-tools">
              <div className="aw-tools-side">
                <div className="aw-tools-sh">UTILITY TOOLS</div>
                {TOOL_GROUPS.map((g) => (
                  <div key={g.label} className="aw-tools-grp">
                    <span className="aw-tools-gl">{g.label}</span>
                    {g.tools.map(([id, name, Ic]) => (
                      <button key={id} className={`aw-tool-btn ${tool === id ? 'active' : ''}`} onClick={() => setTool(id)}><Ic size={13} /> {name}</button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="aw-tools-main">
                {tool === 'raidcost' ? <>
                  <div className="aw-rc-h"><Flame size={14} /> RAID COST CALCULATOR</div>
                  <div className="aw-rc-target"><img src={icon('wall.external.high.stone')} onError={hideErr} alt="" /><div><span className="l">STONE WALL</span><span className="hp">500 / 500 HP</span></div></div>
                  <div className="aw-rc-best">
                    <div className="aw-rc-best-h"><span><Crown size={12} /> RECOMMENDED</span><span className="aw-rc-wb">WB2</span></div>
                    <div className="aw-rc-cost"><img src={icon('sulfur')} onError={hideErr} alt="" /><b>4,620</b><span>sulfur total</span></div>
                    <div className="aw-rc-parts"><span className="aw-rc-chip"><img src={icon('explosive.timed')} onError={hideErr} alt="" /> 8× C4</span></div>
                  </div>
                  <div className="aw-rc-methods">
                    {[['C4', 100, 'explosive.timed', '4,620'], ['Rockets', 64, 'ammo.rocket.basic', '5,180'], ['Satchels', 38, 'explosive.satchel', '7,400']].map(([n, bar, ic, s], i) => (
                      <div className={`aw-rc-m ${i === 0 ? 'best' : ''}`} key={n as string}>
                        <span className="aw-rc-rank">{i + 1}</span>
                        <img src={icon(ic as string)} onError={hideErr} alt="" />
                        <div className="aw-rc-mid"><span className="n">{n}</span><div className="aw-rc-bar"><span style={{ width: `${bar}%` }} /></div></div>
                        <span className="aw-rc-s"><img src={icon('sulfur')} onError={hideErr} alt="" />{s}</span>
                      </div>
                    ))}
                  </div>
                </> : (
                  <div className="aw-tool-generic">
                    <div className="aw-tg-ico">{(() => { const all = TOOL_GROUPS.flatMap((g) => g.tools); const f = all.find((t) => t[0] === tool); const Ic = (f?.[2] || Home) as typeof Home; return <Ic size={26} />; })()}</div>
                    <h3>{TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t[0] === tool)?.[1]}</h3>
                    <p>Live data loads here once you're connected to a server.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────── SPY ───────── */}
          {page === 'spy' && (
            <div className="aw-scr aw-spy">
              <div className="aw-spy-head">
                <div><h1>RUST SPY</h1><p>Read their schedule · Predict · Plan · Raid</p></div>
                <div className="aw-spy-stats"><div><span className="n">{spyList.length}</span><span className="l">TRACKED</span></div><div><span className="n">{spyList.filter((p) => p.online).length}</span><span className="l">ONLINE</span></div></div>
              </div>
              <div className="aw-spy-tabs">
                <button className={spyTab === 'team' ? 'active' : ''} onClick={() => setSpyTab('team')}>Team (Live)</button>
                <button className={spyTab === 'enemies' ? 'active' : ''} onClick={() => setSpyTab('enemies')}>Enemies (BattleMetrics)</button>
                <button className={spyTab === 'history' ? 'active' : ''} onClick={() => setSpyTab('history')}>Server History</button>
              </div>
              {spyTab === 'team' ? (
                <div className="aw-spy-empty"><p>No team activity tracked yet.</p><span>Connect & join a team — Raidar records each teammate's online windows to reveal their schedule.</span></div>
              ) : (
                <div className="aw-spy-body">
                  <div className="aw-spy-players">
                    {SPY.map((p) => (
                      <button key={p.name} className={`aw-spy-p ${sel.name === p.name ? 'active' : ''}`} onClick={() => setSpySel(p.name)}>
                        <span className={`aw-spy-dot ${p.online ? 'on' : 'off'}`} />
                        <span className="aw-spy-pn">{p.name}</span>
                        {p.group && <span className="aw-spy-pg" style={{ color: p.gc, background: `${p.gc}22`, borderColor: `${p.gc}66` }}>{p.group}</span>}
                        <span className="aw-spy-praid">{p.raid}</span>
                      </button>
                    ))}
                  </div>
                  <div className="aw-spy-detail">
                    <div className="aw-spy-dh">
                      <div><h2>{sel.name}</h2><span className="aw-spy-meta"><span className={`aw-spy-dot ${sel.online ? 'on' : 'off'}`} />{sel.online ? 'Online now' : 'Last seen 2h ago'}</span></div>
                      <div className="aw-spy-raidbadge"><span className="l">LIKELY RAID WINDOW</span><span className="t">{sel.raid}</span></div>
                    </div>
                    <div className="aw-sec-lbl">WEEKLY PATTERN</div>
                    <div className="aw-heat">
                      {DAYS.map((day, d) => (
                        <div className="aw-heat-row" key={day}>
                          <span className="aw-heat-day">{day}</span>
                          <div className="aw-heat-cells">{Array.from({ length: 24 }, (_, h) => <div key={h} className="aw-heat-c" style={{ background: heat(bucket(sel.seed, d, h)) }} />)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────── SETTINGS ───────── */}
          {page === 'settings' && (
            <div className="aw-scr aw-set">
              <div className="aw-panel-head"><span className="aw-ph-title">SETTINGS</span></div>
              <div className="aw-set-tabs">{SET_TABS.map((t) => <button key={t} className={setTab === t ? 'active' : ''} onClick={() => setSetTab(t)}>{t}</button>)}</div>
              <div className="aw-set-rows">
                {SET_ROWS[setTab].map((r) => {
                  const key = `${setTab}-${r.label}`;
                  const on = key in setState ? setState[key] : r.on;
                  return (
                    <div className="aw-set-row" key={r.label}>
                      <span>{r.label}</span>
                      {r.type === 'toggle'
                        ? <button className={`aw-sw ${on ? 'on' : 'off'}`} onClick={() => setSetState((s) => ({ ...s, [key]: !on }))}><i /></button>
                        : <span className="aw-set-val">{r.val}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="aw-status">
        <span className="aw-st-conn"><i /> CONNECTED</span>
        <span className="aw-st-sep">87MS</span>
        <span>SURVIVORS.GG #5</span>
        <span className="aw-st-dim">· 3X SOLO/DUO/TRIO</span>
        <span className="aw-st-grow" />
        <span className="aw-st-ic"><ShoppingCart size={10} /> 81</span>
        <span className="aw-st-day">DAY</span>
        <span className="aw-st-ic"><Users size={10} /> 3/5</span>
        <span className="aw-st-ic players">151/300</span>
        <span className="aw-st-clock">21:27:30</span>
      </div>
    </div>
  );
}
