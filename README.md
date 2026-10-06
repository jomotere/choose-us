# Choose Us: deploy to Cloudflare (free)

Uses Cloudflare Pages (site), Pages Functions (API) and D1 (database). All three have free tiers.

1. Install Node.js, then run: `npm i -g wrangler` and `wrangler login`
2. Create the database: `wrangler d1 create chooseus-db`
   Copy the `database_id` it prints into `wrangler.toml`.
3. Create the table: `wrangler d1 execute chooseus-db --remote --file=schema.sql`
4. Deploy from this folder: `wrangler pages deploy`
   Your site goes live at `https://chooseus.pages.dev` (or similar).

If you deploy from GitHub instead: in Pages, go to Settings > Bindings, add a D1 binding named `DB`, and select `chooseus-db`.

Folders: `public/` is the website, `functions/api/` is the backend, `schema.sql` is the database table.

How privacy works: each partner gets a secret token on their own device. The server never sends one partner's answers to the other, only whether both are ready and a combined roadmap.
