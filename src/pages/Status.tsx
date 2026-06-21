import { useState, useEffect } from 'react';
import { RefreshCw, Server, MessageSquare, Download, CheckCircle2, AlertCircle, XCircle, Activity } from 'lucide-react';
import { databases, DB_ID, PLANS_COLLECTION_ID, Query, isConfigured, ENDPOINT, PROJECT_ID } from '../lib/appwrite';

export default function Status() {
  const [webStatus, setWebStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [webLatency, setWebLatency] = useState<number | null>(null);
  const [botStatus, setBotStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [botLatency, setBotLatency] = useState<number | null>(null);
  const [latestVersion, setLatestVersion] = useState<string>('v1.0.0');
  const [checking, setChecking] = useState(false);

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

    // 2. Discord Bot check + latency
    const botStart = performance.now();
    try {
      const res = await fetch('https://92.5.73.207.nip.io/health', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          setBotLatency(Math.round(performance.now() - botStart));
          setBotStatus('online');
        } else {
          setBotStatus('offline');
          setBotLatency(null);
        }
      } else {
        setBotStatus('offline');
        setBotLatency(null);
      }
    } catch (err) {
      console.error('Bot check failed:', err);
      setBotStatus('offline');
      setBotLatency(null);
    }

    // 3. Fetch version
    try {
      const res = await fetch('https://api.github.com/repos/JirkaachS/raidar-app/releases/latest');
      if (res.ok) {
        const data = await res.json();
        if (data && data.tag_name) {
          setLatestVersion(data.tag_name);
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
          <div className="version-actions" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-dim" style={{ fontSize: '11px' }}>Signature signed by: <strong>Raidar Code Signing</strong></span>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={`${ENDPOINT}/storage/buckets/installers/files/setup/download?project=${PROJECT_ID}`} download className="btn btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Download size={12} /> Setup.exe
              </a>
              <a href={`${ENDPOINT}/storage/buckets/installers/files/installer/download?project=${PROJECT_ID}`} download className="btn btn-xs btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Download size={12} /> Installer.msi
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 11, color: 'var(--color-text-dim)' }}>
        <span>Diagnostics sweep completed. All connection metrics are tested in real time from your browser.</span>
      </div>
    </div>
  );
}
