import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  databases, DB_ID, PLANS_COLLECTION_ID, SUBSCRIPTIONS_COLLECTION_ID,
  Query, ID, isConfigured, type Plan, type Subscription,
} from '../lib/appwrite';
import { listUsers, setAdmin, setStatus, deleteUser, getStats, type AdminUser, type AdminStats } from '../lib/admin';
import { useAuth } from '../context/AuthContext';

type Tab = 'overview' | 'plans' | 'users' | 'subs';

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
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  // Users + stats (via admin function)
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [planRes, subRes] = await Promise.all([
        databases.listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(50)]),
        databases.listDocuments<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(200)]),
      ]);
      setPlans(planRes.documents);
      setSubs(subRes.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (q = '') => {
    setUsersLoading(true); setUsersError('');
    try {
      const r = await listUsers(q);
      setUsers(r.users);
      setUsersTotal(r.total);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Could not load users. Is the admin-api function deployed?');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await getStats()); } catch { /* function not deployed yet */ }
  }, []);

  useEffect(() => { load(); loadStats(); loadUsers(); }, [load, loadStats, loadUsers]);

  // ── Plans CRUD ──
  const startNew = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (p: Plan) => { setForm(toForm(p)); setEditing(p.$id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };
  const savePlan = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    const payload = {
      name: form.name.trim(), price: Number(form.price) || 0, tagline: form.tagline.trim(),
      features: form.features.split('\n').map((f) => f.trim()).filter(Boolean),
      servers: Number(form.servers), popular: form.popular, order: Number(form.order) || 0, stripePriceId: form.stripePriceId.trim(),
    };
    try {
      if (editing === 'new') await databases.createDocument(DB_ID, PLANS_COLLECTION_ID, ID.unique(), payload);
      else if (editing) await databases.updateDocument(DB_ID, PLANS_COLLECTION_ID, editing, payload);
      cancel(); await load(); await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the plan.');
    } finally { setSaving(false); }
  };
  const removePlan = async (p: Plan) => {
    if (!window.confirm(`Delete the "${p.name}" plan? This can’t be undone.`)) return;
    try { await databases.deleteDocument(DB_ID, PLANS_COLLECTION_ID, p.$id); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the plan.'); }
  };
  const removeSub = async (s: Subscription) => {
    if (!window.confirm(`Delete this subscription (${s.planName})? This can’t be undone.`)) return;
    try { await databases.deleteDocument(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, s.$id); await load(); await loadStats(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not delete the subscription.'); }
  };
  const subCount = (planId: string) => subs.filter((s) => s.planId === planId).length;

  // ── User actions ──
  const applyUser = (u: AdminUser) => setUsers((list) => list.map((x) => (x.id === u.id ? u : x)));
  const onSetAdmin = async (u: AdminUser, value: boolean) => {
    setBusyUser(u.id); setUsersError('');
    try { const r = await setAdmin(u.id, value); applyUser(r.user); loadStats(); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); }
    finally { setBusyUser(null); }
  };
  const onSetStatus = async (u: AdminUser, status: boolean) => {
    setBusyUser(u.id); setUsersError('');
    try { const r = await setStatus(u.id, status); applyUser(r.user); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); }
    finally { setBusyUser(null); }
  };
  const onDeleteUser = async (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.email}? This removes their account and subscriptions permanently.`)) return;
    setBusyUser(u.id); setUsersError('');
    try { await deleteUser(u.id); setUsers((list) => list.filter((x) => x.id !== u.id)); setUsersTotal((t) => t - 1); loadStats(); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); }
    finally { setBusyUser(null); }
  };

  const TABS: Array<[Tab, string]> = [['overview', 'Overview'], ['plans', 'Plans'], ['users', 'Users'], ['subs', 'Subscriptions']];

  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <h1>Admin</h1>
          <p className="muted">Manage users, plans and subscriptions.</p>
        </div>
        {tab === 'plans' && <button className="btn btn-sm" onClick={startNew}>+ New plan</button>}
      </div>

      {!isConfigured && <div className="auth-notice">Appwrite isn’t configured. Set the <code>VITE_APPWRITE_*</code> env vars.</div>}

      <div className="admin-tabs">
        {TABS.map(([t, label]) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {/* ───────── OVERVIEW ───────── */}
      {tab === 'overview' && (
        <>
          <div className="dash-cards admin-stats">
            <div className="dash-card"><h4>Total users</h4><div className="dash-plan">{stats?.totalUsers ?? '—'}</div><span className="muted">{stats?.admins ?? 0} admin{stats?.admins === 1 ? '' : 's'}</span></div>
            <div className="dash-card"><h4>Active subscriptions</h4><div className="dash-plan">{stats?.activeSubs ?? '—'}</div><span className="muted">{stats?.totalSubs ?? 0} total</span></div>
            <div className="dash-card"><h4>Est. MRR</h4><div className="dash-plan">${stats?.mrr ?? 0}</div><span className="muted">from active plans</span></div>
            <div className="dash-card"><h4>Plans</h4><div className="dash-plan">{stats?.planCount ?? plans.length}</div><span className="muted">configured</span></div>
          </div>

          <section className="dash-section">
            <h2>Plan distribution</h2>
            {stats && Object.keys(stats.byPlan).length > 0 ? (
              <div className="admin-dist">
                {Object.entries(stats.byPlan).sort((a, b) => b[1] - a[1]).map(([name, n]) => {
                  const max = Math.max(...Object.values(stats.byPlan));
                  return (
                    <div className="admin-dist-row" key={name}>
                      <span className="admin-dist-name">{name}</span>
                      <div className="admin-dist-bar"><span style={{ width: `${max ? (n / max) * 100 : 0}%` }} /></div>
                      <span className="admin-dist-n">{n}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="muted">No subscription data yet.</p>}
            {!stats && <p className="muted" style={{ marginTop: 10 }}>Stats need the <code>admin-api</code> function deployed.</p>}
          </section>
        </>
      )}

      {/* ───────── PLANS ───────── */}
      {tab === 'plans' && (
        <>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          {editing && (
            <form className="admin-form" onSubmit={savePlan}>
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
              <label className="admin-check"><input type="checkbox" checked={form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} /> Mark as most popular</label>
              <div className="admin-actions">
                <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</button>
                <button className="btn btn-ghost" type="button" onClick={cancel}>Cancel</button>
              </div>
            </form>
          )}
          {loading ? <div className="route-loading"><div className="spinner" /><span>Loading…</span></div> : (
            <div className="admin-table">
              <div className="admin-row admin-row-head"><span>Name</span><span>Price</span><span>Servers</span><span>Subs</span><span>Actions</span></div>
              {plans.map((p) => (
                <div className="admin-row" key={p.$id}>
                  <span>{p.name}{p.popular && <span className="pill pill-restricted" style={{ marginLeft: 8 }}>popular</span>}</span>
                  <span>{p.price === 0 ? 'Free' : `$${p.price}/mo`}</span>
                  <span>{p.servers < 0 ? '∞' : p.servers}</span>
                  <span>{subCount(p.$id)}</span>
                  <span className="admin-row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn btn-ghost btn-sm danger" onClick={() => removePlan(p)}>Delete</button>
                  </span>
                </div>
              ))}
              {plans.length === 0 && <div className="admin-row"><span className="muted">No plans yet — create one.</span></div>}
            </div>
          )}
        </>
      )}

      {/* ───────── USERS ───────── */}
      {tab === 'users' && (
        <>
          <form className="admin-search" onSubmit={(e) => { e.preventDefault(); loadUsers(search); }}>
            <input placeholder="Search users by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn btn-sm" type="submit">Search</button>
            {search && <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setSearch(''); loadUsers(''); }}>Clear</button>}
          </form>
          {usersError && <div className="auth-error" style={{ marginBottom: 16 }}>{usersError}</div>}
          {usersLoading ? <div className="route-loading"><div className="spinner" /><span>Loading users…</span></div> : (
            <div className="admin-users">
              <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>{usersTotal} user{usersTotal === 1 ? '' : 's'}</div>
              {users.map((u) => {
                const isAdmin = u.labels.includes('admin');
                const self = u.id === user?.$id;
                const busy = busyUser === u.id;
                return (
                  <div className={`admin-user ${!u.status ? 'blocked' : ''}`} key={u.id}>
                    <div className="admin-user-id">
                      <div className="admin-user-name">{u.name || '(no name)'}{isAdmin && <span className="pill pill-owner">admin</span>}{self && <span className="pill pill-restricted">you</span>}{!u.status && <span className="pill" style={{ background: 'rgba(232,69,69,0.16)', color: 'var(--color-danger)' }}>blocked</span>}</div>
                      <div className="admin-user-email">{u.email}</div>
                      <div className="admin-user-meta mono">joined {new Date(u.registration).toLocaleDateString()} · {u.emailVerification ? 'verified' : 'unverified'}</div>
                    </div>
                    <div className="admin-user-actions">
                      <button className="btn btn-ghost btn-sm" disabled={busy || self} onClick={() => onSetAdmin(u, !isAdmin)}>{isAdmin ? 'Revoke admin' : 'Make admin'}</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy || self} onClick={() => onSetStatus(u, !u.status)}>{u.status ? 'Block' : 'Unblock'}</button>
                      <button className="btn btn-ghost btn-sm danger" disabled={busy || self} onClick={() => onDeleteUser(u)}>Delete</button>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <div className="muted">No users found.</div>}
            </div>
          )}
        </>
      )}

      {/* ───────── SUBSCRIPTIONS ───────── */}
      {tab === 'subs' && (
        <div className="admin-table">
          <div className="admin-row admin-row-head admin-row-subs"><span>User ID</span><span>Plan</span><span>Status</span><span>Since</span><span>Actions</span></div>
          {subs.map((s) => (
            <div className="admin-row admin-row-subs" key={s.$id}>
              <span className="mono">{s.userId}</span>
              <span>{s.planName}</span>
              <span><span className={`status-dot ${s.status}`}>{s.status}</span></span>
              <span>{new Date(s.$createdAt).toLocaleDateString()}</span>
              <span className="admin-row-actions"><button className="btn btn-ghost btn-sm danger" onClick={() => removeSub(s)}>Delete</button></span>
            </div>
          ))}
          {subs.length === 0 && <div className="admin-row"><span className="muted">No subscriptions yet.</span></div>}
        </div>
      )}
    </div>
  );
}
