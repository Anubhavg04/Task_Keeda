import React, { useEffect, useState } from 'react';
import { useTasks } from '../hooks/useTasks.js';
import toast from 'react-hot-toast';
import { projectAPI, taskAPI } from '../services/api.js';
import { buttonPrimary, buttonSecondary, inputClass } from './WorkspaceUI.jsx';

const TaskForm = ({ task, onClose, onSaved, defaultProjectId = '' }) => {
  const { createTask, updateTask } = useTasks();
  const [projects, setProjects] = useState([]);
  const [projectsError, setProjectsError] = useState('');
  const [dependencyCandidates, setDependencyCandidates] = useState([]);
  const [dependenciesError, setDependenciesError] = useState('');
  const [dependenciesLoading, setDependenciesLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    estimatedHours: task?.estimatedHours ?? 2,
    dependsOn: (task?.dependsOn || []).filter(Boolean).map((dependency) => dependency._id || dependency),
    projectId: task?.project?._id || task?.project || defaultProjectId,
    assigneeId: task?.assignee?._id || task?.assignee || '',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    projectAPI.getProjects()
      .then((response) => setProjects(response.data))
      .catch((error) => {
        setProjectsError(error.response?.data?.message || 'Project choices could not be loaded.');
      });
  }, []);

  useEffect(() => {
    let active = true;
    setDependencyCandidates([]);
    setDependenciesLoading(true);
    setDependenciesError('');
    taskAPI.getTasks({
      projectId: formData.projectId || 'personal',
      page: 1,
      limit: 100,
      sort: 'title',
      order: 'asc',
    })
      .then((response) => {
        if (active) {
          const candidates = new Map(
            response.data.tasks
              .filter((candidate) => candidate._id !== task?._id)
              .map((candidate) => [candidate._id, candidate])
          );
          const taskProjectId = task?.project?._id || task?.project || '';
          if (String(taskProjectId) === String(formData.projectId || '')) {
            (task?.dependsOn || []).filter(Boolean).forEach((dependency) => {
              if (dependency && typeof dependency === 'object') candidates.set(dependency._id, dependency);
            });
          }
          setDependencyCandidates([...candidates.values()]);
        }
      })
      .catch((error) => {
        if (active) setDependenciesError(error.response?.data?.message || 'Prerequisite tasks could not be loaded.');
      })
      .finally(() => {
        if (active) setDependenciesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [formData.projectId, task, task?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'estimatedHours' ? Number(value) : value,
      ...(name === 'projectId' ? { assigneeId: '', dependsOn: [] } : {}),
    }));
  };

  const toggleDependency = (dependencyId) => {
    setFormData((current) => {
      if (current.dependsOn.includes(dependencyId)) {
        return { ...current, dependsOn: current.dependsOn.filter((id) => id !== dependencyId) };
      }
      if (current.dependsOn.length >= 20) {
        toast.error('Tasks can have up to 20 prerequisites');
        return current;
      }
      return { ...current, dependsOn: [...current.dependsOn, dependencyId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedTask;
      if (task) {
        savedTask = await updateTask(task._id, formData);
        toast.success('Task updated successfully');
      } else {
        savedTask = await createTask(formData);
        toast.success('Task created successfully');
        setFormData({
          title: '',
          description: '',
          status: 'todo',
          priority: 'medium',
          estimatedHours: 2,
          dependsOn: [],
          projectId: '',
          assigneeId: '',
          dueDate: '',
        });
      }
      if (onSaved) await onSaved(savedTask);
      if (onClose) onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 text-xl font-bold text-slate-900">
        {task ? 'Edit task' : 'Create a task'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            maxLength={200}
            className={inputClass}
            placeholder="What needs to get done?"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            maxLength={5000}
            className={`${inputClass} resize-y`}
            placeholder="Add helpful context, links, or details..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className={inputClass}>
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="mb-2 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label htmlFor="projectId" className="mb-2 block text-sm font-medium text-slate-700">
              Team workspace
            </label>
            <select id="projectId" name="projectId" value={formData.projectId} onChange={handleChange} className={inputClass}>
              <option value="">Personal workspace</option>
              {projects.map((project) => <option key={project._id} value={project._id}>{project.name} · team</option>)}
            </select>
            {projectsError && <p role="alert" className="mt-1 text-xs text-rose-600">{projectsError}</p>}
          </div>
          <div>
            <label htmlFor="assigneeId" className="mb-2 block text-sm font-medium text-slate-700">
              Assign to
            </label>
            <select
              id="assigneeId"
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              disabled={!formData.projectId}
              className={inputClass}
            >
              <option value="">{formData.projectId ? 'Unassigned' : 'Choose a project first'}</option>
              {projects.find((project) => project._id === formData.projectId)?.owner && (
                <option value={projects.find((project) => project._id === formData.projectId).owner._id}>
                  {projects.find((project) => project._id === formData.projectId).owner.fullname} · Owner
                </option>
              )}
              {(projects.find((project) => project._id === formData.projectId)?.members || []).map((member) => (
                <option key={member._id} value={member._id}>{member.fullname}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="mb-2 block text-sm font-medium text-slate-700">
              Due date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="estimatedHours" className="mb-2 block text-sm font-medium text-slate-700">
              Effort estimate (hours)
            </label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleChange}
              min="0.25"
              max="500"
              step="0.25"
              required
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">Used for workload planning and delivery forecasts.</p>
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-slate-700">Blocked by (optional prerequisites)</legend>
            <p className="mb-2 text-xs leading-5 text-slate-500">This task cannot be completed until its prerequisites are done. Dependencies stay within the selected workspace. Choose up to 20.</p>
            {dependenciesError && <p role="alert" className="mb-2 text-xs text-rose-600">{dependenciesError}</p>}
            {dependenciesLoading ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">Loading tasks in this workspace...</p>
            ) : dependencyCandidates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">No other tasks in this workspace to depend on yet.</p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {dependencyCandidates.map((candidate) => (
                  <label key={candidate._id} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.dependsOn.includes(candidate._id)}
                      onChange={() => toggleDependency(candidate._id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-700 focus:ring-orange-500"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-700">{candidate.title}</span>
                      <span className="mt-0.5 block capitalize text-slate-400">{candidate.status.replace('-', ' ')}</span>
                    </span>
                  </label>
                ))}
                <p className="px-2 pt-1 text-[10px] text-slate-400">Showing up to 100 tasks from this workspace.</p>
              </div>
            )}
          </fieldset>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className={`${buttonPrimary} flex-1`}
          >
            {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`${buttonSecondary} flex-1`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
