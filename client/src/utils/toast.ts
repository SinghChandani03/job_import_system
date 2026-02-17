import { userFriendlyError } from '@/utils/userFriendlyError';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = { message: string; type: ToastType };

export const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-sky-100 text-sky-800',
};

type TriggerResponse = {
  error?: string;
  message?: string;
  count?: number;
  queued?: number;
};

/**
 * Maps trigger API response to a Toast. Use for POST /api/job-sources/:id/trigger.
 */
export function getTriggerToast(data: TriggerResponse, ok: boolean): Toast {
  if (!ok) {
    return { message: userFriendlyError(data?.error), type: 'error' };
  }
  if (data.error) {
    return { message: userFriendlyError(data.error), type: 'error' };
  }
  if (data.message === 'Import queued' && typeof data.count === 'number') {
    return {
      message: `${data.count} job${data.count !== 1 ? 's' : ''} queued.`,
      type: 'success',
    };
  }
  if (data.message === 'No jobs fetched' || data.queued === 0) {
    return { message: 'No jobs in this feed.', type: 'info' };
  }
  return { message: data.message || 'Done.', type: 'success' };
}
