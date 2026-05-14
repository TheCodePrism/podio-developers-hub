import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, ExternalLink, Cpu, FileCode } from 'lucide-react';
import { usePodio } from '../context/PodioContext';

const LANGUAGES = [
  { id: 'js-fetch', label: 'JS (Fetch API)', icon: FileCode },
  { id: 'nodejs-axios', label: 'Node.js (Axios)', icon: Terminal },
];

export default function CodeGenerator() {
  const { activeAppId, creds } = usePodio();
  const [lang, setLang] = useState('js-fetch');
  const [copied, setCopied] = useState(false);

  const appId = activeAppId || 'YOUR_APP_ID';
  const clientId = creds.clientId || 'YOUR_CLIENT_ID';
  const clientSecret = creds.clientSecret || 'YOUR_CLIENT_SECRET';

  const generateCode = () => {
    if (lang === 'js-fetch') {
      return `
// Podio API Request Example (Browser/Node Fetch)
const getItems = async () => {
  const appId = '${appId}';
  const token = 'YOUR_ACCESS_TOKEN'; // Get this via oauth flow
  
  const response = await fetch(\`https://api.podio.com/item/app/\${appId}/filter/\`, {
    method: 'POST',
    headers: {
      'Authorization': \`OAuth2 \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      limit: 20,
      offset: 0
    })
  });

  const data = await response.json();
  console.log('Items:', data.items);
};

getItems();`.trim();
    }

    if (lang === 'nodejs-axios') {
      return `
const axios = require('axios');

// Podio API Request Example (Node.js + Axios)
async function podioRequest() {
  const clientId = '${clientId}';
  const clientSecret = '${clientSecret}';
  const appId = '${appId}';

  try {
    // 1. Get Access Token (App Authentication)
    const authRes = await axios.post('https://api.podio.com/oauth/token', null, {
      params: {
        grant_type: 'app',
        app_id: appId,
        app_token: 'YOUR_APP_TOKEN',
        client_id: clientId,
        client_secret: clientSecret
      }
    });

    const token = authRes.data.access_token;

    // 2. Fetch Items
    const itemsRes = await axios.post(\`https://api.podio.com/item/app/\${appId}/filter/\`, {}, {
      headers: { 'Authorization': \`OAuth2 \${token}\` }
    });

    console.log('Successfully fetched', itemsRes.data.total, 'items');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

podioRequest();`.trim();
    }
    return '';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Code Generator</h1>
      <p className="page-sub">Generate production-ready boilerplate code for the active application.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' }}>
        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="label">Snippet Type</div>
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              onClick={() => setLang(l.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
                borderRadius: 'var(--radius)', border: '1px solid',
                borderColor: lang === l.id ? 'var(--accent)' : 'var(--border)',
                background: lang === l.id ? 'var(--accent-dim)' : 'rgba(255,255,255,0.02)',
                color: lang === l.id ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer', textAlign: 'left', fontWeight: 600, transition: 'var(--transition)'
              }}
            >
              <l.icon size={16} />
              {l.label}
            </button>
          ))}
          
          <div className="card" style={{ marginTop: '20px', padding: '16px', background: 'rgba(56, 189, 248, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '13px' }}>
              <Cpu size={14} /> Active Context
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              App ID: <span style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{appId}</span><br/>
              Client: <span style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{creds.clientId ? 'Set' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <button 
              onClick={copyCode}
              style={{ 
                background: copied ? 'var(--success)' : 'rgba(255,255,255,0.08)', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', padding: '6px 12px', 
                color: '#fff', fontSize: '11px', fontWeight: 700, 
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
          <pre style={{ 
            margin: 0, padding: '24px', 
            background: 'transparent', 
            color: 'var(--accent)', 
            fontSize: '13px', 
            fontFamily: '"JetBrains Mono", monospace', 
            lineHeight: '1.6',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {generateCode()}
          </pre>
        </div>
      </div>
      
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
        <ExternalLink size={14} />
        Check the <a href="https://developers.podio.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Official API Documentation</a> for more advanced endpoints.
      </div>
    </div>
  );
}
