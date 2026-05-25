// =============================================
// CatalogueGen — Dashboard Stats Bar
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';

export function renderDashboardStats(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function render() {
    const stats = store.getStats();

    const formatDate = (iso) => {
      if (!iso) return '—';
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    };

    container.innerHTML = `
      <div class="stats-bar stagger-children">
        <div class="stat-card" style="justify-content:center; align-items:baseline; gap:var(--space-xs);">
          <span class="stat-card__value">${stats.total}</span>
          <span class="stat-card__label">Total Products</span>
        </div>
        <div class="stat-card" style="justify-content:center; align-items:baseline; gap:var(--space-xs);">
          <span class="stat-card__value">${stats.categoriesCount}</span>
          <span class="stat-card__label">Categories</span>
        </div>
        <div class="stat-card" style="justify-content:center; align-items:baseline; gap:var(--space-xs);">
          <span class="stat-card__value">${stats.favorites}</span>
          <span class="stat-card__label">Favorites</span>
        </div>
        <div class="stat-card" style="justify-content:center; align-items:baseline; gap:var(--space-xs);">
          <span class="stat-card__value">$${stats.avgPrice.toLocaleString('en-US')}</span>
          <span class="stat-card__label">Avg. Price</span>
        </div>
        <div class="stat-card" style="justify-content:center; align-items:baseline; gap:var(--space-xs);">
          <span class="stat-card__value">${formatDate(stats.lastUpdated)}</span>
          <span class="stat-card__label">Last Updated</span>
        </div>
      </div>
    `;
  }

  render();
  store.on('products-changed', render);
  store.on('favorite-toggled', render);
  store.on('categories-changed', render);
  store.on('data-imported', render);

  return { refresh: render };
}
