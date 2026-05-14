import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2 } from 'lucide-react';

export default function PresetManager({ toolId, currentConfig, onLoad }) {
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`podio_presets_${toolId}`)) || [];
    setPresets(saved);
  }, [toolId]);

  const savePreset = () => {
    if (!presetName) return;
    const newPresets = [...presets, { name: presetName, config: currentConfig, id: Date.now() }];
    localStorage.setItem(`podio_presets_${toolId}`, JSON.stringify(newPresets));
    setPresets(newPresets);
    setPresetName('');
  };

  const deletePreset = (id) => {
    const newPresets = presets.filter(p => p.id !== id);
    localStorage.setItem(`podio_presets_${toolId}`, JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input 
          value={presetName} 
          onChange={e => setPresetName(e.target.value)} 
          placeholder="Preset name..." 
          style={{ flex: 1, fontSize: '12px', padding: '6px 10px' }}
        />
        <button className="btn btn-secondary" onClick={savePreset} style={{ padding: '6px 12px' }}>
          <Save size={14} />
        </button>
        <button className="btn btn-secondary" onClick={() => setShowPresets(!showPresets)} style={{ padding: '6px 12px' }}>
          <FolderOpen size={14} />
        </button>
      </div>

      {showPresets && presets.length > 0 && (
        <div className="glass fade-in" style={{ marginTop: '8px', padding: '10px' }}>
          {presets.map(p => (
            <div key={p.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: '4px',
              fontSize: '13px',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              marginBottom: '4px'
            }} onClick={() => { onLoad(p.config); setShowPresets(false); }}>
              <span>{p.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
