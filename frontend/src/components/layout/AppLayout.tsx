import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import Button from '../ui/Button';

const link = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2.5 text-[15px] ${isActive ? 'bg-raised text-slate-100' : 'text-mute hover:text-slate-100'}`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav className="flex shrink-0 flex-col gap-1.5 border-b border-line bg-sidebar p-4 md:w-60 md:border-b-0 md:border-r md:p-5">
        <div className="mb-3 flex items-center gap-2.5 px-2 md:mb-6">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3DD6B5" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
            <path d="M9 12l2.2 2.2L15.5 10" />
          </svg>
          <span className="text-xl font-semibold">Sentinel</span>
        </div>
        <div className="flex flex-wrap gap-1.5 md:flex-col">
          {user?.role === 'admin' && (
            <>
              <NavLink to="/dashboard" className={link}>Overview</NavLink>
              <NavLink to="/audit" className={link}>Audit log</NavLink>
              <NavLink to="/users" className={link}>Users</NavLink>
            </>
          )}
          <NavLink to="/sessions" className={link}>My sessions</NavLink>
          <NavLink to="/security" className={link}>Security</NavLink>
        </div>
        <div className="mt-3 rounded-lg border border-line p-3 text-sm text-mute md:mt-auto">
          Signed in as
          <div className="break-all font-mono text-slate-100">{user?.email}</div>
          <Button variant="ghost" className="mt-3 w-full" onClick={logout}>Sign out</Button>
        </div>
      </nav>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
