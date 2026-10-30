import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LuCalendarDays,
  LuBellRing,
  LuChartNoAxesColumn,
  LuChevronDown,
  LuCommand,
  LuGauge,
  LuFolderKanban,
  LuLayoutDashboard,
  LuListTodo,
  LuLogOut,
  LuNotebookPen,
  LuPlus,
  LuSearch,
  LuScale,
} from 'react-icons/lu';
import { useAuth } from '../context/useAuth.js';
import { projectAPI } from '../services/api.js';
import TaskFlowLogo from './TaskFlowLogo.jsx';
import CommandPalette from './CommandPalette.jsx';

const navigation = [
  { label: 'Overview', path: '/', icon: LuLayoutDashboard },
  { label: 'My tasks', path: '/tasks', icon: LuListTodo },
  { label: 'Team workspaces', path: '/projects', icon: LuFolderKanban },
  { label: 'Calendar', path: '/calendar', icon: LuCalendarDays },
  { label: 'Notes', path: '/notes', icon: LuNotebookPen },
  { label: 'Reports', path: '/reports', icon: LuChartNoAxesColumn },
  { label: 'Control tower', path: '/control-tower', icon: LuGauge },
  { label: 'Impact simulator', path: '/impact-simulator', icon: LuScale },
  { label: 'Phone notifications', path: '/notifications', icon: LuBellRing },
];

const projectDots = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isRegisterPage = location.pathname === '/register';
  const [search, setSearch] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState('');
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const routeProjectId = new URLSearchParams(location.search).get('projectId') || '';
  const scopedPage = location.pathname === '/tasks' || location.pathname === '/control-tower';
  const activeProject = projects.find((project) => project._id === routeProjectId);
  const workspaceLabel = !scopedPage
    ? 'All workspaces'
    : routeProjectId === 'personal'
      ? 'Personal workspace'
      : activeProject
        ? activeProject.name
        : 'All workspaces';

  const openWorkspace = (projectId = '') => {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    navigate(location.pathname === '/control-tower' ? `/control-tower${query}` : `/tasks${query}`);
    setWorkspaceMenuOpen(false);
  };

  const refreshProjects = useCallback(async () => {
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
      setProjectsError('');
    } catch (error) {
      setProjectsError(error.response?.data?.message || 'Projects could not be loaded.');
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    projectAPI.getProjects()
      .then((response) => {
        setProjects(response.data);
        setProjectsError('');
      })
      .catch((error) => {
        setProjectsError(error.response?.data?.message || 'Projects could not be loaded.');
      });
    window.addEventListener('taskflow:projects-changed', refreshProjects);
    return () => window.removeEventListener('taskflow:projects-changed', refreshProjects);
  }, [isAuthenticated, refreshProjects]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
      if (event.key === 'Escape') setCommandPaletteOpen(false);
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/login');
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/tasks?search=${encodeURIComponent(query)}` : '/tasks');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f4]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-700" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf8f4] text-slate-900">
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link to="/" aria-label="TaskFlow home" className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700">
              <TaskFlowLogo />
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">{isRegisterPage ? 'Already a member?' : 'New to TaskFlow?'}</span>
              <Link
                to={isRegisterPage ? '/login' : '/register'}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isRegisterPage
                    ? 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
                    : 'bg-orange-700 text-white shadow-sm shadow-orange-200 hover:bg-orange-800'
                }`}
              >
                {isRegisterPage ? 'Sign in' : 'Create account'}
              </Link>
            </div>
          </div>
        </header>
        <main className={isAuthPage ? 'w-full' : 'mx-auto max-w-7xl px-5 sm:px-8'}>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f4] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <Link to="/" aria-label="TaskFlow home" className="flex h-[76px] items-center border-b border-slate-100 px-6">
          <TaskFlowLogo />
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-6">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">Workspace</div>
          <div className="relative mb-5">
            <button type="button" aria-expanded={workspaceMenuOpen} aria-haspopup="menu" onClick={() => setWorkspaceMenuOpen((open) => !open)} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-sm font-bold text-orange-800">
                {(user?.fullname || 'Y').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-800">{workspaceLabel}</div>
                <div className="text-xs text-slate-500">{activeProject ? 'Shared team workspace' : `${projects.length} team workspace${projects.length === 1 ? '' : 's'}`}</div>
              </div>
              <LuChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            {workspaceMenuOpen && (
              <div role="menu" aria-label="Choose a workspace" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button type="button" role="menuitem" onClick={() => openWorkspace()} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">All workspaces</button>
                <button type="button" role="menuitem" onClick={() => openWorkspace('personal')} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">Personal workspace</button>
                {projects.length > 0 && <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Team workspaces</p>}
                {projects.map((project) => (
                  <button key={project._id} type="button" role="menuitem" onClick={() => openWorkspace(project._id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-900">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${projectDots[project.color] || projectDots.orange}`} />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
                <Link to="/projects?new=1" role="menuitem" onClick={() => setWorkspaceMenuOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-2.5 text-sm font-semibold text-orange-800 hover:bg-orange-50">
                  <LuPlus aria-hidden="true" className="h-4 w-4" />Create team workspace
                </Link>
              </div>
            )}
          </div>
          <nav aria-label="Main navigation" className="space-y-1">
            {navigation.map((item) => {
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(`${item.path}/`));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-orange-50 text-orange-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon aria-hidden="true" className={`h-[18px] w-[18px] ${active ? 'text-orange-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mb-3 mt-9 flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-400">Team workspaces</span>
            <Link to="/projects" aria-label="Create or manage projects" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><LuPlus aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          <Link to="/projects" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-orange-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-slate-300"><LuPlus aria-hidden="true" className="h-3.5 w-3.5" /></span>
            <span>Create team workspace</span>
          </Link>
          {projects.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {projects.slice(0, 4).map((project) => (
                <Link key={project._id} to={`/tasks?projectId=${project._id}`} className="flex min-w-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-orange-800">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${projectDots[project.color] || projectDots.orange}`} />
                  <span className="truncate">{project.name}</span>
                </Link>
              ))}
              {projects.length > 4 && <Link to="/projects" className="block px-3 py-2 text-xs font-medium text-slate-400 hover:text-orange-800">+{projects.length - 4} more</Link>}
            </div>
          )}
          {projectsError && <p role="alert" className="mt-2 px-3 text-xs text-rose-600">{projectsError}</p>}
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-white p-3">
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-slate-50 p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-800">
              {(user?.fullname || 'Y').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-800" title={user?.fullname || 'Your account'}>{user?.fullname || 'Your account'}</div>
            </div>
            <button type="button" onClick={handleLogout} title="Sign out" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700">
              <LuLogOut aria-hidden="true" className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
          {logoutError && <p role="alert" className="mt-2 px-2 text-xs text-red-600">{logoutError}</p>}
        </div>
      </aside>

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex h-[68px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <Link to="/" aria-label="TaskFlow home" className="rounded-lg">
                <TaskFlowLogo markClassName="h-8 w-8" textClassName="text-lg" />
              </Link>
            </div>
            <form onSubmit={handleSearch} role="search" className="hidden max-w-xl flex-1 sm:block">
              <label className="sr-only" htmlFor="global-search">Search tasks</label>
              <div className="relative">
                <LuSearch aria-hidden="true" className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                <input
                  id="global-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks by name or details..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-16 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50"
                />
                <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 md:block">Enter</kbd>
              </div>
            </form>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                title="Quick actions (Ctrl+K)"
                aria-label="Open quick actions"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-700"
              >
                <LuCommand aria-hidden="true" className="h-4 w-4" />
                <span className="hidden text-xs font-medium sm:inline">Quick actions</span>
                <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[10px] text-slate-400 md:inline">Ctrl K</kbd>
              </button>
              <span className="hidden text-sm text-slate-500 md:inline">Good to see you,</span>
              <span className="hidden text-sm font-semibold text-slate-800 md:inline">{user?.fullname?.split(' ')[0] || 'there'}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-800">
                {(user?.fullname || 'Y').slice(0, 1).toUpperCase()}
              </div>
              <button type="button" onClick={handleLogout} aria-label="Sign out" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden">
                <LuLogOut aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            {navigation.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${active ? 'bg-orange-50 text-orange-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <item.icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto min-h-[calc(100vh-68px)] max-w-[1440px] px-4 pb-10 sm:px-7 lg:px-9">
          {children}
        </main>
      </div>
      {commandPaletteOpen && <CommandPalette onClose={() => setCommandPaletteOpen(false)} />}
    </div>
  );
};

export default Layout;
