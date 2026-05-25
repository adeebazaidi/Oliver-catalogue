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
