import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  databases, DB_ID, PLANS_COLLECTION_ID, SUBSCRIPTIONS_COLLECTION_ID,
  Query, ID, isConfigured, type Plan, type Subscription,
} from '../lib/appwrite';
import { listUsers, setAdmin, setStatus, deleteUser, getStats, grantPlan, revokePlan, resetMfa, bootstrap, type AdminUser, type AdminStats } from '../lib/admin';
import { useAuth } from '../context/AuthContext';
import Select from '../components/ui/Select';
import Checkbox from '../components/ui/Checkbox';
import { useConfirm } from '../components/ui/ConfirmProvider';
import {
  Users as UsersIcon, CreditCard, DollarSign, TrendingUp, UserPlus, ShieldCheck,
  RefreshCw, Download, Copy, Search, Ban, CheckCircle2, Trash2, Crown, Layers, Gift, X,
} from 'lucide-react';

type Tab = 'overview' | 'plans' | 'users' | 'subs';
type UserFilter = 'all' | 'admins' | 'blocked' | 'unverified';

interface PlanForm { name: string; price: string; tagline: string; features: string; servers: string; popular: boolean; order: string; stripePriceId: string; }
const EMPTY: PlanForm = { name: '', price: '0', tagline: '', features: '', servers: '1', popular: false, order: '0', stripePriceId: '' };
function toForm(p: Plan): PlanForm {
  return { name: p.name, price: String(p.price), tagline: p.tagline || '', features: (p.features || []).join('\n'), servers: String(p.servers ?? 1), popular: !!p.popular, order: String(p.order ?? 0), stripePriceId: p.stripePriceId || '' };
}
function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

export default function Admin() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('overview');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<UserFilter>('all');
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [copied, setCopied] = useState('');

  // Grant-plan modal
  const [grantUser, setGrantUser] = useState<AdminUser | null>(null);
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantDays, setGrantDays] = useState('30');
  const [grantBusy, setGrantBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [planRes, subRes] = await Promise.all([
        databases.listDocuments<Plan>(DB_ID, PLANS_COLLECTION_ID, [Query.orderAsc('order'), Query.limit(50)]),
        databases.listDocuments<Subscription>(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(500)]),
      ]);
      setPlans(planRes.documents); setSubs(subRes.documents);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not load admin data.'); }
    finally { setLoading(false); }
  }, []);

  const loadUsers = useCallback(async (q = '') => {
    setUsersLoading(true); setUsersError('');
    try { const r = await listUsers(q); setUsers(r.users); setUsersTotal(r.total); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Could not load users. Is the admin-api function deployed?'); }
    finally { setUsersLoading(false); }
  }, []);

  const loadStats = useCallback(async () => { try { setStats(await getStats()); } catch { /* not deployed */ } }, []);

  // One function execution for users + stats (avoids a double cold start).
  const loadUsersAndStats = useCallback(async (q = '') => {
    setUsersLoading(true); setUsersError('');
    try {
      const r = await bootstrap(q);
      setUsers(r.users); setUsersTotal(r.total); setStats(r.stats);
    } catch (err) { setUsersError(err instanceof Error ? err.message : 'Could not load users. Is the admin-api function deployed?'); }
    finally { setUsersLoading(false); }
  }, []);

  useEffect(() => { load(); loadUsersAndStats(); }, [load, loadUsersAndStats]);

  const refreshAll = () => { load(); loadUsersAndStats(search); };

  // ── lookups ──
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const emailFor = (id: string) => userById.get(id)?.email || id;
  const planForUser = (id: string) => subs.find((s) => s.userId === id)?.planName;

  // ── derived stats (convenience, from the loaded user sample) ──
  const now = Date.now();
  const newUsers7d = users.filter((u) => now - new Date(u.registration).getTime() < 7 * 864e5).length;
  const verified = users.filter((u) => u.emailVerification).length;
  const arr = (stats?.mrr ?? 0) * 12;
  const conversion = stats && stats.totalUsers ? Math.round((stats.activeSubs / stats.totalUsers) * 100) : 0;

  const copyId = (id: string) => { navigator.clipboard?.writeText(id); setCopied(id); setTimeout(() => setCopied(''), 1200); };

  // ── plans ──
  const startNew = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (p: Plan) => { setForm(toForm(p)); setEditing(p.$id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };
  const savePlan = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { name: form.name.trim(), price: Number(form.price) || 0, tagline: form.tagline.trim(), features: form.features.split('\n').map((f) => f.trim()).filter(Boolean), servers: Number(form.servers), popular: form.popular, order: Number(form.order) || 0, stripePriceId: form.stripePriceId.trim() };
    try {
      if (editing === 'new') await databases.createDocument(DB_ID, PLANS_COLLECTION_ID, ID.unique(), payload);
      else if (editing) await databases.updateDocument(DB_ID, PLANS_COLLECTION_ID, editing, payload);
      cancel(); await load(); await loadStats();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save the plan.'); }
    finally { setSaving(false); }
  };
  const removePlan = async (p: Plan) => { if (!(await confirm({ title: 'Delete plan', message: `Delete the "${p.name}" plan? This can't be undone.`, confirmText: 'Delete', danger: true }))) return; try { await databases.deleteDocument(DB_ID, PLANS_COLLECTION_ID, p.$id); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed.'); } };

  // ── subscriptions ──
  const setSubStatus = async (s: Subscription, status: Subscription['status']) => {
    try { await databases.updateDocument(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, s.$id, { status }); await load(); await loadStats(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update subscription.'); }
  };
  const removeSub = async (s: Subscription) => { if (!(await confirm({ title: 'Delete subscription', message: `Delete this subscription (${s.planName})?`, confirmText: 'Delete', danger: true }))) return; try { await databases.deleteDocument(DB_ID, SUBSCRIPTIONS_COLLECTION_ID, s.$id); await load(); await loadStats(); } catch (err) { setError(err instanceof Error ? err.message : 'Failed.'); } };
  const subCount = (planId: string) => subs.filter((s) => s.planId === planId).length;

  // ── users ──
  const applyUser = (u: AdminUser) => setUsers((list) => list.map((x) => (x.id === u.id ? u : x)));
  const onSetAdmin = async (u: AdminUser, value: boolean) => { setBusyUser(u.id); setUsersError(''); try { const r = await setAdmin(u.id, value); applyUser(r.user); loadStats(); } catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); } finally { setBusyUser(null); } };
  const onSetStatus = async (u: AdminUser, status: boolean) => { setBusyUser(u.id); setUsersError(''); try { const r = await setStatus(u.id, status); applyUser(r.user); } catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); } finally { setBusyUser(null); } };
  const onDeleteUser = async (u: AdminUser) => { if (!(await confirm({ title: 'Delete user', message: `Delete ${u.email}? This removes their account and subscriptions and can't be undone.`, confirmText: 'Delete user', danger: true }))) return; setBusyUser(u.id); setUsersError(''); try { await deleteUser(u.id); setUsers((l) => l.filter((x) => x.id !== u.id)); setUsersTotal((t) => t - 1); loadStats(); } catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); } finally { setBusyUser(null); } };

  // ── grant / revoke plan ──
  const openGrant = (u: AdminUser) => { setGrantUser(u); setGrantPlanId(plans[0]?.$id || ''); setGrantDays('30'); };
  const submitGrant = async () => {
    if (!grantUser || !grantPlanId) return;
    setGrantBusy(true); setUsersError('');
    try { await grantPlan(grantUser.id, grantPlanId, Number(grantDays) || 0); setGrantUser(null); await load(); await loadStats(); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Could not grant the plan.'); }
    finally { setGrantBusy(false); }
  };
  const onRevoke = async (u: AdminUser) => {
    if (!(await confirm({ title: 'Revoke plan', message: `Revoke ${u.name || u.email}'s plan? They will drop to the free tier.`, confirmText: 'Revoke', danger: true }))) return;
    setBusyUser(u.id); setUsersError('');
    try { await revokePlan(u.id, false); await load(); await loadStats(); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); }
    finally { setBusyUser(null); }
  };
  const onResetMfa = async (u: AdminUser) => {
    if (!(await confirm({ title: 'Reset 2FA', message: `Disable two-factor authentication for ${u.name || u.email}? Use this only when they've lost access to their authenticator.`, confirmText: 'Reset 2FA', danger: true }))) return;
    setBusyUser(u.id); setUsersError('');
    try { await resetMfa(u.id); }
    catch (err) { setUsersError(err instanceof Error ? err.message : 'Failed.'); }
    finally { setBusyUser(null); }
  };

  const shownUsers = users.filter((u) => filter === 'all' || (filter === 'admins' && u.labels.includes('admin')) || (filter === 'blocked' && !u.status) || (filter === 'unverified' && !u.emailVerification));

  const exportUsers = () => downloadCSV('raidar-users.csv', [['id', 'name', 'email', 'admin', 'status', 'verified', 'plan', 'registered'], ...users.map((u) => [u.id, u.name, u.email, u.labels.includes('admin') ? 'yes' : 'no', u.status ? 'active' : 'blocked', u.emailVerification ? 'yes' : 'no', planForUser(u.id) || '', new Date(u.registration).toISOString()])]);
  const exportSubs = () => downloadCSV('raidar-subscriptions.csv', [['userId', 'email', 'plan', 'status', 'created'], ...subs.map((s) => [s.userId, emailFor(s.userId), s.planName, s.status, new Date(s.$createdAt).toISOString()])]);

  const TABS: Array<[Tab, string]> = [['overview', 'Overview'], ['plans', 'Plans'], ['users', 'Users'], ['subs', 'Subscriptions']];

  return (
    <div className="dash">
      <div className="dash-head">
        <div><h1>Admin</h1><p className="muted">Manage users, plans and subscriptions.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={refreshAll}><RefreshCw size={14} /> Refresh</button>
          {tab === 'plans' && <button className="btn btn-sm" onClick={startNew}>+ New plan</button>}
        </div>
      </div>

      {!isConfigured && <div className="auth-notice">Appwrite isn’t configured. Set the <code>VITE_APPWRITE_*</code> env vars.</div>}

      <div className="admin-tabs">{TABS.map(([t, label]) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{label}</button>)}</div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          <div className="admin-statgrid">
            <div className="admin-statcard"><span className="admin-static"><UsersIcon size={18} /></span><div><div className="admin-statv">{stats?.totalUsers ?? '—'}</div><div className="admin-statl">Total users</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><ShieldCheck size={18} /></span><div><div className="admin-statv">{stats?.admins ?? 0}</div><div className="admin-statl">Admins</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><CreditCard size={18} /></span><div><div className="admin-statv">{stats?.activeSubs ?? '—'}</div><div className="admin-statl">Active subs</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><DollarSign size={18} /></span><div><div className="admin-statv">${stats?.mrr ?? 0}</div><div className="admin-statl">MRR</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><TrendingUp size={18} /></span><div><div className="admin-statv">${arr}</div><div className="admin-statl">Est. ARR</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><TrendingUp size={18} /></span><div><div className="admin-statv">{conversion}%</div><div className="admin-statl">Conversion</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><UserPlus size={18} /></span><div><div className="admin-statv">{newUsers7d}</div><div className="admin-statl">New (7d)</div></div></div>
            <div className="admin-statcard"><span className="admin-static"><CheckCircle2 size={18} /></span><div><div className="admin-statv">{verified}/{users.length}</div><div className="admin-statl">Verified</div></div></div>
          </div>

          <section className="dash-section">
            <h2>Plan distribution</h2>
            {stats && Object.keys(stats.byPlan).length > 0 ? (
              <div className="admin-dist">
                {Object.entries(stats.byPlan).sort((a, b) => b[1] - a[1]).map(([name, n]) => {
                  const max = Math.max(...Object.values(stats.byPlan));
                  return <div className="admin-dist-row" key={name}><span className="admin-dist-name">{name}</span><div className="admin-dist-bar"><span style={{ width: `${max ? (n / max) * 100 : 0}%` }} /></div><span className="admin-dist-n">{n}</span></div>;
                })}
              </div>
            ) : <p className="muted">No subscription data yet.{!stats && ' Stats need the admin-api function deployed.'}</p>}
          </section>

          <section className="dash-section">
            <h2>Recent signups</h2>
            {users.length === 0 ? <p className="muted">No users loaded.</p> : (
              <div className="admin-table">
                <div className="admin-row admin-row-recent admin-row-head"><span>User</span><span>Email</span><span>Plan</span><span>Joined</span></div>
                {[...users].sort((a, b) => +new Date(b.registration) - +new Date(a.registration)).slice(0, 6).map((u) => (
                  <div className="admin-row admin-row-recent" key={u.id}>
                    <span>{u.name || '(no name)'}{u.labels.includes('admin') && <span className="pill pill-owner" style={{ marginLeft: 6 }}>admin</span>}</span>
                    <span className="muted">{u.email}</span>
                    <span>{planForUser(u.id) || <span className="muted">—</span>}</span>
                    <span className="mono">{new Date(u.registration).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* PLANS */}
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
              <div className="admin-check"><Checkbox checked={form.popular} onChange={(v) => setForm({ ...form, popular: v })} label="Mark as most popular" /></div>
              <div className="admin-actions"><button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save plan'}</button><button className="btn btn-ghost" type="button" onClick={cancel}>Cancel</button></div>
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
                  <span className="admin-row-actions"><button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button><button className="btn btn-ghost btn-sm danger" onClick={() => removePlan(p)}>Delete</button></span>
                </div>
              ))}
              {plans.length === 0 && <div className="admin-row"><span className="muted">No plans yet — create one.</span></div>}
            </div>
          )}
        </>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <>
          <div className="admin-toolbar">
            <form className="admin-search" onSubmit={(e) => { e.preventDefault(); loadUsers(search); }}>
              <Search size={15} className="admin-search-ic" />
              <input placeholder="Search users by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <button className="btn btn-sm" type="submit">Search</button>
              {search && <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setSearch(''); loadUsers(''); }}>Clear</button>}
            </form>
            <button className="btn btn-ghost btn-sm" onClick={exportUsers}><Download size={14} /> Export CSV</button>
          </div>
          <div className="admin-filters">
            {(['all', 'admins', 'blocked', 'unverified'] as const).map((f) => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}
          </div>
          {usersError && <div className="auth-error" style={{ marginBottom: 16 }}>{usersError}</div>}
          {usersLoading ? <div className="route-loading"><div className="spinner" /><span>Loading users…</span></div> : (
            <div className="admin-users">
              <div className="muted" style={{ marginBottom: 12, fontSize: 13 }}>{shownUsers.length} shown · {usersTotal} total</div>
              {shownUsers.map((u) => {
                const isAdmin = u.labels.includes('admin'); const self = u.id === user?.$id; const busy = busyUser === u.id; const plan = planForUser(u.id);
                return (
                  <div className={`admin-user ${!u.status ? 'blocked' : ''}`} key={u.id}>
                    <span className="admin-user-av" style={{ background: isAdmin ? 'linear-gradient(135deg,#ce422b,#ff6a3d)' : 'rgba(255,255,255,0.08)' }}>{(u.name || u.email || '?')[0].toUpperCase()}</span>
                    <div className="admin-user-id">
                      <div className="admin-user-name">{u.name || '(no name)'}{isAdmin && <span className="pill pill-owner">admin</span>}{self && <span className="pill pill-restricted">you</span>}{!u.status && <span className="pill pill-blocked">blocked</span>}{plan && <span className="pill pill-plan">{plan}</span>}</div>
                      <div className="admin-user-email">{u.email}<button className="admin-copy" title="Copy ID" onClick={() => copyId(u.id)}>{copied === u.id ? '✓' : <Copy size={11} />}</button></div>
                      <div className="admin-user-meta mono">joined {new Date(u.registration).toLocaleDateString()} · {u.emailVerification ? 'verified' : 'unverified'}</div>
                    </div>
                    <div className="admin-user-actions">
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => openGrant(u)} title="Grant a plan for free"><Gift size={13} /> Grant</button>
                      {plan && <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onRevoke(u)} title="Revoke plan">Revoke</button>}
                      <button className="btn btn-ghost btn-sm" disabled={busy || self} onClick={() => onSetAdmin(u, !isAdmin)}>{isAdmin ? <><Ban size={13} /> Revoke admin</> : <><Crown size={13} /> Make admin</>}</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy || self} onClick={() => onSetStatus(u, !u.status)}>{u.status ? 'Block' : 'Unblock'}</button>
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onResetMfa(u)} title="Disable their 2FA">Reset 2FA</button>
                      <button className="btn btn-ghost btn-sm danger" disabled={busy || self} onClick={() => onDeleteUser(u)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
              {shownUsers.length === 0 && <div className="muted">No users match this filter.</div>}
            </div>
          )}
        </>
      )}

      {/* SUBSCRIPTIONS */}
      {tab === 'subs' && (
        <>
          <div className="admin-toolbar">
            <div className="muted" style={{ fontSize: 13 }}><Layers size={13} style={{ verticalAlign: -2, marginRight: 6 }} />{subs.length} subscription{subs.length === 1 ? '' : 's'}</div>
            <button className="btn btn-ghost btn-sm" onClick={exportSubs}><Download size={14} /> Export CSV</button>
          </div>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="admin-table">
            <div className="admin-row admin-row-subs admin-row-head"><span>User</span><span>Plan</span><span>Status</span><span>Since</span><span>Actions</span></div>
            {subs.map((s) => (
              <div className="admin-row admin-row-subs" key={s.$id}>
                <span title={s.userId}>{emailFor(s.userId)}</span>
                <span>{s.planName}{s.comp && <span className="pill pill-plan" style={{ marginLeft: 6 }}>comp</span>}</span>
                <span><span className={`status-dot ${s.status}`}>{s.status}</span></span>
                <span className="mono">{s.expiresAt ? `until ${new Date(s.expiresAt).toLocaleDateString()}` : new Date(s.$createdAt).toLocaleDateString()}</span>
                <span className="admin-row-actions">
                  {s.status === 'active'
                    ? <button className="btn btn-ghost btn-sm" onClick={() => setSubStatus(s, 'cancelled')}>Cancel</button>
                    : <button className="btn btn-ghost btn-sm" onClick={() => setSubStatus(s, 'active')}>Activate</button>}
                  <button className="btn btn-ghost btn-sm danger" onClick={() => removeSub(s)}><Trash2 size={13} /></button>
                </span>
              </div>
            ))}
            {subs.length === 0 && <div className="admin-row"><span className="muted">No subscriptions yet.</span></div>}
          </div>
        </>
      )}
      {/* GRANT PLAN MODAL */}
      {grantUser && (
        <div className="admin-modal-overlay" onClick={() => !grantBusy && setGrantUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3><Gift size={16} /> Grant a plan</h3>
              <button className="admin-modal-x" onClick={() => setGrantUser(null)} disabled={grantBusy}><X size={16} /></button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Give <strong>{grantUser.name || grantUser.email}</strong> a plan for free. This overrides any current plan.
            </p>
            <label className="admin-modal-field">
              Plan
              <Select
                value={grantPlanId}
                onChange={setGrantPlanId}
                options={plans.map((p) => ({ value: p.$id, label: p.name, hint: p.price > 0 ? `$${p.price}/mo value` : 'free' }))}
                placeholder="Select a plan"
              />
            </label>
            <label className="admin-modal-field">
              Duration
              <Select
                value={grantDays}
                onChange={setGrantDays}
                options={[
                  { value: '7', label: '7 days' },
                  { value: '14', label: '14 days' },
                  { value: '30', label: '30 days' },
                  { value: '90', label: '90 days' },
                  { value: '365', label: '1 year' },
                  { value: '0', label: 'No expiry (permanent)' },
                ]}
              />
            </label>
            <div className="admin-modal-actions">
              <button className="btn" onClick={submitGrant} disabled={grantBusy || !grantPlanId}>{grantBusy ? 'Granting…' : 'Grant plan'}</button>
              <button className="btn btn-ghost" onClick={() => setGrantUser(null)} disabled={grantBusy}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
