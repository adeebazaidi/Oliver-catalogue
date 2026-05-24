// =============================================
// CatalogueGen — Toast Notifications
// =============================================

import { icons } from '../icons.js';

let toastId = 0;

const ICONS = {
  success: icons.checkCircle,
  error: icons.alertCircle,
  warning: icons.alertTriangle,
  info: icons.info,
};

export function showToast({ type = 'info', title = '', message = '', duration = 4000 } = {}) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const id = `toast-${++toastId}`;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.id = id;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="this.closest('.toast').remove()">${icons.x}</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return id;
}
