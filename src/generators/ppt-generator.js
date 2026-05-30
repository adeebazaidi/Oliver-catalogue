// =============================================
// CatalogueGen — Premium PowerPoint Generator
// =============================================

import PptxGenJS from 'pptxgenjs';
import { fetchImageAsBase64, fetchImageWithDimensions } from '../utils/image-loader.js';
import { formatPrice } from '../utils/currency.js';
import { store } from '../store.js';

export async function generatePPT(products, coverInfo) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';

  // Fetch Custom Template Settings (if any left over)
  const template = await store.getSetting('ppt_template') || {};

  // Premium Brand Colors (Fixed)
  const navy = '050A30';      
  const gold = 'D4AF37';      
  const white = 'FFFFFF';
  const textBody = 'E2E8F0';
  const textDark = '0F172A';

  // Presentation metadata
  pres.author = 'Oliver McInroy & Co.';
  pres.subject = coverInfo.title || 'Product Catalogue';
  pres.title = coverInfo.title || 'Product Catalogue';

  // ==========================================
  // MASTER SLIDES
  // ==========================================

  // Dark Master for static info slides
  pres.defineSlideMaster({
    title: 'MASTER_DARK',
    background: { color: navy },
    objects: [
      // Top gold accent line
      { rect: { x: 0, y: 0, w: '100%', h: 0.05, fill: { color: gold } } },
      // Footer text
      { text: { text: 'Oliver McInroy & Co.', options: { x: 0.5, y: 7.2, w: 4, h: 0.2, color: '475569', fontSize: 10, fontFace: 'Georgia' } } },
      { text: { text: 'Handcrafted Metal Home Décor', options: { x: 5.5, y: 7.2, w: 4, h: 0.2, color: '475569', fontSize: 10, align: 'right', fontFace: 'Arial' } } }
    ],
  });

  // Split Master for products
  pres.defineSlideMaster({
    title: 'MASTER_PRODUCT',
    background: { color: white },
    objects: [
      // Right side dark panel
      { rect: { x: '50%', y: 0, w: '50%', h: '100%', fill: { color: navy } } },
      // Vertical gold separator line
      { rect: { x: '50%', y: 0, w: 0.05, h: '100%', fill: { color: gold } } },
      // Footer inside dark panel
      { text: { text: 'Oliver McInroy & Co.', options: { x: '55%', y: 7.2, w: 4, h: 0.2, color: '475569', fontSize: 10, fontFace: 'Georgia' } } }
    ],
  });

  // ==========================================
  // SLIDE 1: COVER
  // ==========================================
  const slideCover = pres.addSlide({ masterName: 'MASTER_DARK' });
  
  if (template.coverImage) {
    slideCover.addImage({ data: template.coverImage, x: 0, y: 0, w: '100%', h: '100%' });
  } else {
    slideCover.addText('Oliver McInroy & Co.', {
      x: 0, y: 1.8, w: '100%', h: 1.0, align: 'center', fontSize: 54, fontFace: 'Georgia', color: white, bold: true
    });
    slideCover.addShape(pres.ShapeType.line, {
      x: '40%', y: 2.8, w: '20%', h: 0, line: { color: gold, width: 2 }
    });
    slideCover.addText('EXCLUSIVE PRODUCT COLLECTION', {
      x: 0, y: 3.2, w: '100%', h: 0.5, align: 'center', fontSize: 16, fontFace: 'Arial', color: gold, letterSpacing: 4
    });
    if (coverInfo.date) {
      slideCover.addText(coverInfo.date, {
        x: 0, y: 3.8, w: '100%', h: 0.5, align: 'center', fontSize: 12, fontFace: 'Arial', color: textBody
      });
    }
  }

  // ==========================================
  // SLIDE 2: ABOUT US
  // ==========================================
  const slideAbout = pres.addSlide({ masterName: 'MASTER_DARK' });
  try {
    const aboutImg = await fetchImageAsBase64(self.location.origin + '/ppt_assets/about.png');
    if (aboutImg) slideAbout.addImage({ data: aboutImg, x: 0, y: 0, w: '100%', h: '100%' });
  } catch (err) { console.warn("Failed to load about.png"); }

  // ==========================================
  // SLIDE 3: INFOGRAPHIC
  // ==========================================
  const slideStats = pres.addSlide({ masterName: 'MASTER_DARK' });
  try {
    const statsImg = await fetchImageAsBase64(self.location.origin + '/ppt_assets/infographic.png');
    if (statsImg) slideStats.addImage({ data: statsImg, x: 0, y: 0, w: '100%', h: '100%' });
  } catch (err) { console.warn("Failed to load infographic.png"); }

  // ==========================================
  // SLIDES 4+: PRODUCTS (2 Per Page)
  // ==========================================
  for (let idx = 0; idx < products.length; idx += 2) {
    const p1 = products[idx];
    const p2 = products[idx + 1];
    
    // Add slide with Navy Background
    const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

    // Function to draw a product at a specific X offset
    const drawProduct = async (product, offsetX, index) => {
      if (!product) return;
      
      try {
        // Safe fixed sizes so nothing spills
        const imgH = 2.4;
        const startY = 0.5;

        // Draw white box behind image area
        slide.addShape(pres.ShapeType.rect, { x: offsetX, y: startY, w: 4.5, h: imgH, fill: { color: 'FFFFFF' } });
        
        // Images array handling (collect all images for the product)
        let allImages = [];
        if (product.imageUrl) allImages.push(product.imageUrl);
        if (product.images && Array.isArray(product.images)) {
          allImages.push(...product.images);
        }
        // Deduplicate just in case
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
            slide.addImage({ data: imgObj.data, x: fX, y: fY, w: renderW, h: renderH });
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
            slide.addText("[Image Unavailable]", { x: offsetX, y: startY + 1.0, w: 4.5, h: 0.5, fontSize: 10, align: 'center', color: '94A3B8' });
          }
        }

        // Product Name
        slide.addText(product.name, {
          x: offsetX, y: 3.3, w: 4.5, h: 0.35, fontSize: 14, color: white, fontFace: 'Georgia', bold: true, breakLine: true, valign: 'top'
        });

        // Price
        slide.addText(formatPrice(product.price), {
          x: offsetX, y: 3.8, w: 4.5, h: 0.2, fontSize: 12, color: gold, fontFace: 'Arial', bold: true
        });

        // Specs (Size, Category, Material) side-by-side or stacked
        let currentY = 4.1;
        const addSpec = (label, value) => {
          if (!value || value === '—') return;
          slide.addText([
            { text: label.toUpperCase() + ':   ', options: { color: gold, fontSize: 9, bold: true, fontFace: 'Arial' } },
            { text: value, options: { color: textBody, fontSize: 9, fontFace: 'Arial' } }
          ], { x: offsetX, y: currentY, w: 4.5, h: 0.2, valign: 'middle' });
          currentY += 0.22;
        };

        addSpec('Size', product.size);
        addSpec('Category', product.category);
        addSpec('Material', product.materials && product.materials.length > 0 ? product.materials.join(', ') : product.material);
        
      } catch (err) {
        console.error(`Failed to generate PPT for product ${product.id}`, err);
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
  // PENULTIMATE SLIDE: CLIENTS
  // ==========================================
  const slideClients = pres.addSlide({ masterName: 'MASTER_DARK' });
  try {
    const clientsImg = await fetchImageAsBase64(self.location.origin + '/ppt_assets/clients.png');
    if (clientsImg) slideClients.addImage({ data: clientsImg, x: 0, y: 0, w: '100%', h: '100%' });
  } catch (err) { console.warn("Failed to load clients.png"); }

  // ==========================================
  // FINAL SLIDE: CERTIFICATIONS
  // ==========================================
  const slideCerts = pres.addSlide({ masterName: 'MASTER_DARK' });
  try {
    const certsImg = await fetchImageAsBase64(self.location.origin + '/ppt_assets/certifications.png');
    if (certsImg) slideCerts.addImage({ data: certsImg, x: 0, y: 0, w: '100%', h: '100%' });
  } catch (err) { console.warn("Failed to load certifications.png"); }

  // ==========================================
  // EXPORT
  // ==========================================
  const fileName = (coverInfo.title || 'catalogue').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const buffer = await pres.write({ outputType: 'arraybuffer' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  return { blob, fileName: `${fileName}.pptx` };
}
