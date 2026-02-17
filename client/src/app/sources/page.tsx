'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { userFriendlyError } from '@/utils/userFriendlyError';
import { type Toast, TOAST_STYLES, getTriggerToast } from '@/utils/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type JobSource = { _id: string; url: string; name: string; enabled: boolean };

export default function SourcesPage() {
  const [sources, setSources] = useState<JobSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    fetch(`${API_BASE}/api/job-sources`)
      .then((r) => r.json())
      .then((data) => setSources(Array.isArray(data) ? data : []))
      .catch((e) => {
        setToast({ message: userFriendlyError(e, 'Failed to load sources.'), type: 'error' });
        setSources([]);
      })
      .finally(() => setLoading(false));
  }, []);

  function trigger(id: string) {
    setTriggering(id);
    setToast(null);
    fetch(`${API_BASE}/api/job-sources/${id}/trigger`, { method: 'POST' })
      .then(async (r) => {
        const data = await r.json();
        setToast(getTriggerToast(data, r.ok));
      })
      .catch((e) => {
        setToast({ message: userFriendlyError(e, 'Failed.'), type: 'error' });
      })
      .finally(() => setTriggering(null));
  }

  return (
    <main className="min-h-screen bg-slate-100 max-w-6xl mx-auto p-8">
      <header className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Job Sources</h1>
        <Link href="/" className="ml-auto px-4 py-2 text-sm font-medium bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1">
          Import History
        </Link>
      </header>
      {loading && <div className="text-slate-500 mb-4">Loading…</div>}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                URL
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                Name
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td
                  className="px-4 py-3 max-w-[280px] truncate border-b border-gray-100"
                  title={s.url}
                >
                  {s.url}
                </td>
                <td className="px-4 py-3 border-b border-gray-100">{s.name || '—'}</td>
                <td className="px-4 py-3 border-b border-gray-100">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!!triggering}
                    onClick={() => trigger(s._id)}
                  >
                    {triggering === s._id ? 'Queuing…' : 'Trigger import'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && (
        <div
          className={`fixed bottom-6 right-6 max-w-md px-5 py-3.5 rounded-lg shadow-lg text-sm leading-snug z-[1000] ${TOAST_STYLES[toast.type]}`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </main>
  );
}
