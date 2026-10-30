import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import {
  LuArrowDown,
  LuArrowRight,
  LuCalendarClock,
  LuCircleHelp,
  LuGitBranch,
  LuPlus,
  LuRefreshCw,
  LuScale,
  LuShieldAlert,
  LuSparkles,
} from 'react-icons/lu';
import { projectAPI, taskAPI } from '../services/api.js';
import { ErrorState, LoadingState, MetricCard, PageHeading, buttonSecondary, inputClass } from '../components/WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const hoursLabel = (hours) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
const dayStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

const getProjectId = (task) => task.project?._id || task.project || 'personal';
const getEstimate = (task) => Number(task.estimatedHours ?? 2);

const getRiskScore = (tasks, blockedTasks) => {
  const openTasks = tasks.filter((task) => task.status !== 'done');
  if (!openTasks.length) return 0;
  const today = dayStart();
  const nextWeek = new Date(today);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const overdue = openTasks.filter((task) => task.dueDate && new Date(task.dueDate) < today).length;
  const dueSoon = openTasks.filter((task) => task.dueDate && new Date(task.dueDate) >= today && new Date(task.dueDate) < nextWeek).length;
  const highPriority = openTasks.filter((task) => ['high', 'urgent'].includes(task.priority)).length;
  const unassigned = openTasks.filter((task) => !task.assignee).length;
  return Math.min(100, Math.round(
    (overdue / openTasks.length) * 40 +
    (dueSoon / openTasks.length) * 20 +
    (highPriority / openTasks.length) * 15 +
    (unassigned / openTasks.length) * 10 +
    (blockedTasks / openTasks.length) * 15
  ));
};

const analyzePlan = (tasks) => {
  const byId = new Map(tasks.map((task) => [String(task._id), task]));
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const blockedTasks = openTasks.filter((task) => (task.dependsOn || []).some((dependency) => {
    const prerequisite = byId.get(String(dependency._id || dependency));
    return prerequisite && prerequisite.status !== 'done';
  }));
  const memo = new Map();
  const longestPath = (task, visiting = new Set()) => {
    const id = String(task._id);
    if (memo.has(id)) return memo.get(id);
    if (visiting.has(id) || task.status === 'done') return { hours: 0, ids: [] };
    visiting.add(id);
    const prerequisites = (task.dependsOn || [])
      .map((dependency) => byId.get(String(dependency._id || dependency)))
      .filter((dependency) => dependency && dependency.status !== 'done');
    let predecessor = { hours: 0, ids: [] };
    for (const dependency of prerequisites) {
      const path = longestPath(dependency, visiting);
      if (path.hours > predecessor.hours) predecessor = path;
    }
    visiting.delete(id);
    const path = { hours: predecessor.hours + getEstimate(task), ids: [...predecessor.ids, id] };
    memo.set(id, path);
    return path;
  };
  let criticalPath = { hours: 0, ids: [] };
  for (const task of openTasks) {
    const path = longestPath(task);
    if (path.hours > criticalPath.hours) criticalPath = path;
  }
  const targetDate = openTasks
    .map((task) => task.dueDate ? new Date(task.dueDate) : null)
    .filter(Boolean)
    .sort((a, b) => b - a)[0] || null;

  return {
    openTasks,
    openHours: openTasks.reduce((sum, task) => sum + getEstimate(task), 0),
    blockedCount: blockedTasks.length,
    blockedTasks,
    criticalPath,
    targetDate,
    riskScore: getRiskScore(tasks, blockedTasks.length),
  };
};

const formatForecast = (hours, velocity, targetDate) => {
  if (hours === 0) return { text: 'Complete', date: dayStart() };
  if (velocity <= 0) return { text: 'Insufficient completion history', date: null };
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + Math.ceil(hours / velocity));
  if (!targetDate) return { text: `Estimated ${formatDateOnly(date, { month: 'short', day: 'numeric', year: 'numeric' })}`, date };
  const difference = Math.ceil((date.getTime() - targetDate.getTime()) / 86400000);
  if (difference > 0) return { text: `About ${difference} day${difference === 1 ? '' : 's'} after latest deadline`, date };
  return { text: `Within latest deadline · ${formatDateOnly(date, { month: 'short', day: 'numeric' })}`, date };
};

const ImpactSimulatorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [velocityByProject, setVelocityByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('add');
  const [changeType, setChangeType] = useState('deadline');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [dueDate, setDueDate] = useState('');
  const [dependencies, setDependencies] = useState([]);
  const scopeId = searchParams.get('projectId') || '';

  const loadData = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = scopeId ? { projectId: scopeId } : {};
      const [firstPage, towerResponse, projectResponse] = await Promise.all([
        taskAPI.getTasks({ ...params, page: 1, limit: 100, sort: 'title', order: 'asc' }),
        taskAPI.getDeliveryControlTower(params),
        projectAPI.getProjects(),
      ]);
      const totalPages = firstPage.data.pagination.totalPages;
      if (totalPages > 20) {
        throw new Error('This scope contains more than 2,000 tasks. Choose a specific team workspace to simulate a focused plan.');
      }
      const pages = [firstPage.data.tasks];
      for (let page = 2; page <= totalPages; page += 5) {
        const pageNumbers = Array.from({ length: Math.min(5, totalPages - page + 1) }, (_, index) => page + index);
        const responses = await Promise.all(pageNumbers.map((pageNumber) =>
          taskAPI.getTasks({ ...params, page: pageNumber, limit: 100, sort: 'title', order: 'asc' })
        ));
        pages.push(...responses.map((response) => response.data.tasks));
      }
      const velocity = {};
      (towerResponse.data.projects || []).forEach((project) => {
        velocity[project.id] = (project.completedHoursLast14Days || 0) / 14;
      });
      setTasks(pages.flat());
      setVelocityByProject(velocity);
      setProjects(projectResponse.data);
      setSelectedTaskId((current) => current && pages.flat().some((task) => task._id === current)
        ? current
        : pages.flat().find((task) => task.status !== 'done')?._id || '');
      if (!scopeId) setTargetProjectId((current) => current || projectResponse.data[0]?._id || 'personal');
      else setTargetProjectId(scopeId);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Could not load a safe planning snapshot.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scopeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const scopeOptions = useMemo(() => [
    { id: 'personal', label: 'Personal workspace' },
    ...projects.map((project) => ({ id: project._id, label: `${project.name} · team workspace` })),
  ], [projects]);

  const targetScopeId = scopeId || targetProjectId;
  const targetScopeLabel = scopeId
    ? scopeOptions.find((option) => option.id === scopeId)?.label || 'Selected workspace'
    : 'All workspaces combined';
  const selectedTask = tasks.find((task) => task._id === selectedTaskId);
  const targetTasks = useMemo(
    () => tasks.filter((task) => getProjectId(task) === (mode === 'change' && selectedTask ? getProjectId(selectedTask) : targetScopeId)),
    [tasks, mode, selectedTask, targetScopeId]
  );
  useEffect(() => {
    if (mode === 'change' && changeType === 'deadline') {
      setDueDate(selectedTask?.dueDate ? String(selectedTask.dueDate).slice(0, 10) : '');
    }
  }, [selectedTaskId, selectedTask?.dueDate, mode, changeType]);
  const currentPlan = useMemo(() => analyzePlan(tasks), [tasks]);
  const targetPlan = currentPlan;
  const dailyVelocity = useMemo(() => {
    if (scopeId) return velocityByProject[scopeId === 'personal' ? 'personal' : scopeId] || 0;
    return Object.values(velocityByProject).reduce((sum, value) => sum + value, 0);
  }, [scopeId, velocityByProject]);

  const scenarioTasks = useMemo(() => {
    if (mode === 'add') {
      if (!targetScopeId || !title.trim()) return tasks;
      return [...tasks, {
        _id: '__scenario_task__',
        title: title.trim(),
        status: 'todo',
        priority: 'medium',
        estimatedHours: Number(estimatedHours) || 0,
        dueDate: dueDate || null,
        assignee: null,
        dependsOn: dependencies,
        project: targetScopeId === 'personal' ? null : targetScopeId,
      }];
    }
    if (!selectedTask || !targetScopeId) return tasks;
    return tasks.map((task) => {
      if (task._id !== selectedTask._id) return task;
      if (changeType === 'deadline') return { ...task, dueDate: dueDate || null };
      return { ...task, estimatedHours: Number(estimatedHours) || getEstimate(task) };
    });
  }, [mode, tasks, targetScopeId, title, estimatedHours, dueDate, dependencies, selectedTask, changeType]);

  const scenarioPlan = useMemo(() => analyzePlan(scenarioTasks), [scenarioTasks]);
  const baselineForecast = useMemo(
    () => formatForecast(targetPlan.openHours, dailyVelocity, targetPlan.targetDate),
    [targetPlan, dailyVelocity]
  );
  const scenarioForecast = useMemo(
    () => formatForecast(scenarioPlan.openHours, dailyVelocity, scenarioPlan.targetDate),
    [scenarioPlan, dailyVelocity]
  );
  const scopeTaskChoices = scopeId ? tasks : tasks.filter((task) => task.status !== 'done');
  const candidateTasks = targetTasks.filter((task) => task.status !== 'done');

  const downstreamTasks = useMemo(() => {
    if (mode !== 'change' || !selectedTask) return [];
    const impacted = new Set([selectedTask._id]);
    let changed = true;
    while (changed) {
      changed = false;
      targetTasks.forEach((task) => {
        const hasImpactedPredecessor = (task.dependsOn || []).some((dependency) => impacted.has(String(dependency._id || dependency)));
        if (hasImpactedPredecessor && !impacted.has(task._id)) {
          impacted.add(task._id);
          changed = true;
        }
      });
    }
    return targetTasks.filter((task) => task._id !== selectedTask._id && impacted.has(task._id) && task.status !== 'done');
  }, [mode, selectedTask, targetTasks]);

  const criticalPathTitles = scenarioPlan.criticalPath.ids
    .map((id) => scenarioTasks.find((task) => String(task._id) === id)?.title)
    .filter(Boolean);

  const updateScope = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('projectId', value);
    else next.delete('projectId');
    setSearchParams(next);
  };

  const resetScenario = () => {
    setTitle('');
    setDueDate('');
    setDependencies([]);
    setEstimatedHours(4);
  };

  const toggleDependency = (id) => {
    setDependencies((current) => current.includes(id)
      ? current.filter((dependencyId) => dependencyId !== id)
      : current.length < 20 ? [...current, id] : current);
  };

  const estimateDelta = scenarioPlan.openHours - targetPlan.openHours;
  const criticalDelta = scenarioPlan.criticalPath.hours - targetPlan.criticalPath.hours;
  const riskDelta = scenarioPlan.riskScore - targetPlan.riskScore;
  const forecastDeltaDays = baselineForecast.date && scenarioForecast.date
    ? Math.round((scenarioForecast.date.getTime() - baselineForecast.date.getTime()) / 86400000)
    : null;

  return (
    <div className="space-y-7 py-7 sm:py-9">
      <PageHeading
        eyebrow="Decide before you commit"
        title="Change impact simulator"
        description="Preview how added scope, a deadline move, or an estimate change could affect delivery—without saving changes to real tasks."
        action={(
          <button type="button" onClick={() => loadData(true)} disabled={loading || refreshing} className={buttonSecondary}>
            <LuRefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh snapshot'}
          </button>
        )}
      />

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <LuCircleHelp aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p><strong>Simulation only.</strong> Nothing is changed, assigned, or saved. The forecast uses your last 14 days of completed effort as a planning pace—not a promise or a capacity guarantee.</p>
      </div>

      {error && <ErrorState message={error} onRetry={() => loadData()} />}
      {error ? null : loading ? <LoadingState label="Loading a fresh planning snapshot..." /> : (
        <>
          <section aria-label="Simulation controls" className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20 sm:p-6">
              <div className="flex items-center gap-2">
                <LuScale aria-hidden="true" className="h-5 w-5 text-orange-800" />
                <h2 className="font-semibold text-slate-900">Choose the plan to test</h2>
              </div>
              <label className="mt-5 block text-xs font-semibold text-slate-600">
                Analyze workspace
                <select aria-label="Analyze workspace" value={scopeId} onChange={(event) => updateScope(event.target.value)} className={`${inputClass} mt-1.5`}>
                  <option value="">All workspaces combined</option>
                  {scopeOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                <button type="button" aria-pressed={mode === 'add'} onClick={() => { setMode('add'); resetScenario(); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'add' ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><LuPlus aria-hidden="true" className="mr-1 inline h-4 w-4" />Add scope</button>
                <button type="button" aria-pressed={mode === 'change'} onClick={() => { setMode('change'); resetScenario(); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'change' ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><LuCalendarClock aria-hidden="true" className="mr-1 inline h-4 w-4" />Change a task</button>
              </div>

              {mode === 'add' ? (
                <div className="mt-5 space-y-4">
                  {!scopeId && (
                    <label className="block text-xs font-semibold text-slate-600">
                      Add simulated work to
                      <select aria-label="Add simulated work to" value={targetProjectId} onChange={(event) => setTargetProjectId(event.target.value)} className={`${inputClass} mt-1.5`}>
                        <option value="personal">Personal workspace</option>
                        {projects.map((project) => <option key={project._id} value={project._id}>{project.name} · team workspace</option>)}
                      </select>
                    </label>
                  )}
                  <label className="block text-xs font-semibold text-slate-600">
                    Proposed task
                    <input aria-label="Proposed task" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Add launch compliance review" className={`${inputClass} mt-1.5`} />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-slate-600">
                      Effort estimate (hours)
                      <input type="number" min="0.25" max="500" step="0.25" value={estimatedHours} onChange={(event) => setEstimatedHours(event.target.value)} className={`${inputClass} mt-1.5`} />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Proposed due date
                      <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={`${inputClass} mt-1.5`} />
                    </label>
                  </div>
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-slate-600">Prerequisites in {targetScopeLabel}</legend>
                    <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                      {candidateTasks.length === 0 ? <p className="p-2 text-xs text-slate-500">No open tasks to link.</p> : candidateTasks.map((task) => (
                        <label key={task._id} className="flex items-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-slate-50">
                          <input type="checkbox" checked={dependencies.includes(task._id)} onChange={() => toggleDependency(task._id)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500" />
                          <span className="min-w-0 flex-1 truncate text-slate-700">{task.title}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Up to 20 prerequisites · scenario is not saved</p>
                  </fieldset>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <label className="block text-xs font-semibold text-slate-600">
                    Task to change
                    <select aria-label="Task to change" value={selectedTaskId} onChange={(event) => { setSelectedTaskId(event.target.value); setDueDate(''); setEstimatedHours(4); }} className={`${inputClass} mt-1.5`}>
                      <option value="">Choose an open task</option>
                      {scopeTaskChoices.filter((task) => task.status !== 'done').map((task) => (
                        <option key={task._id} value={task._id}>{task.title} · {getEstimate(task)}h</option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    <button type="button" aria-pressed={changeType === 'deadline'} onClick={() => setChangeType('deadline')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${changeType === 'deadline' ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500'}`}>Move deadline</button>
                    <button type="button" aria-pressed={changeType === 'effort'} onClick={() => setChangeType('effort')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${changeType === 'effort' ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500'}`}>Change estimate</button>
                  </div>
                  {changeType === 'deadline' ? (
                    <label className="block text-xs font-semibold text-slate-600">
                      New due date
                      <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={`${inputClass} mt-1.5`} />
                      <span className="mt-1 block font-normal text-slate-400">Clear the date to simulate removing this deadline.</span>
                    </label>
                  ) : (
                    <label className="block text-xs font-semibold text-slate-600">
                      Proposed effort estimate (hours)
                      <input type="number" min="0.25" max="500" step="0.25" value={estimatedHours} onChange={(event) => setEstimatedHours(event.target.value)} className={`${inputClass} mt-1.5`} />
                    </label>
                  )}
                  {selectedTask && downstreamTasks.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">This task is upstream of {downstreamTasks.length} open task{downstreamTasks.length === 1 ? '' : 's'}</p>
                      <ul className="mt-2 space-y-1 text-xs text-amber-800">{downstreamTasks.slice(0, 5).map((task) => <li key={task._id} className="flex items-center gap-1.5"><LuArrowDown aria-hidden="true" className="h-3 w-3" />{task.title}</li>)}</ul>
                      {downstreamTasks.length > 5 && <p className="mt-1 text-[10px] text-amber-700">and {downstreamTasks.length - 5} more downstream tasks</p>}
                    </div>
                  )}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Baseline vs. scenario</h2>
                  <p className="mt-1 text-sm text-slate-500">Current plan compared with your proposed change in {targetScopeLabel}.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"><LuSparkles aria-hidden="true" className="h-3.5 w-3.5" />Nothing saved</span>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400"><th className="py-2">Signal</th><th className="py-2">Baseline</th><th className="py-2">Scenario</th><th className="py-2">Impact</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><th className="py-3 font-medium text-slate-700">Remaining effort</th><td className="py-3 text-slate-600">{hoursLabel(targetPlan.openHours)}</td><td className="py-3 text-slate-600">{hoursLabel(scenarioPlan.openHours)}</td><td className={`py-3 font-semibold ${estimateDelta > 0 ? 'text-amber-700' : estimateDelta < 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{estimateDelta > 0 ? '+' : ''}{hoursLabel(estimateDelta)}</td></tr>
                    <tr><th className="py-3 font-medium text-slate-700">Critical chain</th><td className="py-3 text-slate-600">{hoursLabel(targetPlan.criticalPath.hours)}</td><td className="py-3 text-slate-600">{hoursLabel(scenarioPlan.criticalPath.hours)}</td><td className={`py-3 font-semibold ${criticalDelta > 0 ? 'text-amber-700' : criticalDelta < 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{criticalDelta > 0 ? '+' : ''}{hoursLabel(criticalDelta)}</td></tr>
                    <tr><th className="py-3 font-medium text-slate-700">Blocked tasks</th><td className="py-3 text-slate-600">{targetPlan.blockedCount}</td><td className="py-3 text-slate-600">{scenarioPlan.blockedCount}</td><td className={`py-3 font-semibold ${scenarioPlan.blockedCount > targetPlan.blockedCount ? 'text-amber-700' : 'text-slate-400'}`}>{scenarioPlan.blockedCount - targetPlan.blockedCount > 0 ? '+' : ''}{scenarioPlan.blockedCount - targetPlan.blockedCount}</td></tr>
                    <tr><th className="py-3 font-medium text-slate-700">Risk signal</th><td className="py-3 text-slate-600">{targetPlan.riskScore}/100</td><td className="py-3 text-slate-600">{scenarioPlan.riskScore}/100</td><td className={`py-3 font-semibold ${riskDelta > 0 ? 'text-rose-700' : riskDelta < 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{riskDelta > 0 ? '+' : ''}{riskDelta}</td></tr>
                    <tr><th className="py-3 font-medium text-slate-700">Finish outlook</th><td className="py-3 text-xs text-slate-600">{baselineForecast.text}</td><td className="py-3 text-xs text-slate-600">{scenarioForecast.text}</td><td className="py-3 text-xs font-semibold text-slate-500">{forecastDeltaDays === null ? '—' : forecastDeltaDays > 0 ? `+${forecastDeltaDays} day(s)` : forecastDeltaDays < 0 ? `${forecastDeltaDays} day(s)` : 'No date shift'}</td></tr>
                  </tbody>
                </table>
              </div>
              {mode === 'add' && dependencies.length > 0 && (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">This proposed task would wait on {dependencies.length} prerequisite{dependencies.length === 1 ? '' : 's'}: {candidateTasks.filter((task) => dependencies.includes(task._id)).map((task) => task.title).join(', ')}.</p>
              )}
            </article>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900"><LuGitBranch aria-hidden="true" className="h-5 w-5 text-orange-800" />Scenario critical path</h2>
              <p className="mt-1 text-sm text-slate-500">The longest remaining dependency chain by estimated effort.</p>
              {criticalPathTitles.length === 0 ? <p className="mt-5 text-sm text-slate-500">No open work in this scenario.</p> : (
                <ol className="mt-5 space-y-2">
                  {criticalPathTitles.map((taskTitle, index) => <li key={`${index}-${taskTitle}`} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-orange-800">{index + 1}</span><span className="min-w-0 flex-1 text-sm font-medium text-slate-700">{taskTitle}</span>{index < criticalPathTitles.length - 1 && <LuArrowRight aria-hidden="true" className="h-4 w-4 text-slate-300" />}</li>)}
                </ol>
              )}
            </article>
            <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20 sm:p-6">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900"><LuShieldAlert aria-hidden="true" className="h-5 w-5 text-amber-700" />Decision notes</h2>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                {mode === 'change' && selectedTask && changeType === 'deadline' && selectedTask.dueDate && dueDate && (
                  <li>The selected task moves from {formatDateOnly(selectedTask.dueDate, { month: 'short', day: 'numeric' })} to {formatDateOnly(dueDate, { month: 'short', day: 'numeric' })}. Existing prerequisite links are preserved.</li>
                )}
                {estimateDelta > 0 && <li>This plan adds {hoursLabel(estimateDelta)} of remaining estimated effort. Confirm ownership and team capacity before committing.</li>}
                {scenarioPlan.blockedCount > targetPlan.blockedCount && <li>{scenarioPlan.blockedCount - targetPlan.blockedCount} additional task(s) would be blocked by incomplete prerequisites.</li>}
                {riskDelta > 0 && <li>The risk signal rises by {riskDelta} point(s); check deadline pressure and dependency blockers before accepting the change.</li>}
                {riskDelta <= 0 && estimateDelta <= 0 && <li>No increased effort or risk signal is detected from the current inputs. This is a planning aid, not a guarantee of delivery.</li>}
                <li>Baseline values use a snapshot of up to 2,000 accessible tasks in the selected scope. No other user’s workspace data is requested or changed.</li>
              </ul>
            </article>
          </section>

          <details className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">How to use the simulator and how its estimates work</summary>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <p>Choose a workspace, then simulate adding a task with prerequisites, moving an open task’s due date, or changing its effort estimate. The simulator recomputes remaining effort, blocked work, the longest dependency chain, risk signals, and the finish outlook.</p>
              <p>The finish outlook divides estimated remaining hours by the workspace’s completed estimated hours per day over the last 14 days. Without recent completion history it reports that limitation instead of guessing a date. Due dates are not treated as team capacity.</p>
              <p>This feature does not create, edit, assign, or delete any task. When you decide to proceed, use the normal task form to apply the change.</p>
            </div>
          </details>
        </>
      )}
    </div>
  );
};

export default ImpactSimulatorPage;
