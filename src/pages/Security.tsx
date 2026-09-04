import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, FileCheck, Ban, KeyRound, Mail, ExternalLink } from 'lucide-react';

/**
 * Public security posture page.
 *
 * The live installer-hash lookups and multi-engine scan results already live
 * on /status; this page states the policy and architecture around them so a
 * reviewer (or a cautious user) can assess the product without running it.
 */

const POSTURE = [
  {
    Icon: Ban,
    title: 'No memory injection, no modified game files',
    body:
      'Raidar reads game state exclusively through the official Rust+ companion API over an authenticated WebSocket. It does not attach to the game process, read or write game memory, inject code, or alter any game file. The in-game display is a transparent OS-level overlay window.',
  },
  {
    Icon: FileCheck,
    title: 'Code-signed builds with published hashes',
    body:
      'Every release ships as a code-signed Windows installer. The SHA-256 of the current installer is published on the status page and submitted to VirusTotal and OPSWAT MetaDefender, so you can verify the binary you downloaded is the binary we published.',
  },
  {
    Icon: Lock,
    title: 'Encrypted transport end to end',
    body:
      'All traffic between the desktop client, the cloud backend, the Discord bot and the push daemon runs over TLS/WSS. Rust+ pairing tokens and session credentials are never transmitted in plaintext.',
  },
  {
    Icon: KeyRound,
    title: 'Secrets stay server-side',
    body:
      'Payment processing runs through Stripe Checkout driven by server-side functions — the Stripe secret key never reaches the browser. Authentication and session management are handled by Appwrite; we do not store passwords ourselves.',
  },
];

export default function Security() {
  return (
    <div className="container doc-page">
      <header className="doc-head">
        <span className="hud-label hud-label--accent">// Security</span>
        <h1>Security &amp; integrity</h1>
        <p className="lead">
          Raidar runs alongside a game that people care about not getting banned from, and it
          asks for an installer on your machine. Both deserve an explanation rather than a
          reassurance. Live installer scan results are on the{' '}
          <Link to="/status">status page</Link>.
        </p>
      </header>

      <section className="security-posture">
        {POSTURE.map(({ Icon, title, body }) => (
          <article className="posture-card bracketed" key={title}>
            <div className="posture-ic"><Icon size={19} /></div>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="doc-section">
        <h2>Anti-cheat position</h2>
        <p>
          Raidar is designed to stay on the correct side of anti-cheat enforcement by
          construction, not by evasion. It uses the same official companion API that the
          first-party Rust+ mobile app uses, which is explicitly provided by the game
          developer for exactly this purpose: reading team positions, base device state and
          server events from outside the game client.
        </p>
        <p>
          Because there is no process attachment and no memory access, there is nothing for
          EAC or BattlEye to detect — the client is, from the game's perspective, an ordinary
          desktop application making authenticated API calls.
        </p>
      </section>

      <section className="doc-section">
        <h2>Data we handle</h2>
        <ul className="scope-list">
          <li><ShieldCheck /> Account email and authentication state, held by Appwrite</li>
          <li><ShieldCheck /> Rust+ pairing tokens, used to authenticate against the companion API</li>
          <li><ShieldCheck /> Linked server and device configuration you create</li>
          <li><ShieldCheck /> Discord server and channel IDs for alert routing</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          Full detail on retention and third-party processors is in the{' '}
          <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>

      <section className="doc-section">
        <h2>Reporting a vulnerability</h2>
        <p>
          If you find a security issue, email{' '}
          <a href="mailto:security@raidar.tech">security@raidar.tech</a> with enough detail to
          reproduce it. Please don't open a public issue for anything exploitable. We'll
          acknowledge reports and keep you updated while we work on a fix.
        </p>
        <div className="about-contact">
          <a className="btn btn-ghost btn-sm" href="mailto:security@raidar.tech">
            <Mail size={14} /> security@raidar.tech
          </a>
          <Link className="btn btn-ghost btn-sm" to="/status">
            <ExternalLink size={14} /> Live scan results
          </Link>
        </div>
      </section>
    </div>
  );
}
