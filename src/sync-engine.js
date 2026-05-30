// =============================================
// CatalogueGen — Background Sync Engine
// IndexedDB -> Firebase synchronization
// =============================================

import { db } from './db.js';
import { isFirebaseConfigured, firestore, storage } from './firebase.js';
import { collection, doc, setDoc, getDocs, query, where, orderBy, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { store } from './store.js';

class SyncEngine {
  constructor() {
    this.isSyncing = false;
    this.syncTimer = null;
    
    // Listen for online events to trigger a sync
    window.addEventListener('online', () => this.triggerSync());
  }

  triggerSync() {
    if (!isFirebaseConfigured() || !navigator.onLine || this.isSyncing) return;
    
    if (this.syncTimer) clearTimeout(this.syncTimer);
    
    // Debounce sync slightly
    this.syncTimer = setTimeout(async () => {
      this.isSyncing = true;
      try {
        await this.pushPendingChanges();
        // Optional: pullRemoteChanges() can be called here or manually triggered
      } catch (err) {
        console.error('[SyncEngine] Sync failed:', err);
      } finally {
        this.isSyncing = false;
      }
    }, 1000);
  }

  async pushPendingChanges() {
    console.log('[SyncEngine] Starting push sync...');
    
    // 1. Get all pending products
    const pendingProducts = await db.products.where('sync_status').equals('pending').toArray();
    
    if (pendingProducts.length === 0) {
      console.log('[SyncEngine] No pending changes.');
      return;
    }

    console.log(`[SyncEngine] Found ${pendingProducts.length} pending products to push.`);

    for (const product of pendingProducts) {
      try {
        // Prepare data for Firestore
        const firestoreData = { ...product };
        delete firestoreData.sync_status;
        
        // Handle Image Upload if needed
        if (product.imageUrl && product.imageUrl.startsWith('idb:')) {
          const blob = await db.getImage(product.id);
          if (blob) {
            // Upload to Firebase Storage
            const storageRef = ref(storage, `products/${product.id}/image.png`);
            await uploadBytes(storageRef, blob, { contentType: blob.type });
            const downloadUrl = await getDownloadURL(storageRef);
            
            // Update firestore data with real URL
            firestoreData.imageUrl = downloadUrl;
            
            // Note: We intentionally don't update local imageUrl because we want to keep using the fast local blob
          }
        }

        // Push to Firestore
        const docRef = doc(firestore, 'products', product.id);
        await setDoc(docRef, firestoreData, { merge: true });

        // Update local status to synced
        await db.products.update(product.id, { 
          sync_status: 'synced',
          firebase_id: product.id 
        });
        
        console.log(`[SyncEngine] Successfully synced product: ${product.name}`);
      } catch (err) {
        console.error(`[SyncEngine] Failed to sync product ${product.id}:`, err);
        // Leave it as pending to try again later
      }
    }
  }

  async pullRemoteChanges() {
    if (!isFirebaseConfigured() || !navigator.onLine) return;

    console.log('[SyncEngine] Starting pull sync...');
    try {
      const q = query(collection(firestore, 'products'));
      const querySnapshot = await getDocs(q);
      
      const remoteProducts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        data.sync_status = 'synced'; // Mark as synced locally
        data.firebase_id = doc.id;
        remoteProducts.push(data);
      });

      console.log(`[SyncEngine] Downloaded ${remoteProducts.length} products from Firebase.`);

      // Update local IndexedDB
      // In a real robust system, we would check updatedAt timestamps here
      // For now, we will do a simple bulk put, which overwrites local
      await db.products.bulkPut(remoteProducts);
      
      // Update store memory cache
      await store._init();
      store.emit('products_changed');

    } catch (err) {
      console.error('[SyncEngine] Failed to pull changes:', err);
    }
  }
}

export const syncEngine = new SyncEngine();
