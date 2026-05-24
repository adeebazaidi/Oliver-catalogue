// =============================================
// CatalogueGen — Product Detail Page
// View / Edit / Delete product
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';
import { showConfirm } from '../components/confirm-dialog.js';
import { showToast } from '../components/toast.js';
import { renderCategorySelector } from '../components/category-selector.js';

let isEditing = false;

export function renderProductDetailPage(container, { id }) {
  isEditing = false;
  const product = store.getProductById(id);

  if (!product) {
    container.innerHTML = `
      <div class="page">
        <div class="container">
          <div class="empty-state">
            <div class="empty-state__icon">${icons.alertCircle}</div>
            <div class="empty-state__title">Product not found</div>
            <div class="empty-state__text">This product may have been deleted.</div>
            <button class="btn btn-primary" onclick="window.location.hash='#/'">
              ${icons.arrowLeft} Back to Products
            </button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  renderViewMode(container, product);
}

function renderViewMode(container, product) {
  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  container.innerHTML = `
    <div class="page">
      <div class="container product-detail">
        <div class="breadcrumb">
          <a href="#/" id="breadcrumb-home">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">${product.name}</span>
        </div>

        <div class="product-detail__header">
          <div style="display:flex;align-items:center;gap:var(--space-md);">
            <h1 class="product-detail__title">${product.name}</h1>
            <button class="star-btn ${product.favorite ? 'active' : ''}" id="detail-star" title="Toggle favorite">
              ${icons.star}
            </button>
          </div>
          <div class="product-detail__actions">
            <button class="btn btn-secondary" id="btn-edit">
              ${icons.edit} Edit
            </button>
            <button class="btn btn-danger" id="btn-delete">
              ${icons.trash} Delete
            </button>
          </div>
        </div>

        ${product.imageUrl ? `
          <div class="product-detail__image">
            <img src="${product.imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=product-detail__image-placeholder>${icons.image}<br>Image could not be loaded</div>'">
          </div>
        ` : `
          <div class="product-detail__image">
            <div class="product-detail__image-placeholder">
              <div style="font-family:var(--font-heading);font-size:4rem;color:var(--color-cream);margin-bottom:var(--space-md);">${initials}</div>
              No image provided
            </div>
          </div>
        `}

        <div class="card" style="padding:var(--space-xl);margin-bottom:var(--space-xl);">
          <div class="product-detail__info-grid">
            <div class="product-detail__field">
              <div class="product-detail__field-label">Price</div>
              <div class="product-detail__field-value" style="color:var(--color-primary);font-size:1.35rem;font-family:var(--font-heading);">
                ₹${product.price.toLocaleString('en-IN')}
              </div>
            </div>
            <div class="product-detail__field">
              <div class="product-detail__field-label">Size</div>
              <div class="product-detail__field-value">${product.size || '—'}</div>
            </div>
            <div class="product-detail__field">
              <div class="product-detail__field-label">Material</div>
              <div class="product-detail__field-value">${product.material || '—'}</div>
            </div>
            <div class="product-detail__field">
              <div class="product-detail__field-label">Categories</div>
              <div class="product-detail__field-value">
                ${product.categories.length > 0
                  ? product.categories.map(c => `<span class="badge badge-gold" style="margin-right:4px;margin-bottom:4px;">${c}</span>`).join('')
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        ${product.imageUrl ? `
          <div class="card" style="padding:var(--space-lg);">
            <div class="product-detail__field">
              <div class="product-detail__field-label">Image URL</div>
              <div class="product-detail__field-value text-sm" style="word-break:break-all;color:var(--text-secondary);">
                ${product.imageUrl}
              </div>
            </div>
          </div>
        ` : ''}

        <div style="margin-top:var(--space-xl);display:flex;gap:var(--space-sm);font-size:0.8rem;color:var(--text-muted);">
          <span>Created: ${new Date(product.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>Updated: ${new Date(product.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  `;

  // Favorite toggle
  document.getElementById('detail-star').addEventListener('click', () => {
    store.toggleFavorite(product.id);
    const btn = document.getElementById('detail-star');
    btn.classList.toggle('active');
    btn.classList.add('animate-star-pop');
    setTimeout(() => btn.classList.remove('animate-star-pop'), 300);
  });

  // Edit button
  document.getElementById('btn-edit').addEventListener('click', () => {
    renderEditMode(container, product);
  });

  // Delete button
  document.getElementById('btn-delete').addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
    });
    if (confirmed) {
      store.deleteProduct(product.id);
      showToast({ type: 'success', title: 'Product Deleted', message: `"${product.name}" has been removed.` });
      router.navigate('#/');
    }
  });
}

function renderEditMode(container, product) {
  let editCategories = [...product.categories];

  container.innerHTML = `
    <div class="page">
      <div class="container form-page">
        <div class="breadcrumb">
          <a href="#/">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <a href="#/product/${product.id}">${product.name}</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">Edit</span>
        </div>

        <h2 class="form-page__title">Edit Product</h2>
        <p class="form-page__subtitle">Update the product information below.</p>

        <form id="edit-form">
          <div class="form-group">
            <label class="form-label" for="edit-name">Product Name *</label>
            <input type="text" class="form-input" id="edit-name" value="${product.name}" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-price">Price (₹) *</label>
              <input type="number" class="form-input" id="edit-price" value="${product.price}" min="0" step="0.01" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="edit-size">Size</label>
              <input type="text" class="form-input" id="edit-size" value="${product.size}" placeholder="e.g., Large, 12x8 inches">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-material">Material</label>
            <input type="text" class="form-input" id="edit-material" value="${product.material}" placeholder="e.g., Cotton, Silk, Wood">
          </div>

          <div class="form-group">
            <label class="form-label">Categories</label>
            <div id="edit-categories"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-image">Image URL</label>
            <input type="url" class="form-input" id="edit-image" value="${product.imageUrl}" placeholder="https://example.com/image.jpg">
            <div class="image-preview" id="edit-image-preview">
              ${product.imageUrl
                ? `<img src="${product.imageUrl}" alt="Preview">`
                : `<div class="image-preview__placeholder">${icons.image}<br>Paste an image URL above</div>`}
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="edit-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Category selector
  renderCategorySelector('edit-categories', editCategories, (cats) => {
    editCategories = cats;
  });

  // Image preview
  document.getElementById('edit-image').addEventListener('input', (e) => {
    const preview = document.getElementById('edit-image-preview');
    const url = e.target.value.trim();
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=image-preview__placeholder>Invalid URL</div>'">`;
    } else {
      preview.innerHTML = `<div class="image-preview__placeholder">${icons.image}<br>Paste an image URL above</div>`;
    }
  });

  // Cancel
  document.getElementById('edit-cancel').addEventListener('click', () => {
    renderViewMode(container, product);
  });

  // Submit
  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = store.updateProduct(product.id, {
      name: document.getElementById('edit-name').value,
      price: document.getElementById('edit-price').value,
      size: document.getElementById('edit-size').value,
      material: document.getElementById('edit-material').value,
      categories: editCategories,
      imageUrl: document.getElementById('edit-image').value,
    });

    if (updated) {
      showToast({ type: 'success', title: 'Product Updated', message: `"${updated.name}" has been saved.` });
      renderViewMode(container, updated);
    }
  });
}
