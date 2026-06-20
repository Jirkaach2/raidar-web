import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
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
  const [params, setParams] = useSearchParams();

  const load = useCallback(async () => {
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [planRes, subRes] = await Promise.all([
        databases.listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(20)]),
        databases.listDocuments<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, [Query.equal('userId', user.$id), Query.limit(1)]),
      ]);
      setPlans(planRes.documents);
      setSub(subRes.documents[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Handle return from Stripe Checkout (?checkout=success|cancel).
  useEffect(() => {
    const status = params.get('checkout');
    if (!status) return;
    if (status === 'success') {
      setNotice('Payment received — your plan is being activated. This can take a few seconds.');
      // Re-poll the subscription a couple of times while the webhook lands.
      const timers = [2000, 5000].map((ms) => setTimeout(() => load(), ms));
      params.delete('checkout');
      setParams(params, { replace: true });
      return () => timers.forEach(clearTimeout);
    }
    if (status === 'cancel') {
      setNotice('Checkout cancelled — your plan was not changed.');
      params.delete('checkout');
      setParams(params, { replace: true });
    }
  }, [params, setParams, load]);

  const choosePlan = async (plan: Plan) => {
    if (!user) return;
    setError('');
    // Paid plans go through Stripe Checkout; free plans switch immediately.
    if (plan.price > 0 && plan.stripePriceId && billingEnabled) {
      setSavingId(plan.$id);
      try {
        await startCheckout(plan);
        return; // browser redirects to Stripe
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start checkout.');
        setSavingId(null);
        return;
      }
    }
    setSavingId(plan.$id);
    try {
      if (sub) {
        const updated = await databases.updateDocument<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, sub.$id, {
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

  const currentPlan = plans.find((p) => p.$id === sub?.planId) || null;

  const [portalBusy, setPortalBusy] = useState(false);
  const manageBilling = async () => {
    setPortalBusy(true);
    setError('');
    try {
      await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the billing portal.');
      setPortalBusy(false);
    }
  };

  return (
    <div className="container dash">
      <div className="dash-head">
        <div>
          <h1>Your dashboard</h1>
          <p className="muted">Welcome back, {user?.name || user?.email}.</p>
        </div>
        {isAdmin && <span className="pill pill-owner">admin</span>}
      </div>

      {!isConfigured && (
        <div className="auth-notice">Appwrite isn’t configured. Set the <code>VITE_APPWRITE_*</code> env vars to enable plans.</div>
      )}
      {notice && <div className="dash-notice">{notice}</div>}
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="dash-cards">
        <div className="dash-card">
          <h4>Current plan</h4>
          <div className="dash-plan">{currentPlan ? currentPlan.name : sub?.planName || 'Scout (Free)'}</div>
          <span className={`status-dot ${sub?.status || 'active'}`}>{sub?.status || 'active'}</span>
          {sub?.stripeCustomerId && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 14, display: 'flex', width: 'fit-content' }} onClick={manageBilling} disabled={portalBusy}>
              {portalBusy ? 'Opening…' : 'Manage billing'}
            </button>
          )}
        </div>
        <div className="dash-card">
          <h4>Linked servers</h4>
          <div className="dash-plan">{currentPlan ? (currentPlan.servers < 0 ? '∞' : currentPlan.servers) : 1}</div>
          <span className="muted">max for your plan</span>
        </div>
        <div className="dash-card">
          <h4>Account</h4>
          <div className="dash-plan" style={{ fontSize: 18 }}>{user?.email}</div>
          <span className="muted">member since {user?.$createdAt ? new Date(user.$createdAt).toLocaleDateString() : '—'}</span>
        </div>
      </div>

      <section className="dash-section">
        <h2>Manage your plan</h2>
        <p className="muted">Switch plans anytime. Changes take effect immediately.</p>

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
                  {isCurrent && <div className="price-badge">Current</div>}
                  {!isCurrent && p.popular && <div className="price-badge">Popular</div>}
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
                    disabled={isCurrent || savingId === p.$id}
                    onClick={() => choosePlan(p)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {isCurrent
                      ? 'Active plan'
                      : savingId === p.$id
                        ? (p.price > 0 ? 'Redirecting…' : 'Switching…')
                        : p.price > 0
                          ? `Upgrade to ${p.name}`
                          : `Switch to ${p.name}`}
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
