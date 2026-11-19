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

const SkeletonBlock = ({ className = '' }) => (
  <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
);

export const TasksListSkeleton = () => (
  <div role="status" aria-label="Loading tasks" className="space-y-3">
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex gap-4">
          <SkeletonBlock className="h-6 w-6 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2"><SkeletonBlock className="h-5 w-48 max-w-full" /><SkeletonBlock className="h-5 w-20" /><SkeletonBlock className="h-5 w-16" /></div>
            <SkeletonBlock className="h-4 w-3/4 max-w-full" />
            <SkeletonBlock className="h-3 w-2/5 max-w-full" />
          </div>
        </div>
      </div>
    ))}
    <span className="sr-only">Loading your tasks...</span>
  </div>
);

export const ProjectsCardsSkeleton = () => (
  <div role="status" aria-label="Loading projects" className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="rounded-2xl border border-slate-200/80 border-t-[3px] border-t-orange-300 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><SkeletonBlock className="mt-1 h-3 w-3 rounded-full" /><div className="flex-1 space-y-2"><SkeletonBlock className="h-5 w-3/4" /><SkeletonBlock className="h-5 w-16 rounded-full" /></div></div>
        <SkeletonBlock className="mt-5 h-4 w-full" />
        <SkeletonBlock className="mt-2 h-4 w-4/5" />
        <SkeletonBlock className="mt-6 h-20 w-full" />
        <SkeletonBlock className="mt-5 h-9 w-full" />
      </div>
    ))}
    <span className="sr-only">Loading your projects...</span>
  </div>
);

export const NotesGridSkeleton = () => (
  <div role="status" aria-label="Loading notes" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className="flex min-h-56 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-5 h-5 w-3/4" />
        <div className="mt-4 flex-1 space-y-2"><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="h-4 w-2/3" /></div>
        <SkeletonBlock className="mt-5 h-4 w-24" />
      </div>
    ))}
    <span className="sr-only">Loading your notes...</span>
  </div>
);

export const ReportsSkeleton = () => (
  <div role="status" aria-label="Loading reports" className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <SkeletonBlock className="h-4 w-24" /><SkeletonBlock className="mt-4 h-9 w-20" /><SkeletonBlock className="mt-4 h-3 w-32" />
        </div>
      ))}
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <SkeletonBlock className="h-5 w-32" /><SkeletonBlock className="mt-2 h-4 w-48" />
          <div className="mt-7 space-y-5">{Array.from({ length: 4 }, (_, row) => <SkeletonBlock key={row} className="h-4 w-full" />)}</div>
        </div>
      ))}
    </div>
    <span className="sr-only">Calculating workspace insights...</span>
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-900">
    <div>
      <p className="font-semibold">{message}</p>
      <p className="mt-1 text-xs leading-5 text-rose-800">The server may be waking up or temporarily unavailable. Please try again in a moment.</p>
    </div>
    {onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100">Retry</button>}
  </div>
);

export const EmptyState = ({ title, description, action, icon = LuFolderOpen }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-800">
      {React.createElement(icon, { 'aria-hidden': true, className: 'h-6 w-6' })}
    </div>
    <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:cursor-not-allowed disabled:opacity-50';
export const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';
export const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50';
