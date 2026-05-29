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
    material: '',
    category: '',
    buyer: '',
    favoritesOnly: false,
  };

  function emitChange() {
    if (onFilterChange) onFilterChange({ ...state });
  }

  function render() {
    const allCategories = store.getCategories();
    const allMaterials = store.getMaterials();
    const allBuyerCategories = store.getBuyerCategories();

    container.innerHTML = `
      <div class="sort-bar">
        <select class="sort-select" id="filter-material" title="Filter by Material">
          <option value="">All Materials</option>
          ${allMaterials.map(m => `<option value="${m}" ${state.material === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        
        <select class="sort-select" id="filter-product" title="Filter by Product Category">
          <option value="">All Products</option>
          ${allCategories.map(c => `<option value="${c}" ${state.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        
        <select class="sort-select" id="filter-buyer" title="Filter by Buyer Category">
          <option value="">All Buyers</option>
          ${allBuyerCategories.map(b => `<option value="${b}" ${state.buyer === b ? 'selected' : ''}>${b}</option>`).join('')}
        </select>

        <select class="sort-select" id="sort-select">
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest First</option>
          <option value="oldest" ${state.sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
          <option value="name-az" ${state.sort === 'name-az' ? 'selected' : ''}>Name A→Z</option>
          <option value="name-za" ${state.sort === 'name-za' ? 'selected' : ''}>Name Z→A</option>
          <option value="price-low" ${state.sort === 'price-low' ? 'selected' : ''}>Price: Low → High</option>
          <option value="price-high" ${state.sort === 'price-high' ? 'selected' : ''}>Price: High → Low</option>
          <option value="favorites" ${state.sort === 'favorites' ? 'selected' : ''}>Favorites First</option>
        </select>

        <button class="btn ${state.favoritesOnly ? 'btn-primary' : 'btn-secondary'} btn-sm" id="sort-fav-toggle" title="Show favorites only">
          ${icons.star} Favorites
        </button>

        <div class="search-input-wrapper" style="margin-left: auto;">
          ${icons.search}
          <input 
            type="text" 
            class="search-input" 
            id="sort-search" 
            placeholder="Search products..."
            value="${state.search}"
          >
        </div>
      </div>
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

    // Material filter
    document.getElementById('filter-material').addEventListener('change', (e) => {
      state.material = e.target.value;
      emitChange();
    });

    // Product filter
    document.getElementById('filter-product').addEventListener('change', (e) => {
      state.category = e.target.value;
      emitChange();
    });

    // Buyer filter
    document.getElementById('filter-buyer').addEventListener('change', (e) => {
      state.buyer = e.target.value;
      emitChange();
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
  }

  render();
  store.on('categories-changed', render);
  store.on('materials-changed', render);
  store.on('buyer-categories-changed', render);

  return {
    getState: () => ({ ...state }),
    render,
  };
}
