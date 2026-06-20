import { useEffect, useState } from 'react';
import {
  Rocket, LayoutGrid, Bot, Settings2, Terminal, Hash, ShieldCheck, HelpCircle, Info,
} from 'lucide-react';

interface Cmd { name: string; args?: string; desc: string; tag?: 'restricted' | 'owner'; }

const PUBLIC_CMDS: Cmd[] = [
  { name: '/link', desc: 'Link this server from the Raidar app, or check the current link status.' },
  { name: '/unlink', desc: 'Disconnect the server and delete its stored credentials.', tag: 'restricted' },
  { name: '/status', desc: 'Server population, map, seed and last-wipe info.' },
  { name: '/pop', desc: 'Current online population with a live progress bar.' },
  { name: '/time', desc: 'In-game time and whether it’s day or night.' },
  { name: '/team', desc: 'Team members with online / dead / offline status and grid positions.' },
  { name: '/events', desc: 'Live map events — cargo ship, patrol heli, chinook and locked crates.' },
  { name: '/devices', desc: 'List paired smart devices and their current on/off state.' },
  { name: '/control', desc: 'Open a button panel to toggle Smart Switches with one tap.', tag: 'restricted' },
  { name: '/toggle', args: 'device state', desc: 'Turn a specific Smart Switch on or off.', tag: 'restricted' },
  { name: '/say', args: 'message', desc: 'Send a message to in-game team chat from Discord.', tag: 'restricted' },
  { name: '/alarms', args: 'mode', desc: 'Set or clear the current channel for alarm & event notifications.', tag: 'restricted' },
  { name: '/channels', desc: 'Create the Raidar category and notification channels automatically.', tag: 'restricted' },
  { name: '/test', desc: 'Send a test notification to your configured alert channels.', tag: 'restricted' },
];

const OWNER_CMDS: Cmd[] = [
  { name: '/usage', desc: 'Bot host VM statistics — memory, swap, disk, CPU load and uptime.', tag: 'owner' },
  { name: '/servers', desc: 'List every server the bot is in, with link and connection status.', tag: 'owner' },
  { name: '/broadcast', args: 'message', desc: 'Send an announcement to every linked server.', tag: 'owner' },
  { name: '/reconnect', args: '[guild]', desc: 'Force-reconnect Rust+ for one server, or all of them.', tag: 'owner' },
  { name: '/leave', args: 'guild', desc: 'Make the bot leave a server and wipe its data.', tag: 'owner' },
  { name: '/restart', desc: 'Restart the bot process.', tag: 'owner' },
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

const APP_FEATURES = [
  { img: '/images/markers/cargo.png', title: 'Live tactical map', desc: 'Real-time team, monuments, caves, the travelling vendor and active events, projected on in-game grids.' },
  { img: '/images/markers/patrol_heli_full.png', title: 'Event tracking', desc: 'Cargo, patrol heli, chinook and crates tracked from spawn to despawn with grid call-outs.' },
  { img: '/images/markers/locked_crate.webp', title: 'Locked crates', desc: 'Get notified on locked crate spawns and hackable crate openings, anywhere on the map.' },
  { img: '/images/monuments/oil_rig_large.webp', title: 'Monument intel', desc: 'Every monument mapped with imagery so new players learn the map fast.' },
];

const SECTIONS = [
  { id: 'getting-started', label: 'Getting started', Icon: Rocket },
  { id: 'app-features', label: 'App features', Icon: LayoutGrid },
  { id: 'discord-bot', label: 'Discord bot', Icon: Bot },
  { id: 'bot-setup', label: 'Bot setup', Icon: Settings2 },
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
      { rootMargin: '-35% 0px -55% 0px' },
    );
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
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
        <section id="getting-started" className="doc-section">
          <span className="hud-label hud-label--accent">// Overview</span>
          <h1>Getting started</h1>
          <p>
            Raidar is a tactical overlay and Discord companion for Rust+. It connects to your in-game
            server through Rust+ and surfaces everything that matters — your team, map events, base
            alarms and smart devices — both on your desktop and inside your Discord server.
          </p>
          <ol className="doc-steps">
            <li><strong>Download the desktop app</strong> for Windows and pair it with your Rust+ account.</li>
            <li><strong>Connect to your server</strong> from inside the app.</li>
            <li><strong>Link Discord</strong> by running <code>/link</code> and pasting the code into the app.</li>
          </ol>
        </section>

        <section id="app-features" className="doc-section">
          <span className="hud-label hud-label--accent">// The desktop app</span>
          <h2>App features</h2>
          <p>The app is your command center. Everything updates live as your Rust+ server reports it.</p>
          {APP_FEATURES.map((f) => (
            <div className="doc-feature-row" key={f.title}>
              <img src={f.img} alt={f.title} loading="lazy" />
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
          <h3>Also included</h3>
          <p>
            Shop &amp; price intel (best-selling shops, price watches), raid cost calculator and loot
            tables, enemy online/offline spy tracking, and Steam ban alerts for tracked players.
          </p>
        </section>

        <section id="discord-bot" className="doc-section">
          <span className="hud-label hud-label--accent">// In your server</span>
          <h2>Discord bot</h2>
          <p>
            The Raidar Discord bot mirrors your app into your server. The desktop app routes events
            to the bot, which formats them into rich embeds and posts them to dedicated channels.
            Commands let your whole team check status, control devices and stay in sync — without
            anyone needing the app open.
          </p>
          <div className="doc-callout">
            <Info />
            <div><strong>One server, one link.</strong> Each Discord server links to a single Rust server.
            Switching servers in the app updates the link in Discord automatically.</div>
          </div>
        </section>

        <section id="bot-setup" className="doc-section">
          <span className="hud-label hud-label--accent">// Setup</span>
          <h2>Bot setup</h2>
          <ol className="doc-steps">
            <li><strong>Invite the bot</strong> to your server with the Manage Channels permission.</li>
            <li>Run <code>/link</code> — the bot replies with a private code.</li>
            <li>Open <strong>Raidar → Settings → Discord Integration</strong> and paste the code.</li>
            <li>Run <code>/channels</code> to auto-create the Raidar category, then pick a per-feature or single-channel layout.</li>
          </ol>
          <div className="doc-callout">
            <Info />
            <div>On its first join the bot creates a <strong>Raidar</strong> category with a setup channel
            explaining the next steps — no manual configuration needed.</div>
          </div>
        </section>

        <section id="commands" className="doc-section">
          <span className="hud-label hud-label--accent">// Slash commands</span>
          <h2>Command reference</h2>
          <p>Commands marked <span className="pill pill-restricted">restricted</span> require the control role or server-manage permission.</p>
          <div className="cmd-table">
            {PUBLIC_CMDS.map((c) => (
              <div className="cmd-row" key={c.name}>
                <code className="cmd-name">{c.name}{c.args ? <span className="cmd-args"> {c.args}</span> : null}</code>
                <span className="cmd-desc">{c.desc}{c.tag === 'restricted' && <span className="pill pill-restricted">restricted</span>}</span>
              </div>
            ))}
          </div>
          <h3>Owner commands</h3>
          <p>These are tied to the bot owner’s Discord ID and hidden from everyone else.</p>
          <div className="cmd-table">
            {OWNER_CMDS.map((c) => (
              <div className="cmd-row" key={c.name}>
                <code className="cmd-name">{c.name}{c.args ? <span className="cmd-args"> {c.args}</span> : null}</code>
                <span className="cmd-desc">{c.desc}<span className="pill pill-owner">owner</span></span>
              </div>
            ))}
          </div>
        </section>

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
          <p style={{ marginTop: 16 }}>Prefer a single channel? Choose the single-channel layout from the setup message and everything routes to one place.</p>
        </section>

        <section id="permissions" className="doc-section">
          <span className="hud-label hud-label--accent">// Access control</span>
          <h2>Permissions &amp; whitelisting</h2>
          <p>
            Device-control commands (<code>/control</code>, <code>/toggle</code>) are restricted to
            trusted members. From <strong>Raidar → Settings → Discord Integration</strong> you can
            whitelist specific Discord members per server for device control, so only your team can
            flip your switches.
          </p>
        </section>

        <section id="faq" className="doc-section">
          <span className="hud-label hud-label--accent">// Questions</span>
          <h2>FAQ</h2>
          <div className="doc-faq">
            <details><summary>Do I need to keep the app open?</summary><p>The app routes live events to the bot. For continuous notifications keep it running; commands like <code>/status</code> connect on demand.</p></details>
            <details><summary>Can I link more than one Rust server?</summary><p>Each Discord server links to one Rust server at a time. Higher plans allow more linked servers across your account.</p></details>
            <details><summary>Is Raidar affiliated with Facepunch?</summary><p>No. Raidar is an independent companion app and is not affiliated with or endorsed by Facepunch Studios.</p></details>
          </div>
        </section>
      </article>
    </div>
  );
}
