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
