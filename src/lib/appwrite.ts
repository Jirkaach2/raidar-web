import { Client, Account, Databases, Functions, ID, Query, OAuthProvider, ExecutionMethod, type Models } from 'appwrite';

// ─── Environment ──────────────────────────────────────────
export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
export const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID || 'raidar';
export const PLANS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PLANS_COLLECTION_ID || 'plans';
export const SUBSCRIPTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';

// ─── Stripe / billing ─────────────────────────────────────
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
/** ID of the Appwrite Function that creates Stripe Checkout sessions. */
export const CHECKOUT_FUNCTION_ID = import.meta.env.VITE_APPWRITE_CHECKOUT_FUNCTION_ID || 'stripe-checkout';
/** ID of the Appwrite Function that opens the Stripe billing portal. */
export const PORTAL_FUNCTION_ID = import.meta.env.VITE_APPWRITE_PORTAL_FUNCTION_ID || 'stripe-portal';
/** True once a Stripe publishable key is present so paid checkout is available. */
export const billingEnabled = Boolean(STRIPE_PUBLISHABLE_KEY);

/** True when the public env vars are present so the app can talk to Appwrite. */
export const isConfigured = Boolean(PROJECT_ID);

// ─── SDK singletons ───────────────────────────────────────
export const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export { ID, Query, OAuthProvider, ExecutionMethod };

// ─── Domain types ─────────────────────────────────────────
export interface Plan extends Models.Document {
  name: string;
  price: number; // monthly price in USD
  tagline?: string;
  features: string[]; // array attribute
  servers: number; // max linked servers (-1 = unlimited)
  popular?: boolean;
  order?: number;
  stripePriceId?: string; // Stripe Price ID for paid plans
}

export interface Subscription extends Models.Document {
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'cancelled' | 'past_due';
  renewsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export type AppUser = Models.User<Models.Preferences>;

/** Admins are flagged with the `admin` label on their Appwrite account. */
export function userIsAdmin(user: AppUser | null): boolean {
  return !!user?.labels?.includes('admin');
}
