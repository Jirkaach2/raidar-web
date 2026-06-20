import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setSteamEmail } from '../lib/steam';
import Logo from '../components/Logo';

const SYNTH = '@steam.users.raidar.tech';

export default function CompleteSteamSignup() {
  const { user, loading, refresh, sendVerification } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // If we already have a real, signed-in email there's nothing to do here.
  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    if (user.email && !user.email.endsWith(SYNTH)) navigate('/dashboard', { replace: true });
  }, [user, loading, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await setSteamEmail(email.trim());
      await refresh();
      try { await sendVerification(); } catch { /* they can resend from the dashboard */ }
      setDone(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your email.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="brand"><Logo /> RAIDAR</div>
          <h1>{done ? 'Almost there' : 'Account linked'}</h1>
          <p>{done
            ? 'Check your inbox to verify your email.'
            : 'Your Steam account is connected. Add an email so we can send receipts and help you recover access.'}</p>
        </div>

        {done ? (
          <div className="verify-state">
            <CheckCircle2 size={44} className="verify-ic verify-ic--ok" />
            <p className="muted">Verification link sent to <strong>{email}</strong>. Taking you to your dashboard…</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label>
              Email address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
            </label>
            {error && <div className="auth-error">{error}</div>}
            <button className="btn" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
              {busy ? 'Saving…' : <><MailCheck size={15} /> Save & verify email</>}
            </button>
          </form>
        )}

        {!done && (
          <button className="auth-skip" type="button" onClick={() => navigate('/dashboard', { replace: true })}>
            Skip for now <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
