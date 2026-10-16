# Run locally

```powershell
docker compose up --build
```

Open http://localhost:8080. The frontend sends `/api/*` requests through Nginx to the backend, and the backend connects to the PostgreSQL `db` service. Database migrations run automatically before the backend starts.

For Vite development, run `npm run dev` in `backend` and `frontend` in separate terminals; the backend applies database migrations on startup, and the Vite proxy forwards `/api` to `http://localhost:4000`.

# Security tests (your next step)

Write tests here that attack the API and prove it holds:

- Brute force: 5 wrong passwords lock the account (429 on the 6th try, even with the right password)
- Refresh-token replay: use an old refresh token after rotation, expect 401 and the whole family revoked
- RBAC: a normal user calling any `/api/admin/*` route gets 403
- Revoked session: an access token stops working immediately after its session is revoked
- 2FA: a login without the code never returns an access token; backup codes work only once
- Rate limit: more than 20 login requests in 15 minutes get 429

Suggested tools: vitest + supertest, against a throwaway Postgres database.
