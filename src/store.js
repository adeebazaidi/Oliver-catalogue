// =============================================
// CatalogueGen — Data Store
// IndexedDB-backed & Firebase-synced product database
// =============================================

import { showToast } from './components/toast.js';
import { db } from './db.js';
import { syncEngine } from './sync-engine.js';

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
    // In-memory cache (loaded from IndexedDB on init)
    this._products = [];
    this._categories = [];
    this._materials = [];
    this._buyerCategories = [];

    this._selected = new Set();
    this._orderedSelection = [];
    this._isImporting = false;
    this._ready = false;

    // Initialize asynchronously
    this._initPromise = this._init();
  }

  async _init() {
    try {
      // Step 1: Migrate from localStorage if needed (one-time)
      await db.migrateFromLocalStorage();

      // Step 2: Load everything from IndexedDB into memory
      this._products = await db.getAllProducts();
      this._categories = await db.getAllCategories();
      this._materials = await db.getAllMaterials();
      this._buyerCategories = await db.getAllBuyerCategories();

      // Step 3: Set defaults if completely empty (fresh install)
      if (this._categories.length === 0) {
        const defaults = ['Lighting', 'Tables', 'Wall Arts'].sort((a, b) => a.localeCompare(b));
        for (const name of defaults) await db.addCategory(name);
        this._categories = defaults;
      }
      if (this._materials.length === 0) {
        const defaults = ['Copper', 'Brass', 'Wood', 'Iron', 'Steel', 'Aluminium', 'Glass'].sort((a, b) => a.localeCompare(b));
        for (const name of defaults) await db.addMaterial(name);
        this._materials = defaults;
      }
      if (this._buyerCategories.length === 0) {
        const defaults = ['Michael Arams', 'Crate & Barrels', 'Rebecca Udall'].sort((a, b) => a.localeCompare(b));
        for (const name of defaults) await db.addBuyerCategory(name);
        this._buyerCategories = defaults;
      }

      this._ready = true;
      this.emit('store-ready');
      this.emit('products-changed', this._products);

      // Step 4: Trigger background sync engine pull
      syncEngine.pullRemoteChanges();
    } catch (err) {
      console.error('[Store] Initialization failed:', err);
      this._ready = true;
      this.emit('store-ready');
    }
  }

  async whenReady() {
    if (this._ready) return;
    return this._initPromise;
  }

  // --- Background Sync Engine Triggers ---
  _triggerSync() {
    syncEngine.triggerSync();
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
    
    db.addCategory(trimmed).catch(err => console.error('[Store] Failed to save category to IndexedDB:', err));
    this.emit('categories-changed', this._categories);
    return true;
  }

  _ensureCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      this._categories.push(trimmed);
      this._categories.sort((a, b) => a.localeCompare(b));
      db.addCategory(trimmed).catch(err => console.error('[Store] Failed to ensure category in IndexedDB:', err));
    }
  }

  async deleteCategory(name) {
    this._categories = this._categories.filter(c => c !== name);
    this.emit('categories-changed', this._categories);
    await db.deleteCategory(name);
  }

  async updateCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const idx = this._categories.findIndex(c => c === oldName);
    if (idx === -1) return false;
    this._categories[idx] = trimmed;
    this._categories.sort((a, b) => a.localeCompare(b));
    this.emit('categories-changed', this._categories);
    
    await db.updateCategory(oldName, trimmed);
    return true;
  }

  // --- Materials ---
  getMaterials() {
    return [...this._materials];
  }

  addMaterial(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this._materials.some(m => m.toLowerCase() === trimmed.toLowerCase())) return false;
    this._materials.push(trimmed);
    this._materials.sort((a, b) => a.localeCompare(b));
    
    db.addMaterial(trimmed).catch(err => console.error('[Store] Failed to save material to IndexedDB:', err));
    this.emit('materials-changed', this._materials);
    return true;
  }

  _ensureMaterial(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._materials.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      this._materials.push(trimmed);
      this._materials.sort((a, b) => a.localeCompare(b));
      db.addMaterial(trimmed).catch(err => console.error('[Store] Failed to ensure material in IndexedDB:', err));
    }
  }

  async deleteMaterial(name) {
    this._materials = this._materials.filter(m => m !== name);
    this.emit('materials-changed', this._materials);
    await db.deleteMaterial(name);
  }

  async updateMaterial(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const idx = this._materials.findIndex(m => m === oldName);
    if (idx === -1) return false;
    this._materials[idx] = trimmed;
    this._materials.sort((a, b) => a.localeCompare(b));
    this.emit('materials-changed', this._materials);
    
    await db.updateMaterial(oldName, trimmed);
    return true;
  }

  // --- Buyer Categories ---
  getBuyerCategories() {
    return [...this._buyerCategories];
  }

  addBuyerCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this._buyerCategories.some(b => b.toLowerCase() === trimmed.toLowerCase())) return false;
    this._buyerCategories.push(trimmed);
    this._buyerCategories.sort((a, b) => a.localeCompare(b));
    
    db.addBuyerCategory(trimmed).catch(err => console.error('[Store] Failed to save buyer category to IndexedDB:', err));
    this.emit('buyers-changed', this._buyerCategories);
    return true;
  }

  _ensureBuyerCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._buyerCategories.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      this._buyerCategories.push(trimmed);
      this._buyerCategories.sort((a, b) => a.localeCompare(b));
      db.addBuyerCategory(trimmed).catch(err => console.error('[Store] Failed to ensure buyer category in IndexedDB:', err));
    }
  }

  async deleteBuyerCategory(name) {
    this._buyerCategories = this._buyerCategories.filter(b => b !== name);
    this.emit('buyers-changed', this._buyerCategories);
    await db.deleteBuyerCategory(name);
  }

  async updateBuyerCategory(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const idx = this._buyerCategories.findIndex(c => c === oldName);
    if (idx === -1) return false;
    this._buyerCategories[idx] = trimmed;
    this._buyerCategories.sort((a, b) => a.localeCompare(b));
    this.emit('buyers-changed', this._buyerCategories);
    
    await db.updateBuyerCategory(oldName, trimmed);
    return true;
  }

  // --- Products CRUD ---
  getProducts() {
    return [...this._products];
  }

  getProductById(id) {
    return this._products.find(p => p.id === id) || null;
  }

  async resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('idb:')) {
      const id = url.replace('idb:', '');
      const dataUrl = await db.getImageAsDataUrl(id);
      return dataUrl || '';
    }
    return url;
  }

  async addProduct(data) {
    const cleanPriceVal = parseFloat(String(data.price || 0).replace(/[^0-9.-]/g, '')) || 0;
    const product = {
      id: crypto.randomUUID(),
      name: data.name?.trim() || 'Untitled Product',
      size: data.size?.trim() || '',
      price: cleanPriceVal,
      materials: Array.isArray(data.materials) ? data.materials : (data.material ? [data.material.trim()] : []),
      category: data.category?.trim() || '',
      buyerCategories: Array.isArray(data.buyerCategories) ? data.buyerCategories : [],
      imageUrl: data.imageUrl?.trim() || '',
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sync_status: 'pending',
      firebase_id: null
    };
    product.material = product.materials[0] || '';

    // Auto-add any new materials/buyers/categories
    product.materials.forEach(m => this._ensureMaterial(m));
    if (product.category) this._ensureCategory(product.category);
    product.buyerCategories.forEach(bc => this._ensureBuyerCategory(bc));

    this._products.unshift(product);

    if (!this._isImporting) {
      await db.putProduct(product);
      this._triggerSync();
    }
    
    this.emit('product-added', product);
    return product;
  }

  async updateProduct(id, data) {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const existing = this._products[idx];
    const cleanPriceVal = data.price !== undefined ? (parseFloat(String(data.price || 0).replace(/[^0-9.-]/g, '')) || 0) : existing.price;
    const updated = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      size: data.size !== undefined ? data.size.trim() : existing.size,
      price: cleanPriceVal,
      materials: data.materials !== undefined ? data.materials : existing.materials || (existing.material ? [existing.material] : []),
      category: data.category !== undefined ? data.category.trim() : existing.category || '',
      buyerCategories: data.buyerCategories !== undefined ? data.buyerCategories : existing.buyerCategories || [],
      imageUrl: data.imageUrl !== undefined ? data.imageUrl.trim() : existing.imageUrl,
      updatedAt: new Date().toISOString(),
      sync_status: 'pending'
    };
    updated.material = updated.materials[0] || '';

    if (updated.materials) updated.materials.forEach(m => this._ensureMaterial(m));
    if (updated.category) this._ensureCategory(updated.category);
    if (updated.buyerCategories) updated.buyerCategories.forEach(bc => this._ensureBuyerCategory(bc));

    this._products[idx] = updated;
    await db.putProduct(updated);
    this._triggerSync();
    
    this.emit('product-updated', updated);
    return updated;
  }

  async deleteProduct(id) {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this._products.splice(idx, 1);
    this._selected.delete(id);
    this._orderedSelection = this._orderedSelection.filter(sid => sid !== id);
    
    await db.deleteProduct(id);
    // Ideally we flag this for deletion in sync_engine, but for simplicity we rely on pull to restore it if needed, or implement delete tracking.
    
    this.emit('product-deleted', id);
    return true;
  }

  // --- Settings ---
  async getSetting(key) {
    return await db.getSetting(key);
  }

  async putSetting(key, value) {
    await db.putSetting(key, value);
    this.emit('setting-changed', { key, value });
  }

  // --- Favorites ---
  async toggleFavorite(id) {
    const product = this._products.find(p => p.id === id);
    if (!product) return null;
    product.favorite = !product.favorite;
    product.updatedAt = new Date().toISOString();
    product.sync_status = 'pending';
    
    await db.putProduct(product);
    this._triggerSync();
    
    this.emit('favorite-toggled', product);
    return product;
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
  getFilteredProducts({ search = '', sort = 'newest', material = '', category = '', buyer = '', favoritesOnly = false } = {}) {
    let results = [...this._products];

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.materials && p.materials.some(m => m.toLowerCase().includes(q))) ||
        p.material.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.buyerCategories && p.buyerCategories.some(bc => bc.toLowerCase().includes(q)))
      );
    }

    if (material) {
      results = results.filter(p =>
        (p.materials && p.materials.some(m => m.toLowerCase() === material.toLowerCase())) ||
        p.material.toLowerCase() === material.toLowerCase()
      );
    }

    if (category) {
      results = results.filter(p =>
        p.category && p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (buyer) {
      results = results.filter(p =>
        p.buyerCategories && p.buyerCategories.some(bc => bc.toLowerCase() === buyer.toLowerCase())
      );
    }

    if (favoritesOnly) {
      results = results.filter(p => p.favorite);
    }

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
        results.sort((a, b) => {
          const matA = a.materials?.[0] || a.material || '';
          const matB = b.materials?.[0] || b.material || '';
          return matA.localeCompare(matB);
        });
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
  async bulkAdd(productsData) {
    this._isImporting = true;
    const added = [];
    for (const data of productsData) {
      const product = await this.addProduct(data);
      added.push(product);
    }
    this._isImporting = false;

    try {
      await db.putProducts(this._products);
      this._triggerSync();
    } catch (err) {
      console.error('[Store] Failed to bulk save to IndexedDB:', err);
    }

    this.emit('products-changed', this._products);
    return added;
  }

  // --- Data Export/Import ---
  async exportData() {
    const data = await db.exportAll();
    return JSON.stringify({
      ...data,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid data format');
      }

      await db.importAll(data);
      this._products = await db.getAllProducts();
      
      if (data.categories && Array.isArray(data.categories)) {
        this._categories = data.categories;
      }
      if (data.materials && Array.isArray(data.materials)) {
        this._materials = data.materials;
      }
      if (data.buyerCategories && Array.isArray(data.buyerCategories)) {
        this._buyerCategories = data.buyerCategories;
      }
      
      this.clearSelection();
      this.emit('data-imported');
      this.emit('products-changed', this._products);
      this.emit('categories-changed', this._categories);
      this.emit('materials-changed', this._materials);
      this.emit('buyer-categories-changed', this._buyerCategories);

      this._triggerSync();
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }
}

export const store = new Store();
