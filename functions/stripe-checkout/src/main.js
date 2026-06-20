import { Client, Databases } from 'node-appwrite';
import Stripe from 'stripe';

/**
 * Creates a Stripe Checkout Session for a Raidar plan and returns its URL.
 *
 * Trust model: the authenticated Appwrite user is read from the request headers
 * (`x-appwrite-user-id`), never from the request body. The plan (and therefore
 * the Stripe price) is looked up server-side from the database so the client
 * can't pay for an arbitrary price.
 *
 * Request body: { "planId": "<plan document id>" }
 * Response:     { "url": "https://checkout.stripe.com/..." }
 *
 * Required environment variables:
 *   STRIPE_SECRET_KEY            sk_… (test or live)
 *   APPWRITE_API_KEY            API key with databases.read on the plans collection
 *   APPWRITE_DB_ID             default: raidar
 *   APPWRITE_PLANS_COLLECTION_ID  default: plans
 *   SITE_URL                   e.g. https://raidar.appwrite.network
 * Optional:
 *   APPWRITE_FUNCTION_API_ENDPOINT is provided automatically by Appwrite.
 */
export default async ({ req, res, log, error }) => {
  try {
    const userId = req.headers['x-appwrite-user-id'];
    const userEmail = req.headers['x-appwrite-user-email'] || undefined;
    if (!userId) {
      return res.json({ error: 'Not authenticated.' }, 401);
    }

    let body = {};
    try { body = JSON.parse(req.body || req.bodyRaw || '{}'); } catch { /* ignore */ }
    const planId = body.planId;
    if (!planId) return res.json({ error: 'Missing planId.' }, 400);

    const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const dbId = process.env.APPWRITE_DB_ID || 'raidar';
    const plansColId = process.env.APPWRITE_PLANS_COLLECTION_ID || 'plans';
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');

    const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
    const databases = new Databases(client);

    const plan = await databases.getDocument(dbId, plansColId, planId);
    if (!plan.stripePriceId) {
      return res.json({ error: 'This plan is not purchasable.' }, 400);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancel`,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: { userId, planId, planName: plan.name },
      subscription_data: { metadata: { userId, planId, planName: plan.name } },
      allow_promotion_codes: true,
    });

    log(`Created checkout session ${session.id} for user ${userId} → plan ${plan.name}`);
    return res.json({ url: session.url });
  } catch (err) {
    error(`checkout failed: ${err.message}`);
    return res.json({ error: 'Could not create checkout session.' }, 500);
  }
};
