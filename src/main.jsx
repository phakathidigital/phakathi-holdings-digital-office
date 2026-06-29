import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import AppErrorBoundary from '@/components/AppErrorBoundary.jsx'
import '@/index.css'

function showStartupError(error) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="min-height:100vh;background:#030712;color:white;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif">
      <div style="max-width:760px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);border-radius:24px;padding:24px;box-shadow:0 24px 80px rgba(0,0,0,.35)">
        <p style="font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.55);margin:0 0 12px">Phakathi Flow</p>
        <h1 style="font-size:26px;margin:0 0 12px">Startup error</h1>
        <p style="color:rgba(255,255,255,.72);margin:0 0 16px">The app failed before React could finish rendering. Copy this error back to Codex if it appears.</p>
        <pre style="white-space:pre-wrap;max-height:360px;overflow:auto;background:rgba(0,0,0,.45);color:#fde68a;padding:16px;border-radius:14px;font-size:13px">${String(error?.stack || error?.message || error).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</pre>
      </div>
    </div>
  `;
}

window.addEventListener('error', (event) => showStartupError(event.error || event.message));
window.addEventListener('unhandledrejection', (event) => showStartupError(event.reason));

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  // </React.StrictMode>,
) 
