import { getPodioAccessToken } from './podioAuth';
import { get as getCache, set as setCache } from 'idb-keyval';

export async function createPodioClient(creds, addLog, trackRequest, authMethodOverride, trackStorageActivity) {
  let accessToken = null;

  async function getValidToken() {
    if (accessToken) return accessToken;
    const method = authMethodOverride || creds.authMethod || 'app';
    addLog(`🔐 Authenticating (${method})...`, 'info');
    accessToken = await getPodioAccessToken({ ...creds, authMethod: method });
    addLog(`✅ Authenticated (${method}).`, 'success');
    return accessToken;
  }

  async function request(path, options = {}) {
    // 1. Check Cache for App Schemas (unless forceRefresh is true)
    const isAppSchemaRequest = /^\/app\/\d+$/.test(path);
    const cacheKey = `podio_schema_${path}`;
    
    if (isAppSchemaRequest && !options.forceRefresh && (options.method === 'GET' || !options.method)) {
      try {
        const cached = await getCache(cacheKey);
        if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24)) { // 24hr cache
          addLog(`⚡ Loaded from local cache: ${path}`, 'success');
          if (trackStorageActivity) {
            trackStorageActivity({ type: 'read', store: 'IndexedDB', key: cacheKey, size: new Blob([JSON.stringify(cached.data)]).size });
          }
          return cached.data;
        }
      } catch (e) {
        console.warn('Cache read failed:', e);
      }
    }

    const token = await getValidToken();
    const useProxy = localStorage.getItem('podio_use_proxy') === 'true';
    const baseUrl = useProxy ? '/api/proxy' : 'https://api.podio.com';
    const url = useProxy 
      ? `${baseUrl}?path=${encodeURIComponent(path)}` 
      : `${baseUrl}${path}`;
    
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
      
      if (useProxy) {
        const h = {};
        response.headers.forEach((v, k) => h[k] = v);
        console.log('📡 Proxy Response Headers:', h);
      }

      if (rateRemaining && rateLimit) {
        const detail = { remaining: parseInt(rateRemaining, 10), limit: parseInt(rateLimit, 10) };
        window.dispatchEvent(new CustomEvent('podioRateLimit', { detail }));
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

      // 2. Save Cache for App Schemas
      if (isAppSchemaRequest && data && (options.method === 'GET' || !options.method)) {
        try {
          await setCache(cacheKey, { timestamp: Date.now(), data });
          if (trackStorageActivity) {
            trackStorageActivity({ type: 'write', store: 'IndexedDB', key: cacheKey, size: new Blob([JSON.stringify(data)]).size });
          }
        } catch (e) {
          console.warn('Cache write failed:', e);
        }
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
