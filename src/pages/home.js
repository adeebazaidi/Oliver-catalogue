// =============================================
// CatalogueGen — Home Page
// Product grid + dashboard + sort/filter
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';
import { renderDashboardStats } from '../components/dashboard-stats.js';
import { renderSortBar } from '../components/sort-bar.js';
import { createProductCard } from '../components/product-card.js';
import { showExportModal } from '../components/export-modal.js';
import { showBulkImportModal } from '../components/bulk-import-modal.js';

let sortBarInstance = null;
let currentFilters = { search: '', sort: 'newest', categories: [], favoritesOnly: false };

export function renderHomePage(container) {
  container.innerHTML = `
    <div class="page">
      <div class="container">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-xl);flex-wrap:wrap;gap:var(--space-md);">
          <div>
            <h1 style="font-size:1.75rem;">Products</h1>
            <p style="color:var(--text-secondary);margin-top:4px;">Manage your product catalogue</p>
          </div>
          <div style="display:flex;gap:var(--space-sm);">
            <button class="btn btn-secondary" id="btn-bulk-import">
              ${icons.upload} Bulk Import
            </button>
            <button class="btn btn-primary" id="btn-add-product">
              ${icons.plus} Add Product
            </button>
          </div>
        </div>

        <div id="dashboard-stats"></div>
        <div id="sort-bar-container"></div>
        <div id="product-grid-container"></div>
      </div>
    </div>
    <div id="selection-toolbar-container"></div>
  `;

  // Dashboard stats
  renderDashboardStats('dashboard-stats');

  // Sort bar
  sortBarInstance = renderSortBar('sort-bar-container', {
    onFilterChange: (filters) => {
      currentFilters = filters;
      renderProductGrid();
    }
  });

  // Initial product grid
  renderProductGrid();

  // Button handlers
  document.getElementById('btn-add-product').addEventListener('click', () => {
    router.navigate('#/add');
  });

  document.getElementById('btn-bulk-import').addEventListener('click', () => {
    showBulkImportModal();
  });

  // Listen for data changes
  const handlers = {
    productsChanged: () => renderProductGrid(),
    selectionChanged: () => {
      renderProductGrid();
      renderSelectionToolbar();
    },
    favoriteToggled: () => renderProductGrid(),
    dataImported: () => {
      renderDashboardStats('dashboard-stats');
      if (sortBarInstance) sortBarInstance.render();
      renderProductGrid();
    },
  };

  store.on('products-changed', handlers.productsChanged);
  store.on('selection-changed', handlers.selectionChanged);
  store.on('favorite-toggled', handlers.favoriteToggled);
  store.on('data-imported', handlers.dataImported);

  // Initial toolbar
  renderSelectionToolbar();
}

function renderProductGrid() {
  const gridContainer = document.getElementById('product-grid-container');
  if (!gridContainer) return;

  const products = store.getFilteredProducts(currentFilters);

  if (products.length === 0) {
    const hasAnyProducts = store.getProducts().length > 0;
    gridContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">${hasAnyProducts ? icons.search : icons.package}</div>
        <div class="empty-state__title">${hasAnyProducts ? 'No products found' : 'No products yet'}</div>
        <div class="empty-state__text">
          ${hasAnyProducts
            ? 'Try adjusting your search or filters.'
            : 'Add your first product to get started with your catalogue.'}
        </div>
        ${!hasAnyProducts ? `
          <button class="btn btn-primary" onclick="window.location.hash='#/add'">
            ${icons.plus} Add Your First Product
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = '<div class="product-grid stagger-children" id="product-grid"></div>';
  const grid = document.getElementById('product-grid');

  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}

function renderSelectionToolbar() {
  const toolbarContainer = document.getElementById('selection-toolbar-container');
  if (!toolbarContainer) return;

  const count = store.getSelectedCount();

  if (count === 0) {
    toolbarContainer.innerHTML = '';
    return;
  }

  toolbarContainer.innerHTML = `
    <div class="selection-toolbar">
      <div class="selection-toolbar__info">
        <span class="selection-toolbar__count">${count} product${count > 1 ? 's' : ''} selected</span>
        <button class="btn btn-ghost btn-sm" id="btn-clear-selection">Clear</button>
      </div>
      <div class="selection-toolbar__actions">
        <button class="btn btn-primary btn-lg" id="btn-generate-catalogue">
          ${icons.fileText} Generate Catalogue
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-clear-selection').addEventListener('click', () => {
    store.clearSelection();
  });

  document.getElementById('btn-generate-catalogue').addEventListener('click', () => {
    showExportModal();
  });
}
