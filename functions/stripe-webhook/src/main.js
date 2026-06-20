import { Client, Databases, Query, ID, Permission, Role } from 'node-appwrite';
import Stripe from 'stripe';

/**
 * Receives Stripe webhooks and keeps the Raidar `subscriptions` collection in
 * sync. Verifies the Stripe signature against the raw request body.
 *
 * Configure this function's URL as a Stripe webhook endpoint and subscribe to:
 *   - checkout.session.completed
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *
 * IMPORTANT: in the Appwrite Function settings, leave the HTTP body untouched
 * (the raw body is required for signature verification).
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET            whsec_…
 *   APPWRITE_API_KEY                 databases.read/write on subscriptions
 *   APPWRITE_DB_ID                  default: raidar
 *   APPWRITE_SUBSCRIPTIONS_COLLECTION_ID  default: subscriptions
 */
export default async ({ req, res, log, error }) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const raw = req.bodyRaw || req.body || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    error(`signature verification failed: ${err.message}`);
    return res.json({ error: 'Invalid signature.' }, 400);
  }

  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const dbId = process.env.APPWRITE_DB_ID || 'raidar';
  const colId = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
  const databases = new Databases(client);

  /** Find a subscription doc by userId or stripeSubscriptionId. */
  async function findSub({ userId, stripeSubscriptionId }) {
    const queries = [];
    if (userId) queries.push(Query.equal('userId', userId));
    else if (stripeSubscriptionId) queries.push(Query.equal('stripeSubscriptionId', stripeSubscriptionId));
    else return null;
    const list = await databases.listDocuments(dbId, colId, [...queries, Query.limit(1)]);
    return list.documents[0] || null;
  }

  async function upsert(userId, data) {
    const existing = await findSub({ userId, stripeSubscriptionId: data.stripeSubscriptionId });
    if (existing) {
      await databases.updateDocument(dbId, colId, existing.$id, data);
      log(`updated subscription ${existing.$id}`);
    } else {
      await databases.createDocument(dbId, colId, ID.unique(), { userId, ...data }, [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
      ]);
      log(`created subscription for ${userId}`);
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const userId = s.client_reference_id || s.metadata?.userId;
        if (userId) {
          await upsert(userId, {
            planId: s.metadata?.planId || '',
            planName: s.metadata?.planName || 'Paid plan',
            status: 'active',
            stripeCustomerId: typeof s.customer === 'string' ? s.customer : undefined,
            stripeSubscriptionId: typeof s.subscription === 'string' ? s.subscription : undefined,
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        const status = sub.status === 'active' || sub.status === 'trialing'
          ? 'active'
          : sub.status === 'past_due' || sub.status === 'unpaid'
            ? 'past_due'
            : 'cancelled';
        if (userId) {
          await upsert(userId, {
            planId: sub.metadata?.planId || '',
            planName: sub.metadata?.planName || 'Paid plan',
            status,
            stripeSubscriptionId: sub.id,
            renewsAt: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined,
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const existing = await findSub({ stripeSubscriptionId: sub.id });
        if (existing) {
          await databases.updateDocument(dbId, colId, existing.$id, { status: 'cancelled' });
          log(`cancelled subscription ${existing.$id}`);
        }
        break;
      }
      default:
        log(`unhandled event ${event.type}`);
    }
    return res.json({ received: true });
  } catch (err) {
    error(`handler error: ${err.message}`);
    return res.json({ error: 'Handler failed.' }, 500);
  }
};
