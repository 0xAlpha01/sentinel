import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { Role } from '../types';

export default function ProtectedRoute({ role }: { role?: Role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-mute">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/sessions" replace />;
  return <Outlet />;
}
