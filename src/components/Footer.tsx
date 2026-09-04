import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail } from 'lucide-react';
import Logo from './Logo';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, functions, ExecutionMethod } from '../lib/appwrite';

export default function Footer() {
  const year = new Date().getFullYear();
  const [webStatus, setWebStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [botStatus, setBotStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latestVersion, setLatestVersion] = useState<string>('v1.0.1');

  useEffect(() => {
    let active = true;

    async function checkWeb() {
      if (!isConfigured) {
        if (active) setWebStatus('offline');
        return;
      }
      try {
        await databases.listDocuments(DB_ID, PLANS_COLLECTION_ID, [Query.limit(1)]);
        if (active) setWebStatus('online');
      } catch (err) {
        console.error('Web App connection check failed:', err);
        if (active) setWebStatus('offline');
      }
    }

    async function checkBot() {
      try {
        const res = await fetch('https://salty-spire-70936-6c1b9945cfaf.herokuapp.com/health');
        if (res.ok) {
          const data = await res.json();
          if (data && data.ok) {
            if (active) setBotStatus('online');
            return;
          }
        }
        if (active) setBotStatus('offline');
      } catch (err) {
        console.error('Discord bot connection check failed:', err);
        if (active) setBotStatus('offline');
      }
    }

    async function fetchVersion() {
      try {
        const exec = await functions.createExecution(
          'tauri-updater',
          '',
          false,
          '/',
          ExecutionMethod.GET
        );
        const data = JSON.parse(exec.responseBody || '{}');
        if (data && data.version) {
          if (active) setLatestVersion(`v${data.version}`);
        }
      } catch (err) {
        console.error('Appwrite release version check failed:', err);
      }
    }

    checkWeb();
    checkBot();
    fetchVersion();

    return () => {
      active = false;
    };
  }, []);

  const overallStatus =
    webStatus === 'online' && botStatus === 'online' ? 'operational' :
    webStatus === 'offline' && botStatus === 'offline' ? 'major-outage' :
    webStatus === 'checking' || botStatus === 'checking' ? 'checking' : 'partial-outage';

  const statusText =
    overallStatus === 'operational' ? 'All systems operational' :
    overallStatus === 'major-outage' ? 'Systems offline' :
    overallStatus === 'checking' ? 'Checking systems...' : 'Partial service outage';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand" style={{ fontSize: 18 }}>
              <Logo size={22} /> RAIDAR
            </div>
            <p>Tactical intelligence for Rust — a live map overlay and Discord companion that turns Rust+ into a real-time command center.</p>
            <Link to="/status" className="footer-status">
              <span className={`footer-status-dot ${overallStatus}`} />
              {statusText}
              <div className="footer-status-tooltip">
                <div className="tooltip-title">System Status</div>
                <div className="tooltip-item">
                  <span>Web App:</span>
                  <span className={`status-label ${webStatus}`}>
                    {webStatus === 'online' ? 'Operational' : webStatus === 'offline' ? 'Offline' : 'Checking...'}
                  </span>
                </div>
                <div className="tooltip-item">
                  <span>Discord Bot:</span>
                  <span className={`status-label ${botStatus}`}>
                    {botStatus === 'online' ? 'Operational' : botStatus === 'offline' ? 'Offline' : 'Checking...'}
                  </span>
                </div>
                <div className="tooltip-divider" />
                <div className="tooltip-item version-item">
                  <span>Latest App:</span>
                  <span className="version-label">{latestVersion}</span>
                </div>
              </div>
            </Link>
            {/* No GitHub link: the account holding the repo is shadow-flagged,
                so a linked org a reviewer cannot reach reads as an empty/dead
                org — worse than omitting it. Restore once the flag clears. */}
            <div className="footer-social">
              <a href="https://discord.gg/raidar" target="_blank" rel="noreferrer" aria-label="Discord"><MessageCircle size={17} /></a>
              <a href="mailto:support@raidar.tech" aria-label="Email"><Mail size={17} /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/">Overview</Link>
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/docs">Documentation</Link>
            <Link to="/changelog">Changelog</Link>
          </div>

          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/security">Security</Link>
            <Link to="/status">System status</Link>
            <Link to="/blog">Blog &amp; news</Link>
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

        {/* Displaying the ElevenLabs Grants mark here is a condition of the
            grant program, which requires recipients to show it in the site
            footer. Braintrust is shown alongside as an evaluation partner.

            Each partner is its own bounded card carrying its own role label —
            previously the word "Grants" trailed the ElevenLabs wordmark as a
            loose sibling, so it read as either a third partner or part of the
            logo itself. The stacked card also stops the section divider from
            running visually into the logo baseline. */}
        <div className="footer-partners">
          <span className="footer-partners-label">Backed &amp; supported by</span>
          <div className="footer-partners-row">
            <a
              className="footer-partner"
              href="https://elevenlabs.io/startup-grants"
              target="_blank"
              rel="noreferrer"
              aria-label="ElevenLabs Grants program"
            >
              <span className="footer-partner-mark">
                <img src="/partners/elevenlabs.svg" alt="ElevenLabs" width={112} height={20} loading="lazy" decoding="async" />
              </span>
              <span className="footer-partner-role">Grants Program</span>
            </a>
            <a
              className="footer-partner"
              href="https://www.braintrust.dev"
              target="_blank"
              rel="noreferrer"
              aria-label="Braintrust — AI evaluation tooling"
            >
              <span className="footer-partner-mark">
                <img src="/partners/braintrust.svg" alt="Braintrust" width={98} height={16} loading="lazy" decoding="async" />
              </span>
              <span className="footer-partner-role">AI Evaluation</span>
            </a>
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

