import React from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { LuCalendarDays, LuGripVertical, LuPencil } from 'react-icons/lu';
import { getTaskStatusVisual, taskStatusOrder } from '../utils/taskVisuals.js';
import { TaskPriorityIndicator, TaskStatusBadge } from './TaskVisuals.jsx';
import TaskForm from './TaskForm.jsx';
import { metaTextClass, taskTitleClass } from './WorkspaceUI.jsx';
import { formatDateOnly } from '../utils/dates.js';

const initialsFor = (name) => name
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part[0])
  .slice(0, 2)
  .join('')
  .toUpperCase();

const BoardCard = ({ task, editing, statusAnimated, onEdit, onCloseEdit, onSaved }) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: task._id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/30 transition-all duration-200 ease-out motion-reduce:transform-none ${isDragging ? 'z-10 opacity-50 shadow-lg' : 'hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-300/40'} ${statusAnimated ? 'task-status-pop' : ''}`}
    >
      {editing ? (
        <TaskForm task={task} onClose={onCloseEdit} onSaved={onSaved} />
      ) : (
        <>
          <div className="flex items-start gap-2">
            <h3 className={`min-w-0 flex-1 break-words ${taskTitleClass} text-slate-900`}>{task.title}</h3>
            <button
              ref={setActivatorNodeRef}
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Move ${task.title} to another status`}
              title="Drag to change status; use arrow keys to move"
              className="inline-flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-800 active:scale-95 active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
            >
              <LuGripVertical aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <p className={`mt-0.5 truncate ${metaTextClass}`}>{task.project?.name || 'Personal'}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <TaskPriorityIndicator priority={task.priority} />
            <span className={`inline-flex items-center gap-1 ${metaTextClass}`}>
              <LuCalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
              {task.dueDate ? formatDateOnly(task.dueDate, { month: 'short', day: 'numeric' }) : 'No due date'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span
              className="inline-flex min-w-0 items-center gap-2"
              aria-label={task.assignee?.fullname ? `Assigned to ${task.assignee.fullname}` : 'Unassigned'}
              title={task.assignee?.fullname || 'Unassigned'}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${task.assignee?.fullname ? 'bg-orange-100 text-orange-900' : 'border border-dashed border-slate-300 bg-slate-50 text-slate-500'}`}>
                {task.assignee?.fullname ? initialsFor(task.assignee.fullname) : '?'}
              </span>
              <span className="truncate text-xs leading-5 text-slate-600">{task.assignee?.fullname || 'Unassigned'}</span>
            </span>
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit ${task.title}`}
              title="Edit task"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-800 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-600"
            >
              <LuPencil aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </article>
  );
};

const BoardColumn = ({ status, tasks, editingTask, statusAnimationTaskId, onEdit, onCloseEdit, onSaved }) => {
  const visual = getTaskStatusVisual(status);
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${visual.label} column, ${tasks.length} tasks`}
      className={`min-h-[24rem] rounded-2xl border p-3 transition-colors ${isOver ? 'border-orange-300 bg-orange-50/70' : 'border-slate-200/80 bg-slate-50/80'}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <TaskStatusBadge status={status} />
        <span className="text-xs font-semibold text-slate-500">{tasks.length}</span>
      </div>
      <div className="space-y-2.5">
        {tasks.map((task) => (
          <BoardCard
            key={task._id}
            task={task}
            editing={editingTask?._id === task._id}
            statusAnimated={statusAnimationTaskId === task._id}
            onEdit={onEdit}
            onCloseEdit={onCloseEdit}
            onSaved={onSaved}
          />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-400">
            Drop a task here
          </p>
        )}
      </div>
    </section>
  );
};

const TaskBoard = ({ tasks, onStatusChange, editingTask, statusAnimationTaskId, onEdit, onCloseEdit, onSaved }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || !taskStatusOrder.includes(String(over.id))) return;
    const task = tasks.find((item) => item._id === active.id);
    if (task && task.status !== over.id) onStatusChange(task, String(over.id));
  };

  return (
    <section aria-label="Task board">
      <p className="mb-3 text-xs text-slate-500">Drag a card by its handle, or focus the handle and use arrow keys to move it between columns.</p>
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid min-w-[810px] grid-cols-3 gap-4">
            {taskStatusOrder.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={tasks.filter((task) => task.status === status)}
                editingTask={editingTask}
                statusAnimationTaskId={statusAnimationTaskId}
                onEdit={onEdit}
                onCloseEdit={onCloseEdit}
                onSaved={onSaved}
              />
            ))}
          </div>
        </DndContext>
      </div>
    </section>
  );
};

export default TaskBoard;
