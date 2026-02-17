// map known errors to a message + status for API responses
const MSGS = {
  REDIS_DOWN: 'Redis is not running. Start Redis to use the job queue.',
  QUEUE_FULL: 'Queue is full. Free some Redis memory and try again.',
  QUEUE_DOWN: 'Queue is temporarily unavailable. Try again in a moment.',
  SERVICE_DOWN: 'Queue service is unavailable. Try again later.',
};

function errText(e) {
  if (!e) return '';
  return [e.message, e.cause?.message, e.reason, String(e)].filter(Boolean).join(' ');
}

export function mapErrorToClientResponse(err) {
  const msg = errText(err);
  const code = err?.code;
  if (code === 'ECONNREFUSED') return { message: MSGS.REDIS_DOWN, status: 503 };
  if (/OOM|maxmemory|user_script/i.test(msg)) return { message: MSGS.QUEUE_FULL, status: 503 };
  if (/Redis|NR_CLOSED|CONNECTION_CLOSED/i.test(msg) || code === 'NR_CLOSED' || code === 'CONNECTION_CLOSED') {
    return { message: MSGS.QUEUE_DOWN, status: 503 };
  }
  if (/ECONNREFUSED/i.test(msg)) return { message: MSGS.SERVICE_DOWN, status: 503 };
  return null;
}
