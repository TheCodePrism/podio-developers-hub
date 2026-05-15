/**
 * Unified Podio Authentication
 * Supports: App Auth, Password (User) Auth, OAuth2 Code Exchange
 *
 * Podio token endpoint: https://api.podio.com/oauth/token
 * Content-Type: application/x-www-form-urlencoded (NOT application/json)
 */

const TOKEN_URL = 'https://api.podio.com/oauth/token';

async function postToken(params) {
  const body = new URLSearchParams(params);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || JSON.stringify(data));
  }
  return data;
}

/**
 * Get access token based on auth method.
 * @param {object} creds - Credentials from ConfigPanel / localStorage
 * @returns {string} access_token
 */
export async function getPodioAccessToken(creds) {
  const { authMethod = 'app', clientId, clientSecret } = creds;

  if (!clientId || !clientSecret) {
    throw new Error('Client ID and Client Secret are required. Open ⚙ Settings to configure.');
  }

  const common = { client_id: clientId, client_secret: clientSecret };

  // 1. Check local cache
  const cacheKey = `podio_access_token_${authMethod}`;
  const cachedStr = localStorage.getItem(cacheKey);
  if (cachedStr) {
    try {
      const cached = JSON.parse(cachedStr);
      // If valid and not expiring within the next minute
      if (cached.access_token && cached.expires_at > Date.now() + 60000) {
        return cached.access_token;
      }
      // If expired but we have a refresh token
      if (cached.refresh_token) {
        try {
          const data = await postToken({
            ...common,
            grant_type: 'refresh_token',
            refresh_token: cached.refresh_token,
          });
          saveToken(data, authMethod);
          return data.access_token;
        } catch (refreshErr) {
          console.warn('Failed to refresh token, falling back to full auth', refreshErr);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. No valid cache, fetch new token
  let data;
  if (authMethod === 'app') {
    if (!creds.appId || !creds.appToken) {
      throw new Error('App ID and App Token are required for App Auth.');
    }
    data = await postToken({
      ...common,
      grant_type: 'app',
      app_id: creds.appId,
      app_token: creds.appToken,
    });
  } else if (authMethod === 'password') {
    if (!creds.username || !creds.password) {
      throw new Error('Username and Password are required for User Auth.');
    }
    data = await postToken({
      ...common,
      grant_type: 'password',
      username: creds.username,
      password: creds.password,
    });
  } else if (authMethod === 'oauth2') {
    if (!creds.oauthCode) {
      throw new Error('Authorization Code is missing. Complete the OAuth2 flow in ⚙ Settings first.');
    }
    data = await postToken({
      ...common,
      grant_type: 'authorization_code',
      code: creds.oauthCode,
      redirect_uri: creds.oauthRedirectUri || 'https://localhost',
    });
  } else {
    throw new Error(`Unknown auth method: "${authMethod}". Open ⚙ Settings and choose one.`);
  }

  saveToken(data, authMethod);
  return data.access_token;
}

function saveToken(data, authMethod) {
  const expires_at = Date.now() + (data.expires_in * 1000);
  const cacheKey = `podio_access_token_${authMethod}`;
  localStorage.setItem(cacheKey, JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at
  }));
}

/**
 * Builds the OAuth2 browser authorization URL.
 */
export function buildOAuthUrl({ clientId, redirectUri, scope = '' }) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri || 'https://localhost',
    response_type: 'code',
    ...(scope && { scope })
  });
  return `https://podio.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth2 authorization code for a full token response.
 */
export async function exchangeOAuthCode({ code, clientId, clientSecret, redirectUri }) {
  return postToken({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri || 'https://localhost',
  });
}
