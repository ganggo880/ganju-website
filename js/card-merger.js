// 港居不動產 名片正反面/上下合成神器 核心邏輯 (Business Card Merger JS)
import { showToast } from './utils.js';

// DOM Elements
const topDropzone = document.getElementById('topDropzone');
const bottomDropzone = document.getElementById('bottomDropzone');
const topFileInput = document.getElementById('topFileInput');
const bottomFileInput = document.getElementById('bottomFileInput');
const topPreviewImg = document.getElementById('topPreviewImg');
const bottomPreviewImg = document.getElementById('bottomPreviewImg');

const layoutDirSelect = document.getElementById('layoutDirSelect');
const paddingRange = document.getElementById('paddingRange');
const paddingValEl = document.getElementById('paddingVal');
const bgColorSelect = document.getElementById('bgColorSelect');
const qualitySelect = document.getElementById('qualitySelect');

const mergerCanvas = document.getElementById('mergerCanvas');
const downloadCardBtn = document.getElementById('downloadCardBtn');
const clearCardsBtn = document.getElementById('clearCardsBtn');

// State
let state = {
  topImg: null,    // HTMLImageElement
  bottomImg: null, // HTMLImageElement
  topFileName: '正面名片',
  bottomFileName: '背面名片'
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupUploadZone(topDropzone, topFileInput, 'top');
  setupUploadZone(bottomDropzone, bottomFileInput, 'bottom');
  setupControls();
  setupClipboardPaste();
  renderCanvas();
});

// Setup Upload Dropzones
function setupUploadZone(zone, input, type) {
  if (!zone || !input) return;

  zone.addEventListener('click', () => {
    input.value = '';
    input.click();
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadImageFile(e.dataTransfer.files[0], type);
    }
  });

  input.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadImageFile(e.target.files[0], type);
    }
  });
}

// Support Clipboard Paste
function setupClipboardPaste() {
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (!state.topImg) {
          loadImageFile(blob, 'top');
          showToast('📋 已將剪貼簿圖片載入為名片正面（上圖）');
        } else {
          loadImageFile(blob, 'bottom');
          showToast('📋 已將剪貼簿圖片載入為名片背面（下圖）');
        }
        break;
      }
    }
  });
}

// Load Image File into Image Object
function loadImageFile(file, type) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('❌ 請上傳有效的圖片檔案 (JPG / PNG / WEBP)');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      if (type === 'top') {
        state.topImg = img;
        state.topFileName = file.name || '正面名片';
        if (topPreviewImg) {
          topPreviewImg.src = e.target.result;
          topPreviewImg.style.display = 'block';
        }
      } else {
        state.bottomImg = img;
        state.bottomFileName = file.name || '背面名片';
        if (bottomPreviewImg) {
          bottomPreviewImg.src = e.target.result;
          bottomPreviewImg.style.display = 'block';
        }
      }
      showToast(`✨ 已載入${type === 'top' ? '正面（上圖）' : '背面（下圖）'}名片`);
      renderCanvas();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Controls Setup
function setupControls() {
  if (layoutDirSelect) layoutDirSelect.addEventListener('change', renderCanvas);
  if (bgColorSelect) bgColorSelect.addEventListener('change', renderCanvas);
  if (qualitySelect) qualitySelect.addEventListener('change', renderCanvas);
  
  if (paddingRange) {
    paddingRange.addEventListener('input', () => {
      if (paddingValEl) paddingValEl.innerText = `${paddingRange.value}px`;
      renderCanvas();
    });
  }

  if (downloadCardBtn) {
    downloadCardBtn.addEventListener('click', handleDownloadJPG);
  }

  if (clearCardsBtn) {
    clearCardsBtn.addEventListener('click', () => {
      state.topImg = null;
      state.bottomImg = null;
      if (topPreviewImg) topPreviewImg.style.display = 'none';
      if (bottomPreviewImg) bottomPreviewImg.style.display = 'none';
      if (topFileInput) topFileInput.value = '';
      if (bottomFileInput) bottomFileInput.value = '';
      showToast('🗑️ 已重置合成名片圖檔');
      renderCanvas();
    });
  }
}

// Render Real-Time Canvas
function renderCanvas() {
  if (!mergerCanvas) return;
  const ctx = mergerCanvas.getContext('2d');

  const padding = parseInt(paddingRange ? paddingRange.value : '16', 10);
  const isVertical = !layoutDirSelect || layoutDirSelect.value === 'vertical';
  const bgColor = bgColorSelect ? bgColorSelect.value : '#FFFFFF';

  // Fallback placeholder when no images loaded
  if (!state.topImg && !state.bottomImg) {
    mergerCanvas.width = 600;
    mergerCanvas.height = isVertical ? 400 : 250;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, mergerCanvas.width, mergerCanvas.height);

    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('請選擇或拖曳正面與背面名片圖檔', mergerCanvas.width / 2, mergerCanvas.height / 2 - 10);
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('系統將即時進行上下/左右自動對齊合成', mergerCanvas.width / 2, mergerCanvas.height / 2 + 18);
    return;
  }

  // Calculate dimensions and scaling
  let targetWidth = 1000;
  if (state.topImg && state.bottomImg) {
    targetWidth = Math.max(state.topImg.width, state.bottomImg.width);
  } else if (state.topImg) {
    targetWidth = state.topImg.width;
  } else {
    targetWidth = state.bottomImg.width;
  }

  // Cap max width for output stability
  if (targetWidth > 1800) targetWidth = 1800;

  // Scale heights proportionally
  let topH = 0, bottomH = 0;
  let topW = targetWidth, bottomW = targetWidth;

  if (state.topImg) {
    topH = Math.round((targetWidth / state.topImg.width) * state.topImg.height);
  }
  if (state.bottomImg) {
    bottomH = Math.round((targetWidth / state.bottomImg.width) * state.bottomImg.height);
  }

  let canvasW = 0, canvasH = 0;

  if (isVertical) { // 上下垂直合成
    canvasW = targetWidth + padding * 2;
    canvasH = (state.topImg ? topH : 0) + (state.bottomImg ? bottomH : 0) + (state.topImg && state.bottomImg ? padding * 3 : padding * 2);
  } else { // 左右水平合成
    canvasW = (state.topImg ? topW : 0) + (state.bottomImg ? bottomW : 0) + (state.topImg && state.bottomImg ? padding * 3 : padding * 2);
    canvasH = Math.max(topH, bottomH) + padding * 2;
  }

  mergerCanvas.width = canvasW;
  mergerCanvas.height = canvasH;

  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw images
  if (isVertical) {
    let currentY = padding;

    if (state.topImg) {
      ctx.drawImage(state.topImg, padding, currentY, targetWidth, topH);
      currentY += topH + padding;
    }

    if (state.bottomImg) {
      ctx.drawImage(state.bottomImg, padding, currentY, targetWidth, bottomH);
    }
  } else {
    let currentX = padding;

    if (state.topImg) {
      ctx.drawImage(state.topImg, currentX, padding, topW, topH);
      currentX += topW + padding;
    }

    if (state.bottomImg) {
      ctx.drawImage(state.bottomImg, currentX, padding, bottomW, bottomH);
    }
  }
}

// Download Synthesized JPG
function handleDownloadJPG() {
  if (!state.topImg && !state.bottomImg) {
    showToast('❌ 請先上傳正面或背面名片圖檔！');
    return;
  }

  let quality = 0.95;
  if (qualitySelect) {
    if (qualitySelect.value === 'compressed') quality = 0.75;
    else if (qualitySelect.value === 'medium') quality = 0.85;
  }

  const dataUrl = mergerCanvas.toDataURL('image/jpeg', quality);
  const now = new Date();
  const timeStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
  const fileName = `名片合成_港居不動產_${timeStr}.jpg`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('🎉 合成名片 JPG 已成功匯出下載！');
}
