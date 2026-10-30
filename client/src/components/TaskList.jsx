import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuCircleAlert, LuCheck, LuGitBranch, LuListChecks, LuPlus, LuX } from 'react-icons/lu';
import { useTasks } from '../hooks/useTasks.js';
import { projectAPI } from '../services/api.js';
import TaskForm from './TaskForm.jsx';
import { EmptyState, ErrorState, LoadingState, PageHeading, buttonPrimary, inputClass } from './WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const priorityStyles = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-amber-50 text-amber-800',
  urgent: 'bg-rose-50 text-rose-700',
};

const statusStyles = {
  todo: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-amber-50 text-amber-800',
  done: 'bg-emerald-50 text-emerald-700',
};

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
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [page, setPage] = useState(1);
  const selectPageRef = useRef(null);
  const search = searchParams.get('search') || '';
  const projectId = searchParams.get('projectId') || '';
  const showCreateForm = createFormOpen || searchParams.get('new') === '1';
  const selectedIdsOnPage = tasks.filter((task) => selectedTaskIds.includes(task._id)).map((task) => task._id);
  const allTasksOnPageSelected = tasks.length > 0 && selectedIdsOnPage.length === tasks.length;

  useEffect(() => {
    if (selectPageRef.current) {
      selectPageRef.current.indeterminate = selectedIdsOnPage.length > 0 && !allTasksOnPageSelected;
    }
  }, [selectedIdsOnPage.length, allTasksOnPageSelected]);

  useEffect(() => {
    projectAPI.getProjects()
      .then((response) => setProjects(response.data))
      .catch((requestError) => setProjectsError(requestError.response?.data?.message || 'Project list could not be loaded.'));
  }, []);

  useEffect(() => {
    fetchTasks({ ...filters, search, projectId, page });
  }, [fetchTasks, filters, search, projectId, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPage(1);
    setSelectedTaskIds([]);
    setFilters((current) => ({ ...current, [name]: value }));
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
    <div className="space-y-6 py-7 sm:py-9">
      <PageHeading
        eyebrow={projectId && projectId !== 'personal' ? 'Shared project' : 'Stay in control'}
        title={projectId === 'personal' ? 'Personal tasks' : projectId ? projects.find((project) => project._id === projectId)?.name || 'Project tasks' : 'My tasks'}
        description="Plan the work, set priorities, and keep everyone moving in the same direction."
        action={<button type="button" onClick={() => showCreateForm ? closeCreateForm() : setCreateFormOpen(true)} className={buttonPrimary}>{showCreateForm ? 'Close form' : <><LuPlus aria-hidden="true" className="h-4 w-4" />Create task</>}</button>}
      />

      {showCreateForm && <TaskForm onClose={closeCreateForm} onSaved={refreshTasks} defaultProjectId={projectId === 'personal' ? '' : projectId} />}

      <section aria-label="Task filters" className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/30 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Find the right work</h2>
            <p className="mt-1 text-xs text-slate-500">{loading ? 'Updating results...' : `${tasks.length} tasks on this page`}</p>
          </div>
          <button type="button" onClick={() => {
            setFilters({ status: '', priority: '', sort: 'createdAt', order: 'desc' });
            setPage(1);
            setSelectedTaskIds([]);
            setSearchParams({}, { replace: true });
          }} className="text-xs font-medium text-orange-700 hover:text-orange-800">Clear filters</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label className="text-xs font-semibold text-slate-600 xl:col-span-2">Search
            <input name="search" value={search} onChange={handleSearchChange} placeholder="Search title or description..." className={`${inputClass} mt-1.5 font-normal`} />
          </label>
          <label className="text-xs font-semibold text-slate-600">Workspace
            <select value={filters.projectId} onChange={(event) => {
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
            <select name="status" value={filters.status} onChange={handleFilterChange} className={`${inputClass} mt-1.5 font-normal`}>
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
        {projectsError && <p role="alert" className="mt-3 text-xs text-rose-600">{projectsError} <Link to="/projects" className="font-semibold underline">Manage projects</Link></p>}
      </section>

      {error && <ErrorState message={error} onRetry={refreshTasks} />}
      {loading && tasks.length === 0 ? <LoadingState label="Loading your tasks..." /> : error && tasks.length === 0 ? null : tasks.length === 0 ? (
        <EmptyState
          title={search || filters.status || filters.priority ? 'No tasks match these filters' : 'Ready when you are'}
          description={search || filters.status || filters.priority ? 'Try adjusting the filters or start fresh.' : 'Capture your first task and give your day some direction.'}
          action={<button type="button" onClick={() => setCreateFormOpen(true)} className={buttonPrimary}><LuPlus aria-hidden="true" className="h-4 w-4" />Create a task</button>}
        />
      ) : (
        <section aria-label="Task list" className="space-y-3">
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
            <span className="text-xs text-slate-500">{selectedTaskIds.length} selected across pages</span>
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
                <button type="button" onClick={() => setSelectedTaskIds([])} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                  <LuX aria-hidden="true" className="h-4 w-4" />Clear
                </button>
              </div>
            )}
          </div>
          {tasks.map((task) => (
            <article key={task._id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/20 transition hover:border-slate-300 hover:shadow-md sm:p-5">
              {editingTask?._id === task._id ? (
                <TaskForm task={task} onClose={() => setEditingTask(null)} onSaved={refreshTasks} />
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task._id)}
                    onChange={() => toggleTaskSelection(task._id)}
                    aria-label={`Select ${task.title}`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    aria-label={`Mark ${task.title} as ${task.status === 'done' ? 'not done' : 'complete'}`}
                    onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                    disabled={task.status !== 'done' && (task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done')}
                    title={task.status !== 'done' && (task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done') ? 'Complete prerequisite tasks first' : undefined}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      task.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-slate-300 hover:border-orange-600 hover:text-orange-600'
                    }`}
                  ><LuCheck aria-hidden="true" className="h-4 w-4" /></button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={`text-sm font-semibold sm:text-base ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusStyles[task.status] || statusStyles.todo}`}>{task.status.replace('-', ' ')}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${priorityStyles[task.priority] || priorityStyles.medium}`}>{task.priority || 'medium'}</span>
                    </div>
                    {task.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">{task.description}</p>}
                    {((task.dependsOn || []).length > 0 || task.blockingTaskCount > 0) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
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
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                      <span>{task.project?.name || 'Personal'}</span>
                      {task.project && <span>{task.assignee?.fullname || 'Unassigned'}</span>}
                      <span>{task.estimatedHours ?? 2}h estimate</span>
                      <span>{task.dueDate ? `Due ${formatDateOnly(task.dueDate, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No due date'}</span>
                      <label className="sr-only" htmlFor={`status-${task._id}`}>Task status</label>
                      <select id={`status-${task._id}`} value={task.status} onChange={(event) => handleStatusChange(task, event.target.value)} className="rounded border-0 bg-transparent p-0 text-xs text-slate-500 focus:ring-0">
                        <option value="todo">Move to: To do</option>
                        <option value="in-progress">Move to: In progress</option>
                        <option value="done" disabled={(task.dependsOn || []).some((dependency) => dependency && dependency.status !== 'done')}>Move to: Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:ml-3">
                    <button type="button" onClick={() => setEditingTask(task)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Edit</button>
                    <button type="button" onClick={() => handleDelete(task)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">Delete</button>
                  </div>
                </div>
              )}
            </article>
          ))}
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
        </section>
      )}
    </div>
  );
};

export default TaskList;
