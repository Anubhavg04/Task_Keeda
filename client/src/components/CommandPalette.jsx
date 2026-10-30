import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartNoAxesColumn,
  LuFolderKanban,
  LuGauge,
  LuLayoutDashboard,
  LuListTodo,
  LuNotebookPen,
  LuPlus,
  LuSearch,
  LuBellRing,
  LuScale,
} from 'react-icons/lu';

const commands = [
  { label: 'Go to overview', detail: 'Your workspace at a glance', path: '/', icon: LuLayoutDashboard, group: 'Navigate' },
  { label: 'Browse tasks', detail: 'Search, filter, and update work', path: '/tasks', icon: LuListTodo, group: 'Navigate' },
  { label: 'Manage team workspaces', detail: 'Shared spaces, projects, and teammates', path: '/projects', icon: LuFolderKanban, group: 'Navigate' },
  { label: 'Open calendar', detail: 'Upcoming dates and deadlines', path: '/calendar', icon: LuCalendarDays, group: 'Navigate' },
  { label: 'Browse notes', detail: 'Personal and shared knowledge', path: '/notes', icon: LuNotebookPen, group: 'Navigate' },
  { label: 'View reports', detail: 'Progress and project health', path: '/reports', icon: LuChartNoAxesColumn, group: 'Navigate' },
  { label: 'Open delivery control tower', detail: 'Spot schedule risk and rebalance effort', path: '/control-tower', icon: LuGauge, group: 'Navigate' },
  { label: 'Simulate a plan change', detail: 'Preview scope, deadline, and estimate impact', path: '/impact-simulator', icon: LuScale, group: 'Navigate' },
  { label: 'Phone notification settings', detail: 'Enable or manage mobile push alerts', path: '/notifications', icon: LuBellRing, group: 'Navigate' },
  { label: 'Create a task', detail: 'Capture a new action item', path: '/tasks?new=1', icon: LuPlus, group: 'Create' },
  { label: 'Create a project', detail: 'Start a shared workspace', path: '/projects?new=1', icon: LuPlus, group: 'Create' },
  { label: 'Write a note', detail: 'Capture a decision or idea', path: '/notes?new=1', icon: LuPlus, group: 'Create' },
];

const CommandPalette = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = commands.filter((command) => (
      !normalizedQuery || `${command.label} ${command.detail} ${command.group}`.toLowerCase().includes(normalizedQuery)
    ));

    if (!normalizedQuery) return matches;
    return [
      { label: `Search tasks for "${query.trim()}"`, detail: 'Find matching titles and descriptions', path: `/tasks?search=${encodeURIComponent(query.trim())}`, icon: LuSearch, group: 'Search' },
      ...matches,
    ];
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runCommand = (command) => {
    navigate(command.path);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (!filteredCommands.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filteredCommands.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (event.key === 'Enter' && filteredCommands[activeIndex]) {
      event.preventDefault();
      runCommand(filteredCommands[activeIndex]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/35 px-4 pt-[12vh] backdrop-blur-[2px] sm:pt-[16vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-label="Quick actions" className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <LuSearch aria-hidden="true" className="h-5 w-5 shrink-0 text-orange-700" />
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search commands"
            aria-expanded="true"
            aria-controls="command-results"
            aria-activedescendant={filteredCommands[activeIndex] ? `command-${activeIndex}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, tasks, or actions..."
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0"
          />
          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-400">ESC</kbd>
        </div>
        <div id="command-results" role="listbox" aria-label="Quick actions" className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {filteredCommands.length ? filteredCommands.map((command, index) => (
            <button
              type="button"
              id={`command-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              key={`${command.group}-${command.label}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runCommand(command)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeIndex === index ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activeIndex === index ? 'bg-white text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                <command.icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-800">{command.label}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{command.detail}</span>
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:inline">{command.group}</span>
              {activeIndex === index && <LuArrowRight aria-hidden="true" className="h-4 w-4 text-orange-700" />}
            </button>
          )) : (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No actions found. Try a page name or task keyword.</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-[10px] text-slate-400">
          <span>Navigate your workspace without losing focus</span>
          <span><kbd className="rounded border border-slate-200 bg-white px-1 py-0.5">↑</kbd> <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5">↓</kbd> to move · Enter to open</span>
        </div>
      </section>
    </div>
  );
};

export default CommandPalette;
