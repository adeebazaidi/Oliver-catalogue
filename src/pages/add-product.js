// =============================================
// CatalogueGen — Add Product Page
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';
import { showToast } from '../components/toast.js';
import { renderCategorySelector } from '../components/category-selector.js';

export function renderAddProductPage(container) {
  let selectedCategory = '';
  let selectedMaterials = [];
  let selectedBuyers = [];

  container.innerHTML = `
    <div class="page">
      <div class="container form-page">
        <div class="breadcrumb">
          <a href="#/">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">Add Product</span>
        </div>

        <h2 class="form-page__title">Add New Product</h2>
        <p class="form-page__subtitle">Fill in the product details below to add it to your catalogue.</p>

        <form id="add-form">
          <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap; align-items: flex-start;">
            
            <!-- Left Side: Image -->
            <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: var(--space-md);">
              <div class="image-preview" id="add-image-preview" style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color, #e2e8f0); box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));">
                <div class="image-preview__placeholder" style="text-align: center; color: var(--text-muted, #64748b);">
                  ${icons.image}
                  <br>Paste an image URL below
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="add-image" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Image URL</label>
                <input type="url" class="form-input" id="add-image" placeholder="https://example.com/image.jpg">
              </div>
            </div>

            <!-- Right Side: Details -->
            <div style="flex: 2; min-width: 300px; display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="add-name">Product Name *</label>
                <input type="text" class="form-input" id="add-name" placeholder="Enter product name" required autofocus>
              </div>

              <div class="form-row" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="add-price">Price ($) *</label>
                  <input type="number" class="form-input" id="add-price" placeholder="0.00" min="0" step="0.01" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="add-size">Size</label>
                  <input type="text" class="form-input" id="add-size" placeholder="e.g., Large, 12x8 inches">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Materials</label>
                <div id="add-materials"></div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Category</label>
                <div id="add-category"></div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Buyer Categories</label>
                <div id="add-buyers"></div>
              </div>

              <div class="form-actions" style="justify-content: flex-start; margin-top: 4px;">
                <button type="submit" class="btn btn-primary">
                  ${icons.plus} Save Product
                </button>
                <button type="button" class="btn btn-secondary" id="add-cancel">Cancel</button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  `;

  renderCategorySelector('add-materials', selectedMaterials, (mats) => {
    selectedMaterials = mats;
  }, 'materials');

  renderCategorySelector('add-category', selectedCategory, (cat) => {
    selectedCategory = cat;
  }, 'categories', true);



  renderCategorySelector('add-buyers', selectedBuyers, (buyers) => {
    selectedBuyers = buyers;
  }, 'buyers');

  // Image preview
  document.getElementById('add-image').addEventListener('input', (e) => {
    const preview = document.getElementById('add-image-preview');
    const url = e.target.value.trim();
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=image-preview__placeholder>Invalid image URL</div>'">`;
    } else {
      preview.innerHTML = `<div class="image-preview__placeholder">${icons.image}<br>Paste an image URL above to preview</div>`;
    }
  });

  // Cancel
  document.getElementById('add-cancel').addEventListener('click', () => {
    router.navigate('#/');
  });

  // Submit
  document.getElementById('add-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('add-name').value.trim();
    if (!name) {
      showToast({ type: 'error', title: 'Validation Error', message: 'Product name is required.' });
      return;
    }

    const product = store.addProduct({
      name,
      price: document.getElementById('add-price').value,
      size: document.getElementById('add-size').value,
      materials: selectedMaterials,
      category: selectedCategory,
      buyerCategories: selectedBuyers,
      imageUrl: document.getElementById('add-image').value,
    });

    showToast({
      type: 'success',
      title: 'Product Added',
      message: `"${product.name}" has been added to your catalogue.`,
    });

    router.navigate('#/');
  });
}
