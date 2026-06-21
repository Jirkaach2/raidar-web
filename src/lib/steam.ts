import { functions, STEAM_FUNCTION_ID, ExecutionMethod } from './appwrite';

/**
 * Attach a real email to the signed-in Steam account via the steam-auth
 * function (admin-side updateEmail, which clears the verified flag). The caller
 * is identified server-side from the session, so no userId is sent.
 */
export async function setSteamEmail(email: string): Promise<void> {
  const exec = await functions.createExecution(
    STEAM_FUNCTION_ID,
    JSON.stringify({ action: 'setEmail', email }),
    false,
    '/',
    ExecutionMethod.POST,
  );
  let res: { ok?: boolean; error?: string };
  try { res = JSON.parse(exec.responseBody || '{}'); }
  catch { throw new Error('Unexpected response from the Steam service.'); }
  if (res.error) throw new Error(res.error);
}

/**
 * Mint a one-time login token from the current web session, encoded as a single
 * code the desktop app can paste to sign in (web → app session handoff).
 */
export async function createAppLoginCode(): Promise<string> {
  const exec = await functions.createExecution(
    STEAM_FUNCTION_ID,
    JSON.stringify({ action: 'appToken' }),
    false,
    '/',
    ExecutionMethod.POST,
  );
  let res: { userId?: string; secret?: string; error?: string };
  try { res = JSON.parse(exec.responseBody || '{}'); }
  catch { throw new Error('Unexpected response from the auth service.'); }
  if (res.error || !res.userId || !res.secret) throw new Error(res.error || 'Could not create a login code.');
  // Compact, copy-paste friendly code. btoa is safe — ids/secrets are ASCII.
  return btoa(`${res.userId}:${res.secret}`).replace(/=+$/, '');
}
