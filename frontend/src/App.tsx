import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardPage from './features/dashboard/DashboardPage';
import AuditPage from './features/audit/AuditPage';
import UsersPage from './features/users/UsersPage';
import SessionsPage from './features/sessions/SessionsPage';
import SecurityPage from './features/security/SecurityPage';

function Home() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'admin' ? '/dashboard' : '/sessions'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
