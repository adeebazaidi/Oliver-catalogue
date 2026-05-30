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
  // SLIDES 4+: PRODUCTS (2 Per Page) — Premium Framed Layout
  // ==========================================

  // Slide dimensions for LAYOUT_16x9 in PptxGenJS: 10" × 5.625"
  const SW = 10;      // slide width
  const SH = 5.625;   // slide height
  const CX = SW / 2;  // horizontal centre (= 5")

  // Layout constants
  const BORDER_M  = 0.1;   // outer border margin from slide edge
  const IMG_Y     = 0.32;  // image frame top
  const IMG_H     = 2.82;  // image frame height
  const IMG_W     = 3.55;  // image frame width (square-ish)
  const IMG_BOT   = IMG_Y + IMG_H;          // = 3.14"
  const DIV_Y     = IMG_BOT + 0.06;         // ornamental divider top = 3.20"
  const NAME_Y    = DIV_Y + 0.22;           // product name = 3.42"
  const PRICE_Y   = NAME_Y + 0.34;          // price        = 3.76"
  const SPEC_Y0   = PRICE_Y + 0.28;         // first spec   = 4.04"

  // Column centres and text start positions
  const L_CX  = CX / 2;         // left column centre  = 2.5"
  const R_CX  = CX + CX / 2;    // right column centre = 7.5"
  const L_TX  = 0.22;            // left text/image left edge
  const R_TX  = CX + 0.22;      // right text/image left edge
  const COL_W = CX - 0.3;       // usable column width = 4.7"

  // Image frame left edges (centred in column)
  const L_IMG_X = L_CX - IMG_W / 2;   // ≈ 0.725"
  const R_IMG_X = R_CX - IMG_W / 2;   // ≈ 5.725"

  /**
   * Draw the decorative slide frame:
   *  • outer gold rectangle border
   *  • L-bracket corner ornaments
   *  • centre vertical divider + top & middle ornaments
   */
  const drawSlideFrame = (slide) => {
    const bm = BORDER_M;
    const bw = SH - 2 * bm;
    const bl = SW - 2 * bm;

    // ── Outer gold border ──────────────────────────────────────────────
    slide.addShape(pres.ShapeType.rect, {
      x: bm, y: bm, w: bl, h: bw,
      fill: { type: 'none' },
      line: { color: gold, width: 1.2, dashType: 'solid' }
    });

    // ── Corner L-brackets (4 corners × 2 lines each) ──────────────────
    const cL = 0.42;  // bracket arm length
    const cT = 1.5;   // line thickness (pts)
    const co = bm;    // corner origin offset

    // Top-left
    slide.addShape(pres.ShapeType.line, { x: co, y: co,      w: cL, h: 0,  line: { color: gold, width: cT } });
    slide.addShape(pres.ShapeType.line, { x: co, y: co,      w: 0,  h: cL, line: { color: gold, width: cT } });
    // Top-right
    slide.addShape(pres.ShapeType.line, { x: SW-co-cL, y: co,      w: cL, h: 0,  line: { color: gold, width: cT } });
    slide.addShape(pres.ShapeType.line, { x: SW-co,   y: co,      w: 0,  h: cL, line: { color: gold, width: cT } });
    // Bottom-left
    slide.addShape(pres.ShapeType.line, { x: co,      y: SH-co,   w: cL, h: 0,  line: { color: gold, width: cT } });
    slide.addShape(pres.ShapeType.line, { x: co,      y: SH-co-cL, w: 0, h: cL, line: { color: gold, width: cT } });
    // Bottom-right
    slide.addShape(pres.ShapeType.line, { x: SW-co-cL, y: SH-co,   w: cL, h: 0,  line: { color: gold, width: cT } });
    slide.addShape(pres.ShapeType.line, { x: SW-co,   y: SH-co-cL, w: 0, h: cL, line: { color: gold, width: cT } });

    // ── Centre vertical divider ────────────────────────────────────────
    const vGap = 0.28;   // gap from border edge
    slide.addShape(pres.ShapeType.line, {
      x: CX, y: bm + vGap, w: 0, h: bw - 2 * vGap,
      line: { color: gold, width: 0.8 }
    });

    // Top ornament on divider (fleur)
    slide.addText('❧', {
      x: CX - 0.22, y: bm + vGap - 0.16, w: 0.44, h: 0.22,
      align: 'center', fontSize: 10, color: gold, fontFace: 'Arial', bold: false
    });

    // Middle ornament on divider
    slide.addText('❖', {
      x: CX - 0.2, y: SH / 2 - 0.13, w: 0.4, h: 0.26,
      align: 'center', fontSize: 11, color: gold, fontFace: 'Arial', bold: false
    });
  };

  /**
   * Draw the horizontal ornamental divider below a product image.
   * centreX = horizontal centre of the product column.
   */
  const drawImageDivider = (slide, centreX) => {
    const armW  = 1.35;   // length of each arm
    const gapH  = 0.13;   // ornament half-width
    const lineY = DIV_Y + 0.09;

    // Left arm
    slide.addShape(pres.ShapeType.line, {
      x: centreX - gapH - armW, y: lineY, w: armW, h: 0,
      line: { color: gold, width: 0.7 }
    });
    // Right arm
    slide.addShape(pres.ShapeType.line, {
      x: centreX + gapH, y: lineY, w: armW, h: 0,
      line: { color: gold, width: 0.7 }
    });
    // Central ornament
    slide.addText('✿', {
      x: centreX - gapH - 0.02, y: DIV_Y, w: gapH * 2 + 0.04, h: 0.2,
      align: 'center', fontSize: 8, color: gold, fontFace: 'Arial'
    });
  };

  for (let idx = 0; idx < products.length; idx += 2) {
    const p1 = products[idx];
    const p2 = products[idx + 1];

    // Plain navy background — all decoration drawn programmatically
    const slide = pres.addSlide({ masterName: 'MASTER_DARK' });

    // Draw the premium border + centre divider
    drawSlideFrame(slide);

    // ── Helper: contain-fit image into a box ───────────────────────────
    const drawImg = async (url, boxX, boxY, boxW, boxH) => {
      const imgObj = await fetchImageWithDimensions(url);
      if (!imgObj) throw new Error('Image failed');

      const ratio  = imgObj.width / imgObj.height;
      const bRatio = boxW / boxH;
      let renderW, renderH;
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

    // ── Draw a single product column ───────────────────────────────────
    const drawProduct = async (product, imgFrameX, colCentreX, textX) => {
      if (!product) return;
      try {
        // 1. Navy background inside image frame (letterbox colour)
        slide.addShape(pres.ShapeType.rect, {
          x: imgFrameX, y: IMG_Y, w: IMG_W, h: IMG_H,
          fill: { color: navy },
          line: { type: 'none' }
        });

        // 2. Product image (contain-fit)
        let allImages = [];
        if (product.imageUrl) allImages.push(product.imageUrl);
        if (product.images && Array.isArray(product.images)) allImages.push(...product.images);
        allImages = [...new Set(allImages)];

        if (allImages.length > 0) {
          try {
            if (allImages.length === 1) {
              await drawImg(allImages[0], imgFrameX, IMG_Y, IMG_W, IMG_H);
            } else if (allImages.length === 2) {
              const hw = IMG_W / 2 - 0.03;
              await drawImg(allImages[0], imgFrameX,          IMG_Y, hw, IMG_H);
              await drawImg(allImages[1], imgFrameX + hw + 0.06, IMG_Y, hw, IMG_H);
            } else {
              const hw = IMG_W / 2 - 0.03;
              const hh = IMG_H / 2 - 0.03;
              await drawImg(allImages[0], imgFrameX,             IMG_Y,          hw, hh);
              await drawImg(allImages[1], imgFrameX + hw + 0.06, IMG_Y,          hw, hh);
              await drawImg(allImages[2], imgFrameX,             IMG_Y + hh + 0.06, hw, hh);
              if (allImages[3]) await drawImg(allImages[3], imgFrameX + hw + 0.06, IMG_Y + hh + 0.06, hw, hh);
            }
          } catch {
            slide.addText('[Image Unavailable]', {
              x: imgFrameX, y: IMG_Y + IMG_H / 2 - 0.15, w: IMG_W, h: 0.3,
              fontSize: 9, align: 'center', color: '94A3B8'
            });
          }
        }


        // 4. Decorative ornamental divider below image
        drawImageDivider(slide, colCentreX);

        // 5. Product name
        slide.addText(product.name, {
          x: textX, y: NAME_Y, w: COL_W, h: 0.32,
          fontSize: 16, color: white, fontFace: 'Georgia', bold: true, valign: 'middle'
        });

        // 6. Price
        slide.addText(formatPrice(product.price), {
          x: textX, y: PRICE_Y, w: COL_W, h: 0.25,
          fontSize: 13, color: gold, fontFace: 'Georgia', bold: true
        });

        // 7. Specs
        let specY = SPEC_Y0;
        const addSpec = (label, value) => {
          if (!value || value === '—') return;
          slide.addText([
            { text: label.toUpperCase() + ':  ', options: { color: gold, fontSize: 9, bold: true, fontFace: 'Arial' } },
            { text: value,                       options: { color: textBody, fontSize: 9, fontFace: 'Arial' } }
          ], { x: textX, y: specY, w: COL_W, h: 0.19, valign: 'middle' });
          specY += 0.21;
        };

        addSpec('Size',     product.size);
        addSpec('Category', product.category);
        addSpec('Material', product.materials && product.materials.length > 0
          ? product.materials.join(', ')
          : product.material);

      } catch (err) {
        console.error(`PPT product draw failed for ${product.id}`, err);
      }
    };

    // Left product
    await drawProduct(p1, L_IMG_X, L_CX, L_TX);

    // Right product
    if (p2) await drawProduct(p2, R_IMG_X, R_CX, R_TX);
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
