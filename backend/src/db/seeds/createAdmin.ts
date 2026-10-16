import 'dotenv/config';
import { pool } from '../pool';
import { hashPassword } from '../../utils/password';

async function run() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');

  const hash = await hashPassword(password);
  await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    [email, hash],
  );
  console.log(`admin ready: ${email}`);
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
