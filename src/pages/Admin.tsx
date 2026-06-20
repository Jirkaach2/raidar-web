import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  databases, DB_ID, PLANS_COLLECTION_ID, SUBSCRIPTIONS_COLLECTION_ID,
  Query, ID, isConfigured, type Plan, type Subscription,
} from '../lib/appwrite';

interface PlanForm {
  name: string; price: string; tagline: string; features: string; servers: string; popular: boolean; order: string; stripePriceId: string;
}

const EMPTY: PlanForm = { name: '', price: '0', tagline: '', features: '', servers: '1', popular: false, order: '0', stripePriceId: '' };

function toForm(p: Plan): PlanForm {
  return {
    name: p.name, price: String(p.price), tagline: p.tagline || '',
    features: (p.features || []).join('\n'), servers: String(p.servers ?? 1),
    popular: !!p.popular, order: String(p.order ?? 0), stripePriceId: p.stripePriceId || '',
  };
}

export default function Admin() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null); // plan id or 'new'
  const [form, setForm] = useState<PlanForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const [planRes, subRes] = await Promise.all([
        databases.listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(50)]),
        databases.listDocuments<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(100)]),
      ]);
      setPlans(planRes.documents);
      setSubs(subRes.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (p: Plan) => { setForm(toForm(p)); setEditing(p.$id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      tagline: form.tagline.trim(),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      servers: Number(form.servers),
      popular: form.popular,
      order: Number(form.order) || 0,
      stripePriceId: form.stripePriceId.trim(),
    };
    try {
      if (editing === 'new') {
        await databases.createDocument(DB_ID, PLANS_COLLECTION_ID, ID.unique(), payload);
      } else if (editing) {
        await databases.updateDocument(DB_ID, PLANS_COLLECTION_ID, editing, payload);
      }
      cancel();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the plan.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Plan) => {
    if (!window.confirm(`Delete the "${p.name}" plan? This can’t be undone.`)) return;
    setError('');
    try {
      await databases.deleteDocument(DB_ID, PLANS_COLLECTION_ID, p.$id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the plan.');
    }
  };

  const subCount = (planId: string) => subs.filter((s) => s.planId === planId).length;

  return (
    <div className="container dash">
      <div className="dash-head">
        <div>
          <h1>Admin</h1>
          <p className="muted">Manage plans and review subscriptions.</p>
        </div>
        <button className="btn btn-sm" onClick={startNew}>+ New plan</button>
      </div>

      {!isConfigured && <div className="auth-notice">Appwrite isn’t configured. Set the <code>VITE_APPWRITE_*</code> env vars.</div>}
      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {editing && (
        <form className="admin-form" onSubmit={save}>
          <h3>{editing === 'new' ? 'Create plan' : 'Edit plan'}</h3>
          <div className="admin-grid">
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Price (USD/mo)<input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
            <label>Max servers (-1 = ∞)<input type="number" value={form.servers} onChange={(e) => setForm({ ...form, servers: e.target.value })} /></label>
            <label>Sort order<input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></label>
          </div>
          <label>Tagline<input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></label>
          <label>Stripe Price ID <span className="muted">(price_… — required for paid plans)</span><input value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} placeholder="price_1Xxxx" /></label>
          <label>Features (one per line)<textarea rows={5} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></label>
          <label className="admin-check">
            <input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Mark as most popular
          </label>
          <div className="admin-actions">
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</button>
            <button className="btn btn-ghost" type="button" onClick={cancel}>Cancel</button>
          </div>
        </form>
      )}

      <section className="dash-section">
        <h2>Plans</h2>
        {loading ? (
          <div className="route-loading"><div className="spinner" /><span>Loading…</span></div>
        ) : (
          <div className="admin-table">
            <div className="admin-row admin-row-head">
              <span>Name</span><span>Price</span><span>Servers</span><span>Subs</span><span>Actions</span>
            </div>
            {plans.map((p) => (
              <div className="admin-row" key={p.$id}>
                <span>{p.name}{p.popular && <span className="pill pill-restricted" style={{ marginLeft: 8 }}>popular</span>}</span>
                <span>{p.price === 0 ? 'Free' : `$${p.price}/mo`}</span>
                <span>{p.servers < 0 ? '∞' : p.servers}</span>
                <span>{subCount(p.$id)}</span>
                <span className="admin-row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(p)}>Delete</button>
                </span>
              </div>
            ))}
            {plans.length === 0 && <div className="admin-row"><span className="muted">No plans yet — create one.</span></div>}
          </div>
        )}
      </section>

      <section className="dash-section">
        <h2>Subscriptions <span className="muted">({subs.length})</span></h2>
        <div className="admin-table">
          <div className="admin-row admin-row-head admin-row-subs">
            <span>User ID</span><span>Plan</span><span>Status</span><span>Since</span>
          </div>
          {subs.map((s) => (
            <div className="admin-row admin-row-subs" key={s.$id}>
              <span className="mono">{s.userId}</span>
              <span>{s.planName}</span>
              <span><span className={`status-dot ${s.status}`}>{s.status}</span></span>
              <span>{new Date(s.$createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {subs.length === 0 && <div className="admin-row"><span className="muted">No subscriptions yet.</span></div>}
        </div>
      </section>
    </div>
  );
}
