import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand" style={{ fontSize: 18 }}>
            <Logo size={22} /> RAIDAR
          </div>
          <p>Tactical intelligence for Rust — a live map overlay and Discord companion that turns Rust+ into a real-time command center.</p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link to="/">Overview</Link>
          <Link to="/docs">Documentation</Link>
          <Link to="/#pricing">Pricing</Link>
        </div>
        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Create account</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
        <div className="footer-col">
          <h4>More</h4>
          <a href="https://gitlab.com/supply-pulse-group/RustOverlay" target="_blank" rel="noreferrer">Source</a>
          <Link to="/docs#discord-bot">Discord bot</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Raidar · Not affiliated with Facepunch Studios</span>
        <span>Built for Rust</span>
      </div>
    </footer>
  );
}
