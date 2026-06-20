# Raidar — Web App

The marketing site, documentation, and account/plan dashboard for **Raidar**, the Rust
intelligence app (desktop overlay + Discord bot).

Built with **Vite + React + TypeScript**, with authentication, plan management and an admin
dashboard powered by **Appwrite** (Auth + Databases). Designed to deploy on **Appwrite Sites**.

## Pages & routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Landing — marketing, features, how-it-works, pricing | Public |
| `/docs` | Documentation — app features + Discord bot command reference | Public |
| `/login` | Sign in | Public |
| `/register` | Create account | Public |
| `/dashboard` | Manage your current plan & linked-server allowance | Authenticated |
| `/admin` | Plans CRUD + subscriptions overview | Admins only (`admin` label) |

## Develop

```bash
npm install
cp .env.example .env   # then fill in your Appwrite IDs
npm run dev            # http://localhost:5173
```

The site runs without Appwrite configured (pricing shows fallback plans), but auth and the
dashboard need a real project. Set `VITE_APPWRITE_PROJECT_ID` to enable them.

## Build

```bash
npm run build    # type-checks then outputs to dist/
npm run preview
```

## Appwrite setup

### 1. Project & platform
1. Create a project in the [Appwrite console](https://cloud.appwrite.io).
2. Under **Settings → Platforms**, add a **Web** platform with your site's hostname
   (e.g. `raidar.appwrite.network` and `localhost` for dev).
3. Copy the **Project ID** and **API endpoint** into `.env`.

### 2. Auth
- Enable the **Email/Password** auth method (Auth → Settings).
- **OAuth (Discord / Google):** under **Auth → Settings → OAuth2 Providers**, enable Discord and
  Google and paste their client id/secret. In each provider's developer console add the Appwrite
  callback URL shown in the console (e.g. `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/discord/<projectId>`).
  The app's sign-in/up pages then show Discord & Google buttons automatically.
- To make a user an admin, open **Auth → Users → (user) → Labels** and add the label `admin`.
  The app shows the `/admin` route only to users carrying this label.

### 3. Database
Create a database (default id `raidar`) with two collections:

**`plans` collection** (`VITE_APPWRITE_PLANS_COLLECTION_ID`)

| Attribute | Type | Notes |
| --- | --- | --- |
| `name` | String | required |
| `price` | Integer/Float | monthly USD, `0` = free |
| `tagline` | String | optional |
| `features` | String[] | array, one feature per item |
| `servers` | Integer | max linked servers, `-1` = unlimited |
| `popular` | Boolean | highlights the card |
| `order` | Integer | sort order |
| `stripePriceId` | String | Stripe Price ID (`price_…`); required for paid plans |

Permissions: **Read = Any** (so the landing page can show pricing). **Create/Update/Delete =**
restrict to your admin team (e.g. a `team:admins` role or specific users).

**`subscriptions` collection** (`VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`)

| Attribute | Type | Notes |
| --- | --- | --- |
| `userId` | String | Appwrite user `$id` |
| `planId` | String | plan document id |
| `planName` | String | denormalised for display |
| `status` | String | `active` / `cancelled` / `past_due` |
| `renewsAt` | Datetime | optional |
| `stripeCustomerId` | String | optional, set by the webhook |
| `stripeSubscriptionId` | String | optional, set by the webhook |

Permissions: enable **Document Security** and grant **Users** create access. Each user reads/writes
only their own subscription. Admins (team) get read access to all for the overview.

### 4. Environment
Fill `.env` from `.env.example`:

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=xxxxxxxx
VITE_APPWRITE_DB_ID=raidar
VITE_APPWRITE_PLANS_COLLECTION_ID=plans
VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=subscriptions
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_APPWRITE_CHECKOUT_FUNCTION_ID=stripe-checkout
```

## Stripe billing

Paid plans use **Stripe Checkout**, driven by two Appwrite Functions in `functions/` so the Stripe
**secret key never touches the browser**. Free plans switch instantly without Stripe.

### 1. Stripe dashboard
1. Create a **Product + recurring Price** for each paid plan. Copy each `price_…` id.
2. In the Raidar **Admin** page, paste the matching `price_…` into the plan's **Stripe Price ID**.
3. Copy your **publishable** key into `VITE_STRIPE_PUBLISHABLE_KEY` and your **secret** key into the
   functions' env (below). Never commit the secret key.

### 2. `stripe-checkout` function (`functions/stripe-checkout`)
- Runtime **Node 18+**, entrypoint `src/main.js`, build command `npm install`.
- Execute access: **Users** (so signed-in users can call it).
- Environment variables:
  - `STRIPE_SECRET_KEY` = `sk_…`
  - `APPWRITE_API_KEY` = key with `databases.read` on the plans collection
  - `APPWRITE_DB_ID`, `APPWRITE_PLANS_COLLECTION_ID` (match your IDs)
  - `SITE_URL` = your deployed site origin (e.g. `https://raidar.appwrite.network`)
- Set its function ID into `VITE_APPWRITE_CHECKOUT_FUNCTION_ID`.

### 3. `stripe-webhook` function (`functions/stripe-webhook`)
- Same runtime/entrypoint. Execute access: **Any** (Stripe calls it).
- Environment variables:
  - `STRIPE_SECRET_KEY` = `sk_…`
  - `STRIPE_WEBHOOK_SECRET` = `whsec_…` (from the Stripe webhook you create)
  - `APPWRITE_API_KEY` = key with `databases.read`/`write` on the subscriptions collection
  - `APPWRITE_DB_ID`, `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
- In Stripe → **Developers → Webhooks**, add an endpoint pointing at this function's URL and
  subscribe to `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`. Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.

### 4. `stripe-portal` function (`functions/stripe-portal`)
- Same runtime/entrypoint. Execute access: **Users**.
- Environment variables:
  - `STRIPE_SECRET_KEY` = `sk_…`
  - `APPWRITE_API_KEY` = key with `databases.read` on the subscriptions collection
  - `APPWRITE_DB_ID`, `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
  - `SITE_URL` = your deployed site origin
- Set its function ID into `VITE_APPWRITE_PORTAL_FUNCTION_ID`. Enable the **Customer portal** in
  Stripe (Settings → Billing → Customer portal). The dashboard shows a **Manage billing** button
  once a user has a Stripe customer, letting them update their card, change or cancel their plan.

### 5. `admin-api` function (`functions/admin-api`)
Powers the **Users** tab and **Overview** stats in the admin dashboard (the Web SDK can't manage
other users, so this runs server-side and is gated to admins).
- Runtime **Node 18+**, entrypoint `src/main.js`, build `npm install`. Execute access: **Users**.
- Environment variables:
  - `APPWRITE_API_KEY` = key with scopes `users.read`, `users.write`, `databases.read`, `documents.read/write`
  - `APPWRITE_DB_ID`, `APPWRITE_PLANS_COLLECTION_ID`, `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
- Set its function ID into `VITE_APPWRITE_ADMIN_FUNCTION_ID`.
- Every request is verified server-side: the caller must already carry the `admin` label, so only
  admins can list users, grant/revoke admin, block/unblock or delete accounts, or read stats.
  Bootstrap your **first** admin once by adding the `admin` label manually in Auth → Users → Labels.

Flow: Dashboard → *Upgrade* → checkout function returns a Checkout URL → user pays on Stripe →
Stripe redirects back to `/dashboard?checkout=success` and fires the webhook, which activates the
subscription. The dashboard re-polls for a few seconds to reflect the change.

## Deploy on Appwrite Sites

1. In the console go to **Sites → Create site** and connect this repo (or upload `dist/`).
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. Add the `VITE_APPWRITE_*` variables under the site's **Environment variables**.
4. **SPA fallback:** set the site's *Fallback file* to `index.html` so client-side routes
   (`/docs`, `/dashboard`, …) resolve on refresh.
5. Add the deployed domain to your Appwrite **Web platform** hosts.

## Structure

```
src/
  lib/appwrite.ts         Appwrite SDK clients, domain types, admin helper
  lib/billing.ts          Stripe Checkout helper (calls the checkout function)
  context/AuthContext.tsx Session/user state, login/register/logout, OAuth
  components/             Nav, Footer, ProtectedRoute, OAuthButtons
  pages/                  Landing, Docs, Login, Register, Dashboard, Admin, NotFound
  index.css               Raidar theme (dark + #ce422b accent)
functions/
  stripe-checkout/        Appwrite Function — creates Checkout sessions
  stripe-webhook/         Appwrite Function — syncs subscriptions from Stripe
  stripe-portal/          Appwrite Function — opens the Stripe billing portal
  admin-api/              Appwrite Function — admin user management + stats
public/                   raidar-banner.png, favicon.svg
```
