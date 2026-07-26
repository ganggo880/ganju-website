/**
 * 港居不動產 - 圖像格式與尺寸轉換神器
 * Image Format & Size Converter Engine
 */

import { showToast } from './utils.js';

const MAX_IMAGES = 20;

// 全域 State
const state = {
  images: [], // 包含 id, file, name, originalSize, width, height, previewUrl, targetFormat, targetPreset, customW, customH, quality, status, convertedBlob, convertedUrl, convertedSize, convertedW, convertedH
  globalFormat: 'webp',
  globalPreset: 'original',
  globalQuality: 0.9,
  gridViewMode: 'view-medium'
};

// DOM 元素引用
let dropzone, fileInput, imageGrid, emptyState, imageCounter;
let globalFormatPills, globalSizePills, gridViewPills, qualityRange, qualityVal;
let convertAllBtn, downloadZipBtn, clearAllBtn;

document.addEventListener('DOMContentLoaded', () => {
  initDOM();
  bindEvents();
  render();
});

function initDOM() {
  dropzone = document.getElementById('dropzone');
  fileInput = document.getElementById('fileInput');
  imageGrid = document.getElementById('imageGrid');
  emptyState = document.getElementById('emptyState');
  imageCounter = document.getElementById('imageCounter');

  globalFormatPills = document.querySelectorAll('#formatPills .btn-pill');
  globalSizePills = document.querySelectorAll('#sizePills .btn-pill');
  gridViewPills = document.querySelectorAll('#gridViewPills .btn-pill');

  qualityRange = document.getElementById('qualityRange');
  qualityVal = document.getElementById('qualityVal');

  convertAllBtn = document.getElementById('convertAllBtn');
  downloadZipBtn = document.getElementById('downloadZipBtn');
  clearAllBtn = document.getElementById('clearAllBtn');
}

function bindEvents() {
  // 1. Dropzone 與 FileInput
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // 拖曳事件
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files) {
        handleFiles(dt.files);
      }
    });
  }

  // 2. 全域目標格式切換
  if (globalFormatPills) {
    globalFormatPills.forEach(pill => {
      pill.addEventListener('click', () => {
        globalFormatPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.globalFormat = pill.dataset.format;
        
        // 同步更動所有尚未轉換的圖片目標格式
        state.images.forEach(img => {
          img.targetFormat = state.globalFormat;
          img.status = 'idle';
          img.convertedBlob = null;
        });
        render();
      });
    });
  }

  // 3. 全域尺寸 Preset 切換
  if (globalSizePills) {
    globalSizePills.forEach(pill => {
      pill.addEventListener('click', () => {
        globalSizePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.globalPreset = pill.dataset.preset;

        state.images.forEach(img => {
          img.targetPreset = state.globalPreset;
          img.status = 'idle';
          img.convertedBlob = null;
        });
        render();
      });
    });
  }

  // 4. 卡片 Grid 預覽尺寸切換 (大/中/小)
  if (gridViewPills) {
    gridViewPills.forEach(pill => {
      pill.addEventListener('click', () => {
        gridViewPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.gridViewMode = pill.dataset.view;
        imageGrid.className = `image-grid ${state.gridViewMode}`;
      });
    });
  }

  // 5. 品質 Slider
  if (qualityRange && qualityVal) {
    qualityRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      qualityVal.textContent = `${val}%`;
      state.globalQuality = val / 100;
      state.images.forEach(img => {
        img.quality = state.globalQuality;
        img.status = 'idle';
        img.convertedBlob = null;
      });
      render();
    });
  }

  // 6. 批量按鈕
  if (convertAllBtn) convertAllBtn.addEventListener('click', convertAllImages);
  if (downloadZipBtn) downloadZipBtn.addEventListener('click', downloadAllZip);
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllImages);
}

/**
 * 處理使用者傳入的檔案（點擊或拖放）
 */
function handleFiles(files) {
  if (!files || files.length === 0) return;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp'];
  const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp'];

  let fileList = Array.from(files).filter(file => {
    const nameLower = file.name.toLowerCase();
    return validTypes.includes(file.type) || validExts.some(ext => nameLower.endsWith(ext));
  });

  if (fileList.length === 0) {
    showToast('請選擇有效的圖像檔案 (JPG, PNG, WEBP, GIF, SVG, BMP)', 'warning');
    return;
  }

  const currentCount = state.images.length;
  if (currentCount >= MAX_IMAGES) {
    showToast(`已達上限 ${MAX_IMAGES} 張圖片，無法再新增。`, 'error');
    return;
  }

  let addCount = fileList.length;
  if (currentCount + addCount > MAX_IMAGES) {
    fileList = fileList.slice(0, MAX_IMAGES - currentCount);
    showToast(`最多僅能處理 ${MAX_IMAGES} 張圖片，已自動為您載入前 ${fileList.length} 張。`, 'warning');
  } else {
    showToast(`成功新增 ${fileList.length} 張圖片`, 'success');
  }

  // 讀取每張圖的維度與預覽
  fileList.forEach(file => {
    const id = 'img_' + Math.random().toString(36).substr(2, 9);
    const previewUrl = URL.createObjectURL(file);

    const imgItem = {
      id,
      file,
      name: file.name,
      originalSize: file.size,
      width: 0,
      height: 0,
      previewUrl,
      targetFormat: state.globalFormat,
      targetPreset: state.globalPreset,
      customW: 0,
      customH: 0,
      quality: state.globalQuality,
      status: 'idle', // 'idle' | 'processing' | 'done' | 'error'
      convertedBlob: null,
      convertedUrl: null,
      convertedSize: 0,
      convertedW: 0,
      convertedH: 0,
      errorMessage: null
    };

    state.images.push(imgItem);

    // 載入尺寸
    const tempImg = new Image();
    tempImg.onload = () => {
      imgItem.width = tempImg.naturalWidth || tempImg.width || 800;
      imgItem.height = tempImg.naturalHeight || tempImg.height || 600;
      render();
    };
    tempImg.onerror = () => {
      imgItem.width = 800;
      imgItem.height = 600;
      render();
    };
    tempImg.src = previewUrl;
  });

  render();
  fileInput.value = '';
}

/**
 * 畫出主要 UI 畫面
 */
function render() {
  const count = state.images.length;
  if (imageCounter) {
    imageCounter.textContent = `${count} / ${MAX_IMAGES} 張`;
    if (count >= MAX_IMAGES) {
      imageCounter.classList.add('limit-reached');
    } else {
      imageCounter.classList.remove('limit-reached');
    }
  }

  if (count === 0) {
    emptyState.style.display = 'block';
    imageGrid.style.display = 'none';
    if (convertAllBtn) convertAllBtn.disabled = true;
    if (downloadZipBtn) downloadZipBtn.disabled = true;
    if (clearAllBtn) clearAllBtn.disabled = true;
    return;
  }

  emptyState.style.display = 'none';
  imageGrid.style.display = 'grid';
  imageGrid.className = `image-grid ${state.gridViewMode}`;

  if (convertAllBtn) convertAllBtn.disabled = false;
  if (clearAllBtn) clearAllBtn.disabled = false;

  const hasDone = state.images.some(img => img.status === 'done' && img.convertedBlob);
  if (downloadZipBtn) downloadZipBtn.disabled = !hasDone;

  imageGrid.innerHTML = '';

  state.images.forEach(img => {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.id = `card_${img.id}`;

    const sizeBadgeClass = img.convertedSize ? (img.convertedSize < img.originalSize ? 'reduced' : 'increased') : '';
    const ratioText = (img.convertedSize && img.originalSize)
      ? `${Math.round(((img.convertedSize - img.originalSize) / img.originalSize) * 100)}%`
      : '';

    card.innerHTML = `
      <div class="card-preview-box">
        <button class="card-remove-btn" title="刪除圖片" aria-label="刪除圖片" data-id="${img.id}">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <img src="${img.previewUrl}" alt="${img.name}" class="card-preview-img" loading="lazy">
        <span class="card-badge-orig">${img.width ? `${img.width}×${img.height}` : '載入中'}</span>
      </div>
      <div class="card-body">
        <div class="card-filename" title="${img.name}">${img.name}</div>
        <div class="card-info-row">
          <span>原始容量: ${formatBytes(img.originalSize)}</span>
          <span>${img.file.type.split('/')[1]?.toUpperCase() || 'IMG'}</span>
        </div>
        <div class="card-controls">
          <select class="card-select format-select" data-id="${img.id}">
            <option value="jpeg" ${img.targetFormat === 'jpeg' ? 'selected' : ''}>JPG (JPEG)</option>
            <option value="png" ${img.targetFormat === 'png' ? 'selected' : ''}>PNG</option>
            <option value="webp" ${img.targetFormat === 'webp' ? 'selected' : ''}>WEBP</option>
            <option value="gif" ${img.targetFormat === 'gif' ? 'selected' : ''}>GIF</option>
            <option value="svg" ${img.targetFormat === 'svg' ? 'selected' : ''}>SVG</option>
            <option value="bmp" ${img.targetFormat === 'bmp' ? 'selected' : ''}>BMP</option>
          </select>
          <select class="card-select preset-select" data-id="${img.id}">
            <option value="original" ${img.targetPreset === 'original' ? 'selected' : ''}>原尺寸 (100%)</option>
            <option value="large" ${img.targetPreset === 'large' ? 'selected' : ''}>大圖 (1920px)</option>
            <option value="medium" ${img.targetPreset === 'medium' ? 'selected' : ''}>中圖 (1280px)</option>
            <option value="small" ${img.targetPreset === 'small' ? 'selected' : ''}>小圖 (800px)</option>
          </select>
        </div>
        ${img.status === 'done' ? `
          <div class="card-result-box">
            <div class="card-result-row">
              <span>轉換容量: <strong>${formatBytes(img.convertedSize)}</strong></span>
              <span class="size-badge ${sizeBadgeClass}">${ratioText}</span>
            </div>
            <div class="card-result-row" style="font-size:0.78rem; color:var(--text-secondary);">
              <span>尺寸: ${img.convertedW} × ${img.convertedH}</span>
              <span>格式: ${img.targetFormat.toUpperCase()}</span>
            </div>
          </div>
          <a href="${img.convertedUrl}" download="${getConvertedFileName(img.name, img.targetFormat)}" class="btn btn-secondary card-action-btn" style="text-align:center; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
            <i class="fa-solid fa-download"></i> 下載圖片
          </a>
        ` : `
          <button class="btn btn-primary card-action-btn single-convert-btn" data-id="${img.id}" ${img.status === 'processing' ? 'disabled' : ''}>
            ${img.status === 'processing' ? '<i class="fa-solid fa-spinner fa-spin"></i> 轉換中...' : '<i class="fa-solid fa-rotate"></i> 開始轉換'}
          </button>
        `}
      </div>
    `;

    imageGrid.appendChild(card);
  });

  // 繫結卡片內動態事件
  imageGrid.querySelectorAll('.card-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      removeImage(id);
    });
  });

  imageGrid.querySelectorAll('.format-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const item = state.images.find(x => x.id === id);
      if (item) {
        item.targetFormat = e.target.value;
        item.status = 'idle';
        item.convertedBlob = null;
        render();
      }
    });
  });

  imageGrid.querySelectorAll('.preset-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const item = state.images.find(x => x.id === id);
      if (item) {
        item.targetPreset = e.target.value;
        item.status = 'idle';
        item.convertedBlob = null;
        render();
      }
    });
  });

  imageGrid.querySelectorAll('.single-convert-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      convertSingleImage(id);
    });
  });
}

/**
 * 刪除單張圖片
 */
function removeImage(id) {
  const idx = state.images.findIndex(x => x.id === id);
  if (idx !== -1) {
    const item = state.images[idx];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    state.images.splice(idx, 1);
    render();
    showToast('已移除圖片', 'info');
  }
}

/**
 * 清空所有圖片
 */
function clearAllImages() {
  state.images.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
  });
  state.images = [];
  render();
  showToast('已清空所有圖片', 'info');
}

/**
 * 計算目標尺寸 (大/中/小/原圖)
 */
function calculateTargetDimensions(w, h, preset) {
  if (!w || !h) return { targetW: 800, targetH: 600 };
  let maxDim = 0;
  if (preset === 'large') maxDim = 1920;
  else if (preset === 'medium') maxDim = 1280;
  else if (preset === 'small') maxDim = 800;

  if (maxDim === 0 || (w <= maxDim && h <= maxDim)) {
    return { targetW: w, targetH: h };
  }

  if (w >= h) {
    const targetW = maxDim;
    const targetH = Math.round((h * maxDim) / w);
    return { targetW, targetH };
  } else {
    const targetH = maxDim;
    const targetW = Math.round((w * maxDim) / h);
    return { targetW, targetH };
  }
}

/**
 * 單張轉檔核心
 */
async function convertSingleImage(id) {
  const item = state.images.find(x => x.id === id);
  if (!item) return;

  item.status = 'processing';
  render();

  try {
    const result = await processImageConversion(item);
    item.convertedBlob = result.blob;
    if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
    item.convertedUrl = URL.createObjectURL(result.blob);
    item.convertedSize = result.blob.size;
    item.convertedW = result.targetW;
    item.convertedH = result.targetH;
    item.status = 'done';
    showToast(`《${item.name}》轉換成功！`, 'success');
  } catch (err) {
    console.error('Conversion Error:', err);
    item.status = 'error';
    item.errorMessage = err.message || '轉檔失敗';
    showToast(`《${item.name}》轉檔失敗：${item.errorMessage}`, 'error');
  }

  render();
}

/**
 * 批量轉換全部圖片
 */
async function convertAllImages() {
  if (state.images.length === 0) return;
  showToast('開始進行批量轉換...', 'info');

  for (const item of state.images) {
    item.status = 'processing';
    render();
    try {
      const result = await processImageConversion(item);
      item.convertedBlob = result.blob;
      if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      item.convertedUrl = URL.createObjectURL(result.blob);
      item.convertedSize = result.blob.size;
      item.convertedW = result.targetW;
      item.convertedH = result.targetH;
      item.status = 'done';
    } catch (err) {
      console.error(err);
      item.status = 'error';
    }
  }

  render();
  showToast('全數圖片轉換完成！', 'success');
}

/**
 * Canvas 圖像轉換處理
 */
function processImageConversion(item) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origW = img.naturalWidth || img.width || 800;
      const origH = img.naturalHeight || img.height || 600;
      const { targetW, targetH } = calculateTargetDimensions(origW, origH, item.targetPreset);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // 背景色填滿 (JPG/BMP 等不支援透明度的格式填為白色)
      if (['jpeg', 'bmp'].includes(item.targetFormat)) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const mimeMap = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
        bmp: 'image/bmp',
        svg: 'image/svg+xml'
      };

      const targetMime = mimeMap[item.targetFormat] || 'image/png';

      if (item.targetFormat === 'svg') {
        // SVG Vector Wrapper
        const pngDataUrl = canvas.toDataURL('image/png');
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}" viewBox="0 0 ${targetW} ${targetH}">
  <image href="${pngDataUrl}" width="${targetW}" height="${targetH}"/>
</svg>`;
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        resolve({ blob: svgBlob, targetW, targetH });
      } else if (item.targetFormat === 'bmp') {
        // 自訂相容型 24-bit BMP 轉換器
        const bmpBlob = canvasToBmpBlob(canvas);
        resolve({ blob: bmpBlob, targetW, targetH });
      } else {
        // 原生 Canvas toBlob 導出
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, targetW, targetH });
          } else {
            // Fallback (如 GIF)
            const dataUrl = canvas.toDataURL(targetMime, item.quality);
            const blobFallback = dataURLToBlob(dataUrl);
            resolve({ blob: blobFallback, targetW, targetH });
          }
        }, targetMime, item.quality);
      }
    };

    img.onerror = () => reject(new Error('圖片無法加載'));
    img.src = item.previewUrl;
  });
}

/**
 * 24-bit BMP 畫布點陣封裝函式 (完全跨瀏覽器)
 */
function canvasToBmpBlob(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const padding = (4 - ((width * 3) % 4)) % 4;
  const rowSize = width * 3 + padding;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BM Header
  view.setUint16(0, 0x424D, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // Offset to pixel array

  // DIB Header
  view.setUint32(14, 40, true); // Header size
  view.setInt32(18, width, true);
  view.setInt32(22, -height, true); // Top-down
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // 24-bit RGB
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  let offset = 54;
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      view.setUint8(offset++, data[i + 2]); // Blue
      view.setUint8(offset++, data[i + 1]); // Green
      view.setUint8(offset++, data[i]);     // Red
    }
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * DataURL 轉 Blob fallback
 */
function dataURLToBlob(dataurl) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * 一鍵打包下載全部 ZIP
 */
async function downloadAllZip() {
  const convertedItems = state.images.filter(x => x.status === 'done' && x.convertedBlob);
  if (convertedItems.length === 0) {
    showToast('目前尚無已轉換完成的圖片！', 'warning');
    return;
  }

  if (typeof window.JSZip === 'undefined') {
    showToast('ZIP 壓縮元件載入中，請稍後...', 'warning');
    return;
  }

  showToast('正在打包下載 ZIP 檔案...', 'info');

  const zip = new window.JSZip();
  const folder = zip.folder('converted_images');

  convertedItems.forEach(item => {
    const filename = getConvertedFileName(item.name, item.targetFormat);
    folder.file(filename, item.convertedBlob);
  });

  try {
    const content = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = `ganju_converted_images_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(zipUrl);
    showToast('ZIP 壓縮檔已下載完成！', 'success');
  } catch (err) {
    console.error('ZIP error:', err);
    showToast('打包 ZIP 時發生錯誤', 'error');
  }
}

/**
 * 檔名處置
 */
function getConvertedFileName(origName, targetExt) {
  const ext = targetExt === 'jpeg' ? 'jpg' : targetExt;
  const baseName = origName.substring(0, origName.lastIndexOf('.')) || origName;
  return `${baseName}_converted.${ext}`;
}

/**
 * 檔案容量大小友善化顯示
 */
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
