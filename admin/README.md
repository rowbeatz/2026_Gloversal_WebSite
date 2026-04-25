# Gloversal Admin Panel — LOCAL ONLY

> **DO NOT DEPLOY THIS FOLDER TO CLOUDFLARE PAGES OR ANY PUBLIC HOST.**
>
> This is a hidden CMS that runs locally via Docker on the operator's
> machine. It contains plaintext API keys (in `.env` and `settings.json`)
> and an admin authentication endpoint that is NOT hardened for the public
> internet (single user, no rate limiting, no CSRF, CORS = `*`).

## What protects this folder from being deployed

1. **Cloudflare Pages build output is `site/` only** — anything outside
   `site/` is invisible to the deployed origin. The `admin/` folder being
   in the git repo does not put it on the live site.

2. **`site/_redirects`** — even if `admin/` files were ever accidentally
   copied into `site/`, Cloudflare returns 404 for `/admin/*` and `/api/*`.

3. **`.gitignore`** — excludes `.env`, `admin/settings.json`,
   `__pycache__/`, and anything else that would leak credentials.

## Running locally

```bash
cd admin
cp .env.example .env          # then edit .env with your credentials
docker compose up -d --build
```

Then open http://localhost:8080 and log in with the credentials you set
in `.env`.

## Stopping

```bash
cd admin
docker compose down
```

## What stays in git

- All Python source under `backend/`
- All HTML/CSS/JS under `frontend/`
- `Dockerfile`, `docker-compose.yml`, `requirements.txt`
- `.env.example` (template, no real secrets)
- This README

## What is excluded from git

- `.env` (real credentials)
- `settings.json` (saved API keys for AI providers)
- `__pycache__/` (Python bytecode)

## Future: production deployment

If you ever want to expose this admin panel publicly, do NOT just push it
to Cloudflare Pages. Either:

- **Port to Cloudflare Workers + KV** — rewrite FastAPI as a Worker so it
  runs on the same domain. Recommended path for `gloversal.com/admin`.
- **Deploy to a separate Docker host** — Railway, Fly.io, Render. Use
  a subdomain like `admin.gloversal.com`. Add HTTPS, rate limiting, and
  proper CORS before going live.
