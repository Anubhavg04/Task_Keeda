import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuPlus } from 'react-icons/lu';
import { useAuth } from '../context/useAuth.js';
import { projectAPI } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, buttonPrimary, inputClass } from '../components/WorkspaceUI.jsx';

const colors = {
  orange: { edge: 'border-t-orange-500', badge: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', button: 'text-orange-700 hover:bg-orange-50' },
  blue: { edge: 'border-t-blue-500', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500', button: 'text-blue-700 hover:bg-blue-50' },
  emerald: { edge: 'border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', button: 'text-emerald-700 hover:bg-emerald-50' },
  amber: { edge: 'border-t-amber-500', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500', button: 'text-amber-700 hover:bg-amber-50' },
  rose: { edge: 'border-t-rose-500', badge: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500', button: 'text-rose-700 hover:bg-rose-50' },
};

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: 'orange' });
  const [memberEmails, setMemberEmails] = useState({});
  const [busyProject, setBusyProject] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await projectAPI.getProjects();
      setProjects(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setShowCreate(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await projectAPI.createProject(form);
      setProjects((current) => [response.data, ...current]);
      window.dispatchEvent(new Event('taskflow:projects-changed'));
      setForm({ name: '', description: '', color: 'orange' });
      setShowCreate(false);
      toast.success('Project created');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not create project');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (project) => {
    const email = memberEmails[project._id]?.trim();
    if (!email) return;
    setBusyProject(project._id);
    try {
      const response = await projectAPI.addMember(project._id, email);
      setProjects((current) => current.map((item) => item._id === project._id ? response.data : item));
      setMemberEmails((current) => ({ ...current, [project._id]: '' }));
      toast.success('Team member added');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not add this member');
    } finally {
      setBusyProject('');
    }
  };

  const handleRemoveMember = async (project, member) => {
    if (!window.confirm(`Remove ${member.fullname} from ${project.name}?`)) return;
    setBusyProject(project._id);
    try {
      const response = await projectAPI.removeMember(project._id, member._id);
      setProjects((current) => current.map((item) => item._id === project._id ? response.data : item));
      toast.success('Team member removed');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not remove this member');
    } finally {
      setBusyProject('');
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? Its tasks and notes will become private to their creators.`)) return;
    setBusyProject(project._id);
    try {
      await projectAPI.deleteProject(project._id);
      setProjects((current) => current.filter((item) => item._id !== project._id));
      window.dispatchEvent(new Event('taskflow:projects-changed'));
      toast.success('Project deleted');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete project');
    } finally {
      setBusyProject('');
    }
  };

  return (
    <div className="py-7 sm:py-9">
      <PageHeading
        eyebrow="Work, together"
        title="Team workspaces"
        description="Team workspaces for shared plans, tasks, and notes. Create a workspace, then invite teammates who already have a TaskFlow account."
        action={<button type="button" onClick={() => setShowCreate((visible) => !visible)} className={buttonPrimary}>{showCreate ? 'Close' : <><LuPlus aria-hidden="true" className="h-4 w-4" />New team workspace</>}</button>}
      />

      {showCreate && (
        <form onSubmit={handleCreate} className="mb-7 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">Create a team workspace</h2>
            <p className="mt-1 text-sm text-slate-500">A shared home for a team, client, campaign, or initiative.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Project name <span className="text-rose-500">*</span>
              <input autoFocus required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Website redesign" className={`${inputClass} mt-2`} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Project color
              <select value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} className={`${inputClass} mt-2`}>
                {Object.keys(colors).map((color) => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              What is this project about?
              <textarea rows={2} maxLength={1000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Add a short description and give your team some context..." className={`${inputClass} mt-2 resize-y`} />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className={buttonPrimary}>{saving ? 'Creating...' : 'Create team workspace'}</button>
          </div>
        </form>
      )}

      {error && <div className="mb-5"><ErrorState message={error} onRetry={loadProjects} /></div>}
      {error ? null : loading ? <LoadingState label="Loading your projects..." /> : projects.length === 0 ? (
        <EmptyState title="Give your team a shared home" description="Create a team workspace to bring people, tasks, and reference notes together. You can invite registered TaskFlow users after creating it." action={<button type="button" onClick={() => setShowCreate(true)} className={buttonPrimary}>Create your first team workspace</button>} />
      ) : (
        <section aria-label="Projects" className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project) => {
            const theme = colors[project.color] || colors.orange;
            const isOwner = String(project.owner?._id) === String(user?._id || user?.id);
            const team = [project.owner, ...(project.members || [])].filter(Boolean);
            return (
              <article key={project._id} className={`overflow-hidden rounded-2xl border border-slate-200/80 border-t-[3px] ${theme.edge} bg-white shadow-sm shadow-slate-200/30`}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${theme.dot}`} />
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-lg font-bold text-slate-900">{project.name}</h2>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>{isOwner ? 'Owner' : 'Member'}</span>
                    </div>
                    {isOwner && (
                      <button type="button" onClick={() => handleDeleteProject(project)} disabled={busyProject === project._id} aria-label={`Delete ${project.name}`} title="Delete project" className="rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">Delete</button>
                    )}
                  </div>
                  <p className="mt-4 min-h-10 text-sm leading-6 text-slate-500">{project.description || 'A shared space to organize work and keep the team moving.'}</p>
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team · {team.length}</span>
                      <div className="flex -space-x-2">
                        {team.slice(0, 5).map((member) => (
                          <span key={member._id} title={member.fullname} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600">
                            {(member.fullname || '?').slice(0, 1).toUpperCase()}
                          </span>
                        ))}
                        {team.length > 5 && <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-500">+{team.length - 5}</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {team.map((member) => (
                        <div key={member._id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-slate-600">{member.fullname}{String(member._id) === String(project.owner?._id) ? ' · Owner' : ''}</span>
                          {isOwner && String(member._id) !== String(project.owner?._id) && (
                            <button type="button" disabled={busyProject === project._id} onClick={() => handleRemoveMember(project, member)} className="shrink-0 rounded px-2 py-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">Remove</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {isOwner && (
                    <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); handleInvite(project); }}>
                      <label className="sr-only" htmlFor={`invite-${project._id}`}>Invite by email</label>
                      <input id={`invite-${project._id}`} type="email" required maxLength={254} value={memberEmails[project._id] || ''} onChange={(event) => setMemberEmails((current) => ({ ...current, [project._id]: event.target.value }))} placeholder="Add teammate by email" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50" />
                      <button type="submit" disabled={busyProject === project._id} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">{busyProject === project._id ? 'Adding...' : 'Invite'}</button>
                    </form>
                  )}
                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                    <Link to={`/tasks?projectId=${project._id}`} className={`flex-1 rounded-lg px-3 py-2 text-center text-xs font-semibold transition ${theme.button}`}>View tasks</Link>
                    <Link to={`/notes?projectId=${project._id}`} className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-100">Project notes</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default ProjectsPage;
