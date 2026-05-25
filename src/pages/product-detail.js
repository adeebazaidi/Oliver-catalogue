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

        <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap; align-items: flex-start;">
          <!-- Left side: Image -->
          <div style="flex: 1; min-width: 300px;">
            ${product.imageUrl ? `
              <div class="product-detail__image" style="margin-bottom: 0;">
                <img src="${product.imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\\'product-detail__image-placeholder\\'><div style=\\'font-family:var(--font-heading);font-size:4rem;color:var(--color-cream);margin-bottom:var(--space-md);\\'>${initials}</div>No image provided</div>'">
              </div>
            ` : `
              <div class="product-detail__image" style="margin-bottom: 0;">
                <div class="product-detail__image-placeholder">
                  <div style="font-family:var(--font-heading);font-size:4rem;color:var(--color-cream);margin-bottom:var(--space-md);">${initials}</div>
                  No image provided
                </div>
              </div>
            `}
          </div>

          <!-- Right side: Details -->
          <div style="flex: 2; min-width: 300px; display: flex; flex-direction: column; gap: var(--space-md);">
            <div class="card" style="padding:var(--space-xl);">
              <div class="product-detail__info-grid">
                <div class="product-detail__field">
                  <div class="product-detail__field-label">Price</div>
                  <div class="product-detail__field-value" style="color:var(--color-primary);font-size:1.35rem;font-family:var(--font-heading);">
                    $${product.price.toLocaleString('en-US')}
                  </div>
                </div>
                <div class="product-detail__field">
                  <div class="product-detail__field-label">Size</div>
                  <div class="product-detail__field-value">${product.size || '—'}</div>
                </div>
                <div class="product-detail__field">
                  <div class="product-detail__field-label">Materials</div>
                  <div class="product-detail__field-value">
                    ${product.materials && product.materials.length > 0
                      ? product.materials.map(m => `<span class="badge badge-gold" style="margin-right:4px;margin-bottom:4px;">${m}</span>`).join('')
                      : (product.material ? `<span class="badge badge-gold" style="margin-right:4px;margin-bottom:4px;">${product.material}</span>` : '—')}
                  </div>
                </div>
                <div class="product-detail__field">
                  <div class="product-detail__field-label">Product Categories</div>
                  <div class="product-detail__field-value">
                    ${product.categories && product.categories.length > 0
                      ? product.categories.map(c => `<span class="badge badge-gold" style="margin-right:4px;margin-bottom:4px;">${c}</span>`).join('')
                      : '—'}
                  </div>
                </div>
                <div class="product-detail__field">
                  <div class="product-detail__field-label">Buyer Categories</div>
                  <div class="product-detail__field-value">
                    ${product.buyerCategories && product.buyerCategories.length > 0
                      ? product.buyerCategories.map(c => `<span class="badge badge-wine" style="margin-right:4px;margin-bottom:4px;">${c}</span>`).join('')
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

            <div style="margin-top:var(--space-sm);display:flex;gap:var(--space-sm);font-size:0.8rem;color:var(--text-muted);">
              <span>Created: ${new Date(product.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>·</span>
              <span>Updated: ${new Date(product.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
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
  let editMaterials = product.materials ? [...product.materials] : (product.material ? [product.material] : []);
  let editBuyers = product.buyerCategories ? [...product.buyerCategories] : [];

  container.innerHTML = `
    <div class="page">
      <div class="container form-page" style="max-width: 1000px;">
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
          <div style="display: flex; gap: var(--space-xl); flex-wrap: wrap; align-items: flex-start;">
            
            <!-- Left Side: Image -->
            <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: var(--space-md);">
              <div class="image-preview" id="edit-image-preview" style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color, #e2e8f0); box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));">
                ${product.imageUrl
                  ? `<img src="${product.imageUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`
                  : `<div class="image-preview__placeholder" style="text-align: center; color: var(--text-muted, #64748b);">${icons.image}<br>Paste an image URL below</div>`}
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="edit-image" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Image URL</label>
                <input type="url" class="form-input" id="edit-image" value="${product.imageUrl}" placeholder="https://example.com/image.jpg">
              </div>
            </div>

            <!-- Right Side: Details -->
            <div style="flex: 2; min-width: 300px; display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label" for="edit-name">Product Name *</label>
                <input type="text" class="form-input" id="edit-name" value="${product.name}" required>
              </div>

              <div class="form-row" style="margin-bottom: 0;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="edit-price">Price ($) *</label>
                  <input type="number" class="form-input" id="edit-price" value="${product.price}" min="0" step="0.01" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="edit-size">Size</label>
                  <input type="text" class="form-input" id="edit-size" value="${product.size}" placeholder="e.g., Large, 12x8 inches">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Materials</label>
                <div id="edit-materials"></div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Product Categories</label>
                <div id="edit-categories"></div>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Buyer Categories</label>
                <div id="edit-buyers"></div>
              </div>

              <div class="form-actions" style="justify-content: flex-start; margin-top: 4px;">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-secondary" id="edit-cancel">Cancel</button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  `;

  // Category selectors
  renderCategorySelector('edit-materials', editMaterials, (mats) => {
    editMaterials = mats;
  }, 'materials');

  renderCategorySelector('edit-categories', editCategories, (cats) => {
    editCategories = cats;
  }, 'categories');

  renderCategorySelector('edit-buyers', editBuyers, (buyers) => {
    editBuyers = buyers;
  }, 'buyers');

  // Image preview
  document.getElementById('edit-image').addEventListener('input', (e) => {
    const preview = document.getElementById('edit-image-preview');
    const url = e.target.value.trim();
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<div class=image-preview__placeholder style=\\'text-align: center;\\'>Invalid URL</div>'">`;
    } else {
      preview.innerHTML = `<div class="image-preview__placeholder" style="text-align: center; color: var(--text-muted, #64748b);">${icons.image}<br>Paste an image URL below</div>`;
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
      materials: editMaterials,
      categories: editCategories,
      buyerCategories: editBuyers,
      imageUrl: document.getElementById('edit-image').value,
    });

    if (updated) {
      showToast({ type: 'success', title: 'Product Updated', message: `"${updated.name}" has been saved.` });
      renderViewMode(container, updated);
    }
  });
}
