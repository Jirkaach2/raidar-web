import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { account } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function SteamCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the secret is single-use — never exchange twice
    ran.current = true;
    const userId = params.get('userId');
    const secret = params.get('secret');
    if (!userId || !secret) { setError('Missing Steam login token.'); return; }
    (async () => {
      try {
        await account.createSession(userId, secret);
        await refresh();
        const needsEmail = params.get('needsEmail') === '1';
        navigate(needsEmail ? '/auth/steam/complete' : '/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Steam sign-in could not be completed.');
      }
    })();
  }, [params, navigate, refresh]);

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--center">
        <div className="auth-head"><div className="brand"><Logo /> RAIDAR</div></div>
        {error ? (
          <div className="verify-state">
            <XCircle size={48} className="verify-ic verify-ic--bad" />
            <h1>Steam sign-in failed</h1>
            <p className="muted">{error}</p>
            <Link className="btn" to="/login">Back to sign in</Link>
          </div>
        ) : (
          <div className="verify-state">
            <div className="spinner" />
            <h1>Signing you in with Steam…</h1>
            <p className="muted">Hang tight, finishing up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
