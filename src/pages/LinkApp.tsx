import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createAppLoginToken } from '../lib/steam';
import Logo from '../components/Logo';

export default function LinkApp() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [launched, setLaunched] = useState(false);

  const mint = async (autoLaunch = true) => {
    setBusy(true); setError(''); setCopied(false);
    try {
      const { userId, secret } = await createAppLoginToken();
      setCode(btoa(`${userId}:${secret}`).replace(/=+$/, ''));
      if (autoLaunch) {
        // Seamless handoff — hand the token to the desktop app via its scheme.
        setLaunched(true);
        window.location.href = `raidar://auth?userId=${encodeURIComponent(userId)}&secret=${encodeURIComponent(secret)}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a code.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login?next=/link-app', { replace: true }); return; }
    mint(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const copy = () => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--center">
        <div className="auth-head">
          <div className="brand"><Logo /> RAIDAR</div>
          <h1>Connect the desktop app</h1>
          <p>{launched
            ? 'Opening the Raidar app… approve the prompt to allow it. If nothing happens, paste the code below.'
            : `Signed in as ${user?.email}.`}</p>
        </div>

        {error ? (
          <div className="verify-state">
            <p className="auth-error">{error}</p>
            <button className="btn" onClick={() => mint(true)} disabled={busy}><RefreshCw size={15} /> Try again</button>
          </div>
        ) : (
          <div className="linkapp">
            <div className="linkapp-ic"><MonitorSmartphone size={26} /></div>
            <button className="btn" onClick={() => mint(true)} disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Generating…' : 'Open the Raidar app'}
            </button>
            <p className="muted linkapp-hint">Not opening automatically? Copy this code and paste it in the app under <strong>Sign in with raidar.tech</strong>.</p>
            <div className="linkapp-code">
              <code>{busy ? '…' : code}</code>
              <button className="linkapp-copy" onClick={copy} disabled={!code || busy} title="Copy code">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="muted linkapp-hint">This code is valid for 2 minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
