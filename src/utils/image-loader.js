// =============================================
// CatalogueGen — Image Loader Utility
// =============================================

export async function fetchImageAsBase64(url) {
  if (!url) return null;

  try {
    const response = await fetch(url, { mode: 'cors' });
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
