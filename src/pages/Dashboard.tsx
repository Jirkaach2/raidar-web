import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Server, CalendarDays, Mail, CreditCard, Crown, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  databases, DB_ID, PLANS_COLLECTION_ID, SUBSCRIPTIONS_COLLECTION_ID,
  Query, ID, isConfigured, billingEnabled, type Plan, type Subscription,
} from '../lib/appwrite';
import { startCheckout, openBillingPortal } from '../lib/billing';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [portalBusy, setPortalBusy] = useState(false);
  const [params, setParams] = useSearchParams();

  /** Fetch the user's subscriptions, newest first, and delete any duplicates. */
  const fetchSub = useCallback(async (): Promise<Subscription | null> => {
    if (!user) return null;
    const res = await databases.listDocuments<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, [
      Query.equal('userId', user.$id), Query.orderDesc('$createdAt'), Query.limit(25),
    ]);
    const docs = res.documents;
    // Self-heal: one subscription per user — remove any extras.
    if (docs.length > 1) {
      await Promise.allSettled(docs.slice(1).map((d) => databases.deleteDocument(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, d.$id)));
    }
    return docs[0] || null;
  }, [user]);

  const load = useCallback(async () => {
    if (!isConfigured || !user) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [planRes, subDoc] = await Promise.all([
        databases.listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(20)]),
        fetchSub(),
      ]);
      setPlans(planRes.documents);
      setSub(subDoc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user, fetchSub]);

  useEffect(() => { load(); }, [load]);

  // Handle return from Stripe Checkout (?checkout=success|cancel).
  useEffect(() => {
    const status = params.get('checkout');
    if (!status) return;
    if (status === 'success') {
      setNotice('Payment received — your plan is being activated. This can take a few seconds.');
      const timers = [2000, 5000].map((ms) => setTimeout(() => load(), ms));
      params.delete('checkout'); setParams(params, { replace: true });
      return () => timers.forEach(clearTimeout);
    }
    if (status === 'cancel') {
      setNotice('Checkout cancelled — your plan was not changed.');
      params.delete('checkout'); setParams(params, { replace: true });
    }
  }, [params, setParams, load]);

  const choosePlan = async (plan: Plan) => {
    if (!user || savingId) return; // guard against concurrent clicks
    setError('');
    if (plan.price > 0 && plan.stripePriceId && billingEnabled) {
      setSavingId(plan.$id);
      try { await startCheckout(plan); return; }
      catch (err) { setError(err instanceof Error ? err.message : 'Could not start checkout.'); setSavingId(null); return; }
    }
    setSavingId(plan.$id);
    try {
      // Re-fetch right before writing so we never create a second doc.
      const existing = await fetchSub();
      if (existing) {
        const updated = await databases.updateDocument<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, existing.$id, {
          planId: plan.$id, planName: plan.name, status: 'active',
        });
        setSub(updated);
      } else {
        const created = await databases.createDocument<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, ID.unique(), {
          userId: user.$id, planId: plan.$id, planName: plan.name, status: 'active',
        });
        setSub(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change your plan.');
    } finally {
      setSavingId(null);
    }
  };

  const manageBilling = async () => {
    setPortalBusy(true); setError('');
    try { await openBillingPortal(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not open the billing portal.'); setPortalBusy(false); }
  };

  const currentPlan = plans.find((p) => p.$id === sub?.planId) || null;
  const planName = currentPlan?.name || sub?.planName || 'Scout';
  const planPrice = currentPlan ? (currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/mo`) : 'Free';
  const status = sub?.status || 'active';
  const initial = (user?.name || user?.email || 'R')[0].toUpperCase();

  return (
    <div className="dash">
      <div className="dash-head">
        <div className="dash-greet">
          <span className="dash-avatar">{initial}</span>
          <div>
            <h1>Your dashboard</h1>
            <p className="muted">Welcome back, {user?.name || user?.email}.</p>
          </div>
        </div>
        {isAdmin && <Link className="btn btn-ghost btn-sm" to="/admin"><ShieldCheck size={14} /> Admin</Link>}
      </div>

      {!isConfigured && <div className="auth-notice">Appwrite isn’t configured. Set the <code>VITE_APPWRITE_*</code> env vars to enable plans.</div>}
      {notice && <div className="dash-notice">{notice}</div>}
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Current plan hero + stats */}
      <div className="dash-top">
        <div className="dash-hero bracketed">
          <span className="hud-label hud-label--accent">// Current plan</span>
          <div className="dash-hero-row">
            <div className="dash-hero-ic"><Crown size={22} /></div>
            <div>
              <div className="dash-hero-plan">{planName}</div>
              <div className="dash-hero-price">{planPrice}</div>
            </div>
            <span className={`status-dot ${status}`}>{status}</span>
          </div>
          {sub?.renewsAt && <div className="dash-hero-meta">Renews {new Date(sub.renewsAt).toLocaleDateString()}</div>}
          <div className="dash-hero-actions">
            <a href="#plans" className="btn btn-sm"><Zap size={14} /> Change plan</a>
            {sub?.stripeCustomerId && (
              <button className="btn btn-ghost btn-sm" onClick={manageBilling} disabled={portalBusy}>
                <CreditCard size={14} /> {portalBusy ? 'Opening…' : 'Manage billing'}
              </button>
            )}
          </div>
        </div>

        <div className="dash-stats">
          <div className="dash-stat"><span className="dash-stat-ic"><Server size={16} /></span><div><div className="dash-stat-v">{currentPlan ? (currentPlan.servers < 0 ? '∞' : currentPlan.servers) : 1}</div><div className="dash-stat-l">Linked servers</div></div></div>
          <div className="dash-stat"><span className="dash-stat-ic"><CalendarDays size={16} /></span><div><div className="dash-stat-v">{user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : '—'}</div><div className="dash-stat-l">Member since</div></div></div>
          <div className="dash-stat"><span className="dash-stat-ic"><Mail size={16} /></span><div><div className="dash-stat-v dash-stat-email">{user?.email}</div><div className="dash-stat-l">Account email</div></div></div>
        </div>
      </div>

      <section className="dash-section" id="plans">
        <h2>Manage your plan</h2>
        <p className="muted">Switch plans anytime. Free plans apply instantly; paid plans go through secure checkout.</p>

        {loading ? (
          <div className="route-loading"><div className="spinner" /><span>Loading plans…</span></div>
        ) : plans.length === 0 ? (
          <p className="muted">No plans available yet. Check back soon.</p>
        ) : (
          <div className="pricing-grid">
            {plans.map((p) => {
              const isCurrent = p.$id === sub?.planId;
              return (
                <div className={`price-card ${p.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`} key={p.$id}>
                  {isCurrent ? <div className="price-badge">Current</div> : p.popular && <div className="price-badge">Popular</div>}
                  <h3>{p.name}</h3>
                  {p.tagline && <p className="price-tagline">{p.tagline}</p>}
                  <div className="price">
                    {p.price === 0 ? <span className="price-amt">Free</span> : <><span className="price-amt">${p.price}</span><span className="price-per">/mo</span></>}
                  </div>
                  <ul className="price-features">
                    {(p.features || []).map((f) => <li key={f}><Check /> {f}</li>)}
                  </ul>
                  <button
                    className={`btn ${isCurrent ? 'btn-ghost' : ''}`}
                    disabled={isCurrent || !!savingId}
                    onClick={() => choosePlan(p)}
                    style={{ width: '100%' }}
                  >
                    {isCurrent ? 'Active plan'
                      : savingId === p.$id ? (p.price > 0 ? 'Redirecting…' : 'Switching…')
                        : p.price > 0 ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
