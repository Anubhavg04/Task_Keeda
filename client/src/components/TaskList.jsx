import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCalendarDays, LuCircleAlert, LuCheck, LuEllipsis, LuGitBranch, LuListChecks, LuListTodo, LuMessageCircle, LuPencil, LuPlus, LuX } from 'react-icons/lu';
import { useTasks } from '../hooks/useTasks.js';
import { projectAPI } from '../services/api.js';
import DiscussionThread from './DiscussionThread.jsx';
import TaskBoard from './TaskBoard.jsx';
import TaskForm from './TaskForm.jsx';
import { getTaskStatusVisual } from '../utils/taskVisuals.js';
import { TaskPriorityIndicator, TaskStatusBadge } from './TaskVisuals.jsx';
import { EmptyState, ErrorState, metaTextClass, PageHeading, sectionHeadingClass, TasksListSkeleton, taskTitleClass, buttonPrimary, inputClass } from './WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const TaskList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, loading, error, pagination, fetchTasks, updateTask, bulkUpdateTasks, deleteTask } = useTasks();
  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    sort: 'createdAt',
    order: 'desc',
  });
  const [editingTask, setEditingTask] = useState(null);
  const [discussionTaskId, setDiscussionTaskId] = useState('');
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [statusAnimationTaskId, setStatusAnimationTaskId] = useState('');
  const [page, setPage] = useState(1);
  const selectPageRef = useRef(null);
  const statusAnimationTimeoutRef = useRef(null);
  const search = searchParams.get('search') || '';
  const projectId = searchParams.get('projectId') || '';
  const showCreateForm = createFormOpen || searchParams.get('new') === '1';
  const requestedDiscussionTaskId = searchParams.get('discussionTaskId');
  const activeDiscussionTaskId = tasks.some((task) => task._id === requestedDiscussionTaskId)
    ? requestedDiscussionTaskId
    : discussionTaskId;
  const selectedIdsOnPage = tasks.filter((task) => selectedTaskIds.includes(task._id)).map((task) => task._id);
  const allTasksOnPageSelected = tasks.length > 0 && selectedIdsOnPage.length === tasks.length;
  const hasTaskFilters = Boolean(search || filters.status || filters.priority || projectId);

  useEffect(() => {
    if (selectPageRef.current) {
      selectPageRef.current.indeterminate = selectedIdsOnPage.length > 0 && !allTasksOnPageSelected;
    }
  }, [selectedIdsOnPage.length, allTasksOnPageSelected]);

  useEffect(() => () => {
    if (statusAnimationTimeoutRef.current) window.clearTimeout(statusAnimationTimeoutRef.current);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
      setProjectsError('');
    } catch (requestError) {
      setProjectsError(requestError.response?.data?.message || 'Project list could not be loaded.');
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadProjects);
  }, [loadProjects]);

  useEffect(() => {
    fetchTasks({ ...filters, search, projectId, page });
  }, [fetchTasks, filters, search, projectId, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPage(1);
    setSelectedTaskIds([]);
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleViewChange = (nextView) => {
    setViewMode(nextView);
    setSelectedTaskIds([]);
    if (nextView === 'board') {
      setPage(1);
      setFilters((current) => ({ ...current, status: '' }));
    }
  };

  const handleSearchChange = (event) => {
    const next = new URLSearchParams(searchParams);
    if (event.target.value) next.set('search', event.target.value);
    else next.delete('search');
    setPage(1);
    setSelectedTaskIds([]);
    setSearchParams(next, { replace: true });
  };

  const closeCreateForm = () => {
    setCreateFormOpen(false);
    if (searchParams.has('new')) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  };

  const refreshTasks = () => fetchTasks({ ...filters, search, projectId, page });

  const animateStatusChange = (taskId) => {
    setStatusAnimationTaskId(taskId);
    if (statusAnimationTimeoutRef.current) window.clearTimeout(statusAnimationTimeoutRef.current);
    statusAnimationTimeoutRef.current = window.setTimeout(() => {
      setStatusAnimationTaskId('');
      statusAnimationTimeoutRef.current = null;
    }, 500);
  };

  const toggleDiscussion = (taskId) => {
    const isOpen = activeDiscussionTaskId === taskId;
    if (requestedDiscussionTaskId === taskId) {
      const next = new URLSearchParams(searchParams);
      next.delete('discussionTaskId');
      setSearchParams(next, { replace: true });
    }
    setDiscussionTaskId(isOpen ? '' : taskId);
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone. Any dependency links pointing to it will also be removed.`)) return;
    try {
      await deleteTask(task._id);
      setSelectedTaskIds((current) => current.filter((id) => id !== task._id));
      if (tasks.length === 1 && page > 1) setPage((current) => current - 1);
      else await refreshTasks();
      toast.success('Task deleted');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete the task');
    }
  };

  const handleStatusChange = async (task, status) => {
    try {
      await updateTask(task._id, { status });
      animateStatusChange(task._id);
      await refreshTasks();
      toast.success(status === 'done' ? 'Task completed' : 'Task status updated');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update task');
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds((current) => {
      if (current.includes(taskId)) return current.filter((id) => id !== taskId);
      if (current.length >= 100) {
        toast.error('Bulk updates are limited to 100 tasks at a time');
        return current;
      }
      return [...current, taskId];
    });
  };

  const togglePageSelection = () => {
    if (allTasksOnPageSelected) {
      setSelectedTaskIds((current) => current.filter((id) => !selectedIdsOnPage.includes(id)));
      return;
    }
    const newIds = tasks.map((task) => task._id).filter((id) => !selectedTaskIds.includes(id));
    if (selectedTaskIds.length + newIds.length > 100) {
      toast.error('Bulk updates are limited to 100 tasks at a time');
      return;
    }
    setSelectedTaskIds((current) => [...current, ...newIds]);
  };

  const handleBulkUpdate = async () => {
    const updates = {};
    if (bulkStatus) updates.status = bulkStatus;
    if (bulkPriority) updates.priority = bulkPriority;
    if (!selectedTaskIds.length || !Object.keys(updates).length) return;

    try {
      const response = await bulkUpdateTasks(selectedTaskIds, updates);
      toast.success(`Updated ${response.updatedCount} ${response.updatedCount === 1 ? 'task' : 'tasks'}`);
      setSelectedTaskIds([]);
      setBulkStatus('');
      setBulkPriority('');
      await refreshTasks();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update selected tasks');
    }
  };

  return (
    <div className="space-y-5 py-6 sm:py-8">
      <PageHeading
        eyebrow={projectId && projectId !== 'personal' ? 'Shared project' : 'Stay in control'}
        title={projectId === 'personal' ? 'Personal tasks' : projectId ? projects.find((project) => project._id === projectId)?.name || 'Project tasks' : 'My tasks'}
        description="Plan the work, set priorities, and keep everyone moving in the same direction."
        action={<button type="button" onClick={() => showCreateForm ? closeCreateForm() : setCreateFormOpen(true)} className={`${buttonPrimary} min-h-11 w-full md:w-auto`}>{showCreateForm ? 'Close form' : <><LuPlus aria-hidden="true" className="h-4 w-4" />Create task</>}</button>}
      />

      {showCreateForm && <TaskForm onClose={closeCreateForm} onSaved={refreshTasks} defaultProjectId={projectId === 'personal' ? '' : projectId} />}

      <section aria-label="Task filters" className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className={sectionHeadingClass}>Find the right work</h2>
            <p className={`mt-0.5 ${metaTextClass}`}>{loading ? 'Updating results...' : `${tasks.length} tasks on this page`}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Task view">
              {['list', 'board'].map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={viewMode === option}
                  onClick={() => handleViewChange(option)}
                  className={`min-h-9 rounded-md px-3 text-xs font-semibold capitalize transition ${viewMode === option ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {option === 'list' ? 'List' : 'Board'}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => {
              setFilters({ status: '', priority: '', sort: 'createdAt', order: 'desc' });
              setPage(1);
              setSelectedTaskIds([]);
              setSearchParams({}, { replace: true });
            }} className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-orange-700 hover:text-orange-800 md:min-h-0 md:px-0">Clear filters</button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Search
            <input name="search" value={search} onChange={handleSearchChange} placeholder="Search title or description..." className={`${inputClass} mt-1.5 font-normal`} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Workspace
            <select value={projectId} onChange={(event) => {
              const next = new URLSearchParams(searchParams);
              if (event.target.value) next.set('projectId', event.target.value);
              else next.delete('projectId');
              setPage(1);
              setSelectedTaskIds([]);
              setSearchParams(next);
            }} className={`${inputClass} mt-1.5 font-normal`}>
              <option value="">All work</option>
              <option value="personal">Personal tasks only</option>
              {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Status
            <select name="status" value={filters.status} onChange={handleFilterChange} disabled={viewMode === 'board'} className={`${inputClass} mt-1.5 font-normal disabled:cursor-not-allowed disabled:opacity-60`}>
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Completed</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Priority
            <select name="priority" value={filters.priority} onChange={handleFilterChange} className={`${inputClass} mt-1.5 font-normal`}>
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Sort by
            <select name="sort" value={filters.sort} onChange={handleFilterChange} className={`${inputClass} mt-1.5 font-normal`}>
              <option value="createdAt">Created date</option>
              <option value="updatedAt">Recently updated</option>
              <option value="dueDate">Due date</option>
              <option value="title">Title</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">Order
            <select name="order" value={filters.order} onChange={handleFilterChange} className={`${inputClass} mt-1.5 font-normal`}>
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </label>
        </div>
        {projectsError && <div className="mt-3"><ErrorState message={projectsError} onRetry={loadProjects} /> <Link to="/projects" className="mt-2 inline-block text-xs font-semibold text-orange-800 underline">Manage projects</Link></div>}
      </section>

      {error && <ErrorState message={error} onRetry={refreshTasks} />}
      {loading && tasks.length === 0 ? <TasksListSkeleton /> : error && tasks.length === 0 ? null : tasks.length === 0 ? (
        <EmptyState
          title={hasTaskFilters ? 'No tasks match these filters' : 'No tasks yet'}
          description={hasTaskFilters ? 'Try adjusting the filters or start fresh.' : 'Capture your first task and give your day some direction.'}
          icon={LuListTodo}
          action={<button type="button" onClick={() => setCreateFormOpen(true)} className={buttonPrimary}><LuPlus aria-hidden="true" className="h-4 w-4" />{hasTaskFilters ? 'Create a task' : 'Create your first task'}</button>}
        />
      ) : (
        <>
          {viewMode === 'board' ? (
            <TaskBoard
              tasks={tasks}
              onStatusChange={handleStatusChange}
              editingTask={editingTask}
              statusAnimationTaskId={statusAnimationTaskId}
              onEdit={setEditingTask}
              onCloseEdit={() => setEditingTask(null)}
              onSaved={refreshTasks}
            />
          ) : (
            <section aria-label="Task list" className="space-y-2.5">
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
            <label className="flex shrink-0 items-center gap-2 px-1 text-xs font-medium text-slate-600">
              <input
                ref={selectPageRef}
                type="checkbox"
                checked={allTasksOnPageSelected}
                onChange={togglePageSelection}
                aria-label={allTasksOnPageSelected ? 'Deselect all tasks on this page' : 'Select all tasks on this page'}
                className="h-4 w-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
              />
              Select page
            </label>
            <span className="inline-flex min-h-11 items-center text-xs text-slate-500 md:min-h-0">{selectedTaskIds.length} selected across pages</span>
            {selectedTaskIds.length > 0 && (
              <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
                <label className="sr-only" htmlFor="bulk-status">Set selected task status</label>
                <select id="bulk-status" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} className="min-w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50">
                  <option value="">Set status...</option>
                  <option value="todo">To do</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Completed</option>
                </select>
                <label className="sr-only" htmlFor="bulk-priority">Set selected task priority</label>
                <select id="bulk-priority" value={bulkPriority} onChange={(event) => setBulkPriority(event.target.value)} className="min-w-32 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50">
                  <option value="">Set priority...</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button type="button" onClick={handleBulkUpdate} disabled={loading || (!bulkStatus && !bulkPriority)} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <LuListChecks aria-hidden="true" className="h-4 w-4" />Apply
                </button>
                <button type="button" onClick={() => setSelectedTaskIds([])} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:min-h-0">
                  <LuX aria-hidden="true" className="h-4 w-4" />Clear
                </button>
              </div>
            )}
          </div>
          {tasks.map((task) => (
            <article key={task._id} className={`group rounded-xl border border-slate-200/80 border-l-2 bg-white p-3 shadow-sm shadow-slate-200/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-50/30 hover:shadow-md hover:shadow-slate-300/40 motion-reduce:transform-none ${task.status === 'done' ? 'border-l-emerald-600' : task.status === 'in-progress' ? 'border-l-orange-600' : 'border-l-slate-500'} ${statusAnimationTaskId === task._id ? 'task-status-pop' : ''}`}>
              {editingTask?._id === task._id ? (
                <TaskForm task={task} onClose={() => setEditingTask(null)} onSaved={refreshTasks} />
              ) : (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 md:flex md:items-start md:gap-3">
                  <div className="flex shrink-0 items-center gap-1">
                    <label className="flex h-11 w-11 items-center justify-start" title={`Select ${task.title}`}>
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task._id)}
                        onChange={() => toggleTaskSelection(task._id)}
                        aria-label={`Select ${task.title}`}
                        className="h-4 w-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
                      />
                    </label>
                    <span aria-label={`Status: ${getTaskStatusVisual(task.status).label}`} title={`Status: ${getTaskStatusVisual(task.status).label}`} className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white ${getTaskStatusVisual(task.status).dot}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className={`min-w-0 max-w-full truncate ${taskTitleClass} ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h2>
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityIndicator priority={task.priority} />
                    </div>
                    <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 ${metaTextClass}`}>
                      <span className="max-w-40 truncate font-medium text-slate-600">{task.project?.name || 'Personal'}</span>
                      <span className="inline-flex items-center gap-1.5" aria-label={task.assignee?.fullname ? `Assigned to ${task.assignee.fullname}` : 'Unassigned'}>
                        <span title={task.assignee?.fullname || 'Unassigned'} className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${task.assignee?.fullname ? 'bg-orange-100 text-orange-800' : 'border border-dashed border-slate-300 bg-slate-50 text-slate-400'}`}>
                          {task.assignee?.fullname
                            ? task.assignee.fullname.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
                            : '?'}
                        </span>
                        <span className="max-w-28 truncate">{task.assignee?.fullname || 'Unassigned'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <LuCalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
                        {task.dueDate ? formatDateOnly(task.dueDate, { month: 'short', day: 'numeric' }) : 'No due date'}
                      </span>
                      <span className="whitespace-nowrap text-slate-400">{task.estimatedHours ?? 2}h</span>
                    </div>
                    {task.description && <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-slate-500">{task.description}</p>}
                    {((task.dependsOn || []).length > 0 || task.blockingTaskCount > 0) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {(task.dependsOn || []).filter((dependency) => dependency && dependency.status !== 'done').map((dependency) => (
                          <span key={dependency._id} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-800">
                            <LuCircleAlert aria-hidden="true" className="h-3 w-3 shrink-0" />
                            Blocked by <span className="max-w-40 truncate">{dependency.title}</span>
                          </span>
                        ))}
                        {(task.dependsOn || []).filter((dependency) => dependency && dependency.status === 'done').length > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                            <LuGitBranch aria-hidden="true" className="h-3 w-3" />
                            {(task.dependsOn || []).filter((dependency) => dependency && dependency.status === 'done').length} prerequisite{(task.dependsOn || []).filter((dependency) => dependency && dependency.status === 'done').length === 1 ? '' : 's'} complete
                          </span>
                        )}
                        {task.blockingTaskCount > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                            <LuGitBranch aria-hidden="true" className="h-3 w-3" />
                            Blocking {task.blockingTaskCount} open task{task.blockingTaskCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-start-2 flex shrink-0 items-center gap-0.5 justify-self-end opacity-100 transition-opacity md:ml-auto md:justify-self-auto md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => { setDiscussionTaskId(''); setEditingTask(task); }}
                      aria-label={`Edit ${task.title}`}
                      title="Edit task"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-orange-800 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
                    ><LuPencil aria-hidden="true" className="h-4 w-4" /></button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                      disabled={task.status !== 'done' && (task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done')}
                      aria-label={task.status === 'done' ? `Reopen ${task.title}` : `Complete ${task.title}`}
                      title={task.status !== 'done' && (task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done') ? 'Complete prerequisite tasks first' : task.status === 'done' ? 'Reopen task' : 'Complete task'}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition hover:scale-105 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-40 ${task.status === 'done' ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-500 hover:bg-white hover:text-emerald-700'}`}
                    ><LuCheck aria-hidden="true" className="h-4 w-4" /></button>
                    <details className="relative">
                      <summary aria-label={`More actions for ${task.title}`} title="More actions" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600 [&::-webkit-details-marker]:hidden">
                        <LuEllipsis aria-hidden="true" className="h-5 w-5" />
                      </summary>
                      <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <label htmlFor={`status-${task._id}`} className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Change status</label>
                        <select id={`status-${task._id}`} value={task.status} onChange={(event) => handleStatusChange(task, event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border-0 bg-slate-50 px-2 text-xs text-slate-700 focus:ring-2 focus:ring-orange-200">
                          <option value="todo">To do</option>
                          <option value="in-progress">In progress</option>
                          <option value="done" disabled={(task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done')}>Completed</option>
                        </select>
                        {task.project && <button type="button" onClick={() => toggleDiscussion(task._id)} aria-expanded={activeDiscussionTaskId === task._id} className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-800"><LuMessageCircle aria-hidden="true" className="h-4 w-4" />Discuss</button>}
                        <button type="button" onClick={() => handleDelete(task)} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-xs font-medium text-rose-600 transition hover:bg-rose-50"><LuX aria-hidden="true" className="h-4 w-4" />Delete task</button>
                      </div>
                    </details>
                  </div>
                </div>
              )}
              {activeDiscussionTaskId === task._id && task.project && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <DiscussionThread
                    projectId={task.project._id}
                    taskId={task._id}
                    title="Task discussion"
                    projectOwnerId={projects.find((project) => project._id === task.project._id)?.owner?._id}
                    members={[
                      projects.find((project) => project._id === task.project._id)?.owner,
                      ...(projects.find((project) => project._id === task.project._id)?.members || []),
                    ].filter(Boolean)}
                  />
                </div>
              )}
            </article>
          ))}
            </section>
          )}
          {pagination.totalPages > 1 && (
            <nav aria-label="Task pages" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs text-slate-500">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1}–{Math.min(pagination.currentPage * pagination.limit, pagination.totalTasks)} of {pagination.totalTasks}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                <span className="text-xs text-slate-500">{pagination.currentPage} / {pagination.totalPages}</span>
                <button type="button" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;
