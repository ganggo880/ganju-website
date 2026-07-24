/**
 * Watermark Engine Module
 * Canvas rendering engine for high-resolution photo stamps & EXIF overlays
 */
class WatermarkEngine {
  /**
   * Render watermark onto image canvas
   * @param {HTMLImageElement} img - Image element to render
   * @param {Object} exifData - Parsed EXIF data from ExifParser
   * @param {Object} options - Configuration options
   * @returns {HTMLCanvasElement} Rendered canvas
   */
  static render(img, exifData, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 1. Set canvas size to original image full resolution
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;

    // 2. Draw original photo onto canvas
    ctx.drawImage(img, 0, 0, width, height);

    // 3. Prepare formatted data strings
    const formattedDate = this.getFormattedDate(exifData, options);
    const cameraText = this.getCameraText(exifData, options);
    const exifParamsText = this.getExifParamsText(exifData, options);

    // Baseline scale factor relative to photo dimensions (using min dimension as base)
    const baseScale = Math.min(width, height) / 1000;
    const fontScale = (options.fontSizeScale / 100) * baseScale;
    const margin = options.margin * baseScale;
    const opacity = options.opacity;

    // Save context state before applying transparency/transforms
    ctx.save();
    ctx.globalAlpha = opacity;

    // 4. Render based on selected style preset
    switch (options.style) {
      case 'film-stamp':
        this.renderFilmStamp(ctx, width, height, formattedDate, cameraText, exifParamsText, options, fontScale, margin);
        break;

      case 'elegant-signature':
        this.renderElegantSignature(ctx, width, height, formattedDate, cameraText, exifParamsText, options, fontScale, margin);
        break;

      case 'property-badge':
        this.renderPropertyBadge(ctx, width, height, formattedDate, cameraText, exifParamsText, options, fontScale, margin);
        break;

      default:
        this.renderFilmStamp(ctx, width, height, formattedDate, cameraText, exifParamsText, options, fontScale, margin);
    }

    ctx.restore();
    return canvas;
  }

  /**
   * Helper to format date string based on options
   */
  static getFormattedDate(exifData, options) {
    if (!options.showDate) return '';

    let dateObj = null;

    if (options.dateSource === 'custom' && options.customDate) {
      dateObj = new Date(options.customDate);
    } else if (options.dateSource === 'file') {
      dateObj = exifData.fileLastModified ? new Date(exifData.fileLastModified) : (exifData.dateTaken || new Date());
    } else {
      // Default: EXIF date taken or fallback
      dateObj = exifData.dateTaken || new Date();
    }

    return ExifParser.formatDate(dateObj, options.dateFormat);
  }

  /**
   * Helper to format Camera & Lens string
   */
  static getCameraText(exifData, options) {
    if (!options.showCamera) return '';
    const parts = [];
    if (exifData.cameraMake || exifData.cameraModel) {
      parts.push(`${exifData.cameraMake} ${exifData.cameraModel}`.trim());
    }
    if (exifData.lensModel) {
      parts.push(exifData.lensModel);
    }
    return parts.join(' ');
  }

  /**
   * Helper to format Exposure Parameters (Aperture, Shutter, ISO)
   */
  static getExifParamsText(exifData, options) {
    if (!options.showExifParams) return '';
    const parts = [];
    if (exifData.focalLength) parts.push(exifData.focalLength);
    if (exifData.aperture) parts.push(exifData.aperture);
    if (exifData.shutterSpeed) parts.push(exifData.shutterSpeed);
    if (exifData.iso) parts.push(exifData.iso);
    return parts.join('  ');
  }

  /**
   * Style 1: Retro Film Date Stamp (經典底片橘黃戳記)
   */
  static renderFilmStamp(ctx, width, height, dateStr, cameraText, exifParamsText, options, fontScale, margin) {
    const fontSizeMain = Math.round(36 * fontScale);
    const fontSizeSub = Math.round(18 * fontScale);
    const fontFamily = options.fontFamily || "'Share Tech Mono', monospace";
    const textColor = options.textColor || '#ff9800';

    ctx.font = `bold ${fontSizeMain}px ${fontFamily}`;
    
    // Prepare lines to render
    const lines = [];
    if (dateStr) lines.push(dateStr);
    if (options.showText && options.customTextMain) lines.push(options.customTextMain);
    if (cameraText || exifParamsText) {
      const infoStr = [cameraText, exifParamsText].filter(Boolean).join(' | ');
      if (infoStr) lines.push(infoStr);
    }

    if (lines.length === 0) return;

    // Calculate dimensions
    ctx.font = `bold ${fontSizeMain}px ${fontFamily}`;
    let maxWidth = 0;
    lines.forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxWidth) maxWidth = w;
    });

    const lineHeight = fontSizeMain * 1.25;
    const totalHeight = lines.length * lineHeight;

    // Calculate positioning
    const pos = this.calculatePosition(options.position, width, height, maxWidth, totalHeight, margin);

    // Apply retro LED glowing text shadow
    ctx.shadowColor = textColor;
    ctx.shadowBlur = 8 * fontScale;
    ctx.fillStyle = textColor;
    ctx.textAlign = pos.textAlign;
    ctx.textBaseline = 'top';

    lines.forEach((line, index) => {
      const y = pos.y + (index * lineHeight);
      if (index === 0) {
        ctx.font = `bold ${fontSizeMain}px ${fontFamily}`;
      } else {
        ctx.font = `bold ${fontSizeSub}px ${fontFamily}`;
      }
      ctx.fillText(line, pos.x, y);
    });

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  /**
   * Style 2: Elegant Signature & Corner Watermark (優雅角落浮水印)
   */
  static renderElegantSignature(ctx, width, height, dateStr, cameraText, exifParamsText, options, fontScale, margin) {
    const fontSizeMain = Math.round(26 * fontScale);
    const fontSizeSub = Math.round(16 * fontScale);
    const fontFamily = options.fontFamily || "'Inter', sans-serif";
    const textColor = options.textColor || '#ffffff';
    const bgColor = options.bgColor || '#000000';

    // Combine main row & sub row
    const row1Parts = [];
    if (options.showText && options.customTextMain) row1Parts.push(options.customTextMain);
    if (dateStr) row1Parts.push(dateStr);
    const row1 = row1Parts.join('  ✦  ');

    const row2Parts = [];
    if (options.showText && options.customTextSub) row2Parts.push(options.customTextSub);
    if (cameraText) row2Parts.push(cameraText);
    if (exifParamsText) row2Parts.push(exifParamsText);
    const row2 = row2Parts.join('  |  ');

    const lines = [row1, row2].filter(Boolean);
    if (lines.length === 0) return;

    ctx.font = `500 ${fontSizeMain}px ${fontFamily}`;
    let maxWidth = 0;
    lines.forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxWidth) maxWidth = w;
    });

    const lineHeight = fontSizeMain * 1.35;
    const totalHeight = lines.length * lineHeight;

    const pos = this.calculatePosition(options.position, width, height, maxWidth, totalHeight, margin);

    // Draw subtle backdrop pill/rect for extreme readability
    const paddingX = 16 * fontScale;
    const paddingY = 12 * fontScale;
    const rectX = pos.alignLeft ? (pos.x - paddingX) : (pos.x - maxWidth - paddingX);
    const rectY = pos.y - paddingY;
    const rectW = maxWidth + (paddingX * 2);
    const rectH = totalHeight + (paddingY * 2);

    ctx.fillStyle = this.hexToRgba(bgColor, 0.45);
    this.roundRect(ctx, rectX, rectY, rectW, rectH, 8 * fontScale, true, false);

    // Draw Text with soft shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4 * fontScale;
    ctx.fillStyle = textColor;
    ctx.textAlign = pos.textAlign;
    ctx.textBaseline = 'top';

    lines.forEach((line, idx) => {
      ctx.font = idx === 0 ? `600 ${fontSizeMain}px ${fontFamily}` : `400 ${fontSizeSub}px ${fontFamily}`;
      ctx.fillText(line, pos.x, pos.y + (idx * lineHeight));
    });

    ctx.shadowBlur = 0;
  }

  /**
   * Style 3: Property Inspection Badge (物業巡檢紀錄標籤)
   */
  static renderPropertyBadge(ctx, width, height, dateStr, cameraText, exifParamsText, options, fontScale, margin) {
    const fontSizeTitle = Math.round(24 * fontScale);
    const fontSizeBody = Math.round(16 * fontScale);
    const fontFamily = options.fontFamily || "'Noto Sans TC', sans-serif";
    const accentColor = options.textColor || '#C5A059'; // Gangju Gold
    const bgColor = options.bgColor || '#0F2341'; // Gangju Navy

    const titleText = (options.showText && options.customTextMain) ? options.customTextMain : '物業巡檢紀錄';
    const subText = (options.showText && options.customTextSub) ? options.customTextSub : '';
    const dateLine = dateStr ? `拍攝時間：${dateStr}` : '';
    const infoLine = [cameraText, exifParamsText].filter(Boolean).join('  ');

    const lines = [titleText, subText, dateLine, infoLine].filter(Boolean);
    if (lines.length === 0) return;

    ctx.font = `bold ${fontSizeTitle}px ${fontFamily}`;
    let maxWidth = ctx.measureText(titleText).width;
    ctx.font = `400 ${fontSizeBody}px ${fontFamily}`;
    lines.slice(1).forEach(l => {
      const w = ctx.measureText(l).width;
      if (w > maxWidth) maxWidth = w;
    });

    const paddingX = 20 * fontScale;
    const paddingY = 16 * fontScale;
    const accentBarWidth = 6 * fontScale;

    const lineHeight = fontSizeBody * 1.5;
    const totalContentHeight = fontSizeTitle + (lines.length - 1) * lineHeight + 8 * fontScale;

    const totalBadgeWidth = maxWidth + paddingX * 2 + accentBarWidth;
    const totalBadgeHeight = totalContentHeight + paddingY * 2;

    const pos = this.calculatePosition(options.position, width, height, totalBadgeWidth, totalBadgeHeight, margin);

    const badgeX = pos.alignLeft ? pos.x : pos.x - totalBadgeWidth;
    const badgeY = pos.y;

    // Draw Dark Card Container
    ctx.fillStyle = this.hexToRgba(bgColor, 0.85);
    this.roundRect(ctx, badgeX, badgeY, totalBadgeWidth, totalBadgeHeight, 10 * fontScale, true, false);

    // Draw Accent Left Bar
    ctx.fillStyle = accentColor;
    this.roundRect(ctx, badgeX, badgeY, accentBarWidth, totalBadgeHeight, { tl: 10 * fontScale, bl: 10 * fontScale, tr: 0, br: 0 }, true, false);

    // Draw Text Content
    let currY = badgeY + paddingY;
    const textStartX = badgeX + accentBarWidth + paddingX;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // 1. Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${fontSizeTitle}px ${fontFamily}`;
    ctx.fillText(titleText, textStartX, currY);
    currY += fontSizeTitle + 8 * fontScale;

    // 2. Remaining Lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `400 ${fontSizeBody}px ${fontFamily}`;

    if (subText) {
      ctx.fillText(subText, textStartX, currY);
      currY += lineHeight;
    }
    if (dateLine) {
      ctx.fillStyle = '#f59e0b'; // Amber highlight for date
      ctx.fillText(dateLine, textStartX, currY);
      currY += lineHeight;
    }
    if (infoLine) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.fillText(infoLine, textStartX, currY);
    }
  }

  /**
   * Positioning helper
   */
  static calculatePosition(position, width, height, contentWidth, contentHeight, margin) {
    let x = margin;
    let y = margin;
    let textAlign = 'left';
    let alignLeft = true;

    switch (position) {
      case 'bottom-right':
        x = width - margin;
        y = height - margin - contentHeight;
        textAlign = 'right';
        alignLeft = false;
        break;

      case 'bottom-left':
        x = margin;
        y = height - margin - contentHeight;
        textAlign = 'left';
        alignLeft = true;
        break;

      case 'top-right':
        x = width - margin;
        y = margin;
        textAlign = 'right';
        alignLeft = false;
        break;

      case 'top-left':
        x = margin;
        y = margin;
        textAlign = 'left';
        alignLeft = true;
        break;

      case 'bottom-center':
        x = width / 2;
        y = height - margin - contentHeight;
        textAlign = 'center';
        alignLeft = true;
        break;
    }

    return { x, y, textAlign, alignLeft };
  }

  /**
   * Canvas Rounded Rectangle Utility
   */
  static roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof radius === 'number') {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  /**
   * Helper to convert Hex color to RGBA string
   */
  static hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(0, 0, 0, ${alpha})`;
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
}

window.WatermarkEngine = WatermarkEngine;
