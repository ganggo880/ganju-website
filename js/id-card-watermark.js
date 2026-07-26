// 港居身份證照裁剪與租賃水印工具
// 座標系統說明：
//   - 裁剪框以「原圖像素座標」描述 (cropCenter + cropW/cropH)，永遠被夾在原圖範圍內
//   - 輸出畫布為固定解析度 (outWidth × outWidth/ratio) + 上下左右 padding 空白帶
//   - 水印優先畫在 padding 空白帶上；空白不足時才壓在照片邊緣

const OUTPUT_PRESETS = {
  '1011': { w: 1011, label: '300 DPI' },
  '674': { w: 674, label: '200 DPI' },
  '506': { w: 506, label: '150 DPI' }
};

class IDCardWatermarkApp {
  constructor() {
    this.canvas = document.getElementById('main-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.uploadInput = document.getElementById('photo-upload-input');

    this.image = null;
    this.imageName = '';

    // 裁剪框狀態（原圖像素座標）
    this.cropCX = 0;
    this.cropCY = 0;

    this.dragging = false;
    this.dragStart = null;

    this.settings = {
      aspectRatio: 1.585,
      zoom: 100,
      padding: 0,
      bgColor: '#FFFFFF',
      outputWidth: 1011,
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

    this.loadSettings();
    this.setupEventListeners();
    this.applySettingsToUI();
  }

  /* ---------- 裁剪幾何 ---------- */

  // zoom 100% = 最大可容納的裁剪框；zoom 越大裁得越緊（真正的放大）
  getCropSize() {
    const ratio = this.settings.aspectRatio;
    const iw = this.image.width;
    const ih = this.image.height;

    // 先求「以此比例能塞進原圖的最大矩形」
    let baseW = iw;
    let baseH = baseW / ratio;
    if (baseH > ih) {
      baseH = ih;
      baseW = baseH * ratio;
    }

    const factor = this.settings.zoom / 100;
    let w = baseW / factor;
    let h = baseH / factor;

    // 夾住：裁剪框不得大於原圖（zoom < 100% 時會觸發）
    if (w > iw) { w = iw; h = w / ratio; }
    if (h > ih) { h = ih; w = h * ratio; }

    return { w, h };
  }

  // 把裁剪框中心夾回合法範圍，確保四邊都落在原圖內
  clampCenter() {
    const { w, h } = this.getCropSize();
    const halfW = w / 2;
    const halfH = h / 2;
    this.cropCX = Math.min(Math.max(this.cropCX, halfW), this.image.width - halfW);
    this.cropCY = Math.min(Math.max(this.cropCY, halfH), this.image.height - halfH);
  }

  centerCrop() {
    this.cropCX = this.image.width / 2;
    this.cropCY = this.image.height / 2;
    this.clampCenter();
  }

  resetZoom() {
    this.settings.zoom = 100;
    document.getElementById('zoom-slider').value = 100;
    document.getElementById('zoom-value').textContent = '100%';
    this.centerCrop();
  }

  /* ---------- 繪製 ---------- */

  redraw() {
    if (!this.image) return;
    this.clampCenter();

    const { w: cropW, h: cropH } = this.getCropSize();
    const outW = this.settings.outputWidth;
    const outH = Math.round(outW / this.settings.aspectRatio);
    const pad = this.settings.padding;

    this.canvas.width = outW + pad * 2;
    this.canvas.height = outH + pad * 2;

    this.ctx.fillStyle = this.settings.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const sx = this.cropCX - cropW / 2;
    const sy = this.cropCY - cropH / 2;

    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(this.image, sx, sy, cropW, cropH, pad, pad, outW, outH);

    this.drawWatermark(pad, outW, outH);
    this.updateInfo(cropW, cropH);
  }

  drawWatermark(pad, outW, outH) {
    const text = this.settings.watermarkText.trim();
    if (this.settings.watermarkPosition === 'none' || !text) return;

    const positions = this.settings.watermarkPosition === 'top-bottom'
      ? ['top', 'bottom']
      : [this.settings.watermarkPosition];

    positions.forEach(pos => this.drawWatermarkAt(pos, text, pad, outW, outH));
  }

  drawWatermarkAt(position, text, pad, outW, outH) {
    const fontSize = this.settings.fontSize;
    const weight = this.settings.bold ? '700' : '400';
    const bandH = fontSize + 12;

    this.ctx.font = `${weight} ${fontSize}px ${this.settings.fontFamily}`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const x = pad + outW / 2;

    // 空白帶塞得下就畫在空白處（使用者要的行為）；塞不下才壓在照片邊緣
    const inMargin = pad >= bandH;
    let y;
    if (position === 'top') {
      y = inMargin ? pad / 2 : pad + bandH / 2;
    } else {
      y = inMargin ? pad + outH + pad / 2 : pad + outH - bandH / 2;
    }

    if (this.settings.bannerBg) {
      const bandW = this.ctx.measureText(text).width + 24;
      this.ctx.globalAlpha = this.settings.bannerOpacity / 100;
      this.ctx.fillStyle = this.settings.bannerColor;
      this.ctx.fillRect(x - bandW / 2, y - bandH / 2, bandW, bandH);
      this.ctx.globalAlpha = 1;
    }

    this.ctx.globalAlpha = this.settings.fontOpacity / 100;
    this.ctx.fillStyle = this.settings.fontColor;
    this.ctx.fillText(text, x, y);
    this.ctx.globalAlpha = 1;
  }

  updateInfo(cropW, cropH) {
    const info = document.getElementById('canvas-info');
    if (!info) return;
    const marginNote = this.settings.padding >= this.settings.fontSize + 12
      ? '水印於空白帶'
      : '水印壓於照片邊緣（加大邊距可移至空白處）';
    info.textContent = `輸出 ${this.canvas.width}×${this.canvas.height}px｜取樣 ${Math.round(cropW)}×${Math.round(cropH)}｜${marginNote}`;
  }

  /* ---------- 拖曳定位 ---------- */

  setupDrag() {
    const canvas = this.canvas;

    const toImageDelta = (dxScreen, dyScreen) => {
      const { w: cropW } = this.getCropSize();
      const displayScale = canvas.clientWidth / canvas.width; // CSS 縮放
      const outScale = cropW / this.settings.outputWidth;      // 畫布→原圖
      const k = outScale / displayScale;
      return { dx: dxScreen * k, dy: dyScreen * k };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (!this.image) return;
      this.dragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY, cx: this.cropCX, cy: this.cropCY };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      e.preventDefault();
      const { dx, dy } = toImageDelta(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y);
      // 拖曳畫面向右 = 裁剪框向左移
      this.cropCX = this.dragStart.cx - dx;
      this.cropCY = this.dragStart.cy - dy;
      this.redraw();
    });

    const endDrag = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      canvas.style.cursor = 'grab';
      if (e.pointerId !== undefined && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
  }

  /* ---------- 事件 ---------- */

  setupEventListeners() {
    this.uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadImage(file);
    });

    const viewport = document.getElementById('canvas-viewport');
    viewport.addEventListener('dragover', (e) => {
      e.preventDefault();
      viewport.classList.add('is-dragover');
    });
    viewport.addEventListener('dragleave', () => viewport.classList.remove('is-dragover'));
    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      viewport.classList.remove('is-dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this.loadImage(file);
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn));
    });

    // 裁剪：比例變更必須重置縮放與置中，否則裁剪框會跑出原圖
    this.bind('aspect-ratio', 'change', (el) => {
      this.settings.aspectRatio = parseFloat(el.value);
      if (this.image) this.resetZoom();
    });

    this.bindRange('zoom-slider', 'zoom-value', '%', (v) => {
      this.settings.zoom = v;
    });

    document.getElementById('btn-center').addEventListener('click', () => {
      if (!this.image) return;
      this.centerCrop();
      this.redraw();
    });

    document.getElementById('btn-fit').addEventListener('click', () => {
      if (!this.image) return;
      this.resetZoom();
      this.redraw();
    });

    this.bindColor('bg-color', 'bg-color-hex', (v) => { this.settings.bgColor = v; });
    this.bindRange('padding-slider', 'padding-value', 'px', (v) => { this.settings.padding = v; });

    this.bind('output-width', 'change', (el) => {
      this.settings.outputWidth = parseInt(el.value, 10);
    });

    // 水印
    this.bind('watermark-text', 'input', (el) => { this.settings.watermarkText = el.value; });
    this.bind('watermark-position', 'change', (el) => { this.settings.watermarkPosition = el.value; });
    this.bindRange('font-size-slider', 'font-size-value', 'px', (v) => { this.settings.fontSize = v; });
    this.bindColor('font-color', 'font-color-hex', (v) => { this.settings.fontColor = v; });
    this.bindRange('font-opacity-slider', 'font-opacity-value', '%', (v) => { this.settings.fontOpacity = v; });
    this.bind('font-family', 'change', (el) => { this.settings.fontFamily = el.value; });
    this.bind('chk-bold', 'change', (el) => { this.settings.bold = el.checked; });

    this.bind('chk-banner-bg', 'change', (el) => {
      this.settings.bannerBg = el.checked;
      document.getElementById('banner-settings').style.display = el.checked ? 'block' : 'none';
    });
    this.bindColor('banner-color', 'banner-color-hex', (v) => { this.settings.bannerColor = v; });
    this.bindRange('banner-opacity-slider', 'banner-opacity-value', '%', (v) => { this.settings.bannerOpacity = v; });

    // 輸出
    this.bind('output-format', 'change', (el) => {
      this.settings.outputFormat = el.value;
      this.syncSizeLimitAvailability();
    });
    this.bind('output-size-limit', 'change', (el) => { this.settings.outputSizeLimit = el.value; });

    document.getElementById('btn-download').addEventListener('click', () => this.download());

    this.setupDrag();
  }

  // 通用綁定：更新設定 → 重繪 → 存檔
  bind(id, event, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(event, () => {
      handler(el);
      this.redraw();
      this.saveSettings();
    });
  }

  bindRange(id, labelId, suffix, handler) {
    const el = document.getElementById(id);
    const label = document.getElementById(labelId);
    if (!el) return;
    el.addEventListener('input', () => {
      const v = parseInt(el.value, 10);
      if (label) label.textContent = v + suffix;
      handler(v);
      this.redraw();
      this.saveSettings();
    });
  }

  bindColor(colorId, hexId, handler) {
    const color = document.getElementById(colorId);
    const hex = document.getElementById(hexId);
    if (!color) return;

    color.addEventListener('input', () => {
      handler(color.value);
      if (hex) hex.value = color.value.toUpperCase();
      this.redraw();
      this.saveSettings();
    });

    if (hex) {
      hex.addEventListener('input', () => {
        if (!/^#[0-9A-F]{6}$/i.test(hex.value)) return;
        handler(hex.value);
        color.value = hex.value;
        this.redraw();
        this.saveSettings();
      });
    }
  }

  switchTab(btn) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab).classList.add('active');
  }

  /* ---------- 載入 ---------- */

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.imageName = file.name.replace(/\.[^/.]+$/, '');

        document.getElementById('dropzone-area').style.display = 'none';
        document.getElementById('canvas-container').style.display = 'flex';
        document.getElementById('export-bar').style.display = 'flex';
        this.canvas.style.cursor = 'grab';

        this.resetZoom();
        this.redraw();
      };
      img.onerror = () => this.showToast('⚠ 影像解碼失敗，請換一張照片');
      img.src = e.target.result;
    };
    reader.onerror = () => this.showToast('⚠ 檔案讀取失敗');
    reader.readAsDataURL(file);
  }

  /* ---------- 輸出 ---------- */

  syncSizeLimitAvailability() {
    const note = document.getElementById('size-limit-note');
    if (!note) return;
    note.style.display = this.settings.outputFormat === 'image/png' ? 'inline' : 'none';
  }

  async download() {
    if (!this.image) return;

    const format = this.settings.outputFormat;
    const limitMB = this.settings.outputSizeLimit;
    let blob = await this.toBlob(this.canvas, format, 0.95);

    if (limitMB !== 'unlimited') {
      const limit = parseFloat(limitMB) * 1024 * 1024;

      if (format === 'image/jpeg') {
        // JPEG：逐步降品質
        for (let q = 0.9; q > 0.4 && blob.size > limit; q -= 0.1) {
          blob = await this.toBlob(this.canvas, format, q);
        }
      } else {
        // PNG 不吃 quality，改為逐步縮小尺寸
        let scale = 1;
        while (blob.size > limit && scale > 0.35) {
          scale -= 0.15;
          blob = await this.toBlob(this.scaledCopy(scale), format, 1);
        }
      }

      if (blob.size > limit) {
        this.showToast(`⚠ 已壓至 ${(blob.size / 1024 / 1024).toFixed(2)}MB，仍超過上限`);
      }
    }

    this.downloadBlob(blob);
  }

  toBlob(canvas, type, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }

  scaledCopy(scale) {
    const c = document.createElement('canvas');
    c.width = Math.round(this.canvas.width * scale);
    c.height = Math.round(this.canvas.height * scale);
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(this.canvas, 0, 0, c.width, c.height);
    return c;
  }

  downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    const ext = this.settings.outputFormat === 'image/jpeg' ? 'jpg' : 'png';

    link.href = url;
    link.download = `${this.imageName}_${stamp}_身份證.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`✓ 已下載（${(blob.size / 1024).toFixed(0)} KB）`);
  }

  /* ---------- 設定持久化 ---------- */

  saveSettings() {
    try {
      localStorage.setItem('idCardSettings', JSON.stringify(this.settings));
    } catch (err) {
      // 隱私模式或配額用盡時忽略
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('idCardSettings');
      if (saved) this.settings = { ...this.settings, ...JSON.parse(saved) };
    } catch (err) {
      // 損毀的設定不應擋住工具啟動
    }
  }

  applySettingsToUI() {
    const s = this.settings;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const text = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const check = (id, val) => { const el = document.getElementById(id); if (el) el.checked = val; };

    set('aspect-ratio', s.aspectRatio);
    set('zoom-slider', s.zoom);
    text('zoom-value', s.zoom + '%');
    set('bg-color', s.bgColor);
    set('bg-color-hex', s.bgColor.toUpperCase());
    set('padding-slider', s.padding);
    text('padding-value', s.padding + 'px');
    set('output-width', s.outputWidth);
    set('watermark-text', s.watermarkText);
    set('watermark-position', s.watermarkPosition);
    set('font-size-slider', s.fontSize);
    text('font-size-value', s.fontSize + 'px');
    set('font-color', s.fontColor);
    set('font-color-hex', s.fontColor.toUpperCase());
    set('font-opacity-slider', s.fontOpacity);
    text('font-opacity-value', s.fontOpacity + '%');
    set('font-family', s.fontFamily);
    check('chk-bold', s.bold);
    check('chk-banner-bg', s.bannerBg);
    set('banner-color', s.bannerColor);
    set('banner-color-hex', s.bannerColor.toUpperCase());
    set('banner-opacity-slider', s.bannerOpacity);
    text('banner-opacity-value', s.bannerOpacity + '%');
    set('output-format', s.outputFormat);
    set('output-size-limit', s.outputSizeLimit);

    const bannerSettings = document.getElementById('banner-settings');
    if (bannerSettings) bannerSettings.style.display = s.bannerBg ? 'block' : 'none';
    this.syncSizeLimitAvailability();
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3000);
  }
}

// 行動選單由 js/layout.js 統一處理，此處不得重複綁定
document.addEventListener('DOMContentLoaded', () => {
  new IDCardWatermarkApp();
});
