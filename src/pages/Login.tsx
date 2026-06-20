import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import Logo from '../components/Logo';

export default function Login() {
  const { login, configured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
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

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-head">
          <div className="brand">
            <Logo /> RAIDAR
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to manage your plan and linked servers.</p>
        </div>

        {!configured && (
          <div className="auth-notice">
            Appwrite isn’t configured yet. Set <code>VITE_APPWRITE_PROJECT_ID</code> in your environment.
          </div>
        )}

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
      </div>
    </div>
  );
}
