import { useEffect, useState } from 'react';
import {
  Rocket, Map, ToggleRight, Zap, Wrench, Users, Eye, Bot,
  Terminal, Hash, ShieldCheck, HelpCircle, Info, Moon, Sun, Clock, Timer,
  ShieldAlert, PackageOpen, Boxes, Ship, Plane, Package, Waves, Store, Bell,
} from 'lucide-react';
import Reveal from '../components/Reveal';

interface Cmd { name: string; args?: string; desc: string; restricted?: boolean; }

const COMMANDS: Cmd[] = [
  { name: '/link', desc: 'Link this server from the Raidar app, or check the current link status.' },
  { name: '/unlink', desc: 'Disconnect the server and delete its stored credentials.', restricted: true },
  { name: '/status', desc: 'Server population, map, seed and last-wipe info.' },
  { name: '/pop', desc: 'Current online population with a live progress bar.' },
  { name: '/time', desc: 'In-game time and whether it’s day or night.' },
  { name: '/team', desc: 'Team members with online / dead / offline status and grid positions.' },
  { name: '/events', desc: 'Live map events — cargo ship, patrol heli, chinook and locked crates.' },
  { name: '/devices', desc: 'List paired smart devices and their current on/off state.' },
  { name: '/control', desc: 'Open a button panel to toggle Smart Switches with one tap.', restricted: true },
  { name: '/toggle', args: 'device state', desc: 'Turn a specific Smart Switch on or off.', restricted: true },
  { name: '/say', args: 'message', desc: 'Send a message to in-game team chat from Discord.', restricted: true },
  { name: '/alarms', args: 'mode', desc: 'Set or clear the current channel for alarm & event notifications.', restricted: true },
  { name: '/channels', desc: 'Create the Raidar category and notification channels automatically.', restricted: true },
  { name: '/test', desc: 'Send a test notification to your configured alert channels.', restricted: true },
];

const TRIGGERS: Array<{ Icon: typeof Moon; group: string; label: string; desc: string }> = [
  { Icon: Moon, group: 'Time', label: 'Nightfall', desc: 'When the sun sets in-game.' },
  { Icon: Sun, group: 'Time', label: 'Daybreak', desc: 'When the sun rises in-game.' },
  { Icon: Clock, group: 'Time', label: 'Specific hour', desc: 'At a chosen in-game hour (0–23).' },
  { Icon: Timer, group: 'Schedule', label: 'Repeat interval', desc: 'Every N seconds, minutes or hours.' },
  { Icon: ShieldAlert, group: 'Base & storage', label: 'Upkeep running low', desc: 'TC upkeep drops below N hours left.' },
  { Icon: PackageOpen, group: 'Base & storage', label: 'Item running low', desc: 'A monitored box/TC holds fewer than N of an item.' },
  { Icon: Boxes, group: 'Base & storage', label: 'Item stocked up', desc: 'A monitored box/TC holds more than N of an item.' },
  { Icon: Ship, group: 'World events', label: 'Cargo spawns / leaves', desc: 'The cargo ship appears on, or sails off, the map.' },
  { Icon: Plane, group: 'World events', label: 'Patrol heli / Chinook', desc: 'The patrol heli arrives, is downed, or a CH47 enters the map.' },
  { Icon: Package, group: 'World events', label: 'Locked / oil rig crate', desc: 'A locked crate spawns, or an oil rig crate is hacked / unlocked.' },
  { Icon: Store, group: 'World events', label: 'Travelling vendor', desc: 'The travelling vendor appears.' },
  { Icon: Waves, group: 'World events', label: 'Deep Sea opens', desc: 'The Deep Sea event begins.' },
  { Icon: Bell, group: 'Base alerts', label: 'Smart alarm', desc: 'A Smart Alarm push fires — optionally filtered to a named alarm.' },
];

const TOOLS: Array<{ group: string; name: string; desc: string }> = [
  { group: 'Base & defense', name: 'Cupboard', desc: 'Live TC upkeep timer and storage fill read straight from a paired Storage Monitor.' },
  { group: 'Base & defense', name: 'Decay', desc: 'Tracks decay timers on monitored structures so nothing rots while you’re offline.' },
  { group: 'Raiding', name: 'Locked Crates', desc: 'Tracks locked crate spawns and hackable crate timers across the map.' },
  { group: 'Raiding', name: 'Raid Cost', desc: 'Cheapest verified way to break any structure — ranked by sulfur, with explosive / fire / melee / siege modes, soft-side, quantity, full shopping list and craft / fuse / use times. Share to team chat or Discord.' },
  { group: 'Raiding', name: 'Loadout Lab', desc: 'Build and cost out raid / PvP loadouts before you commit.' },
  { group: 'Raiding', name: 'Recycler', desc: 'Calculates the exact yield from recycling any set of components.' },
  { group: 'Intel', name: 'Price Watch', desc: 'Watch vending machine prices for specific items and get alerted when good deals appear.' },
  { group: 'Intel', name: 'Profit Scan', desc: 'Finds profitable two-step vending arbitrage loops across every shop on the map, capped to a single trip’s inventory. Click a step to jump to it on the map.' },
  { group: 'Intel', name: 'Rich Bases', desc: 'Surfaces the highest-value bases worth scouting.' },
  { group: 'Intel', name: 'CCTV Codes', desc: 'Full directory of monument CCTV camera codes.' },
  { group: 'Intel', name: 'Activity', desc: 'A running feed of everything happening on your server.' },
  { group: 'Intel', name: 'Player Lookup', desc: 'Look up any player — profile, server history and ban status.' },
];

const CHANNELS: Array<[string, string]> = [
  ['raidar-alarms', 'Base alarms, Smart Alarm triggers and your own TC decay warnings.'],
  ['raidar-events', 'Cargo ship, patrol heli, chinook, deep-sea heli and the travelling vendor.'],
  ['raidar-crates', 'Locked crate spawns and hackable crate openings.'],
  ['raidar-decay', 'Decay warnings for monitored structures.'],
  ['raidar-shops', 'Vending machine price watches and newly opened shops.'],
  ['raidar-spy', 'Player online / offline tracking for watched enemies.'],
  ['raidar-bans', 'Steam account ban alerts for tracked players.'],
];

const SECTIONS = [
  { id: 'getting-started', label: 'Getting started', Icon: Rocket },
  { id: 'live-map', label: 'Live tactical map', Icon: Map },
  { id: 'devices', label: 'Smart devices', Icon: ToggleRight },
  { id: 'automation', label: 'Switch automation', Icon: Zap },
  { id: 'tools', label: 'Utility tools', Icon: Wrench },
  { id: 'team', label: 'Team & comms', Icon: Users },
  { id: 'tracking', label: 'Intel & tracking', Icon: Eye },
  { id: 'discord-bot', label: 'Discord bot', Icon: Bot },
  { id: 'commands', label: 'Command reference', Icon: Terminal },
  { id: 'channels', label: 'Notification channels', Icon: Hash },
  { id: 'permissions', label: 'Permissions', Icon: ShieldCheck },
  { id: 'faq', label: 'FAQ', Icon: HelpCircle },
];

export default function Docs() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="docs-page">
      <header className="docs-hero">
        <div className="container">
          <span className="hud-label hud-label--accent">// Field manual</span>
          <h1>Everything Raidar can do</h1>
          <p>From the live tactical map to programmable switch automation and the Discord bot — the complete guide to running your wipe.</p>
          <div className="docs-jump">
            {SECTIONS.map(({ id, label, Icon }) => (
              <a key={id} href={`#${id}`}><Icon size={13} /> {label}</a>
            ))}
          </div>
        </div>
      </header>

      <div className="docs">
      <aside className="docs-side">
        <h4>Documentation</h4>
        <nav>
          {SECTIONS.map(({ id, label, Icon }) => (
            <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>
              <Icon /> {label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="docs-body">
        {/* ── Getting started ── */}
        <section id="getting-started" className="doc-section">
          <span className="hud-label hud-label--accent">// Overview</span>
          <h1>Getting started</h1>
          <p>
            Raidar is a tactical overlay and Discord companion for Rust+. It connects to your in-game
            server through the official Rust+ protocol and surfaces everything that matters — your
            team, every world event, base alarms, smart devices and market intel — on your desktop
            and inside your Discord server. It never touches game files, so it’s safe to run alongside Rust.
          </p>
          <ol className="doc-steps">
            <li><strong>Download the desktop app</strong> for Windows and pair it with your Rust+ account.</li>
            <li><strong>Connect to your server</strong> from inside the app — switching servers is seamless and updates Discord too.</li>
            <li><strong>Pair smart devices</strong> in-game (hold <code>E</code> on a device → Pair) to control and automate them.</li>
            <li><strong>Link Discord</strong> by running <code>/link</code> and pasting the code into the app.</li>
          </ol>
        </section>

        {/* ── Live map ── */}
        <section id="live-map" className="doc-section">
          <span className="hud-label hud-label--accent">// The map</span>
          <h2>Live tactical map</h2>
          <p>
            The heart of Raidar. A real-time map of your server projected on the exact in-game grid,
            so a callout in the app is a callout your team understands instantly.
          </p>
          <Reveal><div className="doc-feature-row">
            <img src="/images/markers/cargo.png" alt="Cargo ship" loading="lazy" />
            <div><h3>World events</h3><p>Cargo ship, patrol heli, Chinook (CH47), locked crates, oil rig crates, the travelling vendor, Deep Sea and explosions — each tracked from spawn to despawn with live grid call-outs.</p></div>
          </div></Reveal>
          <Reveal><div className="doc-feature-row">
            <img src="/images/monuments/launch_site.jpg" alt="Monuments" loading="lazy" />
            <div><h3>Monuments &amp; caves</h3><p>Every monument and cave is mapped with imagery and info panels, so new players learn the map fast and veterans plan rotations.</p></div>
          </div></Reveal>
          <p>
            <strong>Team awareness:</strong> live teammate positions with online, dead and offline
            states and their current grid. <strong>Click any marker</strong> — a shop, monument or
            event — to open a detail panel with everything Raidar knows about it.
          </p>
        </section>

        {/* ── Smart devices ── */}
        <section id="devices" className="doc-section">
          <span className="hud-label hud-label--accent">// Control</span>
          <h2>Smart devices</h2>
          <p>
            Pair a Smart Switch, Smart Alarm or Storage Monitor in-game (look at the device, hold
            <code>E</code>, choose <strong>Pair</strong>) and it appears in Raidar instantly.
          </p>
          <div className="cmd-table">
            <div className="cmd-row"><code className="cmd-name">Smart Switch</code><span className="cmd-desc">Toggle ON/OFF from the app or Discord. The backbone of automation — wire it to lights, turrets, doors or alarms.</span></div>
            <div className="cmd-row"><code className="cmd-name">Smart Alarm</code><span className="cmd-desc">Fires a raid alert to your overlay and Discord the instant it’s triggered. Can drive automations too.</span></div>
            <div className="cmd-row"><code className="cmd-name">Storage Monitor</code><span className="cmd-desc">Reads TC upkeep remaining (days/hours, with a decaying warning) and storage slots filled (x/30). Feeds the upkeep & item triggers below.</span></div>
          </div>
          <div className="doc-callout"><Info /><div>
            <strong>Multi-server control.</strong> Devices from other servers stay in your list and can be
            toggled remotely — flip a switch on last wipe’s base without leaving your current server.
            Raidar also auto-detects destroyed devices and offers to clear them.
          </div></div>
        </section>

        {/* ── Switch automation ── */}
        <section id="automation" className="doc-section">
          <span className="hud-label hud-label--accent">// Programmable switches</span>
          <h2>Switch automation</h2>
          <p>
            This is where Raidar pulls ahead. Program any Smart Switch with a simple
            <strong> when this happens → do this → only if</strong> rule. Lights that come on at dusk,
            a siren that pulses on a raid alarm, a furnace that cuts off when wood runs low, a heli
            beacon that flares when the patrol heli spawns — all hands-free.
          </p>

          <h3>1 · Triggers — “when this happens”</h3>
          <div className="cmd-table">
            {TRIGGERS.map((t) => (
              <div className="cmd-row" key={t.label}>
                <code className="cmd-name" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><t.Icon size={14} /> {t.label}</code>
                <span className="cmd-desc">{t.desc} <span className="pill pill-restricted">{t.group}</span></span>
              </div>
            ))}
          </div>

          <h3>2 · Actions — “do this”</h3>
          <div className="cmd-table">
            <div className="cmd-row"><code className="cmd-name">Turn ON</code><span className="cmd-desc">Switch the device on.</span></div>
            <div className="cmd-row"><code className="cmd-name">Turn OFF</code><span className="cmd-desc">Switch the device off.</span></div>
            <div className="cmd-row"><code className="cmd-name">Toggle</code><span className="cmd-desc">Flip to the opposite state.</span></div>
            <div className="cmd-row"><code className="cmd-name">Pulse</code><span className="cmd-desc">Turn ON for N seconds, then automatically OFF — perfect for sirens and beacons.</span></div>
          </div>

          <h3>3 · Conditions — “only if” (optional)</h3>
          <p>
            Gate any rule on live storage data: only fire if upkeep is below/above a threshold, or if
            an item’s count is below/above a number, read from a paired Storage Monitor. Stack a
            trigger and a condition to build genuinely smart behavior.
          </p>

          <h3>Quick-start presets</h3>
          <p>One tap pre-fills a complete rule. Built-in presets include:</p>
          <ul className="doc-steps">
            <li><strong>Base lights at night</strong> — lights ON at nightfall, OFF at daybreak.</li>
            <li><strong>Low upkeep warning</strong> — a light turns ON when TC upkeep drops under 12h.</li>
            <li><strong>Raid alarm siren</strong> — a siren pulses 30s whenever a Smart Alarm fires.</li>
            <li><strong>Furnace auto-off</strong> — furnaces cut off when wood runs low.</li>
            <li><strong>Heli alert beacon</strong> — a beacon pulses 15s when the patrol heli spawns.</li>
          </ul>
          <div className="doc-callout"><Info /><div>
            Every rule shows a plain-English live preview as you build it, and each automation can be
            paused or deleted at any time. Automations run per-server against switches on the connected server.
          </div></div>
        </section>

        {/* ── Tools ── */}
        <section id="tools" className="doc-section">
          <span className="hud-label hud-label--accent">// Utility tools</span>
          <h2>Utility tools</h2>
          <p>A full toolbox of raiding and intel utilities, grouped by job.</p>
          {['Base & defense', 'Raiding', 'Intel'].map((group) => (
            <div key={group}>
              <h3>{group}</h3>
              <div className="cmd-table">
                {TOOLS.filter((t) => t.group === group).map((t) => (
                  <div className="cmd-row" key={t.name}>
                    <code className="cmd-name">{t.name}</code>
                    <span className="cmd-desc">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Team ── */}
        <section id="team" className="doc-section">
          <span className="hud-label hud-label--accent">// Coordination</span>
          <h2>Team &amp; comms</h2>
          <p>
            See your whole team at a glance — who’s online, who’s dead, and where everyone is by grid.
            Read and send <strong>in-game team chat straight from the app</strong> (and from Discord
            with <code>/say</code>), so the person on overwatch can call shots without alt-tabbing into Rust.
          </p>
        </section>

        {/* ── Tracking ── */}
        <section id="tracking" className="doc-section">
          <span className="hud-label hud-label--accent">// Intel & tracking</span>
          <h2>Intel &amp; tracking</h2>
          <div className="doc-feature-row">
            <img src="/images/monuments/oil_rig_large.webp" alt="Market intel" loading="lazy" />
            <div><h3>Market intel</h3><p>Track vending machines map-wide, watch prices on the items you care about, see which shops are selling the most, and get alerted the moment new shops open.</p></div>
          </div>
          <p><strong>Enemy spy tracker:</strong> watch specific players and get notified when they come online or go offline — know exactly when a base is empty.</p>
          <p><strong>Ban tracker:</strong> add Steam accounts and Raidar alerts you when any of them is game-banned, so you know who got caught.</p>
        </section>

        {/* ── Discord bot ── */}
        <section id="discord-bot" className="doc-section">
          <span className="hud-label hud-label--accent">// In your server</span>
          <h2>Discord bot</h2>
          <p>
            The Raidar Discord bot mirrors your app into your server. The desktop app routes events to
            the bot, which formats them into rich embeds and posts them to dedicated channels.
            Commands let your whole team check status, control devices and stay in sync — without
            anyone needing the app open.
          </p>
          <h3>Setup</h3>
          <ol className="doc-steps">
            <li><strong>Invite the bot</strong> to your server with the Manage Channels permission.</li>
            <li>Run <code>/link</code> — the bot replies with a private code.</li>
            <li>Open <strong>Raidar → Settings → Discord Integration</strong> and paste the code.</li>
            <li>Run <code>/channels</code> to auto-create the Raidar category, then choose a per-feature or single-channel layout.</li>
          </ol>
          <div className="doc-callout"><Info /><div>
            <strong>One server, one link.</strong> Each Discord server links to a single Rust server, and
            switching servers in the app updates the link automatically. On first join the bot creates a
            <strong> Raidar</strong> category with a setup channel explaining the next steps.
          </div></div>
        </section>

        {/* ── Commands ── */}
        <section id="commands" className="doc-section">
          <span className="hud-label hud-label--accent">// Slash commands</span>
          <h2>Command reference</h2>
          <p>Commands marked <span className="pill pill-restricted">restricted</span> require the control role or server-manage permission. Everything else is open to your whole server.</p>
          <div className="cmd-table">
            {COMMANDS.map((c) => (
              <div className="cmd-row" key={c.name}>
                <code className="cmd-name">{c.name}{c.args ? <span className="cmd-args"> {c.args}</span> : null}</code>
                <span className="cmd-desc">{c.desc}{c.restricted && <span className="pill pill-restricted">restricted</span>}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Channels ── */}
        <section id="channels" className="doc-section">
          <span className="hud-label hud-label--accent">// Routing</span>
          <h2>Notification channels</h2>
          <p>In per-feature mode, Raidar provisions a dedicated channel for each kind of alert:</p>
          <div className="cmd-table">
            {CHANNELS.map(([name, desc]) => (
              <div className="cmd-row" key={name}>
                <code className="cmd-name">#{name}</code>
                <span className="cmd-desc">{desc}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16 }}>Prefer a single channel? Choose the single-channel layout from the setup message and everything routes to one place. Empty Raidar channels are cleaned up automatically.</p>
        </section>

        {/* ── Permissions ── */}
        <section id="permissions" className="doc-section">
          <span className="hud-label hud-label--accent">// Access control</span>
          <h2>Permissions &amp; whitelisting</h2>
          <p>
            Device-control commands (<code>/control</code>, <code>/toggle</code>) are restricted to
            trusted members. From <strong>Raidar → Settings → Discord Integration</strong> you can
            whitelist specific Discord members per server for device control, so only your team can
            flip your switches — even if the channel is public.
          </p>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="doc-section">
          <span className="hud-label hud-label--accent">// Questions</span>
          <h2>FAQ</h2>
          <div className="doc-faq">
            <details><summary>Do I need to keep the app open?</summary><p>The app routes live events to the bot and runs your automations, so keep it running for continuous notifications. Read-only commands like <code>/status</code> connect on demand even when it’s closed.</p></details>
            <details><summary>Is it safe to run with Rust?</summary><p>Yes. Raidar uses the official Rust+ companion protocol and never reads or modifies game files, so it can’t trip anti-cheat.</p></details>
            <details><summary>Can I control devices on more than one server?</summary><p>Yes. Devices from other servers stay in your list and can be toggled remotely. Live automation runs against the server you’re currently connected to.</p></details>
            <details><summary>Is Raidar affiliated with Facepunch?</summary><p>No. Raidar is an independent companion app and is not affiliated with or endorsed by Facepunch Studios.</p></details>
          </div>
        </section>
      </article>
      </div>
    </div>
  );
}
