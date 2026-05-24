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
    <div class="product-card__image">
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
      <div class="product-card__name" title="${product.name}">${product.name}</div>
      <div class="product-card__price">₹${product.price.toLocaleString('en-IN')}</div>
      <div class="product-card__meta">
        ${product.material ? `<span class="badge">${product.material}</span>` : ''}
        ${product.categories.slice(0, 2).map(c => `<span class="badge badge-gold">${c}</span>`).join('')}
        ${product.categories.length > 2 ? `<span class="badge">+${product.categories.length - 2}</span>` : ''}
      </div>
    </div>
  `;

  // Event handlers
  const checkbox = card.querySelector('[data-action="toggle-select"]');
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    store.toggleSelection(product.id);
    const nowSelected = store.isSelected(product.id);
    card.classList.toggle('selected', nowSelected);
    checkbox.classList.toggle('checked', nowSelected);
  });

  const starBtn = card.querySelector('[data-action="toggle-favorite"]');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    store.toggleFavorite(product.id);
    starBtn.classList.toggle('active');
    starBtn.classList.add('animate-star-pop');
    setTimeout(() => starBtn.classList.remove('animate-star-pop'), 300);
  });

  card.addEventListener('click', () => {
    router.navigate(`#/product/${product.id}`);
  });

  return card;
}
