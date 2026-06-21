import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAppLoginToken } from '../lib/steam';
import Logo from '../components/Logo';

export default function LinkApp() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const mint = async () => {
    setBusy(true); setError(''); setCopied(false);
    try {
      const { userId, secret } = await createAppLoginToken();
      setCode(btoa(`${userId}:${secret}`).replace(/=+$/, ''));
      const dl = `raidar://auth?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`;
      setDeepLink(dl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a code.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login?next=/link-app', { replace: true }); return; }
    mint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--center">
        <div className="auth-head">
          <div className="brand"><Logo /> RAIDAR</div>
          <h1>Connect the desktop app</h1>
          <p>Signed in as {user?.email}. Open the app to finish signing in.</p>
        </div>

        {error ? (
          <div className="verify-state">
            <p className="auth-error">{error}</p>
            <button className="btn" onClick={mint} disabled={busy}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : (
          <div className="linkapp">
            <div className="linkapp-ic"><MonitorSmartphone size={26} /></div>
            {/* A real anchor is the reliable way to launch the custom protocol. */}
            <a ref={linkRef} className="btn" href={deepLink || '#'} style={{ width: '100%', justifyContent: 'center', pointerEvents: deepLink ? 'auto' : 'none', opacity: deepLink ? 1 : 0.6 }}>
              {busy ? 'Generating…' : 'Open the Raidar app'}
            </a>
            <p className="muted linkapp-hint">If a browser prompt appears, choose <strong>Open Raidar</strong>. Make sure the app is already running.</p>
            <p className="muted linkapp-hint" style={{ marginTop: 4 }}>Not opening? Copy this code and paste it in the app under <strong>Sign in with raidar.tech</strong>.</p>
            <div className="linkapp-code">
              <code>{busy ? '…' : code}</code>
              <button className="linkapp-copy" onClick={copy} disabled={!code || busy} title="Copy code">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={mint} disabled={busy}><RefreshCw size={14} /> New code</button>
          </div>
        )}
      </div>
    </div>
  );
}
