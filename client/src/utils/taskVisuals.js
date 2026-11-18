const statusVisuals = {
  todo: {
    label: 'To do',
    dot: 'bg-slate-600',
    bar: 'bg-slate-600',
    badge: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
  },
  'in-progress': {
    label: 'In progress',
    dot: 'bg-orange-600',
    bar: 'bg-orange-600',
    badge: 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
  },
  done: {
    label: 'Done',
    dot: 'bg-emerald-600',
    bar: 'bg-emerald-600',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
};

const priorityVisuals = {
  low: {
    label: 'Low',
    dot: 'bg-slate-600',
    bar: 'bg-slate-600',
    badge: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-blue-700',
    bar: 'bg-blue-700',
    badge: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
  },
  high: {
    label: 'High',
    dot: 'bg-amber-700',
    bar: 'bg-amber-700',
    badge: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  },
  urgent: {
    label: 'Urgent',
    dot: 'bg-rose-700',
    bar: 'bg-rose-700',
    badge: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200',
  },
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, '-');

export const getTaskStatusVisual = (status) => statusVisuals[normalizeKey(status)] || statusVisuals.todo;
export const getTaskPriorityVisual = (priority) => priorityVisuals[normalizeKey(priority)] || priorityVisuals.medium;
export const taskStatusOrder = ['todo', 'in-progress', 'done'];
export const taskPriorityOrder = ['urgent', 'high', 'medium', 'low'];
