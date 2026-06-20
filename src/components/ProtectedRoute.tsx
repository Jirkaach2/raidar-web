import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly }: Props) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
