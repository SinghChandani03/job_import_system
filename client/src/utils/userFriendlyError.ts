/**
 * Maps raw API/network error strings to user-friendly messages.
 * Use for any error text shown in the UI.
 */

const FRIENDLY = {
  QUEUE_FULL: 'Queue is full. Free some Redis memory or increase its limit and try again.',
  QUEUE_UNAVAILABLE: 'Queue is temporarily unavailable. Try again in a moment.',
  SERVICE_UNAVAILABLE: 'Queue service is unavailable. Try again later.',
  FETCH_FAILED: 'Cannot reach the server. Check your connection and that the server is running.',
  DEFAULT: 'Something went wrong.',
  REQUEST_FAILED: 'Request failed.',
} as const;

const RAW_PATTERNS = [
  { test: /OOM|maxmemory|user_script|@user_script|script:\s*\d+/i, message: FRIENDLY.QUEUE_FULL },
  { test: /Redis|NR_CLOSED|CONNECTION_CLOSED|ECONNREFUSED/i, message: FRIENDLY.SERVICE_UNAVAILABLE },
  { test: /failed to fetch|network error|load failed|networkrequestfailed/i, message: FRIENDLY.FETCH_FAILED },
];

/**
 * Returns a user-friendly message for any error string (e.g. from API or catch).
 */
export function userFriendlyError(input: unknown, fallback: string = FRIENDLY.REQUEST_FAILED): string {
  const msg = typeof input === 'string' ? input : (input && typeof (input as Error).message === 'string' ? (input as Error).message : '');
  if (!msg) return fallback;
  for (const { test, message } of RAW_PATTERNS) {
    if (test.test(msg)) return message;
  }
  return msg;
}
