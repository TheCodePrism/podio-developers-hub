import React, { useState, useEffect } from 'react';
import { Database, Download, ArrowRightLeft, Settings, Play } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

export default function DataMigrator() {
  const { creds, trackRequest, activeAppId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('data-migrator');
  
  const [mode, setMode] = useState('export'); // 'export' or 'migrate'
  const [sourceAppId, setSourceAppId] = useState(activeAppId);
  const [targetAppId, setTargetAppId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  useEffect(() => {
    if (activeAppId && !sourceAppId) setSourceAppId(activeAppId);
  }, [activeAppId]);

  const handleExport = async () => {
    if (!sourceAppId) { addLog('Source App ID is required.', 'error'); return; }
    
    setLoading(true);
    addLog(`Starting export for App ${sourceAppId} as ${exportFormat.toUpperCase()}`, 'info');
    
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      
      let allItems = [];
      let limit = 100;
      let offset = 0;
      let total = 1;
      
      while (offset < total) {
        addLog(`Fetching items offset ${offset}...`);
        const res = await client.post(`/item/app/${sourceAppId}/filter/`, { limit, offset });
        
        if (offset === 0) {
          total = res.total;
          addLog(`Total items to export: ${total}`);
        }
        
        allItems = allItems.concat(res.items);
        offset += limit;
      }
      
      addLog(`Fetched ${allItems.length} items. Processing data...`, 'success');
      
      // Simplify data for export
      const exportData = allItems.map(item => {
        const row = { podio_item_id: item.item_id, podio_title: item.title, podio_link: item.link };
        item.fields.forEach(f => {
          row[f.external_id] = f.values.map(v => v.value.title || v.value.name || v.value).join(', ');
        });
        return row;
      });

      let content = '';
      let mimeType = '';
      
      if (exportFormat === 'json') {
        content = JSON.stringify(exportData, null, 2);
        mimeType = 'application/json';
      } else {
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0]);
          content = headers.join(',') + '\\n';
          exportData.forEach(row => {
            content += headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',') + '\\n';
          });
        }
        mimeType = 'text/csv';
      }

      // Trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `podio_export_${sourceAppId}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addLog('Export downloaded successfully!', 'success');
      
    } catch (err) {
      addLog(`Export failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    addLog('Migration feature is currently in preview. It requires field mapping which will be released in Phase 2.', 'warning');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '20px' }}>
        <h1 className="page-title">Data Export & Migration</h1>
        <p className="page-sub">Safely bulk export app data to CSV/JSON, or migrate items between Podio apps.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexShrink: 0 }}>
        <button 
          onClick={() => setMode('export')}
          className={`btn ${mode === 'export' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, height: '40px' }}
        >
          <Download size={14} /> Export to File
        </button>
        <button 
          onClick={() => setMode('migrate')}
          className={`btn ${mode === 'migrate' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1, height: '40px' }}
        >
          <ArrowRightLeft size={14} /> App to App Migration
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px' }}>
        {/* Config Panel */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="label">Source App ID</label>
            <input 
              className="input" 
              value={sourceAppId} 
              onChange={(e) => setSourceAppId(e.target.value)} 
              placeholder="e.g. 26202935" 
            />
          </div>

          {mode === 'export' ? (
            <div className="fade-in" style={{ flex: 1 }}>
              <div style={{ marginBottom: '24px' }}>
                <label className="label">Export Format</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="radio" checked={exportFormat === 'json'} onChange={() => setExportFormat('json')} /> JSON
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="radio" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} /> CSV
                  </label>
                </div>
              </div>

              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', padding: '16px', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--text-2)', marginBottom: '24px' }}>
                <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>How Export Works</strong>
                This tool automatically handles Podio's pagination limits. It will fetch all items in the app in batches of 100 until the entire dataset is downloaded. Large apps (10k+ items) may take a few minutes.
              </div>

              <button className="btn btn-primary" onClick={handleExport} disabled={loading} style={{ width: '100%', height: '42px' }}>
                {loading ? <Database size={16} className="spin" /> : <Download size={16} />}
                {loading ? 'Processing Export...' : 'Start Export'}
              </button>
            </div>
          ) : (
            <div className="fade-in" style={{ flex: 1 }}>
              <div style={{ marginBottom: '24px' }}>
                <label className="label">Target App ID</label>
                <input 
                  className="input" 
                  value={targetAppId} 
                  onChange={(e) => setTargetAppId(e.target.value)} 
                  placeholder="App to migrate data into" 
                />
              </div>

              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '16px', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--text-2)', marginBottom: '24px' }}>
                <strong style={{ color: 'var(--error)', display: 'block', marginBottom: '4px' }}>Migration Warning</strong>
                App-to-App migration requires strict field type mapping. Ensure that your target app has compatible fields (Text to Text, Category to Category, etc).
              </div>

              <button className="btn btn-primary" onClick={handleMigrate} disabled={loading} style={{ width: '100%', height: '42px' }}>
                <Play size={16} /> Setup Field Mapping
              </button>
            </div>
          )}

        </div>

        {/* Output Console */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
            <Settings size={14} /> Migration Logs
          </div>
          <div style={{ flex: 1, height: '100%', minHeight: 0 }}>
             <Console logs={logs} onClear={clearLogs} />
          </div>
        </div>

      </div>
    </div>
  );
}
