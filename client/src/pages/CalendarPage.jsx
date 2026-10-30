import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuChevronLeft, LuChevronRight, LuPlus } from 'react-icons/lu';
import { taskAPI } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, buttonSecondary } from '../components/WorkspaceUI.jsx';

const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const statusClass = {
  todo: 'border-slate-200 bg-slate-50 text-slate-700',
  'in-progress': 'border-amber-200 bg-amber-50 text-amber-800',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const CalendarPage = () => {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const todayKey = dayKey(new Date());

  const start = useMemo(() => {
    const date = new Date(month.getFullYear(), month.getMonth(), 1);
    date.setDate(date.getDate() - date.getDay());
    return date;
  }, [month]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  }), [start]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const end = new Date(start);
      end.setDate(end.getDate() + 42);
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
  }, [start]);

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

  const changeMonth = (amount) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="py-7 sm:py-9">
      <PageHeading eyebrow="Plan with clarity" title="Calendar" description="A single view of personal and team deadlines, so nothing important slips through." />
      {error && <div className="mb-5"><ErrorState message={error} onRetry={loadTasks} /></div>}

      <section aria-label="Task calendar" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <h2 className="min-w-40 text-lg font-bold text-slate-900">{monthLabel}</h2>
            <button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className={`${buttonSecondary} px-3 py-2 text-xs`}>Today</button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"><LuChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
            <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"><LuChevronRight aria-hidden="true" className="h-4 w-4" /></button>
            <Link to="/tasks?new=1" className="ml-1 inline-flex items-center gap-1 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-800"><LuPlus aria-hidden="true" className="h-4 w-4" /> Add task</Link>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">{day}</div>)}
        </div>
        {loading ? <LoadingState label="Loading your deadlines..." /> : (
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = dayKey(day);
              const dayTasks = groupedTasks[key] || [];
              const inMonth = day.getMonth() === month.getMonth();
              return (
                <div key={key} className={`min-h-[112px] border-b border-r border-slate-100 p-1.5 sm:min-h-[145px] sm:p-2 ${inMonth ? 'bg-white' : 'bg-slate-50/60'}`}>
                  <div className="mb-1 flex justify-end">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      key === todayKey ? 'bg-orange-600 font-bold text-white' : inMonth ? 'text-slate-600' : 'text-slate-300'
                    }`}>{day.getDate()}</span>
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task) => (
                      <div key={task._id} title={`${task.title} · ${task.status}`} className={`group rounded-md border px-1.5 py-1 text-[10px] leading-4 sm:px-2 sm:text-xs ${statusClass[task.status] || statusClass.todo}`}>
                        <Link to={`/tasks${task.project?._id ? `?projectId=${task.project._id}` : ''}`} className={`block truncate font-medium ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</Link>
                        <select aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => changeStatus(task, event.target.value)} className="mt-0.5 w-full truncate border-0 bg-transparent p-0 text-[9px] capitalize leading-4 text-slate-500 focus:ring-0 sm:text-[10px]">
                          <option value="todo">To do</option>
                          <option value="in-progress">In progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    ))}
                    {dayTasks.length > 3 && <p className="px-1 text-[10px] font-medium text-slate-400">+{dayTasks.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      {!loading && !error && tasks.length === 0 && (
        <div className="mt-5">
          <EmptyState title="A clear calendar" description="Add due dates to your tasks and your schedule will take shape here." action={<Link to="/tasks?new=1" className="inline-flex rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">Create a task</Link>} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />To do</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" />In progress</span>
        <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Completed</span>
      </div>
    </div>
  );
};

export default CalendarPage;
