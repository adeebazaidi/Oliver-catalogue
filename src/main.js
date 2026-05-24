// =============================================
// CatalogueGen — Main Entry Point
// =============================================

import './styles/index.css';
import './styles/animations.css';
import './auth/gate.css';

import { renderGate } from './auth/gate.js';
import { router } from './router.js';
import { store } from './store.js';
import { icons } from './icons.js';
import { showToast } from './components/toast.js';

import { renderHomePage } from './pages/home.js';
import { renderProductDetailPage } from './pages/product-detail.js';
import { renderAddProductPage } from './pages/add-product.js';

// Initialize password gate
renderGate(() => {
  initApp();
});

function initApp() {
  const app = document.getElementById('app');
  app.style.display = 'block';

  // Render header
  renderHeader();

  // Setup routes
  const main = document.getElementById('app-main');
  router.addRoute('/', () => renderHomePage(main));
  router.addRoute('/product/:id', (params) => renderProductDetailPage(main, params));
  router.addRoute('/add', () => renderAddProductPage(main));

  // Initialize router
  router.init(main);
}

function renderHeader() {
  const header = document.getElementById('app-header');
  header.innerHTML = `
    <div class="app-header" style="width:100%;max-width:var(--max-width);margin:0 auto;">
      <a href="#/" class="app-header__logo" style="text-decoration:none;">
        <div class="app-header__logo-icon">📋</div>
        <div class="app-header__logo-text">Oliver Mc Inroy <span>Catalogue</span></div>
      </a>
      <div class="app-header__actions">
        <button class="btn btn-icon btn-ghost" id="btn-backup" title="Backup & Restore">
          ${icons.settings}
        </button>
      </div>
    </div>
  `;

  // Backup menu
  document.getElementById('btn-backup').addEventListener('click', () => {
    showBackupMenu();
  });
}

function showBackupMenu() {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="backup-overlay">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>Backup & Restore</h3>
          <button class="btn btn-icon btn-ghost" id="backup-close">${icons.x}</button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:var(--space-md);">
          <button class="btn btn-secondary" id="btn-export-data" style="justify-content:flex-start;">
            ${icons.download} Export All Data (JSON)
          </button>
          <button class="btn btn-secondary" id="btn-import-data" style="justify-content:flex-start;">
            ${icons.upload} Import Data (JSON)
          </button>
          <input type="file" id="import-file-input" accept=".json" style="display:none">
          <hr style="border:none;border-top:1px solid var(--border-subtle);">
          <p class="text-sm text-muted">
            Export your product data as a JSON file for backup. Import a previously exported file to restore your products.
          </p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backup-close').addEventListener('click', () => { container.innerHTML = ''; });
  document.getElementById('backup-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) container.innerHTML = '';
  });

  // Export
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oliver_mc_inroy_catalogue_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Data Exported', message: 'Your backup file has been downloaded.' });
    container.innerHTML = '';
  });

  // Import
  document.getElementById('btn-import-data').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  document.getElementById('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const success = store.importData(text);
      if (success) {
        showToast({ type: 'success', title: 'Data Imported', message: 'Your products have been restored.' });
        container.innerHTML = '';
        // Re-render current page
        router.navigate('#/');
      } else {
        showToast({ type: 'error', title: 'Import Failed', message: 'Invalid data format.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Import Failed', message: err.message });
    }
  });
}
