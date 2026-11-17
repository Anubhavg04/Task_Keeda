import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LuPencil, LuRefreshCw, LuSend, LuTrash2, LuX } from 'react-icons/lu';
import { useAuth } from '../context/useAuth.js';
import { discussionAPI } from '../services/api.js';
import { ErrorState, inputClass } from './WorkspaceUI.jsx';

const DiscussionThread = ({ projectId, taskId, title, projectOwnerId, members = [] }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [mentionedIds, setMentionedIds] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [olderLoading, setOlderLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const requestSequence = useRef(0);
  const requestInFlight = useRef(false);
  const inputRef = useRef(null);
  const teammates = members.filter((member) => (
    member?._id && String(member._id) !== String(user?._id || user?.id)
  ));

  const loadMessages = useCallback(async (before, preserveExisting = false) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    const requestId = ++requestSequence.current;
    if (before) setOlderLoading(true);
    else setLoading(true);
    setError('');
    try {
      const response = await discussionAPI.getMessages(projectId, {
        ...(taskId ? { taskId } : {}),
        ...(before ? { before } : {}),
      });
      if (requestId !== requestSequence.current) return;
      setMessages((current) => {
        if (before) return [...response.data.messages, ...current];
        if (!preserveExisting) return response.data.messages;

        const merged = new Map(current.map((message) => [message._id, message]));
        response.data.messages.forEach((message) => merged.set(message._id, message));
        return [...merged.values()].sort((first, second) => (
          new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
        ));
      });
      setHasMore(response.data.hasMore);
      if (!before && !taskId && response.data.messages.length) {
        const lastMessage = response.data.messages[response.data.messages.length - 1];
        await discussionAPI.markRead(projectId, lastMessage._id);
        window.dispatchEvent(new Event('taskflow:discussions-read'));
      }
    } catch (requestError) {
      if (requestId !== requestSequence.current) return;
      setError(requestError.response?.data?.message || 'Could not load this discussion.');
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setOlderLoading(false);
      }
      requestInFlight.current = false;
    }
  }, [projectId, taskId]);

  useEffect(() => {
    setMessages([]);
    loadMessages();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages(undefined, true);
    }, 5000);
    return () => {
      window.clearInterval(intervalId);
      requestSequence.current += 1;
    };
  }, [loadMessages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || sending) return;

    setSending(true);
    setError('');
    setWarning('');
    try {
      const response = await discussionAPI.createMessage(projectId, {
        content: trimmedContent,
        ...(taskId ? { taskId } : {}),
        mentions: getMentionIds(),
      });
      setMessages((current) => [...current, response.data]);
      setContent('');
      setMentionedIds([]);
      setMentionQuery(null);
      setWarning(response.data.notificationWarning || '');
      if (!taskId) {
        await discussionAPI.markRead(projectId, response.data._id);
        window.dispatchEvent(new Event('taskflow:discussions-read'));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const updateContent = (value, cursorPosition) => {
    setContent(value);
    const beforeCursor = value.slice(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');
    const beforeAt = atIndex >= 0 ? beforeCursor.slice(0, atIndex) : '';
    const query = atIndex >= 0 ? beforeCursor.slice(atIndex + 1) : '';
    if (atIndex >= 0 && (!beforeAt || /\s$/.test(beforeAt)) && !/[\r\n]/.test(query)) {
      setMentionQuery({ start: atIndex, end: cursorPosition, query });
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (member, range = null) => {
    const start = range?.start ?? content.length;
    const end = range?.end ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const separator = before && !/\s$/.test(before) ? ' ' : '';
    const insertion = `${separator}@${member.fullname} `;
    const nextContent = `${before}${insertion}${after}`;
    const cursorPosition = before.length + insertion.length;
    setContent(nextContent);
    setMentionedIds((current) => current.includes(member._id) ? current : [...current, member._id]);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const getMentionIds = () => {
    const typedMatches = teammates.filter((member) => {
      const name = member.fullname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|\\s)@${name}(?=$|\\s|[,.!?])`, 'i').test(content);
    });
    const uniqueNames = new Set(typedMatches.map((member) => member.fullname.toLowerCase()));
    return [...new Set([
      ...mentionedIds.filter((id) => teammates.some((member) => (
        String(member._id) === String(id) && content.includes(`@${member.fullname}`)
      ))),
      ...typedMatches
        .filter((member) => uniqueNames.has(member.fullname.toLowerCase()))
        .filter((member) => typedMatches.filter((candidate) => candidate.fullname.toLowerCase() === member.fullname.toLowerCase()).length === 1)
        .map((member) => member._id),
    ])];
  };

  const handleEdit = async (message) => {
    const trimmedContent = editingContent.trim();
    if (!trimmedContent || sending) return;
    setSending(true);
    setError('');
    try {
      const response = await discussionAPI.updateMessage(projectId, message._id, trimmedContent);
      setMessages((current) => current.map((item) => item._id === message._id ? response.data : item));
      setEditingMessageId('');
      setEditingContent('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not edit this message.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (message) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    setSending(true);
    setError('');
    try {
      await discussionAPI.deleteMessage(projectId, message._id);
      setMessages((current) => current.filter((item) => item._id !== message._id));
      if (editingMessageId === message._id) {
        setEditingMessageId('');
        setEditingContent('');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete this message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-label={title} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">Checks for new messages every 5 seconds</p>
        </div>
        <button
          type="button"
          onClick={() => loadMessages(undefined, true)}
          disabled={loading || olderLoading || sending}
          aria-label="Refresh discussion"
          title="Refresh discussion"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-50"
        >
          <LuRefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="mb-3"><ErrorState message={error} onRetry={() => loadMessages()} /></div>}
      {warning && <p role="status" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{warning}</p>}

      <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-white p-3">
        {hasMore && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => loadMessages(messages[0]?._id)}
              disabled={olderLoading || loading}
              className="text-xs font-semibold text-orange-800 hover:underline disabled:opacity-50"
            >
              {olderLoading ? 'Loading older messages...' : 'Load older messages'}
            </button>
          </div>
        )}
        {loading && messages.length === 0 ? (
          <p role="status" className="py-5 text-center text-sm text-slate-500">Loading discussion...</p>
        ) : messages.length === 0 ? (
          <p className="py-5 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p>
        ) : messages.map((message) => {
          const isAuthor = String(message.author?._id) === String(user?._id || user?.id);
          const isOwner = String(projectOwnerId) === String(user?._id || user?.id);
          const canEdit = isAuthor;
          const canDelete = isAuthor || isOwner;
          return (
          <article key={message._id} className="rounded-lg border border-slate-100 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-xs font-semibold text-slate-800">{message.author?.fullname || 'Team member'}</span>
              <time dateTime={message.createdAt} className="text-[11px] text-slate-400">
                {new Date(message.createdAt).toLocaleString()}{message.updatedAt > message.createdAt ? ' · edited' : ''}
              </time>
            </div>
            {editingMessageId === message._id ? (
              <form onSubmit={(event) => { event.preventDefault(); handleEdit(message); }} className="mt-2 space-y-2">
                <textarea
                  autoFocus
                  required
                  maxLength={2000}
                  value={editingContent}
                  onChange={(event) => setEditingContent(event.target.value)}
                  aria-label="Edit message"
                  className={`${inputClass} resize-y`}
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setEditingMessageId(''); setEditingContent(''); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
                    <LuX aria-hidden="true" className="h-3.5 w-3.5" />Cancel
                  </button>
                  <button type="submit" disabled={sending || !editingContent.trim()} className="rounded-lg bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
                    {sending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{message.content}</p>
                {(canEdit || canDelete) && (
                  <div className="mt-2 flex justify-end gap-1">
                    {canEdit && (
                      <button type="button" onClick={() => { setEditingMessageId(message._id); setEditingContent(message.content); }} aria-label="Edit message" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <LuPencil aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" onClick={() => handleDelete(message)} aria-label="Delete message" className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <LuTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </article>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Write a message</span>
          <textarea
            value={content}
            ref={inputRef}
            onChange={(event) => updateContent(event.target.value, event.target.selectionStart)}
            maxLength={2000}
            rows={2}
            placeholder="Write an update for your team..."
            className={`${inputClass} resize-y`}
          />
        </label>
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-orange-700 px-3 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LuSend aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </form>
      {mentionQuery && teammates.some((member) => member.fullname.toLowerCase().startsWith(mentionQuery.query.toLowerCase())) && (
        <div role="listbox" aria-label="Mention a teammate" className="mt-2 flex flex-wrap gap-1.5">
          {teammates
            .filter((member) => member.fullname.toLowerCase().startsWith(mentionQuery.query.toLowerCase()))
            .slice(0, 5)
            .map((member) => (
              <button
                key={member._id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => insertMention(member, mentionQuery)}
                className="rounded-full border border-orange-200 bg-white px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-orange-50"
              >
                @{member.fullname}
              </button>
            ))}
        </div>
      )}
      {teammates.length > 0 && (
        <label className="mt-2 flex items-center justify-end gap-2 text-[11px] text-slate-500">
          Mention teammate
          <select
            value=""
            onChange={(event) => {
              const member = teammates.find((item) => String(item._id) === event.target.value);
              if (member) insertMention(member);
            }}
            className="max-w-40 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            aria-label="Choose a teammate to mention"
          >
            <option value="">Choose...</option>
            {teammates.map((member) => <option key={member._id} value={member._id}>{member.fullname}</option>)}
          </select>
        </label>
      )}
      <p className="mt-1.5 text-right text-[11px] text-slate-400">{content.length}/2000</p>
    </section>
  );
};

export default DiscussionThread;
