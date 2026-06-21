import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { account, AuthenticationFactor } from '../lib/appwrite';
import OAuthButtons from '../components/OAuthButtons';
import Logo from '../components/Logo';

export default function Login() {
  const { login, completeMfa, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; mfa?: boolean } };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    const e = sp.get('error');
    if (e === 'steam') return `Steam sign-in failed${sp.get('reason') ? `: ${sp.get('reason')}` : '.'}`;
    if (e === 'oauth') return 'Sign-in with that provider failed or was cancelled.';
    return '';
  });
  const [busy, setBusy] = useState(false);

  // MFA step
  const [mfa, setMfa] = useState(!!location.state?.mfa);
  const [useRecovery, setUseRecovery] = useState(false);
  const [code, setCode] = useState('');

  const goNext = () => navigate(location.state?.from || '/dashboard', { replace: true });

  // Escape hatch: nuke any lingering session (cookie + localStorage fallback)
  // that can otherwise wedge the login in a phantom MFA / "session exists" state.
  const resetSession = async () => {
    setBusy(true);
    try { await account.deleteSessions(); } catch { /* ignore */ }
    try { localStorage.removeItem('cookieFallback'); } catch { /* ignore */ }
    setMfa(false); setUseRecovery(false); setCode(''); setError('');
    setBusy(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await login(email, password);
      if (res.mfa) { setMfa(true); }
      else goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      await completeMfa(useRecovery ? AuthenticationFactor.Recoverycode : AuthenticationFactor.Totp, code.trim());
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="brand"><Logo /> RAIDAR</div>
          <h1>{mfa ? 'Two-factor verification' : 'Welcome back'}</h1>
          <p>{mfa
            ? (useRecovery ? 'Enter one of your saved recovery codes.' : 'Enter the 6-digit code from your authenticator app.')
            : 'Sign in to manage your plan and linked servers.'}</p>
        </div>

        {!configured && (
          <div className="auth-notice">
            Appwrite isn’t configured yet. Set <code>VITE_APPWRITE_PROJECT_ID</code> in your environment.
          </div>
        )}

        {mfa ? (
          <>
            <form className="auth-form" onSubmit={onVerify}>
              <div className="mfa-ic"><ShieldCheck size={26} /></div>
              <label>
                {useRecovery ? 'Recovery code' : 'Authentication code'}
                <input
                  value={code} onChange={(e) => setCode(e.target.value)} required autoFocus
                  inputMode={useRecovery ? 'text' : 'numeric'} maxLength={useRecovery ? 20 : 6}
                  placeholder={useRecovery ? 'xxxxx-xxxxx' : '123456'} autoComplete="one-time-code"
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                {busy ? 'Verifying…' : 'Verify & sign in'}
              </button>
            </form>
            <button className="auth-skip" type="button" onClick={() => { setUseRecovery((v) => !v); setCode(''); setError(''); }}>
              <KeyRound size={14} /> {useRecovery ? 'Use authenticator code instead' : 'Lost your device? Use a recovery code'}
            </button>
            <button className="auth-skip" type="button" onClick={resetSession} disabled={busy}>
              Not your account? Start over
            </button>
          </>
        ) : (
          <>
            <form className="auth-form" onSubmit={onSubmit}>
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
              </label>
              <label>
                Password
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button className="btn" type="submit" disabled={busy || !configured} style={{ width: '100%', justifyContent: 'center' }}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <OAuthButtons />

            <p className="auth-alt">
              New to Raidar? <Link to="/register">Create an account</Link>
            </p>
            <button className="auth-skip" type="button" onClick={resetSession} disabled={busy}>
              Trouble signing in? Reset session
            </button>
          </>
        )}
      </div>
    </div>
  );
}
