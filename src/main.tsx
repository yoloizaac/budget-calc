import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

try {
  const root = document.getElementById("root");
  if (!root) throw new Error("Root element not found");
  createRoot(root).render(<App />);
} catch (err) {
  // Top-level fallback if React fails to mount
  const fallback = document.getElementById("root") || document.body;
  fallback.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:2rem;text-align:center;background:#0a0a0a;color:#e5e5e5;">
      <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
      <h1 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">App failed to load</h1>
      <p style="color:#888;font-size:0.875rem;max-width:24rem;margin-bottom:1.5rem;">${err instanceof Error ? err.message : 'An unexpected error occurred.'}</p>
      <button onclick="localStorage.clear();sessionStorage.clear();location.reload();" style="padding:0.625rem 1.5rem;border-radius:0.5rem;background:#3b82f6;color:white;border:none;cursor:pointer;font-size:0.875rem;font-weight:500;">
        Clear Cache &amp; Reload
      </button>
    </div>
  `;
}
