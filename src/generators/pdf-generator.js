// =============================================
// CatalogueGen — PDF Generator (Mirrors PPT)
// =============================================

import { jsPDF } from 'jspdf';
import { fetchImageAsBase64, fetchImageWithDimensions } from '../utils/image-loader.js';
import { formatPrice } from '../utils/currency.js';

export async function generatePDF(products, coverInfo) {
  // 16:9 ratio in inches matches PPT (10 x 5.625)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'in', format: [10, 5.625] });

  const navy = [5, 10, 48]; // #050A30
  const gold = [212, 175, 55]; // #D4AF37
  const white = [255, 255, 255];
  const textBody = [226, 232, 240]; // E2E8F0

  const drawNavyBackground = () => {
    doc.setFillColor(...navy);
    doc.rect(0, 0, 10, 5.625, 'F');
  };

  // Helper to maintain aspect ratio without stretching
  const drawImageContain = (imgData, boxX, boxY, boxW, boxH) => {
    try {
      const props = doc.getImageProperties(imgData);
      let renderW = props.width;
      let renderH = props.height;
      const ratio = renderW / renderH;
      const boxRatio = boxW / boxH;

      if (ratio > boxRatio) {
        renderW = boxW;
        renderH = boxW / ratio;
      } else {
        renderH = boxH;
        renderW = boxH * ratio;
      }
      
      const xPos = boxX + (boxW - renderW) / 2;
      const yPos = boxY + (boxH - renderH) / 2;
      doc.addImage(imgData, 'JPEG', xPos, yPos, renderW, renderH);
    } catch (e) {
      console.warn("Failed to draw image contain", e);
    }
  };

  const addStaticSlide = async (imgName) => {
    doc.addPage();
    drawNavyBackground();
    try {
      const img = await fetchImageAsBase64(self.location.origin + '/ppt_assets/' + imgName);
      if (img) doc.addImage(img, 'PNG', 0, 0, 10, 5.625);
    } catch(e) {}
  };

  // ==========================================
  // SLIDE 1: COVER
  // ==========================================
  drawNavyBackground();
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(54);
  doc.text('Oliver McInroy & Co.', 5, 1.8, { align: 'center', baseline: 'middle' });
  
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.02);
  doc.line(4, 2.8, 6, 2.8);

  doc.setTextColor(...gold);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  // Add letter spacing hack by splitting text or just normal
  doc.text('EXCLUSIVE PRODUCT COLLECTION', 5, 3.2, { align: 'center', baseline: 'middle' });

  if (coverInfo.date) {
    doc.setTextColor(...textBody);
    doc.setFontSize(12);
    doc.text(coverInfo.date, 5, 3.8, { align: 'center', baseline: 'middle' });
  }

  // ==========================================
  // STATIC SLIDES
  // ==========================================
  await addStaticSlide('about.png');
  await addStaticSlide('infographic.png');

  // ==========================================
  // PRODUCTS (2 Per Page)
  // ==========================================
  for (let idx = 0; idx < products.length; idx += 2) {
    const p1 = products[idx];
    const p2 = products[idx + 1];
    doc.addPage();
    drawNavyBackground();

    const drawProduct = async (product, offsetX, index) => {
      if (!product) return;
      try {
        const imgH = 2.4;
        const startY = 0.5;

        // Draw white box behind image area
        doc.setFillColor(255, 255, 255);
        doc.rect(offsetX, startY, 4.5, imgH, 'F');

        // Collect all images
        let allImages = [];
        if (product.imageUrl) allImages.push(product.imageUrl);
        if (product.images && Array.isArray(product.images)) {
          allImages.push(...product.images);
        }
        allImages = [...new Set(allImages)];

        if (allImages.length > 0) {
          const drawImg = async (url, boxX, boxY, boxW, boxH) => {
            const imgObj = await fetchImageWithDimensions(url);
            if (!imgObj) throw new Error("Image failed");
            let renderW = imgObj.width;
            let renderH = imgObj.height;
            const ratio = renderW / renderH;
            const bRatio = boxW / boxH;
            if (ratio > bRatio) {
              renderW = boxW;
              renderH = boxW / ratio;
            } else {
              renderH = boxH;
              renderW = boxH * ratio;
            }
            const fX = boxX + (boxW - renderW) / 2;
            const fY = boxY + (boxH - renderH) / 2;
            doc.addImage(imgObj.data, 'JPEG', fX, fY, renderW, renderH);
          };

          try {
            if (allImages.length === 1) {
              await drawImg(allImages[0], offsetX, startY, 4.5, imgH);
            } else if (allImages.length === 2) {
              await drawImg(allImages[0], offsetX, startY, 2.2, imgH);
              await drawImg(allImages[1], offsetX + 2.3, startY, 2.2, imgH);
            } else if (allImages.length === 3) {
              await drawImg(allImages[0], offsetX, startY, 1.4, imgH);
              await drawImg(allImages[1], offsetX + 1.5, startY, 1.4, imgH);
              await drawImg(allImages[2], offsetX + 3.0, startY, 1.4, imgH);
            } else {
              const halfH = imgH / 2 - 0.05;
              await drawImg(allImages[0], offsetX, startY, 2.2, halfH);
              await drawImg(allImages[1], offsetX + 2.3, startY, 2.2, halfH);
              await drawImg(allImages[2], offsetX, startY + halfH + 0.1, 2.2, halfH);
              await drawImg(allImages[3], offsetX + 2.3, startY + halfH + 0.1, 2.2, halfH);
            }
          } catch (e) {
            doc.setTextColor(...textMuted);
            doc.setFontSize(10);
            doc.text("[Image Unavailable]", offsetX + 2.25, startY + 1.2, { align: 'center' });
          }
        }

        // Product Name
        doc.setTextColor(...white);
        doc.setFontSize(14);
        // jsPDF basic text wrapping
        const splitTitle = doc.splitTextToSize(product.name, 4.5);
        doc.text(splitTitle, offsetX, 3.3, { baseline: 'top' });

        // Price
        doc.setTextColor(...gold);
        doc.setFontSize(12);
        const priceY = 3.3 + (splitTitle.length * 0.25);
        doc.text(formatPrice(product.price), offsetX, priceY, { baseline: 'top' });

        // Specs
        let currentY = priceY + 0.3;
        const addSpec = (label, value) => {
          if (!value || value === '—') return;
          doc.setTextColor(...gold);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text(label.toUpperCase() + ':   ', offsetX, currentY, { baseline: 'top' });
          
          const labelWidth = doc.getTextWidth(label.toUpperCase() + ':   ');
          
          doc.setTextColor(...textBody);
          doc.setFont('helvetica', 'normal');
          doc.text(String(value), offsetX + labelWidth, currentY, { baseline: 'top' });
          currentY += 0.22;
        };

        addSpec('Size', product.size);
        addSpec('Category', product.category);
        addSpec('Material', product.materials && product.materials.length > 0 ? product.materials.join(', ') : product.material);

      } catch (err) {
        console.error(`Failed to generate PDF for product ${product.id}`, err);
      }
    };

    // Draw Left Product
    await drawProduct(p1, 0.3, 0); // X = 0.3 inches
    
    // Draw Right Product
    if (p2) {
      await drawProduct(p2, 5.2, 1); // X = 5.2 inches
    }
  }

  // ==========================================
  // FINAL SLIDES
  // ==========================================
  await addStaticSlide('clients.png');
  await addStaticSlide('certifications.png');

  // ==========================================
  // EXPORT
  // ==========================================
  const fileName = (coverInfo.title || 'catalogue').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const blob = doc.output('blob');
  return { blob, fileName: `${fileName}.pdf` };
}
