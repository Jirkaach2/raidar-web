import { Client, Account, Databases, Functions, Storage, ID, Query, OAuthProvider, ExecutionMethod, AuthenticatorType, AuthenticationFactor, type Models } from 'appwrite';

// ─── Environment ──────────────────────────────────────────
export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
export const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID || 'raidar';
export const PLANS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PLANS_COLLECTION_ID || 'plans';
export const SUBSCRIPTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';
export const ANNOUNCEMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ANNOUNCEMENTS_COLLECTION_ID || 'announcements';

// ─── Stripe / billing ─────────────────────────────────────
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
/** ID of the Appwrite Function that creates Stripe Checkout sessions. */
export const CHECKOUT_FUNCTION_ID = import.meta.env.VITE_APPWRITE_CHECKOUT_FUNCTION_ID || 'stripe-checkout';
/** ID of the Appwrite Function that opens the Stripe billing portal. */
export const PORTAL_FUNCTION_ID = import.meta.env.VITE_APPWRITE_PORTAL_FUNCTION_ID || 'stripe-portal';
/** ID of the admin-only user-management / stats Appwrite Function. */
export const ADMIN_FUNCTION_ID = import.meta.env.VITE_APPWRITE_ADMIN_FUNCTION_ID || 'admin-api';
/** Public URL of the steam-auth function (its custom domain or *.appwrite.run). */
export const STEAM_AUTH_URL = import.meta.env.VITE_STEAM_AUTH_URL || '';
/** Function ID of steam-auth, used for authenticated SDK calls (e.g. set email). */
export const STEAM_FUNCTION_ID = import.meta.env.VITE_APPWRITE_STEAM_FUNCTION_ID || 'steam-auth';
/** True once the Steam login endpoint is configured. */
export const steamEnabled = Boolean(STEAM_AUTH_URL);
/** True once a Stripe publishable key is present so paid checkout is available. */
export const billingEnabled = Boolean(STRIPE_PUBLISHABLE_KEY);

/** True when the public env vars are present so the app can talk to Appwrite. */
export const isConfigured = Boolean(PROJECT_ID);

// ─── SDK singletons ───────────────────────────────────────
export const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage = new Storage(client);

export { ID, Query, OAuthProvider, ExecutionMethod, AuthenticatorType, AuthenticationFactor };

/** Storage bucket that holds user-uploaded avatars. */
export const AVATARS_BUCKET_ID = import.meta.env.VITE_APPWRITE_AVATARS_BUCKET_ID || 'avatars';

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
  /** Complimentary admin-granted plan (no payment). */
  comp?: boolean;
  /** When a comp grant ends (ISO). Null/empty = no expiry. */
  expiresAt?: string;
  /** Admin user id that issued a comp grant. */
  grantedBy?: string;
}

export type AppUser = Models.User<Models.Preferences>;

export interface Announcement extends Models.Document {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImage?: string;
  type: 'announcement' | 'blog';
  published: boolean;
  pinned?: boolean;
  authorName?: string;
}

/** Admins are flagged with the `admin` label on their Appwrite account. */
export function userIsAdmin(user: AppUser | null): boolean {
  return !!user?.labels?.includes('admin');
}
