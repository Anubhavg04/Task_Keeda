import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartNoAxesColumn,
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuCircleCheck,
  LuClock3,
  LuFileText,
  LuFolderKanban,
  LuLayoutDashboard,
  LuListTodo,
  LuNotebookPen,
  LuPause,
  LuPlay,
  LuPlus,
  LuSearch,
  LuRotateCcw,
  LuTarget,
  LuUsersRound,
} from 'react-icons/lu';

const navigation = [
  { label: 'Overview', path: '/', icon: LuLayoutDashboard },
  { label: 'Tasks', path: '/tasks', icon: LuListTodo },
  { label: 'Projects', path: '/projects', icon: LuFolderKanban },
  { label: 'Calendar', path: '/calendar', icon: LuCalendarDays },
  { label: 'Notes', path: '/notes', icon: LuNotebookPen },
  { label: 'Reports', path: '/reports', icon: LuChartNoAxesColumn },
];

const demoProjects = [
  { name: 'Customer portal', type: 'Product', color: 'bg-orange-500', members: ['A', 'J', 'M'], description: 'A smoother home for every customer.' },
  { name: 'Spring campaign', type: 'Marketing', color: 'bg-emerald-500', members: ['S', 'A'], description: 'Launch planning, content, and creative.' },
  { name: 'Studio operations', type: 'Operations', color: 'bg-blue-500', members: ['M', 'J', 'S'], description: 'The systems that keep good work moving.' },
];

const makeDate = (offset) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const demoTasks = [
  { title: 'Review the customer interview notes', project: 'Customer portal', status: 'In progress', priority: 'High', due: makeDate(0), assignee: 'Alex' },
  { title: 'Share the updated project brief', project: 'Customer portal', status: 'Done', priority: 'Medium', due: makeDate(-1), assignee: 'Jamie' },
  { title: 'Approve campaign landing page', project: 'Spring campaign', status: 'To do', priority: 'High', due: makeDate(2), assignee: 'Sam' },
  { title: 'Map the onboarding emails', project: 'Spring campaign', status: 'In progress', priority: 'Medium', due: makeDate(4), assignee: 'Alex' },
  { title: 'Document weekly handoff steps', project: 'Studio operations', status: 'To do', priority: 'Low', due: makeDate(6), assignee: 'Morgan' },
  { title: 'Prepare next sprint priorities', project: 'Customer portal', status: 'To do', priority: 'Medium', due: makeDate(8), assignee: 'Jamie' },
  { title: 'Collect launch feedback', project: 'Spring campaign', status: 'Done', priority: 'Low', due: makeDate(-3), assignee: 'Sam' },
];

const demoNotes = [
  { title: 'Customer portal kickoff', project: 'Customer portal', updated: 'Updated today', content: 'Keep the first release focused on a clear account overview and fewer support handoffs.' },
  { title: 'Campaign voice and tone', project: 'Spring campaign', updated: 'Updated yesterday', content: 'Warm, useful, and direct. Lead with the customer outcome, not the feature list.' },
  { title: 'Weekly team rhythm', project: 'Studio operations', updated: 'Updated this week', content: 'Share priorities on Monday, protect focus time, and close the loop before Friday.' },
];

const statusClass = {
  'To do': 'bg-slate-100 text-slate-600',
  'In progress': 'bg-amber-50 text-amber-800',
  Done: 'bg-emerald-50 text-emerald-700',
};

const dateLabel = (date, options = { month: 'short', day: 'numeric' }) => date.toLocaleDateString(undefined, options);

const DemoMetric = ({ label, value, caption, icon, tone }) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{React.createElement(icon, { 'aria-hidden': true, className: 'h-5 w-5' })}</span>
    </div>
    <p className="mt-3 text-xs leading-5 text-slate-500">{caption}</p>
  </article>
);

const JoinCard = ({ title = 'Ready to make this workspace yours?', description = 'Create an account to add your work, invite your team, and keep everything in sync.' }) => (
  <aside className="flex flex-col gap-4 rounded-2xl bg-[#1e2b25] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">Like what you see?</p>
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
    </div>
    <Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-500">
      Create your account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  </aside>
);

const DemoTaskRow = ({ task }) => (
  <li className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-0 sm:px-5">
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-700' : task.status === 'In progress' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
      {task.status === 'Done' ? <LuCheck aria-hidden="true" className="h-4 w-4" /> : task.status === 'In progress' ? <LuClock3 aria-hidden="true" className="h-4 w-4" /> : <LuCircleCheck aria-hidden="true" className="h-4 w-4" />}
    </span>
    <div className="min-w-0 flex-1">
      <p className={`truncate text-sm font-medium ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
      <p className="mt-1 truncate text-xs text-slate-500">{task.project} · {task.assignee}</p>
    </div>
    <span className="hidden text-xs text-slate-500 sm:block">{dateLabel(task.due)}</span>
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass[task.status]}`}>{task.status}</span>
  </li>
);

const ProjectCard = ({ project }) => (
  <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20">
    <div className="flex items-center justify-between">
      <span className={`h-3 w-3 rounded-full ${project.color}`} />
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{project.type}</span>
    </div>
    <h3 className="mt-4 font-semibold text-slate-900">{project.name}</h3>
    <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{project.description}</p>
    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
      <span className="text-xs text-slate-500">Shared with your team</span>
      <div className="flex -space-x-2">
        {project.members.map((member, index) => <span key={`${member}-${index}`} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-[10px] font-bold text-orange-800">{member}</span>)}
      </div>
    </div>
  </article>
);

const FocusSprint = () => {
  const [duration, setDuration] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [selectedTask, setSelectedTask] = useState(demoTasks.find((task) => task.status !== 'Done')?.title || '');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running || secondsRemaining <= 0) return undefined;
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [running, secondsRemaining]);

  const setSprintDuration = (nextDuration) => {
    setDuration(nextDuration);
    setSecondsRemaining(nextDuration * 60);
    setRunning(false);
  };
  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, '0');
  const seconds = String(secondsRemaining % 60).padStart(2, '0');
  const progress = ((duration * 60 - secondsRemaining) / (duration * 60)) * 100;
  const sprintComplete = secondsRemaining === 0;
  const sprintRunning = running && secondsRemaining > 0;

  const toggleSprint = () => {
    if (sprintRunning) {
      setRunning(false);
      return;
    }
    if (secondsRemaining === 0) setSecondsRemaining(duration * 60);
    setRunning(true);
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><LuTarget aria-hidden="true" className="h-4 w-4 text-orange-700" />Focus sprint</div>
          <p className="mt-1 text-xs text-slate-500">Give one important task your full attention.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Try it now</span>
      </div>
      <label className="mt-4 block text-xs font-medium text-slate-500">
        Focus on
        <select value={selectedTask} onChange={(event) => setSelectedTask(event.target.value)} disabled={running} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 disabled:bg-slate-50">
          {demoTasks.filter((task) => task.status !== 'Done').map((task) => <option key={task.title} value={task.title}>{task.title}</option>)}
        </select>
      </label>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div aria-live="polite">
          <p className="font-mono text-4xl font-semibold tracking-tight text-slate-900">{minutes}:{seconds}</p>
          <p className="mt-1 text-xs text-slate-500">{sprintComplete ? 'Sprint complete. Nice work.' : sprintRunning ? 'One thing at a time.' : 'Pick a pace and get started.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleSprint} aria-label={sprintRunning ? 'Pause focus sprint' : 'Start focus sprint'} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-700 text-white transition hover:bg-orange-800">
            {sprintRunning ? <LuPause aria-hidden="true" className="h-4 w-4" /> : <LuPlay aria-hidden="true" className="h-4 w-4" />}
          </button>
          <button type="button" onClick={() => { setSecondsRemaining(duration * 60); setRunning(false); }} aria-label="Reset focus sprint" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50">
            <LuRotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-600 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
      <div className="mt-3 flex items-center gap-2" aria-label="Focus sprint length">
        {[15, 25, 45].map((option) => (
          <button type="button" key={option} onClick={() => setSprintDuration(option)} disabled={running} aria-pressed={duration === option} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${duration === option ? 'bg-orange-50 text-orange-800' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'}`}>{option} min</button>
        ))}
        <Link to="/register" className="ml-auto text-[11px] font-semibold text-orange-800 hover:text-orange-950">Save your progress</Link>
      </div>
    </article>
  );
};

const Dashboard = () => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DemoMetric label="Open tasks" value="5" caption="Across your active work" icon={LuListTodo} tone="bg-orange-50 text-orange-800" />
      <DemoMetric label="Completed" value="2" caption="Good progress this week" icon={LuCircleCheck} tone="bg-emerald-50 text-emerald-700" />
      <DemoMetric label="Due this week" value="4" caption="Your next few milestones" icon={LuCalendarDays} tone="bg-blue-50 text-blue-700" />
      <DemoMetric label="Projects" value="3" caption="Shared spaces for focused work" icon={LuFolderKanban} tone="bg-amber-50 text-amber-700" />
    </div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/20">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h2 className="font-semibold text-slate-900">Recently updated</h2><p className="mt-1 text-xs text-slate-500">A glimpse of the work in this workspace</p></div>
          <Link to="/tasks" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-800">All tasks <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <ul>{demoTasks.slice(0, 4).map((task) => <DemoTaskRow key={task.title} task={task} />)}</ul>
      </article>
      <div className="space-y-5">
        <FocusSprint />
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Teamwork, in one place</h2><p className="mt-1 text-xs text-slate-500">Projects bring the details together</p></div><LuUsersRound aria-hidden="true" className="h-5 w-5 text-orange-700" /></div>
          <div className="mt-4 space-y-3">{demoProjects.slice(0, 2).map((project) => <div key={project.name} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${project.color}`} /><span className="flex-1 truncate text-sm font-medium text-slate-700">{project.name}</span><span className="text-xs text-slate-400">{project.members.length} people</span></div>)}</div>
        </article>
        <JoinCard title="Ready to get your work moving?" description="Sign up to create tasks, build shared projects, and collaborate with your team." />
      </div>
    </div>
  </div>
);

const TasksView = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const filteredTasks = demoTasks.filter((task) => (
    (!status || task.status === status)
    && (!query || `${task.title} ${task.project} ${task.assignee}`.toLowerCase().includes(query.toLowerCase()))
  ));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search demo tasks</span>
          <LuSearch aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sample tasks..." className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50" />
        </label>
        <label>
          <span className="sr-only">Filter tasks by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 sm:w-44">
            <option value="">All statuses</option><option>To do</option><option>In progress</option><option>Done</option>
          </select>
        </label>
        <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white"><LuPlus aria-hidden="true" className="h-4 w-4" />Create task</Link>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Sample tasks</h2><p className="mt-1 text-xs text-slate-500">Filter and explore the demo data. Sign up to manage your own.</p></div>
        {filteredTasks.length ? <ul>{filteredTasks.map((task) => <DemoTaskRow key={task.title} task={task} />)}</ul> : <p className="px-5 py-10 text-center text-sm text-slate-500">No sample tasks match that search.</p>}
      </div>
      <JoinCard title="Put your own work in motion." />
    </div>
  );
};

const ProjectsView = () => (
  <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{demoProjects.map((project) => <ProjectCard key={project.name} project={project} />)}</div>
    <JoinCard title="Bring your people and projects together." description="Create your account to start a shared project, invite teammates, and keep tasks and notes connected." />
  </div>
);

const NotesView = () => {
  const [query, setQuery] = useState('');
  const notes = demoNotes.filter((note) => `${note.title} ${note.content} ${note.project}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-5">
      <label className="relative block max-w-xl">
        <span className="sr-only">Search sample notes</span>
        <LuSearch aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search decisions, ideas, and notes..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50" />
      </label>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.map((note) => (
          <article key={note.title} className="flex min-h-52 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-medium text-orange-800"><LuFileText aria-hidden="true" className="h-4 w-4" />{note.project}</div>
            <h2 className="mt-4 font-semibold text-slate-900">{note.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{note.content}</p>
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{note.updated}</p>
          </article>
        ))}
        {!notes.length && <p className="text-sm text-slate-500">No sample notes match that search.</p>}
      </div>
      <JoinCard title="Keep your team's knowledge close to the work." />
    </div>
  );
};

const CalendarView = () => {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    first.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [month]);
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div><h2 className="font-semibold text-slate-900">{monthLabel}</h2><p className="mt-1 text-xs text-slate-500">Sample deadlines from across the workspace</p></div>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous month" onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><LuChevronLeft aria-hidden="true" className="h-4 w-4" /></button>
            <button type="button" aria-label="Next month" onClick={() => setMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><LuChevronRight aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const tasks = demoTasks.filter((task) => task.due.toDateString() === day.toDateString());
            const isCurrentMonth = day.getMonth() === month.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={day.toISOString()} className={`min-h-[76px] border-b border-r border-slate-100 p-1.5 sm:min-h-24 sm:p-2 ${isCurrentMonth ? 'bg-white' : 'bg-slate-50/60'}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${isToday ? 'bg-orange-700 font-bold text-white' : isCurrentMonth ? 'text-slate-600' : 'text-slate-300'}`}>{day.getDate()}</span>
                {tasks.slice(0, 1).map((task) => <p key={task.title} title={task.title} className={`mt-1 truncate rounded bg-orange-50 px-1 py-1 text-[9px] font-medium text-orange-800 sm:text-[10px]`}>{task.title}</p>)}
                {tasks.length > 1 && <p className="mt-1 text-[9px] text-slate-400">+{tasks.length - 1} more</p>}
              </div>
            );
          })}
        </div>
      </section>
      <JoinCard title="Keep every deadline in view." description="Sign up to plan your personal and shared project work in one calendar." />
    </div>
  );
};

const ReportsView = () => {
  const statusCounts = [
    { label: 'Completed', count: 2, color: 'bg-emerald-500' },
    { label: 'In progress', count: 2, color: 'bg-amber-400' },
    { label: 'To do', count: 3, color: 'bg-slate-400' },
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DemoMetric label="Total tasks" value="7" caption="Across three demo projects" icon={LuListTodo} tone="bg-orange-50 text-orange-800" />
        <DemoMetric label="Completion rate" value="29%" caption="Two tasks completed" icon={LuCircleCheck} tone="bg-emerald-50 text-emerald-700" />
        <DemoMetric label="Active projects" value="3" caption="Shared spaces with momentum" icon={LuFolderKanban} tone="bg-blue-50 text-blue-700" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">Work by status</h2><p className="mt-1 text-sm text-slate-500">A quick view of this sample workspace</p>
          <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100">{statusCounts.map((item) => <span key={item.label} className={item.color} style={{ width: `${(item.count / 7) * 100}%` }} />)}</div>
          <div className="mt-5 space-y-4">{statusCounts.map((item) => <div key={item.label} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} /><span className="flex-1 text-sm text-slate-600">{item.label}</span><span className="text-sm font-semibold text-slate-900">{item.count}</span><span className="w-10 text-right text-xs text-slate-400">{Math.round((item.count / 7) * 100)}%</span></div>)}</div>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">Project momentum</h2><p className="mt-1 text-sm text-slate-500">A sample view of active work</p>
          <div className="mt-5 space-y-5">{demoProjects.map((project, index) => <div key={project.name}><div className="mb-2 flex justify-between gap-3"><span className="truncate text-sm font-medium text-slate-700">{project.name}</span><span className="text-xs text-slate-500">{[68, 46, 32][index]}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${project.color}`} style={{ width: `${[68, 46, 32][index]}%` }} /></div></div>)}</div>
        </article>
      </div>
      <JoinCard title="Make decisions with a clearer picture of your work." />
    </div>
  );
};

const pageContent = {
  '/': { eyebrow: 'YOUR SAMPLE WORKSPACE', title: 'A little more focus, every day.', description: 'Explore how tasks, team projects, and plans fit together in TaskFlow.', view: <Dashboard /> },
  '/tasks': { eyebrow: 'TASKS', title: 'See the work, clearly.', description: 'Search and filter a sample task list, then sign up to organize your own.', view: <TasksView /> },
  '/projects': { eyebrow: 'PROJECTS', title: 'Shared work, in context.', description: 'Take a look at how teams can bring plans, people, and progress together.', view: <ProjectsView /> },
  '/calendar': { eyebrow: 'CALENDAR', title: 'Deadlines in perspective.', description: 'Browse a sample schedule of personal and team work.', view: <CalendarView /> },
  '/notes': { eyebrow: 'NOTES', title: 'Good ideas have a home.', description: 'Search a few sample notes from across the workspace.', view: <NotesView /> },
  '/reports': { eyebrow: 'REPORTS', title: 'Progress you can see.', description: 'Explore a sample picture of task health and project momentum.', view: <ReportsView /> },
};

const DemoWorkspace = () => {
  const { pathname } = useLocation();
  const activePath = navigation.find((item) => item.path === pathname)?.path || '/';
  const page = pageContent[activePath];

  return (
    <div className="py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200/80 bg-orange-50/80 px-4 py-3">
        <p className="text-sm text-orange-950"><span className="font-semibold">You’re exploring a demo.</span> This sample data is here to help you look around.</p>
        <Link to="/register" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-orange-800 hover:text-orange-950">Make it yours <LuArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[205px_minmax(0,1fr)]">
        <nav aria-label="Explore TaskFlow" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
          <p className="hidden px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 lg:block">Explore workspace</p>
          {navigation.map((item) => {
            const active = activePath === item.path;
            return (
              <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-orange-50 text-orange-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <item.icon aria-hidden="true" className={`h-[18px] w-[18px] ${active ? 'text-orange-700' : 'text-slate-400'}`} />{item.label}
              </Link>
            );
          })}
          <div className="mt-2 hidden rounded-xl bg-[#f7f5f0] p-3 lg:block">
            <p className="text-xs font-semibold text-slate-700">A workspace for your work</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Tasks, shared projects, notes, and more—together.</p>
            <Link to="/register" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-800">Get started <LuArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
          </div>
        </nav>

        <main className="min-w-0 space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700">{page.eyebrow}</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{page.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{page.description}</p>
            </div>
            <Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-800"><LuPlus aria-hidden="true" className="h-4 w-4" />Start using TaskFlow</Link>
          </header>
          {page.view}
        </main>
      </div>
    </div>
  );
};

export default DemoWorkspace;
