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
    title: 'Personal and team tasks, in one view',
    description: 'Keep your to-dos and shared responsibilities together. Know what needs attention, who owns it, and when it’s due.',
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
    title: 'Shared projects with clear ownership',
    description: 'Bring people, tasks, and project context into one shared space. Keep the team aligned without chasing updates.',
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
    title: 'Focus Sprint for meaningful work',
    description: 'Set aside time for one important task. Give it your attention, one focused session at a time.',
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
    title: 'A calendar that puts deadlines in context',
    description: 'See what’s coming up and plan around your commitments. Keep due dates visible before they become urgent.',
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
  {
    title: 'Notes that stay connected to work',
    description: 'Capture decisions, details, and next steps alongside the projects they support. Find the context when you need it.',
    icon: LuNotebookPen,
    tone: 'bg-violet-50 text-violet-700',
    visual: (
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <p className="text-[10px] font-semibold text-slate-700">Project brief</p>
        <p className="mt-1 text-[9px] leading-4 text-slate-500">Customer portal · Key decisions and next steps</p>
      </div>
    ),
  },
  {
    title: 'Progress without the status chase',
    description: 'See what’s moving, what’s complete, and where work needs attention—without checking in on every task.',
    icon: LuChartNoAxesColumn,
    tone: 'bg-sky-50 text-sky-700',
    visual: (
      <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-600">Weekly progress</span>
          <span className="text-[10px] font-semibold text-emerald-700">On track</span>
        </div>
        <div className="mt-2 flex h-5 items-end gap-1">
          <span className="h-2 w-2 rounded-sm bg-orange-200" />
          <span className="h-3 w-2 rounded-sm bg-orange-300" />
          <span className="h-2.5 w-2 rounded-sm bg-orange-300" />
          <span className="h-4 w-2 rounded-sm bg-orange-400" />
          <span className="h-5 w-2 rounded-sm bg-orange-500" />
          <span className="h-4 w-2 rounded-sm bg-emerald-500" />
        </div>
      </div>
    ),
  },
];

const taskBoardColumns = [
  { title: 'To do', color: 'bg-slate-400', tasks: ['Prepare launch brief', 'Review support flow'] },
  { title: 'In progress', color: 'bg-orange-500', tasks: ['Customer interviews', 'Update onboarding'] },
  { title: 'Done', color: 'bg-emerald-500', tasks: ['Project kickoff'] },
];

const showcaseLinkClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-orange-200/80 bg-white px-5 py-3 text-sm font-semibold text-orange-800 shadow-sm shadow-orange-950/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/70 hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700';
const primaryMarketingButtonClass = 'inline-flex min-h-12 whitespace-nowrap items-center justify-center gap-2 rounded-xl bg-orange-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-orange-900/15 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-800 hover:shadow-lg hover:shadow-orange-900/20 active:translate-y-0 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700';

const ProductDemoVideo = () => {
  const videoRef = React.useRef(null);
  const [shouldLoadVideo, setShouldLoadVideo] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShouldLoadVideo(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoadVideo(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px 0px' });
    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="product-demo-title" className="mt-16 sm:mt-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">A closer look</p>
        <h2 id="product-demo-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">See it in action.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Take a quick tour of how TaskFlow brings your work together.</p>
      </div>
      <div className="mx-auto mt-8 w-full max-w-[1000px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_28px_64px_-32px_rgba(65,48,29,0.3)] ring-1 ring-slate-900/[0.04]">
        <video
          ref={videoRef}
          src={shouldLoadVideo ? '/taskflow-demo.mp4' : undefined}
          controls
          muted
          playsInline
          preload="metadata"
          poster="/taskflow-demo-poster.jpg"
          aria-label="TaskFlow product demo video"
          className="block aspect-video w-full bg-slate-950 object-contain"
        >
          Your browser does not support HTML video.{' '}
          <a href="/taskflow-demo.mp4">Download the TaskFlow product demo.</a>
        </video>
      </div>
      <div className="mt-6 text-center">
        <Link to="/register" className={primaryMarketingButtonClass}>
          Create free account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

const ProductPreview = () => (
  <div className="relative mx-auto w-full max-w-[720px] pb-5 lg:ml-auto">
    <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-orange-200/50 via-orange-100/20 to-emerald-100/50 blur-2xl" />
    <div className="relative rounded-[1.4rem] border border-white bg-white p-1.5 shadow-[0_38px_90px_-34px_rgba(65,48,29,0.38)] ring-1 ring-slate-900/[0.06] sm:rounded-[1.8rem] sm:p-2">
      <div className="overflow-hidden rounded-[1.05rem] bg-white ring-1 ring-slate-900/[0.04] sm:rounded-[1.35rem]">
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
  <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-[0_28px_64px_-32px_rgba(65,48,29,0.3)] ring-1 ring-slate-900/[0.06]">
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
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-white/90 px-3.5 py-2 text-xs font-semibold tracking-wide text-orange-800 shadow-sm shadow-orange-950/[0.04]">
          <LuSparkles aria-hidden="true" className="h-3.5 w-3.5" />
          A calmer workspace for your next step
        </div>
        <h1 className="mt-5 text-[2.2rem] font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:mt-6 sm:text-5xl lg:text-[3.05rem] xl:text-[3.4rem]">
          Make progress <span className="text-orange-700">without the noise.</span>
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
          TaskFlow brings your tasks, projects, deadlines, notes, and focus into one calm workspace—so you can see what matters and move it forward.
        </p>
        <div className="mt-7 flex flex-col gap-3 md:mt-8 md:flex-row">
          <Link to="/register" className={`${primaryMarketingButtonClass} w-full md:w-auto`}>
            Create free account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/tasks" className={`${showcaseLinkClass} w-full border-slate-200/90 text-slate-700 shadow-slate-950/[0.04] hover:border-orange-200 hover:text-orange-900 md:w-auto`}>
            Explore the demo
          </Link>
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500 sm:mt-8 sm:gap-x-5">
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Tasks and projects, together</span>
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Clear owners and due dates</span>
          <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" />Focus time built in</span>
        </div>
      </section>
      <ProductPreview />
    </div>

    <ProductDemoVideo />

    <section aria-labelledby="problem-title" className="mt-16 grid items-center gap-6 md:mt-24 md:grid-cols-2 md:gap-10">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Less scattered. More focused.</p>
        <h2 id="problem-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">Work shouldn’t take so much work to organize.</h2>
        <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">Your tasks are scattered across lists. Project details get buried in conversations. Priorities shift, and the next step isn’t always clear. You spend too much energy keeping track—and less on the work itself.</p>
      </div>
      <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/70 p-6 shadow-[0_20px_48px_-40px_rgba(124,45,18,0.35)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">A calmer way forward</p>
        <h3 className="mt-3 text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">Give your work one clear place to land.</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">TaskFlow brings tasks, projects, deadlines, notes, and focus together. See what needs attention, keep the context close, and move forward at a steadier pace.</p>
      </div>
    </section>

    <section id="features" aria-labelledby="benefits-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">A clearer way to work</p>
        <h2 id="benefits-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">Everything in place for steady progress.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">One thoughtful workspace for your tasks, team, and time.</p>
      </div>
      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
        {featureCards.map((feature) => (
          <article key={feature.title} className="group flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_10px_rgba(15,23,42,0.035)] transition-all duration-200 ease-out hover:-translate-y-1 hover:border-orange-200/80 hover:shadow-[0_20px_44px_-30px_rgba(65,48,29,0.28)]">
            <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-slate-900/[0.04] shadow-sm transition-transform duration-200 group-hover:scale-[1.04] ${feature.tone}`}>
              {React.createElement(feature.icon, { 'aria-hidden': true, className: 'h-5 w-5' })}
            </span>
            <h3 className="mt-4 text-base font-semibold leading-6 tracking-tight text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
            <div className="mt-auto pt-4">{feature.visual}</div>
          </article>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link to="/tasks" className={showcaseLinkClass}>
          Explore the demo <LuArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>

    <section id="product-preview" aria-labelledby="task-preview-title" className="scroll-mt-8 grid items-center gap-7 rounded-3xl border border-orange-100/80 bg-gradient-to-br from-white via-white to-orange-50/60 p-5 shadow-[0_24px_64px_-48px_rgba(124,45,18,0.3)] sm:gap-9 sm:p-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10 lg:p-10">
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">See the work clearly</p>
        <h2 id="task-preview-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">Know what’s moving and what needs you next.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">See priorities, owners, and due dates together. Then move work forward with a board that makes the next step clear.</p>
        <Link to="/tasks" className={`mt-5 ${showcaseLinkClass}`}>
          See the task board <LuArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <TasksProductPreview />
    </section>

    <section aria-labelledby="how-it-works-title" className="py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Simple by design</p>
        <h2 id="how-it-works-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">A clear path from plans to progress.</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Get set up without adding another complicated process.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            step: '01',
            title: 'Bring your work together',
            description: 'Add tasks, projects, and notes to one workspace. Give every piece of work a place to live.',
            icon: LuFolderKanban,
          },
          {
            step: '02',
            title: 'Make the next step clear',
            description: 'Set priorities, owners, and due dates so you know what matters now.',
            icon: LuListTodo,
          },
          {
            step: '03',
            title: 'Keep work moving',
            description: 'Use your task views, calendar, and focus time to make steady progress and see what’s getting done.',
            icon: LuChartNoAxesColumn,
          },
        ].map((item) => (
          <article key={item.step} className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-800 ring-1 ring-orange-100">
                <item.icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold tracking-[0.12em] text-slate-400">{item.step}</span>
            </div>
            <h3 className="mt-5 text-base font-semibold leading-6 tracking-tight text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
          </article>
        ))}
      </div>
    </section>

    <section aria-labelledby="use-cases-title" className="border-y border-slate-200/70 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">Fits the way you work</p>
        <h2 id="use-cases-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">Built for focused work, solo or together.</h2>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          {
            title: 'Individuals and freelancers',
            description: 'Balance client work, admin, and personal priorities in one place. Keep deadlines in sight and finish the day with a clearer sense of what’s next.',
          },
          {
            title: 'Small teams',
            description: 'Coordinate shared projects, clarify ownership, and keep useful context close. Work together without adding layers of process.',
          },
          {
            title: 'Founders and early startups',
            description: 'Keep launch priorities visible as the work changes. Align a small team and make progress without building a heavyweight system.',
          },
        ].map((item) => (
          <article key={item.title} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.035)]">
            <h3 className="text-base font-semibold leading-6 tracking-tight text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{item.description}</p>
          </article>
        ))}
      </div>
    </section>

    <section aria-labelledby="final-cta-title" className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e2b25] to-[#26392f] px-5 py-9 text-white shadow-[0_28px_70px_-34px_rgba(15,23,42,0.65)] sm:mt-20 sm:px-9 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-600/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">A calmer start to your workday</p>
          <h2 id="final-cta-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">Make your next workday feel clearer.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Bring your tasks, projects, and plans into one calm workspace. Start with what’s on your plate today, and take the next step with confidence.</p>
          <p className="mt-3 text-xs font-medium text-slate-400">Thoughtfully simple for individuals and small teams.</p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 md:w-auto md:items-start">
          <Link to="/register" className={`${primaryMarketingButtonClass} w-full md:w-auto`}>
            Create free account <LuArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/tasks" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white active:translate-y-0 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300 md:w-auto">
            Explore the demo
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
