// 港居不動產 - 照片時間與地點浮水印工具 核心邏輯
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Cache
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const previewCanvas = document.getElementById('preview-canvas');
  const emptyCanvasNotice = document.getElementById('empty-canvas-notice');
  const thumbStripWrapper = document.getElementById('thumb-strip-wrapper');
  const thumbStrip = document.getElementById('thumb-strip');

  // Input Controls
  const inputLocation = document.getElementById('input-location');
  const dateSourceSelect = document.getElementById('date-source-select');
  const customDatePickerGroup = document.getElementById('custom-date-picker-group');
  const customDateInput = document.getElementById('custom-date-input');
  const dateFormatSelect = document.getElementById('date-format-select');

  // Style & Position Controls
  const presetCards = document.querySelectorAll('.preset-card');
  const positionSelect = document.getElementById('position-select');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeVal = document.getElementById('font-size-val');
  const marginSlider = document.getElementById('margin-slider');
  const marginVal = document.getElementById('margin-val');
  const opacitySlider = document.getElementById('opacity-slider');
  const opacityVal = document.getElementById('opacity-val');
  const colorPickerText = document.getElementById('color-picker-text');
  const colorPickerBg = document.getElementById('color-picker-bg');

  // Buttons
  const btnDownloadSingle = document.getElementById('btn-download-single');
  const btnDownloadZip = document.getElementById('btn-download-zip');
  const chipBtns = document.querySelectorAll('.chip-btn');

  // App State
  let imageList = []; // { file, img, name, exifDate, exifGps, active }
  let activeIndex = 0;
  let currentPresetStyle = 'badge'; // 'badge', 'stamp', 'minimalist'

  // 1. File Upload Handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(Array.from(e.target.files));
      }
    });
  }

  async function handleFiles(files) {
    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, 20);
    if (validFiles.length === 0) {
      showToast('❌ 請上傳格式正確的照片檔案 (JPG / PNG / WEBP)');
      return;
    }

    showToast(`📸 正在讀取 ${validFiles.length} 張照片 EXIF 與 GPS...`);

    for (let file of validFiles) {
      const { exifDate, exifGps } = await parseExifData(file);
      const img = await loadImageFromFile(file);

      imageList.push({
        file,
        img,
        name: file.name,
        exifDate: exifDate || new Date(file.lastModified),
        exifGps: exifGps || '',
        id: Date.now() + Math.random().toString(36).substr(2, 9)
      });
    }

    if (imageList.length > 0) {
      activeIndex = imageList.length - validFiles.length; // Active first newly uploaded
      renderThumbnails();
      updateControlsFromActive();
      renderCanvas();
      showToast('✨ 照片已讀取完成！');
    }
  }

  // EXIF Reader parser
  async function parseExifData(file) {
    let exifDate = null;
    let exifGps = '';

    if (window.ExifReader) {
      try {
        const tags = await ExifReader.load(file);
        if (tags.DateTimeOriginal && tags.DateTimeOriginal.description) {
          // Format "2026:08:06 17:14:02" -> "2026-08-06T17:14:02"
          const dateStr = tags.DateTimeOriginal.description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3T');
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            exifDate = parsed;
          }
        }

        if (tags.GPSLatitude && tags.GPSLongitude) {
          const lat = parseFloat(tags.GPSLatitude.description).toFixed(4);
          const lng = parseFloat(tags.GPSLongitude.description).toFixed(4);
          exifGps = `${lat}°N, ${lng}°E`;
        }
      } catch (err) {
        console.warn('EXIF Read Warning:', err);
      }
    }
    return { exifDate, exifGps };
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 2. Control State Update
  function updateControlsFromActive() {
    if (imageList.length === 0 || activeIndex < 0) return;
    const current = imageList[activeIndex];

    // Set default location text if empty
    if (!inputLocation.value) {
      if (current.exifGps) {
        inputLocation.value = `GPS 定位: ${current.exifGps}`;
      } else {
        inputLocation.value = '高雄市小港區物業巡檢';
      }
    }

    // Set default custom date
    const d = current.exifDate || new Date();
    const formatLocal = (date) => {
      const pad = n => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    customDateInput.value = formatLocal(d);
  }

  // Event Listeners for Controls
  inputLocation.addEventListener('input', renderCanvas);
  
  dateSourceSelect.addEventListener('change', () => {
    if (dateSourceSelect.value === 'custom') {
      customDatePickerGroup.style.display = 'block';
    } else {
      customDatePickerGroup.style.display = 'none';
    }
    renderCanvas();
  });

  customDateInput.addEventListener('input', renderCanvas);
  dateFormatSelect.addEventListener('change', renderCanvas);
  positionSelect.addEventListener('change', renderCanvas);

  fontSizeSlider.addEventListener('input', (e) => {
    fontSizeVal.innerText = `${e.target.value}%`;
    renderCanvas();
  });

  marginSlider.addEventListener('input', (e) => {
    marginVal.innerText = `${e.target.value}px`;
    renderCanvas();
  });

  opacitySlider.addEventListener('input', (e) => {
    opacityVal.innerText = `${e.target.value}%`;
    renderCanvas();
  });

  colorPickerText.addEventListener('input', renderCanvas);
  colorPickerBg.addEventListener('input', renderCanvas);

  // Preset Cards click
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentPresetStyle = card.getAttribute('data-preset');
      renderCanvas();
    });
  });

  // Location Chips click
  chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      chipBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const region = btn.getAttribute('data-region');
      if (region) {
        inputLocation.value = `高雄市${region}物業巡檢`;
        renderCanvas();
      }
    });
  });

  // 3. Canvas Render Logic
  function renderCanvas() {
    if (imageList.length === 0 || activeIndex < 0) {
      previewCanvas.style.display = 'none';
      emptyCanvasNotice.style.display = 'block';
      thumbStripWrapper.style.display = 'none';
      return;
    }

    previewCanvas.style.display = 'block';
    emptyCanvasNotice.style.display = 'none';
    thumbStripWrapper.style.display = 'block';

    const currentItem = imageList[activeIndex];
    const img = currentItem.img;
    const ctx = previewCanvas.getContext('2d');

    previewCanvas.width = img.naturalWidth || img.width;
    previewCanvas.height = img.naturalHeight || img.height;

    // Draw background image
    ctx.drawImage(img, 0, 0);

    // Prepare Date string
    let displayDate = new Date();
    if (dateSourceSelect.value === 'exif' && currentItem.exifDate) {
      displayDate = currentItem.exifDate;
    } else if (dateSourceSelect.value === 'custom' && customDateInput.value) {
      displayDate = new Date(customDateInput.value);
    } else if (currentItem.file) {
      displayDate = new Date(currentItem.file.lastModified);
    }

    const dateFormatted = formatDateTime(displayDate, dateFormatSelect.value);
    const locationText = inputLocation.value.trim();

    // Scale calculations
    const baseScale = previewCanvas.width / 1200; // Normalizing scale
    const fontSizeMultiplier = parseFloat(fontSizeSlider.value) / 100;
    const fontSize = Math.max(16, Math.round(28 * baseScale * fontSizeMultiplier));
    const subFontSize = Math.max(12, Math.round(20 * baseScale * fontSizeMultiplier));
    const margin = Math.round(parseFloat(marginSlider.value) * baseScale);
    const opacity = parseFloat(opacitySlider.value) / 100;

    const pos = positionSelect.value;
    const textColor = colorPickerText.value;
    const bgColor = colorPickerBg.value;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (currentPresetStyle === 'badge') {
      drawBadgeStyle(ctx, previewCanvas, dateFormatted, locationText, pos, fontSize, subFontSize, margin, textColor, bgColor);
    } else if (currentPresetStyle === 'stamp') {
      drawStampStyle(ctx, previewCanvas, dateFormatted, locationText, pos, fontSize, margin);
    } else if (currentPresetStyle === 'minimalist') {
      drawMinimalistStyle(ctx, previewCanvas, dateFormatted, locationText, pos, fontSize, subFontSize, margin, textColor);
    }

    ctx.restore();
  }

  // Date Formatting Helper
  function formatDateTime(date, format) {
    const pad = n => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const yy = yyyy.toString().slice(-2);

    switch (format) {
      case 'YYYY-MM-DD HH:mm:ss': return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
      case 'YYYY.MM.DD HH:mm': return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
      case 'YYYY年MM月DD日 HH:mm': return `${yyyy}年${mm}月${dd}日 ${hh}:${min}`;
      case "'YY MM DD HH:mm": return `'${yy} ${mm} ${dd} ${hh}:${min}`;
      default: return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }
  }

  // Draw Style 1: Gangju Badge (Navy & Gold Pill Card)
  function drawBadgeStyle(ctx, canvas, dateStr, locationStr, pos, fontSize, subFontSize, margin, textColor, bgColor) {
    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
    
    const line1 = locationStr ? `📍 ${locationStr}` : '';
    const line2 = dateStr ? `🕒 ${dateStr}` : '';

    const width1 = line1 ? ctx.measureText(line1).width : 0;
    ctx.font = `${subFontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
    const width2 = line2 ? ctx.measureText(line2).width : 0;

    const boxWidth = Math.max(width1, width2) + fontSize * 1.5;
    const boxHeight = (line1 && line2 ? fontSize + subFontSize + 24 : fontSize + 20);

    let x = margin;
    let y = margin;

    if (pos.includes('right')) x = canvas.width - boxWidth - margin;
    if (pos.includes('center')) x = (canvas.width - boxWidth) / 2;
    if (pos.includes('bottom')) y = canvas.height - boxHeight - margin;
    if (pos === 'bottom-banner') {
      x = 0;
      y = canvas.height - boxHeight - 20;
    }

    // Draw Card Background
    ctx.fillStyle = bgColor || '#0F2341';
    ctx.beginPath();
    ctx.roundRect(x, y, pos === 'bottom-banner' ? canvas.width : boxWidth, boxHeight, 12);
    ctx.fill();

    // Draw Gold Border
    ctx.strokeStyle = textColor || '#C5A059';
    ctx.lineWidth = Math.max(2, fontSize * 0.08);
    ctx.stroke();

    // Draw Text
    let textY = y + fontSize + 6;
    if (line1) {
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
      ctx.fillStyle = textColor || '#C5A059';
      ctx.fillText(line1, x + fontSize * 0.75, textY);
      textY += subFontSize + 10;
    }

    if (line2) {
      ctx.font = `${subFontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line2, x + fontSize * 0.75, textY);
    }
  }

  // Draw Style 2: Vintage Orange Film Stamp
  function drawStampStyle(ctx, canvas, dateStr, locationStr, pos, fontSize, margin) {
    const stampText = `${dateStr}  ${locationStr}`;
    ctx.font = `bold ${fontSize * 1.1}px "Share Tech Mono", monospace, sans-serif`;

    const textWidth = ctx.measureText(stampText).width;
    let x = margin;
    let y = margin + fontSize;

    if (pos.includes('right')) x = canvas.width - textWidth - margin;
    if (pos.includes('center')) x = (canvas.width - textWidth) / 2;
    if (pos.includes('bottom')) y = canvas.height - margin;

    // Glowing Orange/Red Digital Stamp Effect
    ctx.shadowColor = 'rgba(255, 102, 0, 0.8)';
    ctx.shadowBlur = Math.max(4, fontSize * 0.2);
    ctx.fillStyle = '#FF6600';
    ctx.fillText(stampText, x, y);

    ctx.shadowBlur = 0; // reset
  }

  // Draw Style 3: Minimalist Overlay Text
  function drawMinimalistStyle(ctx, canvas, dateStr, locationStr, pos, fontSize, subFontSize, margin, textColor) {
    const line1 = locationStr;
    const line2 = dateStr;

    ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
    const width1 = line1 ? ctx.measureText(line1).width : 0;
    ctx.font = `${subFontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
    const width2 = line2 ? ctx.measureText(line2).width : 0;

    const maxWidth = Math.max(width1, width2);
    let x = margin;
    let y = margin + fontSize;

    if (pos.includes('right')) x = canvas.width - maxWidth - margin;
    if (pos.includes('center')) x = (canvas.width - maxWidth) / 2;
    if (pos.includes('bottom')) y = canvas.height - margin - (line2 ? subFontSize + 10 : 0);

    // Text Shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.max(6, fontSize * 0.25);

    if (line1) {
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
      ctx.fillStyle = textColor || '#FFFFFF';
      ctx.fillText(line1, x, y);
      y += subFontSize + 8;
    }

    if (line2) {
      ctx.font = `${subFontSize}px "Plus Jakarta Sans", "Noto Sans TC", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(line2, x, y);
    }

    ctx.shadowBlur = 0;
  }

  // 4. Render Thumbnail Strip for Batch Photos
  function renderThumbnails() {
    thumbStrip.innerHTML = '';
    imageList.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = `thumb-item ${index === activeIndex ? 'active' : ''}`;
      div.innerHTML = `
        <img src="${item.img.src}" alt="${item.name}">
        <button class="thumb-remove-btn" data-index="${index}">&times;</button>
      `;

      div.addEventListener('click', (e) => {
        if (e.target.classList.contains('thumb-remove-btn')) {
          e.stopPropagation();
          imageList.splice(index, 1);
          if (activeIndex >= imageList.length) activeIndex = imageList.length - 1;
          renderThumbnails();
          renderCanvas();
        } else {
          activeIndex = index;
          renderThumbnails();
          updateControlsFromActive();
          renderCanvas();
        }
      });

      thumbStrip.appendChild(div);
    });
  }

  // 5. Download Handlers
  if (btnDownloadSingle) {
    btnDownloadSingle.addEventListener('click', () => {
      if (imageList.length === 0) {
        showToast('❌ 請先上傳照片！');
        return;
      }

      const link = document.createElement('a');
      const current = imageList[activeIndex];
      const origName = current.name.substring(0, current.name.lastIndexOf('.')) || 'photo';
      link.download = `${origName}_stamped.jpg`;
      link.href = previewCanvas.toDataURL('image/jpeg', 0.95);
      link.click();
      showToast('🎉 單張照片已成功下載！');
    });
  }

  if (btnDownloadZip) {
    btnDownloadZip.addEventListener('click', async () => {
      if (imageList.length === 0) {
        showToast('❌ 請先上傳照片！');
        return;
      }

      if (!window.JSZip) {
        showToast('❌ JSZip 模組讀取失敗，請重新整理頁面');
        return;
      }

      showToast(`📦 正在批次合成並打包 ${imageList.length} 張照片...`);
      const zip = new JSZip();

      // Temporarily store active Index
      const tempIndex = activeIndex;

      for (let i = 0; i < imageList.length; i++) {
        activeIndex = i;
        renderCanvas();
        
        const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.92);
        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        const current = imageList[i];
        const origName = current.name.substring(0, current.name.lastIndexOf('.')) || `photo_${i+1}`;

        zip.file(`${origName}_stamped.jpg`, base64Data, { base64: true });
      }

      // Restore active Index
      activeIndex = tempIndex;
      renderCanvas();

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `ganggo_photos_stamped_${Date.now()}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      showToast('🎉 ZIP 壓縮檔已成功下載！');
    });
  }
});
