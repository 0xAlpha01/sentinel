import type { AuditEntry } from '../../types';
import { formatTime } from '../../utils/format';

const tone = (event: string) =>
  /failed|reuse|locked/.test(event) ? 'text-danger' : /blocked|revoked/.test(event) ? 'text-warn' : 'text-accent';

export default function AuditTable({ rows }: { rows: AuditEntry[] }) {
  if (!rows.length) return <p className="text-sm text-mute">No events yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-mute">
            <th className="px-2 pb-3 font-medium">Time</th>
            <th className="px-2 pb-3 font-medium">User</th>
            <th className="px-2 pb-3 font-medium">Event</th>
            <th className="px-2 pb-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody className="font-mono text-[13px]">
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="px-2 py-3 text-mute">{formatTime(r.createdAt)}</td>
              <td className="px-2 py-3">{r.email ?? '—'}</td>
              <td className={`px-2 py-3 ${tone(r.event)}`}>{r.event}</td>
              <td className="px-2 py-3 text-mute">{r.ip ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
