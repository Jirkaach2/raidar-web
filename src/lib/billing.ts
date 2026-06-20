import { functions, CHECKOUT_FUNCTION_ID, PORTAL_FUNCTION_ID, ExecutionMethod, type Plan } from './appwrite';

/** Execute an Appwrite Function expecting a JSON `{ url }` reply, then redirect. */
async function redirectToFunctionUrl(functionId: string, payload: Record<string, unknown>): Promise<void> {
  const exec = await functions.createExecution(
    functionId,
    JSON.stringify(payload),
    false,
    '/',
    ExecutionMethod.POST,
  );
  let url: string | undefined;
  try {
    url = JSON.parse(exec.responseBody || '{}').url;
  } catch {
    throw new Error('Unexpected response from the billing service.');
  }
  if (!url) throw new Error('Could not reach the billing service. Please try again.');
  window.location.href = url;
}

/**
 * Ask the Stripe-checkout Appwrite Function for a Checkout Session URL for the
 * given plan, then redirect the browser to Stripe. The function reads the
 * authenticated user from the execution headers, so no user id is trusted from
 * the client.
 */
export async function startCheckout(plan: Plan): Promise<void> {
  await redirectToFunctionUrl(CHECKOUT_FUNCTION_ID, { planId: plan.$id });
}

/** Open the Stripe billing portal so the user can manage/cancel their plan. */
export async function openBillingPortal(): Promise<void> {
  await redirectToFunctionUrl(PORTAL_FUNCTION_ID, {});
}
