// =============================================
// CatalogueGen — Add Product Page
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';
import { showToast } from '../components/toast.js';
import { renderCategorySelector } from '../components/category-selector.js';
import { compressImage, normalizeImageUrl } from '../utils/image-loader.js';

export function renderAddProductPage(container) {
  let selectedCategory = '';
  let selectedMaterials = [];
  let selectedBuyers = [];

  container.innerHTML = `
    <div class="page product-detail-layout">
      <div style="display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-md);">
        <button type="button" class="btn btn-secondary btn-sm" id="add-btn-back" style="padding: 6px; border-radius: var(--radius-full); height: 32px; width: 32px; display: flex; align-items: center; justify-content: center;" title="Go Back">
          ${icons.arrowLeft}
        </button>
        <div class="breadcrumb" style="margin-bottom: 0;">
          <a href="#/">Products</a>
          <span class="breadcrumb__separator">${icons.chevronRight}</span>
          <span class="breadcrumb__current">Add Product</span>
        </div>
      </div>

      <div class="product-detail-layout__header" style="margin-bottom: var(--space-md);">
        <div>
          <h2 style="font-family:var(--font-heading); font-size:1.4rem; font-weight:700; margin:0;">Add New Product</h2>
          <p style="margin: 4px 0 0; color: var(--text-secondary); font-size: 0.9rem;">Fill in the product details below to add it to your catalogue.</p>
        </div>
        <div style="display:flex; gap:8px; align-items: flex-start;">
          <button type="submit" form="add-form" class="btn btn-primary btn-sm">${icons.plus} Save</button>
          <button type="button" class="btn btn-secondary btn-sm" id="add-cancel">Cancel</button>
        </div>
      </div>

      <form id="add-form" class="product-detail-layout__content" style="margin: 0;">
        <!-- Left Column: Image editing -->
        <div class="product-detail-layout__left">
          <div class="product-detail-layout__image-container" id="add-image-preview" style="cursor: pointer; border: 2px dashed var(--border); transition: border-color 0.2s;">
            <div class="product-detail-layout__image-placeholder" style="pointer-events: none;">
              ${icons.image}
              <div style="font-weight:600;margin-top:8px;">Drag & Drop Image</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">or click to browse</div>
            </div>
            <input type="file" id="add-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">
          </div>

          <div class="form-group" style="margin-bottom: 0; width: 100%;">
            <label class="form-label" for="add-image" style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 4px;">Or Image URL</label>
            <input type="text" class="form-input" id="add-image" placeholder="https://example.com/image.jpg" style="padding: 8px 12px; font-size: 0.85rem;">
          </div>
        </div>

        <!-- Right Column: Form fields -->
        <div class="product-detail-layout__right">
          <div class="product-detail-layout__scrollable">
            <div class="card" style="padding: var(--space-lg); margin-bottom: 0; height: 100%; overflow-y: auto;">
              
              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" for="add-name" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Product Name *</label>
                <input type="text" class="form-input" id="add-name" placeholder="Enter product name" required style="padding: 10px 14px; font-size:0.9rem;" autofocus>
              </div>

              <div class="form-row" style="margin-bottom: var(--space-sm); gap: var(--space-md); grid-template-columns: 1fr 1fr;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="add-price" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Price ($) *</label>
                  <input type="number" class="form-input" id="add-price" placeholder="0.00" min="0" step="0.01" required style="padding: 10px 14px; font-size:0.9rem;">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" for="add-size" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Size</label>
                  <input type="text" class="form-input" id="add-size" placeholder="e.g., Large, 12x8 inches" style="padding: 10px 14px; font-size:0.9rem;">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Category</label>
                <div id="add-category"></div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-sm);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Materials</label>
                <div id="add-materials"></div>
              </div>

              <div class="form-group" style="margin-bottom: var(--space-md);">
                <label class="form-label" style="font-size:0.8rem; font-weight:600; margin-bottom:4px;">Buyer Categories</label>
                <div id="add-buyers"></div>
              </div>
            </div>
          </div>
        </div>
      </form>
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

  // Image preview & Drag-and-drop
  const imgInput = document.getElementById('add-image');
  const preview = document.getElementById('add-image-preview');

  const updatePreview = (url) => {
    if (url) {
      preview.style.borderStyle = 'solid';
      preview.innerHTML = `<img src="${url}" alt="Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<div class=image-preview__placeholder>Invalid image</div>'"><input type="file" id="add-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`;
      document.getElementById('add-image-file').addEventListener('change', handleFile);
    } else {
      preview.style.borderStyle = 'dashed';
      preview.innerHTML = `<div class="image-preview__placeholder" style="text-align: center; color: var(--text-muted); pointer-events: none;">${icons.image}<br>Drag & Drop Image<br>or click to browse</div><input type="file" id="add-image-file" accept="image/*" style="opacity: 0; position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;">`;
      document.getElementById('add-image-file').addEventListener('change', handleFile);
    }
  };

  imgInput.addEventListener('input', (e) => {
    const cleaned = normalizeImageUrl(e.target.value.trim());
    if (cleaned !== e.target.value) e.target.value = cleaned;  // replace wrapper URL in-place
    updatePreview(cleaned);
  });

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

  document.getElementById('add-image-file').addEventListener('change', handleFile);
  
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

  // Cancel and Back
  const handleCancel = () => {
    router.navigate('#/');
  };
  document.getElementById('add-cancel').addEventListener('click', handleCancel);
  document.getElementById('add-btn-back').addEventListener('click', handleCancel);

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
      imageUrl: normalizeImageUrl(document.getElementById('add-image').value),
    });

    showToast({
      type: 'success',
      title: 'Product Added',
      message: `"${product.name}" has been added to your catalogue.`,
    });

    router.navigate('#/');
  });
}
