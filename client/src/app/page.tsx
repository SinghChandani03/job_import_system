'use client';

import React, { useEffect, useState } from 'react';
import { userFriendlyError } from '@/utils/userFriendlyError';
import { type Toast, TOAST_STYLES } from '@/utils/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type ImportLog = {
  _id: string;
  sourceUrl: string;
  timestamp: string;
  totalFetched: number;
  totalImported: number;
  newJobs: number;
  updatedJobs: number;
  failedJobs: number;
  failureReasons?: { jobId?: string; reason: string; code?: string }[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function truncateUrl(url: string, max = 45) {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

export default function ImportHistoryPage() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [filterUrl, setFilterUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filterUrl) params.set('sourceUrl', filterUrl);
    fetch(`${API_BASE}/api/import-logs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setToast({ message: userFriendlyError(data.error), type: 'error' });
          return;
        }
        setLogs(data.logs || []);
        setPagination(data.pagination || null);
      })
      .catch((err) => !cancelled && setToast({ message: userFriendlyError(err), type: 'error' }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [page, filterUrl]);

  return (
    <main className="min-h-screen bg-slate-100 max-w-6xl mx-auto p-8">
      <header className="flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Import History Tracking</h1>
        <a href="/sources" className="ml-auto px-4 py-2 text-sm font-medium bg-slate-100 text-slate-800 rounded-md hover:bg-slate-200 no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1">
          Job Sources
        </a>
        <div>
          <input
            type="text"
            placeholder="Filter by URL..."
            value={filterUrl}
            onChange={(e) => {
              setFilterUrl(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </header>

      {loading && <div className="text-slate-500 mb-4">Loading…</div>}

      <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                fileName
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                importDateTime
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                total
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                new
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                updated
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
                failed
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 bg-gray-50 border-b border-gray-200"></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <React.Fragment key={log._id}>
                <tr className="hover:bg-gray-50">
                  <td
                    title={log.sourceUrl}
                    className="px-4 py-3 max-w-[280px] truncate border-b border-gray-100"
                  >
                    {truncateUrl(log.sourceUrl)}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600 border-b border-gray-100">
                    {log.totalImported}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600 border-b border-gray-100">
                    {log.newJobs}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600 border-b border-gray-100">
                    {log.updatedJobs}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600 border-b border-gray-100">
                    {log.failedJobs}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {log.failedJobs > 0 && (
                      <button
                        type="button"
                        className="px-2 py-1 text-sm bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                        onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                      >
                        {expandedId === log._id ? 'Hide' : 'Reasons'}
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === log._id && log.failureReasons?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-3 bg-amber-50 text-sm border-b border-gray-100">
                      <ul className="list-disc pl-5 space-y-1">
                        {log.failureReasons.map((r, i) => (
                          <li key={i}>
                            <strong>{r.jobId || '—'}</strong>: {r.reason}
                            {r.code ? ` (${r.code})` : ''}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 text-sm rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="mt-4 text-slate-500 text-sm">No import history yet.</p>
      )}

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
