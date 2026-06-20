import { Link } from 'react-router-dom';
import { MessageCircle, Github, Mail } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand" style={{ fontSize: 18 }}>
              <Logo size={22} /> RAIDAR
            </div>
            <p>Tactical intelligence for Rust — a live map overlay and Discord companion that turns Rust+ into a real-time command center.</p>
            <div className="footer-status">
              <span className="footer-status-dot" />
              All systems operational
            </div>
            <div className="footer-social">
              <a href="https://discord.gg" target="_blank" rel="noreferrer" aria-label="Discord"><MessageCircle size={17} /></a>
              <a href="https://gitlab.com/supply-pulse-group/RustOverlay" target="_blank" rel="noreferrer" aria-label="Repository"><Github size={17} /></a>
              <a href="mailto:support@raidar.tech" aria-label="Email"><Mail size={17} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/">Overview</Link>
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/docs">Documentation</Link>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/docs#getting-started">Getting started</Link>
            <Link to="/docs#discord-bot">Discord bot</Link>
            <a href="mailto:support@raidar.tech">Support</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/refunds">Refund Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} Raidar · Not affiliated with Facepunch Studios</span>
          <span className="footer-made">Built for Rust</span>
        </div>
      </div>
    </footer>
  );
}
