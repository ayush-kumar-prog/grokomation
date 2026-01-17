/**
 * Twitter OAuth 2.0 with PKCE flow
 * For sending DMs on behalf of authenticated users
 */

// Store these in env for production
const CLIENT_ID = import.meta.env.VITE_TWITTER_CLIENT_ID || '';
const REDIRECT_URI = import.meta.env.VITE_TWITTER_REDIRECT_URI || 'http://localhost:5173/callback';

// Required scopes for DMs
const SCOPES = [
  'tweet.read',
  'users.read',
  'dm.write',
  'dm.read',
  'offline.access', // For refresh tokens
].join(' ');

/**
 * Generate a random string for PKCE code verifier
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Base64 URL encode (without padding)
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate code challenge from verifier using SHA-256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(hash));
}

/**
 * Generate a random state parameter
 */
function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Start the OAuth 2.0 authorization flow
 * Opens Twitter authorization page in a new window
 */
export async function startOAuthFlow(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error('Twitter Client ID not configured. Add VITE_TWITTER_CLIENT_ID to .env.local');
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store verifier and state for callback verification
  localStorage.setItem('twitter_code_verifier', codeVerifier);
  localStorage.setItem('twitter_oauth_state', state);

  // Build authorization URL
  const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Redirect to Twitter
  window.location.href = authUrl.toString();
}

/**
 * Handle the OAuth callback
 * Exchange authorization code for access token
 */
export async function handleOAuthCallback(
  code: string,
  state: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user?: { id: string; username: string; name: string };
}> {
  // Verify state
  const savedState = localStorage.getItem('twitter_oauth_state');
  if (state !== savedState) {
    throw new Error('OAuth state mismatch. Possible CSRF attack.');
  }

  // Get code verifier
  const codeVerifier = localStorage.getItem('twitter_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found. Please restart the auth flow.');
  }

  // Clear stored OAuth data
  localStorage.removeItem('twitter_oauth_state');
  localStorage.removeItem('twitter_code_verifier');

  // Exchange code for token via our proxy (to avoid CORS)
  const response = await fetch('/api/twitter/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Token exchange error:', error);
    throw new Error(error.error_description || 'Failed to exchange authorization code');
  }

  const tokenData = await response.json();

  // Fetch user info
  let user;
  try {
    const userResponse = await fetch('/api/twitter/2/users/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      user = {
        id: userData.data.id,
        username: userData.data.username,
        name: userData.data.name,
      };
    }
  } catch (e) {
    console.warn('Failed to fetch user info:', e);
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    user,
  };
}

/**
 * Send a Direct Message to a user
 */
export async function sendDirectMessage(
  accessToken: string,
  recipientId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // First, get the authenticated user's ID
    const meResponse = await fetch('/api/twitter/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      return { success: false, error: 'Failed to get authenticated user' };
    }

    const meData = await meResponse.json();
    const senderId = meData.data.id;

    // Create conversation and send message
    // Note: Twitter DM API requires creating a conversation first
    const response = await fetch(`/api/twitter/2/dm_conversations/with/${recipientId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('DM send error:', error);
      return {
        success: false,
        error: error.detail || error.title || 'Failed to send DM',
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.data?.dm_event_id,
    };
  } catch (error) {
    console.error('DM error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Lookup a user by username to get their ID
 */
export async function lookupUserByUsername(
  accessToken: string,
  username: string
): Promise<{ id: string; username: string; name: string } | null> {
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '');

  try {
    const response = await fetch(`/api/twitter/2/users/by/username/${cleanUsername}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('User lookup failed:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      id: data.data.id,
      username: data.data.username,
      name: data.data.name,
    };
  } catch (error) {
    console.error('User lookup error:', error);
    return null;
  }
}

/**
 * Refresh the access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  try {
    const response = await fetch('/api/twitter/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}