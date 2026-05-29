// =============================================
// CatalogueGen — Export Modal
// Multi-step export wizard
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { showToast } from './toast.js';
import ExportWorker from '../workers/export.worker.js?worker';
import { saveAs } from 'file-saver';

let currentStep = 1;
let orderedProducts = [];
let coverInfo = {
  title: '',
  subtitle: '',
  date: new Date().toISOString().split('T')[0],
  companyName: '',
};

export function showExportModal() {
  currentStep = 1;
  orderedProducts = store.getSelectedProducts();
  coverInfo = {
    title: 'Product Catalogue',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    companyName: '',
  };

  renderModal();
}

function renderModal() {
  const container = document.getElementById('modal-container');

  container.innerHTML = `
    <div class="modal-overlay" id="export-overlay">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Generate Catalogue</h3>
          <button class="btn btn-icon btn-ghost" id="export-close">${icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="export-steps">
            <div class="export-step ${currentStep >= 1 ? (currentStep > 1 ? 'completed' : 'active') : ''}">
              <div class="export-step__dot">${currentStep > 1 ? icons.check : '1'}</div>
              <span>Reorder</span>
            </div>
            <div class="export-step ${currentStep >= 2 ? (currentStep > 2 ? 'completed' : 'active') : ''}">
              <div class="export-step__dot">${currentStep > 2 ? icons.check : '2'}</div>
              <span>Cover Details</span>
            </div>
            <div class="export-step ${currentStep >= 3 ? 'active' : ''}">
              <div class="export-step__dot">3</div>
              <span>Export</span>
            </div>
          </div>

          <div id="export-step-content"></div>
        </div>
        <div class="modal-footer" id="export-footer"></div>
      </div>
    </div>
  `;

  renderStepContent();

  document.getElementById('export-close').addEventListener('click', closeModal);
  document.getElementById('export-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function renderStepContent() {
  const content = document.getElementById('export-step-content');
  const footer = document.getElementById('export-footer');

  if (footer) footer.style.display = 'flex';

  if (currentStep === 1) {
    // Step 1: Reorder products
    content.innerHTML = `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);font-size:0.9rem;">
        Drag products to set the order they'll appear in the catalogue.
      </p>
      <div class="drag-list" id="drag-list">
        ${orderedProducts.map((p, i) => `
          <div class="drag-item" draggable="true" data-drag-id="${p.id}">
            <span class="drag-item__handle">${icons.gripVertical}</span>
            <span class="drag-item__index">${i + 1}</span>
            <span class="drag-item__name">${p.name}</span>
            <span class="badge">$${p.price.toLocaleString('en-US')}</span>
          </div>
        `).join('')}
      </div>
    `;

    initDragAndDrop();

    footer.innerHTML = `
      <button class="btn btn-secondary" id="export-cancel">Cancel</button>
      <button class="btn btn-primary" id="export-next">Next →</button>
    `;
  } else if (currentStep === 2) {
    // Step 2: Cover details
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-xl);">
        <div>
          <div class="form-group">
            <label class="form-label">Catalogue Title</label>
            <input type="text" class="form-input" id="cover-title" value="${coverInfo.title}" placeholder="e.g., Spring 2026 Collection">
          </div>
          <div class="form-group">
            <label class="form-label">Subtitle (Optional)</label>
            <input type="text" class="form-input" id="cover-subtitle" value="${coverInfo.subtitle}" placeholder="e.g., Premium Home Furnishings">
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-input" id="cover-date" value="${coverInfo.date}">
          </div>
          <div class="form-group" style="margin-bottom: var(--space-xl);">
            <label class="form-label">Company Name (Optional)</label>
            <input type="text" class="form-input" id="cover-company" value="${coverInfo.companyName}" placeholder="Your Company Name">
          </div>
          
          <!-- Back & Next buttons shifted upwards -->
          <div style="display:flex; gap:var(--space-md); margin-top:var(--space-lg);">
            <button class="btn btn-secondary" id="export-back">← Back</button>
            <button class="btn btn-primary" id="export-next">Next →</button>
          </div>
        </div>
        <div>
          <label class="form-label" style="margin-bottom:var(--space-md);">Preview</label>
          <div class="cover-preview" id="cover-preview">
            <div class="cover-preview__title">${coverInfo.title || 'Catalogue Title'}</div>
            ${coverInfo.subtitle ? `<div class="cover-preview__subtitle">${coverInfo.subtitle}</div>` : ''}
            <div class="cover-preview__meta">
              ${coverInfo.companyName ? `${coverInfo.companyName} · ` : ''}${coverInfo.date}
              <br>${orderedProducts.length} Products
            </div>
          </div>
        </div>
      </div>
    `;

    // Live preview updates
    const updatePreview = () => {
      coverInfo.title = document.getElementById('cover-title').value;
      coverInfo.subtitle = document.getElementById('cover-subtitle').value;
      coverInfo.date = document.getElementById('cover-date').value;
      coverInfo.companyName = document.getElementById('cover-company').value;

      const preview = document.getElementById('cover-preview');
      preview.innerHTML = `
        <div class="cover-preview__title">${coverInfo.title || 'Catalogue Title'}</div>
        ${coverInfo.subtitle ? `<div class="cover-preview__subtitle">${coverInfo.subtitle}</div>` : '<div class="cover-preview__subtitle" style="opacity:0.3">Subtitle</div>'}
        <div class="cover-preview__meta">
          ${coverInfo.companyName ? `${coverInfo.companyName} · ` : ''}${coverInfo.date}
          <br>${orderedProducts.length} Products
        </div>
      `;
    };

    ['cover-title', 'cover-subtitle', 'cover-date', 'cover-company'].forEach(id => {
      document.getElementById(id).addEventListener('input', updatePreview);
    });

    footer.innerHTML = ``;
    footer.style.display = 'none';
  } else if (currentStep === 3) {
    // Step 3: Choose format
    content.innerHTML = `
      <p style="color:var(--text-secondary);margin-bottom:var(--space-xl);font-size:0.9rem;text-align:center;">
        Choose the format for your catalogue with ${orderedProducts.length} products.
      </p>
      <div class="format-cards">
        <div class="format-card" data-format="pdf">
          <div class="format-card__icon format-card__icon--pdf">📄</div>
          <div class="format-card__title">PDF</div>
          <div class="format-card__desc">Print-ready catalogue with branded layouts</div>
        </div>
        <div class="format-card" data-format="ppt">
          <div class="format-card__icon format-card__icon--ppt">📊</div>
          <div class="format-card__title">PowerPoint</div>
          <div class="format-card__desc">Presentation slides for meetings</div>
        </div>
        <div class="format-card" data-format="excel">
          <div class="format-card__icon format-card__icon--excel">📗</div>
          <div class="format-card__title">Excel</div>
          <div class="format-card__desc">Spreadsheet with all product data</div>
        </div>
      </div>
      <div id="export-progress" style="display:none;margin-top:var(--space-xl);text-align:center;">
        <div class="progress-bar" style="margin-bottom:var(--space-md);">
          <div class="progress-bar__fill" style="width:0%;" id="progress-fill"></div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.9rem;" id="progress-text">Generating...</p>
      </div>
    `;

    // Format card clicks
    content.querySelectorAll('.format-card').forEach(card => {
      card.addEventListener('click', () => handleExport(card.dataset.format));
    });

    footer.innerHTML = `
      <button class="btn btn-secondary" id="export-back">← Back</button>
    `;
  }

  // Footer button handlers
  const cancelBtn = document.getElementById('export-cancel');
  const backBtn = document.getElementById('export-back');
  const nextBtn = document.getElementById('export-next');

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backBtn) backBtn.addEventListener('click', () => { currentStep--; renderModal(); });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    if (currentStep === 2) {
      coverInfo.title = document.getElementById('cover-title').value || 'Product Catalogue';
      coverInfo.subtitle = document.getElementById('cover-subtitle').value;
      coverInfo.date = document.getElementById('cover-date').value;
      coverInfo.companyName = document.getElementById('cover-company').value;
    }
    currentStep++;
    renderModal();
  });
}

function initDragAndDrop() {
  const list = document.getElementById('drag-list');
  if (!list) return;

  let draggedItem = null;

  list.querySelectorAll('.drag-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedItem = null;
      updateOrderFromDOM();
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      if (!draggedItem || draggedItem === item) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        list.insertBefore(draggedItem, item);
      } else {
        list.insertBefore(draggedItem, item.nextSibling);
      }
    });
  });

  function updateOrderFromDOM() {
    const newOrder = [];
    list.querySelectorAll('.drag-item').forEach((item, i) => {
      const id = item.dataset.dragId;
      const product = orderedProducts.find(p => p.id === id);
      if (product) newOrder.push(product);
      item.querySelector('.drag-item__index').textContent = i + 1;
    });
    orderedProducts = newOrder;
  }
}

function handleExport(format) {
  const progressDiv = document.getElementById('export-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');

  // Hide format cards, show progress
  document.querySelector('.format-cards').style.display = 'none';
  progressDiv.style.display = 'block';
  progressFill.style.width = '20%';
  progressText.textContent = `Generating ${format.toUpperCase()}...`;

  const worker = new ExportWorker();

  worker.onmessage = (e) => {
    const { success, blob, fileName, error } = e.data;
    if (success) {
      progressFill.style.width = '100%';
      progressText.textContent = 'Done! File downloaded.';
      
      saveAs(blob, fileName);

      showToast({
        type: 'success',
        title: 'Catalogue Generated',
        message: `Your ${format.toUpperCase()} catalogue has been downloaded.`,
      });

      setTimeout(closeModal, 1500);
    } else {
      console.error('Export failed:', error);
      progressText.textContent = 'Export failed. Please try again.';
      progressFill.style.background = 'var(--color-danger)';
      showToast({
        type: 'error',
        title: 'Export Failed',
        message: error,
      });
    }
    worker.terminate();
  };

  worker.onerror = (err) => {
    console.error('Worker error:', err);
    progressText.textContent = 'Worker failed to start or crashed.';
    progressFill.style.background = 'var(--color-danger)';
    worker.terminate();
  };

  progressFill.style.width = '50%';
  worker.postMessage({ format, orderedProducts, coverInfo });
}

function closeModal() {
  const container = document.getElementById('modal-container');
  container.innerHTML = '';
}
