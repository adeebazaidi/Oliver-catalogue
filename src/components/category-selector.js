// =============================================
// CatalogueGen — Category Selector
// Multi-select category picker with create
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';

export function renderCategorySelector(containerId, selectedCategories = [], onChange, type = 'categories') {
  const container = document.getElementById(containerId);
  if (!container) return;

  function render() {
    let allItems = [];
    let placeholder = '';

    if (type === 'materials') {
      allItems = store.getMaterials();
      placeholder = 'Add new material...';
    } else if (type === 'buyers') {
      allItems = store.getBuyerCategories();
      placeholder = 'Add new buyer category...';
    } else {
      allItems = store.getCategories();
      placeholder = 'Add new category...';
    }

    container.innerHTML = `
      <div class="category-selector">
        <div class="category-chips" id="${containerId}-chips" style="margin-bottom: 0;">
          ${allItems.map(cat => `
            <button 
              type="button" 
              class="category-chip ${selectedCategories.includes(cat) ? 'active' : ''}" 
              data-category="${cat}"
            >${cat}</button>
          `).join('')}
        </div>
        <div class="category-add" style="display:flex;gap:8px;margin-top:10px;">
          <input 
            type="text" 
            class="form-input" 
            id="${containerId}-new-input" 
            placeholder="${placeholder}"
            style="flex:1;padding:8px 12px;font-size:0.85rem;"
          >
          <button type="button" class="btn btn-secondary btn-sm" id="${containerId}-add-btn">
            ${icons.plus} Add
          </button>
        </div>
      </div>
    `;

    // Chip click handlers
    container.querySelectorAll('.category-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = chip.dataset.category;
        const idx = selectedCategories.indexOf(cat);
        if (idx > -1) {
          selectedCategories.splice(idx, 1);
        } else {
          selectedCategories.push(cat);
        }
        render();
        if (onChange) onChange([...selectedCategories]);
      });
    });

    // Add new category
    const addBtn = document.getElementById(`${containerId}-add-btn`);
    const addInput = document.getElementById(`${containerId}-new-input`);

    const doAdd = () => {
      const val = addInput.value.trim();
      if (!val) return;

      if (type === 'materials') {
        store.addMaterial(val);
      } else if (type === 'buyers') {
        store.addBuyerCategory(val);
      } else {
        store.addCategory(val);
      }

      if (!selectedCategories.includes(val)) {
        selectedCategories.push(val);
      }
      render();
      if (onChange) onChange([...selectedCategories]);
    };

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      doAdd();
    });
    addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doAdd();
      }
    });
  }

  render();
  return { getSelected: () => [...selectedCategories] };
}
