// =============================================
// CatalogueGen — Data Store
// localStorage-backed product database
// =============================================

const STORAGE_KEY = 'cataloguegen_products';
const CATEGORIES_KEY = 'cataloguegen_categories';

class EventEmitter {
  constructor() {
    this._listeners = {};
  }
  on(event, fn) {
    (this._listeners[event] ||= []).push(fn);
  }
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  }
}

class Store extends EventEmitter {
  constructor() {
    super();
    this._products = this._load(STORAGE_KEY, []);
    this._categories = this._load(CATEGORIES_KEY, []);
    this._selected = new Set();
    this._orderedSelection = [];
  }

  // --- Persistence ---
  _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  _saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products));
    this.emit('products-changed', this._products);
  }

  _saveCategories() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(this._categories));
    this.emit('categories-changed', this._categories);
  }

  // --- Products CRUD ---
  getProducts() {
    return [...this._products];
  }

  getProductById(id) {
    return this._products.find(p => p.id === id) || null;
  }

  addProduct(data) {
    const product = {
      id: crypto.randomUUID(),
      name: data.name?.trim() || 'Untitled Product',
      size: data.size?.trim() || '',
      price: parseFloat(data.price) || 0,
      material: data.material?.trim() || '',
      categories: Array.isArray(data.categories) ? data.categories : [],
      imageUrl: data.imageUrl?.trim() || '',
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Auto-add any new categories
    product.categories.forEach(cat => this._ensureCategory(cat));

    this._products.unshift(product);
    this._saveProducts();
    this.emit('product-added', product);
    return product;
  }

  updateProduct(id, data) {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this._products[idx];
    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      size: data.size !== undefined ? data.size.trim() : existing.size,
      price: data.price !== undefined ? parseFloat(data.price) || 0 : existing.price,
      material: data.material !== undefined ? data.material.trim() : existing.material,
      categories: data.categories !== undefined ? data.categories : existing.categories,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl.trim() : existing.imageUrl,
      updatedAt: new Date().toISOString(),
    };

    if (updated.categories) {
      updated.categories.forEach(cat => this._ensureCategory(cat));
    }

    this._products[idx] = updated;
    this._saveProducts();
    this.emit('product-updated', updated);
    return updated;
  }

  deleteProduct(id) {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this._products.splice(idx, 1);
    this._selected.delete(id);
    this._orderedSelection = this._orderedSelection.filter(sid => sid !== id);
    this._saveProducts();
    this.emit('product-deleted', id);
    return true;
  }

  // --- Favorites ---
  toggleFavorite(id) {
    const product = this._products.find(p => p.id === id);
    if (!product) return null;
    product.favorite = !product.favorite;
    product.updatedAt = new Date().toISOString();
    this._saveProducts();
    this.emit('favorite-toggled', product);
    return product;
  }

  // --- Categories ---
  getCategories() {
    return [...this._categories];
  }

  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this._categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return false;
    this._categories.push(trimmed);
    this._categories.sort((a, b) => a.localeCompare(b));
    this._saveCategories();
    return true;
  }

  _ensureCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      this._categories.push(trimmed);
      this._categories.sort((a, b) => a.localeCompare(b));
      this._saveCategories();
    }
  }

  // --- Selection ---
  selectProduct(id) {
    if (!this._selected.has(id)) {
      this._selected.add(id);
      this._orderedSelection.push(id);
      this.emit('selection-changed', this.getSelectedIds());
    }
  }

  deselectProduct(id) {
    this._selected.delete(id);
    this._orderedSelection = this._orderedSelection.filter(sid => sid !== id);
    this.emit('selection-changed', this.getSelectedIds());
  }

  toggleSelection(id) {
    if (this._selected.has(id)) {
      this.deselectProduct(id);
    } else {
      this.selectProduct(id);
    }
  }

  isSelected(id) {
    return this._selected.has(id);
  }

  getSelectedIds() {
    return [...this._orderedSelection];
  }

  getSelectedProducts() {
    return this._orderedSelection
      .map(id => this.getProductById(id))
      .filter(Boolean);
  }

  getSelectedCount() {
    return this._selected.size;
  }

  clearSelection() {
    this._selected.clear();
    this._orderedSelection = [];
    this.emit('selection-changed', []);
  }

  reorderSelected(orderedIds) {
    this._orderedSelection = orderedIds.filter(id => this._selected.has(id));
    this.emit('selection-changed', this.getSelectedIds());
  }

  // --- Sorting & Filtering ---
  getFilteredProducts({ search = '', sort = 'newest', categories = [], favoritesOnly = false } = {}) {
    let results = [...this._products];

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.categories.some(c => c.toLowerCase().includes(q))
      );
    }

    // Filter by categories
    if (categories.length > 0) {
      results = results.filter(p =>
        categories.some(cat => p.categories.map(c => c.toLowerCase()).includes(cat.toLowerCase()))
      );
    }

    // Filter favorites
    if (favoritesOnly) {
      results = results.filter(p => p.favorite);
    }

    // Sort
    switch (sort) {
      case 'name-az':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-low':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'material':
        results.sort((a, b) => a.material.localeCompare(b.material));
        break;
      case 'favorites':
        results.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
        break;
    }

    return results;
  }

  // --- Stats ---
  getStats() {
    const products = this._products;
    const total = products.length;
    const categoriesCount = this._categories.length;
    const favorites = products.filter(p => p.favorite).length;
    const avgPrice = total > 0
      ? products.reduce((sum, p) => sum + p.price, 0) / total
      : 0;
    const lastUpdated = total > 0
      ? products.reduce((latest, p) => {
          const d = new Date(p.updatedAt);
          return d > latest ? d : latest;
        }, new Date(0))
      : null;

    return {
      total,
      categoriesCount,
      favorites,
      avgPrice: Math.round(avgPrice * 100) / 100,
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
    };
  }

  // --- Bulk Import ---
  bulkAdd(productsData) {
    const added = [];
    for (const data of productsData) {
      const product = this.addProduct(data);
      added.push(product);
    }
    return added;
  }

  // --- Data Export/Import ---
  exportData() {
    return JSON.stringify({
      products: this._products,
      categories: this._categories,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid data format');
      }
      this._products = data.products;
      if (data.categories && Array.isArray(data.categories)) {
        this._categories = data.categories;
      }
      this._saveProducts();
      this._saveCategories();
      this.clearSelection();
      this.emit('data-imported');
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }
}

// Singleton
export const store = new Store();
