// 港居不動產 - 照片 OCR 文字辨識與多國語言翻譯 核心邏輯 (純前端自包含版本，相容 file:/// 與 https://)

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
    // 深淺主題切換
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

    // 行動端漢堡選單
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

    // 下拉選單點擊與鍵盤控制
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

  // 3. OCR 與翻譯主要應用邏輯
  function initOcrApp() {
    // DOM Cache
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const canvasViewport = document.getElementById('canvas-viewport');
    const ocrCanvas = document.getElementById('ocr-canvas');
    const dropzoneNotice = document.getElementById('dropzone-notice');

    // Toolbar Buttons
    const btnRotateLeft = document.getElementById('btn-rotate-left');
    const btnRotateRight = document.getElementById('btn-rotate-right');
    const btnGrayscale = document.getElementById('btn-grayscale');
    const btnBinarize = document.getElementById('btn-binarize');
    const btnResetImage = document.getElementById('btn-reset-image');
    const btnStartOcr = document.getElementById('btn-start-ocr');

    // OCR Progress Elements
    const progressContainer = document.getElementById('progress-container');
    const progressStatusText = document.getElementById('progress-status-text');
    const progressPercentText = document.getElementById('progress-percent-text');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const ocrLangSelect = document.getElementById('ocr-lang-select');

    // Text Boxes
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
    const btnClearTarget = document.getElementById('btn-clear-target') || document.getElementById('btnClearTarget');

    const btnExportTxt = document.getElementById('btn-export-txt');
    const btnExportMd = document.getElementById('btn-export-md');
    const btnGoogleTranslate = document.getElementById('btn-google-translate');

    // Sample Chips
    const sampleChips = document.querySelectorAll('.sample-chip');

    // State Variables
    let rawImage = null; // Normalized Image / Canvas object
    let rotationAngle = 0; // 0, 90, 180, 270
    let isGrayscale = false;
    let isBinarized = false;
    let ocrBoxes = []; // Detected bounding boxes
    let isProcessingOcr = false;

    // File Input Stop Propagation & Change Listener
    if (fileInput) {
      fileInput.addEventListener('click', (e) => e.stopPropagation());
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleImageFile(e.target.files[0]);
        }
      });
    }

    // Bind Click and Drag & Drop on multiple interaction zones
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

    // Global drag & drop protection
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageFile(e.dataTransfer.files[0]);
      }
    });

    // Global Clipboard Paste (Ctrl+V)
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
          // Normalize dimension to max 1800px for speed & reliability
          const maxDim = 1800;
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

          rotationAngle = 0;
          isGrayscale = false;
          isBinarized = false;
          ocrBoxes = [];
          updateToolbarState();
          renderCanvas();
          showToast('✨ 照片已載入！正在自動執行 OCR 辨識...');
          runOcr();
        };
        img.onerror = () => {
          showToast('❌ 照片讀取失敗，請確認檔案格式');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }

    // Built-in sample generator
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
      rotationAngle = 0;
      isGrayscale = false;
      isBinarized = false;
      ocrBoxes = [];
      updateToolbarState();
      renderCanvas();
      showToast('📄 範例圖片已載入，正在自動執行 OCR...');
      runOcr();
    }

    // Render on canvas
    function renderCanvas() {
      if (!rawImage) {
        ocrCanvas.style.display = 'none';
        if (dropzoneNotice) dropzoneNotice.style.display = 'block';
        return;
      }

      ocrCanvas.style.display = 'block';
      if (dropzoneNotice) dropzoneNotice.style.display = 'none';

      const ctx = ocrCanvas.getContext('2d');
      const isSideways = rotationAngle === 90 || rotationAngle === 270;
      const rawW = rawImage.naturalWidth || rawImage.width;
      const rawH = rawImage.naturalHeight || rawImage.height;
      const width = isSideways ? rawH : rawW;
      const height = isSideways ? rawW : rawH;

      ocrCanvas.width = width;
      ocrCanvas.height = height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Apply Rotation
      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotationAngle * Math.PI) / 180);
      ctx.drawImage(rawImage, -rawW / 2, -rawH / 2);
      ctx.restore();

      // Apply Filters
      if (isGrayscale || isBinarized) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (isBinarized) {
            gray = gray >= 135 ? 255 : 0;
          }
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Draw Bounding Boxes
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

    // Toolbar Operations
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

    if (btnGrayscale) {
      btnGrayscale.addEventListener('click', () => {
        if (!rawImage) return;
        isGrayscale = !isGrayscale;
        isBinarized = false;
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
      });
    }

    if (btnBinarize) {
      btnBinarize.addEventListener('click', () => {
        if (!rawImage) return;
        isBinarized = !isBinarized;
        isGrayscale = false;
        updateToolbarState();
        ocrBoxes = [];
        renderCanvas();
      });
    }

    if (btnResetImage) {
      btnResetImage.addEventListener('click', () => {
        if (!rawImage) return;
        rotationAngle = 0;
        isGrayscale = false;
        isBinarized = false;
        ocrBoxes = [];
        updateToolbarState();
        renderCanvas();
        showToast('🔄 已重置影像效果');
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
      if (btnGrayscale) btnGrayscale.classList.toggle('active', isGrayscale);
      if (btnBinarize) btnBinarize.classList.toggle('active', isBinarized);
    }

    // 4. OCR Execution
    async function runOcr() {
      if (!rawImage || isProcessingOcr) return;

      if (!window.Tesseract) {
        showToast('❌ 正在載入 Tesseract OCR 模組，請稍候...');
        return;
      }

      isProcessingOcr = true;
      const lang = ocrLangSelect ? ocrLangSelect.value || 'chi_tra+eng' : 'chi_tra+eng';
      
      if (progressContainer) progressContainer.style.display = 'block';
      if (progressStatusText) progressStatusText.innerText = '正在初始化 OCR 辨識引擎...';
      if (progressBarFill) progressBarFill.style.width = '10%';
      if (progressPercentText) progressPercentText.innerText = '10%';

      try {
        const result = await Tesseract.recognize(ocrCanvas, lang, {
          logger: m => {
            if (m.status === 'recognizing text') {
              const pct = Math.round(m.progress * 100);
              if (progressBarFill) progressBarFill.style.width = `${pct}%`;
              if (progressPercentText) progressPercentText.innerText = `${pct}%`;
              if (progressStatusText) progressStatusText.innerText = `正在分析影像與萃取文字 (${pct}%)...`;
            } else if (m.status) {
              if (progressStatusText) progressStatusText.innerText = `正在載入 ${lang} 語言模型...`;
            }
          }
        });

        const text = (result && result.data && result.data.text) ? result.data.text.trim() : '';
        if (textareaSource) {
          textareaSource.value = text;
        }
        updateWordCounts();

        const confidence = result && result.data ? Math.round(result.data.confidence || 0) : 0;
        if (ocrConfidence) {
          ocrConfidence.innerText = `辨識信心度：${confidence}%`;
        }

        if (result && result.data && result.data.words && result.data.words.length > 0) {
          ocrBoxes = result.data.words;
          renderCanvas();
        }

        if (progressContainer) progressContainer.style.display = 'none';
        isProcessingOcr = false;
        showToast('🎉 OCR 文字辨識完成！');

        // Auto trigger translation
        if (text.length > 0) {
          runTranslation();
        }
      } catch (err) {
        console.error('OCR Error:', err);
        if (progressContainer) progressContainer.style.display = 'none';
        isProcessingOcr = false;
        showToast('❌ OCR 辨識失敗，請嘗試旋轉或調整對比');
      }
    }

    // 5. Translation Engine
    async function runTranslation() {
      const text = textareaSource ? textareaSource.value.trim() : '';
      if (!text) {
        showToast('❌ 請先輸入或辨識出原文內容！');
        return;
      }

      let srcLang = sourceLangSelect ? sourceLangSelect.value : 'auto';
      const tgtLang = targetLangSelect ? targetLangSelect.value : 'en';

      // Auto Language Detection
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

    // Swap Languages
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

    // 6. Action Handlers (Copy, TTS, Export, Clear)
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

    // Copy Buttons
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

    // Text-To-Speech (TTS)
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

    // Clear Buttons
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

    // Export Buttons
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

  // Auto initialize on DOMContentLoaded or immediate
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
