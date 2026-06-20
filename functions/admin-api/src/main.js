import { Client, Users, Databases, Query, ID, Permission, Role } from 'node-appwrite';

/**
 * Admin API — privileged user management + dashboard stats for Raidar.
 *
 * Every call is gated: the caller (from `x-appwrite-user-id`) must carry the
 * `admin` label, verified server-side with an API key. Nothing here trusts the
 * client. Request body: { "action": "...", ...params }.
 *
 * Required environment variables:
 *   APPWRITE_API_KEY   key with: users.read, users.write, databases.read
 *   APPWRITE_DB_ID                        default: raidar
 *   APPWRITE_PLANS_COLLECTION_ID          default: plans
 *   APPWRITE_SUBSCRIPTIONS_COLLECTION_ID  default: subscriptions
 */
export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
  const dbId = process.env.APPWRITE_DB_ID || 'raidar';
  const plansCol = process.env.APPWRITE_PLANS_COLLECTION_ID || 'plans';
  const subsCol = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || 'subscriptions';

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(process.env.APPWRITE_API_KEY);
  const users = new Users(client);
  const databases = new Databases(client);

  const callerId = req.headers['x-appwrite-user-id'];
  if (!callerId) return res.json({ error: 'Not authenticated.' }, 401);

  // ── Gate: caller must be an admin ──
  try {
    const caller = await users.get(callerId);
    if (!(caller.labels || []).includes('admin')) {
      return res.json({ error: 'Admin access required.' }, 403);
    }
  } catch (e) {
    error(`auth check failed: ${e.message}`);
    return res.json({ error: 'Could not verify admin access.' }, 403);
  }

  let body = {};
  try { body = JSON.parse(req.body || req.bodyRaw || '{}'); } catch { /* ignore */ }
  const { action } = body;

  const slim = (u) => ({
    id: u.$id, name: u.name, email: u.email, labels: u.labels || [],
    status: u.status, emailVerification: u.emailVerification,
    registration: u.registration, accessedAt: u.accessedAt,
  });

  try {
    switch (action) {
      case 'listUsers': {
        const queries = [Query.limit(Math.min(100, body.limit || 100)), Query.orderDesc('$createdAt')];
        const r = await users.list(queries, body.search || undefined);
        return res.json({ total: r.total, users: r.users.map(slim) });
      }

      case 'setAdmin': {
        if (!body.userId) return res.json({ error: 'Missing userId.' }, 400);
        if (body.userId === callerId && body.value === false) {
          return res.json({ error: 'You cannot revoke your own admin access.' }, 400);
        }
        const u = await users.get(body.userId);
        const set = new Set(u.labels || []);
        if (body.value) set.add('admin'); else set.delete('admin');
        const updated = await users.updateLabels(body.userId, [...set]);
        return res.json({ user: slim(updated) });
      }

      case 'setLabels': {
        if (!body.userId) return res.json({ error: 'Missing userId.' }, 400);
        const labels = Array.isArray(body.labels) ? body.labels.filter((x) => typeof x === 'string') : [];
        const updated = await users.updateLabels(body.userId, labels);
        return res.json({ user: slim(updated) });
      }

      case 'setStatus': {
        if (!body.userId) return res.json({ error: 'Missing userId.' }, 400);
        if (body.userId === callerId) return res.json({ error: 'You cannot block your own account.' }, 400);
        const updated = await users.updateStatus(body.userId, !!body.status);
        return res.json({ user: slim(updated) });
      }

      case 'deleteUser': {
        if (!body.userId) return res.json({ error: 'Missing userId.' }, 400);
        if (body.userId === callerId) return res.json({ error: 'You cannot delete your own account.' }, 400);
        await users.delete(body.userId);
        // Best-effort: remove their subscription docs too.
        try {
          const subs = await databases.listDocuments(dbId, subsCol, [Query.equal('userId', body.userId), Query.limit(25)]);
          for (const s of subs.documents) await databases.deleteDocument(dbId, subsCol, s.$id);
        } catch { /* ignore */ }
        return res.json({ ok: true });
      }

      case 'grantPlan': {
        if (!body.userId || !body.planId) return res.json({ error: 'Missing userId or planId.' }, 400);
        // Verify the target user and plan exist.
        await users.get(body.userId);
        const plan = await databases.getDocument(dbId, plansCol, body.planId);
        const days = Number(body.days) || 0; // 0 = no expiry
        const expiresAt = days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : null;

        // One subscription per user: update the existing doc or create a new one.
        const existingList = await databases.listDocuments(dbId, subsCol, [Query.equal('userId', body.userId), Query.limit(1)]);
        const data = {
          planId: plan.$id, planName: plan.name, status: 'active',
          comp: true, expiresAt, grantedBy: callerId,
          renewsAt: expiresAt,
          // Comp grants aren't billed — clear any Stripe linkage.
          stripeSubscriptionId: null,
        };
        let doc;
        if (existingList.documents[0]) {
          doc = await databases.updateDocument(dbId, subsCol, existingList.documents[0].$id, data);
        } else {
          doc = await databases.createDocument(dbId, subsCol, ID.unique(), { userId: body.userId, ...data }, [
            Permission.read(Role.user(body.userId)),
            Permission.update(Role.user(body.userId)),
          ]);
        }
        log(`granted ${plan.name} to ${body.userId}${days ? ` for ${days}d` : ' (no expiry)'}`);
        return res.json({ subscription: doc });
      }

      case 'revokePlan': {
        if (!body.userId) return res.json({ error: 'Missing userId.' }, 400);
        const list = await databases.listDocuments(dbId, subsCol, [Query.equal('userId', body.userId), Query.limit(5)]);
        for (const s of list.documents) {
          if (body.delete) await databases.deleteDocument(dbId, subsCol, s.$id);
          else await databases.updateDocument(dbId, subsCol, s.$id, { status: 'cancelled' });
        }
        return res.json({ ok: true });
      }

      case 'stats': {
        const [userList, planList, subList] = await Promise.all([
          users.list([Query.limit(1)]),
          databases.listDocuments(dbId, plansCol, [Query.limit(50)]).catch(() => ({ documents: [] })),
          databases.listDocuments(dbId, subsCol, [Query.limit(500)]).catch(() => ({ documents: [] })),
        ]);
        const adminCount = (await users.list([Query.limit(100)])).users.filter((u) => (u.labels || []).includes('admin')).length;
        const priceByPlanId = Object.fromEntries(planList.documents.map((p) => [p.$id, p.price || 0]));
        const priceByName = Object.fromEntries(planList.documents.map((p) => [p.name, p.price || 0]));
        const byPlan = {};
        let mrr = 0;
        let active = 0;
        for (const s of subList.documents) {
          byPlan[s.planName] = (byPlan[s.planName] || 0) + 1;
          if (s.status === 'active') {
            active++;
            mrr += priceByPlanId[s.planId] ?? priceByName[s.planName] ?? 0;
          }
        }
        return res.json({
          totalUsers: userList.total,
          admins: adminCount,
          totalSubs: subList.documents.length,
          activeSubs: active,
          mrr,
          planCount: planList.documents.length,
          byPlan,
        });
      }

      default:
        return res.json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    error(`action ${action} failed: ${err.message}`);
    return res.json({ error: err.message || 'Action failed.' }, 500);
  }
};
