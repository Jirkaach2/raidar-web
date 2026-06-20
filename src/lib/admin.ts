import { functions, ADMIN_FUNCTION_ID, ExecutionMethod } from './appwrite';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  labels: string[];
  status: boolean;
  emailVerification: boolean;
  registration: string;
  accessedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  admins: number;
  totalSubs: number;
  activeSubs: number;
  mrr: number;
  planCount: number;
  byPlan: Record<string, number>;
}

/** Call the admin-api Appwrite Function. Throws on error responses. */
export async function adminCall<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const exec = await functions.createExecution(
    ADMIN_FUNCTION_ID,
    JSON.stringify({ action, ...payload }),
    false,
    '/',
    ExecutionMethod.POST,
  );
  let res: { error?: string } & Record<string, unknown>;
  try {
    res = JSON.parse(exec.responseBody || '{}');
  } catch {
    throw new Error('Unexpected response from the admin service.');
  }
  if (res.error) throw new Error(res.error);
  return res as T;
}

export const listUsers = (search = '') => adminCall<{ total: number; users: AdminUser[] }>('listUsers', { search });
export const setAdmin = (userId: string, value: boolean) => adminCall<{ user: AdminUser }>('setAdmin', { userId, value });
export const setStatus = (userId: string, status: boolean) => adminCall<{ user: AdminUser }>('setStatus', { userId, status });
export const deleteUser = (userId: string) => adminCall<{ ok: boolean }>('deleteUser', { userId });
export const getStats = () => adminCall<AdminStats>('stats');
