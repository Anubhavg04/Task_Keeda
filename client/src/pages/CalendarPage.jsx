import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuChevronLeft, LuChevronRight, LuPlus, LuX } from 'react-icons/lu';
import { taskAPI } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, buttonSecondary } from '../components/WorkspaceUI.jsx';
import { getTaskStatusVisual, taskStatusOrder } from '../utils/taskVisuals.js';
import { TaskPriorityIndicator, TaskStatusBadge } from '../components/TaskVisuals.jsx';
import { formatDateOnly } from '../utils/dates.js';

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const CalendarPage = () => {
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [view, setView] = useState('month');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const todayKey = dayKey(new Date());

  const start = useMemo(() => {
    const date = view === 'month'
      ? new Date(activeDate.getFullYear(), activeDate.getMonth(), 1)
      : new Date(activeDate);
    date.setDate(date.getDate() - date.getDay());
    return date;
  }, [activeDate, view]);
  const days = useMemo(() => Array.from({ length: view === 'month' ? 42 : 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  }), [start, view]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const end = new Date(start);
      end.setDate(end.getDate() + days.length);
      const response = await taskAPI.getTasks({
        from: `${dayKey(start)}T00:00:00.000Z`,
        to: `${dayKey(end)}T00:00:00.000Z`,
        limit: 100,
        sort: 'dueDate',
        order: 'asc',
      });
      const allTasks = [...response.data.tasks];
      for (let firstPage = 2; firstPage <= response.data.pagination.totalPages; firstPage += 10) {
        const pages = Array.from({ length: Math.min(10, response.data.pagination.totalPages - firstPage + 1) }, (_, index) => firstPage + index);
        const responses = await Promise.all(pages.map((page) => taskAPI.getTasks({
          from: `${dayKey(start)}T00:00:00.000Z`,
          to: `${dayKey(end)}T00:00:00.000Z`,
          limit: 100,
          page,
          sort: 'dueDate',
          order: 'asc',
        })));
        allTasks.push(...responses.flatMap((pageResponse) => pageResponse.data.tasks));
      }
      setTasks(allTasks.filter((task) => task.dueDate));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load calendar events.');
    } finally {
      setLoading(false);
    }
  }, [days.length, start]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const groupedTasks = useMemo(() => tasks.reduce((grouped, task) => {
    const key = String(task.dueDate).slice(0, 10);
    grouped[key] = [...(grouped[key] || []), task];
    return grouped;
  }, {}), [tasks]);

  const changeStatus = async (task, status) => {
    try {
      const response = await taskAPI.updateTask(task._id, { status });
      setTasks((current) => current.map((item) => item._id === task._id ? response.data : item));
      toast.success(status === 'done' ? 'Task completed' : 'Task status updated');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update task');
    }
  };

  const changePeriod = (amount) => {
    setSelectedTaskId('');
    setActiveDate((current) => view === 'month'
      ? new Date(current.getFullYear(), current.getMonth() + amount, 1)
      : new Date(current.getFullYear(), current.getMonth(), current.getDate() + amount * 7));
  };
  const goToToday = () => {
    setSelectedTaskId('');
    setActiveDate(new Date());
  };
  const monthLabel = activeDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekLabel = `${days[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const selectedTask = tasks.find((task) => task._id === selectedTaskId);
  const openTaskDetails = (taskId) => setSelectedTaskId((current) => current === taskId ? '' : taskId);

  return (
    <div className="py-7 sm:py-9">
      <PageHeading eyebrow="Plan with clarity" title="Calendar" description="A single view of personal and team deadlines, so nothing important slips through." />
      {error && <div className="mb-5"><ErrorState message={error} onRetry={loadTasks} /></div>}

      <section aria-label="Task calendar" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Calendar view">
              {['month', 'week'].map((option) => (
                <button key={option} type="button" aria-pressed={view === option} onClick={() => { setView(option); setSelectedTaskId(''); }} className={`min-h-9 rounded-md px-3 text-xs font-semibold capitalize transition ${view === option ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{option}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={goToToday} className={`${buttonSecondary} min-h-11 px-3 py-2 text-xs`}>Today</button>
              <button type="button" onClick={() => changePeriod(-1)} aria-label={view === 'month' ? 'Previous month' : 'Previous week'} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><LuChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
              <button type="button" onClick={() => changePeriod(1)} aria-label={view === 'month' ? 'Next month' : 'Next week'} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"><LuChevronRight aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-slate-900">{view === 'month' ? monthLabel : weekLabel}</h2>
            <Link to="/tasks?new=1" className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-800"><LuPlus aria-hidden="true" className="h-4 w-4" /> Add task</Link>
          </div>
        </div>

        {loading ? <LoadingState label="Loading your deadlines..." /> : (
          view === 'month' ? (
            <>
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{day}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const key = dayKey(day);
                  const dayTasks = groupedTasks[key] || [];
                  const inMonth = day.getMonth() === activeDate.getMonth();
                  return (
                    <div key={key} className={`min-h-[112px] border-b border-r border-slate-100 p-1.5 sm:min-h-[145px] sm:p-2 ${inMonth ? 'bg-white' : 'bg-slate-50/60'}`}>
                      <div className="mb-1 flex justify-end">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${key === todayKey ? 'bg-orange-600 font-bold text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'}`}>{day.getDate()}</span>
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task) => (
                          <button key={task._id} type="button" aria-haspopup="dialog" aria-expanded={selectedTaskId === task._id} onClick={() => openTaskDetails(task._id)} title={task.title} className={`flex w-full items-center gap-1 truncate rounded-md border-l-2 px-1.5 py-1 text-left text-[10px] leading-4 transition hover:ring-2 hover:ring-orange-200 sm:px-2 sm:text-xs ${getTaskStatusVisual(task.status).badge} ${task.status === 'done' ? 'border-l-emerald-600 line-through opacity-60' : task.status === 'in-progress' ? 'border-l-orange-600 font-medium' : 'border-l-slate-500 font-medium'}`}>
                            <span aria-label={`Status: ${getTaskStatusVisual(task.status).label}`} className={`h-1.5 w-1.5 shrink-0 rounded-full ${getTaskStatusVisual(task.status).dot}`} />
                            <span className="min-w-0 flex-1 truncate">{task.title}</span>
                            <TaskPriorityIndicator priority={task.priority} compact />
                          </button>
                        ))}
                        {dayTasks.length > 3 && <p className="px-1 text-[10px] font-medium text-slate-400">+{dayTasks.length - 3} more</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="divide-y divide-slate-100">
              {days.map((day) => {
                const key = dayKey(day);
                const dayTasks = groupedTasks[key] || [];
                return (
                  <section key={key} className={`grid gap-3 p-4 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-5 sm:px-6 ${key === todayKey ? 'bg-orange-50/40' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 sm:block">
                      <span className={`text-sm font-semibold ${key === todayKey ? 'text-orange-800' : 'text-slate-800'}`}>{day.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                      <span className="text-xs text-slate-500">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      {key === todayKey && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 sm:ml-0 sm:mt-2 sm:inline-flex">Today</span>}
                    </div>
                    {dayTasks.length ? (
                      <div className="space-y-2">
                        {dayTasks.map((task) => (
                          <button key={task._id} type="button" aria-haspopup="dialog" aria-expanded={selectedTaskId === task._id} onClick={() => openTaskDetails(task._id)} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-l-2 px-3 py-2 text-left text-sm transition hover:border-orange-200 hover:bg-orange-50/50 ${getTaskStatusVisual(task.status).badge} ${task.status === 'done' ? 'border-l-emerald-600' : task.status === 'in-progress' ? 'border-l-orange-600' : 'border-l-slate-500'}`}>
                            <span className={`min-w-0 truncate font-medium ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</span>
                            <span className="flex shrink-0 items-center gap-2">
                              <TaskStatusBadge status={task.status} />
                              <TaskPriorityIndicator priority={task.priority} compact />
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : <p className="py-1 text-sm text-slate-400">No tasks due</p>}
                  </section>
                );
              })}
            </div>
          )
        )}
      </section>
      {selectedTask && (
        <div role="dialog" aria-label={`${selectedTask.title} task details`} className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/15">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-900">{selectedTask.title}</h2>
              <p className="mt-1 text-xs text-slate-500">{selectedTask.project?.name || 'Personal task'}</p>
            </div>
            <button type="button" onClick={() => setSelectedTaskId('')} aria-label="Close task details" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><LuX aria-hidden="true" className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <span className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={selectedTask.status} />
              <TaskPriorityIndicator priority={selectedTask.priority} />
            </span>
            <span className="text-xs text-slate-500">Due {formatDateOnly(selectedTask.dueDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <label className="mt-3 block text-xs font-medium text-slate-500">
            Update status
            <select aria-label={`Change status for ${selectedTask.title}`} value={selectedTask.status} onChange={(event) => changeStatus(selectedTask, event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50">
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>
      )}
      {!loading && !error && tasks.length === 0 && (
        <div className="mt-5">
          <EmptyState title="A clear calendar" description="Add due dates to your tasks and your schedule will take shape here." action={<Link to="/tasks?new=1" className="inline-flex rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">Create a task</Link>} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        {taskStatusOrder.map((status) => <TaskStatusBadge key={status} status={status} />)}
      </div>
    </div>
  );
};

export default CalendarPage;
