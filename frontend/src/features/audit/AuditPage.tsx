import { adminApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import Card from '../../components/ui/Card';
import AuditTable from './AuditTable';

export default function AuditPage() {
  const { data, loading } = useAsync(async () => (await adminApi.audit(200)).data);
  return (
    <>
      <h1 className="text-3xl font-semibold">Audit log</h1>
      <Card>{loading ? <p className="text-mute">Loading…</p> : <AuditTable rows={data ?? []} />}</Card>
    </>
  );
}
