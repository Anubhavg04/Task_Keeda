import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LuPlus, LuX } from 'react-icons/lu';
import { noteAPI, projectAPI } from '../services/api.js';
import { EmptyState, ErrorState, LoadingState, PageHeading, buttonPrimary, inputClass } from '../components/WorkspaceUI.jsx';

const blankNote = { title: '', content: '', projectId: '' };

const NotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [draft, setDraft] = useState(blankNote);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notesResponse, projectsResponse] = await Promise.all([
        noteAPI.getNotes(activeProjectId ? { projectId: activeProjectId } : {}),
        projectAPI.getProjects(),
      ]);
      setNotes(notesResponse.data);
      setProjects(projectsResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query))
      : notes;
  }, [notes, search]);

  const startCreate = useCallback(() => {
    setDraft({ ...blankNote, projectId: activeProjectId });
    setEditingId('new');
  }, [activeProjectId]);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    startCreate();
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, startCreate]);

  const startEdit = (note) => {
    setDraft({ title: note.title, content: note.content, projectId: note.project?._id || '' });
    setEditingId(note._id);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingId === 'new') {
        const response = await noteAPI.createNote(draft);
        if (!activeProjectId || draft.projectId === activeProjectId) {
          setNotes((current) => [response.data, ...current]);
        }
        toast.success('Note created');
      } else {
        const response = await noteAPI.updateNote(editingId, draft);
        setNotes((current) => current.map((note) => note._id === editingId ? response.data : note));
        toast.success('Note saved');
      }
      setEditingId('');
      setDraft(blankNote);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not save your note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (note) => {
    if (!window.confirm(`Delete "${note.title}"?`)) return;
    try {
      await noteAPI.deleteNote(note._id);
      setNotes((current) => current.filter((item) => item._id !== note._id));
      toast.success('Note deleted');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete the note');
    }
  };

  return (
    <div className="py-7 sm:py-9">
      <PageHeading
        eyebrow="Ideas, captured"
        title="Notes"
        description="Keep decisions, meeting notes, and helpful context close to the work. Project notes are shared with your team."
        action={<button type="button" onClick={startCreate} className={buttonPrimary}><LuPlus aria-hidden="true" className="h-4 w-4" />New note</button>}
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Search notes</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your notes..." className={inputClass} />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Filter notes by project</span>
          <select value={activeProjectId} onChange={(event) => setSearchParams(event.target.value ? { projectId: event.target.value } : {})} className={inputClass}>
            <option value="">All notes</option>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
          </select>
        </label>
      </div>

      {error && <div className="mb-5"><ErrorState message={error} onRetry={loadData} /></div>}
      {error ? null : loading ? <LoadingState label="Loading your notes..." /> : (
        <>
          {editingId === 'new' && (
            <form onSubmit={handleSave} className="mb-5 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">New note</h2>
                <button type="button" onClick={() => setEditingId('')} className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100">Cancel</button>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Title
                  <input autoFocus required maxLength={120} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Give this note a clear title" className={`${inputClass} mt-2`} />
                </label>
                <label className="block text-sm font-medium text-slate-700">Note
                  <textarea rows={5} maxLength={20000} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} placeholder="Capture the details, decisions, or ideas you want to remember..." className={`${inputClass} mt-2 resize-y`} />
                </label>
                <label className="block text-sm font-medium text-slate-700">Save in
                  <select value={draft.projectId} onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))} className={`${inputClass} mt-2`}>
                    <option value="">Personal notes</option>
                    {projects.map((project) => <option key={project._id} value={project._id}>{project.name} · shared</option>)}
                  </select>
                </label>
                <div className="flex justify-end">
                  <button type="submit" disabled={saving} className={buttonPrimary}>{saving ? 'Saving...' : 'Save note'}</button>
                </div>
              </div>
            </form>
          )}

          {visibleNotes.length === 0 ? (
            <EmptyState title={search ? 'No matching notes' : "A space for your team's knowledge"} description={search ? 'Try another search phrase, or clear the search field.' : 'Write a quick idea, capture a project decision, or save details your team can use later.'} action={!search && <button type="button" onClick={startCreate} className={buttonPrimary}>Write a note</button>} />
          ) : (
            <section aria-label="Notes" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {visibleNotes.map((note) => (
                <article key={note._id} className="flex min-h-56 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 transition hover:shadow-md">
                  {editingId === note._id ? (
                    <form onSubmit={handleSave} className="flex flex-1 flex-col gap-3">
                      <label className="text-sm font-medium text-slate-700">Title
                        <input required maxLength={120} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className={`${inputClass} mt-1.5`} />
                      </label>
                      <label className="flex flex-1 flex-col text-sm font-medium text-slate-700">Note
                        <textarea rows={5} maxLength={20000} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} className={`${inputClass} mt-1.5 flex-1 resize-y`} />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId('')} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Cancel</button>
                        <button type="submit" disabled={saving} className={buttonPrimary}>{saving ? 'Saving...' : 'Save changes'}</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-slate-900">{note.title}</h2>
                          <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${note.project ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>{note.project?.name || 'Personal'}</span>
                        </div>
                        <button type="button" onClick={() => handleDelete(note)} aria-label={`Delete ${note.title}`} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><LuX aria-hidden="true" className="h-4 w-4" /></button>
                      </div>
                      <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{note.content || 'No note content yet.'}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="text-xs text-slate-400">Edited {new Date(note.updatedAt).toLocaleDateString()}</span>
                        <button type="button" onClick={() => startEdit(note)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50">Edit</button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default NotesPage;
