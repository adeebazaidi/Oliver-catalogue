// =============================================
// CatalogueGen — Product Card Component
// =============================================

import { store } from '../store.js';
import { icons } from '../icons.js';
import { router } from '../router.js';

export function createProductCard(product) {
  const isSelected = store.isSelected(product.id);
  const initials = product.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const card = document.createElement('div');
  card.className = `product-card ${isSelected ? 'selected' : ''}`;
  card.dataset.productId = product.id;

  card.innerHTML = `
    <div class="product-card__image" style="cursor: pointer;" title="Click to select">
      ${product.imageUrl
        ? `<img src="${product.imageUrl}" alt="${product.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
        : ''}
      <div class="product-card__placeholder" ${product.imageUrl ? 'style="display:none"' : ''}>${initials}</div>
    </div>
    <div class="product-card__checkbox">
      <div class="checkbox ${isSelected ? 'checked' : ''}" data-action="toggle-select" title="Select for catalogue">
        ${icons.check}
      </div>
    </div>
    <div class="product-card__star">
      <button class="star-btn ${product.favorite ? 'active' : ''}" data-action="toggle-favorite" title="${product.favorite ? 'Remove from favorites' : 'Add to favorites'}">
        ${icons.star}
      </button>
    </div>
    <div class="product-card__body">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-sm);">
        <div style="flex: 1; min-width: 0;">
          <div class="product-card__name" title="${product.name}">${product.name}</div>
          <div class="product-card__price">$${product.price.toLocaleString('en-US')}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="edit-product" title="Edit Product" style="padding: 6px; border: 1px solid var(--border); color: var(--text-secondary); background: var(--bg-surface);">
          ${icons.edit}
        </button>
      </div>
      <div class="product-card__meta" style="margin-top: var(--space-sm);">
        ${product.material ? `<span class="badge">${product.material}</span>` : ''}
        ${product.category ? `<span class="badge badge-gold">${product.category}</span>` : ''}
      </div>
    </div>
  `;

  // Event handlers
  const toggleSelection = (e) => {
    e.stopPropagation();
    store.toggleSelection(product.id);
    const nowSelected = store.isSelected(product.id);
    card.classList.toggle('selected', nowSelected);
    const checkbox = card.querySelector('[data-action="toggle-select"]');
    if (checkbox) checkbox.classList.toggle('checked', nowSelected);
  };

  card.querySelector('.product-card__image').addEventListener('click', toggleSelection);
  card.querySelector('[data-action="toggle-select"]').addEventListener('click', toggleSelection);

  const starBtn = card.querySelector('[data-action="toggle-favorite"]');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    store.toggleFavorite(product.id);
    starBtn.classList.add('animate-star-pop');
    setTimeout(() => starBtn.classList.remove('animate-star-pop'), 300);
  });

  const editBtn = card.querySelector('[data-action="edit-product"]');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    router.navigate(`#/product/${product.id}`);
  });

  return card;
}
