// =============================================
// CatalogueGen — Sort & Filter Bar
// =============================================

import { icons } from '../icons.js';
import { store } from '../store.js';

export function renderSortBar(containerId, { onFilterChange } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let state = {
    search: '',
    sort: 'newest',
    categories: [],
    favoritesOnly: false,
  };

  function emitChange() {
    if (onFilterChange) onFilterChange({ ...state });
  }

  function render() {
    const allCategories = store.getCategories();

    container.innerHTML = `
      <div class="sort-bar">
        <div class="search-input-wrapper">
          ${icons.search}
          <input 
            type="text" 
            class="search-input" 
            id="sort-search" 
            placeholder="Search products..."
            value="${state.search}"
          >
        </div>
        <select class="sort-select" id="sort-select">
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest First</option>
          <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
          <option value="name-az" ${state.sort === 'name-az' ? 'selected' : ''}>Name A→Z</option>
          <option value="name-za" ${state.sort === 'name-za' ? 'selected' : ''}>Name Z→A</option>
          <option value="price-low" ${state.sort === 'price-low' ? 'selected' : ''}>Price: Low → High</option>
          <option value="price-high" ${state.sort === 'price-high' ? 'selected' : ''}>Price: High → Low</option>
          <option value="material" ${state.sort === 'material' ? 'selected' : ''}>Material</option>
          <option value="favorites" ${state.sort === 'favorites' ? 'selected' : ''}>Favorites First</option>
        </select>
        <button class="btn ${state.favoritesOnly ? 'btn-primary' : 'btn-secondary'} btn-sm" id="sort-fav-toggle" title="Show favorites only">
          ${icons.star} Favorites
        </button>
      </div>
      ${allCategories.length > 0 ? `
        <div class="category-chips" style="margin-bottom:var(--space-lg);">
          ${allCategories.map(cat => `
            <button class="category-chip ${state.categories.includes(cat) ? 'active' : ''}" data-filter-cat="${cat}">${cat}</button>
          `).join('')}
          ${state.categories.length > 0 ? `
            <button class="category-chip" style="color:var(--color-danger);border-color:var(--color-danger-subtle);" id="clear-cat-filter">✕ Clear</button>
          ` : ''}
        </div>
      ` : ''}
    `;

    // Search
    const searchInput = document.getElementById('sort-search');
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.search = searchInput.value;
        emitChange();
      }, 200);
    });

    // Sort
    document.getElementById('sort-select').addEventListener('change', (e) => {
      state.sort = e.target.value;
      emitChange();
    });

    // Favorites toggle
    document.getElementById('sort-fav-toggle').addEventListener('click', () => {
      state.favoritesOnly = !state.favoritesOnly;
      render();
      emitChange();
    });

    // Category filter chips
    container.querySelectorAll('[data-filter-cat]').forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.filterCat;
        const idx = state.categories.indexOf(cat);
        if (idx > -1) {
          state.categories.splice(idx, 1);
        } else {
          state.categories.push(cat);
        }
        render();
        emitChange();
      });
    });

    // Clear category filter
    const clearBtn = document.getElementById('clear-cat-filter');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.categories = [];
        render();
        emitChange();
      });
    }
  }

  render();
  store.on('categories-changed', render);

  return {
    getState: () => ({ ...state }),
    render,
  };
}
