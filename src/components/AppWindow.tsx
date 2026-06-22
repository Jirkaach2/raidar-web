import { useState, useEffect, type ReactNode } from 'react';
import {
  Users, ShoppingCart, ChevronRight, ChevronDown, ChevronUp, Search, Send,
  ToggleRight, ToggleLeft, BellRing, Database, Trash2, Edit2, Zap as ZapIc, Moon, Siren, Power,
  Home, Clock, Lock, Flame, RefreshCw, DollarSign, Calculator, Compass, Video, Activity, Shield,
  ArrowUpDown, MapPin, Info, ExternalLink, Trophy, X,
  BarChart3, ArrowDown, ArrowUp, Minus, Terminal, Target,
  Dna, Sprout, Fish, Check, Crown, Waves, Gauge, Hammer,
} from 'lucide-react';
import Logo from './Logo';

type Page = 'team' | 'vending' | 'devices' | 'tools' | 'spy';

const RAIL: Array<{ key: Page; path: ReactNode; sep?: boolean }> = [
  { key: 'team', path: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></> },
  { key: 'vending', path: <><rect x="4" y="2" width="16" height="20" rx="2" /><rect x="6" y="4" width="12" height="10" /><line x1="8" y1="18" x2="16" y2="18" /></> },
  { key: 'devices', path: <><path d="M12 2v4" /><path d="M12 18v4" /><path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" /></>, sep: true },
  { key: 'tools', path: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2 2.5-2.5z" /> },
  { key: 'spy', path: <><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></> },
];
const RAIL_LABELS: Record<Page, string> = { team: 'Team', vending: 'Market', devices: 'Smart Devices', tools: 'Tools', spy: 'Rust Spy' };

function icon(s: string) { return `https://cdn.rusthelp.com/images/256/${s.replace(/[._]/g, '-')}.webp`; }
function hideErr(e: React.SyntheticEvent<HTMLImageElement>) { e.currentTarget.style.visibility = 'hidden'; }
function Av({ name, color }: { name: string; color: string }) { return <span className="aw-av" style={{ background: color }}>{name[0]}</span>; }

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
    { qty: 500, item: 'Wood', icon: 'wood', cost: 8, cur: 'Scrap', curIcon: 'scrap', stock: 12000 },
  ] },
];
const BEST = [
  { name: 'Big Boom Shop', grid: 'G7', sales: 38, ago: '2m ago', earned: [['scrap', '4,200']], sold: [['explosive.timed', '38'], ['explosive.satchel', '64'], ['ammo.rocket.basic', '22'], ['explosive.timed', '12']] },
  { name: 'Bandit Surplus', grid: 'K14', sales: 120, ago: 'just now', earned: [['scrap', '3,100'], ['metal.refined', '300']], sold: [['scrap', '1.2k'], ['cloth', '900'], ['lowgradefuel', '400'], ['gunpowder', '600'], ['metal.fragments', '2k']] },
  { name: 'Hill Traders', grid: 'C19', sales: 54, ago: '6m ago', earned: [['scrap', '1,900']], sold: [['metal.refined', '900'], ['sulfur', '4k'], ['wood', '12k']] },
];

const TOOL_GROUPS: Array<{ label: string; tools: Array<[string, string, typeof Home]> }> = [
  { label: 'BASE & DEFENSE', tools: [['cupboard', 'Cupboard', Home], ['decay', 'Decay', Clock]] },
  { label: 'COMBAT & RAIDING', tools: [['raidcost', 'Raid Cost', Flame], ['loadout', 'Loadout Lab', Shield], ['crates', 'Locked Crates', Lock]] },
  { label: 'MARKET & ECONOMY', tools: [['pricewatch', 'Price Watch', DollarSign], ['marketindex', 'Market Index', BarChart3], ['profit', 'Profit Scan', Calculator], ['recycler', 'Recycler', RefreshCw]] },
  { label: 'RECON & INTEL', tools: [['lookup', 'Player Lookup', Search], ['richbase', 'Rich Bases', Compass], ['activity', 'Activity', Activity], ['combatlog', 'Combat Log', Terminal], ['cctv', 'CCTV Codes', Video]] },
  { label: 'SURVIVAL', tools: [['fishing', 'Fishing Guide', Fish], ['farming', 'Farming Solver', Sprout]] },
];
const CCTV: Array<[string, string]> = [
  ['Large Oil Rig', 'OILRIG1L'], ['Small Oil Rig', 'OILRIG1S'], ['Dome', 'DOME1'], ['Airfield', 'AIRFIELDHELi'],
  ['Launch Site', 'SATCOMS'], ['Excavator', 'XOR1'], ['Sewer Branch', 'SEWER'], ['Water Treatment', 'WTPCAM'],
];
const PRICEWATCH: Array<{ item: string; icon: string; target: string; best: string; grid: string }> = [
  { item: 'C4', icon: 'explosive.timed', target: '≤ 450 scrap', best: '420 scrap', grid: 'G7' },
  { item: 'Assault Rifle', icon: 'rifle.ak', target: '≤ 250 scrap', best: '240 scrap', grid: 'K14' },
  { item: 'High Quality Metal', icon: 'metal.refined', target: '≤ 80 scrap', best: '75 scrap', grid: 'C19' },
];
const CUP_ITEMS: Array<[string, string]> = [['wood', '14.2k'], ['stones', '9.8k'], ['metal.fragments', '6.1k'], ['metal.refined', '420'], ['scrap', '380'], ['lowgradefuel', '1.1k'], ['cloth', '900'], ['sulfur', '2.4k'], ['charcoal', '5k'], ['gunpowder', '600']];
const DECAY_LIST: Array<{ label: string; grid: string; mat: string; hp: number; max: number; left: string; pct: number; danger: string }> = [
  { label: 'Enemy 2x2', grid: 'D7', mat: 'Stone', hp: 210, max: 500, left: '8h 12m left', pct: 0.42, danger: 'ok' },
  { label: 'Sheet Door', grid: 'F9', mat: 'Sheet Metal', hp: 55, max: 250, left: '2h 40m left', pct: 0.22, danger: 'soon' },
  { label: 'Wood Shack', grid: 'K3', mat: 'Wood', hp: 0, max: 250, left: 'DECAYED', pct: 0, danger: 'dead' },
];
const CRATE_TL: Array<{ n: string; s: string; state: 'live' | 'soon' | 'done' }> = [
  { n: 'Crate 1 (Stern/Back)', s: '● LIVE ON DECK', state: 'live' },
  { n: 'Crate 2 (Mid-Back)', s: 'Spawns in 4:12', state: 'soon' },
  { n: 'Crate 3 (Mid-Front)', s: 'Spawns in 14:12', state: 'soon' },
  { n: 'Crate 4 (Bow/Front)', s: 'Spawns in 24:12', state: 'soon' },
];
const CRATE_TIMERS: Array<{ label: string; sub: string; time: string; pct: number; danger: string }> = [
  { label: 'Cargo · Back', sub: 'Cargo Crate', time: '1:42', pct: 0.18, danger: 'soon' },
  { label: 'Large Oil Rig', sub: 'Hackable Crate', time: '9:30', pct: 0.62, danger: 'ok' },
];
const PROFIT: Array<{ via: string; viaIcon: string; profit: string; s1g: string; s1t: string; s2g: string; s2t: string }> = [
  { via: 'Metal Fragments', viaIcon: 'metal.fragments', profit: '+1.6k', s1g: 'K14', s1t: 'Spend 240 Scrap → Get 6k Metal Frags', s2g: 'C19', s2t: 'Pay 6k Metal Frags → Get 1.8k Scrap' },
  { via: 'Low Grade Fuel', viaIcon: 'lowgradefuel', profit: '+680', s1g: 'G7', s1t: 'Spend 100 Scrap → Get 2k Low Grade', s2g: 'H9', s2t: 'Pay 2k Low Grade → Get 780 Scrap' },
];
const RICH: Array<{ grid: string; name: string; value: string; tier: string; tc: string; pct: number; hl: Array<{ icon: string; qty: string; name: string; raid: boolean }> }> = [
  { grid: 'D8', name: 'GigaClan Shop', value: '18.4k', tier: 'WHALE', tc: '#ce422b', pct: 92, hl: [{ icon: 'explosive.timed', qty: '12', name: 'C4', raid: true }, { icon: 'rocket.launcher', qty: '4', name: 'Launcher', raid: true }, { icon: 'metal.refined', qty: '4k', name: 'HQM', raid: false }] },
  { grid: 'K14', name: 'Bandit Surplus', value: '9.1k', tier: 'RICH', tc: '#e8a838', pct: 54, hl: [{ icon: 'rifle.ak', qty: '8', name: 'AK', raid: false }, { icon: 'sulfur', qty: '20k', name: 'Sulfur', raid: false }] },
  { grid: 'C19', name: 'Hill Traders', value: '4.2k', tier: 'OK', tc: '#6fcf73', pct: 28, hl: [{ icon: 'scrap', qty: '3k', name: 'Scrap', raid: false }] },
];
const ACT_STATS: Array<{ name: string; st: string; deaths: number; dph: string; grid: string; moved: string }> = [
  { name: 'Viktor', st: 'on', deaths: 2, dph: '0.6', grid: 'F12', moved: '3m ago' },
  { name: 'Dima', st: 'dead', deaths: 5, dph: '1.5', grid: 'H9', moved: 'just now' },
  { name: 'Sasha', st: 'on', deaths: 1, dph: '0.3', grid: 'G11', moved: '12m ago' },
];
const ACT_LOG: Array<{ k: string; label: string; detail: string; time: string }> = [
  { k: 'death', label: 'Yuri died', detail: 'H9', time: '2m ago' },
  { k: 'cargo', label: 'Cargo Ship entered', detail: 'D7', time: '6m ago' },
  { k: 'online', label: 'Dima came online', detail: '', time: '14m ago' },
  { k: 'heli', label: 'Patrol Heli inbound', detail: '', time: '22m ago' },
  { k: 'crate', label: 'Locked Crate spawned', detail: 'Launch Site', time: '28m ago' },
];

// ── Recycler (interactive) ──
const REC_COMPONENTS: Array<{ id: string; name: string; icon: string; out: Array<[string, number]> }> = [
  { id: 'riflebody', name: 'Rifle Body', icon: 'riflebody', out: [['scrap', 25], ['metal.fragments', 63]] },
  { id: 'techparts', name: 'Tech Trash', icon: 'techparts', out: [['scrap', 20], ['metal.refined', 5]] },
  { id: 'metalpipe', name: 'Metal Pipe', icon: 'metalpipe', out: [['metal.fragments', 38], ['scrap', 5]] },
  { id: 'gears', name: 'Gears', icon: 'gears', out: [['scrap', 13], ['metal.fragments', 25]] },
  { id: 'sheetmetal', name: 'Sheet Metal', icon: 'sheetmetal', out: [['metal.fragments', 100]] },
  { id: 'roadsigns', name: 'Road Signs', icon: 'roadsigns', out: [['metal.fragments', 50]] },
  { id: 'springs', name: 'Springs', icon: 'metalspring', out: [['metal.fragments', 13], ['scrap', 7]] },
  { id: 'sewingkit', name: 'Sewing Kit', icon: 'sewingkit', out: [['scrap', 8], ['cloth', 10]] },
];
const REC_NAMES: Record<string, string> = { scrap: 'Scrap', 'metal.fragments': 'Metal Frags', 'metal.refined': 'HQM', cloth: 'Cloth' };

// ── Loadout lab (interactive) ──
const LO_WEAPONS: Record<string, { name: string; icon: string; dmg: number; head: number; rpm: number }> = {
  'rifle.ak': { name: 'Assault Rifle', icon: 'rifle.ak', dmg: 50, head: 2.0, rpm: 450 },
  'smg.mp5': { name: 'MP5A4', icon: 'smg.mp5', dmg: 35, head: 1.5, rpm: 600 },
  'rifle.bolt': { name: 'Bolt Action', icon: 'rifle.bolt', dmg: 80, head: 2.0, rpm: 40 },
  'pistol.semiauto': { name: 'Semi Pistol', icon: 'pistol.semiauto', dmg: 32.5, head: 2.0, rpm: 400 },
};
const LO_ARMOR: Record<string, { name: string; head: number; chest: number; legs: number }> = {
  none: { name: 'No Armor', head: 0, chest: 0, legs: 0 },
  road: { name: 'Roadsign Kit', head: 0.25, chest: 0.45, legs: 0.3 },
  metal: { name: 'Metal Facemask + Chest', head: 0.55, chest: 0.5, legs: 0.1 },
  hazzy: { name: 'Hazmat Suit', head: 0.2, chest: 0.2, legs: 0.2 },
};

// ── Raid cost (real verified placement counts & sulfur) ──
const RC_TARGETS: Array<{ key: string; name: string; icon: string; hp: number; methods: Array<{ key: string; name: string; icon: string; count: number; sulfur: number }> }> = [
  { key: 'sheet_wall', name: 'Sheet Metal Wall', icon: 'wall', hp: 1000, methods: [
    { key: 'c4', name: 'C4', icon: 'explosive.timed', count: 4, sulfur: 8800 },
    { key: 'explo', name: 'Explo 5.56', icon: 'ammo.rifle.explosive', count: 400, sulfur: 10000 },
    { key: 'satchel', name: 'Satchel', icon: 'explosive.satchel', count: 23, sulfur: 11040 },
    { key: 'rocket', name: 'Rocket', icon: 'ammo.rocket.basic', count: 8, sulfur: 11200 },
    { key: 'hv', name: 'HV Rocket', icon: 'ammo.rocket.hv', count: 67, sulfur: 13400 },
  ] },
  { key: 'armored_door', name: 'Armored Door', icon: 'door.hinged.toptier', hp: 1000, methods: [
    { key: 'c4', name: 'C4', icon: 'explosive.timed', count: 4, sulfur: 8800 },
    { key: 'satchel', name: 'Satchel', icon: 'explosive.satchel', count: 19, sulfur: 9120 },
    { key: 'rocket', name: 'Rocket', icon: 'ammo.rocket.basic', count: 7, sulfur: 9800 },
  ] },
  { key: 'garage_door', name: 'Garage Door', icon: 'wall.frame.garagedoor', hp: 600, methods: [
    { key: 'rocket', name: 'Rocket', icon: 'ammo.rocket.basic', count: 3, sulfur: 4200 },
    { key: 'satchel', name: 'Satchel', icon: 'explosive.satchel', count: 9, sulfur: 4320 },
    { key: 'c4', name: 'C4', icon: 'explosive.timed', count: 2, sulfur: 4400 },
  ] },
];

// ── Market index ──
const MKT_SOLD: Array<[string, string, number]> = [
  ['scrap', 'Scrap', 4820], ['cloth', 'Cloth', 3110], ['gunpowder', 'Gun Powder', 2640],
  ['lowgradefuel', 'Low Grade Fuel', 1980], ['metal.fragments', 'Metal Frags', 1450], ['sulfur', 'Sulfur', 920],
];
const MKT_PRICES: Array<{ icon: string; name: string; cur: string; low: number; avg: number; high: number; last: number }> = [
  { icon: 'explosive.timed', name: 'C4', cur: 'Scrap', low: 420, avg: 480, high: 560, last: 450 },
  { icon: 'rifle.ak', name: 'Assault Rifle', cur: 'Scrap', low: 230, avg: 265, high: 320, last: 240 },
  { icon: 'metal.refined', name: 'HQM', cur: 'Scrap', low: 70, avg: 82, high: 95, last: 75 },
  { icon: 'sulfur', name: 'Sulfur', cur: 'Scrap', low: 80, avg: 92, high: 110, last: 90 },
  { icon: 'lowgradefuel', name: 'Low Grade Fuel', cur: 'Scrap', low: 4, avg: 6, high: 9, last: 5 },
];

// ── Combat log (parsed PVP sample) ──
const CL_METRICS = { dealt: 290, taken: 145, kills: 1, deaths: 1, accuracy: 100, headshot: 50, invalid: 0 };
const CL_HITS: Array<[string, number, string]> = [['Head', 50, 'head'], ['Chest', 33, 'chest'], ['Stomach', 17, 'stomach'], ['Limbs', 0, 'limbs']];
const CL_EVENTS: Array<{ time: string; label: string; tone: string; weapon: string; area: string; desc: string }> = [
  { time: '00:01', label: 'HIT', tone: 'dealt', weapon: 'AK-47', area: 'head', desc: 'Player_Ninja · 18m · −35' },
  { time: '00:01', label: 'HIT', tone: 'dealt', weapon: 'AK-47', area: 'chest', desc: 'Player_Ninja · 18m · −25' },
  { time: '00:01', label: 'TOOK', tone: 'taken', weapon: 'MP5', area: 'chest', desc: 'Player_Ninja · 18m · −20' },
  { time: '00:02', label: 'KILL', tone: 'kill', weapon: 'AK-47', area: 'chest', desc: 'Player_Ninja · 18m' },
  { time: '00:02', label: 'DEATH', tone: 'death', weapon: 'Bolt AR', area: 'head', desc: 'by Player_Sniper · 115m' },
];

// ── Fishing ──
const FISH_BAITS: Array<{ name: string; lvl: number; stack: number; max: number; tier: string }> = [
  { name: 'Grub', lvl: 3.5, stack: 3, max: 10.5, tier: 'S' },
  { name: 'Worm', lvl: 2.5, stack: 3, max: 7.5, tier: 'S' },
  { name: 'Raw Bear Meat', lvl: 10, stack: 1, max: 10, tier: 'A' },
  { name: 'Anchovy', lvl: 2, stack: 2, max: 4, tier: 'B' },
  { name: 'Raw Fish Meat', lvl: 0.5, stack: 10, max: 5, tier: 'A' },
];

// ── Farming genetic solver (solved example) ──
const FARM_TARGET = ['Y', 'Y', 'Y', 'Y', 'G', 'G'];
const FARM_GOOD = new Set(['G', 'Y', 'H']);
const FARM_GRID: Array<{ label: string; genes: string; type: 'clone' | 'target' } | null> = [
  { label: 'Clone A', genes: 'GYYYYX', type: 'clone' }, null, { label: 'Clone B', genes: 'GGYYXX', type: 'clone' },
  null, { label: 'CROSSBREED', genes: 'YYYYGG', type: 'target' }, null,
  { label: 'Clone C', genes: 'HHYYGG', type: 'clone' }, null, { label: 'Clone A', genes: 'GYYYYX', type: 'clone' },
];

function bucket(seed: number, d: number, h: number): number {
  const peak = ((seed * 7) % 6) + 18;
  const dist = Math.min(Math.abs(h - peak), Math.abs(h - peak + 24));
  let v = Math.max(0, 1 - dist / 5);
  if (h < 7) v *= 0.15;
  v *= 0.6 + ((seed * (d + 3) * (h + 1)) % 40) / 100;
  return Math.min(1, v);
}
function heat(v: number) { if (v <= 0.04) return 'rgba(255,255,255,0.04)'; const g = Math.round(60 + v * 180); return `rgba(40, ${g}, 60, ${0.35 + v * 0.6})`; }
const ENEMIES = [
  { name: 'BridgeKing', online: true, group: 'Bridge Clan', gc: '#ce422b', raid: '8PM–2AM', seed: 3, last: 'Online now', track: '' },
  { name: 'zerg_ttv', online: false, group: 'Zerg D7', gc: '#58c6e8', raid: '6PM–12AM', seed: 7, last: 'Last seen 2h ago', track: '' },
  { name: 'soloRoamer', online: false, group: '', gc: '', raid: '11PM–3AM', seed: 5, last: 'Last seen 8h ago', track: '' },
  { name: 'Nightmare', online: true, group: 'Bridge Clan', gc: '#ce422b', raid: '9PM–1AM', seed: 9, last: 'Online now', track: '' },
];
const TEAM_SPY = TEAM.map((m, i) => ({ name: m.name, online: m.status === 'online', group: '', gc: '', raid: `${fmtHour(((i * 7) % 6) + 18)}–${fmtHour((((i * 7) % 6) + 18 + 6) % 24)}`, seed: (i + 2) * 3, last: `tracked ${40 + i * 9}h`, track: '' }));
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function fmtHour(h: number) { const a = h >= 12 ? 'PM' : 'AM'; let x = h % 12; if (x === 0) x = 12; return `${x}${a}`; }
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function clock() { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

export default function AppWindow() {
  const [page, setPage] = useState<Page>('devices');
  const [sw, setSw] = useState<Record<string, boolean>>({ 'Base Lights': true, 'Turret Power': true, 'Furnace Bank': false });
  const [openTc, setOpenTc] = useState(false);
  const [teamExp, setTeamExp] = useState<string | null>('Viktor');
  const [vView, setVView] = useState<'market' | 'best'>('market');
  const [vTab, setVTab] = useState<'buy' | 'sell'>('buy');
  const [vType, setVType] = useState<'all' | 'player' | 'npc'>('all');
  const [vChip, setVChip] = useState('');
  const [bsSort, setBsSort] = useState<'earn' | 'sales' | 'recent'>('earn');
  const [tool, setTool] = useState('cctv');
  const [spyTab, setSpyTab] = useState<'team' | 'enemies' | 'history'>('enemies');
  const [enemySel, setEnemySel] = useState('BridgeKing');
  const [teamSel, setTeamSel] = useState('Viktor');

  // Tool-specific interactive state
  const [recBasket, setRecBasket] = useState<Record<string, number>>({ riflebody: 2, techparts: 5 });
  const [recMult, setRecMult] = useState(2);
  const [recType, setRecType] = useState<'monument' | 'safezone'>('monument');
  const [loWeapon, setLoWeapon] = useState('rifle.ak');
  const [loArmor, setLoArmor] = useState('metal');
  const [cupSel, setCupSel] = useState('tc');
  const [rcTarget, setRcTarget] = useState('sheet_wall');

  // Live status bar.
  const [time, setTime] = useState(clock());
  const [stats, setStats] = useState({ ms: 87, pop: 142, shops: 82 });
  useEffect(() => {
    const c = setInterval(() => setTime(clock()), 1000);
    const s = setInterval(() => setStats((p) => ({ ms: clamp(p.ms + (Math.floor(Math.random() * 21) - 10), 42, 120), pop: clamp(p.pop + (Math.floor(Math.random() * 7) - 3), 120, 200), shops: clamp(p.shops + (Math.floor(Math.random() * 3) - 1), 70, 96) })), 3200);
    return () => { clearInterval(c); clearInterval(s); };
  }, []);

  const term = vChip.toLowerCase();
  const vendShown = VEND
    .filter((v) => vType === 'all' || (vType === 'npc' ? v.npc : !v.npc))
    .map((v) => ({ ...v, orders: v.orders.filter((o) => !term || (vTab === 'buy' ? o.item : o.cur).toLowerCase().includes(term)) }))
    .filter((v) => v.orders.length > 0);

  const toolMeta = TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t[0] === tool);
  const ToolIcon = (toolMeta?.[2] || Home);

  const spyList = spyTab === 'team' ? TEAM_SPY : ENEMIES;
  const spySel = spyTab === 'team' ? teamSel : enemySel;
  const setSpySel = spyTab === 'team' ? setTeamSel : setEnemySel;
  const sel = spyList.find((p) => p.name === spySel) || spyList[0];
  const hourly = sel ? Array.from({ length: 24 }, (_, h) => { let s = 0; for (let d = 0; d < 7; d++) s += bucket(sel.seed, d, h); return s / 7; }) : [];

  return (
    <div className="aw bracketed">
      <div className="aw-bar">
        <div className="aw-bar-left"><span className="aw-bar-logo"><Logo size={14} /></span><span className="aw-bar-title">RAIDAR</span><span className="aw-bar-ver">v1.1.3</span></div>
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
                      <div className="device-info"><div className="device-name-row"><h3 className="device-name">{name}</h3><Edit2 className="dn-edit" /></div><div className="device-meta">ID: {id}</div></div>
                      <div className="device-actions"><button className={`device-toggle ${on ? 'is-on' : 'is-off'}`} onClick={() => setSw((s) => ({ ...s, [name]: !s[name] }))}>{on ? 'ON' : 'OFF'}</button><button className="device-delete"><Trash2 /></button></div>
                    </div>
                  </div>
                );
              })}
              <div className="device-card dev-alarm is-on-card">
                <div className="device-card-header"><div className="device-icon"><BellRing /></div><div className="device-info"><div className="device-name-row"><h3 className="device-name">Main Base Alarm</h3></div><div className="device-meta">ID: 55021 · Smart Alarm</div></div><div className="device-actions"><span className="device-indicator is-quiet" /><button className="device-delete"><Trash2 /></button></div></div>
              </div>
              <div className={`device-card dev-storage is-clickable ${openTc ? 'is-open' : ''}`} onClick={() => setOpenTc((o) => !o)}>
                <div className="device-card-header"><div className="device-icon"><Database /></div><div className="device-info"><div className="device-name-row"><h3 className="device-name">Tool Cupboard</h3></div><div className="device-meta">ID: 77104 · click to {openTc ? 'close' : 'view contents'}</div></div><ChevronRight className={`dev-caret ${openTc ? 'open' : ''}`} /></div>
                <div className="device-tc-info"><div className="tc-row"><span className="tc-lbl">TC UPKEEP TIMER</span><span className="tc-good">2d 4h left</span></div><div className="tc-row"><span className="tc-lbl">TC STORAGE · 22/30 SLOTS</span><span className="tc-pct">73%</span></div><div className="device-storage-bar"><div className="storage-fill" style={{ width: '73%' }} /></div></div>
                {openTc && <div className="tc-contents" onClick={(e) => e.stopPropagation()}>{TC_ITEMS.map(([ic, qty]) => (<div className="tc-slot" key={ic}><img src={icon(ic)} onError={hideErr} alt="" /><span>{qty}</span></div>))}</div>}
              </div>
              <div className="device-group-label foreign">RAIDAR.TECH · OFF-SERVER</div>
              <div className="device-card dev-switch is-foreign">
                <div className="device-card-header"><div className="device-icon"><ToggleLeft /></div><div className="device-info"><div className="device-name-row"><h3 className="device-name">2nd Base Heater</h3></div><div className="device-meta">ID: 9931 · raidar.tech</div></div><div className="device-actions"><button className="device-toggle is-off">OFF</button></div></div>
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
                          <Av name={m.name} color={m.color} /><span className={`aw-mdot ${m.status}`} />
                          <span className={`aw-mname ${m.leader ? 'lead' : ''}`}>{m.name}</span>
                          {m.leader && <span className="aw-lead">LEAD</span>}
                          <span className={`aw-mgrid ${m.status === 'dead' ? 'dead' : m.status === 'offline' ? 'off' : ''}`}>{m.grid}</span>
                          {exp ? <ChevronUp size={13} className="aw-mcar" /> : <ChevronDown size={13} className="aw-mcar" />}
                        </div>
                        {m.status !== 'offline' && !exp && <div className="aw-hp"><div className="aw-hp-bg"><div className="aw-hp-fill" style={{ width: `${m.health}%`, background: m.health < 40 ? '#ef4444' : m.health < 75 ? '#f59e0b' : '#6fcf73' }} /></div><span>{m.health}% HP</span></div>}
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

          {/* ───────── MARKET ───────── */}
          {page === 'vending' && (
            <div className="aw-scr aw-vend">
              <div className="aw-vviews">
                <button className={vView === 'market' ? 'active' : ''} onClick={() => setVView('market')}>MARKET SEARCH</button>
                <button className={vView === 'best' ? 'active' : ''} onClick={() => setVView('best')}>BEST SHOPS</button>
              </div>
              {vView === 'market' ? <>
                <div className="aw-vsearch"><Search size={13} /><input value={vChip} onChange={(e) => setVChip(e.target.value)} placeholder={vTab === 'buy' ? 'Search items to BUY (e.g. rifle, scrap...)' : 'Search payment accepted...'} />{vChip && <button className="aw-vclear" onClick={() => setVChip('')}>✕</button>}</div>
                <div className="aw-vchips">{['Wood', 'Stone', 'Metal', 'Sulfur', 'Scrap', 'Rifle', 'Ammo'].map((c) => <button key={c} className={vChip.toLowerCase() === c.toLowerCase() ? 'active' : ''} onClick={() => setVChip(vChip.toLowerCase() === c.toLowerCase() ? '' : c)}>{c}</button>)}</div>
                <div className="aw-vtabs">
                  <button className={`buy ${vTab === 'buy' ? 'active' : ''}`} onClick={() => setVTab('buy')}><ShoppingCart size={11} /> BUY ITEMS</button>
                  <button className={`sell ${vTab === 'sell' ? 'active' : ''}`} onClick={() => setVTab('sell')}><DollarSign size={11} /> SELL ITEMS</button>
                </div>
                <div className="aw-vctrl">
                  <div className="aw-vfilter">{(['all', 'player', 'npc'] as const).map((t) => <button key={t} className={vType === t ? 'active' : ''} onClick={() => setVType(t)}>{t === 'all' ? 'All Shops' : t === 'player' ? 'Player' : 'NPC'}</button>)}</div>
                  <div className="aw-vsort"><ArrowUpDown size={11} /> Cheapest First</div>
                </div>
                <div className="aw-vlist">
                  {vendShown.length === 0 ? <div className="aw-vempty"><Search size={22} /><p>No listings found{vChip ? ` matching "${vChip}"` : ''}</p></div> : vendShown.map((v) => (
                    <div className={`aw-vcard ${v.npc ? 'npc' : ''}`} key={v.name}>
                      <div className="aw-vcard-h">
                        <div><h3 style={{ color: v.npc ? '#3cc04c' : 'var(--color-text)' }}>{v.name}</h3><div className="aw-vbadges"><span className="aw-vgrid">{v.grid}</span><span className="aw-vdist"><MapPin size={8} /> {v.dist}</span><span className="aw-vnpc">{v.npc ? 'NPC Shop' : 'Player Shop'}</span></div></div>
                        <Info size={14} className="aw-vinfo" />
                      </div>
                      {v.orders.map((o, i) => (
                        <div className={`aw-vorder ${o.stock === 0 ? 'oos' : ''}`} key={i}>
                          <div className="aw-vo-row"><span className="aw-vo-buy"><span className="aw-vqty">{o.qty}x</span><img src={icon(o.icon)} onError={hideErr} alt="" /> {o.item}</span><ChevronRight size={12} className="aw-vo-arrow" /><span className="aw-vo-cost"><span className="aw-vcost">{o.cost}x</span><img src={icon(o.curIcon)} onError={hideErr} alt="" /> {o.cur}</span></div>
                          <span className={`aw-vstock ${o.stock === 0 ? 'no' : 'in'}`}>{o.stock === 0 ? 'OUT OF STOCK' : `STOCK: ${o.stock}`}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </> : (
                <div className="aw-bs">
                  <div className="aw-bs-head"><h3><Trophy size={14} /> BEST SELLING SHOPS</h3><button className="aw-bs-clear"><Trash2 size={11} /> Reset</button></div>
                  <p className="aw-bs-sub">Live-tracked while connected. Each shop's stock drop = a sale; Raidar tallies what every store sold and earned.</p>
                  <div className="aw-bs-sort">
                    <button className={bsSort === 'earn' ? 'active' : ''} onClick={() => setBsSort('earn')}>Top earners</button>
                    <button className={bsSort === 'sales' ? 'active' : ''} onClick={() => setBsSort('sales')}>Most sales</button>
                    <button className={bsSort === 'recent' ? 'active' : ''} onClick={() => setBsSort('recent')}>Most recent</button>
                  </div>
                  <div className="aw-bs-list">
                    {BEST.map((b, i) => (
                      <div className="aw-bs-card" key={b.name}>
                        <div className="aw-bs-card-h">
                          <span className={`aw-bs-rank ${i < 3 ? `r${i + 1}` : ''}`}>{i + 1}</span>
                          <div className="aw-bs-id"><span className="aw-bs-name">{b.name}</span><span className="aw-bs-meta"><span className="aw-vgrid">{b.grid}</span> · {b.sales} sales · {b.ago}</span></div>
                          <button className="aw-bs-loc"><MapPin size={13} /></button><button className="aw-bs-del"><X size={13} /></button>
                        </div>
                        <div className="aw-bs-earned"><span className="aw-bs-el">EARNED</span>{b.earned.map(([ic, amt], j) => <span className="aw-bs-ecell" key={j}><img src={icon(ic)} onError={hideErr} alt="" />{amt}</span>)}</div>
                        <div className="aw-bs-sold">{b.sold.slice(0, 8).map(([ic, qty], j) => <span className="aw-bs-scell" key={j}><img src={icon(ic)} onError={hideErr} alt="" /><b>{qty}</b></span>)}</div>
                      </div>
                    ))}
                  </div>
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
                    {g.tools.map(([id, name, Ic]) => <button key={id} className={`aw-tool-btn ${tool === id ? 'active' : ''}`} onClick={() => setTool(id)}><Ic size={13} /> {name}</button>)}
                  </div>
                ))}
              </div>
              <div className="aw-tools-main">
                {tool === 'cctv' && <>
                  <div className="aw-tool-h"><Video size={14} /> CCTV CAMERA CODES</div>
                  <p className="aw-tool-p">Type these into a Computer Station to watch monument cameras.</p>
                  <div className="aw-cctv">{CCTV.map(([mon, code]) => <div className="aw-cctv-row" key={code}><span>{mon}</span><code>{code}</code></div>)}</div>
                </>}
                {tool === 'recycler' && (() => {
                  const yields: Record<string, number> = {};
                  REC_COMPONENTS.forEach((c) => { const n = recBasket[c.id] || 0; if (n) c.out.forEach(([res, amt]) => { yields[res] = (yields[res] || 0) + amt * n * (recType === 'safezone' ? 0.67 : 1) * recMult; }); });
                  const total = Object.values(recBasket).reduce((a, b) => a + b, 0);
                  const setN = (id: string, n: number) => setRecBasket((b) => ({ ...b, [id]: Math.max(0, n) }));
                  return <>
                    <div className="aw-tool-h"><RefreshCw size={14} /> RECYCLER CALCULATOR</div>
                    <div className="aw-rec2-ctrl">
                      <div className="aw-rec2-mult">{[1, 2, 3, 5, 10].map((m) => <button key={m} className={recMult === m ? 'on' : ''} onClick={() => setRecMult(m)}>{m}x</button>)}</div>
                      <div className="aw-rec2-type">
                        <button className={recType === 'monument' ? 'on' : ''} onClick={() => setRecType('monument')}>Monument <small>~100%</small></button>
                        <button className={recType === 'safezone' ? 'on' : ''} onClick={() => setRecType('safezone')}>Safe-zone <small>~67%</small></button>
                      </div>
                    </div>
                    <div className="aw-rec2-grid">
                      {REC_COMPONENTS.map((c) => { const n = recBasket[c.id] || 0; return (
                        <div className={`aw-rec2-item ${n ? 'on' : ''}`} key={c.id}>
                          <img src={icon(c.icon)} onError={hideErr} alt="" title={c.name} />
                          <span className="aw-rec2-name">{c.name}</span>
                          <div className="aw-rec2-step"><button onClick={() => setN(c.id, n - 1)}>−</button><b>{n}</b><button onClick={() => setN(c.id, n + 1)}>+</button></div>
                        </div>
                      ); })}
                    </div>
                    <div className="aw-tool-h" style={{ marginTop: 12 }}>OUTPUT {total > 0 && <span className="aw-rec2-cnt">{total} item{total === 1 ? '' : 's'} · {recMult}x</span>}</div>
                    {total === 0 ? <p className="aw-tool-p">Add components above to see the yield.</p> : (
                      <div className="aw-rec2-out">{Object.entries(yields).map(([res, amt]) => (
                        <div className="aw-rec2-outitem" key={res}><img src={icon(res)} onError={hideErr} alt="" /><b>×{Math.round(amt)}</b><span>{REC_NAMES[res] || res}</span></div>
                      ))}</div>
                    )}
                  </>;
                })()}
                {tool === 'pricewatch' && <>
                  <div className="aw-tool-h"><DollarSign size={14} /> PRICE WATCH</div>
                  <p className="aw-tool-p">Get alerted when a watched item drops below your target.</p>
                  {PRICEWATCH.map((w) => (
                    <div className="aw-pw" key={w.item}>
                      <span className="aw-pw-item"><img src={icon(w.icon)} onError={hideErr} alt="" /> {w.item}</span>
                      <span className="aw-pw-target">{w.target}</span>
                      <span className="aw-pw-best">{w.best} <span className="aw-vgrid">{w.grid}</span></span>
                    </div>
                  ))}
                </>}
                {tool === 'cupboard' && (() => {
                  const UPKEEP = [
                    { ic: 'wood', label: 'Wood', have: '14.2k', days: 4.1, pct: 0.82 },
                    { ic: 'stones', label: 'Stone', have: '9.8k', days: 3.4, pct: 0.68 },
                    { ic: 'metal.fragments', label: 'Metal', have: '6.1k', days: 2.2, pct: 0.44 },
                    { ic: 'metal.refined', label: 'HQM', have: '420', days: 1.1, pct: 0.22 },
                  ];
                  return <>
                    <div className="aw-cup-tabs">
                      <button className={cupSel === 'tc' ? 'on' : ''} onClick={() => setCupSel('tc')}><Home size={12} /> Main Base TC</button>
                      <button className={cupSel === 'box' ? 'on' : ''} onClick={() => setCupSel('box')}><Database size={12} /> Loot Room Box</button>
                    </div>
                    {cupSel === 'tc' ? (
                      <div className="aw-cup-card">
                        <div className="aw-cup-h"><span>Main Base TC</span><span className="aw-cup-status ok">● PROTECTED · 2d 4h</span></div>
                        <div className="aw-cup-upkeep">
                          {UPKEEP.map((u) => (
                            <div className="aw-cup-up" key={u.ic}>
                              <img src={icon(u.ic)} onError={hideErr} alt="" />
                              <div className="aw-cup-up-info"><span className="aw-cup-up-top"><b>{u.label}</b><span>{u.have}</span></span><div className="aw-cup-up-bar"><span className={u.days < 1.5 ? 'low' : u.days < 2.5 ? 'mid' : ''} style={{ width: `${u.pct * 100}%` }} /></div><span className="aw-cup-up-days">{u.days.toFixed(1)}d left</span></div>
                            </div>
                          ))}
                        </div>
                        <div className="aw-cup-grid">
                          {CUP_ITEMS.map(([ic, q]) => <div className="aw-cup-slot" key={ic} title={ic}><img src={icon(ic)} onError={hideErr} alt="" /><span>{q}</span></div>)}
                          {Array.from({ length: 26 }).map((_, i) => <div className="aw-cup-slot empty" key={`e${i}`} />)}
                        </div>
                      </div>
                    ) : (
                      <div className="aw-cup-card">
                        <div className="aw-cup-h"><span>Loot Room Box</span><span className="aw-cup-status box">STORAGE · 18/30</span></div>
                        <div className="aw-cup-grid">
                          {([['explosive.timed', '4'], ['rifle.ak', '2'], ['ammo.rifle', '480'], ['metal.refined', '1.2k'], ['scrap', '2.6k'], ['syringe.medical', '12'], ['supply.signal', '3'], ['targeting.computer', '2'], ['cctv.camera', '5'], ['rocket.launcher', '1'], ['ammo.rocket.basic', '6'], ['metal.facemask', '4']] as Array<[string, string]>).map(([ic, q]) => <div className="aw-cup-slot" key={ic} title={ic}><img src={icon(ic)} onError={hideErr} alt="" /><span>{q}</span></div>)}
                          {Array.from({ length: 18 }).map((_, i) => <div className="aw-cup-slot empty" key={`b${i}`} />)}
                        </div>
                      </div>
                    )}
                  </>;
                })()}
                {tool === 'decay' && <>
                  <div className="aw-tool-h"><Clock size={14} /> TRACKED STRUCTURES</div>
                  <p className="aw-tool-p">Pin enemy structures and watch their decay window count down.</p>
                  {DECAY_LIST.map((d) => (
                    <div className={`aw-decay ${d.danger}`} key={d.label}>
                      <div className="aw-decay-h"><span className="aw-decay-name">{d.label}</span><span className="aw-vgrid">{d.grid}</span><span className={`aw-decay-time ${d.danger}`}>{d.left}</span></div>
                      <div className="aw-decay-meta"><span>{d.mat}</span><span>{d.hp} / {d.max} HP</span></div>
                      <div className="aw-decay-bar"><span className={d.danger} style={{ width: `${d.pct * 100}%` }} /></div>
                    </div>
                  ))}
                </>}
                {tool === 'crates' && <>
                  <div className="aw-crate-tl">
                    <div className="aw-crate-tl-h">⚓ CARGO TIMELINE <span>entered 2:14 ago</span></div>
                    {CRATE_TL.map((c) => <div className="aw-crate-row" key={c.n}><span>{c.n}</span><span className={`aw-crate-s ${c.state}`}>{c.s}</span></div>)}
                  </div>
                  <div className="aw-tool-h" style={{ marginTop: 14 }}><Lock size={14} /> ACTIVE TIMERS</div>
                  {CRATE_TIMERS.map((t) => (
                    <div className={`aw-decay ${t.danger}`} key={t.label}>
                      <div className="aw-decay-h"><span className="aw-decay-name">{t.label}</span><span className={`aw-decay-time ${t.danger}`}>{t.time}</span></div>
                      <div className="aw-decay-meta"><span>{t.sub}</span></div>
                      <div className="aw-decay-bar"><span className={t.danger} style={{ width: `${t.pct * 100}%` }} /></div>
                    </div>
                  ))}
                </>}
                {tool === 'profit' && <>
                  <div className="aw-tool-h"><Calculator size={14} /> PROFIT SCANNER</div>
                  <p className="aw-tool-p">Two-step vending arbitrage loops across the map's shops.</p>
                  {PROFIT.map((p) => (
                    <div className="aw-profit" key={p.via}>
                      <div className="aw-profit-h"><span className="aw-profit-via"><img src={icon(p.viaIcon)} onError={hideErr} alt="" /> via {p.via}</span><span className="aw-profit-amt"><img src={icon('scrap')} onError={hideErr} alt="" /> {p.profit} / trip</span></div>
                      <div className="aw-profit-step"><span className="aw-profit-tag">STEP 1 · {p.s1g} →</span> {p.s1t}</div>
                      <div className="aw-profit-step"><span className="aw-profit-tag">STEP 2 · {p.s2g} →</span> {p.s2t}</div>
                    </div>
                  ))}
                </>}
                {tool === 'richbase' && <>
                  <div className="aw-tool-h"><Compass size={14} /> RICH PLAYER BASES</div>
                  <p className="aw-tool-p">Player shops ranked by the scrap value of valuables in stock.</p>
                  {RICH.map((r) => (
                    <div className="aw-rich" key={r.name}>
                      <div className="aw-rich-h"><span className="aw-vgrid">{r.grid}</span><span className="aw-rich-name">{r.name}</span><span className="aw-rich-val" style={{ color: r.tc }}>{r.value}</span><span className="aw-rich-tier" style={{ color: r.tc, borderColor: `${r.tc}66`, background: `${r.tc}1a` }}>{r.tier}</span></div>
                      <div className="aw-rich-hl">{r.hl.map((h, j) => <span key={j} className={`aw-rich-chip ${h.raid ? 'raid' : ''}`}><img src={icon(h.icon)} onError={hideErr} alt="" /><b>{h.qty}×</b> {h.name}</span>)}</div>
                      <div className="aw-rich-bar"><span style={{ width: `${r.pct}%`, background: r.tc }} /></div>
                    </div>
                  ))}
                </>}
                {tool === 'activity' && <>
                  <div className="aw-tool-h"><Activity size={14} /> TEAM STATS · THIS SESSION</div>
                  <div className="aw-act-stats">
                    {ACT_STATS.map((m) => (
                      <div className="aw-act-card" key={m.name}>
                        <div className="aw-act-ch"><span className={`aw-spy-dot ${m.st === 'on' ? 'on' : 'off'}`} />{m.name}{m.st === 'dead' && <span className="aw-act-dead">DEAD</span>}</div>
                        <div className="aw-act-row"><span>Deaths</span><b>{m.deaths} <small>({m.dph}/h)</small></b></div>
                        <div className="aw-act-row"><span>Last seen</span><b>{m.grid}</b></div>
                        <div className="aw-act-row"><span>Last moved</span><b>{m.moved}</b></div>
                      </div>
                    ))}
                  </div>
                  <div className="aw-tool-h" style={{ marginTop: 14 }}>ACTIVITY LOG</div>
                  <div className="aw-act-log">
                    {ACT_LOG.map((e, i) => <div className="aw-act-le" key={i}><span className={`aw-act-dot ${e.k}`} /><span className="aw-act-lbl">{e.label}{e.detail && <em> · {e.detail}</em>}</span><span className="aw-act-time">{e.time}</span></div>)}
                  </div>
                </>}
                {tool === 'loadout' && (() => {
                  const w = LO_WEAPONS[loWeapon]; const a = LO_ARMOR[loArmor];
                  const parts = [
                    { part: 'HEAD', mult: w.head, prot: a.head },
                    { part: 'CHEST', mult: 1.0, prot: a.chest },
                    { part: 'LEGS', mult: 0.75, prot: a.legs },
                  ].map((p) => { const dmg = w.dmg * p.mult * (1 - p.prot); const htk = Math.ceil(100 / dmg); return { ...p, dmg, htk, ttk: (htk - 1) * (60 / w.rpm) }; });
                  const maxDmg = Math.max(...parts.map((p) => p.dmg));
                  const oneShot = parts[0].dmg >= 100;
                  return <>
                    <div className="aw-tool-h"><Shield size={14} /> LOADOUT & DAMAGE LAB</div>
                    <div className="aw-lo-pick">{Object.entries(LO_WEAPONS).map(([k, v]) => <button key={k} className={loWeapon === k ? 'on' : ''} onClick={() => setLoWeapon(k)}><img src={icon(v.icon)} onError={hideErr} alt="" />{v.name.split(' ')[0]}</button>)}</div>
                    <div className="aw-lo-weapon"><img src={icon(w.icon)} onError={hideErr} alt="" /><div><b>{w.name}</b><small>{w.dmg} dmg · ×{w.head.toFixed(1)} head · {w.rpm} rpm</small></div></div>
                    <div className="aw-lo-armor"><span className="aw-lo-armor-lbl">VS ARMOR</span>{Object.entries(LO_ARMOR).map(([k, v]) => <button key={k} className={loArmor === k ? 'on' : ''} onClick={() => setLoArmor(k)}>{v.name.split(' ')[0]}</button>)}</div>
                    {parts.map((p) => (
                      <div className="aw-lo-hit" key={p.part}>
                        <div className="aw-lo-hit-h"><span className="aw-lo-part">{p.part}</span><span className="aw-lo-dmg">{p.dmg.toFixed(1)}<small> dmg</small></span></div>
                        <div className="aw-lo-bar"><span style={{ width: `${(p.dmg / maxDmg) * 100}%` }} /></div>
                        <div className="aw-lo-meta"><span>×{p.mult} {p.prot > 0 && `· −${Math.round(p.prot * 100)}% armor`}</span><span>{p.htk}× shots · {p.ttk.toFixed(2)}s</span></div>
                      </div>
                    ))}
                    <div className={`aw-lo-lethal ${oneShot ? '' : 'no'}`}>{oneShot ? '☠ One-shot headshot possible' : `${parts[0].htk} headshots to kill`}</div>
                  </>;
                })()}
                {tool === 'lookup' && <>
                  <div className="aw-tool-h"><Search size={14} /> PLAYER STEAMID LOOKUP</div>
                  <div className="aw-lk-search"><Search size={12} /> SteamID, SteamID64 or profile URL…<span className="aw-lk-btn">Search</span></div>
                  <div className="aw-lk-banner danger"><span>⚠ RED FLAGS / BANS CACHED</span></div>
                  <div className="aw-lk-flags"><span className="aw-lk-flag vac">VAC BANNED</span><span className="aw-lk-flag game">GAME BANS: 1</span><span className="aw-lk-flag report">RUST HACK REPORTED · 4d</span></div>
                  <div className="aw-lk-card">
                    <div className="aw-lk-av" style={{ background: '#3a4a5a' }}>S<span className="aw-lk-lvl">42</span></div>
                    <div className="aw-lk-info"><b>SketchyAce</b><span className="aw-lk-priv">public</span><div className="aw-lk-hrs"><Clock size={10} /> RUST: 84 hrs · <span className="aw-lk-playing">● PLAYING NOW</span></div></div>
                    <span className="aw-lk-risk high">HIGH · 82</span>
                  </div>
                  <div className="aw-lk-reasons">
                    <div className="aw-lk-reason"><span className="aw-lk-rdot" /> Active VAC ban on record</div>
                    <div className="aw-lk-reason"><span className="aw-lk-rdot" /> Flagged on @RustHackReport (4d ago)</div>
                    <div className="aw-lk-reason"><span className="aw-lk-rdot" /> 6/14 friends banned (43% — cheater cluster)</div>
                    <div className="aw-lk-reason"><span className="aw-lk-rdot" /> Low playtime: 84 hrs · 19 alias changes</div>
                  </div>
                  <div className="aw-lk-stats"><div><span className="l">K/D</span><span className="v" style={{ color: '#ce422b' }}>7.41</span></div><div><span className="l">HEADSHOT</span><span className="v" style={{ color: '#e8a838' }}>61%</span></div><div><span className="l">ACCURACY</span><span className="v" style={{ color: '#06b6d4' }}>44%</span></div><div><span className="l">BANNED FRIENDS</span><span className="v" style={{ color: '#ce422b' }}>6/14</span></div></div>
                </>}
                {tool === 'raidcost' && (() => {
                  const t = RC_TARGETS.find((x) => x.key === rcTarget) || RC_TARGETS[0];
                  const sorted = [...t.methods].sort((a, b) => a.sulfur - b.sulfur);
                  const best = sorted[0];
                  const maxS = Math.max(...sorted.map((m) => m.sulfur));
                  return <>
                    <div className="aw-tool-h"><Flame size={14} /> RAID COST CALCULATOR</div>
                    <div className="aw-rc-tabs">{RC_TARGETS.map((x) => <button key={x.key} className={rcTarget === x.key ? 'on' : ''} onClick={() => setRcTarget(x.key)}><img src={icon(x.icon)} onError={hideErr} alt="" />{x.name}</button>)}</div>
                    <div className="aw-rc-best">
                      <div className="aw-rc-best-h"><span className="aw-rc-best-tag"><Crown size={12} /> CHEAPEST</span><span className="aw-rc-best-hp">{t.hp.toLocaleString()} HP</span></div>
                      <div className="aw-rc-best-body">
                        <span className="aw-rc-best-cost"><img src={icon('sulfur')} onError={hideErr} alt="" /><b>{best.sulfur.toLocaleString()}</b> sulfur</span>
                        <span className="aw-rc-chip"><img src={icon(best.icon)} onError={hideErr} alt="" /><b>{best.count}×</b> {best.name}</span>
                      </div>
                    </div>
                    <div className="aw-tool-h" style={{ marginTop: 12 }}><Trophy size={13} /> RANKED METHODS</div>
                    {sorted.map((m, i) => (
                      <div className={`aw-rc-m ${i === 0 ? 'best' : ''}`} key={m.key}>
                        <span className={`aw-rc-rank ${i < 3 ? `r${i + 1}` : ''}`}>{i + 1}</span>
                        <img src={icon(m.icon)} onError={hideErr} alt="" />
                        <span className="aw-rc-mname">{m.name}{i === 0 && <span className="aw-rc-pill">BEST</span>}</span>
                        <div className="aw-rc-bar"><span style={{ width: `${(m.sulfur / maxS) * 100}%` }} /></div>
                        <span className="aw-rc-count">{m.count}×</span>
                        <span className="aw-rc-sulfur"><img src={icon('sulfur')} onError={hideErr} alt="" />{(m.sulfur / 1000).toFixed(1)}k</span>
                      </div>
                    ))}
                  </>;
                })()}
                {tool === 'marketindex' && (() => {
                  const maxU = MKT_SOLD[0][2];
                  return <>
                    <div className="aw-tool-h"><BarChart3 size={14} /> MARKET INDEX</div>
                    <p className="aw-tool-p">What's selling most + the low / avg / high prices recorded across every shop while connected.</p>
                    <div className="aw-mkt-sub"><Flame size={11} /> MOST SOLD ITEMS</div>
                    {MKT_SOLD.map(([ic, name, units], i) => (
                      <div className="aw-mkt-sold" key={ic}>
                        <span className={`aw-mkt-rank ${i < 3 ? `r${i + 1}` : ''}`}>{i + 1}</span>
                        <img src={icon(ic)} onError={hideErr} alt="" />
                        <span className="aw-mkt-name">{name}</span>
                        <div className="aw-mkt-bar"><span style={{ width: `${(units / maxU) * 100}%` }} /></div>
                        <b className="aw-mkt-units">{(units / 1000).toFixed(1)}k</b>
                      </div>
                    ))}
                    <div className="aw-mkt-sub" style={{ marginTop: 12 }}><BarChart3 size={11} /> PRICE INDEX</div>
                    <div className="aw-mkt-tbl">
                      <div className="aw-mkt-row aw-mkt-row-h"><span>Item</span><span><ArrowDown size={9} /> Low</span><span><Minus size={9} /> Avg</span><span><ArrowUp size={9} /> High</span></div>
                      {MKT_PRICES.map((p) => (
                        <div className="aw-mkt-row" key={p.name}>
                          <span className="aw-mkt-item"><img src={icon(p.icon)} onError={hideErr} alt="" /><span>{p.name}<small>{p.cur}</small></span></span>
                          <span className="aw-mkt-low">{p.low}</span><span className="aw-mkt-avg">{p.avg}</span><span className="aw-mkt-high">{p.high}</span>
                        </div>
                      ))}
                    </div>
                  </>;
                })()}
                {tool === 'combatlog' && <>
                  <div className="aw-tool-h"><Terminal size={14} /> COMBAT LOG ANALYZER</div>
                  <p className="aw-tool-p">Paste your in-game <code>combatlog</code> output for damage, accuracy & hit telemetry.</p>
                  <div className="aw-cl-metrics">
                    <div className="aw-cl-metric dealt"><span>Dealt</span><b>{CL_METRICS.dealt}</b></div>
                    <div className="aw-cl-metric taken"><span>Taken</span><b>{CL_METRICS.taken}</b></div>
                    <div className="aw-cl-metric"><span>K / D</span><b>{CL_METRICS.kills}/{CL_METRICS.deaths}</b></div>
                    <div className="aw-cl-metric"><span>Acc</span><b>{CL_METRICS.accuracy}%</b></div>
                    <div className="aw-cl-metric"><span>HS</span><b>{CL_METRICS.headshot}%</b></div>
                  </div>
                  <div className="aw-cl-sub"><Target size={11} /> HIT DISTRIBUTION</div>
                  {CL_HITS.map(([label, pct, k]) => (
                    <div className="aw-cl-hit" key={k as string}><span className="aw-cl-hl">{label}</span><div className="aw-cl-track"><div className={`aw-cl-fill ${k}`} style={{ width: `${pct}%` }} /></div><span className="aw-cl-hp">{pct as number}%</span></div>
                  ))}
                  <div className="aw-cl-sub" style={{ marginTop: 12 }}><Activity size={11} /> EVENT TIMELINE</div>
                  <div className="aw-cl-tl">{CL_EVENTS.map((e, i) => (
                    <div className={`aw-cl-ev ${e.tone}`} key={i}><span className="aw-cl-time">{e.time}</span><span className="aw-cl-evdot" /><span className="aw-cl-label">{e.label}</span><span className="aw-cl-weapon">{e.weapon}</span><span className={`aw-cl-evarea ${e.area}`}>{e.area}</span><span className="aw-cl-desc">{e.desc}</span></div>
                  ))}</div>
                </>}
                {tool === 'fishing' && <>
                  <div className="aw-tool-h"><Fish size={14} /> FISHING & FISH TRAPS</div>
                  <div className="aw-fish-facts">
                    <div className="aw-fish-fact"><Hammer size={13} /><div><span>Craft cost</span><b>200 Wood · 5 Cloth</b></div></div>
                    <div className="aw-fish-fact"><Gauge size={13} /><div><span>Durability</span><b>−10 / catch</b></div></div>
                    <div className="aw-fish-fact"><Waves size={13} /><div><span>Depth</span><b>Acts as 5m</b></div></div>
                  </div>
                  <div className="aw-tool-h" style={{ marginTop: 12 }}>BAIT REFERENCE</div>
                  <div className="aw-fish-tbl">
                    <div className="aw-fish-row aw-fish-row-h"><span>Bait</span><span>Lvl</span><span>Stack</span><span>Max</span></div>
                    {FISH_BAITS.map((b) => (
                      <div className="aw-fish-row" key={b.name}><span className="aw-fish-bait"><span className={`aw-fish-tier t${b.tier}`}>{b.tier}</span>{b.name}</span><span>{b.lvl}</span><span>{b.stack}</span><span className="aw-fish-max">{b.max}</span></div>
                    ))}
                  </div>
                  <div className="aw-fish-calc"><Calculator size={12} /> <span>30× Grub → effective level <b>10.5</b> · likely catch <b>Salmon &amp; Catfish</b></span></div>
                </>}
                {tool === 'farming' && <>
                  <div className="aw-tool-h"><Dna size={14} /> FARMING GENETIC SOLVER</div>
                  <p className="aw-tool-p">Find the planting grid that crossbreeds your clones into a target genotype.</p>
                  <div className="aw-farm-target">
                    <span className="aw-farm-lbl">TARGET</span>
                    {FARM_TARGET.map((g, i) => <span key={i} className={`aw-farm-pill ${FARM_GOOD.has(g) ? 'good' : 'bad'}`}>{g}</span>)}
                  </div>
                  <div className="aw-farm-banner"><Check size={13} /> Exact match — plant 3 neighbours</div>
                  <div className="aw-farm-grid">
                    {FARM_GRID.map((c, i) => {
                      if (!c) return <div className="aw-farm-cell empty" key={i} />;
                      const cls = c.type === 'target' ? 'center' : 'clone';
                      return (
                        <div className={`aw-farm-cell ${cls}`} key={i}>
                          <span className="aw-farm-cl">{c.label}</span>
                          <div className="aw-farm-seq">{c.genes.split('').map((g, j) => <span key={j} className={`aw-farm-pill sm ${FARM_GOOD.has(g) ? 'good' : 'bad'}`}>{g}</span>)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <ol className="aw-farm-steps"><li>Plant the surrounding neighbour clones.</li><li>Let them reach the sapling stage, then plant the centre.</li><li>It absorbs the winning genes — take cuttings immediately.</li></ol>
                </>}
                {!['cctv', 'recycler', 'pricewatch', 'cupboard', 'decay', 'crates', 'profit', 'richbase', 'activity', 'loadout', 'lookup', 'raidcost', 'marketindex', 'combatlog', 'fishing', 'farming'].includes(tool) && (
                  <div className="aw-tool-generic">
                    <div className="aw-tg-ico"><ToolIcon size={26} /></div>
                    <h3>{toolMeta?.[1]}</h3>
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
              {spyTab === 'history' ? (
                <div className="aw-spy-empty"><p>Search a player's cross-server history.</p><span>Pull any player's full BattleMetrics record — every server they play, ranked by time spent.</span></div>
              ) : sel && (
                <div className="aw-spy-body">
                  <div className="aw-spy-players">
                    {spyTab === 'enemies' && <div className="aw-spy-search"><Search size={11} /> Search BattleMetrics…</div>}
                    {spyList.map((p) => (
                      <button key={p.name} className={`aw-spy-p ${sel.name === p.name ? 'active' : ''}`} onClick={() => setSpySel(p.name)}>
                        <span className={`aw-spy-dot ${p.online ? 'on' : 'off'}`} /><span className="aw-spy-pn">{p.name}</span>
                        {p.group && <span className="aw-spy-pg" style={{ color: p.gc, background: `${p.gc}22`, borderColor: `${p.gc}66` }}>{p.group}</span>}
                        <span className="aw-spy-praid">{p.raid}</span>
                      </button>
                    ))}
                  </div>
                  <div className="aw-spy-detail">
                    <div className="aw-spy-dh">
                      <div><h2>{sel.name}</h2><span className="aw-spy-meta"><span className={`aw-spy-dot ${sel.online ? 'on' : 'off'}`} />{sel.last}</span></div>
                      <div className="aw-spy-raidbadge"><span className="l">LIKELY RAID WINDOW</span><span className="t">{sel.raid}</span></div>
                    </div>
                    <div className="aw-sec-lbl">DAILY ACTIVITY (AVG)</div>
                    <div className="aw-spy-hourly">
                      {hourly.map((v, h) => (
                        <div className="aw-spy-hcol" key={h} title={`${fmtHour(h)} · ${Math.round(v * 100)}%`}>
                          <div className="aw-spy-hbar" style={{ height: `${6 + v * 46}px`, background: heat(v) }} />
                          {h % 6 === 0 && <span className="aw-spy-hl">{fmtHour(h)}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="aw-sec-lbl" style={{ marginTop: 14 }}>WEEKLY PATTERN</div>
                    <div className="aw-heat">
                      <div className="aw-heat-hours"><span />{[0, 4, 8, 12, 16, 20].map((h) => <span key={h}>{fmtHour(h)}</span>)}</div>
                      {DAYS.map((day, d) => (
                        <div className="aw-heat-row" key={day}><span className="aw-heat-day">{day}</span><div className="aw-heat-cells">{Array.from({ length: 24 }, (_, h) => <div key={h} className="aw-heat-c" style={{ background: heat(bucket(sel.seed, d, h)) }} />)}</div></div>
                      ))}
                    </div>
                    <p className="aw-spy-note">{spyTab === 'team' ? 'Built passively from Rust+ team data over time — runs longer = sharper pattern.' : 'Built from BattleMetrics session history across servers.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="aw-status">
        <span className="aw-st-sweep" />
        <span className="aw-st-conn"><i /> CONNECTED</span>
        <span className="aw-st-sep">{stats.ms}MS</span>
        <span className="aw-st-srv">RAIDAR.TECH</span>
        <span className="aw-st-dim">· 2X SOLO/DUO/TRIO</span>
        <span className="aw-st-grow" />
        <span className="aw-st-ic"><ShoppingCart size={10} /> {stats.shops}</span>
        <span className="aw-st-day">DAY</span>
        <span className="aw-st-ic"><Users size={10} /> 3/5</span>
        <span className="aw-st-ic players">{stats.pop}/300</span>
        <span className="aw-st-clock">{time}</span>
      </div>
    </div>
  );
}
