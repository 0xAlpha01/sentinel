import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { errorMessage } from '../../utils/format';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import AuthShell from './AuthShell';

export default function LoginPage() {
  const { user, login, verifyMfa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mfaToken) {
        await verifyMfa(mfaToken, code);
        navigate('/');
      } else {
        const res = await login(email, password);
        if (res.mfaToken) setMfaToken(res.mfaToken);
        else navigate('/');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title={mfaToken ? 'Enter your code' : 'Sign in'}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mfaToken ? (
          <Field id="code" label="Authenticator code or backup code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" autoFocus required />
        ) : (
          <>
            <Field id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <Field id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </>
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Checking…' : mfaToken ? 'Verify' : 'Sign in'}</Button>
      </form>
      {!mfaToken && <p className="mt-4 text-sm text-mute">No account? <Link to="/register" className="text-accent underline">Create one</Link></p>}
    </AuthShell>
  );
}
