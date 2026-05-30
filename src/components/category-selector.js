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
  }

  render();
  return { getSelected: () => (isSingle ? selection : [...selection]) };
}
