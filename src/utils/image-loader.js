// =============================================
// CatalogueGen — Image Loader Utility
// =============================================

import { store } from '../store.js';

export async function fetchImageAsBase64(url) {
  if (!url) return null;

  try {
    // If it's an IndexedDB reference, resolve it to a data URL directly
    const resolvedUrl = await store.resolveImageUrl(url);
    
    // If it's already a data URL (from idb or existing base64), return it
    if (resolvedUrl && resolvedUrl.startsWith('data:')) {
      return resolvedUrl;
    }

    // Otherwise fetch the external image
    const response = await fetch(resolvedUrl, { mode: 'cors' });
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${response.statusText}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`CORS or network error fetching image: ${url}`, err);
    return null; // Fallback to null on failure
  }
}

export async function fetchImageWithDimensions(url) {
  if (!url) return null;
  try {
    const resolvedUrl = await store.resolveImageUrl(url);
    if (!resolvedUrl) return null;

    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      const processImage = (loadedImg) => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = loadedImg.width;
          canvas.height = loadedImg.height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(loadedImg, 0, 0);
          resolve({
            data: canvas.toDataURL('image/jpeg', 0.9),
            width: loadedImg.width,
            height: loadedImg.height
          });
        } catch(e) {
          reject(e);
        }
      };

      img.onload = () => processImage(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.onload = () => processImage(fallback);
        fallback.onerror = reject;
        fallback.src = resolvedUrl;
      };
      img.src = resolvedUrl;
    });
  } catch (err) {
    console.warn(`Failed to fetch image with dimensions: ${url}`, err);
    return null;
  }
}

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 85% quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
