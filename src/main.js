// =============================================
// CatalogueGen — Main Entry Point
// =============================================

import './styles/index.css';
import './styles/animations.css';
import './styles/animations.css';
import { router } from './router.js';
import { store } from './store.js';
import { icons } from './icons.js';
import { showToast } from './components/toast.js';

import { renderHomePage } from './pages/home.js';
import { renderProductDetailPage } from './pages/product-detail.js';
import { renderAddProductPage } from './pages/add-product.js';

// Initialize app directly
initApp();

async function initApp() {
  const app = document.getElementById('app');
  app.style.display = 'block';

  // Apply saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Wait for IndexedDB store to be ready
  await store.whenReady();

  // Setup routes
  const main = document.getElementById('app-main');
  router.addRoute('/', () => renderHomePage(main));
  router.addRoute('/product/:id', (params) => renderProductDetailPage(main, params));
  router.addRoute('/add', () => renderAddProductPage(main));

  // Initialize router
  router.init(main);

  // Clear selection toolbar on non-home pages
  router.onRoute((route) => {
    if (route.path !== '/') {
      const toolbar = document.getElementById('selection-toolbar-container');
      if (toolbar) toolbar.innerHTML = '';
    }
  });
}
