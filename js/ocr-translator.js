// 港居不動產 - 照片 OCR 文字辨識與多國語言翻譯 核心邏輯 (高精準深度學習與 AI 自適應去陰影增強)

(function () {
  'use strict';

  // 1. 公用 Toast 提示函式
  function showToast(message) {
    let toastEl = document.getElementById('toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'toast';
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'alert');
      toastEl.setAttribute('aria-live', 'assertive');
      document.body.appendChild(toastEl);
    }
    
    toastEl.innerText = message;
    toastEl.classList.add('show');
    
    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }
    
    window.toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3000);
  }

  // 2. 主題切換器與導覽列初始化
  function initPageLayout() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('ganggo_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ganggo_theme', newTheme);
        showToast(newTheme === 'dark' ? '🌙 已切換為深色模式' : '☀️ 已切換為淺色模式');
      });
    }

    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = navMenu.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && e.target !== mobileToggle) {
          navMenu.classList.remove('active');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(dd => {
      const toggle = dd.querySelector('.nav-dropdown-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dd.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', () => {
      dropdowns.forEach(dd => dd.classList.remove('open'));
    });
  }

  // 3. OCR 核心與 AI 影像增強應用邏輯
  function initOcrApp() {
    // DOM Cache
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const canvasViewport = document.getElementById('canvas-viewport');
    const ocrCanvas = document.getElementById('ocr-canvas');
    const dropzoneNotice = document.getElementById('dropzone-notice');

    // Enhancement Buttons
    const btnAutoEnhance = document.getElementById('btn-auto-enhance');
    const btnAdaptiveThresh = document.getElementById('btn-adaptive-thresh');
    const btnSharpen = document.getElementById('btn-sharpen');
    const btnGrayscale = document.getElementById('btn-grayscale');
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');
    const btnTiltLeft = document.getElementById('btn-tilt-left');
    const btnTiltRight = document.getElementById('btn-tilt-right');
    const btnResetImage = document.getElementById('btn-reset-image');
    const btnStartOcr = document.getElementById('btn-start-ocr');

    // Sliders
    const contrastSlider = document.getElementById('contrast-slider');
    const contrastVal = document.getElementById('contrast-val');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessVal = document.getElementById('brightness-val');

    // OCR Engine Selectors
    const ocrLangSelect = document.getElementById('ocr-lang-select');
    const ocrModelSelect = document.getElementById('ocr-model-select');
    const ocrPsmSelect = document.getElementById('ocr-psm-select');

    // Progress Elements
    const progressContainer = document.getElementById('progress-container');
    const progressStatusText = document.getElementById('progress-status-text');
    const progressPercentText = document.getElementById('progress-percent-text');
    const progressBarFill = document.getElementById('progress-bar-fill');

    // Text Boxes & Indicators
    const textareaSource = document.getElementById('textarea-source');
    const textareaTarget = document.getElementById('textarea-target');
    const sourceWordCount = document.getElementById('source-word-count');
    const targetWordCount = document.getElementById('target-word-count');
    const ocrConfidence = document.getElementById('ocr-confidence');

    // Translation Controls
    const sourceLangSelect = document.getElementById('source-lang-select');
    const targetLangSelect = document.getElementById('target-lang-select');
    const btnSwapLang = document.getElementById('btn-swap-lang');
    const btnTranslate = document.getElementById('btn-translate');

    // Action Buttons
    const btnCopySource = document.getElementById('btn-copy-source');
    const btnTtsSource = document.getElementById('btn-tts-source');
    const btnClearSource = document.getElementById('btn-clear-source');

    const btnCopyTarget = document.getElementById('btn-copy-target');
    const btnTtsTarget = document.getElementById('btn-tts-target');
    const btnClearTarget = document.getElementById('btn-clear-target');

    const btnExportTxt = document.getElementById('btn-export-txt');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnGoogleTranslate = document.getElementById('btn-google-translate');

    const sampleChips = document.querySelectorAll('.sample-chip');

    // State Variables
    let rawImage = null; // Original image element / canvas
    let rotationAngle = 0; // in degrees (-180 to 180)
    let isGrayscale = false;
    let isAdaptiveThresh = false;
    let isSharpen = false;
    let contrastLevel = 100; // 50 to 250
    let brightnessLevel = 100; // 50 to 200
    let ocrBoxes = []; // Detected bounding boxes
    let isProcessingOcr = false;

    // File Input Listener
    if (fileInput) {
      fileInput.addEventListener('click', (e) => e.stopPropagation());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleImageFile(e.target.files[0]);
        }
      });
    }

    // Drag and Drop & Click Triggers
    const clickableUploadAreas = [dropzone, canvasViewport, dropzoneNotice].filter(Boolean);
    clickableUploadAreas.forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === ocrCanvas && rawImage) return;
        if (fileInput) fileInput.click();
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.classList.add('dragover');
        if (dropzone) dropzone.classList.add('dragover');
      });

      el.addEventListener('dragleave', () => {
        el.classList.remove('dragover');
        if (dropzone) dropzone.classList.remove('dragover');
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('dragover');
        if (dropzone) dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleImageFile(e.dataTransfer.files[0]);
        }
      });
    });

    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageFile(e.dataTransfer.files[0]);
      }
    });

    // Clipboard Paste (Ctrl+V)
    window.addEventListener('paste', (e) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
            showToast('📋 已載入剪貼簿截圖！');
            break;
          }
        }
      }
    });

    // Sample Chips Click
    sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.getAttribute('data-sample');
        loadSampleImage(type);
      });
    });

    function isImageFile(file) {
      if (!file) return false;
      if (file.type && file.type.startsWith('image/')) return true;
      const name = (file.name || '').toLowerCase();
      return /\.(jpg|jpeg|png|webp|bmp|gif|heic|heif|tiff|svg)$/i.test(name);
    }

    function handleImageFile(file) {
      if (!isImageFile(file)) {
        showToast('❌ 請上傳格式正確的圖片檔案 (JPG / PNG / WEBP / BMP)');
        return;
      }

      showToast('📷 正在載入照片...');

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Normalize dimension to max 2000px
          const maxDim = 2000;
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
            const scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = w;
            scaledCanvas.height = h;
            const sCtx = scaledCanvas.getContext('2d');
            sCtx.drawImage(img, 0, 0, w, h);
            rawImage = scaledCanvas;
          } else {
            rawImage = img;
          }

          resetFiltersState();
          // Auto apply smart enhance for mobile photos
          isAdaptiveThresh = true;
          isSharpen = true;
          updateToolbarState();
          renderCanvas();
          showToast('✨ 照片已載入！已啟用「AI 智慧去陰影與清晰化」，正在執行高精度辨識...');
          runOcr();
        };
        img.onerror = () => {
          showToast('❌ 照片讀取失敗，請確認檔案格式');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    function loadSampleImage(type) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 800;
      tempCanvas.height = 500;
      const ctx = tempCanvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 800, 500);

      if (type === 'contract') {
        ctx.fillStyle = '#1A365D';
        ctx.fillRect(0, 0, 800, 70);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px "Noto Sans TC", sans-serif';
        ctx.fillText('港居不動產 租賃住宅委託管理合約書', 40, 45);

        ctx.fillStyle = '#0F172A';
        ctx.font = '18px "Noto Sans TC", sans-serif';
        ctx.fillText('立契約書人：港居不動產開發有限公司（以下簡稱代管業）', 40, 130);
        ctx.fillText('統一編號：96797997　營業員證號：(108)登字第354198號', 40, 170);
        ctx.fillText('租賃管理證號：(112)登字第013739號　經理人：陳俊銘', 40, 210);
        ctx.fillText('房屋標的：高雄市小港區中安路825號 (高質感景觀住宅)', 40, 260);
        ctx.fillText('每月租金：新台幣 NT$ 36,000 元整 (代管服務費率 10%)', 40, 310);
        ctx.fillText('特約事項：屋況免改裝直上，原狀還原保證與外商租客嚴審。', 40, 360);
        ctx.fillText('簽約日期：中華民國 115 年 08 月 06 日', 40, 420);
      } else if (type === 'card') {
        ctx.fillStyle = '#0F2341';
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#C5A059';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('GANJU REAL ESTATE', 60, 100);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px "Noto Sans TC", sans-serif';
        ctx.fillText('港居不動產開發有限公司', 60, 150);

        ctx.fillStyle = '#FFE8B8';
        ctx.font = '22px "Noto Sans TC", sans-serif';
        ctx.fillText('陳俊銘 經理 / 不動產租賃管理師', 60, 220);

        ctx.fillStyle = '#E2E8F0';
        ctx.font = '18px "Noto Sans TC", sans-serif';
        ctx.fillText('📞 電話：0968-863-880 / 07-791-2288', 60, 290);
        ctx.fillText('✉️ 信箱：ganggo880@gmail.com', 60, 330);
        ctx.fillText('📍 地址：高雄市小港區合作里中安路825號', 60, 370);
        ctx.fillText('🏢 統編：96797997 | 特許包租代管業者', 60, 410);
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
        ctx.fillText('【高優質住宅招租公告 NOTICE】', 40, 80);
        ctx.font = '18px "Noto Sans TC", sans-serif';
        ctx.fillText('• 房型格局：3房2廳2衛 (小港中安路景觀宅)', 40, 140);
        ctx.fillText('• 配備設施：一級變頻冷氣、精美裝潢、附平面車位', 40, 190);
        ctx.fillText('• 租金行情：NT$ 35,000 / 月 (含管理費)', 40, 240);
        ctx.fillText('• 嚴格審核外商高管與工程師優質租客，維護居住品質。', 40, 300);
        ctx.fillText('• 歡迎預約現場賞屋與 360° VR 虛擬實境導覽！', 40, 360);
      }

      rawImage = tempCanvas;
      resetFiltersState();
      updateToolbarState();
      renderCanvas();
      showToast('📄 範例圖片已載入，正在自動執行高精度 OCR...');
      runOcr();
    }

    function resetFiltersState() {
      rotationAngle = 0;
      isGrayscale = false;
      isAdaptiveThresh = false;
      isSharpen = false;
      contrastLevel = 100;
      brightnessLevel = 100;
      ocrBoxes = [];
      if (contrastSlider) contrastSlider.value = 100;
      if (contrastVal) contrastVal.innerText = '100%';
      if (brightnessSlider) brightnessSlider.value = 100;
      if (brightnessVal) brightnessVal.innerText = '100%';
    }

    // 4. 高階影像濾鏡演算法 (AI 自適應積分圖去陰影 + 銳化卷積)
    function renderCanvas() {
      if (!rawImage) {
        ocrCanvas.style.display = 'none';
        if (dropzoneNotice) dropzoneNotice.style.display = 'block';
        return;
      }

      ocrCanvas.style.display = 'block';
      if (dropzoneNotice) dropzoneNotice.style.display = 'none';

      const ctx = ocrCanvas.getContext('2d');
      const rawW = rawImage.naturalWidth || rawImage.width;
      const rawH = rawImage.naturalHeight || rawImage.height;

      // Handle custom rotation angles
      const rad = (rotationAngle * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      const width = Math.round(rawW * cos + rawH * sin);
      const height = Math.round(rawW * sin + rawH * cos);

      ocrCanvas.width = width;
      ocrCanvas.height = height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Rotate around center
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rad);
      ctx.drawImage(rawImage, -rawW / 2, -rawH / 2);
      ctx.restore();

      // Retrieve pixel data for advanced processing
      let imgData = ctx.getImageData(0, 0, width, height);
      let d = imgData.data;

      // Step A: Contrast & Brightness adjustment
      if (contrastLevel !== 100 || brightnessLevel !== 100) {
        const factor = (259 * (contrastLevel + 255)) / (255 * (259 - contrastLevel));
        const brightAdd = (brightnessLevel - 100) * 1.5;

        for (let i = 0; i < d.length; i += 4) {
          d[i] = factor * (d[i] - 128) + 128 + brightAdd;
          d[i + 1] = factor * (d[i + 1] - 128) + 128 + brightAdd;
          d[i + 2] = factor * (d[i + 2] - 128) + 128 + brightAdd;
        }
      }

      // Step B: Grayscale
      if (isGrayscale || isAdaptiveThresh) {
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
      }

      // Step C: Adaptive Integral-Image Local Thresholding (Eliminate uneven shadows & wrinkles)
      if (isAdaptiveThresh) {
        const grayArr = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
          grayArr[i] = d[i * 4];
        }

        // Compute 2D Integral Image
        const integral = new Float64Array((width + 1) * (height + 1));
        for (let y = 0; y < height; y++) {
          let sum = 0;
          for (let x = 0; x < width; x++) {
            sum += grayArr[y * width + x];
            integral[(y + 1) * (width + 1) + (x + 1)] = integral[y * (width + 1) + (x + 1)] + sum;
          }
        }

        const s = Math.max(10, Math.round(width / 35)); // adaptive window radius
        const C = 7; // offset margin

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const x1 = Math.max(0, x - s);
            const y1 = Math.max(0, y - s);
            const x2 = Math.min(width, x + s + 1);
            const y2 = Math.min(height, y + s + 1);
            const count = (x2 - x1) * (y2 - y1);
            const sum = integral[y2 * (width + 1) + x2] - integral[y1 * (width + 1) + x2] - integral[y2 * (width + 1) + x1] + integral[y1 * (width + 1) + x1];
            const mean = sum / count;

            const val = grayArr[y * width + x] < (mean - C) ? 0 : 255;
            const idx = (y * width + x) * 4;
            d[idx] = val;
            d[idx + 1] = val;
            d[idx + 2] = val;
          }
        }
      }

      // Step D: Sharpen Kernel Convolution (Enhance Chinese character strokes)
      if (isSharpen && !isAdaptiveThresh) {
        const copy = new Uint8ClampedArray(d);
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]; // 3x3 Sharpen

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let val = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const pIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                  const kIdx = (ky + 1) * 3 + (kx + 1);
                  val += copy[pIdx] * kernel[kIdx];
                }
              }
              d[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, val));
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw OCR Bounding Boxes
      if (ocrBoxes.length > 0) {
        ctx.lineWidth = Math.max(2, Math.round(width / 500));
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.9)';
        ctx.fillStyle = 'rgba(197, 160, 89, 0.15)';

        ocrBoxes.forEach(box => {
          if (box.bbox) {
            const { x0, y0, x1, y1 } = box.bbox;
            ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
          }
        });
      }
    }

    // 5. Toolbar Handlers
    if (btnAutoEnhance) {
      btnAutoEnhance.addEventListener('click', () => {
        if (!rawImage) return;
        isAdaptiveThresh = true;
        isSharpen = true;
        isGrayscale = true;
        contrastLevel = 130;
        if (contrastSlider) contrastSlider.value = 130;
        if (contrastVal) contrastVal.innerText = '130%';
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
        showToast('🪄 已套用「AI 智慧一鍵清晰」！陰影已消除、文字筆畫已銳化');
      });
    }

    if (btnAdaptiveThresh) {
      btnAdaptiveThresh.addEventListener('click', () => {
        if (!rawImage) return;
        isAdaptiveThresh = !isAdaptiveThresh;
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
        showToast(isAdaptiveThresh ? '🌓 已啟用自適應局部去陰影' : '↩️ 已關閉去陰影');
      });
    }

    if (btnSharpen) {
      btnSharpen.addEventListener('click', () => {
        if (!rawImage) return;
        isSharpen = !isSharpen;
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
        showToast(isSharpen ? '🔪 已啟用筆畫邊緣銳化' : '↩️ 已關閉銳化');
      });
    }

    if (btnGrayscale) {
      btnGrayscale.addEventListener('click', () => {
        if (!rawImage) return;
        isGrayscale = !isGrayscale;
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
      });
    }

    if (btnRotateLeft) {
      btnRotateLeft.addEventListener('click', () => {
        if (!rawImage) return;
        rotationAngle = (rotationAngle - 90 + 360) % 360;
        ocrBoxes = [];
        renderCanvas();
      });
    }

    if (btnRotateRight) {
      btnRotateRight.addEventListener('click', () => {
        if (!rawImage) return;
        rotationAngle = (rotationAngle + 90) % 360;
        ocrBoxes = [];
        renderCanvas();
      });
    }

    if (btnTiltLeft) {
      btnTiltLeft.addEventListener('click', () => {
        if (!rawImage) return;
        rotationAngle = rotationAngle - 1;
        ocrBoxes = [];
        renderCanvas();
        showToast(`📐 旋轉微調至 ${rotationAngle}°`);
      });
    }

    if (btnTiltRight) {
      btnTiltRight.addEventListener('click', () => {
        if (!rawImage) return;
        rotationAngle = rotationAngle + 1;
        ocrBoxes = [];
        renderCanvas();
        showToast(`📐 旋轉微調至 ${rotationAngle}°`);
      });
    }

    if (contrastSlider) {
      contrastSlider.addEventListener('input', (e) => {
        contrastLevel = parseInt(e.target.value, 10);
        if (contrastVal) contrastVal.innerText = `${contrastLevel}%`;
        renderCanvas();
      });
    }

    if (brightnessSlider) {
      brightnessSlider.addEventListener('input', (e) => {
        brightnessLevel = parseInt(e.target.value, 10);
        if (brightnessVal) brightnessVal.innerText = `${brightnessLevel}%`;
        renderCanvas();
      });
    }

    if (btnResetImage) {
      btnResetImage.addEventListener('click', () => {
        if (!rawImage) return;
        resetFiltersState();
        updateToolbarState();
        renderCanvas();
        showToast('🔄 已還原原始照片');
      });
    }

    if (btnStartOcr) {
      btnStartOcr.addEventListener('click', () => {
        if (!rawImage) {
          showToast('❌ 請先上傳照片！');
          if (fileInput) fileInput.click();
          return;
        }
        runOcr();
      });
    }

    function updateToolbarState() {
      if (btnAdaptiveThresh) btnAdaptiveThresh.classList.toggle('active', isAdaptiveThresh);
      if (btnSharpen) btnSharpen.classList.toggle('active', isSharpen);
      if (btnGrayscale) btnGrayscale.classList.toggle('active', isGrayscale);
    }

    // 6. 高精度 OCR 執行 (Tesseract.js Best LSTM 模型 + PSM 排版優化)
    async function runOcr() {
      if (!rawImage || isProcessingOcr) return;

      if (!window.Tesseract) {
        showToast('❌ 正在載入 Tesseract OCR 模組，請稍候...');
        return;
      }

      isProcessingOcr = true;
      const lang = ocrLangSelect ? ocrLangSelect.value || 'chi_tra+eng' : 'chi_tra+eng';
      const modelType = ocrModelSelect ? ocrModelSelect.value : 'best';
      const psmMode = ocrPsmSelect ? ocrPsmSelect.value : '6';

      // Select high accuracy LSTM model repository
      const langPath = modelType === 'best'
        ? 'https://tessdata.projectnaptha.com/4.0.0_best/'
        : 'https://tessdata.projectnaptha.com/4.0.0_fast/';

      if (progressContainer) progressContainer.style.display = 'block';
      if (progressStatusText) progressStatusText.innerText = `正在載入 ${modelType === 'best' ? '高精準深度學習' : '快速'} 語言模型 (${lang})...`;
      if (progressBarFill) progressBarFill.style.width = '15%';
      if (progressPercentText) progressPercentText.innerText = '15%';

      try {
        const result = await Tesseract.recognize(ocrCanvas, lang, {
          langPath: langPath,
          tessedit_pageseg_mode: psmMode,
          preserve_interword_spaces: '1',
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(m.progress * 100);
              if (progressBarFill) progressBarFill.style.width = `${pct}%`;
              if (progressPercentText) progressPercentText.innerText = `${pct}%`;
              if (progressStatusText) progressStatusText.innerText = `正在分析影像與高精度辨識文字 (${pct}%)...`;
            } else if (m.status) {
              if (progressStatusText) progressStatusText.innerText = `正在準備 ${lang} 神經網路模型...`;
            }
          }
        });

        let rawText = (result && result.data && result.data.text) ? result.data.text : '';
        
        // Post-processing: Normalize Chinese punctuation and spacing
        let cleanedText = postProcessText(rawText);

        if (textareaSource) {
          textareaSource.value = cleanedText;
        }
        updateWordCounts();

        const confidence = result && result.data ? Math.round(result.data.confidence || 0) : 0;
        if (ocrConfidence) {
          ocrConfidence.innerText = `辨識信心度：${confidence}% (${modelType === 'best' ? '高精準模型' : '快速模型'})`;
        }

        if (result && result.data && result.data.words && result.data.words.length > 0) {
          ocrBoxes = result.data.words;
          renderCanvas();
        }

        if (progressContainer) progressContainer.style.display = 'none';
        isProcessingOcr = false;
        showToast(`🎉 高精準 OCR 文字辨識完成！(信心度 ${confidence}%)`);

        // Auto trigger translation
        if (cleanedText.length > 0) {
          runTranslation();
        }
      } catch (err) {
        console.error('OCR Error:', err);
        if (progressContainer) progressContainer.style.display = 'none';
        isProcessingOcr = false;
        showToast('❌ OCR 辨識失敗，請嘗試點擊「一鍵清晰增強」或微調角度');
      }
    }

    // Post processing cleanup
    function postProcessText(str) {
      if (!str) return '';
      return str
        .replace(/\r\n/g, '\n')
        .replace(/([0-9a-zA-Z])\s+([0-9a-zA-Z])/g, '$1 $2') // keep single space between english words
        .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2') // remove awkward spaces between Chinese chars
        .replace(/\n\s*\n\s*\n/g, '\n\n') // collapse multiple blank lines
        .trim();
    }

    // 7. 多國語言即時翻譯引擎
    async function runTranslation() {
      const text = textareaSource ? textareaSource.value.trim() : '';
      if (!text) {
        showToast('❌ 請先輸入或辨識出原文內容！');
        return;
      }

      let srcLang = sourceLangSelect ? sourceLangSelect.value : 'auto';
      const tgtLang = targetLangSelect ? targetLangSelect.value : 'en';

      if (srcLang === 'auto') {
        if (/[\u4e00-\u9fa5]/.test(text)) {
          srcLang = 'zh-TW';
        } else if (/[\u3040-\u30ff]/.test(text)) {
          srcLang = 'ja';
        } else if (/[\uac00-\ud7af]/.test(text)) {
          srcLang = 'ko';
        } else {
          srcLang = 'en';
        }
      }

      if (srcLang === tgtLang) {
        if (textareaTarget) textareaTarget.value = text;
        updateWordCounts();
        return;
      }

      if (textareaTarget) textareaTarget.value = '⏳ 正在進行多國語言即時翻譯...';
      showToast('🌐 正在翻譯文字內容...');

      try {
        const chunks = splitTextIntoChunks(text, 350);
        let translatedChunks = [];

        for (let chunk of chunks) {
          const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${srcLang}|${tgtLang}`;
          const resp = await fetch(url);
          const data = await resp.json();

          if (data && data.responseData && data.responseData.translatedText) {
            translatedChunks.push(data.responseData.translatedText);
          } else {
            translatedChunks.push(chunk);
          }
        }

        const finalTranslation = translatedChunks.join('\n');
        if (textareaTarget) {
          textareaTarget.value = finalTranslation;
        }
        updateWordCounts();
        showToast('✨ 翻譯已完成！');
      } catch (err) {
        console.warn('Translation API error, fallback:', err);
        if (textareaTarget) {
          textareaTarget.value = `[翻譯服務連線受限，您可點擊下方「Google 翻譯」快捷查看]\n\n${text}`;
        }
        showToast('⚠️ 免費翻譯服務連線延遲，已提供快捷對照');
      }
    }

    function splitTextIntoChunks(str, maxLen) {
      const lines = str.split('\n');
      let chunks = [];
      let cur = '';

      for (let line of lines) {
        if ((cur + line).length > maxLen) {
          if (cur) chunks.push(cur.trim());
          cur = line + '\n';
        } else {
          cur += line + '\n';
        }
      }
      if (cur.trim()) chunks.push(cur.trim());
      return chunks.length > 0 ? chunks : [str];
    }

    if (btnTranslate) {
      btnTranslate.addEventListener('click', runTranslation);
    }

    if (btnSwapLang) {
      btnSwapLang.addEventListener('click', () => {
        if (sourceLangSelect.value === 'auto') {
          sourceLangSelect.value = 'zh-TW';
        }
        const temp = sourceLangSelect.value;
        sourceLangSelect.value = targetLangSelect.value;
        targetLangSelect.value = temp;

        const tempText = textareaSource.value;
        textareaSource.value = textareaTarget.value;
        textareaTarget.value = tempText;

        updateWordCounts();
        showToast('⇄ 已切換語言與文字方向');
      });
    }

    // 8. 動作處理 (複製、TTS 語音發音、匯出)
    function updateWordCounts() {
      if (sourceWordCount && textareaSource) {
        sourceWordCount.innerText = `${textareaSource.value.length} 字`;
      }
      if (targetWordCount && textareaTarget) {
        targetWordCount.innerText = `${textareaTarget.value.length} 字`;
      }
    }

    if (textareaSource) textareaSource.addEventListener('input', updateWordCounts);
    if (textareaTarget) textareaTarget.addEventListener('input', updateWordCounts);

    if (btnCopySource) {
      btnCopySource.addEventListener('click', () => {
        const txt = textareaSource.value;
        if (!txt) return;
        navigator.clipboard.writeText(txt).then(() => showToast('📋 原文已複製到剪貼簿！'));
      });
    }

    if (btnCopyTarget) {
      btnCopyTarget.addEventListener('click', () => {
        const txt = textareaTarget.value;
        if (!txt) return;
        navigator.clipboard.writeText(txt).then(() => showToast('📋 譯文已複製到剪貼簿！'));
      });
    }

    if (btnTtsSource) {
      btnTtsSource.addEventListener('click', () => {
        speakText(textareaSource.value, sourceLangSelect.value);
      });
    }

    if (btnTtsTarget) {
      btnTtsTarget.addEventListener('click', () => {
        speakText(textareaTarget.value, targetLangSelect.value);
      });
    }

    function speakText(text, langCode) {
      if (!window.speechSynthesis) {
        showToast('❌ 您的瀏覽器不支援語音朗讀');
        return;
      }
      if (!text.trim()) {
        showToast('❌ 無文字可供朗讀');
        return;
      }

      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      if (langCode && langCode !== 'auto') {
        utter.lang = langCode;
      }
      window.speechSynthesis.speak(utter);
      showToast('🔊 正在播放語音朗讀...');
    }

    if (btnClearSource) {
      btnClearSource.addEventListener('click', () => {
        textareaSource.value = '';
        updateWordCounts();
      });
    }

    if (btnClearTarget) {
      btnClearTarget.addEventListener('click', () => {
        textareaTarget.value = '';
        updateWordCounts();
      });
    }

    if (btnExportTxt) {
      btnExportTxt.addEventListener('click', () => {
        const content = `【港居不動產 - 照片 OCR 辨識與翻譯結果】\n========================================\n\n【辨識原文】\n${textareaSource.value}\n\n----------------------------------------\n【多國語言譯文 (${targetLangSelect.options[targetLangSelect.selectedIndex].text})】\n${textareaTarget.value}\n\n========================================\n產生時間：${new Date().toLocaleString('zh-TW')}`;
        downloadFile(content, `ocr_translation_${Date.now()}.txt`, 'text/plain;charset=utf-8');
        showToast('📥 .TXT 文字檔已匯出！');
      });
    }

    if (btnExportMd) {
      btnExportMd.addEventListener('click', () => {
        const content = `# 港居不動產 照片 OCR 辨識與翻譯結果\n\n- 產出時間：\`${new Date().toLocaleString('zh-TW')}\`\n\n## 📝 辨識原文\n\`\`\`text\n${textareaSource.value}\n\`\`\`\n\n## 🌐 譯文 (${targetLangSelect.options[targetLangSelect.selectedIndex].text})\n\`\`\`text\n${textareaTarget.value}\n\`\`\`\n`;
        downloadFile(content, `ocr_translation_${Date.now()}.md`, 'text/markdown;charset=utf-8');
        showToast('📥 Markdown 筆記已匯出！');
      });
    }

    if (btnGoogleTranslate) {
      btnGoogleTranslate.addEventListener('click', () => {
        const text = textareaSource.value.trim();
        if (!text) {
          showToast('❌ 請先輸入或辨識文字！');
          return;
        }
        const tgt = targetLangSelect.value === 'auto' ? 'zh-TW' : targetLangSelect.value;
        const url = `https://translate.google.com/?sl=auto&tl=${tgt}&text=${encodeURIComponent(text)}&op=translate`;
        window.open(url, '_blank', 'noopener,noreferrer');
      });
    }

    function downloadFile(content, filename, type) {
      const blob = new Blob([content], { type });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPageLayout();
      initOcrApp();
    });
  } else {
    initPageLayout();
    initOcrApp();
  }

})();
