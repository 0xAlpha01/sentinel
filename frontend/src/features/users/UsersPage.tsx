import { adminApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../store/AuthContext';
import { formatTime } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data, loading, reload } = useAsync(async () => (await adminApi.users()).data);

  return (
    <>
      <h1 className="text-3xl font-semibold">Users</h1>
      <Card>
        {loading && <p className="text-mute">Loading…</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-mute">
                <th className="px-2 pb-3 font-medium">Email</th>
                <th className="px-2 pb-3 font-medium">Role</th>
                <th className="px-2 pb-3 font-medium">2FA</th>
                <th className="px-2 pb-3 font-medium">Joined</th>
                <th className="px-2 pb-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className="px-2 py-3 font-mono text-[13px]">{u.email}</td>
                  <td className="px-2 py-3">{u.role}</td>
                  <td className="px-2 py-3">{u.totpEnabled ? 'On' : 'Off'}</td>
                  <td className="px-2 py-3 text-mute">{formatTime(u.createdAt)}</td>
                  <td className="flex justify-end gap-2 px-2 py-2">
                    <Button variant="ghost" onClick={async () => { await adminApi.revokeUserSessions(u.id); }}>Revoke sessions</Button>
                    {u.id !== me?.id && (
                      <Button variant="ghost" onClick={async () => { await adminApi.setRole(u.id, u.role === 'admin' ? 'user' : 'admin'); void reload(); }}>
                        {u.role === 'admin' ? 'Make user' : 'Make admin'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
