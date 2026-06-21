import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Nav() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);
  const onLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  const initial = (user?.name || user?.email || 'R')[0].toUpperCase();
  const prefs = (user?.prefs || {}) as Record<string, unknown>;
  const avatarUrl = (typeof prefs.avatarUrl === 'string' && prefs.avatarUrl) || (typeof prefs.steamAvatar === 'string' ? prefs.steamAvatar : '');

  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <Logo /> RAIDAR
        </Link>

        <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <div className="nav-primary">
            <NavLink to="/" end onClick={close}>Home</NavLink>
            <NavLink to="/docs" onClick={close}>Docs</NavLink>
            <NavLink to="/blog" onClick={close}>Blog</NavLink>
            <NavLink to="/#pricing" onClick={close}>Pricing</NavLink>
            {user && <NavLink to="/dashboard" onClick={close}><LayoutDashboard size={14} /> Dashboard</NavLink>}
            {user && <NavLink to="/settings" onClick={close}><SettingsIcon size={14} /> Settings</NavLink>}
            {isAdmin && <NavLink to="/admin" onClick={close}><ShieldCheck size={14} /> Admin</NavLink>}
          </div>

          <span className="nav-divider" />

          {user ? (
            <div className="nav-account">
              <span className="nav-user" title={user.email}>
                <span className="nav-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
                <span className="nav-user-name">{user.name || user.email}</span>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={onLogout}><LogOut size={14} /> Sign out</button>
            </div>
          ) : (
            <div className="nav-account">
              <Link className="nav-signin" to="/login" onClick={close}>Sign in</Link>
              <Link className="btn btn-sm" to="/register" onClick={close}>Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
