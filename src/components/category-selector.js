// =============================================
// CatalogueGen — Category Selector
// Picker with support for multi-select or single-select chips
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';

export function renderCategorySelector(containerId, selectedItem = [], onChange, type = 'categories', isSingle = false) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Normalize selected state: selection is a string in isSingle mode, array in multi mode
  let selection = isSingle 
    ? (Array.isArray(selectedItem) ? selectedItem[0] || '' : selectedItem || '')
    : (Array.isArray(selectedItem) ? [...selectedItem] : (selectedItem ? [selectedItem] : []));

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
          ${allItems.map(cat => {
            const isActive = isSingle ? (selection === cat) : selection.includes(cat);
            return `
              <button 
                type="button" 
                class="category-chip ${isActive ? 'active' : ''}" 
                data-category="${cat}"
              >${cat}</button>
            `;
          }).join('')}
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
        
        if (isSingle) {
          selection = (selection === cat) ? '' : cat;
          render();
          if (onChange) onChange(selection);
        } else {
          const idx = selection.indexOf(cat);
          if (idx > -1) {
            selection.splice(idx, 1);
          } else {
            selection.push(cat);
          }
          render();
          if (onChange) onChange([...selection]);
        }
      });
    });

    // Add new item
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

      if (isSingle) {
        selection = val;
        render();
        if (onChange) onChange(selection);
      } else {
        if (!selection.includes(val)) {
          selection.push(val);
        }
        render();
        if (onChange) onChange([...selection]);
      }
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
  return { getSelected: () => (isSingle ? selection : [...selection]) };
}
