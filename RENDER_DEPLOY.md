# Deploying to Render

## Fix: "Failed to find Server Action"

Next.js generates Server Action IDs that can change between builds. On Render, each new deploy can produce different IDs, so the browser (or a cached bundle) may call an action the current server doesn’t know, leading to **"Failed to find Server Action"**.

**Fix:** Use a **persistent encryption key** so action IDs stay consistent across builds.

### 1. Generate a key (one-time)

From the project root:

```bash
npm run generate:action-key
```

(or `pnpm run generate:action-key`). Copy the printed base64 string (e.g. `K7gNU3sdo+OL0wNhqoVWhr...`).

### 2. Set it on Render

1. In **Render Dashboard** → your **Web Service** → **Environment**.
2. Add a variable:
   - **Key:** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
   - **Value:** the string you got from `generate:action-key`
3. Ensure this is available for **both** Build and Runtime (Render usually applies env to both).
4. **Redeploy** the service so the next build runs with this key.

After that, Server Action IDs will be stable across deploys and the error should stop.

---

## Port binding

The app uses `output: 'standalone'` and listens on `process.env.PORT`. Render sets `PORT` automatically; no extra config is needed. If you see "No open ports" in logs, confirm the start command is:

```bash
npm run start
```

(or `node server.js` if you start the standalone server directly from the `standalone` folder).
