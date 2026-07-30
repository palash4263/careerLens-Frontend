import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';

// Suppress noisy Chrome extension unhandled promise rejections & runtime extension errors
window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason?.message || String(event?.reason || "");
  if (
    reason.includes("message channel closed") ||
    reason.includes("listener indicated an asynchronous response") ||
    reason.includes("web_accessible_resources") ||
    reason.includes("chrome-extension://")
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener("error", (event) => {
  const filename = event?.filename || "";
  const msg = event?.message || "";
  if (
    filename.includes("chrome-extension://") ||
    msg.includes("web_accessible_resources") ||
    msg.includes("chrome-extension://")
  ) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);