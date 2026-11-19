import { getTaskPriorityVisual, getTaskStatusVisual } from '../utils/taskVisuals.js';

export const TaskStatusBadge = ({ status, count, className = '' }) => {
  const visual = getTaskStatusVisual(status);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${visual.badge} ${className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${visual.dot}`} />
      {visual.label}{count === undefined ? '' : ` · ${count}`}
    </span>
  );
};

export const TaskPriorityIndicator = ({ priority, compact = false, count, className = '' }) => {
  const visual = getTaskPriorityVisual(priority);
  return (
    <span
      aria-label={`Priority: ${visual.label}${count === undefined ? '' : `, ${count} tasks`}`}
      title={`Priority: ${visual.label}`}
      className={`${compact ? 'inline-flex h-3 w-3 shrink-0 items-center justify-center' : `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${visual.badge}`} ${className}`}
    >
      <span aria-hidden="true" className={`${compact ? 'h-2.5 w-2.5' : 'h-2 w-2'} rounded-full ${visual.dot}`} />
      {!compact && <>{visual.label}{count === undefined ? '' : ` · ${count}`}</>}
    </span>
  );
};
