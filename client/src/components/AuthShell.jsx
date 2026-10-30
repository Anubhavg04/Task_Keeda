import React from 'react';
import {
  LuArrowUpRight,
  LuCalendarDays,
  LuCheck,
  LuCircleCheck,
  LuClock3,
  LuLayers3,
  LuListTodo,
  LuUsersRound,
} from 'react-icons/lu';

const SignupShowcase = () => (
  <section className="signup-showcase relative isolate flex min-h-[440px] flex-col justify-between overflow-hidden bg-[#18231f] px-6 py-8 text-white sm:px-10 sm:py-10 lg:min-h-0 lg:px-12 lg:py-12 xl:px-16">
    <div aria-hidden="true" className="pointer-events-none absolute -left-36 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-orange-700/25 blur-3xl" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-36 -z-10 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-3xl" />

    <div className="mx-auto w-full max-w-xl">
      <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
        <LuLayers3 aria-hidden="true" className="h-4 w-4" />
        One home for work that matters
      </div>

      <div className="mt-7 max-w-lg sm:mt-10">
        <p className="text-sm font-semibold text-emerald-200">Plan clearly. Move together.</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-[2.8rem]">
          From busywork
          <span className="block text-orange-300">to real momentum.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
          Bring personal tasks, team projects, and the next important decision into one calm, connected workspace.
        </p>
      </div>

      <div className="signup-art-enter relative mt-7 sm:mt-9">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#f7f5ef] p-4 text-slate-900 shadow-2xl shadow-black/30 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-800">
                <LuListTodo aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Website refresh</p>
                <p className="mt-0.5 text-xs text-slate-500">Team workspace · 6 tasks</p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              On track
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">This week</p>
              <p className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">Good work, in motion</p>
            </div>
            <div className="flex -space-x-2" aria-label="Three team members">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f5ef] bg-amber-200 text-[10px] font-bold text-amber-950">M</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f5ef] bg-sky-200 text-[10px] font-bold text-sky-950">J</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f7f5ef] bg-rose-200 text-[10px] font-bold text-rose-950">A</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <LuCheck aria-hidden="true" className="h-3 w-3" />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-slate-500 line-through">Share the project brief</span>
              <LuCircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-600" />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5">
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-orange-400" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800">Review this week’s priorities</span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-slate-500">
                <LuCalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                Today
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
              <div className="signup-progress h-full w-[68%] rounded-full bg-gradient-to-r from-orange-600 to-amber-400" />
            </div>
            <span className="text-[10px] font-medium text-slate-500">4 of 6 done</span>
          </div>
        </div>

        <div className="signup-art-float absolute -bottom-4 right-2 hidden items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-slate-900 shadow-xl shadow-black/20 sm:flex lg:-right-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-800">
            <LuClock3 aria-hidden="true" className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[10px] font-medium text-slate-500">A clearer next step</span>
            <span className="block text-xs font-semibold">Less chasing, more doing</span>
          </span>
          <LuArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4 text-emerald-700" />
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300 sm:mt-9">
        <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />Personal tasks</span>
        <span className="inline-flex items-center gap-1.5"><LuCheck aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />Shared projects</span>
        <span className="inline-flex items-center gap-1.5"><LuUsersRound aria-hidden="true" className="h-3.5 w-3.5 text-emerald-300" />Team planning</span>
      </div>
    </div>

    <p className="mx-auto mt-7 hidden w-full max-w-xl text-xs text-slate-500 lg:block">A calmer way to make meaningful progress.</p>
  </section>
);

const AuthShell = ({ eyebrow, title, description, children, variant = 'login' }) => {
  const isSignup = variant === 'signup';

  return (
    <div className={`min-h-[calc(100svh-72px)] bg-[#faf8f4] ${isSignup ? 'lg:grid lg:grid-cols-[1.02fr_0.98fr]' : 'flex items-center justify-center'}`}>
      {isSignup && <SignupShowcase />}

      <section className={`flex items-center justify-center px-5 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-16 ${isSignup ? '' : 'w-full'}`}>
        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-800">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-600" />
              {eyebrow}
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          {children}
          <p className="mt-7 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to use TaskFlow thoughtfully and keep your account details safe.
          </p>
        </div>
      </section>
    </div>
  );
};

export default AuthShell;
