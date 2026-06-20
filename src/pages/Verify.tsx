import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

type State = 'verifying' | 'success' | 'error' | 'missing';

export default function Verify() {
  const { confirmVerification, user, sendVerification } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const [resent, setResent] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React 18 double-invoke in dev
    ran.current = true;
    const userId = params.get('userId');
    const secret = params.get('secret');
    if (!userId || !secret) { setState('missing'); return; }
    confirmVerification(userId, secret)
      .then(() => {
        setState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof Error ? err.message : 'This verification link is invalid or has expired.');
      });
  }, [params, confirmVerification, navigate]);

  const resend = async () => {
    try { await sendVerification(); setResent(true); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Could not resend the email.'); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card auth-card--center">
        <div className="auth-head">
          <div className="brand"><Logo /> RAIDAR</div>
        </div>

        {state === 'verifying' && (
          <div className="verify-state">
            <div className="spinner" />
            <h1>Verifying your email…</h1>
            <p className="muted">Hang tight, this only takes a second.</p>
          </div>
        )}

        {state === 'success' && (
          <div className="verify-state">
            <CheckCircle2 size={48} className="verify-ic verify-ic--ok" />
            <h1>Email verified</h1>
            <p className="muted">You’re all set. Redirecting to your dashboard…</p>
            <Link className="btn" to="/dashboard">Go to dashboard</Link>
          </div>
        )}

        {state === 'error' && (
          <div className="verify-state">
            <XCircle size={48} className="verify-ic verify-ic--bad" />
            <h1>Verification failed</h1>
            <p className="muted">{message}</p>
            {user ? (
              resent
                ? <p className="auth-notice">A fresh verification email is on its way.</p>
                : <button className="btn" onClick={resend}><MailCheck size={15} /> Resend verification email</button>
            ) : (
              <Link className="btn" to="/login">Sign in to resend</Link>
            )}
          </div>
        )}

        {state === 'missing' && (
          <div className="verify-state">
            <XCircle size={48} className="verify-ic verify-ic--bad" />
            <h1>Invalid link</h1>
            <p className="muted">This page expects a verification link from your email. Try opening the link again, or request a new one.</p>
            {user && !resent && <button className="btn" onClick={resend}><MailCheck size={15} /> Send verification email</button>}
            {resent && <p className="auth-notice">A verification email is on its way.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
