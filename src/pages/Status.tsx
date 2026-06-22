import { useState, useEffect } from 'react';
import { RefreshCw, Server, MessageSquare, Download, CheckCircle2, AlertCircle, XCircle, Activity, Clock, Cpu, ShieldCheck, FileCheck, ExternalLink, Copy } from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, functions, ExecutionMethod } from '../lib/appwrite';

interface BotHealth {
  ok: boolean;
  uptime?: number;
  memory?: { rss: number; heapUsed: number; heapTotal: number };
  version?: string;
  nodeVersion?: string;
  timestamp?: string;
}

// SHA-256 of the current signed Windows installer (Raidar_1.0.2_x64-setup.exe).
// Update this whenever a new release is published so the scan links stay accurate.
const INSTALLER_SHA256 = '2c4d7083ec8723ab42563826303b2ae2172344e54145398eb10db03159b1759d';

// Public domain of the tauri-updater Appwrite function. Used to build a correct
// download URL — the manifest's own url is rewritten from the request host, which
// is wrong when the function is invoked via the SDK rather than hit directly.
const UPDATER_BASE = 'https://tauri-updater.appwrite.network';

interface ScanService {
  name: string;
  desc: string;
  url: string;
  cta: string;
}

// Independent multi-engine scanners. VirusTotal links to the file report by hash;
// the others let visitors look up or submit the installer themselves. We intentionally
// do NOT assert a verdict here — the report only exists once the file has been
// submitted, so we link out rather than claim a result we haven't verified.
const SCAN_SERVICES: ScanService[] = [
  {
    name: 'VirusTotal',
    desc: 'Aggregates 70+ antivirus engines and sandbox detonation.',
    url: `https://www.virustotal.com/gui/file/${INSTALLER_SHA256}`,
    cta: 'View report by hash',
  },
  {
    name: 'Hybrid Analysis',
    desc: 'CrowdStrike Falcon Sandbox behavioural analysis.',
    url: `https://www.hybrid-analysis.com/search?query=${INSTALLER_SHA256}`,
    cta: 'Search this hash',
  },
  {
    name: 'MetaDefender',
    desc: 'OPSWAT multiscanning across 30+ engines.',
    url: `https://metadefender.com/results/file/hash/${INSTALLER_SHA256}/regular`,
    cta: 'Look up this hash',
  },
  {
    name: 'Jotti Malware Scan',
    desc: 'Independent multi-engine community scanner.',
    url: 'https://virusscan.jotti.org/',
    cta: 'Submit to scan',
  },
];

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Status() {
  const [webStatus, setWebStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [webLatency, setWebLatency] = useState<number | null>(null);
  const [botStatus, setBotStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [botLatency, setBotLatency] = useState<number | null>(null);
  const [botHealth, setBotHealth] = useState<BotHealth | null>(null);
  const [latestVersion, setLatestVersion] = useState<string>('v1.0.2');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(INSTALLER_SHA256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const runChecks = async () => {
    setChecking(true);
    
    // 1. Web App check + latency
    if (!isConfigured) {
      setWebStatus('offline');
      setWebLatency(null);
    } else {
      const start = performance.now();
      try {
        await databases.listDocuments(DB_ID, PLANS_COLLECTION_ID, [Query.limit(1)]);
        setWebLatency(Math.round(performance.now() - start));
        setWebStatus('online');
      } catch (err) {
        console.error('Web check failed:', err);
        setWebStatus('offline');
        setWebLatency(null);
      }
    }

    // 2. Discord Bot check + latency (with rich health data)
    const botStart = performance.now();
    try {
      const res = await fetch('https://92.5.73.207.nip.io/health', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data: BotHealth = await res.json();
        if (data && data.ok) {
          setBotLatency(Math.round(performance.now() - botStart));
          setBotStatus('online');
          setBotHealth(data);
        } else {
          setBotStatus('offline');
          setBotLatency(null);
          setBotHealth(null);
        }
      } else {
        setBotStatus('offline');
        setBotLatency(null);
        setBotHealth(null);
      }
    } catch (err) {
      console.error('Bot check failed:', err);
      setBotStatus('offline');
      setBotLatency(null);
      setBotHealth(null);
    }

    // 3. Fetch version
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
        setLatestVersion(`v${data.version}`);
      }
      // The updater manifest carries a proxied, auth-backed download URL that works
      // even though the release repo is private. Its host is rewritten from the
      // request and is unreliable via the SDK, so rebuild it against UPDATER_BASE
      // using only the asset_id.
      const winUrl: string | undefined = data?.platforms?.['windows-x86_64']?.url;
      if (typeof winUrl === 'string' && winUrl.includes('asset_id=')) {
        const assetId = winUrl.split('asset_id=')[1].split('&')[0];
        if (assetId) {
          setDownloadUrl(`${UPDATER_BASE}/?action=download&asset_id=${assetId}`);
        }
      }
    } catch (err) {
      console.error('Version fetch failed:', err);
    }

    setChecking(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const overallStatus =
    webStatus === 'online' && botStatus === 'online' ? 'operational' :
    webStatus === 'offline' && botStatus === 'offline' ? 'major-outage' :
    webStatus === 'checking' || botStatus === 'checking' ? 'checking' : 'partial-outage';

  return (
    <div className="status-page container">
      <div className="status-header">
        <div>
          <h1>System Status</h1>
          <p className="muted">Live status monitoring and latency diagnostics for Raidar services.</p>
        </div>
        <button 
          onClick={runChecks} 
          disabled={checking} 
          className="btn btn-ghost btn-sm btn-refresh"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={checking ? 'spin' : ''} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
          {checking ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {/* Overall Banner */}
      <div className={`status-hero status-hero--${overallStatus}`}>
        <div className="status-hero-icon">
          {overallStatus === 'operational' && <CheckCircle2 size={32} />}
          {overallStatus === 'partial-outage' && <AlertCircle size={32} />}
          {overallStatus === 'major-outage' && <XCircle size={32} />}
          {overallStatus === 'checking' && <Activity size={32} />}
        </div>
        <div>
          <h2>
            {overallStatus === 'operational' && 'All Systems Operational'}
            {overallStatus === 'partial-outage' && 'Partial Service Outage'}
            {overallStatus === 'major-outage' && 'Major System Outage'}
            {overallStatus === 'checking' && 'Verifying System Status...'}
          </h2>
          <p>
            {overallStatus === 'operational' && 'Every Raidar service is active and operating at normal parameters.'}
            {overallStatus === 'partial-outage' && 'We are experiencing degraded performance or an outage on one of our integrations.'}
            {overallStatus === 'major-outage' && 'All primary Raidar connection backends are currently experiencing downtime.'}
            {overallStatus === 'checking' && 'Performing diagnostic sweeps on database clusters and companion bot gateways...'}
          </p>
        </div>
      </div>

      {/* Component Details */}
      <div className="status-components">
        <h3 className="section-title">// Components</h3>
        
        {/* Component 1: Web App */}
        <div className="status-card">
          <div className="status-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-card-icon"><Server size={18} /></span>
              <div>
                <h4>Web Application Server</h4>
                <p className="muted">User accounts, subscription verification, and billing portal</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {webStatus === 'online' && webLatency !== null && (
                <span className="latency-badge">{webLatency} ms</span>
              )}
              <span className={`status-indicator ${webStatus}`}>
                <span className="dot" />
                {webStatus === 'online' ? 'Operational' : webStatus === 'offline' ? 'Offline' : 'Checking'}
              </span>
            </div>
          </div>
        </div>

        {/* Component 2: Discord Bot */}
        <div className="status-card">
          <div className="status-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="status-card-icon"><MessageSquare size={18} /></span>
              <div>
                <h4>Discord Companion Bot</h4>
                <p className="muted">Smart alarm alerts, team chat relay, and in-game device toggling</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {botStatus === 'online' && botLatency !== null && (
                <span className="latency-badge">{botLatency} ms</span>
              )}
              <span className={`status-indicator ${botStatus}`}>
                <span className="dot" />
                {botStatus === 'online' ? 'Operational' : botStatus === 'offline' ? 'Offline' : 'Checking'}
              </span>
            </div>
          </div>
          {botStatus === 'online' && botHealth && (
            <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
              {botHealth.uptime !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-dim)' }}>
                  <Clock size={12} style={{ color: 'var(--color-accent)' }} />
                  <span>Uptime: <strong style={{ color: 'var(--color-text)' }}>{formatUptime(botHealth.uptime)}</strong></span>
                </div>
              )}
              {botHealth.memory && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-dim)' }}>
                  <Cpu size={12} style={{ color: 'var(--color-accent)' }} />
                  <span>Heap: <strong style={{ color: 'var(--color-text)' }}>{botHealth.memory.heapUsed}/{botHealth.memory.heapTotal} MB</strong></span>
                </div>
              )}
              {botHealth.version && (
                <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  Bot v<strong style={{ color: 'var(--color-text)' }}>{botHealth.version}</strong>
                </div>
              )}
            </div>
          )}
          {botStatus === 'offline' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#ef4444' }}>
              ⚠ Bot gateway unreachable. The VM may be down or restarting — the watchdog will auto-recover within 5 minutes.
            </div>
          )}
        </div>
      </div>

      {/* Client App Versions */}
      <div className="status-versions">
        <h3 className="section-title">// Client Releases</h3>
        <div className="status-card version-card">
          <div className="version-info">
            <div>
              <h4>Raidar Desktop Client</h4>
              <p className="muted">Overlay map client for Windows (built with Tauri & Rust)</p>
            </div>
            <div className="version-tag-wrapper">
              <span className="version-tag">{latestVersion}</span>
              <span className="version-status-dot" />
              <span className="version-status-text">Latest release</span>
            </div>
          </div>
          <div className="version-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span className="text-dim" style={{ fontSize: '11px' }}>Signature signed by: <strong>Raidar Code Signing</strong></span>
            <div style={{ display: 'flex', gap: 10 }}>
              {downloadUrl ? (
                <a href={downloadUrl} className="btn btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Download size={12} /> Download {latestVersion} (Setup.exe)
                </a>
              ) : (
                <span className="btn btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, opacity: 0.6, pointerEvents: 'none' }}>
                  <Download size={12} /> Preparing download…
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Legitimacy */}
      <div className="status-security">
        <h3 className="section-title">// Security &amp; Legitimacy</h3>
        <div className="status-card security-card">
          <div className="security-intro">
            <span className="status-card-icon security-shield"><ShieldCheck size={20} /></span>
            <div>
              <h4>Code-signed &amp; independently verifiable</h4>
              <p className="muted">
                Every Raidar release is a code-signed Windows installer. We publish the
                exact file hash so anyone can confirm the download they receive matches the
                build we shipped, and look it up on independent malware scanners below.
              </p>
            </div>
          </div>

          {/* Hash verification */}
          <div className="security-hash">
            <div className="security-hash-label">
              <FileCheck size={13} /> Installer SHA-256
            </div>
            <code className="security-hash-value">{INSTALLER_SHA256}</code>
            <button className="security-hash-copy" onClick={copyHash} title="Copy hash">
              <Copy size={12} /> {copiedHash ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Scanner grid */}
          <div className="security-scanners">
            {SCAN_SERVICES.map((svc) => (
              <a
                key={svc.name}
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="security-scanner"
              >
                <div className="security-scanner-top">
                  <span className="security-scanner-name">{svc.name}</span>
                  <ExternalLink size={12} className="security-scanner-ext" />
                </div>
                <p className="security-scanner-desc">{svc.desc}</p>
                <span className="security-scanner-cta">
                  {svc.cta} <ExternalLink size={10} />
                </span>
              </a>
            ))}
          </div>

          <p className="security-note muted">
            These links open each scanner's report for the hash above. A report appears once
            the file has been submitted — newly released builds may show "not found" until
            someone uploads them, and some engines flag low-reputation executables as
            "unknown" (heuristic reputation, not a detection). The installer is signed by
            <strong> Raidar Code Signing</strong>; verify your download with
            <code> Get-FileHash setup.exe -Algorithm SHA256</code> and compare it to the hash above.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: 'var(--color-text-dim)' }}>
        <span>Diagnostics sweep completed. All connection metrics are tested in real time from your browser.</span>
      </div>
    </div>
  );
}
