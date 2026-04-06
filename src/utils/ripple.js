/**
 * utils/ripple.js — Ripple effect utility
 * Usage: <div onClick={e => ripple(e)} className="rp-container">
 */
export function ripple(e) {
  const el = e.currentTarget;
  const r = document.createElement('div');
  r.className = 'ripple-wave';
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  r.style.width = r.style.height = size + 'px';
  r.style.left = e.clientX - rect.left - size/2 + 'px';
  r.style.top  = e.clientY - rect.top  - size/2 + 'px';
  el.appendChild(r);
  setTimeout(() => r.remove(), 600);
}
