# Deploying Raidar to Appwrite

This walks through deploying the whole web app (auth + database + Stripe functions + the site)
to Appwrite. You can do everything in the **Console** (web UI) or speed up the database/functions
with the **CLI** using the included `appwrite.json`.

## 0. Prerequisites
- An Appwrite Cloud account (your Pro plan).
- Node 18+ and the Appwrite CLI: `npm i -g appwrite-cli`
- Your code pushed to a Git repo (GitHub/GitLab) — needed for Sites auto-deploy.
- Your Stripe keys (publishable + a freshly rolled secret key) and, later, a webhook secret.

## 1. Create the project
1. Appwrite Console → **Create project** → name it `Raidar`.
2. Copy the **Project ID** and the **API endpoint** (Cloud = `https://cloud.appwrite.io/v1`).

## 2. Add the database + functions (CLI — fast path)
From the `raidar-web/` folder:
```bash
appwrite login
# put your real project id into appwrite.json first (replace YOUR_PROJECT_ID)
appwrite push collections      # creates the raidar DB + plans & subscriptions collections
appwrite push functions        # creates & deploys stripe-checkout / -webhook / -portal
```
> Prefer clicking? See the **Database** and **Functions** tables in `README.md` and create them
> manually in the Console instead. The CLI just does it for you.

## 3. Auth
- **Auth → Settings** → enable **Email/Password**.
- Enable **Discord** and **Google** OAuth2 providers. Paste each provider's client id/secret, and
  copy Appwrite's callback URL into the provider's developer console.
- Make yourself an admin: **Auth → Users → (you) → Labels** → add `admin`.

## 4. Function environment variables
For each function (**Functions → (name) → Settings → Variables**) add:

**stripe-checkout** and **stripe-portal**
```
STRIPE_SECRET_KEY=sk_test_...            (sk_live_... in production)
APPWRITE_API_KEY=<API key, scope: databases.read + documents.read/write>
APPWRITE_DB_ID=raidar
APPWRITE_PLANS_COLLECTION_ID=plans
APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=subscriptions
SITE_URL=https://<your-site-domain>
```
**stripe-webhook** (same as above, plus):
```
STRIPE_WEBHOOK_SECRET=whsec_...
```
Create the API key under **Settings → API keys** (or **Integrations**) with database read/write scopes.

## 5. Stripe
1. **Products** → create a product + recurring **Price** per paid plan; copy each `price_...`.
2. **Developers → Webhooks** → add endpoint = the **stripe-webhook** function's domain URL
   (Functions → stripe-webhook → Domains). Subscribe to:
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Settings → Billing → Customer portal** → activate it (needed for Manage billing).

## 6. Deploy the site (Appwrite Sites)
1. **Sites → Create site** → connect your Git repo (pick the `raidar-web` root).
2. Framework preset **Vite** · Build command `npm run build` · Output directory `dist`.
3. **Environment variables** (Site settings):
   ```
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=<your project id>
   VITE_APPWRITE_DB_ID=raidar
   VITE_APPWRITE_PLANS_COLLECTION_ID=plans
   VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=subscriptions
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   VITE_APPWRITE_CHECKOUT_FUNCTION_ID=stripe-checkout
   VITE_APPWRITE_PORTAL_FUNCTION_ID=stripe-portal
   ```
4. **SPA fallback**: set the site's *Fallback file* to `index.html` so `/docs`, `/dashboard`, etc.
   resolve on refresh.
5. Deploy. Note the live domain.

## 7. Wire the domain back
- **Auth → Settings → Platforms** → add a **Web** platform with your site domain (and `localhost`
  for dev) so the SDK is allowed to talk to Appwrite.
- Set `SITE_URL` on the three functions to the live domain (re-deploy if you change it).
- Update the Stripe webhook URL / OAuth callback URLs if your domain changed.

## 8. Seed plans
Sign in as your admin user → **/admin** → create your plans (Scout free, Raider, Clan). Paste the
matching Stripe `price_...` into each paid plan. Done — the landing page, dashboard and checkout
now run against real data.

## Sanity checklist
- [ ] Landing page shows your plans (not the fallback three)
- [ ] Register / Login works, plus Discord & Google buttons
- [ ] Free plan switch is instant on the dashboard
- [ ] Upgrade redirects to Stripe Checkout and back to `/dashboard?checkout=success`
- [ ] Webhook flips the subscription to active (check Functions → stripe-webhook logs)
- [ ] Manage billing opens the Stripe portal
