import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Receipt, Cookie } from 'lucide-react';

const NAV = [
  { to: '/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { to: '/terms', label: 'Terms of Service', icon: FileText },
  { to: '/refunds', label: 'Refund Policy', icon: Receipt },
  { to: '/cookies', label: 'Cookie Policy', icon: Cookie },
];

interface Props {
  title: string;
  updated: string;
  active: string;
  children: ReactNode;
}

export default function LegalLayout({ title, updated, active, children }: Props) {
  return (
    <div className="legal-wrap">
      <div className="container legal-inner">
        <aside className="legal-side">
          <span className="hud-label hud-label--accent">// Legal</span>
          <nav className="legal-nav">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={active === to ? 'active' : ''}>
                <Icon size={15} /> {label}
              </Link>
            ))}
          </nav>
          <div className="legal-side-help">
            <p>Questions about these terms?</p>
            <a href="mailto:info@raidar.tech">info@raidar.tech</a>
          </div>
        </aside>

        <article className="legal-doc bracketed">
          <header className="legal-head">
            <span className="hud-label">// Raidar Legal</span>
            <h1>{title}</h1>
            <p className="legal-updated">Last updated: {updated}</p>
          </header>
          <div className="legal-body">{children}</div>
          <footer className="legal-foot">
            <p className="muted">
              This document is provided for transparency and does not constitute legal advice. By using Raidar
              you agree to all policies linked above.
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
