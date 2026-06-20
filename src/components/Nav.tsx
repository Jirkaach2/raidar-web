import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Nav() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const onLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <Logo /> RAIDAR
        </Link>

        <button className="nav-toggle" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>Home</NavLink>
          <NavLink to="/docs" onClick={close}>Docs</NavLink>
          {user && <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>}
          {isAdmin && <NavLink to="/admin" onClick={close}>Admin</NavLink>}

          {user ? (
            <div className="nav-account">
              <span className="nav-user" title={user.email}>{user.name || user.email}</span>
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
