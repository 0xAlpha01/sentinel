import { adminApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatTime } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AuditTable from '../audit/AuditTable';

function Stat({ label, value, note, tone }: { label: string; value: string | number; note: string; tone?: 'danger' }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-5">
      <div className="text-sm text-mute">{label}</div>
      <div className="mt-2 text-4xl font-semibold">{value}</div>
      <div className={`mt-1 text-sm ${tone === 'danger' ? 'text-danger' : 'text-mute'}`}>{note}</div>
    </div>
  );
}

export default function DashboardPage() {
  const stats = useAsync(async () => (await adminApi.stats()).data);
  const suspicious = useAsync(async () => (await adminApi.suspicious()).data);
  const audit = useAsync(async () => (await adminApi.audit(8)).data);

  async function revoke(userId: string | null) {
    if (!userId) return;
    await adminApi.revokeUserSessions(userId);
    void suspicious.reload();
    void stats.reload();
  }

  const s = stats.data;
  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold">Security overview</h1>
        <p className="mt-1 text-sm text-mute">Last 24 hours</p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <Stat label="Active sessions" value={s?.activeSessions ?? '–'} note={`${s?.totalUsers ?? 0} registered users`} />
        <Stat label="Failed logins" value={s?.failedLogins24h ?? '–'} note="Wrong password or unknown email" tone={s && s.failedLogins24h > 0 ? 'danger' : undefined} />
        <Stat label="2FA enabled" value={s ? `${s.twoFaPercent}%` : '–'} note="Of all users" />
        <Stat label="Suspicious events" value={s?.suspicious24h ?? '–'} note="Token reuse or locked accounts" tone={s && s.suspicious24h > 0 ? 'danger' : undefined} />
      </div>

      <Card title="Suspicious activity" subtitle="Reused refresh tokens and locked accounts">
        {suspicious.data?.length === 0 && <p className="text-sm text-mute">Nothing suspicious in the last 24 hours.</p>}
        <ul className="flex flex-col gap-3">
          {suspicious.data?.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3.5">
              <div>
                <div className="font-medium">{e.email ?? 'Unknown user'}</div>
                <div className="mt-0.5 font-mono text-[13px] text-mute">{e.event} · {e.ip ?? 'no ip'} · {formatTime(e.createdAt)}</div>
              </div>
              <Button variant="danger" onClick={() => revoke(e.userId)}>Revoke sessions</Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Recent activity">
        <AuditTable rows={audit.data ?? []} />
      </Card>
    </>
  );
}
