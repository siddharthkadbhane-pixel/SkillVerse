'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  LayoutGrid, CheckSquare, StickyNote, BookMarked, Plus,
  Trash2, CheckCircle2, Clock, AlertCircle, ChevronRight,
} from 'lucide-react';

const TABS = ['Projects', 'Tasks', 'Notes', 'Knowledge Base'];
const TASK_STATUS = ['All', 'todo', 'in_progress', 'done'];

export default function WorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [kb, setKb] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Projects');
  const [taskFilter, setTaskFilter] = useState('All');

  // Create forms
  const [newNote, setNewNote] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, projRes, taskRes, noteRes, kbRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/notes').then(r => r.json()),
        fetch('/api/knowledge-base').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data ?? []);
      if (taskRes.status === 'fulfilled' && taskRes.value.success) setTasks(taskRes.value.data ?? []);
      if (noteRes.status === 'fulfilled' && noteRes.value.success) setNotes(noteRes.value.data ?? []);
      if (kbRes.status === 'fulfilled' && kbRes.value.success) setKb(kbRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNote.trim()) return;
    setSavingNote(true);
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNoteTitle, content: newNote }),
      });
      setNewNote('');
      setNewNoteTitle('');
      load();
    } finally {
      setSavingNote(false);
    }
  };

  const filteredTasks = taskFilter === 'All' ? tasks : tasks.filter(t => t.status === taskFilter);

  const taskStatusBadge = (status: string) => {
    if (status === 'done')        return <span className="sv-badge sv-badge-green"><CheckCircle2 style={{ width: 9, height: 9 }} />Done</span>;
    if (status === 'in_progress') return <span className="sv-badge sv-badge-blue"><Clock style={{ width: 9, height: 9 }} />In Progress</span>;
    return <span className="sv-badge sv-badge-zinc">To Do</span>;
  };

  const priorityBadge = (priority: string) => {
    if (priority === 'high')   return <span className="sv-badge sv-badge-red">High</span>;
    if (priority === 'medium') return <span className="sv-badge sv-badge-amber">Medium</span>;
    return <span className="sv-badge sv-badge-zinc">Low</span>;
  };

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Developer Workspace"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Developer Workspace</h1>
                <p className="sv-page-desc">Manage projects, tasks, notes, and knowledge</p>
              </div>
              <button className="sv-btn sv-btn-primary">
                <Plus style={{ width: 13, height: 13 }} />
                New Project
              </button>
            </div>

            {/* Stats */}
            <div className="sv-stats-row" style={{ marginBottom: 16 }}>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Projects</div>
                <div className="sv-stat-value">{loading ? '—' : projects.length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Open Tasks</div>
                <div className="sv-stat-value">{loading ? '—' : tasks.filter(t => t.status !== 'done').length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Notes</div>
                <div className="sv-stat-value">{loading ? '—' : notes.length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">KB Articles</div>
                <div className="sv-stat-value">{loading ? '—' : kb.length}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="sv-tabs" style={{ marginBottom: 16 }}>
              {TABS.map(tab => (
                <button key={tab} className={`sv-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Projects tab */}
            {activeTab === 'Projects' && (
              <div className="sv-card">
                <div style={{ overflowX: 'auto' }}>
                  <table className="sv-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Repo</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array(4).fill(0).map((_, i) => (
                        <tr key={i}>{[160, 200, 80, 80, 90].map((w, j) => (
                          <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                        ))}</tr>
                      )) : projects.length === 0 ? (
                        <tr><td colSpan={5}>
                          <div className="sv-empty">
                            <LayoutGrid style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                            <div className="sv-empty-title">No projects yet</div>
                            <div className="sv-empty-desc">Create a project to organize your work, tasks, and documentation.</div>
                            <button className="sv-btn sv-btn-primary" style={{ marginTop: 8 }}>
                              <Plus style={{ width: 13, height: 13 }} />Create Project
                            </button>
                          </div>
                        </td></tr>
                      ) : projects.map((p, i) => (
                        <tr key={i}>
                          <td className="sv-td-primary">{p.name || p.title}</td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.description || '—'}
                          </td>
                          <td>
                            <span className={`sv-badge ${p.status === 'active' ? 'sv-badge-green' : p.status === 'completed' ? 'sv-badge-blue' : 'sv-badge-zinc'}`}>
                              {p.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--sv-accent)' }}>
                            {p.repoUrl ? <a href={p.repoUrl} target="_blank" style={{ color: 'inherit' }}>View Repo</a> : '—'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tasks tab */}
            {activeTab === 'Tasks' && (
              <div className="sv-card">
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--sv-border)', display: 'flex', gap: 6 }}>
                  {TASK_STATUS.map(s => (
                    <button
                      key={s}
                      onClick={() => setTaskFilter(s)}
                      className={`sv-btn sv-btn-sm ${taskFilter === s ? 'sv-btn-primary' : 'sv-btn-ghost'}`}
                    >
                      {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--sv-text-subtle)', alignSelf: 'center' }}>
                    {filteredTasks.length} tasks
                  </span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="sv-table">
                    <thead>
                      <tr>
                        <th>Task</th>
                        <th>Project</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array(5).fill(0).map((_, i) => (
                        <tr key={i}>{[200, 120, 80, 90, 90].map((w, j) => (
                          <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                        ))}</tr>
                      )) : filteredTasks.length === 0 ? (
                        <tr><td colSpan={5}>
                          <div className="sv-empty" style={{ padding: 24 }}>
                            <CheckSquare style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                            <div className="sv-empty-title">No tasks found</div>
                          </div>
                        </td></tr>
                      ) : filteredTasks.map((t, i) => (
                        <tr key={i}>
                          <td className="sv-td-primary">{t.title || t.taskName}</td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{t.projectName || '—'}</td>
                          <td>{priorityBadge(t.priority || 'medium')}</td>
                          <td>{taskStatusBadge(t.status || 'todo')}</td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes tab */}
            {activeTab === 'Notes' && (
              <div className="sv-grid-2-1">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* New note form */}
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StickyNote style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                        <span className="sv-card-title">New Note</span>
                      </div>
                    </div>
                    <form onSubmit={saveNote} style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input
                        className="sv-input"
                        placeholder="Note title..."
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        required
                      />
                      <textarea
                        className="sv-input"
                        placeholder="Write your note..."
                        rows={4}
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        style={{ resize: 'vertical' }}
                        required
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" disabled={savingNote} className="sv-btn sv-btn-primary">
                          {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </form>
                  </div>
                  {/* Notes list */}
                  <div className="sv-card">
                    <div style={{ overflowX: 'auto' }}>
                      <table className="sv-table">
                        <thead>
                          <tr><th>Title</th><th>Preview</th><th>Saved</th></tr>
                        </thead>
                        <tbody>
                          {notes.map((n, i) => (
                            <tr key={i}>
                              <td className="sv-td-primary">{n.title}</td>
                              <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {n.content}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                                {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">Recent Notes</span>
                  </div>
                  <div style={{ padding: '8px' }}>
                    {notes.length === 0 ? (
                      <div className="sv-empty" style={{ padding: 24 }}>
                        <StickyNote style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                        <div className="sv-empty-title">No notes yet</div>
                      </div>
                    ) : notes.slice(0, 5).map((n, i) => (
                      <div key={i} style={{ padding: '9px 6px', borderBottom: i < Math.min(5, notes.length) - 1 ? '1px solid var(--sv-border-2)' : 'none' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 2 }}>{n.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {n.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Knowledge Base tab */}
            {activeTab === 'Knowledge Base' && (
              <div className="sv-card">
                <div style={{ overflowX: 'auto' }}>
                  <table className="sv-table">
                    <thead>
                      <tr><th>Title</th><th>Category</th><th>Created</th></tr>
                    </thead>
                    <tbody>
                      {kb.length === 0 ? (
                        <tr><td colSpan={3}>
                          <div className="sv-empty">
                            <BookMarked style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                            <div className="sv-empty-title">Knowledge base is empty</div>
                            <div className="sv-empty-desc">Add articles, documentation, and references to your knowledge base.</div>
                          </div>
                        </td></tr>
                      ) : kb.map((a, i) => (
                        <tr key={i}>
                          <td className="sv-td-primary">{a.title}</td>
                          <td><span className="sv-chip">{a.category || 'General'}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
