// 港居身份證照裁剪與水印工具

class IDCardWatermarkApp {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.uploadInput = document.getElementById('photo-upload-input');

    this.image = null;
    this.imageData = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.settings = {
      aspectRatio: 1.585,
      zoom: 100,
      padding: 0,
      bgColor: '#FFFFFF',
      watermarkText: '限租賃房屋使用',
      watermarkPosition: 'bottom',
      fontSize: 24,
      fontColor: '#1A365D',
      fontOpacity: 100,
      fontFamily: "'Noto Sans TC', sans-serif",
      bold: true,
      bannerBg: true,
      bannerColor: '#C5A059',
      bannerOpacity: 70,
      outputFormat: 'image/png',
      outputSizeLimit: 'unlimited'
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
  }

  setupEventListeners() {
    // 檔案上傳
    this.uploadInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // 拖曳
    document.getElementById('canvas-viewport').addEventListener('dragover', (e) => e.preventDefault());
    document.getElementById('canvas-viewport').addEventListener('drop', (e) => this.handleDrop(e));

    // 頁籤切換
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn));
    });

    // 裁剪設定
    document.getElementById('aspect-ratio').addEventListener('change', (e) => {
      this.settings.aspectRatio = parseFloat(e.target.value);
      this.redraw();
    });

    document.getElementById('zoom-slider').addEventListener('input', (e) => {
      this.settings.zoom = parseInt(e.target.value);
      document.getElementById('zoom-value').textContent = e.target.value + '%';
      this.redraw();
    });

    document.getElementById('btn-center').addEventListener('click', () => {
      this.centerCropBox();
      this.redraw();
    });

    document.getElementById('btn-fit').addEventListener('click', () => {
      this.fitCropBox();
      this.redraw();
    });

    document.getElementById('bg-color').addEventListener('input', (e) => {
      this.settings.bgColor = e.target.value;
      document.getElementById('bg-color-hex').value = e.target.value;
      this.redraw();
    });

    document.getElementById('bg-color-hex').addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        this.settings.bgColor = e.target.value;
        document.getElementById('bg-color').value = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('padding-slider').addEventListener('input', (e) => {
      this.settings.padding = parseInt(e.target.value);
      document.getElementById('padding-value').textContent = e.target.value + 'px';
      this.redraw();
    });

    // 水印設定
    document.getElementById('watermark-text').addEventListener('input', (e) => {
      this.settings.watermarkText = e.target.value;
      this.redraw();
    });

    document.getElementById('watermark-position').addEventListener('change', (e) => {
      this.settings.watermarkPosition = e.target.value;
      this.redraw();
    });

    document.getElementById('font-size-slider').addEventListener('input', (e) => {
      this.settings.fontSize = parseInt(e.target.value);
      document.getElementById('font-size-value').textContent = e.target.value + 'px';
      this.redraw();
    });

    document.getElementById('font-color').addEventListener('input', (e) => {
      this.settings.fontColor = e.target.value;
      document.getElementById('font-color-hex').value = e.target.value;
      this.redraw();
    });

    document.getElementById('font-color-hex').addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        this.settings.fontColor = e.target.value;
        document.getElementById('font-color').value = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('font-opacity-slider').addEventListener('input', (e) => {
      this.settings.fontOpacity = parseInt(e.target.value);
      document.getElementById('font-opacity-value').textContent = e.target.value + '%';
      this.redraw();
    });

    document.getElementById('font-family').addEventListener('change', (e) => {
      this.settings.fontFamily = e.target.value;
      this.redraw();
    });

    document.getElementById('chk-bold').addEventListener('change', (e) => {
      this.settings.bold = e.target.checked;
      this.redraw();
    });

    document.getElementById('chk-banner-bg').addEventListener('change', (e) => {
      this.settings.bannerBg = e.target.checked;
      document.getElementById('banner-settings').style.display = e.target.checked ? 'block' : 'none';
      this.redraw();
    });

    document.getElementById('banner-color').addEventListener('input', (e) => {
      this.settings.bannerColor = e.target.value;
      document.getElementById('banner-color-hex').value = e.target.value;
      this.redraw();
    });

    document.getElementById('banner-color-hex').addEventListener('input', (e) => {
      if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        this.settings.bannerColor = e.target.value;
        document.getElementById('banner-color').value = e.target.value;
        this.redraw();
      }
    });

    document.getElementById('banner-opacity-slider').addEventListener('input', (e) => {
      this.settings.bannerOpacity = parseInt(e.target.value);
      document.getElementById('banner-opacity-value').textContent = e.target.value + '%';
      this.redraw();
    });

    // 輸出設定
    document.getElementById('output-format').addEventListener('change', (e) => {
      this.settings.outputFormat = e.target.value;
    });

    document.getElementById('output-size-limit').addEventListener('change', (e) => {
      this.settings.outputSizeLimit = e.target.value;
    });

    // 下載按鈕
    document.getElementById('btn-download').addEventListener('click', () => this.download());
  }

  switchTab(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    this.loadImage(file);
  }

  handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadImage(file);
    }
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.imageData = {
          name: file.name.replace(/\.[^/.]+$/, ''),
          type: file.type
        };

        document.getElementById('dropzone-area').style.display = 'none';
        document.getElementById('canvas-container').style.display = 'flex';
        document.getElementById('export-bar').style.display = 'flex';

        this.fitCropBox();
        this.redraw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  centerCropBox() {
    this.offsetX = (this.image.width - this.getCropWidth()) / 2;
    this.offsetY = (this.image.height - this.getCropHeight()) / 2;
  }

  fitCropBox() {
    const maxWidth = this.image.width;
    const maxHeight = this.image.height;
    const targetRatio = this.settings.aspectRatio;

    let cropWidth, cropHeight;

    if (maxWidth / maxHeight > targetRatio) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * targetRatio;
    } else {
      cropWidth = maxWidth;
      cropHeight = cropWidth / targetRatio;
    }

    this.scale = cropWidth / 256; // 標準寬度 256px
    this.centerCropBox();
  }

  getCropWidth() {
    return 256 * (this.settings.zoom / 100) * this.scale;
  }

  getCropHeight() {
    return this.getCropWidth() / this.settings.aspectRatio;
  }

  redraw() {
    if (!this.image) return;

    const cropWidth = this.getCropWidth();
    const cropHeight = this.getCropHeight();
    const padding = this.settings.padding;

    // 計算畫布尺寸
    this.canvas.width = cropWidth + padding * 2;
    this.canvas.height = cropHeight + padding * 2;

    // 繪製背景
    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 繪製裁剪後的照片
    this.ctx.drawImage(
      this.image,
      this.offsetX, this.offsetY,
      cropWidth, cropHeight,
      padding, padding,
      cropWidth, cropHeight
    );

    // 繪製水印
    this.drawWatermark(padding, cropWidth, cropHeight);
  }

  drawWatermark(padding, cropWidth, cropHeight) {
    if (this.settings.watermarkPosition === 'none' || !this.settings.watermarkText) {
      return;
    }

    const fontSize = this.settings.fontSize;
    const fontFamily = this.settings.fontFamily;
    const fontWeight = this.settings.bold ? '700' : '400';
    const textColor = this.settings.fontColor;
    const textOpacity = this.settings.fontOpacity / 100;

    const positions = this.settings.watermarkPosition === 'top-bottom'
      ? ['top', 'bottom']
      : [this.settings.watermarkPosition];

    positions.forEach(pos => {
      this.drawWatermarkText(
        pos, padding, cropWidth, cropHeight,
        fontSize, fontFamily, fontWeight, textColor, textOpacity
      );
    });
  }

  drawWatermarkText(position, padding, cropWidth, cropHeight, fontSize, fontFamily, fontWeight, textColor, textOpacity) {
    const text = this.settings.watermarkText;
    const bannerHeight = fontSize + 12;

    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const x = padding + cropWidth / 2;
    let y;

    if (position === 'top') {
      y = padding + bannerHeight / 2;
    } else {
      y = padding + cropHeight - bannerHeight / 2;
    }

    // 繪製背景橫幅
    if (this.settings.bannerBg) {
      const metrics = this.ctx.measureText(text);
      const textWidth = metrics.width;
      const bannerWidth = textWidth + 24;

      this.ctx.fillStyle = this.settings.bannerColor;
      this.ctx.globalAlpha = this.settings.bannerOpacity / 100;
      this.ctx.fillRect(x - bannerWidth / 2, y - bannerHeight / 2, bannerWidth, bannerHeight);
      this.ctx.globalAlpha = 1;
    }

    // 繪製文字
    this.ctx.fillStyle = textColor;
    this.ctx.globalAlpha = textOpacity;
    this.ctx.fillText(text, x, y);
    this.ctx.globalAlpha = 1;
  }

  async download() {
    const format = this.settings.outputFormat;
    const quality = 0.95;

    this.canvas.toBlob((blob) => {
      let finalBlob = blob;

      // 容量限制
      if (this.settings.outputSizeLimit !== 'unlimited') {
        const limit = parseFloat(this.settings.outputSizeLimit) * 1024 * 1024;
        if (blob.size > limit) {
          // 簡單降低品質
          this.canvas.toBlob((smallerBlob) => {
            this.downloadBlob(smallerBlob);
          }, format, 0.75);
          return;
        }
      }

      this.downloadBlob(finalBlob);
    }, format, quality);
  }

  downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    const ext = this.settings.outputFormat === 'image/jpeg' ? 'jpg' : 'png';

    link.href = url;
    link.download = `${this.imageData.name}_${timestamp}_身份證.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('✓ 照片已成功下載');
  }

  loadSettings() {
    const saved = localStorage.getItem('idCardSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
      this.applySettingsToUI();
    }
  }

  applySettingsToUI() {
    document.getElementById('aspect-ratio').value = this.settings.aspectRatio;
    document.getElementById('zoom-slider').value = this.settings.zoom;
    document.getElementById('zoom-value').textContent = this.settings.zoom + '%';
    document.getElementById('bg-color').value = this.settings.bgColor;
    document.getElementById('bg-color-hex').value = this.settings.bgColor;
    document.getElementById('padding-slider').value = this.settings.padding;
    document.getElementById('padding-value').textContent = this.settings.padding + 'px';
    document.getElementById('watermark-text').value = this.settings.watermarkText;
    document.getElementById('watermark-position').value = this.settings.watermarkPosition;
    document.getElementById('font-size-slider').value = this.settings.fontSize;
    document.getElementById('font-size-value').textContent = this.settings.fontSize + 'px';
    document.getElementById('font-color').value = this.settings.fontColor;
    document.getElementById('font-color-hex').value = this.settings.fontColor;
    document.getElementById('font-opacity-slider').value = this.settings.fontOpacity;
    document.getElementById('font-opacity-value').textContent = this.settings.fontOpacity + '%';
    document.getElementById('font-family').value = this.settings.fontFamily;
    document.getElementById('chk-bold').checked = this.settings.bold;
    document.getElementById('chk-banner-bg').checked = this.settings.bannerBg;
    document.getElementById('banner-color').value = this.settings.bannerColor;
    document.getElementById('banner-color-hex').value = this.settings.bannerColor;
    document.getElementById('banner-opacity-slider').value = this.settings.bannerOpacity;
    document.getElementById('banner-opacity-value').textContent = this.settings.bannerOpacity + '%';
    document.getElementById('banner-settings').style.display = this.settings.bannerBg ? 'block' : 'none';
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 350);
    }, 3000);
  }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  new IDCardWatermarkApp();

  // 導覽列控制 (共用)
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', navMenu.classList.contains('active'));
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
});
