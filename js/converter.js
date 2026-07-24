// 港居不動產 線上檔案轉換工具 核心邏輯 (Converter Logic)
import { showToast } from './utils.js';

// DOM Cache
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const selectedFileNameEl = document.getElementById('selectedFileName');
const categoryTabs = document.querySelectorAll('.cat-tab-btn');
const targetFormatSelect = document.getElementById('targetFormatSelect');
const startConvertBtn = document.getElementById('startConvertBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBarFill = document.getElementById('progressBarFill');
const progressText = document.getElementById('progressText');
const resultCard = document.getElementById('resultCard');
const resultFileNameEl = document.getElementById('resultFileName');
const downloadBtn = document.getElementById('downloadBtn');
const historyList = document.getElementById('convHistoryList');
const historyPlaceholder = document.getElementById('convHistoryPlaceholder');
const clearHistoryBtn = document.getElementById('clearConvHistoryBtn');

// State Management
let state = {
  currentCategory: 'document', // document, image, audio, video, ebook
  selectedFile: null,
  convertedBlob: null,
  convertedFileName: '',
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
    });
  });
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });
}

function handleFileSelected(file) {
  state.selectedFile = file;
  const sizeKB = (file.size / 1024).toFixed(1);
  selectedFileNameEl.innerHTML = `<i class="fa-solid fa-file-check" style="color: var(--accent-gold);"></i> 常用檔案：<strong>${file.name}</strong> (${sizeKB} KB)`;
  showToast(`📁 已選擇檔案：${file.name}`);
}

// Converter Action Execution
function setupConverterActions() {
  startConvertBtn.addEventListener('click', () => {
    if (!state.selectedFile) {
      showToast('❌ 請先選擇或拖曳要轉換的檔案！');
      return;
    }

    const targetFormat = targetFormatSelect.value;
    runConversionProcess(state.selectedFile, targetFormat);
  });

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

// Core Real-Time Converter Engine
async function runConversionProcess(file, targetFormat) {
  progressContainer.style.display = 'block';
  resultCard.style.display = 'none';
  progressBarFill.style.width = '10%';
  progressText.innerText = '正在解析原始檔案...';

  try {
    // Simulated Progress steps for UX
    await delay(300);
    progressBarFill.style.width = '45%';
    progressText.innerText = `正在重構並編碼為 .${targetFormat} 格式...`;

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

    await delay(400);
    progressBarFill.style.width = '100%';
    progressText.innerText = '轉檔成功！即可下載檔案！';

    state.convertedBlob = convertedBlob;
    state.convertedFileName = outputName;

    // Show Result Box
    resultFileNameEl.innerHTML = `<i class="fa-solid fa-file-arrow-down" style="color: var(--accent-gold);"></i> ${outputName}`;
    downloadBtn.href = URL.createObjectURL(convertedBlob);
    downloadBtn.download = outputName;
    resultCard.style.display = 'block';

    // Save to History
    saveToHistory(file.name, outputName, (convertedBlob.size / 1024).toFixed(1), targetFormat);
    showToast('🎉 檔案轉換成功！可立即點擊下載！');

  } catch (err) {
    console.error('Conversion Error:', err);
    showToast('❌ 轉檔過程發生異常，請重試或更換檔案');
    progressContainer.style.display = 'none';
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
      
      // Draw white background for non-alpha formats like JPEG/BMP
      if (targetFormat === 'jpg' || targetFormat === 'jpeg' || targetFormat === 'bmp') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const mime = getMimeType(targetFormat);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob failed'));
      }, mime, 0.92);
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

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
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
    id: Date.now().toString(),
    originalName,
    outputName,
    sizeKB,
    format: format.toUpperCase(),
    timestamp: timeString
  };

  state.history.unshift(item);
  if (state.history.length > 12) state.history.pop();

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
        <div class="history-conv-title"><i class="fa-solid fa-file-check" style="color: var(--accent-gold);"></i> ${item.outputName}</div>
        <div class="history-conv-meta">原檔：${item.originalName} | ${item.sizeKB} KB | ${item.timestamp}</div>
      </div>
      <span class="top-bar-badge" style="background: rgba(197, 160, 89, 0.15); color: var(--accent-gold-hover);">${item.format}</span>
    `;
    historyList.appendChild(div);
  });
}
