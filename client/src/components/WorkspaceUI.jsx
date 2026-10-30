import React from 'react';
import { LuFolderOpen } from 'react-icons/lu';

export const PageHeading = ({ eyebrow, title, description, action }) => (
  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-orange-700">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const MetricCard = ({ label, value, caption, icon, tone = 'orange' }) => {
  const tones = {
    orange: 'bg-orange-50 text-orange-800',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value ?? '—'}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          {React.createElement(icon, { 'aria-hidden': true, className: 'h-5 w-5' })}
        </span>
      </div>
      {caption && <p className="mt-3 text-xs leading-5 text-slate-500">{caption}</p>}
    </article>
  );
};

export const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex min-h-48 items-center justify-center">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
      {label}
    </div>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">Try again</button>}
    </div>
  </div>
);

export const EmptyState = ({ title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-800">
      <LuFolderOpen aria-hidden="true" className="h-6 w-6" />
    </div>
    <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-50';
export const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
export const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50';
