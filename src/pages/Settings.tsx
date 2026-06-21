import { useRef, useState, type FormEvent } from 'react';
import { Permission, Role } from 'appwrite';
import { User as UserIcon, Lock, Mail, ShieldCheck, Upload, Trash2, KeyRound, Copy } from 'lucide-react';
import {
  account, storage, ID, AVATARS_BUCKET_ID, AuthenticatorType, type AppUser,
} from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ui/ConfirmProvider';

type Note = { kind: 'ok' | 'err'; text: string } | null;

export default function Settings() {
  const { user, refresh } = useAuth();
  if (!user) return null;

  const prefs = (user.prefs || {}) as Record<string, unknown>;
  const isSteam = prefs.provider === 'steam';
  const avatarUrl = (typeof prefs.avatarUrl === 'string' && prefs.avatarUrl) || (typeof prefs.steamAvatar === 'string' ? prefs.steamAvatar : '');
  const initial = (user.name || user.email || 'R')[0].toUpperCase();

  return (
    <div className="dash">
      <div className="dash-head">
        <div><h1>Settings</h1><p className="muted">Manage your profile, security and sign-in.</p></div>
      </div>

      <div className="settings-grid">
        <ProfileCard user={user} avatarUrl={avatarUrl} initial={initial} refresh={refresh} prefs={prefs} />
        <SecurityCard isSteam={isSteam} refresh={refresh} />
        <TwoFactorCard user={user} refresh={refresh} />
        <DangerCard />
      </div>
    </div>
  );
}

/* ── Profile: avatar + display name ──────────────────────── */
function ProfileCard({ user, avatarUrl, initial, refresh, prefs }: {
  user: AppUser; avatarUrl: string; initial: string; refresh: () => Promise<void>; prefs: Record<string, unknown>;
}) {
  const [name, setName] = useState(user.name || '');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveName = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setNote(null);
    try { await account.updateName(name.trim()); await refresh(); setNote({ kind: 'ok', text: 'Display name updated.' }); }
    catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not update name.' }); }
    finally { setBusy(false); }
  };

  const onPick = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setNote({ kind: 'err', text: 'Image must be under 4 MB.' }); return; }
    setUploading(true); setNote(null);
    try {
      const created = await storage.createFile(AVATARS_BUCKET_ID, ID.unique(), file, [Permission.read(Role.any())]);
      const url = storage.getFileView(AVATARS_BUCKET_ID, created.$id).toString();
      await account.updatePrefs({ ...prefs, avatarUrl: url, avatarFileId: created.$id });
      // Best-effort cleanup of the previous upload.
      const oldId = prefs.avatarFileId;
      if (typeof oldId === 'string' && oldId && oldId !== created.$id) {
        try { await storage.deleteFile(AVATARS_BUCKET_ID, oldId); } catch { /* ignore */ }
      }
      await refresh();
      setNote({ kind: 'ok', text: 'Profile picture updated.' });
    } catch (err) {
      setNote({ kind: 'err', text: err instanceof Error ? `${err.message} (is the “avatars” storage bucket created?)` : 'Upload failed.' });
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const removeAvatar = async () => {
    setUploading(true); setNote(null);
    try {
      const oldId = prefs.avatarFileId;
      const next = { ...prefs }; delete next.avatarUrl; delete next.avatarFileId;
      await account.updatePrefs(next);
      if (typeof oldId === 'string' && oldId) { try { await storage.deleteFile(AVATARS_BUCKET_ID, oldId); } catch { /* ignore */ } }
      await refresh();
      setNote({ kind: 'ok', text: 'Profile picture removed.' });
    } catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not remove picture.' }); }
    finally { setUploading(false); }
  };

  return (
    <section className="settings-card">
      <div className="settings-card-head"><UserIcon size={16} /> <h2>Profile</h2></div>
      <div className="settings-avatar-row">
        <span className="settings-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
        <div className="settings-avatar-actions">
          <button className="btn btn-ghost btn-sm" onClick={onPick} disabled={uploading}><Upload size={13} /> {uploading ? 'Uploading…' : 'Upload image'}</button>
          {avatarUrl && <button className="btn btn-ghost btn-sm danger" onClick={removeAvatar} disabled={uploading}><Trash2 size={13} /> Remove</button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <p className="muted" style={{ fontSize: 12 }}>PNG, JPG or WEBP, up to 4 MB.</p>
        </div>
      </div>
      <form onSubmit={saveName} className="settings-form">
        <label>Display name<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={128} /></label>
        <button className="btn btn-sm" type="submit" disabled={busy || name.trim() === user.name}>{busy ? 'Saving…' : 'Save name'}</button>
      </form>
      {note && <div className={note.kind === 'ok' ? 'settings-ok' : 'auth-error'}>{note.text}</div>}
    </section>
  );
}

/* ── Security: email + password ──────────────────────────── */
function SecurityCard({ isSteam, refresh }: { isSteam: boolean; refresh: () => Promise<void> }) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwNote, setPwNote] = useState<Note>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [email, setEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailNote, setEmailNote] = useState<Note>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault(); setPwBusy(true); setPwNote(null);
    if (newPw.length < 8) { setPwNote({ kind: 'err', text: 'Password must be at least 8 characters.' }); setPwBusy(false); return; }
    try {
      // oldPw is optional for accounts that never had a password (OAuth/Steam).
      await account.updatePassword(newPw, oldPw || undefined);
      setOldPw(''); setNewPw('');
      setPwNote({ kind: 'ok', text: 'Password updated.' });
    } catch (err) { setPwNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not update password.' }); }
    finally { setPwBusy(false); }
  };

  const changeEmail = async (e: FormEvent) => {
    e.preventDefault(); setEmailBusy(true); setEmailNote(null);
    try {
      await account.updateEmail(email.trim(), emailPw);
      await refresh();
      setEmail(''); setEmailPw('');
      setEmailNote({ kind: 'ok', text: 'Email updated. Verify it from your dashboard.' });
    } catch (err) { setEmailNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not update email.' }); }
    finally { setEmailBusy(false); }
  };

  return (
    <section className="settings-card">
      <div className="settings-card-head"><Lock size={16} /> <h2>Security</h2></div>

      <form onSubmit={changePassword} className="settings-form">
        <h3 className="settings-sub">{isSteam ? 'Set a password' : 'Change password'}</h3>
        {isSteam && <p className="muted" style={{ fontSize: 13 }}>You signed in with Steam. Set a password to also sign in with email.</p>}
        <label>Current password <span className="muted">(leave blank if none)</span><input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" /></label>
        <label>New password<input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required /></label>
        <button className="btn btn-sm" type="submit" disabled={pwBusy}>{pwBusy ? 'Saving…' : 'Update password'}</button>
        {pwNote && <div className={pwNote.kind === 'ok' ? 'settings-ok' : 'auth-error'}>{pwNote.text}</div>}
      </form>

      <form onSubmit={changeEmail} className="settings-form" style={{ marginTop: 24 }}>
        <h3 className="settings-sub"><Mail size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Change email</h3>
        <label>New email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Confirm with password<input type="password" value={emailPw} onChange={(e) => setEmailPw(e.target.value)} autoComplete="current-password" required /></label>
        <button className="btn btn-sm" type="submit" disabled={emailBusy}>{emailBusy ? 'Saving…' : 'Update email'}</button>
        {emailNote && <div className={emailNote.kind === 'ok' ? 'settings-ok' : 'auth-error'}>{emailNote.text}</div>}
      </form>
    </section>
  );
}

/* ── Two-factor (TOTP authenticator) ─────────────────────── */
function TwoFactorCard({ user, refresh }: { user: AppUser; refresh: () => Promise<void> }) {
  const ask = useConfirm();
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [otp, setOtp] = useState('');
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const enabled = (user as unknown as { mfa?: boolean }).mfa === true;

  const begin = async () => {
    setBusy(true); setNote(null);
    try {
      const r = await account.createMfaAuthenticator(AuthenticatorType.Totp);
      setSecret(r.secret); setUri(r.uri);
    } catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not start 2FA setup.' }); }
    finally { setBusy(false); }
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setNote(null);
    try {
      await account.updateMfaAuthenticator(AuthenticatorType.Totp, otp.trim());
      await account.updateMFA(true);
      const rc = await account.createMfaRecoveryCodes().catch(() => null);
      if (rc) setCodes(rc.recoveryCodes);
      setSecret(''); setUri(''); setOtp('');
      await refresh();
      setNote({ kind: 'ok', text: 'Two-factor authentication enabled.' });
    } catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Invalid code — try again.' }); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!(await ask({ title: 'Disable 2FA', message: 'Disable two-factor authentication? Your account will be less secure.', confirmText: 'Disable', danger: true }))) return;
    setBusy(true); setNote(null);
    try {
      await account.deleteMfaAuthenticator(AuthenticatorType.Totp);
      await account.updateMFA(false);
      await refresh();
      setNote({ kind: 'ok', text: 'Two-factor authentication disabled.' });
    } catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not disable 2FA.' }); }
    finally { setBusy(false); }
  };

  const regenerate = async () => {
    setBusy(true); setNote(null);
    try {
      const rc = await account.updateMfaRecoveryCodes();
      setCodes(rc.recoveryCodes);
      setNote({ kind: 'ok', text: 'New recovery codes generated — your old ones no longer work.' });
    } catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Could not regenerate codes.' }); }
    finally { setBusy(false); }
  };

  return (
    <section className="settings-card">
      <div className="settings-card-head"><ShieldCheck size={16} /> <h2>Two-factor authentication</h2>
        <span className={`settings-badge ${enabled ? 'on' : ''}`}>{enabled ? 'Enabled' : 'Off'}</span>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Add a one-time code from an authenticator app (Google Authenticator, Authy, 1Password) as a second step at sign-in.</p>

      {enabled ? (
        <div className="settings-2fa-on">
          <button className="btn btn-ghost btn-sm" onClick={regenerate} disabled={busy}><KeyRound size={14} /> Regenerate recovery codes</button>
          <button className="btn btn-ghost btn-sm danger" onClick={disable} disabled={busy}>Disable 2FA</button>
        </div>
      ) : !secret ? (
        <button className="btn btn-sm" onClick={begin} disabled={busy} style={{ marginTop: 14 }}><KeyRound size={14} /> {busy ? 'Starting…' : 'Set up 2FA'}</button>
      ) : (
        <form onSubmit={confirm} className="settings-form" style={{ marginTop: 14 }}>
          <p className="muted" style={{ fontSize: 13 }}>Add this secret to your authenticator app, then enter the 6-digit code to confirm.</p>
          <div className="settings-secret">
            <code>{secret}</code>
            <button type="button" className="admin-copy" onClick={() => navigator.clipboard?.writeText(secret)} title="Copy secret"><Copy size={12} /></button>
          </div>
          {uri && <a className="muted" style={{ fontSize: 12 }} href={uri}>Open in authenticator app</a>}
          <label>6-digit code<input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} required placeholder="123456" /></label>
          <button className="btn btn-sm" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Confirm & enable'}</button>
        </form>
      )}

      {codes.length > 0 && (
        <div className="settings-codes">
          <strong>Save your recovery codes</strong>
          <p className="muted" style={{ fontSize: 12 }}>Store these somewhere safe. Each can be used once if you lose your authenticator.</p>
          <div className="settings-codes-grid">{codes.map((c) => <code key={c}>{c}</code>)}</div>
        </div>
      )}
      {note && <div className={note.kind === 'ok' ? 'settings-ok' : 'auth-error'} style={{ marginTop: 12 }}>{note.text}</div>}
    </section>
  );
}

/* ── Danger zone ─────────────────────────────────────────── */
function DangerCard() {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);
  const signOutEverywhere = async () => {
    if (!(await confirm({ title: 'Sign out everywhere', message: 'This ends every active session across all your devices. You will need to sign in again.', confirmText: 'Sign out all', danger: true }))) return;
    setBusy(true); setNote(null);
    try { await account.deleteSessions(); window.location.href = '/login'; }
    catch (err) { setNote({ kind: 'err', text: err instanceof Error ? err.message : 'Failed.' }); setBusy(false); }
  };
  return (
    <section className="settings-card">
      <div className="settings-card-head"><Lock size={16} /> <h2>Sessions</h2></div>
      <p className="muted" style={{ fontSize: 13 }}>Sign out of Raidar on every device. You’ll need to sign in again.</p>
      <button className="btn btn-ghost btn-sm danger" onClick={signOutEverywhere} disabled={busy} style={{ marginTop: 14 }}>{busy ? 'Working…' : 'Sign out everywhere'}</button>
      {note && <div className="auth-error" style={{ marginTop: 12 }}>{note.text}</div>}
    </section>
  );
}
