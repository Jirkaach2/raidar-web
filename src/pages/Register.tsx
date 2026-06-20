import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import Logo from '../components/Logo';

export default function Register() {
  const { register, configured } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.');
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
          <h1>Create your account</h1>
          <p>Start free — upgrade your squad whenever you’re ready.</p>
        </div>

        {!configured && (
          <div className="auth-notice">
            Appwrite isn’t configured yet. Set <code>VITE_APPWRITE_PROJECT_ID</code> in your environment.
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Display name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="nickname" placeholder="Your in-game name" />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="At least 8 characters" />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="btn" type="submit" disabled={busy || !configured} style={{ width: '100%', justifyContent: 'center' }}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <OAuthButtons />

        <p className="auth-alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
