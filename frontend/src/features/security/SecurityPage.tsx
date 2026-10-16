import { useState, type FormEvent } from 'react';
import { twofaApi } from '../../api/endpoints';
import { useAuth } from '../../store/AuthContext';
import { errorMessage } from '../../utils/format';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';

export default function SecurityPage() {
  const { user, reloadUser } = useAuth();
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<void>) {
    setError('');
    try { await fn(); } catch (err) { setError(errorMessage(err)); }
  }

  const start = () => run(async () => setSetup((await twofaApi.setup()).data));
  const enable = (e: FormEvent) => { e.preventDefault(); return run(async () => {
    const { data } = await twofaApi.enable(code);
    setBackupCodes(data.backupCodes);
    setSetup(null);
    setCode('');
    await reloadUser();
  }); };
  const disable = (e: FormEvent) => { e.preventDefault(); return run(async () => {
    await twofaApi.disable(password);
    setPassword('');
    setBackupCodes(null);
    await reloadUser();
  }); };

  return (
    <>
      <header>
        <h1 className="text-3xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-mute">Two-factor authentication is {user?.totpEnabled ? 'on' : 'off'}.</p>
      </header>

      {backupCodes && (
        <Card title="Save your backup codes" subtitle="Each code works once. They won't be shown again.">
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((c) => <li key={c} className="rounded-lg border border-line px-3 py-2">{c}</li>)}
          </ul>
        </Card>
      )}

      {!user?.totpEnabled && !setup && (
        <Card title="Turn on two-factor authentication" subtitle="Use an authenticator app like Google Authenticator or Authy.">
          <Button onClick={start}>Set up 2FA</Button>
        </Card>
      )}

      {setup && (
        <Card title="Scan this QR code" subtitle="Then enter the 6-digit code your app shows.">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <img src={setup.qrDataUrl} alt="Two-factor setup QR code" className="h-44 w-44 rounded-lg bg-white p-2" />
            <form onSubmit={enable} className="flex w-full max-w-xs flex-col gap-4">
              <div className="break-all font-mono text-xs text-mute">Manual key: {setup.secret}</div>
              <Field id="code" label="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} autoComplete="one-time-code" required />
              <Button type="submit">Turn on 2FA</Button>
            </form>
          </div>
        </Card>
      )}

      {user?.totpEnabled && (
        <Card title="Turn off two-factor authentication" subtitle="Confirm with your password.">
          <form onSubmit={disable} className="flex max-w-xs flex-col gap-4">
            <Field id="pw" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            <Button type="submit" variant="danger">Turn off 2FA</Button>
          </form>
        </Card>
      )}

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </>
  );
}
