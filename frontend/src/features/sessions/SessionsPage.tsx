import { sessionsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatTime } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function SessionsPage() {
  const { data, loading, reload } = useAsync(async () => (await sessionsApi.list()).data);

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold">My sessions</h1>
        <p className="mt-1 text-sm text-mute">Devices signed in to your account. Revoke any you don't recognise.</p>
      </header>
      <Card>
        {loading && <p className="text-mute">Loading…</p>}
        <ul className="flex flex-col gap-3">
          {data?.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3.5">
              <div className="min-w-0">
                <div className="truncate font-medium">{s.userAgent ?? 'Unknown device'}{s.current && <span className="ml-2 text-sm text-accent">This device</span>}</div>
                <div className="mt-0.5 font-mono text-[13px] text-mute">{s.ip ?? 'no ip'} · {formatTime(s.createdAt)}</div>
              </div>
              {!s.current && <Button variant="danger" onClick={async () => { await sessionsApi.revoke(s.id); void reload(); }}>Revoke</Button>}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
