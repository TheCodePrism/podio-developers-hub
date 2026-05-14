import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, RefreshCw, User, Clock } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function CommentManager() {
  const { creds, trackRequest } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('comment-manager');
  const [itemId, setItemId]     = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading]   = useState(false);
  const [posting, setPosting]   = useState(false);

  const fetchComments = async () => {
    if (!itemId.trim()) { addLog('Item ID is required.', 'error'); return; }
    setLoading(true);
    setComments([]);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.get(`/comment/item/${itemId.trim()}/`);
      setComments(data);
      addLog(`✅ ${data.length} comment(s) loaded.`, 'success');
    } catch (err) {
      addLog(`❌ ${err.message}`, 'error');
    } finally { setLoading(false); }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.post(`/comment/item/${itemId.trim()}/`, {
        value: newComment.trim()
      });
      addLog(`✅ Comment posted (ID: ${data.comment_id})`, 'success');
      setNewComment('');
      await fetchComments();
    } catch (err) {
      addLog(`❌ ${err.message}`, 'error');
    } finally { setPosting(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      await client.delete(`/comment/${commentId}`);
      setComments(prev => prev.filter(c => c.comment_id !== commentId));
      addLog(`✅ Deleted comment ${commentId}.`, 'success');
    } catch (err) {
      addLog(`❌ ${err.message}`, 'error');
    }
  };

  const formatDate = (str) => {
    try { return new Date(str).toLocaleString(); }
    catch { return str; }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Comment Manager</h1>
      <p className="page-sub">View, post, and delete comments on any Podio item.</p>

      {/* Fetch bar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
          <div>
            <label className="label">Item ID</label>
            <input
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchComments()}
              placeholder="e.g. 2660490517"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={fetchComments}
            disabled={loading}
            style={{ height: '42px', marginTop: '22px' }}
          >
            {loading ? <RefreshCw size={14} className="spin" /> : <MessageSquare size={14} />}
            {loading ? 'Loading...' : 'Load Comments'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            {comments.length} Comment{comments.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map(c => (
              <div key={c.comment_id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                transition: 'var(--transition)',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--violet))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 800, color: '#fff',
                }}>
                  {(c.created_by?.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{c.created_by?.name || 'Unknown'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {formatDate(c.created_on)}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: '"JetBrains Mono", monospace', marginLeft: 'auto' }}>
                      #{c.comment_id}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {c.value}
                  </p>
                  {c.files?.length > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-3)' }}>
                      📎 {c.files.length} attachment{c.files.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteComment(c.comment_id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', padding: '4px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', flexShrink: 0,
                    transition: 'var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Post new comment */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <label className="label">Post New Comment</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment(); }}
                placeholder="Write a comment... (Ctrl+Enter to post)"
                style={{ flex: 1, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
              />
              <button
                className="btn btn-primary"
                onClick={postComment}
                disabled={posting || !newComment.trim()}
                style={{ height: '80px', minWidth: '80px', flexDirection: 'column', gap: '6px' }}
              >
                {posting ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
                {posting ? '' : 'Post'}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px' }}>Ctrl+Enter to post quickly.</p>
          </div>
        </div>
      )}

      {/* Empty state — after fetch */}
      {!loading && comments.length === 0 && itemId && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px', marginBottom: '20px' }}>
          <MessageSquare size={40} style={{ color: 'var(--text-3)', marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ color: 'var(--text-3)' }}>No comments on this item yet.</p>
          <div style={{ marginTop: '16px', maxWidth: '400px', margin: '16px auto 0' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postComment(); }}
                placeholder="Be the first to comment..."
                style={{ flex: 1, minHeight: '70px', resize: 'none', fontFamily: 'inherit' }}
              />
              <button
                className="btn btn-primary"
                onClick={postComment}
                disabled={posting || !newComment.trim()}
                style={{ height: '70px', minWidth: '70px', flexDirection: 'column', gap: '4px' }}
              >
                {posting ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
