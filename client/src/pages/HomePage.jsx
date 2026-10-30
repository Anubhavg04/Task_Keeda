import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCalendarDays, LuCheck, LuCircle, LuCircleCheck, LuClock3, LuFolderKanban, LuPlus } from 'react-icons/lu';
import { useAuth } from '../context/useAuth.js';
import { taskAPI } from '../services/api.js';
import { ErrorState, LoadingState, MetricCard, PageHeading } from '../components/WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const dateLabel = (value) => formatDateOnly(value, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const HomePage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 30);
      const [summaryResponse, upcomingResponse, recentResponse] = await Promise.all([
        taskAPI.getSummary(),
        taskAPI.getTasks({ from: start.toISOString(), to: end.toISOString(), limit: 10, sort: 'dueDate', order: 'asc' }),
        taskAPI.getTasks({ limit: 4, sort: 'updatedAt', order: 'desc' }),
      ]);
      setSummary(summaryResponse.data);
      setUpcoming(upcomingResponse.data.tasks.filter((task) => task.status !== 'done').slice(0, 5));
      setRecent(recentResponse.data.tasks);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not load your workspace. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const completedPercentage = summary?.total
    ? Math.round((summary.done / summary.total) * 100)
    : 0;

  return (
    <div className="space-y-7 py-7 sm:py-9">
      <PageHeading
        eyebrow={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user?.fullname?.split(' ')[0] || 'there'}`}
        description="A clear view of your work, your projects, and what needs your attention."
        action={
          <Link to="/tasks?new=1" className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition hover:bg-orange-700">
            <LuPlus aria-hidden="true" className="h-4 w-4" /> New task
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={loadWorkspace} />}
      {loading && !summary ? <LoadingState label="Gathering your workspace..." /> : error && !summary ? null : (
        <>
          <section aria-label="Workspace metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Open tasks" value={(summary?.todo || 0) + (summary?.inProgress || 0)} caption={`${summary?.todo || 0} to do · ${summary?.inProgress || 0} in progress`} icon={LuClock3} tone="orange" />
            <MetricCard label="Completed" value={summary?.done || 0} caption={`${completedPercentage}% of all your tasks`} icon={LuCircleCheck} tone="emerald" />
            <MetricCard label="Due this week" value={summary?.dueThisWeek || 0} caption={`${summary?.dueToday || 0} need attention today`} icon={LuCalendarDays} tone="blue" />
            <MetricCard label="Projects" value={summary?.projects || 0} caption="Shared spaces for focused work" icon={LuFolderKanban} tone="amber" />
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,0.8fr)]">
            <div className="space-y-6">
              <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="font-semibold text-slate-900">Recently updated</h2>
                    <p className="mt-1 text-xs text-slate-500">The latest work across your workspace</p>
                  </div>
                  <Link to="/tasks" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-800 hover:text-orange-900">All tasks <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                </div>
                {recent.length ? (
                  <ul className="divide-y divide-slate-100">
                    {recent.map((task) => (
                      <li key={task._id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                          task.status === 'done' ? 'bg-emerald-50 text-emerald-700' : task.status === 'in-progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {task.status === 'done' ? <LuCheck aria-hidden="true" className="h-4 w-4" /> : task.status === 'in-progress' ? <LuClock3 aria-hidden="true" className="h-4 w-4" /> : <LuCircle aria-hidden="true" className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{task.project?.name || 'Personal'} · {task.dueDate ? `Due ${dateLabel(task.dueDate)}` : 'No due date'}</p>
                        </div>
                        <span className="hidden rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-500 sm:inline">{task.status.replace('-', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-6 py-10 text-center">
                    <p className="font-medium text-slate-700">A fresh start</p>
                    <p className="mt-1 text-sm text-slate-500">Create a task to get your workspace moving.</p>
                    <Link to="/tasks?new=1" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-800 hover:text-orange-900">Create your first task <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                  </div>
                )}
              </article>

              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">Weekly momentum</h2>
                    <p className="mt-1 text-xs text-slate-500">Tasks completed this week</p>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{summary?.completedThisWeek || 0}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-400 transition-all" style={{ width: `${Math.min(completedPercentage, 100)}%` }} />
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>{completedPercentage}% overall completion</span>
                  <Link to="/reports" className="inline-flex items-center gap-1 font-medium text-orange-800 hover:text-orange-900">View reports <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                </div>
              </article>
            </div>

            <div className="space-y-6">
              <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">Coming up</h2>
                    <p className="mt-1 text-xs text-slate-500">Your next due dates</p>
                  </div>
                  <Link to="/calendar" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-800 hover:text-orange-900">Calendar <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                </div>
                {upcoming.length ? (
                  <ul className="space-y-3">
                    {upcoming.map((task) => (
                      <li key={task._id} className="flex items-start gap-3">
                        <span className="mt-0.5 min-w-12 rounded-lg bg-orange-50 px-2 py-1 text-center text-[10px] font-bold uppercase text-orange-700">
                          {formatDateOnly(task.dueDate, { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{task.project?.name || 'Personal'}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-5 text-center text-sm text-slate-500">Nothing due soon. Enjoy the breathing room.</p>
                )}
              </article>

              <article className="rounded-2xl bg-gradient-to-br from-orange-700 to-red-800 p-5 text-white shadow-lg shadow-orange-200/60 sm:p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-200">Make it a team effort</div>
                <h2 className="mt-3 text-xl font-bold">Good work is better together.</h2>
                <p className="mt-2 text-sm leading-6 text-orange-100">Create a shared project, invite your team, and keep tasks and notes in one place.</p>
                <Link to="/projects" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/25">Explore projects <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage;
