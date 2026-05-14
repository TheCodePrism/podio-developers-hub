import React, { useState } from 'react';
import { Upload, File, Play, X, FileCheck, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function FileUploader() {
  const { creds, trackRequest } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('file-uploader');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [itemId, setItemId] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileId(null);
      addLog(`Selected: ${e.target.files[0].name} (${(e.target.files[0].size / 1024).toFixed(2)} KB)`);
    }
  };

  const upload = async () => {
    if (!file) { addLog('No file selected.', 'error'); return; }
    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      const data = await client.upload(file);
      setFileId(data.file_id);
      addLog(`✅ Upload successful! File ID: ${data.file_id}`, 'success');
    } catch (err) {} finally { setLoading(false); }
  };

  const attachToItem = async () => {
    if (!fileId || !itemId) { addLog('File ID and Item ID are required.', 'error'); return; }
    setLoading(true);
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      addLog(`🔗 Attaching file ${fileId} to item ${itemId}...`);
      await client.post(`/file/${fileId}/attach`, {
        ref_type: 'item',
        ref_id: parseInt(itemId, 10)
      });
      addLog('✅ Successfully attached to item!', 'success');
    } catch (err) {} finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">File Management</h1>
      <p className="page-sub">Upload assets to Podio and link them to workspace items.</p>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div 
          style={{ 
            border: '2px dashed var(--border)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '60px 40px', 
            textAlign: 'center',
            background: file ? 'rgba(56, 189, 248, 0.03)' : 'rgba(0,0,0,0.2)',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'var(--transition)',
            position: 'relative',
          }}
          onClick={() => !file && !loading && document.getElementById('fileInput').click()}
          onMouseEnter={e => !file && !loading && (e.currentTarget.style.borderColor = 'var(--accent)')}
          onMouseLeave={e => !file && !loading && (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <input id="fileInput" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
          
          {file ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: fileId ? 'rgba(16, 185, 129, 0.1)' : 'var(--accent-dim)', padding: '16px', borderRadius: '16px' }}>
                {fileId ? <FileCheck size={48} color="var(--success)" /> : <File size={48} color="var(--accent)" />}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-1)', marginBottom: '4px' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>{(file.size / 1024).toFixed(2)} KB {fileId && `· ID: ${fileId}`}</div>
              </div>
              {!loading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); setFileId(null); }}
                  className="btn btn-secondary"
                  style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '16px' }}>
                <Upload size={48} color="var(--text-3)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-1)', marginBottom: '4px' }}>Click or drag to select</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Maximum file size: 100MB</div>
              </div>
            </div>
          )}
        </div>

        {!fileId ? (
          <button 
            className="btn btn-primary" 
            onClick={upload} 
            disabled={loading || !file} 
            style={{ width: '100%', height: '48px', fontSize: '15px' }}
          >
            {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {loading ? 'Uploading to Podio...' : 'Confirm and Upload'}
          </button>
        ) : (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <LinkIcon size={14} color="var(--accent)" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>Attach to Item</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
              <input 
                value={itemId} 
                onChange={e => setItemId(e.target.value)} 
                placeholder="Enter Item ID..." 
              />
              <button 
                className="btn btn-primary" 
                onClick={attachToItem}
                disabled={loading || !itemId}
                style={{ height: '42px' }}
              >
                {loading ? <RefreshCw size={14} className="spin" /> : <LinkIcon size={14} />}
                {loading ? 'Attaching...' : 'Attach Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Console logs={logs} onClear={clearLogs} />
    </div>
  );
}
