// =============================================
// CatalogueGen — Data Store
// localStorage-backed & Supabase-synced product database
// =============================================

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from './config.js';
import { showToast } from './components/toast.js';

const STORAGE_KEY = 'cataloguegen_products';
const CATEGORIES_KEY = 'cataloguegen_categories';

// Initialize Supabase if configured
const supabase = isSupabaseConfigured() ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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
    this._materials = this._load('cataloguegen_materials', []);
    this._buyerCategories = this._load('cataloguegen_buyer_categories', []);
    
    // Set defaults if empty
    if (this._categories.length === 0) {
      this._categories = ['Lighting', 'Tables', 'Wall Arts'].sort((a, b) => a.localeCompare(b));
      this._saveLocalCategories();
    }
    if (this._materials.length === 0) {
      this._materials = ['Copper', 'Brass', 'Wood', 'Iron', 'Steel', 'Aluminium', 'Glass'].sort((a, b) => a.localeCompare(b));
      this._saveLocalMaterials();
    }
    if (this._buyerCategories.length === 0) {
      this._buyerCategories = ['Michael Arams', 'Crate & Barrels', 'Rebecca Udall'].sort((a, b) => a.localeCompare(b));
      this._saveLocalBuyerCategories();
    }

    this._selected = new Set();
    this._orderedSelection = [];
    this._isImporting = false;

    // Connect to shared database asynchronously
    this.initRemote();
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

  _saveLocalProducts(suppressEvent = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products));
    if (!suppressEvent) {
      this.emit('products-changed', this._products);
    }
  }

  _saveLocalCategories() {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(this._categories));
    this.emit('categories-changed', this._categories);
  }

  _saveLocalMaterials() {
    localStorage.setItem('cataloguegen_materials', JSON.stringify(this._materials));
    this.emit('materials-changed', this._materials);
  }

  _saveLocalBuyerCategories() {
    localStorage.setItem('cataloguegen_buyer_categories', JSON.stringify(this._buyerCategories));
    this.emit('buyer-categories-changed', this._buyerCategories);
  }

  _saveLocalBackup() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(this._categories));
    localStorage.setItem('cataloguegen_materials', JSON.stringify(this._materials));
    localStorage.setItem('cataloguegen_buyer_categories', JSON.stringify(this._buyerCategories));
  }

  async _saveProducts(product, action, suppressEvent = false) {
    this._saveLocalProducts(suppressEvent);

    if (!isSupabaseConfigured() || !supabase) return;

    try {
      if (action === 'insert') {
        const { error } = await supabase.from('products').insert({
          id: product.id,
          name: product.name,
          size: product.size,
          price: product.price,
          materials: product.materials,
          category: product.category,
          buyer_categories: product.buyerCategories,
          image_url: product.imageUrl,
          favorite: product.favorite,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
        });
        if (error) throw error;
      } else if (action === 'update') {
        const { error } = await supabase
          .from('products')
          .update({
            name: product.name,
            size: product.size,
            price: product.price,
            materials: product.materials,
            category: product.category,
            buyer_categories: product.buyerCategories,
            image_url: product.imageUrl,
            favorite: product.favorite,
            updated_at: product.updatedAt,
          })
          .eq('id', product.id);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);
        if (error) throw error;
      }
    } catch (err) {
      console.error(`Failed to sync product ${action} to Supabase:`, err);
      showToast({
        type: 'error',
        title: 'Sync Error',
        message: 'Could not sync changes to the shared database. Saved locally.',
      });
    }
  }

  async _saveCategories(name) {
    this._saveLocalCategories();

    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { error } = await supabase.from('categories').insert({ name });
      if (error && error.code !== '23505') throw error;
    } catch (err) {
      console.error('Failed to sync category to Supabase:', err);
    }
  }

  async _saveMaterials(name) {
    this._saveLocalMaterials();

    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { error } = await supabase.from('materials').insert({ name });
      if (error && error.code !== '23505') throw error;
    } catch (err) {
      console.error('Failed to sync material to Supabase:', err);
    }
  }

  async _saveBuyerCategories(name) {
    this._saveLocalBuyerCategories();

    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const { error } = await supabase.from('buyer_categories').insert({ name });
      if (error && error.code !== '23505') throw error;
    } catch (err) {
      console.error('Failed to sync buyer category to Supabase:', err);
    }
  }

  // --- Supabase Remote Fetch & Real-time Sync ---
  async initRemote() {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('Supabase credentials missing. Operating in offline/localStorage mode.');
      return;
    }

    try {
      await Promise.all([
        this._refetchProducts(),
        this._refetchCategories(),
        this._refetchMaterials(),
        this._refetchBuyerCategories()
      ]);

      this._saveLocalBackup();
      this._subscribeRealtime();
    } catch (err) {
      console.error('Supabase initialization failed, running with local data:', err);
    }
  }

  async _refetchProducts() {
    if (!supabase) return;
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (products) {
        this._products = products.map(p => ({
          id: p.id,
          name: p.name,
          size: p.size || '',
          price: parseFloat(p.price) || 0,
          materials: p.materials || [],
          material: p.materials?.[0] || '',
          category: p.category || '',
          buyerCategories: p.buyer_categories || [],
          imageUrl: p.image_url || '',
          favorite: p.favorite || false,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        this.emit('products-changed', this._products);
      }
    } catch (err) {
      console.error('Error refetching products:', err);
    }
  }

  async _refetchCategories() {
    if (!supabase) return;
    try {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name');

      if (error) throw error;
      if (categories) {
        this._categories = categories.map(c => c.name).sort((a, b) => a.localeCompare(b));
        this.emit('categories-changed', this._categories);
      }
    } catch (err) {
      console.error('Error refetching categories:', err);
    }
  }

  async _refetchMaterials() {
    if (!supabase) return;
    try {
      const { data: materials, error } = await supabase
        .from('materials')
        .select('name');

      if (error) throw error;
      if (materials) {
        this._materials = materials.map(m => m.name).sort((a, b) => a.localeCompare(b));
        this.emit('materials-changed', this._materials);
      }
    } catch (err) {
      console.error('Error refetching materials:', err);
    }
  }

  async _refetchBuyerCategories() {
    if (!supabase) return;
    try {
      const { data: buyerCategories, error } = await supabase
        .from('buyer_categories')
        .select('name');

      if (error) throw error;
      if (buyerCategories) {
        this._buyerCategories = buyerCategories.map(b => b.name).sort((a, b) => a.localeCompare(b));
        this.emit('buyer-categories-changed', this._buyerCategories);
      }
    } catch (err) {
      console.error('Error refetching buyer categories:', err);
    }
  }

  _subscribeRealtime() {
    if (!supabase) return;
    supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        await this._refetchProducts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        await this._refetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, async () => {
        await this._refetchMaterials();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buyer_categories' }, async () => {
        await this._refetchBuyerCategories();
      })
      .subscribe();
  }

  async _saveProductsBulk(products) {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      const rows = products.map(product => ({
        id: product.id,
        name: product.name,
        size: product.size,
        price: product.price,
        materials: product.materials,
        category: product.category,
        buyer_categories: product.buyerCategories,
        image_url: product.imageUrl,
        favorite: product.favorite,
        created_at: product.createdAt,
        updated_at: product.updatedAt,
      }));
      const { error } = await supabase.from('products').insert(rows);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to bulk sync products to Supabase:', err);
      showToast({
        type: 'error',
        title: 'Sync Error',
        message: 'Could not sync imported products to the shared database.',
      });
    }
  }

  async _syncImportedDataToSupabase() {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      if (this._products.length > 0) {
        await this._saveProductsBulk(this._products);
      }
      for (const cat of this._categories) {
        await supabase.from('categories').insert({ name: cat }).maybeSingle();
      }
      for (const mat of this._materials) {
        await supabase.from('materials').insert({ name: mat }).maybeSingle();
      }
      for (const bc of this._buyerCategories) {
        await supabase.from('buyer_categories').insert({ name: bc }).maybeSingle();
      }
    } catch (err) {
      console.error('Failed to sync imported data to Supabase:', err);
    }
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
      materials: Array.isArray(data.materials) ? data.materials : (data.material ? [data.material.trim()] : []),
      category: data.category?.trim() || '',
      buyerCategories: Array.isArray(data.buyerCategories) ? data.buyerCategories : [],
      imageUrl: data.imageUrl?.trim() || '',
      favorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    product.material = product.materials[0] || '';

    // Auto-add any new materials/buyers/categories
    product.materials.forEach(m => this._ensureMaterial(m));
    if (product.category) this._ensureCategory(product.category);
    product.buyerCategories.forEach(bc => this._ensureBuyerCategory(bc));

    this._products.unshift(product);

    if (!this._isImporting) {
      this._saveProducts(product, 'insert');
    }
    
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
      materials: data.materials !== undefined ? data.materials : existing.materials || (existing.material ? [existing.material] : []),
      category: data.category !== undefined ? data.category.trim() : existing.category || '',
      buyerCategories: data.buyerCategories !== undefined ? data.buyerCategories : existing.buyerCategories || [],
      imageUrl: data.imageUrl !== undefined ? data.imageUrl.trim() : existing.imageUrl,
      updatedAt: new Date().toISOString(),
    };
    updated.material = updated.materials[0] || '';

    if (updated.materials) updated.materials.forEach(m => this._ensureMaterial(m));
    if (updated.category) this._ensureCategory(updated.category);
    if (updated.buyerCategories) updated.buyerCategories.forEach(bc => this._ensureBuyerCategory(bc));

    this._products[idx] = updated;
    this._saveProducts(updated, 'update');
    this.emit('product-updated', updated);
    return updated;
  }

  deleteProduct(id) {
    const idx = this._products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const deletedProduct = this._products[idx];
    this._products.splice(idx, 1);
    this._selected.delete(id);
    this._orderedSelection = this._orderedSelection.filter(sid => sid !== id);
    this._saveProducts(deletedProduct, 'delete');
    this.emit('product-deleted', id);
    return true;
  }

  // --- Favorites ---
  toggleFavorite(id) {
    const product = this._products.find(p => p.id === id);
    if (!product) return null;
    product.favorite = !product.favorite;
    product.updatedAt = new Date().toISOString();
    this._saveProducts(product, 'update', true);
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
    this._saveCategories(trimmed);
    return true;
  }

  _ensureCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      this._categories.push(trimmed);
      this._categories.sort((a, b) => a.localeCompare(b));
      this._saveCategories(trimmed);
    }
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
    this._saveMaterials(trimmed);
    return true;
  }

  _ensureMaterial(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._materials.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      this._materials.push(trimmed);
      this._materials.sort((a, b) => a.localeCompare(b));
      this._saveMaterials(trimmed);
    }
  }

  // --- Buyer Categories ---
  getBuyerCategories() {
    return [...this._buyerCategories];
  }

  addBuyerCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this._buyerCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) return false;
    this._buyerCategories.push(trimmed);
    this._buyerCategories.sort((a, b) => a.localeCompare(b));
    this._saveBuyerCategories(trimmed);
    return true;
  }

  _ensureBuyerCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!this._buyerCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      this._buyerCategories.push(trimmed);
      this._buyerCategories.sort((a, b) => a.localeCompare(b));
      this._saveBuyerCategories(trimmed);
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
  getFilteredProducts({ search = '', sort = 'newest', material = '', category = '', buyer = '', favoritesOnly = false } = {}) {
    let results = [...this._products];

    // Filter by search
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

    // Filter by material
    if (material) {
      results = results.filter(p =>
        (p.materials && p.materials.some(m => m.toLowerCase() === material.toLowerCase())) ||
        p.material.toLowerCase() === material.toLowerCase()
      );
    }

    // Filter by category
    if (category) {
      results = results.filter(p =>
        p.category && p.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by buyer category
    if (buyer) {
      results = results.filter(p =>
        p.buyerCategories && p.buyerCategories.some(bc => bc.toLowerCase() === buyer.toLowerCase())
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
  bulkAdd(productsData) {
    this._isImporting = true;
    const added = [];
    for (const data of productsData) {
      const product = this.addProduct(data);
      added.push(product);
    }
    this._isImporting = false;

    // Save locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products));
    this.emit('products-changed', this._products);

    // Sync to remote in bulk
    this._saveProductsBulk(added);

    return added;
  }

  // --- Data Export/Import ---
  exportData() {
    return JSON.stringify({
      products: this._products,
      categories: this._categories,
      materials: this._materials,
      buyerCategories: this._buyerCategories,
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
      if (data.materials && Array.isArray(data.materials)) {
        this._materials = data.materials;
      }
      if (data.buyerCategories && Array.isArray(data.buyerCategories)) {
        this._buyerCategories = data.buyerCategories;
      }
      
      this._saveLocalBackup();
      this.clearSelection();
      this.emit('data-imported');
      this.emit('products-changed', this._products);
      this.emit('categories-changed', this._categories);
      this.emit('materials-changed', this._materials);
      this.emit('buyer-categories-changed', this._buyerCategories);

      // Sync imported items to Supabase in bulk
      this._syncImportedDataToSupabase();

      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }
}

// Singleton
export const store = new Store();
