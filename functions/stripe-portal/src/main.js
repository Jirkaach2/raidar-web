import { Client, Databases, Query } from 'node-appwrite';
import Stripe from 'stripe';

/**
 * Creates a Stripe Billing Portal session so the signed-in user can manage their
 * subscription (update card, change plan, cancel) and returns its URL.
 *
 * The user is read from `x-appwrite-user-id`; their Stripe customer id is looked
 * up server-side from their subscription document, so nothing is trusted from
 * the client body.
 *
 * Response: { "url": "https://billing.stripe.com/..." }
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY
 *   APPWRITE_API_KEY                       databases.read on subscriptions
 *   APPWRITE_DB_ID                        default: raidar
 *   APPWRITE_SUBSCRIPTIONS_COLLECTION_ID  default: subscriptions
 *   SITE_URL                              return target, e.g. https://raidar.appwrite.network
 */
export default async ({ req, res, log, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) return res.json({ error: 'Not authenticated.' }, 401);

    const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const dbId = process.env.APPWRITE_DB_ID || 'raidar';
    const colId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);

    const list = await databases.listDocuments(dbId, colId, [Query.equal('userId', userId), Query.limit(1)]);
    const sub = list.documents[0];
    if (!sub || !sub.stripeCustomerId) {
      return res.json({ error: 'No billing account found for this user.' }, 404);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${siteUrl}/dashboard`,
    });

    log(`Opened billing portal for user ${userId}`);
    return res.json({ url: session.url });
  } catch (err) {
    error(`portal failed: ${err.message}`);
    return res.json({ error: 'Could not open the billing portal.' }, 500);
  }
};
