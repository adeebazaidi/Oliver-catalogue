// =============================================
// CatalogueGen — PowerPoint Generator
// =============================================

import PptxGenJS from 'pptxgenjs';
import { fetchImageAsBase64 } from '../utils/image-loader.js';

export async function generatePPT(products, coverInfo) {
  const pres = new PptxGenJS();

  // Brand colors
  const wine = '1E3A8A';
  const wineDark = '1E40AF';
  const beige = 'FFFFFF';
  const cream = 'F8FAFC';
  const textDark = '0F172A';
  const textBody = '334155';
  const gold = '3B82F6';
  const white = 'FFFFFF';

  // Presentation metadata
  pres.author = coverInfo.companyName || 'Oliver Mc Inroy Catalogue';
  pres.subject = coverInfo.title || 'Product Catalogue';
  pres.title = coverInfo.title || 'Product Catalogue';

  // Define slide layouts
  pres.defineSlideMaster({
    title: 'PRODUCT_SLIDE',
    background: { color: beige },
    objects: [
      // Top wine bar
      { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: { color: wine } } },
      // Bottom bar
      { rect: { x: 0, y: 7.0, w: '100%', h: 0.5, fill: { color: wine } } },
    ],
  });

  // ---- Title Slide ----
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: wine };

  // Gold decorative line
  titleSlide.addShape(pres.ShapeType.line, {
    x: 2.5, y: 2.3, w: 5, h: 0,
    line: { color: gold, width: 2 },
  });

  // Title
  titleSlide.addText(coverInfo.title || 'Product Catalogue', {
    x: 0.5, y: 2.5, w: 9, h: 1.2,
    fontSize: 36,
    fontFace: 'Georgia',
    color: white,
    bold: true,
    align: 'center',
  });

  // Subtitle
  if (coverInfo.subtitle) {
    titleSlide.addText(coverInfo.subtitle, {
      x: 0.5, y: 3.6, w: 9, h: 0.6,
      fontSize: 18,
      fontFace: 'Arial',
      color: 'E8DCC8',
      align: 'center',
    });
  }

  // Gold line below
  titleSlide.addShape(pres.ShapeType.line, {
    x: 2.5, y: 4.5, w: 5, h: 0,
    line: { color: gold, width: 2 },
  });

  // Meta
  const metaParts = [];
  if (coverInfo.companyName) metaParts.push(coverInfo.companyName);
  if (coverInfo.date) metaParts.push(coverInfo.date);
  metaParts.push(`${products.length} Products`);

  titleSlide.addText(metaParts.join('  ·  '), {
    x: 0.5, y: 5.0, w: 9, h: 0.5,
    fontSize: 12,
    fontFace: 'Arial',
    color: 'B5A89F',
    align: 'center',
  });

  // ---- Product Slides ----
  for (let idx = 0; idx < products.length; idx++) {
    const product = products[idx];
    const slide = pres.addSlide({ masterName: 'PRODUCT_SLIDE' });

    // Product counter in top bar
    slide.addText(`Product ${idx + 1} of ${products.length}`, {
      x: 0.3, y: 0.05, w: 4, h: 0.4,
      fontSize: 9,
      fontFace: 'Arial',
      color: white,
    });

    // Catalogue title in top bar
    slide.addText(coverInfo.title || 'Product Catalogue', {
      x: 5.5, y: 0.05, w: 4.2, h: 0.4,
      fontSize: 9,
      fontFace: 'Arial',
      color: white,
      align: 'right',
    });

    // Product name
    slide.addText(product.name, {
      x: 0.7, y: 0.8, w: 8.5, h: 0.7,
      fontSize: 26,
      fontFace: 'Georgia',
      color: textDark,
      bold: true,
    });

    // Gold underline
    slide.addShape(pres.ShapeType.line, {
      x: 0.7, y: 1.55, w: 2, h: 0,
      line: { color: gold, width: 2 },
    });

    let startY = 1.9;

    if (product.imageUrl) {
      try {
        const base64Img = await fetchImageAsBase64(product.imageUrl);
        if (base64Img) {
          slide.addImage({ data: base64Img, x: 0.7, y: 1.9, w: 2.5, h: 2.5, sizing: { type: 'contain', w: 2.5, h: 2.5 } });
          startY = 4.7; // shift table down
        } else {
          slide.addText("[Image Unavailable]", { x: 0.7, y: 2.0, w: 2, h: 0.3, fontSize: 10, color: '8B7B74' });
          startY = 2.4;
        }
      } catch (e) {
        console.warn('PPT Image error:', e);
      }
    }

    // Product details table
    const tableRows = [];

    // Header row
    tableRows.push([
      { text: 'Specification', options: { bold: true, color: white, fill: { color: wine }, fontSize: 11 } },
      { text: 'Details', options: { bold: true, color: white, fill: { color: wine }, fontSize: 11 } },
    ]);

    const specs = [
      ['Price', `$${product.price.toLocaleString('en-US')}`],
      ['Size', product.size || '—'],
      ['Category', product.category || '—'],
      ['Materials', product.materials && product.materials.length > 0 ? product.materials.join(', ') : product.material || '—'],
      ['Buyer Categories', product.buyerCategories && product.buyerCategories.length > 0 ? product.buyerCategories.join(', ') : '—'],
    ];

    specs.forEach(([label, value], i) => {
      const fillColor = i % 2 === 0 ? white : cream;
      tableRows.push([
        { text: label, options: { bold: true, color: textDark, fill: { color: fillColor }, fontSize: 11 } },
        { text: value, options: { color: textBody, fill: { color: fillColor }, fontSize: 11 } },
      ]);
    });

    slide.addTable(tableRows, {
      x: 0.7, y: startY, w: 8.5,
      border: { type: 'solid', pt: 0.5, color: 'E2D8CC' },
      colW: [2.5, 6],
      rowH: 0.5,
      fontFace: 'Arial',
    });

    // Footer text
    slide.addText('Generated by Oliver Mc Inroy Catalogue', {
      x: 0.3, y: 7.05, w: 9.4, h: 0.35,
      fontSize: 8,
      fontFace: 'Arial',
      color: white,
      align: 'center',
    });
  }

  // Save
  const fileName = (coverInfo.title || 'catalogue').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const buffer = await pres.write({ outputType: 'arraybuffer' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  return { blob, fileName: `${fileName}.pptx` };
}
