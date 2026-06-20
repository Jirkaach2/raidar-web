import { useAuth } from '../context/AuthContext';
import { STEAM_AUTH_URL, steamEnabled } from '../lib/appwrite';

export default function OAuthButtons() {
  const { loginWithOAuth, configured } = useAuth();
  if (!configured) return null;

  const loginWithSteam = () => {
    window.location.href = `${STEAM_AUTH_URL.replace(/\/$/, '')}?action=login`;
  };

  return (
    <div className="oauth">
      <div className="oauth-divider"><span>or continue with</span></div>
      <div className="oauth-buttons">
        <button type="button" className="oauth-btn discord" onClick={() => loginWithOAuth('discord')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d="M20.32 4.37A19.8 19.8 0 0 0 15.45 3l-.24.42c1.6.5 2.95 1.16 4.18 2.05a16.45 16.45 0 0 0-13-1.36c-.43.14-.85.3-1.27.48C3.18 7.05 2.36 10.6 2.5 14.1a17.86 17.86 0 0 0 5.36 2.6l.6-.95c-.69-.26-1.34-.58-1.95-.97l.37-.27a12.6 12.6 0 0 0 10.95 0l.37.27c-.62.39-1.27.71-1.96.97l.6.95a17.7 17.7 0 0 0 5.37-2.6c.2-3.97-.78-7.5-2.26-9.73ZM9.55 12.86c-.74 0-1.35-.69-1.35-1.53s.6-1.54 1.35-1.54c.76 0 1.37.69 1.36 1.54 0 .84-.6 1.53-1.36 1.53Zm4.9 0c-.74 0-1.35-.69-1.35-1.53s.6-1.54 1.35-1.54c.76 0 1.37.69 1.36 1.54 0 .84-.6 1.53-1.36 1.53Z"/>
          </svg>
          Discord
        </button>
        <button type="button" className="oauth-btn google" onClick={() => loginWithOAuth('google')}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.5 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.9a5.05 5.05 0 0 1-2.19 3.31v2.77h3.54c2.08-1.92 3.25-4.74 3.25-8.09Z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.77c-.98.66-2.24 1.06-3.74 1.06-2.87 0-5.3-1.94-6.17-4.55H2.18v2.86A11 11 0 0 0 12 23Z"/>
            <path fill="#FBBC05" d="M5.83 14.08a6.6 6.6 0 0 1 0-4.16V7.06H2.18a11 11 0 0 0 0 9.88l3.65-2.86Z"/>
            <path fill="#EA4335" d="M12 4.96c1.62 0 3.07.56 4.21 1.65l3.14-3.14C17.46 1.64 14.97.6 12 .6A11 11 0 0 0 2.18 7.06l3.65 2.86C6.7 7.3 9.13 4.96 12 4.96Z"/>
          </svg>
          Google
        </button>
        {steamEnabled && (
          <button type="button" className="oauth-btn steam" onClick={loginWithSteam}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M11.98 2C6.65 2 2.28 6.05 2.04 11.31l5.36 2.21a2.86 2.86 0 0 1 1.62-.5l2.39-3.46v-.05a3.8 3.8 0 1 1 3.8 3.8h-.09l-3.41 2.43c0 .03 0 .06.01.09a2.86 2.86 0 1 1-5.7-.13l-3.83-1.58A10 10 0 1 0 11.98 2Zm-3.4 15.16.92.38a2.14 2.14 0 0 0 2.83-1.13 2.14 2.14 0 0 0-1.16-2.8l-1.02-.42a2.78 2.78 0 0 1 1.4.05l-.96-.4a2.15 2.15 0 0 0-1.01 4.16l-.99-.41Zm9.36-7.83a2.53 2.53 0 1 0-5.06 0 2.53 2.53 0 0 0 5.06 0Zm-4.42 0a1.9 1.9 0 1 1 3.8 0 1.9 1.9 0 0 1-3.8 0Z"/>
            </svg>
            Steam
          </button>
        )}
      </div>
    </div>
  );
}
