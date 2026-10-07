# CHAMAK STORE — Cloudflare D1 Web App

This version is designed for mobile-first online use with Cloudflare Workers + D1.

## Deployment
1. Create a Cloudflare account.
2. Create a D1 database named `chamak-store-db`.
3. Put its database ID into `wrangler.toml`.
4. Apply `migrations/0001_initial.sql` to the remote D1 database.
5. Deploy the Worker.

The existing Excel data should be imported using the generated `seed.sql` after the D1 database is created.

## Data
All live records are stored in Cloudflare D1, not in the phone browser.

## Important
Do not commit secrets or production credentials to GitHub.
