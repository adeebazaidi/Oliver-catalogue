// =============================================
// CatalogueGen — IndexedDB Database Layer
// Powered by Dexie.js for reliable, large-scale storage
// =============================================

import Dexie from 'dexie';

const DB_NAME = 'cataloguegen_db';
const DB_VERSION = 3;

// Legacy localStorage keys (for migration)
const LEGACY_KEYS = {
  products: 'cataloguegen_products',
  categories: 'cataloguegen_categories',
  materials: 'cataloguegen_materials',
  buyerCategories: 'cataloguegen_buyer_categories',
  migrated: 'cataloguegen_idb_migrated',
};

class CatalogueDB extends Dexie {
  constructor() {
    super(DB_NAME);

    // Version 1 Schema
    this.version(1).stores({
      products: 'id, name, category, favorite, createdAt, updatedAt',
      images: 'productId',
      categories: '++id, &name',
      materials: '++id, &name',
      buyerCategories: '++id, &name',
    });

    // Version 2 Schema (Added Sync Meta)
    this.version(2).stores({
      products: 'id, name, category, favorite, createdAt, updatedAt, sync_status, firebase_id',
    }).upgrade(tx => {
      return tx.products.toCollection().modify(product => {
        product.sync_status = 'pending';
        product.firebase_id = null;
      });
    });

    // Version 3 Schema (Added Settings)
    this.version(3).stores({
      settings: 'key',
    });

    this.products = this.table('products');
    this.images = this.table('images');
    this.categories = this.table('categories');
    this.materials = this.table('materials');
    this.buyerCategories = this.table('buyerCategories');
    this.settings = this.table('settings');
  }

  // --- Migration from localStorage ---
  async migrateFromLocalStorage() {
    const alreadyMigrated = localStorage.getItem(LEGACY_KEYS.migrated);
    if (alreadyMigrated === 'true') return false;

    console.log('[DB] Checking for legacy localStorage data to migrate...');
    let didMigrate = false;

    try {
      // Migrate products
      const rawProducts = localStorage.getItem(LEGACY_KEYS.products);
      if (rawProducts) {
        const products = JSON.parse(rawProducts);
        if (Array.isArray(products) && products.length > 0) {
          console.log(`[DB] Migrating ${products.length} products from localStorage...`);
          
          // Separate images from product data
          const productRecords = [];
          const imageRecords = [];

          for (const p of products) {
            const imageUrl = p.imageUrl || '';
            let imageRef = '';

            // If it's a base64 data URL, extract it into the images table
            if (imageUrl.startsWith('data:')) {
              try {
                const blob = await this._dataUrlToBlob(imageUrl);
                imageRecords.push({ productId: p.id, blob, mimeType: blob.type });
                imageRef = `idb:${p.id}`; // Reference marker
              } catch (err) {
                console.warn(`[DB] Failed to convert image for product ${p.id}:`, err);
                imageRef = imageUrl; // Keep as-is if conversion fails
              }
            } else {
              imageRef = imageUrl; // External URLs stay as-is
            }

            productRecords.push({
              id: p.id,
              name: p.name || 'Untitled Product',
              size: p.size || '',
              price: parseFloat(p.price) || 0,
              materials: p.materials || (p.material ? [p.material] : []),
              material: p.material || (p.materials?.[0] || ''),
              category: p.category || '',
              buyerCategories: p.buyerCategories || [],
              imageUrl: imageRef,
              favorite: p.favorite || false,
              createdAt: p.createdAt || new Date().toISOString(),
              updatedAt: p.updatedAt || new Date().toISOString(),
              sync_status: 'pending',
              firebase_id: null,
            });
          }

          await this.products.bulkPut(productRecords);
          if (imageRecords.length > 0) {
            await this.images.bulkPut(imageRecords);
          }
          didMigrate = true;
        }
      }

      // Migrate categories
      const rawCategories = localStorage.getItem(LEGACY_KEYS.categories);
      if (rawCategories) {
        const categories = JSON.parse(rawCategories);
        if (Array.isArray(categories) && categories.length > 0) {
          console.log(`[DB] Migrating ${categories.length} categories...`);
          const records = categories.map(name => ({ name }));
          await this.categories.bulkPut(records);
          didMigrate = true;
        }
      }

      // Migrate materials
      const rawMaterials = localStorage.getItem(LEGACY_KEYS.materials);
      if (rawMaterials) {
        const materials = JSON.parse(rawMaterials);
        if (Array.isArray(materials) && materials.length > 0) {
          console.log(`[DB] Migrating ${materials.length} materials...`);
          const records = materials.map(name => ({ name }));
          await this.materials.bulkPut(records);
          didMigrate = true;
        }
      }

      // Migrate buyer categories
      const rawBuyers = localStorage.getItem(LEGACY_KEYS.buyerCategories);
      if (rawBuyers) {
        const buyers = JSON.parse(rawBuyers);
        if (Array.isArray(buyers) && buyers.length > 0) {
          console.log(`[DB] Migrating ${buyers.length} buyer categories...`);
          const records = buyers.map(name => ({ name }));
          await this.buyerCategories.bulkPut(records);
          didMigrate = true;
        }
      }

      if (didMigrate) {
        // Mark migration complete — don't delete localStorage yet in case of issues
        localStorage.setItem(LEGACY_KEYS.migrated, 'true');
        console.log('[DB] Migration from localStorage complete!');
      }
    } catch (err) {
      console.error('[DB] Migration failed:', err);
    }

    return didMigrate;
  }

  // --- Products ---
  async getAllProducts() {
    return await this.products.orderBy('createdAt').reverse().toArray();
  }

  async getProduct(id) {
    return await this.products.get(id);
  }

  async putProduct(product) {
    await this.products.put(product);
  }

  async putProducts(products) {
    await this.products.bulkPut(products);
  }

  async deleteProduct(id) {
    await this.transaction('rw', [this.products, this.images], async () => {
      await this.products.delete(id);
      await this.images.delete(id);
    });
  }

  // --- Images ---
  async getImage(productId) {
    const record = await this.images.get(productId);
    if (!record) return null;
    return record.blob;
  }

  async getImageAsDataUrl(productId) {
    const blob = await this.getImage(productId);
    if (!blob) return null;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async putImage(productId, blob) {
    await this.images.put({ productId, blob, mimeType: blob.type });
  }

  async deleteImage(productId) {
    await this.images.delete(productId);
  }

  // --- Categories ---
  async getAllCategories() {
    const records = await this.categories.toArray();
    return records.map(r => r.name).sort((a, b) => a.localeCompare(b));
  }

  async addCategory(name) {
    try {
      await this.categories.add({ name });
      return true;
    } catch (err) {
      if (err.name === 'ConstraintError') return false; // Duplicate
      throw err;
    }
  }

  async updateCategory(oldName, newName) {
    const record = await this.categories.where('name').equals(oldName).first();
    if (!record) return false;
    await this.categories.update(record.id, { name: newName });
    return true;
  }

  async deleteCategory(name) {
    await this.categories.where('name').equals(name).delete();
  }

  // --- Materials ---
  async getAllMaterials() {
    const records = await this.materials.toArray();
    return records.map(r => r.name).sort((a, b) => a.localeCompare(b));
  }

  async addMaterial(name) {
    try {
      await this.materials.add({ name });
      return true;
    } catch (err) {
      if (err.name === 'ConstraintError') return false;
      throw err;
    }
  }

  async updateMaterial(oldName, newName) {
    const record = await this.materials.where('name').equals(oldName).first();
    if (!record) return false;
    await this.materials.update(record.id, { name: newName });
    return true;
  }

  async deleteMaterial(name) {
    await this.materials.where('name').equals(name).delete();
  }

  // --- Buyer Categories ---
  async getAllBuyerCategories() {
    const records = await this.buyerCategories.toArray();
    return records.map(r => r.name).sort((a, b) => a.localeCompare(b));
  }

  async addBuyerCategory(name) {
    try {
      await this.buyerCategories.add({ name });
      return true;
    } catch (err) {
      if (err.name === 'ConstraintError') return false;
      throw err;
    }
  }

  async updateBuyerCategory(oldName, newName) {
    const record = await this.buyerCategories.where('name').equals(oldName).first();
    if (!record) return false;
    await this.buyerCategories.update(record.id, { name: newName });
    return true;
  }

  async deleteBuyerCategory(name) {
    await this.buyerCategories.where('name').equals(name).delete();
  }

  // --- Settings ---
  async getSetting(key) {
    const record = await this.settings.get(key);
    return record ? record.value : null;
  }

  async putSetting(key, value) {
    await this.settings.put({ key, value });
  }

  // --- Bulk export/import ---
  async exportAll() {
    const products = await this.getAllProducts();
    const categories = await this.getAllCategories();
    const materials = await this.getAllMaterials();
    const buyerCategories = await this.getAllBuyerCategories();

    // For export, convert image blobs back to data URLs
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.startsWith('idb:')) {
        const dataUrl = await this.getImageAsDataUrl(product.id);
        product.imageUrl = dataUrl || '';
      }
    }

    return { products, categories, materials, buyerCategories };
  }

  async importAll(data) {
    await this.transaction('rw', [this.products, this.images, this.categories, this.materials, this.buyerCategories], async () => {
      // Import products
      if (data.products && Array.isArray(data.products)) {
        const productRecords = [];
        const imageRecords = [];

        for (const p of data.products) {
          let imageRef = p.imageUrl || '';

          if (imageRef.startsWith('data:')) {
            try {
              const blob = await this._dataUrlToBlob(imageRef);
              imageRecords.push({ productId: p.id, blob, mimeType: blob.type });
              imageRef = `idb:${p.id}`;
            } catch (err) {
              console.warn(`[DB] Failed to convert imported image for ${p.id}`);
            }
          }

          productRecords.push({
            ...p,
            imageUrl: imageRef,
          });
        }

        await this.products.bulkPut(productRecords);
        if (imageRecords.length > 0) {
          await this.images.bulkPut(imageRecords);
        }
      }

      // Import filter lists
      if (data.categories && Array.isArray(data.categories)) {
        await this.categories.clear();
        await this.categories.bulkAdd(data.categories.map(name => ({ name })));
      }
      if (data.materials && Array.isArray(data.materials)) {
        await this.materials.clear();
        await this.materials.bulkAdd(data.materials.map(name => ({ name })));
      }
      if (data.buyerCategories && Array.isArray(data.buyerCategories)) {
        await this.buyerCategories.clear();
        await this.buyerCategories.bulkAdd(data.buyerCategories.map(name => ({ name })));
      }
    });
  }

  async clearAll() {
    await this.transaction('rw', [this.products, this.images, this.categories, this.materials, this.buyerCategories], async () => {
      await this.products.clear();
      await this.images.clear();
      await this.categories.clear();
      await this.materials.clear();
      await this.buyerCategories.clear();
    });
  }

  // --- Utility ---
  async _dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return await response.blob();
  }
}

// Singleton
export const db = new CatalogueDB();
