// =============================================
// CatalogueGen — Export Web Worker
// Runs document generation off the main thread
// =============================================

self.onmessage = async (e) => {
  const { format, orderedProducts, coverInfo } = e.data;

  try {
    let result = null;

    if (format === 'pdf') {
      const { generatePDF } = await import('../generators/pdf-generator.js');
      result = await generatePDF(orderedProducts, coverInfo);
    } else if (format === 'ppt') {
      const { generatePPT } = await import('../generators/ppt-generator.js');
      result = await generatePPT(orderedProducts, coverInfo);
    } else if (format === 'excel') {
      const { generateExcel } = await import('../generators/excel-generator.js');
      result = await generateExcel(orderedProducts, coverInfo);
    }

    if (result && result.blob) {
      self.postMessage({ success: true, blob: result.blob, fileName: result.fileName });
    } else {
      throw new Error('Generator did not return a valid file blob.');
    }
  } catch (err) {
    console.error('Worker generation failed:', err);
    self.postMessage({ success: false, error: err.message });
  }
};
