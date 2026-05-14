import React, { useState, useEffect, useRef } from 'react';
import { Play, Save, Trash2, Code2, AlertTriangle, FileCode2 } from 'lucide-react';
import { usePodio, useModuleLogger } from '../context/PodioContext';
import { createPodioClient } from '../utils/podioClient';
import Console from '../components/Console';

const STORAGE_KEY = 'podio_hub_macros';
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

const DEFAULT_SCRIPT = `// Write custom JavaScript to interact with the Podio API
// Available variables: 
//   - client: Podio API Client (has .get(), .post(), .put(), .delete())
//   - log: Function to output to the console -> log('message', 'success|error|info')
//   - activeAppId: Currently selected App ID
//   - activeSpaceId: Currently selected Space ID

if (!activeAppId) {
  log("Please select an App ID in the top right, or set one manually.", "error");
  return;
}

log(\`Fetching items for App \${activeAppId}...\`, "info");
const result = await client.post(\`/item/app/\${activeAppId}/filter/\`, { limit: 5 });

log(\`Found \${result.filtered} items.\`, "success");
for (const item of result.items) {
  log(\`- Item \${item.item_id}: \${item.title}\`);
}
`;

export default function MacroEngine() {
  const { creds, trackRequest, activeAppId, activeSpaceId } = usePodio();
  const { logs, addLog, clearLogs } = useModuleLogger('macro-engine');
  
  const [code, setCode] = useState(DEFAULT_SCRIPT);
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState('');
  const [presetName, setPresetName] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      const presetList = Object.keys(saved).map(name => ({ name, code: saved[name] }));
      setPresets(presetList);
    } catch {
      setPresets([]);
    }
  }, []);

  const savePreset = () => {
    if (!presetName.trim()) {
      addLog('Preset name cannot be empty.', 'error');
      return;
    }
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    saved[presetName] = code;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    setPresets(Object.keys(saved).map(name => ({ name, code: saved[name] })));
    setActivePreset(presetName);
    addLog(`Preset '${presetName}' saved.`, 'success');
  };

  const loadPreset = (name) => {
    const preset = presets.find(p => p.name === name);
    if (preset) {
      setCode(preset.code);
      setActivePreset(name);
      setPresetName(name);
      addLog(`Loaded preset '${name}'.`, 'info');
    }
  };

  const deletePreset = (name) => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    delete saved[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    
    setPresets(Object.keys(saved).map(n => ({ name: n, code: saved[n] })));
    if (activePreset === name) {
      setActivePreset('');
      setPresetName('');
      setCode(DEFAULT_SCRIPT);
    }
    addLog(`Preset '${name}' deleted.`, 'info');
  };

  const executeMacro = async () => {
    if (!creds.clientId) {
      addLog('No active Podio connection. Please setup credentials.', 'error');
      return;
    }

    setLoading(true);
    addLog('--- Executing Macro ---', 'info');
    
    try {
      const client = await createPodioClient(creds, addLog, trackRequest);
      
      // We wrap the code in an async function so users can use 'await'
      const executable = new AsyncFunction('client', 'log', 'activeAppId', 'activeSpaceId', code);
      
      await executable(client, addLog, activeAppId, activeSpaceId);
      
      addLog('--- Execution Finished ---', 'success');
    } catch (err) {
      addLog(`Execution Error: ${err.message}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Basic tab support for textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      // Wait for React to update the value, then set cursor
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeMacro();
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, marginBottom: '20px' }}>
        <h1 className="page-title">Macro Engine</h1>
        <p className="page-sub">Write, save, and execute custom JavaScript automation scripts against the Podio API.</p>
      </div>

      {/* Top Control Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        
        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <FileCode2 size={16} color="var(--text-3)" />
          <select 
            className="input" 
            value={activePreset} 
            onChange={(e) => {
              if (e.target.value) loadPreset(e.target.value);
              else { setActivePreset(''); setPresetName(''); setCode(DEFAULT_SCRIPT); }
            }}
            style={{ width: '200px', height: '36px' }}
          >
            <option value="">-- New Script --</option>
            {presets.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
          
          {activePreset && (
            <button 
              onClick={() => deletePreset(activePreset)}
              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '6px', borderRadius: '4px', display: 'flex' }}
              title="Delete Preset"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

        {/* Save Preset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            className="input" 
            placeholder="Preset name..." 
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            style={{ width: '150px', height: '36px' }}
          />
          <button className="btn btn-secondary" onClick={savePreset} style={{ height: '36px', padding: '0 12px' }}>
            <Save size={14} /> Save
          </button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--border)' }} />

        {/* Run Button */}
        <button 
          className="btn btn-primary" 
          onClick={executeMacro} 
          disabled={loading}
          style={{ height: '36px', padding: '0 20px' }}
        >
          <Play size={14} fill={loading ? "none" : "currentColor"} className={loading ? 'spin' : ''} />
          {loading ? 'Executing...' : 'Run Script (⌘+Enter)'}
        </button>
      </div>

      {/* Editor & Console Split */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '400px' }}>
        
        {/* Editor Area */}
        <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>
            <Code2 size={14} /> JavaScript Sandbox
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            style={{
              flex: 1, width: '100%', resize: 'none', border: 'none', background: 'transparent',
              color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace', fontSize: '13px',
              lineHeight: '1.5', padding: '16px', outline: 'none'
            }}
          />
        </div>

        {/* Output Area */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }}>
            <AlertTriangle size={14} /> Output Console
          </div>
          <div style={{ flex: 1, height: '100%', minHeight: 0 }}>
             <Console logs={logs} onClear={clearLogs} />
          </div>
        </div>

      </div>
    </div>
  );
}
