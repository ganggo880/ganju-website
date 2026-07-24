/**
 * Main Application Logic
 * State management, event handling, live preview, batch zip export
 */

class PhotoWatermarkApp {
  constructor() {
    // Array of photo objects: { id, file, img, exif, canvas }
    this.photos = [];
    this.currentIndex = 0;

    // Default configuration options matching Gangju brand
    this.options = {
      style: 'property-badge', // 'property-badge', 'film-stamp', 'elegant-signature'
      customTextMain: '港居不動產',
      customTextSub: '高雄市小港區物業巡檢紀錄',
      dateSource: 'exif', // 'exif', 'file', 'custom'
      customDate: '',
      dateFormat: 'YYYY-MM-DD HH:mm',
      showDate: true,
      showText: true,
      showExifParams: true,
      showCamera: true,
      position: 'bottom-right',
      fontSizeScale: 100,
      margin: 40,
      opacity: 90,
      textColor: '#C5A059',
      bgColor: '#0F2341',
      fontFamily: "'Noto Sans TC', sans-serif"
    };

    this.initElements();
    this.loadSavedPresets();
    this.bindEvents();
  }

  initElements() {
    // Buttons & Inputs
    this.fileInput = document.getElementById('photo-upload-input');
    this.dropzoneArea = document.getElementById('dropzone-area');
    this.canvasViewport = document.getElementById('canvas-viewport');
    this.canvasContainer = document.getElementById('canvas-container');
    this.mainCanvas = document.getElementById('main-canvas');
    this.thumbnailStrip = document.getElementById('thumbnail-strip');
    this.photoCountSpan = document.getElementById('photo-count');
    this.btnClearAll = document.getElementById('btn-clear-all');
    this.exportBar = document.getElementById('export-bar');
    this.btnSavePreset = document.getElementById('btn-save-preset');

    // Controls
    this.inputCustomTextMain = document.getElementById('custom-text-main');
    this.inputCustomTextSub = document.getElementById('custom-text-sub');
    this.selectDateSource = document.getElementById('date-source-select');
    this.customDatePickerGroup = document.getElementById('custom-date-picker-group');
    this.inputCustomDate = document.getElementById('custom-date-input');
    this.selectDateFormat = document.getElementById('date-format-select');

    // Checkboxes
    this.chkShowDate = document.getElementById('chk-show-date');
    this.chkShowText = document.getElementById('chk-show-text');
    this.chkShowExifParams = document.getElementById('chk-show-exif-params');
    this.chkShowCamera = document.getElementById('chk-show-camera');

    // Position & Sliders
    this.selectPosition = document.getElementById('position-select');
    this.sliderFontSize = document.getElementById('font-size-slider');
    this.valFontSize = document.getElementById('font-size-val');
    this.sliderMargin = document.getElementById('margin-slider');
    this.valMargin = document.getElementById('margin-val');
    this.sliderOpacity = document.getElementById('opacity-slider');
    this.valOpacity = document.getElementById('opacity-val');

    // Colors & Font
    this.pickerTextColor = document.getElementById('color-picker-text');
    this.hexTextColor = document.getElementById('color-text-hex');
    this.pickerBgColor = document.getElementById('color-picker-bg');
    this.hexBgColor = document.getElementById('color-bg-hex');
    this.selectFontFamily = document.getElementById('font-family-select');

    // Style Cards
    this.styleCards = document.querySelectorAll('.style-card');

    // Tabs
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    // EXIF Details Card
    this.exifDetailsCard = document.getElementById('exif-details-card');

    // Info overlay
    this.canvasDimInfo = document.getElementById('canvas-dim-info');
    this.canvasFilename = document.getElementById('canvas-filename');

    // Region Chips
    this.regionChips = document.querySelectorAll('.region-chip');

    // Downloads & Capacity Limit
    this.btnDownloadSingle = document.getElementById('btn-download-single');
    this.btnDownloadBatch = document.getElementById('btn-download-batch');
    this.outputQuality = document.getElementById('output-quality');
    this.outputFormat = document.getElementById('output-format');
    this.outputSizeLimit = document.getElementById('output-size-limit');
    this.customSizeInput = document.getElementById('custom-size-input');
  }

  bindEvents() {
    // 0. Region Chips Selection
    this.regionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.regionChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const regionName = chip.dataset.region;
        const newSubText = regionName === '全區/外縣市' ? '物業巡檢紀錄' : `高雄市${regionName}物業巡檢紀錄`;
        this.options.customTextSub = newSubText;
        this.inputCustomTextSub.value = newSubText;
        this.updatePreview();
      });
    });

    // 1. File Uploading
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.canvasViewport.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      this.canvasViewport.addEventListener(eventName, () => {
        this.dropzoneArea.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.canvasViewport.addEventListener(eventName, () => {
        this.dropzoneArea.classList.remove('dragover');
      }, false);
    });

    this.canvasViewport.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      this.handleFileSelect(files);
    });

    // 2. Clear All
    this.btnClearAll.addEventListener('click', () => this.clearAllPhotos());

    // 3. Tab switching
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tabBtns.forEach(b => b.classList.remove('active'));
        this.tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // 4. Style Cards Switching
    this.styleCards.forEach(card => {
      card.addEventListener('click', () => {
        this.styleCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.options.style = card.dataset.style;

        // Auto-adjust default text color for film stamp style if not manually set
        if (this.options.style === 'film-stamp' && this.options.textColor === '#ffffff') {
          this.options.textColor = '#ff9800';
          this.pickerTextColor.value = '#ff9800';
          this.hexTextColor.value = '#FF9800';
        }
        this.updatePreview();
      });
    });

    // 5. Form Controls Input Binds
    this.inputCustomTextMain.addEventListener('input', (e) => {
      this.options.customTextMain = e.target.value;
      this.updatePreview();
    });

    this.inputCustomTextSub.addEventListener('input', (e) => {
      this.options.customTextSub = e.target.value;
      this.updatePreview();
    });

    this.selectDateSource.addEventListener('change', (e) => {
      this.options.dateSource = e.target.value;
      this.customDatePickerGroup.style.display = (e.target.value === 'custom') ? 'block' : 'none';
      this.updatePreview();
    });

    this.inputCustomDate.addEventListener('input', (e) => {
      this.options.customDate = e.target.value;
      this.updatePreview();
    });

    this.selectDateFormat.addEventListener('change', (e) => {
      this.options.dateFormat = e.target.value;
      this.updatePreview();
    });

    // Checkboxes
    [this.chkShowDate, this.chkShowText, this.chkShowExifParams, this.chkShowCamera].forEach(chk => {
      chk.addEventListener('change', () => {
        this.options.showDate = this.chkShowDate.checked;
        this.options.showText = this.chkShowText.checked;
        this.options.showExifParams = this.chkShowExifParams.checked;
        this.options.showCamera = this.chkShowCamera.checked;
        this.updatePreview();
      });
    });

    // Position & Sliders
    this.selectPosition.addEventListener('change', (e) => {
      this.options.position = e.target.value;
      this.updatePreview();
    });

    this.sliderFontSize.addEventListener('input', (e) => {
      this.options.fontSizeScale = parseInt(e.target.value);
      this.valFontSize.textContent = `${this.options.fontSizeScale}%`;
      this.updatePreview();
    });

    this.sliderMargin.addEventListener('input', (e) => {
      this.options.margin = parseInt(e.target.value);
      this.valMargin.textContent = `${this.options.margin}px`;
      this.updatePreview();
    });

    this.sliderOpacity.addEventListener('input', (e) => {
      this.options.opacity = parseInt(e.target.value) / 100;
      this.valOpacity.textContent = `${e.target.value}%`;
      this.updatePreview();
    });

    // Colors
    this.pickerTextColor.addEventListener('input', (e) => {
      this.options.textColor = e.target.value;
      this.hexTextColor.value = e.target.value.toUpperCase();
      this.updatePreview();
    });

    this.pickerBgColor.addEventListener('input', (e) => {
      this.options.bgColor = e.target.value;
      this.hexBgColor.value = e.target.value.toUpperCase();
      this.updatePreview();
    });

    this.selectFontFamily.addEventListener('change', (e) => {
      this.options.fontFamily = e.target.value;
      this.updatePreview();
    });

    // Capacity limit toggle
    this.outputSizeLimit.addEventListener('change', (e) => {
      this.customSizeInput.style.display = (e.target.value === 'custom') ? 'inline-block' : 'none';
    });

    // Preset Saver
    this.btnSavePreset.addEventListener('click', () => this.savePresets());

    // Downloads
    this.btnDownloadSingle.addEventListener('click', () => this.downloadSinglePhoto());
    this.btnDownloadBatch.addEventListener('click', () => this.downloadBatchZip());
  }

  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    for (const file of fileList) {
      await this.processImageFile(file);
    }

    this.updateThumbnailsUI();
    if (this.photos.length > 0 && this.currentIndex === -1) {
      this.selectPhoto(0);
    } else {
      this.selectPhoto(this.photos.length - fileList.length);
    }
  }

  processImageFile(file) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Parse EXIF
          const exif = await ExifParser.parseFile(file);
          exif.fileLastModified = file.lastModified;

          const photoObj = {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file: file,
            img: img,
            exif: exif
          };

          this.photos.push(photoObj);
          resolve(photoObj);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  updateThumbnailsUI() {
    this.photoCountSpan.textContent = this.photos.length;
    this.thumbnailStrip.innerHTML = '';

    if (this.photos.length === 0) {
      this.dropzoneArea.style.display = 'flex';
      this.canvasContainer.style.display = 'none';
      this.exportBar.style.display = 'none';
      this.btnClearAll.style.display = 'none';
      this.renderExifTab(null);
      return;
    }

    this.dropzoneArea.style.display = 'none';
    this.canvasContainer.style.display = 'flex';
    this.exportBar.style.display = 'flex';
    this.btnClearAll.style.display = 'inline-flex';

    this.photos.forEach((photo, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `thumb-item ${idx === this.currentIndex ? 'active' : ''}`;
      
      const img = document.createElement('img');
      img.src = photo.img.src;
      thumb.appendChild(img);

      const btnRemove = document.createElement('button');
      btnRemove.className = 'thumb-remove';
      btnRemove.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      btnRemove.onclick = (e) => {
        e.stopPropagation();
        this.removePhoto(idx);
      };
      thumb.appendChild(btnRemove);

      thumb.onclick = () => this.selectPhoto(idx);
      this.thumbnailStrip.appendChild(thumb);
    });
  }

  selectPhoto(index) {
    if (index < 0 || index >= this.photos.length) return;
    this.currentIndex = index;

    // Update active thumb
    const thumbs = this.thumbnailStrip.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
      if (i === index) t.classList.add('active');
      else t.classList.remove('active');
    });

    const photo = this.photos[this.currentIndex];
    this.canvasFilename.textContent = photo.file.name;
    this.renderExifTab(photo.exif);
    this.updatePreview();
  }

  removePhoto(index) {
    this.photos.splice(index, 1);
    if (this.currentIndex >= this.photos.length) {
      this.currentIndex = this.photos.length - 1;
    }
    this.updateThumbnailsUI();
    if (this.photos.length > 0) {
      this.selectPhoto(this.currentIndex);
    }
  }

  clearAllPhotos() {
    this.photos = [];
    this.currentIndex = 0;
    this.updateThumbnailsUI();
  }

  updatePreview() {
    if (this.photos.length === 0 || this.currentIndex < 0) return;

    const currentPhoto = this.photos[this.currentIndex];
    
    // Render full canvas using WatermarkEngine
    const renderedCanvas = WatermarkEngine.render(currentPhoto.img, currentPhoto.exif, this.options);

    // Display on viewport main-canvas
    this.mainCanvas.width = renderedCanvas.width;
    this.mainCanvas.height = renderedCanvas.height;
    const ctx = this.mainCanvas.getContext('2d');
    ctx.drawImage(renderedCanvas, 0, 0);

    // Update dimension label
    this.canvasDimInfo.textContent = `${renderedCanvas.width} × ${renderedCanvas.height} px`;
  }

  renderExifTab(exif) {
    if (!exif) {
      this.exifDetailsCard.innerHTML = `
        <div class="empty-exif-msg">
          <i class="fa-regular fa-image"></i>
          <p>尚無照片或請選擇照片檢視 EXIF 資訊</p>
        </div>`;
      return;
    }

    const items = [
      { key: '拍攝日期', val: exif.dateTaken ? ExifParser.formatDate(exif.dateTaken, 'YYYY-MM-DD HH:mm:ss') : '無 EXIF 日期' },
      { key: '相機品牌', val: exif.cameraMake || '未提供' },
      { key: '相機型號', val: exif.cameraModel || '未提供' },
      { key: '鏡頭型號', val: exif.lensModel || '未提供' },
      { key: '光圈 (Aperture)', val: exif.aperture || '未提供' },
      { key: '快門速度 (Shutter)', val: exif.shutterSpeed || '未提供' },
      { key: 'ISO 感光度', val: exif.iso || '未提供' },
      { key: '焦距 (Focal Length)', val: exif.focalLength || '未提供' },
      { key: 'GPS 座標', val: exif.gpsLocation || '無 GPS 資料' }
    ];

    this.exifDetailsCard.innerHTML = items.map(item => `
      <div class="exif-item">
        <span class="exif-key">${item.key}</span>
        <span class="exif-val">${item.val}</span>
      </div>
    `).join('');
  }

  savePresets() {
    try {
      localStorage.setItem('exif_watermark_presets', JSON.stringify(this.options));
      alert('✅ 成功儲存當前浮水印與文字設定！下次開啟頁面將自動套用。');
    } catch (e) {
      console.error(e);
    }
  }

  loadSavedPresets() {
    try {
      const saved = localStorage.getItem('exif_watermark_presets');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.options = { ...this.options, ...parsed };

        // Apply options to UI form controls
        this.inputCustomTextMain.value = this.options.customTextMain || '';
        this.inputCustomTextSub.value = this.options.customTextSub || '';
        this.selectDateSource.value = this.options.dateSource || 'exif';
        this.selectDateFormat.value = this.options.dateFormat || 'YYYY-MM-DD HH:mm';
        
        this.chkShowDate.checked = this.options.showDate;
        this.chkShowText.checked = this.options.showText;
        this.chkShowExifParams.checked = this.options.showExifParams;
        this.chkShowCamera.checked = this.options.showCamera;

        this.selectPosition.value = this.options.position;
        this.sliderFontSize.value = this.options.fontSizeScale;
        this.valFontSize.textContent = `${this.options.fontSizeScale}%`;

        this.pickerTextColor.value = this.options.textColor;
        this.hexTextColor.value = this.options.textColor.toUpperCase();
        this.pickerBgColor.value = this.options.bgColor;
        this.hexBgColor.value = this.options.bgColor.toUpperCase();
        this.selectFontFamily.value = this.options.fontFamily;

        // Activate style card
        this.styleCards.forEach(card => {
          if (card.dataset.style === this.options.style) card.classList.add('active');
          else card.classList.remove('active');
        });
      }
    } catch (e) {
      console.warn('Could not load saved presets', e);
    }
  }

  /**
   * Helper to export canvas blob adhering strictly to target max MB size limit
   */
  async exportCanvasWithTargetSize(canvas, mimeType, initialQuality = 0.85) {
    let limitOption = this.outputSizeLimit.value;
    let targetMaxMB = null;

    if (limitOption === 'custom') {
      const customVal = parseFloat(this.customSizeInput.value);
      if (!isNaN(customVal) && customVal > 0) {
        targetMaxMB = customVal;
      }
    } else if (limitOption !== 'unlimited') {
      targetMaxMB = parseFloat(limitOption);
    }

    // Unlimited size limit
    if (!targetMaxMB || isNaN(targetMaxMB) || targetMaxMB <= 0) {
      return new Promise(resolve => canvas.toBlob(resolve, mimeType, initialQuality));
    }

    const maxSizeBytes = targetMaxMB * 1024 * 1024;
    let currentQuality = initialQuality;
    let currentCanvas = canvas;
    let scale = 1.0;

    for (let attempt = 0; attempt < 12; attempt++) {
      const blob = await new Promise(resolve => currentCanvas.toBlob(resolve, mimeType, currentQuality));
      if (!blob) break;

      // Check if size fits under limit
      if (blob.size <= maxSizeBytes) {
        return blob;
      }

      // If blob is larger than target limit:
      if (mimeType === 'image/png') {
        // PNG is lossless, reduce canvas dimensions
        scale *= 0.85;
      } else {
        // JPEG / WEBP: lower quality step first
        if (currentQuality > 0.3) {
          currentQuality = Math.max(0.15, currentQuality - 0.15);
        } else {
          // If quality already low, downscale canvas dimensions
          scale *= 0.8;
          currentQuality = 0.75;
        }
      }

      // Resize canvas to smaller scale
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = Math.max(100, Math.round(canvas.width * scale));
      scaledCanvas.height = Math.max(100, Math.round(canvas.height * scale));
      const sCtx = scaledCanvas.getContext('2d');
      sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
      currentCanvas = scaledCanvas;
    }

    return new Promise(resolve => currentCanvas.toBlob(resolve, mimeType, currentQuality));
  }

  async downloadSinglePhoto() {
    if (this.photos.length === 0 || this.currentIndex < 0) return;

    const currentPhoto = this.photos[this.currentIndex];
    const renderedCanvas = WatermarkEngine.render(currentPhoto.img, currentPhoto.exif, this.options);

    const initialQuality = parseFloat(this.outputQuality.value);
    const mimeType = this.outputFormat.value;
    const ext = mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg');

    const baseName = currentPhoto.file.name.replace(/\.[^/.]+$/, "");
    const downloadName = `${baseName}_watermark${ext}`;

    this.btnDownloadSingle.disabled = true;
    const origBtnText = this.btnDownloadSingle.innerHTML;
    this.btnDownloadSingle.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 處理中...';

    try {
      const blob = await this.exportCanvasWithTargetSize(renderedCanvas, mimeType, initialQuality);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download single error:', err);
      alert('下載檔案失敗：' + err.message);
    } finally {
      this.btnDownloadSingle.disabled = false;
      this.btnDownloadSingle.innerHTML = origBtnText;
    }
  }

  async downloadBatchZip() {
    if (this.photos.length === 0) return;
    if (typeof JSZip === 'undefined') {
      alert('JSZip 函式庫未載入，請刷新頁面再試');
      return;
    }

    const zip = new JSZip();
    const initialQuality = parseFloat(this.outputQuality.value);
    const mimeType = this.outputFormat.value;
    const ext = mimeType === 'image/png' ? '.png' : (mimeType === 'image/webp' ? '.webp' : '.jpg');

    this.btnDownloadBatch.disabled = true;
    const origText = this.btnDownloadBatch.innerHTML;
    this.btnDownloadBatch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 處理與打包中...';

    try {
      for (let i = 0; i < this.photos.length; i++) {
        const photo = this.photos[i];
        const canvas = WatermarkEngine.render(photo.img, photo.exif, this.options);

        const blob = await this.exportCanvasWithTargetSize(canvas, mimeType, initialQuality);
        const baseName = photo.file.name.replace(/\.[^/.]+$/, "");
        zip.file(`${baseName}_watermark${ext}`, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked_photos_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('ZIP generation failed:', err);
      alert('打包 ZIP 過程發生錯誤：' + err.message);
    } finally {
      this.btnDownloadBatch.disabled = false;
      this.btnDownloadBatch.innerHTML = origText;
    }
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PhotoWatermarkApp();
});
