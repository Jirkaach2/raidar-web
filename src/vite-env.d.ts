/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT?: string;
  readonly VITE_APPWRITE_PROJECT_ID?: string;
  readonly VITE_APPWRITE_DB_ID?: string;
  readonly VITE_APPWRITE_PLANS_COLLECTION_ID?: string;
  readonly VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_APPWRITE_CHECKOUT_FUNCTION_ID?: string;
  readonly VITE_APPWRITE_PORTAL_FUNCTION_ID?: string;
  readonly VITE_APPWRITE_ADMIN_FUNCTION_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
