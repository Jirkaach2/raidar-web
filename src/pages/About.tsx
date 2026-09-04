import { Link } from 'react-router-dom';
import { Mail, Building2, Cpu, Users, Milestone } from 'lucide-react';

/**
 * Company page. Exists because credit/startup program reviewers look for a
 * named entity, a stated mission, a defined product scope and real contact
 * routes — the absence of which reads as "hobby project".
 *
 * Everything stated here is factual: no headcount, funding or customer
 * numbers are claimed.
 */

const FACTS = [
  { Icon: Building2, k: 'Entity', v: 'Independent, bootstrapped software venture' },
  { Icon: Users, k: 'Team', v: 'Founder-led — Jiří Š., lead developer' },
  { Icon: Cpu, k: 'Product', v: 'Desktop client, web portal, Discord bot, push daemon' },
  { Icon: Milestone, k: 'Status', v: 'In production, publicly released' },
];

export default function About() {
  return (
    <div className="container doc-page">
      <header className="doc-head">
        <span className="hud-label hud-label--accent">// Company</span>
        <h1>About Raidar</h1>
        <p className="lead">
          Raidar builds real-time intelligence tooling for competitive multiplayer survival
          games. We turn the data games already expose through their official companion APIs
          into something a squad can actually act on: a live tactical map, programmable base
          automation, market intelligence and raid planning.
        </p>
      </header>

      <section className="about-facts">
        {FACTS.map(({ Icon, k, v }) => (
          <div className="about-fact bracketed" key={k}>
            <div className="about-fact-ic"><Icon size={17} /></div>
            <div>
              <span className="hud-label">{k}</span>
              <p>{v}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="doc-section">
        <h2>What we're building</h2>
        <p>
          Survival games generate an enormous amount of state that players are expected to
          track by hand — base decay timers, upkeep, world event spawns, market prices, team
          positions. The official companion APIs expose a slice of it, but as raw data with no
          tooling around it.
        </p>
        <p>
          Raidar is the tooling layer. It ingests that telemetry, keeps it live over
          WebSockets, and presents it as an operational picture across four surfaces: a
          desktop client for the player at the keyboard, a Discord bot for the rest of the
          squad, a push daemon for when nobody's online, and a web portal for accounts and
          configuration.
        </p>
        <p>
          We start with Rust because it has the largest concurrent player base with an official
          companion API, and the architecture generalizes to other titles in the extraction and
          survival genre.
        </p>
      </section>

      <section className="doc-section">
        <h2>How we build it</h2>
        <p>
          The client is a Tauri v2 shell over a Rust core with a React 19 interface — chosen so
          the overlay stays lightweight while the game is running. The backend is Appwrite with
          WebSocket relays for live event fan-out. Integrations run against the official Rust+
          API, the Discord API and Firebase Cloud Messaging.
        </p>
        <p>
          Raidar operates entirely through official companion APIs and a transparent OS overlay
          layer. It performs no memory injection and does not modify game files. Installers are
          code-signed and every published build's hash is submitted to multi-engine malware
          scanners — see the <Link to="/security">security page</Link> for details and the{' '}
          <Link to="/status">status page</Link> for live service health.
        </p>
      </section>

      <section className="doc-section">
        <h2>Contact</h2>
        <div className="about-contact">
          <a className="btn btn-ghost btn-sm" href="mailto:team@raidar.tech">
            <Mail size={14} /> team@raidar.tech
          </a>
          <a className="btn btn-ghost btn-sm" href="mailto:support@raidar.tech">
            <Mail size={14} /> support@raidar.tech
          </a>
          <a className="btn btn-ghost btn-sm" href="mailto:security@raidar.tech">
            <Mail size={14} /> security@raidar.tech
          </a>
        </div>
        <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
          Raidar is an independent project and is not affiliated with or endorsed by Facepunch
          Studios.
        </p>
      </section>
    </div>
  );
}
