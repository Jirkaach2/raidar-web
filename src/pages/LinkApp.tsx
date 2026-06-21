import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAppLoginCode } from '../lib/steam';
import Logo from '../components/Logo';

export default function LinkApp() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const mint = async () => {
    setBusy(true); setError(''); setCopied(false);
    try { setCode(await createAppLoginCode()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not generate a code.'); }
    finally { setBusy(false); }
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
          <p>Signed in as {user?.email}. Paste this code into the Raidar app to sign in with this account.</p>
        </div>

        {error ? (
          <div className="verify-state">
            <p className="auth-error">{error}</p>
            <button className="btn" onClick={mint} disabled={busy}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : (
          <div className="linkapp">
            <div className="linkapp-ic"><MonitorSmartphone size={26} /></div>
            <div className="linkapp-code">
              <code>{busy ? 'Generating…' : code}</code>
              <button className="linkapp-copy" onClick={copy} disabled={!code || busy} title="Copy code">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="muted linkapp-hint">In the Raidar app, click <strong>Sign in with raidar.tech</strong> then <strong>Paste code</strong>. This code is valid for 2 minutes.</p>
            <button className="btn btn-ghost btn-sm" onClick={mint} disabled={busy}><RefreshCw size={14} /> New code</button>
          </div>
        )}
      </div>
    </div>
  );
}
