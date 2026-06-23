import { useState, useEffect } from 'react';
import { RefreshCw, Server, MessageSquare, Download, CheckCircle2, AlertCircle, XCircle, Activity, Clock, ShieldCheck, FileCheck, ExternalLink, Copy } from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, functions, ExecutionMethod } from '../lib/appwrite';

interface BotHealth {
  ok: boolean;
  uptime?: number;
  memory?: { rss: number; heapUsed: number; heapTotal: number };
  version?: string;
  nodeVersion?: string;
  timestamp?: string;
}

// SHA-256 of the current signed Windows installer (Raidar_1.1.7_x64-setup.exe).
// Update this whenever a new release is published so the scan links stay accurate.
const INSTALLER_SHA256 = '22f1c6bea0dcf6c7e2a9c19a1471a99b8dda119432dac40ceddbad35b52af6e2';

// Public domain of the tauri-updater Appwrite function. Used to build a correct
// download URL — the manifest's own url is rewritten from the request host, which
// is wrong when the function is invoked via the SDK rather than hit directly.
const UPDATER_BASE = 'https://tauri-updater.appwrite.network';

interface ScanResult {
  found?: boolean;
  submitted?: boolean;
  detections?: number;
  total?: number;        // VirusTotal engine total
  totalEngines?: number; // MetaDefender engine total
  permalink?: string;
  error?: string;
}

interface ScanData {
  hash: string;
  virustotal: ScanResult;
  metadefender: ScanResult;
}

const SCANNERS = [
  {
    key: 'virustotal' as const,
    name: 'VirusTotal',
    desc: 'Aggregates 70+ antivirus engines and sandbox detonation.',
    fallbackUrl: `https://www.virustotal.com/gui/file/${INSTALLER_SHA256}`,
  },
  {
    key: 'metadefender' as const,
    name: 'MetaDefender',
    desc: 'OPSWAT multiscanning across 30+ engines.',
    fallbackUrl: `https://metadefender.com/results/hash/${INSTALLER_SHA256}`,
  },
];

type VerdictTone = 'clean' | 'flag' | 'muted';

function verdictFor(key: 'virustotal' | 'metadefender', result: ScanResult | undefined, loading: boolean): { text: string; tone: VerdictTone } {
  if (loading) return { text: 'Checking…', tone: 'muted' };
  if (!result || result.error === 'not_configured') return { text: 'Live scan not configured', tone: 'muted' };
  if (result.submitted) return { text: 'Submitted — analyzing…', tone: 'muted' };
  if (result.error) return { text: 'Live lookup unavailable', tone: 'muted' };
  if (result.found === false) return { text: 'Submitting for analysis…', tone: 'muted' };
  const detections = result.detections || 0;
  const total = (key === 'virustotal' ? result.total : result.totalEngines) || 0;
  if (detections === 0) return { text: `Clean — 0 / ${total} engines`, tone: 'clean' };
  return { text: `${detections} / ${total} engines flagged`, tone: 'flag' };
}

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
  const [latestVersion, setLatestVersion] = useState<string>('v1.1.7');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [msiUrl, setMsiUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [scan, setScan] = useState<ScanData | null>(null);
  const [scanLoading, setScanLoading] = useState(true);

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
      // The function also lists every installer (exe + msi) so we can offer both.
      if (Array.isArray(data?.downloads)) {
        for (const d of data.downloads) {
          if (!d?.asset_id) continue;
          const url = `${UPDATER_BASE}/?action=download&asset_id=${d.asset_id}`;
          if (d.kind === 'msi') setMsiUrl(url);
          else if (d.kind === 'exe') setDownloadUrl(url);
        }
      }
    } catch (err) {
      console.error('Version fetch failed:', err);
    }

    // 4. Live malware scan results (keys stay server-side in the function).
    // Cache per browser session for 15 min to stay within free-tier API limits.
    setScanLoading(true);
    try {
      const CACHE_KEY = `raidar_scan_${INSTALLER_SHA256}`;
      const cachedRaw = sessionStorage.getItem(CACHE_KEY);
      let used = false;
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.ts && Date.now() - cached.ts < 15 * 60 * 1000 && cached.data) {
            setScan(cached.data as ScanData);
            used = true;
          }
        } catch { /* ignore corrupt cache */ }
      }
      if (!used) {
        const exec = await functions.createExecution(
          'security-scan',
          '',
          false,
          `/?hash=${INSTALLER_SHA256}`,
          ExecutionMethod.GET
        );
        const data = JSON.parse(exec.responseBody || '{}');
        if (data && (data.virustotal || data.metadefender)) {
          setScan(data as ScanData);
          // Only cache terminal results. If a scan is still submitting/analyzing,
          // skip the cache so the next visit re-polls and picks up the verdict.
          const vt = data.virustotal || {};
          const md = data.metadefender || {};
          const settled = vt.found === true && md.found === true;
          if (settled) {
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota */ }
          }
        }
      }
    } catch (err) {
      console.error('Scan fetch failed:', err);
    } finally {
      setScanLoading(false);
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
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {downloadUrl ? (
                <a href={downloadUrl} className="btn btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Download size={12} /> Download {latestVersion} (Setup.exe)
                </a>
              ) : (
                <span className="btn btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, opacity: 0.6, pointerEvents: 'none' }}>
                  <Download size={12} /> Preparing download…
                </span>
              )}
              {msiUrl && (
                <a href={msiUrl} className="btn btn-xs btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(255,255,255,0.1)' }} title="MSI installer — useful if antivirus heuristics flag the NSIS build">
                  <Download size={12} /> Installer.msi
                </a>
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

          {/* Scanner grid — live results from the security-scan function */}
          <div className="security-scanners">
            {SCANNERS.map((svc) => {
              const result = svc.key === 'virustotal' ? scan?.virustotal : scan?.metadefender;
              const verdict = verdictFor(svc.key, result, scanLoading);
              const link = result?.permalink || svc.fallbackUrl;
              return (
                <a
                  key={svc.key}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="security-scanner"
                >
                  <div className="security-scanner-top">
                    <span className="security-scanner-name">{svc.name}</span>
                    <ExternalLink size={12} className="security-scanner-ext" />
                  </div>
                  <p className="security-scanner-desc">{svc.desc}</p>
                  <span className={`security-scanner-verdict security-verdict--${verdict.tone}`}>
                    {verdict.tone === 'clean' && <CheckCircle2 size={11} />}
                    {verdict.tone === 'flag' && <AlertCircle size={11} />}
                    {verdict.text}
                  </span>
                </a>
              );
            })}
          </div>

          <p className="security-note muted">
            Results are pulled live from each provider's API for the hash above (API keys stay
            server-side, never in your browser). "Not yet submitted" means the file hasn't been
            uploaded to that service yet. The installer is signed by
            <strong> Raidar Code Signing</strong>; verify your own download with
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
