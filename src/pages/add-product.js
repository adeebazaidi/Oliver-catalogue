// =============================================
// CatalogueGen — Add Product Page
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';
import { showToast } from '../components/toast.js';
import { renderCategorySelector } from '../components/category-selector.js';

export function renderAddProductPage(container) {
  let selectedCategories = [];

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
          <div class="form-group">
            <label class="form-label" for="add-name">Product Name *</label>
            <input type="text" class="form-input" id="add-name" placeholder="Enter product name" required autofocus>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="add-price">Price (₹) *</label>
              <input type="number" class="form-input" id="add-price" placeholder="0.00" min="0" step="0.01" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="add-size">Size</label>
              <input type="text" class="form-input" id="add-size" placeholder="e.g., Large, 12x8 inches">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="add-material">Material</label>
            <input type="text" class="form-input" id="add-material" placeholder="e.g., Cotton, Silk, Wood">
          </div>

          <div class="form-group">
            <label class="form-label">Categories</label>
            <div id="add-categories"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="add-image">Image URL</label>
            <input type="url" class="form-input" id="add-image" placeholder="https://example.com/image.jpg">
            <div class="image-preview" id="add-image-preview">
              <div class="image-preview__placeholder">
                ${icons.image}
                <br>Paste an image URL above to preview
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="add-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">
              ${icons.plus} Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Category selector
  renderCategorySelector('add-categories', selectedCategories, (cats) => {
    selectedCategories = cats;
  });

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
      material: document.getElementById('add-material').value,
      categories: selectedCategories,
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
