import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LuArrowLeftRight,
  LuCalendarClock,
  LuChartNoAxesCombined,
  LuCircleHelp,
  LuGauge,
  LuGitBranch,
  LuRefreshCw,
  LuShieldAlert,
  LuUsersRound,
} from 'react-icons/lu';
import { projectAPI, taskAPI } from '../services/api.js';
import { ErrorState, LoadingState, MetricCard, PageHeading, buttonSecondary, inputClass } from '../components/WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const hoursLabel = (hours) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;

const riskTone = (score) => {
  if (score >= 60) return 'border-rose-200 bg-rose-50 text-rose-700';
  if (score >= 25) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const projectForecast = (project) => {
  if (project.openTasks === 0) return { label: 'Delivered', tone: 'text-emerald-700' };
  if (!project.projectedFinish) return { label: 'Building delivery history', tone: 'text-slate-500' };
  if (!project.targetDate) {
    return {
      label: `Estimated ${formatDateOnly(project.projectedFinish, { month: 'short', day: 'numeric' })}`,
      tone: 'text-blue-700',
    };
  }
  const difference = new Date(project.projectedFinish).getTime() - new Date(project.targetDate).getTime();
  const daysLate = Math.ceil(difference / 86400000);
  if (daysLate > 0) return { label: `At risk · ~${daysLate}d late`, tone: 'text-rose-700' };
  return { label: `On track · ${formatDateOnly(project.projectedFinish, { month: 'short', day: 'numeric' })}`, tone: 'text-emerald-700' };
};

const DeliveryControlTowerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tower, setTower] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [requestedHours, setRequestedHours] = useState(4);
  const selectedProjectId = searchParams.get('projectId') || '';

  const loadTower = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await taskAPI.getDeliveryControlTower(selectedProjectId ? { projectId: selectedProjectId } : {});
      setTower(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load delivery outlook.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadTower();
  }, [loadTower, selectedProjectId]);

  useEffect(() => {
    projectAPI.getProjects()
      .then((response) => {
        setProjects(response.data);
        setProjectsError('');
      })
      .catch((requestError) => {
        setProjectsError(requestError.response?.data?.message || 'Team workspaces could not be loaded.');
      });
  }, []);

  const contributors = useMemo(
    () => (tower?.team || []).filter((member) => member.id !== 'unassigned' && member.openTasks > 0),
    [tower]
  );
  const source = contributors.find((member) => member.id === sourceId) || contributors[0];
  const target = contributors.find((member) => member.id === targetId && member.id !== source?.id)
    || contributors.find((member) => member.id !== source?.id);
  const movedHours = source && target
    ? Math.min(Math.max(0, Number(requestedHours) || 0), source.remainingHours)
    : 0;
  const projectedLoads = (tower?.team || []).map((member) => {
    if (member.id === source?.id) return { ...member, previewHours: member.remainingHours - movedHours };
    if (member.id === target?.id) return { ...member, previewHours: member.remainingHours + movedHours };
    return { ...member, previewHours: member.remainingHours };
  });
  const maxLoad = Math.max(1, ...projectedLoads.map((member) => member.previewHours));

  const buildTaskHref = (task) => {
    const params = new URLSearchParams();
    params.set('projectId', task.projectId || 'personal');
    params.set('search', task.title);
    return `/tasks?${params.toString()}`;
  };

  const handleWorkspaceChange = (event) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set('projectId', event.target.value);
    else next.delete('projectId');
    setSearchParams(next);
  };

  return (
    <div className="space-y-7 py-7 sm:py-9">
      <PageHeading
        eyebrow="See risk before it becomes a miss"
        title="Delivery control tower"
        description="Unlike a task list, the Control Tower surfaces delivery risks early and helps you discuss workload changes. Choose a shared team workspace or compare all your work."
        action={(
          <button type="button" onClick={() => loadTower(true)} disabled={loading || refreshing} className={buttonSecondary}>
            <LuRefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh outlook'}
          </button>
        )}
      />

      {error && <ErrorState message={error} onRetry={() => loadTower()} />}
      {!error && projectsError && <ErrorState message={projectsError} />}
      {error ? null : loading ? <LoadingState label="Reading delivery signals..." /> : (
        <>
          <section aria-label="Delivery workspace scope" className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/20 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Choose what to review</h2>
              <p className="mt-1 text-xs text-slate-500">Projects are shared team workspaces. Select one to focus its risks and workload.</p>
            </div>
            <label className="w-full text-xs font-semibold text-slate-600 sm:max-w-xs">
              Workspace scope
              <select aria-label="Workspace scope" value={selectedProjectId} onChange={handleWorkspaceChange} className={`${inputClass} mt-1.5`}>
                <option value="">All workspaces</option>
                <option value="personal">Personal work only</option>
                {projects.map((project) => <option key={project._id} value={project._id}>{project.name} · team workspace</option>)}
              </select>
            </label>
          </section>

          <section aria-label="How to use the delivery control tower" className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm sm:grid-cols-3">
            <p><strong className="text-slate-900">1. Set up a team:</strong> create a team workspace and invite registered teammates from <Link to="/projects" className="font-semibold text-orange-800 hover:underline">Projects</Link>.</p>
            <p><strong className="text-slate-900">2. Add useful signals:</strong> put tasks in that workspace, assign owners, and add due dates and effort estimates.</p>
            <p><strong className="text-slate-900">3. Act on the outlook:</strong> choose the workspace above, review risks, then use the rebalance preview to discuss—not automatically apply—changes.</p>
          </section>

          {projects.length === 0 && (
            <section className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-[#fffaf4] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-800">Turn TaskFlow into a team workspace</p>
                <h2 className="mt-1 font-semibold text-slate-900">Create a shared project and invite your teammates</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Add a project, invite people who already have TaskFlow accounts, then create project tasks and assign them to members. The Control Tower will show their workload here.</p>
              </div>
              <Link to="/projects?new=1" className="inline-flex shrink-0 items-center justify-center rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-800">Create team workspace</Link>
            </section>
          )}

          <section aria-label="Delivery outlook summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Open work" value={tower.summary.openTasks} caption="Tasks not yet completed" icon={LuChartNoAxesCombined} tone="orange" />
            <MetricCard label="Remaining effort" value={hoursLabel(tower.summary.remainingHours)} caption="Estimated hours across open tasks" icon={LuCalendarClock} tone="blue" />
            <MetricCard label="Overdue" value={tower.summary.overdueTasks} caption="Open tasks past their due date" icon={LuShieldAlert} tone="rose" />
            <MetricCard label="Blocked" value={tower.summary.blockedTasks} caption="Waiting on incomplete prerequisites" icon={LuGitBranch} tone="amber" />
            <MetricCard label="Projects to watch" value={tower.summary.atRiskProjects} caption="Risk score of 25 or higher" icon={LuGauge} tone="amber" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800"><LuGauge aria-hidden="true" className="h-5 w-5" /></span>
                  <div>
                    <h2 className="font-semibold text-slate-900">Project delivery outlook</h2>
                    <p className="mt-1 text-sm text-slate-500">A transparent risk score and finish estimate for each active workstream.</p>
                  </div>
                </div>
              </div>
              {tower.projects.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-slate-500">No task data is available in this scope yet. Add tasks, estimates, and due dates to start seeing delivery signals.</p>
                  <Link to={selectedProjectId ? `/tasks?projectId=${selectedProjectId}&new=1` : '/tasks?new=1'} className="mt-3 inline-flex text-sm font-semibold text-orange-800 hover:text-orange-900">Create a task</Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tower.projects.map((project) => {
                    const forecast = projectForecast(project);
                    return (
                      <div key={project.id} className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1.3fr)_minmax(130px,0.8fr)_minmax(140px,0.9fr)] sm:items-center sm:px-6">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-slate-900">{project.name}</h3>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${riskTone(project.riskScore)}`}>
                              {project.riskScore >= 60 ? 'High risk' : project.riskScore >= 25 ? 'Watch' : 'Healthy'} · {project.riskScore}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{project.openTasks} open · {hoursLabel(project.remainingHours)} left · {project.overdueTasks} overdue</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">Critical dependency chain: {hoursLabel(project.criticalPathHours)} · {project.blockedTasks} blocked</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Delivery forecast</p>
                          <p className={`mt-1 text-sm font-semibold ${forecast.tone}`}>{forecast.label}</p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {project.targetDate ? `Latest open deadline ${formatDateOnly(project.targetDate, { month: 'short', day: 'numeric' })}` : 'No open task deadlines'}
                          </p>
                        </div>
                        <div>
                          <div className="mb-1.5 flex justify-between text-[11px] text-slate-500"><span>Risk signals</span><span>{project.dueSoonTasks} due soon · {project.blockedTasks} blocked</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${project.riskScore} out of 100 risk score`}>
                            <div className={`h-full rounded-full ${project.riskScore >= 60 ? 'bg-rose-500' : project.riskScore >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${project.riskScore}%` }} />
                          </div>
                          <Link to={`/tasks?projectId=${project.id === 'personal' ? 'personal' : project.id}`} className="mt-2 inline-flex text-xs font-semibold text-orange-800 hover:text-orange-900">Open workstream</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700"><LuShieldAlert aria-hidden="true" className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-slate-900">Risk radar</h2>
                  <p className="mt-1 text-sm text-slate-500">The next tasks most likely to disrupt delivery.</p>
                </div>
              </div>
              {tower.riskTasks.length === 0 ? (
                <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">No open tasks currently meet the risk radar rules.</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {tower.riskTasks.map((task) => (
                    <Link key={task._id} to={buildTaskHref(task)} className="block rounded-xl border border-slate-100 p-3 transition hover:border-orange-200 hover:bg-orange-50/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{task.title}</p>
                          <p className="mt-1 truncate text-xs text-slate-500">{task.project} · {task.assignee || 'Unassigned'}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">{task.estimatedHours ?? 2}h</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {task.reasons.map((reason) => <span key={reason} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">{reason}</span>)}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><LuUsersRound aria-hidden="true" className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-slate-900">Team workload</h2>
                  <p className="mt-1 text-sm text-slate-500">Remaining estimated effort by current assignee—not a calendar-capacity claim.</p>
                </div>
              </div>
              {tower.team.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">No open work to balance.</p>
              ) : (
                <div className="mt-6 space-y-4">
                  {projectedLoads.map((member) => (
                    <div key={member.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-slate-700">{member.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{hoursLabel(member.previewHours)} · {member.openTasks} tasks{member.overdueTasks ? ` · ${member.overdueTasks} overdue` : ''}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all ${member.id === source?.id || member.id === target?.id ? 'bg-orange-500' : 'bg-slate-400'}`} style={{ width: `${Math.min(100, (member.previewHours / maxLoad) * 100)}%` }} />
                      </div>
                      {member.id === source?.id || member.id === target?.id ? (
                        <p className="mt-1 text-[10px] font-medium text-orange-800">Scenario preview</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-orange-200 bg-[#fffaf4] p-5 shadow-sm shadow-orange-100/40 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-800"><LuArrowLeftRight aria-hidden="true" className="h-5 w-5" /></span>
                <div>
                  <h2 className="font-semibold text-slate-900">What-if workload rebalance</h2>
                  <p className="mt-1 text-sm text-slate-600">Preview how shifting effort could change the current load distribution.</p>
                </div>
              </div>
              {contributors.length < 2 ? (
                <p className="mt-5 rounded-xl border border-orange-100 bg-white p-4 text-sm text-slate-600">Assign open project tasks to at least two people to model a redistribution.</p>
              ) : (
                <>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">Move effort from
                      <select value={source?.id || ''} onChange={(event) => setSourceId(event.target.value)} className={`${inputClass} mt-1.5`}>
                        {contributors.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-semibold text-slate-600">To
                      <select value={target?.id || ''} onChange={(event) => setTargetId(event.target.value)} className={`${inputClass} mt-1.5`}>
                        {contributors.filter((member) => member.id !== source?.id).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                      </select>
                    </label>
                  </div>
                  <label className="mt-4 block text-xs font-semibold text-slate-600">
                    Preview effort shift: <span className="text-orange-800">{hoursLabel(movedHours)}</span>
                    <input type="range" min="0" max={Math.max(0.5, source?.remainingHours || 0)} step="0.5" value={movedHours} onChange={(event) => setRequestedHours(Number(event.target.value))} className="mt-3 w-full accent-orange-700" />
                  </label>
                  <p className="mt-3 rounded-xl border border-orange-100 bg-white p-3 text-xs leading-5 text-slate-600">
                    Preview only—no task ownership or assignments change. Use this scenario to start a team conversation, then update task assignments from the task list.
                  </p>
                </>
              )}
            </article>
          </section>

          <details className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-800">
              <LuCircleHelp aria-hidden="true" className="h-4 w-4 text-slate-400" />
              How these signals are calculated
            </summary>
            <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-600 md:grid-cols-3">
              <p><strong className="text-slate-800">Task estimates:</strong> New tasks default to 2 hours until edited. Estimates are planning inputs, not time tracking.</p>
              <p><strong className="text-slate-800">Finish forecast:</strong> Remaining estimated hours are divided by estimated hours completed per day over the last 14 days. Without recent completions, no finish date is guessed.</p>
              <p><strong className="text-slate-800">Dependencies:</strong> a task is blocked while any prerequisite is incomplete. The critical chain is the longest linked sequence of remaining estimated effort; it is not a full calendar schedule.</p>
              <p><strong className="text-slate-800">Risk score:</strong> Weighted share of open tasks that are overdue (40%), due within 7 days (20%), high/urgent priority (15%), unassigned (10%), or blocked (15%). It is a transparent triage signal, not a probability of failure.</p>
            </div>
            <p className="mt-3 text-xs text-slate-400">A project's planning deadline is the latest due date among its open tasks. Add estimates and due dates to improve signal quality.</p>
          </details>
        </>
      )}
    </div>
  );
};

export default DeliveryControlTowerPage;
