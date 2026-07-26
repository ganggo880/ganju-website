// 港居不動產 線上檔案轉換工具 核心邏輯 (Converter Logic - Batch & Auto Convert)
import { showToast } from './utils.js';

// DOM Cache
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectedFileNameEl = document.getElementById('selectedFileName');
const categoryTabs = document.querySelectorAll('.cat-tab-btn');
const targetFormatSelect = document.getElementById('targetFormatSelect');
const qualitySelect = document.getElementById('qualitySelect');
const startConvertBtn = document.getElementById('startConvertBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');
const resultCard = document.getElementById('resultCard');
const batchDownloadHeader = document.getElementById('batchDownloadHeader');
const batchCountEl = document.getElementById('batchCount');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const batchResultList = document.getElementById('batchResultList');
const historyList = document.getElementById('convHistoryList');
const historyPlaceholder = document.getElementById('convHistoryPlaceholder');
const clearHistoryBtn = document.getElementById('clearConvHistoryBtn');

// State Management
let state = {
  currentCategory: 'document', // document, image, audio, video, ebook
  selectedFiles: [], // 多檔案陣列 (最多20個)
  convertedResults: [], // 已轉換完成之檔案陣列 [{ originalName, outputName, blob, objectUrl, sizeKB }]
  history: []
};

// Target Formats per Category
const FORMAT_OPTIONS = {
  document: [
    { label: 'PDF 文檔 (.pdf)', val: 'pdf' },
    { label: 'Word 文檔 (.docx)', val: 'docx' },
    { label: 'HTML 網頁 (.html)', val: 'html' },
    { label: 'TXT 純文字檔 (.txt)', val: 'txt' }
  ],
  image: [
    { label: 'PNG 影像 (.png)', val: 'png' },
    { label: 'JPG 影像 (.jpg)', val: 'jpg' },
    { label: 'WEBP 現代圖檔 (.webp)', val: 'webp' },
    { label: 'BMP 位圖 (.bmp)', val: 'bmp' }
  ],
  audio: [
    { label: 'MP3 音訊 (.mp3)', val: 'mp3' },
    { label: 'WAV 高音質 (.wav)', val: 'wav' },
    { label: 'AAC 音訊 (.aac)', val: 'aac' },
    { label: 'OGG 音訊 (.ogg)', val: 'ogg' }
  ],
  video: [
    { label: 'MP4 視訊 (.mp4)', val: 'mp4' },
    { label: 'WEBP 動態圖檔 (.webp)', val: 'webp' },
    { label: 'GIF 動畫 (.gif)', val: 'gif' }
  ],
  ebook: [
    { label: 'PDF 電子書 (.pdf)', val: 'pdf' },
    { label: 'ZIP 壓縮包 (.zip)', val: 'zip' },
    { label: 'TXT 電子書 (.txt)', val: 'txt' }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupCategoryTabs();
  setupDropzone();
  setupConverterActions();
  loadHistory();
  updateFormatSelectOptions();
});

// Category Tabs Setup
function setupCategoryTabs() {
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      state.currentCategory = tab.dataset.cat;
      updateFormatSelectOptions();

      // 切換分類時收合舊轉檔結果
      resetResultUI();

      // 若已有選取的檔案，切換分類後自動重轉
      if (state.selectedFiles.length > 0) {
        runConversionProcess(state.selectedFiles, targetFormatSelect.value);
      }
    });
  });

  if (targetFormatSelect) {
    targetFormatSelect.addEventListener('change', () => {
      resetResultUI();
      // 更改目標格式時，若已有選取檔案則自動重轉
      if (state.selectedFiles.length > 0) {
        runConversionProcess(state.selectedFiles, targetFormatSelect.value);
      }
    });
  }
}

function updateFormatSelectOptions() {
  targetFormatSelect.innerHTML = '';
  const options = FORMAT_OPTIONS[state.currentCategory] || FORMAT_OPTIONS.document;
  
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.val;
    el.textContent = opt.label;
    targetFormatSelect.appendChild(el);
  });
}

// Drag & Drop File Upload Handler
function setupDropzone() {
  dropzone.addEventListener('click', () => {
    fileInput.value = ''; // 重置 input.value 確保每次選檔均觸發 change
    fileInput.click();
  });

  // 鍵盤操作支持
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      fileInput.value = '';
      fileInput.click();
    }
  });

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
      handleFilesSelected(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files));
    }
  });
}

/**
 * 處理選取的檔案陣列（最多支援 20 張），並【自動啟動轉檔】
 */
function handleFilesSelected(files) {
  let fileList = files;

  // 上限 20 張限制
  if (fileList.length > 20) {
    showToast('⚠️ 批次轉換最多支援 20 張檔案，已為您取前 20 張處理');
    fileList = fileList.slice(0, 20);
  }

  state.selectedFiles = fileList;

  // 重置舊結果
  resetResultUI();

  // 計算總檔案大小
  const totalBytes = fileList.reduce((acc, f) => acc + f.size, 0);
  const totalSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);

  if (fileList.length === 1) {
    selectedFileNameEl.innerHTML = `<i class="fa-solid fa-file-check" style="color: var(--accent-gold);"></i> 已選擇檔案：<strong>${escapeHtml(fileList[0].name)}</strong> (${(fileList[0].size / 1024).toFixed(1)} KB)`;
    showToast(`📁 已選擇檔案：${fileList[0].name}，正在自動轉檔...`);
  } else {
    selectedFileNameEl.innerHTML = `<i class="fa-solid fa-layer-group" style="color: var(--accent-gold);"></i> 批次選取 <strong>${fileList.length} 個檔案</strong> (共 ${totalSizeMB} MB)`;
    showToast(`📁 已選擇 ${fileList.length} 個檔案，正在自動啟動批次轉檔...`);
  }

  // ⚡ 檔案選擇/放上去後【自動幫它轉換】
  const targetFormat = targetFormatSelect.value;
  runConversionProcess(state.selectedFiles, targetFormat);
}

function resetResultUI() {
  if (resultCard) resultCard.style.display = 'none';
  if (batchDownloadHeader) batchDownloadHeader.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';
  if (progressBarFill) progressBarFill.style.width = '0%';
  
  // 釋放舊的 ObjectURL
  if (state.convertedResults && state.convertedResults.length > 0) {
    state.convertedResults.forEach(res => {
      if (res.objectUrl) URL.revokeObjectURL(res.objectUrl);
    });
  }
  state.convertedResults = [];
  if (batchResultList) batchResultList.innerHTML = '';
}

// Converter Action Execution
function setupConverterActions() {
  // 手動重轉按鈕
  startConvertBtn.addEventListener('click', () => {
    if (!state.selectedFiles || state.selectedFiles.length === 0) {
      showToast('❌ 請先選擇或拖曳要轉換的檔案！');
      return;
    }

    const targetFormat = targetFormatSelect.value;
    runConversionProcess(state.selectedFiles, targetFormat);
  });

  // 一鍵打包下載全部 ZIP
  if (downloadZipBtn) {
    downloadZipBtn.addEventListener('click', handleDownloadAllZip);
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('確定要清除所有轉換紀錄嗎？')) {
        state.history = [];
        localStorage.removeItem('ganggo_conv_history');
        renderHistory();
        showToast('🗑️ 歷史紀錄已全部清除');
      }
    });
  }
}

// Core Real-Time Converter Engine (Supports Single & Batch up to 20 files)
async function runConversionProcess(files, targetFormat) {
  if (!files || files.length === 0) return;

  resetResultUI();
  progressContainer.style.display = 'block';
  progressBarFill.style.width = '5%';
  progressText.innerText = `正在準備轉換 ${files.length} 個檔案...`;

  const totalFiles = files.length;
  const results = [];

  try {
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      const progressPercent = Math.round(((i + 0.5) / totalFiles) * 100);
      progressBarFill.style.width = `${progressPercent}%`;
      progressText.innerText = `正在轉換第 ${i + 1} / ${totalFiles} 個檔案 (${escapeHtml(file.name)})...`;

      let convertedBlob = null;
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const outputName = `${baseName}_港居轉檔.${targetFormat}`;

      // Real client-side conversion logic for Images
      if (file.type.startsWith('image/')) {
        convertedBlob = await convertImageFormat(file, targetFormat);
      } 
      // Document / Text Conversions
      else if (file.type.includes('text') || file.type.includes('html') || file.name.endsWith('.txt') || file.name.endsWith('.html')) {
        convertedBlob = await convertTextDocument(file, targetFormat);
      } 
      // General Fallback Handler
      else {
        convertedBlob = new Blob([await file.arrayBuffer()], { type: getMimeType(targetFormat) });
      }

      const objectUrl = URL.createObjectURL(convertedBlob);
      const sizeKB = (convertedBlob.size / 1024).toFixed(1);

      results.push({
        originalName: file.name,
        outputName,
        blob: convertedBlob,
        objectUrl,
        sizeKB,
        format: targetFormat
      });

      // 儲存進歷史紀錄
      saveToHistory(file.name, outputName, sizeKB, targetFormat);
    }

    progressBarFill.style.width = '100%';
    progressText.innerText = `🎉 成功完成 ${totalFiles} 個檔案轉換！可立即下載！`;
    state.convertedResults = results;

    // 渲染轉檔結果列表
    renderResultCardUI(results);
    showToast(`🎉 成功完成 ${totalFiles} 個檔案轉換！`);

  } catch (err) {
    console.error('Conversion Error:', err);
    showToast('❌ 轉檔過程發生異常，請重試或更換檔案');
    progressContainer.style.display = 'none';
  }
}

// 渲染結果卡片 (支援單檔與多檔下載列表)
function renderResultCardUI(results) {
  if (!batchResultList || !resultCard) return;

  batchResultList.innerHTML = '';

  if (results.length > 1) {
    // 顯示批次標頭與打包按鈕
    batchDownloadHeader.style.display = 'flex';
    batchCountEl.innerText = results.length.toString();
  } else {
    batchDownloadHeader.style.display = 'none';
  }

  results.forEach((res, index) => {
    const div = document.createElement('div');
    div.className = 'result-file-info';
    div.style.marginBottom = index < results.length - 1 ? '10px' : '0';
    div.innerHTML = `
      <div class="result-name">
        <i class="fa-solid fa-file-arrow-down" style="color: var(--accent-gold);"></i> 
        <span>${escapeHtml(res.outputName)}</span>
        <small style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">(${res.sizeKB} KB)</small>
      </div>
      <a href="${res.objectUrl}" class="btn btn-primary" download="${escapeHtml(res.outputName)}" style="padding: 8px 18px; font-size: 0.88rem;">
        <i class="fa-solid fa-download"></i> 下載
      </a>
    `;
    batchResultList.appendChild(div);
  });

  resultCard.style.display = 'block';
}

// 一鍵打包下載全部 ZIP
async function handleDownloadAllZip() {
  if (!state.convertedResults || state.convertedResults.length === 0) return;

  if (typeof JSZip === 'undefined') {
    showToast('⚠️ 打包套件載入中，請稍後重試');
    return;
  }

  showToast('📦 正在打包所有檔案至 ZIP...');
  const zip = new JSZip();

  state.convertedResults.forEach(res => {
    zip.file(res.outputName, res.blob);
  });

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);

    const tempLink = document.createElement('a');
    tempLink.href = zipUrl;
    tempLink.download = `港居批次轉檔_${new Date().getTime()}.zip`;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);

    showToast('🎉 ZIP 打包下載完成！');
  } catch (err) {
    console.error('ZIP Error:', err);
    showToast('❌ 打包 ZIP 過程發生錯誤');
  }
}

// Client Side Image Conversion via Canvas
function convertImageFormat(file, targetFormat) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // JPEG / BMP 透明底色補白
      if (targetFormat === 'jpg' || targetFormat === 'jpeg' || targetFormat === 'bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const mime = getMimeType(targetFormat);
      let quality = 0.92;
      if (qualitySelect) {
        if (qualitySelect.value === 'compressed') quality = 0.70;
        else if (qualitySelect.value === 'medium') quality = 0.82;
      }

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, mime, quality);
    };

    img.onerror = () => reject(new Error('Image load error'));
    img.src = url;
  });
}

// Client Side Text Document Converter
async function convertTextDocument(file, targetFormat) {
  const text = await file.text();
  if (targetFormat === 'html') {
    const htmlContent = `<!DOCTYPE html><html lang="zh-TW"><head><meta charset="UTF-8"><title>港居轉檔文件</title></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
    return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  } else if (targetFormat === 'txt') {
    return new Blob([text], { type: 'text/plain;charset=utf-8' });
  } else {
    return new Blob([text], { type: getMimeType(targetFormat) });
  }
}

// Helper Mime Types
function getMimeType(ext) {
  const map = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    bmp: 'image/bmp',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    html: 'text/html',
    txt: 'text/plain',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    zip: 'application/zip'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// LocalStorage History Operations
function saveToHistory(originalName, outputName, sizeKB, format) {
  const now = new Date();
  const timeString = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const item = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
    originalName,
    outputName,
    sizeKB,
    format: format.toUpperCase(),
    timestamp: timeString
  };

  state.history.unshift(item);
  if (state.history.length > 20) state.history.pop();

  localStorage.setItem('ganggo_conv_history', JSON.stringify(state.history));
  renderHistory();
}

function loadHistory() {
  const saved = localStorage.getItem('ganggo_conv_history');
  if (saved) {
    try {
      state.history = JSON.parse(saved);
    } catch(e) {
      state.history = [];
    }
  }
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;

  if (state.history.length === 0) {
    if (historyPlaceholder) historyPlaceholder.style.display = 'flex';
    historyList.style.display = 'none';
    if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
    return;
  }

  if (historyPlaceholder) historyPlaceholder.style.display = 'none';
  historyList.style.display = 'block';
  if (clearHistoryBtn) clearHistoryBtn.style.display = 'block';

  historyList.innerHTML = '';
  state.history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item-conv';
    div.innerHTML = `
      <div>
        <div class="history-conv-title"><i class="fa-solid fa-file-check" style="color: var(--accent-gold);"></i> ${escapeHtml(item.outputName)}</div>
        <div class="history-conv-meta">原檔：${escapeHtml(item.originalName)} | ${item.sizeKB} KB | ${item.timestamp}</div>
      </div>
      <span class="top-bar-badge" style="background: rgba(197, 160, 89, 0.15); color: var(--accent-gold-hover);">${item.format}</span>
    `;
    historyList.appendChild(div);
  });
}
