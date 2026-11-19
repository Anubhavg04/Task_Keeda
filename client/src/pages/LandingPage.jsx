import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartNoAxesColumn,
  LuCheck,
  LuFolderKanban,
  LuLayoutDashboard,
  LuListTodo,
  LuNotebookPen,
  LuSparkles,
  LuTarget,
} from 'react-icons/lu';
import TaskFlowLogo from '../components/TaskFlowLogo.jsx';
import MarketingSectionLink from '../components/MarketingSectionLink.jsx';

const previewTasks = [
  { title: 'Review customer interview notes', project: 'Customer portal', due: 'Today', status: 'In progress', tone: 'bg-orange-500' },
  { title: 'Approve campaign landing page', project: 'Spring campaign', due: 'Tomorrow', status: 'To do', tone: 'bg-slate-400' },
  { title: 'Share the updated project brief', project: 'Customer portal', due: 'Done', status: 'Done', tone: 'bg-emerald-500' },
];

const previewNavigation = [
  { label: 'Overview', icon: LuLayoutDashboard, active: true },
  { label: 'My tasks', icon: LuListTodo },
  { label: 'Projects', icon: LuFolderKanban },
  { label: 'Calendar', icon: LuCalendarDays },
  { label: 'Notes', icon: LuNotebookPen },
  { label: 'Reports', icon: LuChartNoAxesColumn },
];

const featureCards = [
  {
    title: 'Tasks with a clear next step',
    description: 'See status, priority, ownership, and due dates together, without losing the detail.',
    icon: LuListTodo,
    tone: 'bg-orange-50 text-orange-800',
    visual: (
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-semibold text-orange-800">In progress</span>
        <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700">High priority</span>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">Due Friday</span>
      </div>
    ),
  },
  {
    title: 'Projects that keep context close',
    description: 'Bring people, task lists, and project notes into one shared space.',
    icon: LuFolderKanban,
    tone: 'bg-blue-50 text-blue-700',
    visual: (
      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
        <span className="text-[10px] font-medium text-slate-600">Customer portal</span>
        <span className="flex -space-x-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-orange-100 text-[9px] font-bold text-orange-800">A</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-blue-100 text-[9px] font-bold text-blue-800">J</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-50 bg-emerald-100 text-[9px] font-bold text-emerald-800">M</span>
        </span>
      </div>
    ),
  },
  {
    title: 'Focus time you can protect',
    description: 'Start a lightweight focus sprint and give one important task your attention.',
    icon: LuTarget,
    tone: 'bg-emerald-50 text-emerald-700',
    visual: (
      <div className="rounded-xl bg-slate-50 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-600">Focus sprint</span>
          <span className="text-xs font-bold tabular-nums text-slate-800">25:00</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-emerald-500" /></div>
      </div>
    ),
  },
  {
    title: 'Deadlines in perspective',
    description: 'See what is coming up in a calm calendar, with month and week views.',
    icon: LuCalendarDays,
    tone: 'bg-amber-50 text-amber-700',
    visual: (
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-500">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1">{day}</span>
        ))}
        {[18, 19, 20, 21, 22, 23, 24].map((date) => (
          <span key={date} className={`rounded-md py-1 ${date === 20 ? 'bg-orange-600 font-semibold text-white' : 'bg-white'}`}>{date}</span>
        ))}
      </div>
    ),
  },
];

const taskBoardColumns = [
  { title: 'To do', color: 'bg-slate-400', tasks: ['Prepare launch brief', 'Review support flow'] },
  { title: 'In progress', color: 'bg-orange-500', tasks: ['Customer interviews', 'Update onboarding'] },
  { title: 'Done', color: 'bg-emerald-500', tasks: ['Project kickoff'] },
];

const showcaseLinkClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-200 bg-white px-4 text-sm font-semibold text-orange-800 shadow-sm transition hover:bg-orange-50 hover:text-orange-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700';
const primaryMarketingButtonClass = 'inline-flex min-h-11 whitespace-nowrap items-center justify-center gap-2 rounded-xl bg-orange-700 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-orange-200 transition duration-150 hover:bg-orange-800 hover:shadow-md active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 sm:min-h-12 sm:px-4 sm:py-3 sm:shadow-lg sm:shadow-orange-700/20';

const ProductPreview = () => (
  <div className="relative mx-auto w-full max-w-[720px] pb-5 lg:ml-auto">
    <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-orange-200/50 via-orange-100/20 to-emerald-100/50 blur-2xl" />
    <div className="relative rounded-[1.35rem] border border-slate-200/90 bg-white p-1.5 shadow-[0_32px_80px_-28px_rgba(15,23,42,0.28)] ring-1 ring-white/80 sm:rounded-[1.8rem] sm:p-2">
      <div className="overflow-hidden rounded-[1rem] bg-white sm:rounded-[1.35rem]">
      <div className="flex h-11 items-center justify-between border-b border-slate-100 bg-white px-3 sm:h-12 sm:px-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-rose-300" />
          <span className="h-2 w-2 rounded-full bg-amber-300" />
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
        </div>
        <span className="rounded-md bg-slate-50 px-3 py-1 text-[9px] font-medium text-slate-400 sm:text-[10px]">app.taskflow.work</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-800">A</span>
      </div>

      <div className="grid min-h-[360px] grid-cols-[48px_minmax(0,1fr)] sm:min-h-[430px] sm:grid-cols-[145px_minmax(0,1fr)]">
        <aside aria-label="Product preview navigation" className="border-r border-slate-100 bg-[#fdfcf9] p-1.5 sm:p-3">
          <div className="mb-3 hidden items-center gap-2 rounded-lg bg-white p-2 sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-600 text-[10px] font-bold text-white">T</span>
            <span className="truncate text-[10px] font-semibold text-slate-700">Studio team</span>
          </div>
          <nav aria-label="Preview sections" className="space-y-1">
            {previewNavigation.map(({ label, icon, active }) => (
              <div
                key={label}
                className={`flex h-9 items-center justify-center gap-2 rounded-lg sm:justify-start sm:px-2 ${active ? 'bg-orange-50 text-orange-800' : 'text-slate-400'}`}
                title={label}
              >
                {React.createElement(icon, { 'aria-hidden': true, className: 'h-4 w-4 shrink-0' })}
                <span className="hidden truncate text-[10px] font-medium sm:inline">{label}</span>
              </div>
            ))}
          </nav>
          <div className="mt-4 hidden border-t border-slate-100 pt-3 sm:block">
            <p className="px-2 text-[9px] font-semibold uppercase tracking-wider text-slate-400">Team projects</p>
            <p className="mt-2 truncate px-2 text-[10px] text-slate-500">Customer portal</p>
            <p className="mt-1 truncate px-2 text-[10px] text-slate-500">Spring campaign</p>
          </div>
        </aside>

        <div className="min-w-0 bg-[#faf9f6] p-3 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2 sm:mb-4">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-orange-700 sm:text-[10px]">Monday, May 20</p>
              <h2 className="mt-1 truncate text-sm font-bold tracking-tight text-slate-900 sm:text-lg">Good morning, Alex</h2>
              <p className="mt-0.5 hidden text-[10px] text-slate-500 sm:block">Here is your workspace at a glance.</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
              <LuCalendarDays aria-hidden="true" className="h-4 w-4" />
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { label: 'Open tasks', value: '12', tone: 'text-orange-700' },
              { label: 'Completed', value: '8', tone: 'text-emerald-700' },
              { label: 'Due this week', value: '4', tone: 'text-blue-700' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-lg border border-slate-200/80 bg-white p-2 sm:rounded-xl sm:p-3">
                <p className="truncate text-[8px] font-medium text-slate-500 sm:text-[10px]">{metric.label}</p>
                <p className={`mt-1 text-base font-bold leading-none sm:text-xl ${metric.tone}`}>{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2.5 sm:mt-4 sm:gap-3">
            <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2 sm:px-3">
                <div>
                  <h3 className="text-[10px] font-semibold text-slate-800 sm:text-xs">Recently updated</h3>
                  <p className="mt-0.5 text-[8px] text-slate-400 sm:text-[9px]">The latest work from your team</p>
                </div>
                <span className="text-[8px] font-semibold text-orange-800 sm:text-[9px]">All tasks</span>
              </div>
              <ul>
                {previewTasks.map((task) => (
                  <li key={task.title} className="flex items-center gap-2 border-b border-slate-100 px-2.5 py-2 last:border-0 sm:gap-2.5 sm:px-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${task.status === 'Done' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                      {task.status === 'Done' ? <LuCheck aria-hidden="true" className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full ${task.tone}`} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[9px] font-medium sm:text-[10px] ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.title}</span>
                      <span className="mt-0.5 block truncate text-[8px] text-slate-400 sm:text-[9px]">{task.project}</span>
                    </span>
                    <span className="hidden shrink-0 text-[8px] text-slate-400 sm:block">{task.due}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-2 gap-2">
              <section className="rounded-xl border border-slate-200/80 bg-white p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-[9px] font-semibold text-slate-800 sm:text-[10px]">Weekly momentum</h3>
                  <LuSparkles aria-hidden="true" className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <p className="mt-2 text-base font-bold leading-none text-slate-900 sm:text-lg">68%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-orange-500 to-emerald-400" />
                </div>
                <p className="mt-1 text-[8px] text-slate-400 sm:text-[9px]">Tasks completed</p>
              </section>
              <section className="rounded-xl border border-orange-100 bg-orange-50/70 p-2.5 sm:p-3">
                <p className="text-[8px] font-semibold uppercase tracking-wider text-orange-800 sm:text-[9px]">Coming up</p>
                <p className="mt-1.5 line-clamp-2 text-[9px] font-medium leading-4 text-slate-700 sm:text-[10px]">Share the updated project brief</p>
                <p className="mt-1 text-[8px] text-slate-500 sm:text-[9px]">Customer portal · Tomorrow</p>
              </section>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-4 right-3 hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-lg shadow-slate-900/10 sm:flex lg:-right-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><LuCheck aria-hidden="true" className="h-4 w-4" /></span>
      <span>
        <span className="block text-[10px] font-semibold text-slate-800">A little more focus</span>
        <span className="block text-[9px] text-slate-500">Progress, without the noise</span>
      </span>
    </div>
  </div>
);

const TasksProductPreview = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.25)] ring-1 ring-white/80">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">My tasks</p>
        <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">Keep the next steps moving</h3>
      </div>
      <span className="hidden rounded-lg bg-orange-700 px-3 py-2 text-[10px] font-semibold text-white sm:inline-flex">+ New task</span>
    </div>
    <div className="grid grid-cols-1 gap-2 bg-[#faf9f6] p-2.5 md:grid-cols-3 sm:gap-3 sm:p-4">
      {taskBoardColumns.map((column) => (
        <section key={column.title} className="min-w-0 rounded-xl border border-slate-200/80 bg-slate-100/80 p-2.5 sm:p-3 md:p-2.5">
          <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${column.color}`} />
            <h4 className="truncate text-[11px] font-semibold text-slate-700 md:text-[11px]">{column.title}</h4>
            <span className="ml-auto text-[8px] text-slate-400">{column.tasks.length}</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {column.tasks.map((task, index) => (
              <article key={task} className="rounded-lg border border-slate-200/80 bg-white p-1.5 shadow-sm sm:p-2.5">
                <p className="line-clamp-2 min-h-8 text-[10px] font-medium leading-4 text-slate-700">{task}</p>
                <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-slate-100 pt-1.5">
                  <span className="truncate text-[9px] text-slate-400">{index === 0 ? 'Customer portal' : 'Spring campaign'}</span>
                  <span className={`h-5 w-5 shrink-0 rounded-full text-center text-[8px] font-bold leading-5 ${index % 2 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{index % 2 ? 'J' : 'A'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

const LandingPage = () => {
  const location = useLocation();

  React.useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!sectionId) return;

    const section = document.getElementById(sectionId);
    if (!section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }, [location.hash]);

  return (
  <div className="relative isolate overflow-x-clip py-9 sm:py-12 lg:py-14 xl:py-16">
    <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-orange-200/25 blur-3xl" />
    <div className="grid min-w-0 items-center gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-8 xl:gap-12">
      <section className="max-w-xl lg:max-w-none">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-orange-800 shadow-sm shadow-orange-100/50">
          <LuSparkles aria-hidden="true" className="h-3.5 w-3.5" />
          A calmer way to work
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-[1.12] tracking-tight text-slate-950 sm:mt-5 sm:text-5xl lg:text-[3rem] xl:text-[3.35rem]">
          A calm workspace for <span className="text-orange-700">tasks, projects, and focused work.</span>
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
          Bring your to-dos, team plans, and deadlines together, so you can spend less time sorting work and more time moving it forward.
        </p>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <Link to="/register" className={`${primaryMarketingButtonClass} w-full md:w-auto`}>
            Create free account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/tasks" className="inline-flex min-h-11 w-full whitespace-nowrap items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:border-orange-200 hover:bg-white hover:text-orange-900 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 sm:min-h-12 sm:px-4 sm:py-3 md:w-auto">
            Explore the demo
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 sm:mt-7 sm:gap-x-5">
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Personal tasks</span>
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Shared projects</span>
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Clear progress</span>
        </div>
      </section>
      <ProductPreview />
    </div>

    <section aria-label="TaskFlow at a glance" className="mt-12 flex flex-col gap-3 border-y border-orange-100/80 py-5 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:py-6">
      <p className="text-sm font-semibold text-slate-800">One calm place for your day-to-day work.</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
        <span>Tasks</span>
        <span>Team projects</span>
        <span>Focus time</span>
        <span>Deadlines</span>
      </div>
    </section>

    <section id="features" aria-labelledby="benefits-title" className="py-14 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">A clearer way to work</p>
        <h2 id="benefits-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">The essentials, working together.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Less time chasing details. More room to focus, collaborate, and make steady progress.</p>
      </div>
      <div className="mt-8 grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature) => (
          <article key={feature.title} className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md hover:shadow-slate-300/30">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.tone}`}>
              {React.createElement(feature.icon, { 'aria-hidden': true, className: 'h-5 w-5' })}
            </span>
            <h3 className="mt-4 text-base font-semibold leading-6 tracking-tight text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            <div className="mt-auto pt-4">{feature.visual}</div>
          </article>
        ))}
      </div>
      <div className="mt-7 text-center">
        <Link to="/tasks" className={showcaseLinkClass}>
          Explore the live demo <LuArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>

    <section id="product-preview" aria-labelledby="task-preview-title" className="scroll-mt-8 grid items-center gap-6 rounded-3xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/70 p-5 sm:gap-8 sm:p-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 lg:p-9">
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">From list to momentum</p>
        <h2 id="task-preview-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">Know what is moving, and what needs you next.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Give every task a clear status, owner, priority, and due date. Then move work forward together in a simple board view.</p>
        <Link to="/tasks" className={`mt-5 ${showcaseLinkClass}`}>
          See the task board <LuArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <TasksProductPreview />
    </section>

    <section aria-labelledby="final-cta-title" className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e2b25] to-[#26392f] px-5 py-9 text-white shadow-[0_28px_70px_-34px_rgba(15,23,42,0.65)] sm:mt-20 sm:px-9 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">A little more focus, every day</p>
          <h2 id="final-cta-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Ready to get your work moving?</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Create your free account and bring your tasks, projects, and plans into one calm workspace.</p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:items-start">
          <Link to="/register" className={`${primaryMarketingButtonClass} w-full md:w-auto`}>
            Create free account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/tasks" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] px-4 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 md:min-h-12 md:w-auto">
            Or explore the live demo
          </Link>
        </div>
      </div>
    </section>
    <footer className="mt-10 border-t border-orange-100 pt-6 sm:mt-12 sm:pt-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <TaskFlowLogo markClassName="h-6 w-6" textClassName="text-base" />
          <p className="mt-2 text-sm text-slate-500">A calmer way to work.</p>
        </div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-2 text-sm font-medium md:flex md:gap-5">
          <MarketingSectionLink sectionId="product-preview" className="inline-flex min-h-11 items-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">Product</MarketingSectionLink>
          <MarketingSectionLink sectionId="features" className="inline-flex min-h-11 items-center rounded-md px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">Features</MarketingSectionLink>
          <Link to="/login" className="inline-flex min-h-11 items-center rounded-md px-2 text-slate-600 transition-colors hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">Sign in</Link>
          <Link to="/register" className="inline-flex min-h-11 items-center rounded-md px-2 text-slate-600 transition-colors hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">Create account</Link>
        </nav>
      </div>
      <p className="mt-6 border-t border-orange-100/70 pt-4 text-xs text-slate-400">© 2026 TaskFlow. All rights reserved.</p>
    </footer>
  </div>
  );
};

export default LandingPage;
