// =============================================
// CatalogueGen — Bulk Import Modal
// CSV / Excel import wizard
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { showToast } from './toast.js';

let parsedData = [];
let fileName = '';

export function showBulkImportModal() {
  parsedData = [];
  fileName = '';
  renderUploadStep();
}

function renderUploadStep() {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" id="import-overlay">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Bulk Import Products</h3>
          <button class="btn btn-icon btn-ghost" id="import-close">${icons.x}</button>
        </div>
        <div class="modal-body">
          <div class="upload-zone" id="upload-zone">
            <div class="upload-zone__icon">${icons.upload}</div>
            <div class="upload-zone__text">Drag & drop a CSV or Excel file here</div>
            <div class="upload-zone__hint">or click to browse — Accepts .csv and .xlsx files</div>
            <input type="file" id="file-input" accept=".csv,.xlsx" style="display:none">
          </div>
          <div style="margin-top:var(--space-lg);text-align:center;">
            <button class="btn btn-ghost btn-sm" id="download-template">
              ${icons.download} Download sample template (CSV)
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="import-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;

  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });

  document.getElementById('download-template').addEventListener('click', downloadTemplate);
  document.getElementById('import-close').addEventListener('click', closeModal);
  document.getElementById('import-cancel').addEventListener('click', closeModal);
  document.getElementById('import-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

async function handleFile(file) {
  fileName = file.name;
  try {
    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      parsedData = parseCSV(text);
    } else if (file.name.endsWith('.xlsx')) {
      parsedData = await parseXLSX(file);
    } else {
      showToast({ type: 'error', title: 'Invalid file', message: 'Please upload a .csv or .xlsx file.' });
      return;
    }

    if (parsedData.length === 0) {
      showToast({ type: 'warning', title: 'Empty file', message: 'No product data found in the file.' });
      return;
    }

    renderPreviewStep();
  } catch (err) {
    console.error('Parse error:', err);
    showToast({ type: 'error', title: 'Parse Error', message: 'Could not read the file. Please check the format.' });
  }
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    products.push({
      name: row.name || row.product || row['product name'] || '',
      size: row.size || row.dimensions || '',
      price: row.price || row.cost || '0',
      material: row.material || row.fabric || '',
      category: row.category || row.categories || '',
      imageUrl: row.imageurl || row.image || row['image url'] || '',
    });
  }

  return products.filter(p => p.name);
}

async function parseXLSX(file) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers = [];
  const products = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        headers.push(String(cell.value || '').trim().toLowerCase());
      });
    } else {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) rowData[header] = String(cell.value || '').trim();
      });

      products.push({
        name: rowData.name || rowData.product || rowData['product name'] || '',
        size: rowData.size || rowData.dimensions || '',
        price: rowData.price || rowData.cost || '0',
        material: rowData.material || rowData.fabric || '',
        category: rowData.category || rowData.categories || '',
        imageUrl: rowData.imageurl || rowData.image || rowData['image url'] || '',
      });
    }
  });

  return products.filter(p => p.name);
}

function renderPreviewStep() {
  const container = document.getElementById('modal-container');
  const validProducts = parsedData.filter(p => p.name);
  const invalidProducts = parsedData.filter(p => !p.name);

  container.innerHTML = `
    <div class="modal-overlay" id="import-overlay">
      <div class="modal modal-xl">
        <div class="modal-header">
          <h3>Preview Import — ${fileName}</h3>
          <button class="btn btn-icon btn-ghost" id="import-close">${icons.x}</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:var(--space-lg);">
            Found <strong>${validProducts.length}</strong> valid products.
            ${invalidProducts.length > 0 ? `<span style="color:var(--color-danger);">${invalidProducts.length} rows have errors (missing name).</span>` : ''}
          </p>
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>Material</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                ${parsedData.map((p, i) => `
                  <tr class="${!p.name ? 'error-row' : ''}">
                    <td>${i + 1}</td>
                    <td>${p.name || '<em style="color:var(--color-danger)">Missing</em>'}</td>
                    <td>${p.size}</td>
                    <td>$${parseFloat(p.price || 0).toLocaleString('en-US')}</td>
                    <td>${p.material}</td>
                    <td>${p.category || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="import-back">← Back</button>
          <button class="btn btn-primary" id="import-confirm">
            ${icons.download} Import ${validProducts.length} Products
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('import-close').addEventListener('click', closeModal);
  document.getElementById('import-back').addEventListener('click', () => renderUploadStep());
  document.getElementById('import-confirm').addEventListener('click', () => {
    const validProducts = parsedData.filter(p => p.name);
    store.bulkAdd(validProducts);
    showToast({
      type: 'success',
      title: 'Import Complete',
      message: `${validProducts.length} products added successfully.`,
    });
    closeModal();
  });
  document.getElementById('import-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
}

function downloadTemplate() {
  const csv = `Name,Size,Price,Material,Categories,ImageURL
Example Product,Large,1999,Cotton,Category1;Category2,https://example.com/image.jpg
Another Product,Medium,2499,Silk,Category1,https://example.com/image2.jpg`;

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'product_import_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}
