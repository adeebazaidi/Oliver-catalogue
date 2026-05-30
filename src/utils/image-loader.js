// =============================================
// CatalogueGen — Image Loader Utility
// =============================================

import { store } from '../store.js';

/**
 * Unwrap search-engine image viewer URLs and return the direct image URL.
 * Handles:
 *  - Google Images: google.com/imgres?imgurl=ENCODED_URL
 *  - Bing Images:   bing.com/images/search?view=detailV2&...mediaurl=ENCODED_URL
 *  - Pinterest:     pinterest.com/pin/...  (best-effort — extracts og:image via no-op)
 * Returns the input unchanged if no wrapper pattern is detected.
 */
export function normalizeImageUrl(url) {
  if (!url || url.startsWith('data:') || url.startsWith('idb:')) return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // Google Images result page: extract imgurl param
    if (host === 'google.com' && u.pathname.startsWith('/imgres')) {
      const imgurl = u.searchParams.get('imgurl');
      if (imgurl) return imgurl;          // already decoded by URLSearchParams
    }

    // Bing Image viewer: extract mediaurl param
    if (host === 'bing.com' && u.searchParams.has('mediaurl')) {
      const mediaurl = u.searchParams.get('mediaurl');
      if (mediaurl) return mediaurl;
    }

    // Generic: if there's an "imgurl", "imageurl", or "src" param holding an http URL, use it
    for (const param of ['imgurl', 'imageurl', 'image_url', 'src', 'url']) {
      const val = u.searchParams.get(param);
      if (val && (val.startsWith('http') || val.startsWith('https'))) return val;
    }
  } catch (_) {
    // Not a valid URL — return as-is
  }
  return url;
}

export async function fetchImageAsBase64(url) {
  if (!url) return null;
  url = normalizeImageUrl(url);   // unwrap Google imgres / Bing viewer URLs

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

/**
 * Auto-crop a canvas to remove surrounding white / transparent margins.
 * Returns a new canvas containing only the tight bounding box of non-blank pixels.
 * "Blank" = pixel with alpha < 10 OR an almost-pure-white pixel (R,G,B all > 245).
 * A small padding (4px) is preserved so the product doesn't touch the container edge.
 */
function autocropCanvas(src) {
  const { width, height } = src;
  const ctx = src.getContext('2d');
  const data = ctx.getImageData(0, 0, width, height).data;

  const PADDING = 4;
  const WHITE_THRESH = 245;
  const ALPHA_THRESH = 10;

  let minX = width, minY = height, maxX = 0, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      // Consider the pixel "content" if it's visible and not near-white
      if (a > ALPHA_THRESH && !(r > WHITE_THRESH && g > WHITE_THRESH && b > WHITE_THRESH)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // No non-white content found — return original unchanged
  if (minX > maxX || minY > maxY) return src;

  // Apply padding
  minX = Math.max(0, minX - PADDING);
  minY = Math.max(0, minY - PADDING);
  maxX = Math.min(width - 1, maxX + PADDING);
  maxY = Math.min(height - 1, maxY + PADDING);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = document.createElement('canvas');
  cropped.width = cropW;
  cropped.height = cropH;
  cropped.getContext('2d').drawImage(src, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return cropped;
}

export async function fetchImageWithDimensions(url) {
  if (!url) return null;
  url = normalizeImageUrl(url);   // unwrap Google imgres / Bing viewer URLs
  try {
    const resolvedUrl = await store.resolveImageUrl(url);
    if (!resolvedUrl) return null;

    // Helper: draw an HTMLImageElement onto a canvas, autocrop, and resolve
    const processImage = (loadedImg) => {
      const canvas = document.createElement('canvas');
      canvas.width  = loadedImg.naturalWidth  || loadedImg.width;
      canvas.height = loadedImg.naturalHeight || loadedImg.height;
      if (canvas.width === 0 || canvas.height === 0) throw new Error('Zero-size image');
      const ctx = canvas.getContext('2d');
      // White base so transparent formats (PNG, WebP, AVIF) look right
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(loadedImg, 0, 0);
      const cropped = autocropCanvas(canvas);
      return {
        data:   cropped.toDataURL('image/jpeg', 0.9),
        width:  cropped.width,
        height: cropped.height,
      };
    };

    // ── Fast path: data URL — no network, no CORS issue ──────────────────
    if (resolvedUrl.startsWith('data:')) {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => { try { resolve(processImage(img)); } catch(e) { reject(e); } };
        img.onerror = reject;
        img.src = resolvedUrl;
      });
    }

    // ── External URL — try with CORS first, fall back to no-CORS ─────────
    const tryLoad = (withCors) => new Promise((resolve, reject) => {
      const img = new Image();
      if (withCors) img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          resolve(processImage(img));
        } catch (secErr) {
          // Canvas tainted (CORS header missing on server) — fall through
          reject(secErr);
        }
      };
      img.onerror = reject;
      img.src = resolvedUrl;
    });

    try {
      return await tryLoad(true);
    } catch (_corsErr) {
      // CORS attempt failed — fetch the image as a Blob and load via object URL.
      // Blob URLs are same-origin so the canvas is never tainted.
      // This handles WebP, AVIF, SVG and any format the browser can decode.
      try {
        const resp = await fetch(resolvedUrl, { mode: 'cors' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        return await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              resolve(processImage(img));
            } catch(e) {
              reject(e);
            } finally {
              URL.revokeObjectURL(blobUrl);
            }
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            reject(new Error('blob load failed'));
          };
          img.src = blobUrl;
        });
      } catch (fetchErr) {
        console.warn(`fetchImageWithDimensions: all attempts failed for ${url}`, fetchErr);
        return null;
      }
    }
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
