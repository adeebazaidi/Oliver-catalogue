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
import { compressImage } from '../utils/image-loader.js';
import { formatPrice } from '../utils/currency.js';

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
    <div class="page product-detail-layout">
      <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
        <button class="btn btn-secondary btn-sm" id="btn-back" style="padding: 6px; border-radius: var(--radius-full); height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;" title="Go Back">
          ${icons.arrowLeft}
        </button>
        <div class="breadcrumb" style="margin-bottom: 0;">
          <a href="#/" id="breadcrumb-home">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">${product.name}</span>
        </div>
      </div>

      <div class="product-detail-layout__header" style="margin-bottom: var(--space-md);">
        <div class="product-detail-layout__title-area">
          <h1 class="product-detail-layout__title" title="${product.name}">${product.name}</h1>
          <button class="star-btn ${product.favorite ? 'active' : ''}" id="detail-star" title="Toggle favorite" style="margin-left: 8px;">
            ${icons.star}
          </button>
        </div>
        <div class="product-detail__actions">
          <button class="btn btn-secondary btn-sm" id="btn-edit">
            ${icons.edit} Edit
          </button>
          <button class="btn btn-danger btn-sm" id="btn-delete">
            ${icons.trash} Delete
          </button>
        </div>
      </div>

      <div class="product-detail-layout__content">
        <!-- Left Column: Image & Metadata -->
        <div class="product-detail-layout__left">
          <div class="product-detail-layout__image-container">
            ${product.imageUrl && !product.imageUrl.startsWith('idb:')
              ? `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.parentElement.innerHTML='<div class=\'product-detail-layout__image-placeholder\'><div style=\'font-family:var(--font-heading);font-size:3rem;color:var(--color-cream);margin-bottom:var(--space-md);\'>${initials}</div>No image found</div>'">`
              : product.imageUrl && product.imageUrl.startsWith('idb:')
                ? `<img id="detail-idb-image" alt="${product.name}" style="display:none;"><div id="detail-idb-placeholder" class="product-detail-layout__image-placeholder"><div style="font-family:var(--font-heading);font-size:3rem;color:var(--color-cream);margin-bottom:var(--space-md);">${initials}</div>Loading...</div>`
                : `<div class="product-detail-layout__image-placeholder">
                <div style="font-family:var(--font-heading);font-size:3rem;color:var(--color-cream);margin-bottom:var(--space-md);">${initials}</div>
                No image provided
              </div>`
            }
          </div>

          <div class="product-detail-layout__metadata">
            <span>Created: ${new Date(product.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>·</span>
            <span>Updated: ${new Date(product.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <!-- Right Column: Info & Actions -->
        <div class="product-detail-layout__right">
          <div class="product-detail-layout__scrollable">
            <div class="card" style="padding: var(--space-lg); margin-bottom: 0; display: flex; flex-direction: column; height: 100%; overflow-y: auto;">
              <div class="product-detail__info-grid" style="grid-template-columns: repeat(2, 1fr); gap: var(--space-md);">
                <div class="product-detail__field" style="padding: 4px 0;">
                  <div class="product-detail__field-label" style="margin-bottom: 2px;">Price</div>
                  <div class="product-detail__field-value" style="color:var(--color-primary);font-size:1.4rem;font-family:var(--font-heading);font-weight:700;">
                    ${formatPrice(product.price)}
                  </div>
                </div>
                <div class="product-detail__field" style="padding: 4px 0;">
                  <div class="product-detail__field-label" style="margin-bottom: 2px;">Size</div>
                  <div class="product-detail__field-value">${product.size || '—'}</div>
                </div>
                <div class="product-detail__field" style="grid-column: span 2; padding: 4px 0; border-top: 1px solid var(--border-subtle); margin-top: 4px; padding-top: 12px;">
                  <div class="product-detail__field-label" style="margin-bottom: 6px;">Category</div>
                  <div class="product-detail__field-value">
                    ${product.category ? `<span class="badge badge-gold" style="font-size: 0.85rem; padding: 6px 12px;">${product.category}</span>` : '—'}
                  </div>
                </div>
                <div class="product-detail__field" style="grid-column: span 2; padding: 4px 0; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                  <div class="product-detail__field-label" style="margin-bottom: 6px;">Materials</div>
                  <div class="product-detail__field-value" style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${product.materials && product.materials.length > 0
                      ? product.materials.map(m => `<span class="badge" style="font-size: 0.8rem; padding: 4px 10px; background:var(--bg-hover); color:var(--text-body); border: 1px solid var(--border);">${m}</span>`).join('')
                      : (product.material ? `<span class="badge" style="font-size: 0.8rem; padding: 4px 10px; background:var(--bg-hover); color:var(--text-body); border: 1px solid var(--border);">${product.material}</span>` : '—')}
                  </div>
                </div>
                <div class="product-detail__field" style="grid-column: span 2; padding: 4px 0; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
                  <div class="product-detail__field-label" style="margin-bottom: 6px;">Buyer Categories</div>
                  <div class="product-detail__field-value" style="display:flex; flex-wrap:wrap; gap:6px;">
                    ${product.buyerCategories && product.buyerCategories.length > 0
                      ? product.buyerCategories.map(c => `<span class="badge badge-wine" style="font-size: 0.8rem; padding: 4px 10px; border-radius:var(--radius-full);">${c}</span>`).join('')
                      : '—'}
                  </div>
                </div>
              </div>
            </div>

            ${product.imageUrl && !product.imageUrl.startsWith('idb:') ? `
              <div class="card" style="padding: var(--space-md); margin-bottom: 0;">
                <div class="product-detail__field" style="padding: 0;">
                  <div class="product-detail__field-label" style="margin-bottom: 2px;">Image URL</div>
                  <div class="product-detail__field-value text-sm" style="word-break:break-all;color:var(--text-secondary);font-size:0.8rem;font-family:monospace;">
                    ${product.imageUrl}
                  </div>
                </div>
              </div>
            ` : product.imageUrl && product.imageUrl.startsWith('idb:') ? `
              <div class="card" style="padding: var(--space-md); margin-bottom: 0;">
                <div class="product-detail__field" style="padding: 0;">
                  <div class="product-detail__field-label" style="margin-bottom: 2px;">Image</div>
                  <div class="product-detail__field-value text-sm" style="color:var(--text-secondary);font-size:0.8rem;">Stored locally (IndexedDB)</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  // Load idb image if needed (view mode)
  if (product.imageUrl && product.imageUrl.startsWith('idb:')) {
    store.resolveImageUrl(product.imageUrl).then(dataUrl => {
      const img = document.getElementById('detail-idb-image');
      const placeholder = document.getElementById('detail-idb-placeholder');
      if (img && dataUrl) {
        img.src = dataUrl;
        img.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
      } else if (placeholder) {
        placeholder.innerHTML = `<div style="font-family:var(--font-heading);font-size:3rem;color:var(--color-cream);margin-bottom:var(--space-md);">${initials}</div>No image found`;
      }
    });
  }

  // Favorite toggle
  document.getElementById('detail-star').addEventListener('click', () => {
    store.toggleFavorite(product.id);
    const btn = document.getElementById('detail-star');
    btn.classList.toggle('active');
    btn.classList.add('animate-star-pop');
    setTimeout(() => btn.classList.remove('animate-star-pop'), 300);
  });

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    router.navigate('#/');
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
  let editCategory = product.category || '';
  let editMaterials = product.materials ? [...product.materials] : (product.material ? [product.material] : []);
  let editBuyers = product.buyerCategories ? [...product.buyerCategories] : [];

  container.innerHTML = `
    <div class="page product-detail-layout">
      <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
        <button type="button" class="btn btn-secondary btn-sm" id="edit-btn-back" style="padding: 6px; border-radius: var(--radius-full); height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;" title="Go Back">
          ${icons.arrowLeft}
        </button>
        <div class="breadcrumb" style="margin-bottom: 0;">
          <a href="#/">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <a href="#/product/${product.id}">${product.name}</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">Edit</span>
        </div>
      </div>

      <div class="product-detail-layout__header" style="margin-bottom: var(--space-md);">
        <h2 style="font-family:var(--font-heading); font-size:1.4rem; font-weight:700; margin:0;">Edit Product Info</h2>
        <div style="display:flex; gap:8px;">
          <button type="submit" form="edit-form" class="btn btn-primary btn-sm">${icons.check} Save</button>
          <button type="button" class="btn btn-secondary btn-sm" id="edit-cancel">Cancel</button>
        </div>
      </div>

      <form id="edit-form" class="product-detail-layout__content" style="margin: 0;">
        <!-- Left Column: Image editing -->
        <div class="product-detail-layout__left">
          <div class="product-detail-layout__image-container" id="edit-image-preview" style="cursor: pointer; border: 2px dashed var(--border); transition: border-color 0.2s;">
            ${product.imageUrl && !product.imageUrl.startsWith('idb:')
              ? `<img src="${product.imageUrl}" alt="Preview">
                 <input type="file" id="edit-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`
              : product.imageUrl && product.imageUrl.startsWith('idb:')
                ? `<img id="edit-idb-image" alt="Preview" style="display:none;">
                   <div id="edit-idb-placeholder" class="product-detail-layout__image-placeholder" style="pointer-events: none;">
                     ${icons.image}
                     <div style="font-weight:600;margin-top:8px;">Loading image...</div>
                   </div>
                   <input type="file" id="edit-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`
                : `<div class="product-detail-layout__image-placeholder" style="pointer-events: none;">
                     ${icons.image}
                     <div style="font-weight:600;margin-top:8px;">Drag & Drop Image</div>
                     <div style="font-size:0.75rem;color:var(--text-muted);">or click to browse</div>
                   </div>
                   <input type="file" id="edit-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`}
          </div>

          <div class="form-group" style="margin-bottom: 0; width: 100%;">
            <label class="form-label" for="edit-image" style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 4px;">Or Image URL</label>
            <input type="text" class="form-input" id="edit-image" value="${product.imageUrl && product.imageUrl.startsWith('idb:') ? '' : product.imageUrl}" placeholder="https://example.com/image.jpg" style="padding: 8px 12px; font-size: 0.85rem;">
          </div>
        </div>

        <!-- Right Column: Form fields -->
        <div class="product-detail-layout__right">
          <div class="product-detail-layout__scrollable">
            <div class="card" style="padding: var(--space-lg); margin-bottom: 0; height: 100%; overflow-y: auto;">
              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" for="edit-name" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Product Name *</label>
                <input type="text" class="form-input" id="edit-name" value="${product.name}" required style="padding: 10px 14px; font-size:0.9rem;">
              </div>

              <div class="form-row" style="margin-bottom: var(--space-sm); gap: var(--space-md); grid-template-columns: 1fr 1fr;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="edit-price" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Price ($) *</label>
                  <input type="number" class="form-input" id="edit-price" value="${product.price}" min="0" step="0.01" required style="padding: 10px 14px; font-size:0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="edit-size" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Size</label>
                  <input type="text" class="form-input" id="edit-size" value="${product.size}" placeholder="e.g., Large, 12x8 inches" style="padding: 10px 14px; font-size:0.9rem;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Category</label>
                <div id="edit-category"></div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Materials</label>
                <div id="edit-materials"></div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-md);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Buyer Categories</label>
                <div id="edit-buyers"></div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  `;

  // Category selectors
  renderCategorySelector('edit-materials', editMaterials, (mats) => {
    editMaterials = mats;
  }, 'materials');

  renderCategorySelector('edit-category', editCategory, (cat) => {
    editCategory = cat;
  }, 'categories', true);

  renderCategorySelector('edit-buyers', editBuyers, (buyers) => {
    editBuyers = buyers;
  }, 'buyers');

  // Load idb image if needed (edit mode)
  if (product.imageUrl && product.imageUrl.startsWith('idb:')) {
    store.resolveImageUrl(product.imageUrl).then(dataUrl => {
      const img = document.getElementById('edit-idb-image');
      const placeholder = document.getElementById('edit-idb-placeholder');
      if (img && dataUrl) {
        img.src = dataUrl;
        img.style.display = '';
        if (placeholder) placeholder.style.display = 'none';
      }
    });
  }

  // Image preview & Drag-and-drop
  const imgInput = document.getElementById('edit-image');
  const preview = document.getElementById('edit-image-preview');

  const updatePreview = (url) => {
    if (url) {
      preview.style.borderStyle = 'solid';
      preview.innerHTML = `<img src="${url}" alt="Preview"><input type="file" id="edit-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`;
      document.getElementById('edit-image-file').addEventListener('change', handleFile);
    } else {
      preview.style.borderStyle = 'dashed';
      preview.innerHTML = `<div class="product-detail-layout__image-placeholder" style="pointer-events: none;">
                   ${icons.image}
                   <div style="font-weight:600;margin-top:8px;">Drag & Drop Image</div>
                   <div style="font-size:0.75rem;color:var(--text-muted);">or click to browse</div>
                 </div><input type="file" id="edit-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`;
      document.getElementById('edit-image-file').addEventListener('change', handleFile);
    }
  };

  imgInput.addEventListener('input', (e) => updatePreview(e.target.value.trim()));

  const handleFile = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        preview.style.opacity = '0.5';
        const base64Url = await compressImage(file);
        imgInput.value = base64Url;
        updatePreview(base64Url);
      } catch (err) {
        showToast({ type: 'error', title: 'Image Error', message: 'Failed to process image.' });
      } finally {
        preview.style.opacity = '1';
      }
    }
  };

  const initialFileInput = document.getElementById('edit-image-file');
  if (initialFileInput) initialFileInput.addEventListener('change', handleFile);
  
  preview.addEventListener('dragover', (e) => {
    e.preventDefault();
    preview.style.borderColor = 'var(--color-primary)';
  });
  preview.addEventListener('dragleave', () => {
    preview.style.borderColor = 'var(--border-color)';
  });
  preview.addEventListener('drop', (e) => {
    e.preventDefault();
    preview.style.borderColor = 'var(--border-color)';
    handleFile(e);
  });

  // Cancel button and Back button
  const handleCancel = () => {
    renderViewMode(container, product);
  };
  
  document.getElementById('edit-cancel').addEventListener('click', handleCancel);
  document.getElementById('edit-btn-back').addEventListener('click', handleCancel);

  // Submit
  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = store.updateProduct(product.id, {
      name: document.getElementById('edit-name').value,
      price: document.getElementById('edit-price').value,
      size: document.getElementById('edit-size').value,
      materials: editMaterials,
      category: editCategory,
      buyerCategories: editBuyers,
      imageUrl: document.getElementById('edit-image').value,
    });

    if (updated) {
      showToast({ type: 'success', title: 'Product Updated', message: `"${updated.name}" has been saved.` });
      renderViewMode(container, updated);
    }
  });
}
