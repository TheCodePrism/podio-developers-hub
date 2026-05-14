import { getPodioAccessToken } from './podioAuth';

export async function createPodioClient(creds, addLog, trackRequest) {
  let accessToken = null;

  async function getValidToken() {
    if (accessToken) return accessToken;
    addLog('🔐 Authenticating...', 'info');
    accessToken = await getPodioAccessToken(creds);
    addLog('✅ Authenticated.', 'success');
    return accessToken;
  }

  async function request(path, options = {}) {
    const token = await getValidToken();
    const url = path.startsWith('http') ? path : `https://api.podio.com${path}`;
    
    const startTime = Date.now();
    addLog(`🌐 ${options.method || 'GET'} ${path}...`, 'info');

    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `OAuth2 ${token}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Handle token expiration / invalid token
      if (response.status === 401) {
        addLog('⚠️ Token expired or invalid. Retrying authentication...', 'warning');
        accessToken = null; // Clear cached token
        const newToken = await getValidToken();
        response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `OAuth2 ${newToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
      }

      const rateRemaining = response.headers.get('x-rate-limit-remaining');
      const rateLimit = response.headers.get('x-rate-limit-limit');
      if (rateRemaining && rateLimit) {
        window.dispatchEvent(new CustomEvent('podioRateLimit', {
          detail: { remaining: parseInt(rateRemaining, 10), limit: parseInt(rateLimit, 10) }
        }));
      }

      const duration = Date.now() - startTime;
      const data = response.status !== 204 ? await response.json() : null;

      trackRequest({
        method: options.method || 'GET',
        path,
        status: response.status,
        duration,
        response: data
      });

      if (!response.ok) {
        throw new Error(data?.error_description || JSON.stringify(data) || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      addLog(`❌ Request Failed: ${error.message}`, 'error');
      throw error;
    }
  }

  return {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    upload: async (file) => {
      const token = await getValidToken();
      addLog(`📤 Uploading file: ${file.name}...`, 'info');
      const formData = new FormData();
      formData.append('source', file);
      formData.append('filename', file.name);

      const res = await fetch('https://api.podio.com/file/', {
        method: 'POST',
        headers: { 'Authorization': `OAuth2 ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || 'Upload failed');
      addLog(`✅ File uploaded: ${data.file_id}`, 'success');
      return data;
    }
  };
}
