import React, { useCallback, useEffect, useState } from 'react';
import { LuArrowDownToLine, LuBriefcaseBusiness, LuCircleAlert, LuCircleCheck, LuTrendingUp } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { taskAPI } from '../services/api.js';
import { ErrorState, LoadingState, MetricCard, PageHeading, buttonSecondary } from '../components/WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const priorityTones = {
  urgent: 'bg-rose-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
};

const csvCell = (value) => {
  const safeValue = String(value ?? '').replace(/^[\t\r\n ]*[=+\-@]/, "'$&");
  return `"${safeValue.replace(/"/g, '""')}"`;
};

const ReportsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await taskAPI.getSummary();
      setSummary(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const exportTasks = async () => {
    setExporting(true);
    try {
      const firstPage = await taskAPI.getTasks({ page: 1, limit: 100, sort: 'createdAt', order: 'desc' });
      const tasks = [...firstPage.data.tasks];
      const totalPages = firstPage.data.pagination.totalPages;
      for (let firstPageNumber = 2; firstPageNumber <= totalPages; firstPageNumber += 10) {
        const pageNumbers = Array.from({ length: Math.min(10, totalPages - firstPageNumber + 1) }, (_, index) => firstPageNumber + index);
        const responses = await Promise.all(pageNumbers.map((page) => taskAPI.getTasks({ page, limit: 100, sort: 'createdAt', order: 'desc' })));
        tasks.push(...responses.flatMap((response) => response.data.tasks));
      }

      const rows = [
        ['Title', 'Description', 'Status', 'Priority', 'Estimated effort (hours)', 'Blocked by', 'Due date', 'Project', 'Created', 'Updated'],
        ...tasks.map((task) => [
          task.title,
          task.description,
          task.status,
          task.priority,
          task.estimatedHours ?? 2,
          (task.dependsOn || []).map((dependency) => dependency.title).join('; '),
          task.dueDate ? formatDateOnly(task.dueDate, { year: 'numeric', month: '2-digit', day: '2-digit' }) : '',
          task.project?.name || 'Personal',
          new Date(task.createdAt).toLocaleDateString(),
          new Date(task.updatedAt).toLocaleDateString(),
        ]),
      ];
      const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const download = document.createElement('a');
      download.href = url;
      download.download = `taskflow-report-${new Date().toISOString().slice(0, 10)}.csv`;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${tasks.length} tasks`);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not export tasks');
    } finally {
      setExporting(false);
    }
  };

  const completionRate = summary?.total ? Math.round((summary.done / summary.total) * 100) : 0;
  const activePriorities = summary?.priorities || {};
  const maxPriority = Math.max(1, ...Object.values(activePriorities));
  const projectRows = summary?.byProject || [];

  return (
    <div className="space-y-7 py-7 sm:py-9">
      <PageHeading
        eyebrow="Measure what moves"
        title="Reports"
        description="A live snapshot of task health, delivery momentum, and where work is happening."
        action={<button type="button" onClick={exportTasks} disabled={exporting || loading} className={buttonSecondary}><LuArrowDownToLine aria-hidden="true" className="h-4 w-4" />{exporting ? 'Preparing export...' : 'Export all tasks'}</button>}
      />

      {error && <ErrorState message={error} onRetry={loadReport} />}
      {error ? null : loading ? <LoadingState label="Calculating workspace insights..." /> : (
        <>
          <section aria-label="Task report summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total tasks" value={summary?.total || 0} caption={`${summary?.projects || 0} shared projects`} icon={LuBriefcaseBusiness} tone="orange" />
            <MetricCard label="Completion rate" value={`${completionRate}%`} caption={`${summary?.done || 0} tasks completed`} icon={LuCircleCheck} tone="emerald" />
            <MetricCard label="Needs attention" value={(summary?.overdue || 0) + (summary?.dueToday || 0)} caption={`${summary?.overdue || 0} overdue · ${summary?.dueToday || 0} due today`} icon={LuCircleAlert} tone="rose" />
            <MetricCard label="This week's wins" value={summary?.completedThisWeek || 0} caption="Tasks completed since Monday" icon={LuTrendingUp} tone="blue" />
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-slate-900">Task status</h2>
                <p className="mt-1 text-sm text-slate-500">How work is distributed right now</p>
              </div>
              <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${summary?.todo || 0} to do, ${summary?.inProgress || 0} in progress, ${summary?.done || 0} completed`}>
                {[
                  ['todo', summary?.todo || 0, 'bg-slate-400'],
                  ['in progress', summary?.inProgress || 0, 'bg-amber-400'],
                  ['completed', summary?.done || 0, 'bg-emerald-500'],
                ].map(([label, count, color]) => (
                  <div key={label} title={`${label}: ${count}`} className={`${color} transition-all`} style={{ width: `${summary?.total ? (count / summary.total) * 100 : 0}%` }} />
                ))}
              </div>
              <div className="space-y-4">
                {[
                  ['To do', summary?.todo || 0, 'bg-slate-400'],
                  ['In progress', summary?.inProgress || 0, 'bg-amber-400'],
                  ['Completed', summary?.done || 0, 'bg-emerald-500'],
                ].map(([label, count, color]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="flex-1 text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                    <span className="w-10 text-right text-xs text-slate-400">{summary?.total ? Math.round((count / summary.total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-slate-900">Open work by priority</h2>
                <p className="mt-1 text-sm text-slate-500">Use priority to focus the team's attention</p>
              </div>
              <div className="space-y-5">
                {['urgent', 'high', 'medium', 'low'].map((priority) => (
                  <div key={priority}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium capitalize text-slate-700">{priority}</span>
                      <span className="text-sm font-semibold text-slate-900">{activePriorities[priority] || 0}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${priorityTones[priority]} transition-all`} style={{ width: `${((activePriorities[priority] || 0) / maxPriority) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">Work by project</h2>
              <p className="mt-1 text-sm text-slate-500">Progress across your busiest spaces</p>
            </div>
            {projectRows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th scope="col" className="pb-3 pr-4">Workspace</th>
                      <th scope="col" className="pb-3 pr-4">Tasks</th>
                      <th scope="col" className="pb-3 pr-4">Complete</th>
                      <th scope="col" className="pb-3">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectRows.map((project) => {
                      const rate = project.total ? Math.round((project.done / project.total) * 100) : 0;
                      return (
                        <tr key={project.name}>
                          <th scope="row" className="py-4 pr-4 font-medium text-slate-800">{project.name}</th>
                          <td className="py-4 pr-4 text-slate-600">{project.total}</td>
                          <td className="py-4 pr-4 text-slate-600">{project.done}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-orange-500" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="w-9 text-right text-xs text-slate-500">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">As tasks and projects grow, their progress will appear here.</p>
            )}
          </article>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
