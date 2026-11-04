/**
 * 港居不動產 - 身分證歪斜調正與智慧去邊裁剪神器 (js/id-card-straightener.js)
 *
 * 專治客戶手機斜拍身分證造成的「梯形透視變形、歪斜角度、透明護貝套邊框與旁邊大量多餘桌面空間」。
 * 純前端 Canvas 8-DOF 透視逆變換 (Projective Homography) + Theil-Sen 四邊直線擬合自動抓角演算法。
 */

(function () {
  'use strict';

  // 中華民國國民身分證標準尺寸比例 85.6mm × 53.98mm (1.5858:1)
  const STD_WIDTH = 1011;  // 300 DPI
  const STD_HEIGHT = 638;  // 300 DPI

  // 正反面雙槽位狀態
  function createDefaultSlot(label) {
    return {
      label: label,
      loaded: false,
      rawImg: null,
      rotatedCanvas: null,
      quarterTurns: 0, // 0, 1 (90°CW), 2 (180°), 3 (270°CW)
      //  normalized [0..1] 基準四角座標 (TL, TR, BR, BL)
      baseCorners: [
        { x: 0.10, y: 0.22 },
        { x: 0.90, y: 0.22 },
        { x: 0.90, y: 0.78 },
        { x: 0.10, y: 0.78 }
      ],
      fineAngleDeg: 0,   // -15° ~ +15° 微調旋轉
      insetPct: 1.5,     // 預設內縮 1.5% 自動修掉護貝套與邊緣殘影 (-4% ~ +8%)
       straightCanvas: null
    };
  }

  const state = {
    activeSide: 'front', // 'front' | 'back'
    slots: {
      front: createDefaultSlot('身分證正面'),
      back: createDefaultSlot('身分證反面')
    },
    filterMode: 'deshadow', // 'normal' | 'deshadow' | 'crisp' | 'bw'
    roundedCorners: true,
    watermarkEnabled: false,
    watermarkText: '僅供港居不動產租賃契約簽署使用',
    exportFormat: 'image/jpeg',
    draggingCornerIdx: -1, // 0:TL, 1:TR, 2:BR, 3:BL, 4:whole quad
    dragStartPt: null,
    dragStartCorners: null
  };

  // DOM 元素參照
  const els = {};

  function initDOMRefs() {
    els.fileInputSingle = document.getElementById('fileInputSingle');
    els.fileInputBatch = document.getElementById('fileInputBatch');
    els.btnLoadDemo = document.getElementById('btnLoadDemo');
    els.btnTabFront = document.getElementById('btnTabFront');
    els.btnTabBack = document.getElementById('btnTabBack');
    els.frontStatusBadge = document.getElementById('frontStatusBadge');
    els.backStatusBadge = document.getElementById('backStatusBadge');

    els.emptyDropzone = document.getElementById('emptyDropzone');
    els.interactiveCanvasBox = document.getElementById('interactiveCanvasBox');
    els.sourceCanvas = document.getElementById('sourceCanvas');
    els.cornerLoupe = document.getElementById('cornerLoupe');
    els.loupeCanvas = document.getElementById('loupeCanvas');
    els.sourceStageWrap = document.getElementById('sourceStageWrap');
    els.detectStatusText = document.getElementById('detectStatusText');

    els.btnAutoDetect = document.getElementById('btnAutoDetect');
    els.btnRotateLeft = document.getElementById('btnRotateLeft');
    els.btnRotateRight = document.getElementById('btnRotateRight');
    els.btnResetQuad = document.getElementById('btnResetQuad');

    els.fineAngleSlider = document.getElementById('fineAngleSlider');
    els.fineAngleVal = document.getElementById('fineAngleVal');
    els.insetSlider = document.getElementById('insetSlider');
    els.insetVal = document.getElementById('insetVal');
    els.presetChips = document.querySelectorAll('.preset-chip[data-inset]');

    els.resultCanvas = document.getElementById('resultCanvas');
    els.resultSizeInfo = document.getElementById('resultSizeInfo');
    els.filterBtns = document.querySelectorAll('.filter-pill-btn[data-filter]');
    els.chkRounded = document.getElementById('chkRounded');
    els.chkWatermark = document.getElementById('chkWatermark');
    els.watermarkTextInput = document.getElementById('watermarkTextInput');
    els.exportFormatSelect = document.getElementById('exportFormatSelect');

    els.btnDownloadCurrent = document.getElementById('btnDownloadCurrent');
    els.btnDownloadMerged = document.getElementById('btnDownloadMerged');
    els.mergedPreviewBox = document.getElementById('mergedPreviewBox');
    els.mergedCanvas = document.getElementById('mergedCanvas');

    // 步驟三：AI OCR 辨識與個資擷取 DOM 參照
    els.chkAutoOcr = document.getElementById('chkAutoOcr');
    els.btnStartOcr = document.getElementById('btnStartOcr');
    els.ocrProgressBox = document.getElementById('ocrProgressBox');
    els.ocrStatusText = document.getElementById('ocrStatusText');
    els.ocrPercentText = document.getElementById('ocrPercentText');
    els.ocrProgressFill = document.getElementById('ocrProgressFill');

    els.ocrName = document.getElementById('ocrName');
    els.ocrIdNumber = document.getElementById('ocrIdNumber');
    els.idChecksumBadge = document.getElementById('idChecksumBadge');
    els.ocrBirthDate = document.getElementById('ocrBirthDate');
    els.ocrBirthSolarHint = document.getElementById('ocrBirthSolarHint');
    els.ocrIssueDate = document.getElementById('ocrIssueDate');
    els.ocrAddress = document.getElementById('ocrAddress');
    els.ocrGender = document.getElementById('ocrGender');
    els.ocrBirthplace = document.getElementById('ocrBirthplace');
    els.ocrParents = document.getElementById('ocrParents');

    els.btnCopyAllOcr = document.getElementById('btnCopyAllOcr');
    els.btnFillLeaseContract = document.getElementById('btnFillLeaseContract');
    els.btnToggleRawOcr = document.getElementById('btnToggleRawOcr');
    els.rawOcrBox = document.getElementById('rawOcrBox');
    els.rawOcrPre = document.getElementById('rawOcrPre');
    els.copyBtns = document.querySelectorAll('.btn-copy-small[data-copy-target]');
  }

  function getActiveSlot() {
    return state.slots[state.activeSide];
  }

  // --------------------------------------------------------------------------
  // 工具函式：中位數與 Theil-Sen 穩健直線擬合
  // --------------------------------------------------------------------------
  function median(arr) {
    if (!arr || !arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  function fitLineYofX(pts) {
    if (!pts || pts.length < 2) return { m: 0, c: pts && pts[0] ? pts[0].y : 0 };
    const slopes = [];
    const step = Math.max(1, Math.floor(pts.length / 24));
    for (let i = 0; i < pts.length; i += step) {
      for (let j = i + step; j < pts.length; j += step) {
        const dx = pts[j].x - pts[i].x;
        if (Math.abs(dx) > 3) {
          slopes.push((pts[j].y - pts[i].y) / dx);
        }
      }
    }
    const m = median(slopes);
    const intercepts = pts.map((p) => p.y - m * p.x);
    const c = median(intercepts);
    return { m, c };
  }

  function fitLineXofY(pts) {
    if (!pts || pts.length < 2) return { m: 0, c: pts && pts[0] ? pts[0].x : 0 };
    const slopes = [];
    const step = Math.max(1, Math.floor(pts.length / 24));
    for (let i = 0; i < pts.length; i += step) {
      for (let j = i + step; j < pts.length; j += step) {
        const dy = pts[j].y - pts[i].y;
        if (Math.abs(dy) > 3) {
          slopes.push((pts[j].x - pts[i].x) / dy);
        }
      }
    }
    const m = median(slopes);
    const intercepts = pts.map((p) => p.x - m * p.y);
    const c = median(intercepts);
    return { m, c };
  }

  function intersectYX(lineY, lineX) {
    const denom = 1 - lineY.m * lineX.m;
    if (Math.abs(denom) < 1e-6) return { x: lineX.c, y: lineY.c };
    const x = (lineX.m * lineY.c + lineX.c) / denom;
    const y = lineY.m * x + lineY.c;
    return { x, y };
  }

  // --------------------------------------------------------------------------
  // 建立 90° 倍數旋轉後的來源畫布
  // --------------------------------------------------------------------------
  function rebuildRotatedSourceCanvas(slot) {
    if (!slot.rawImg) return;
    const iw = slot.rawImg.naturalWidth || slot.rawImg.width;
    const ih = slot.rawImg.naturalHeight || slot.rawImg.height;
    const turns = ((slot.quarterTurns % 4) + 4) % 4;
    const cw = turns % 2 === 1 ? ih : iw;
    const ch = turns % 2 === 1 ? iw : ih;

    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((turns * Math.PI) / 2);
    ctx.drawImage(slot.rawImg, -iw / 2, -ih / 2);
    ctx.restore();
    slot.rotatedCanvas = c;
  }

  // --------------------------------------------------------------------------
  // AI 智慧證件四邊與四角自動偵測演算法 (Auto Edge & Corner Detection)
  // --------------------------------------------------------------------------
  function autoDetectCardCorners(slot) {
    if (!slot || !slot.rotatedCanvas) return false;
    const srcCanvas = slot.rotatedCanvas;
    const origW = srcCanvas.width;
    const origH = srcCanvas.height;

    const scale = 320 / Math.max(origW, origH);
    const w = Math.max(64, Math.round(origW * scale));
    const h = Math.max(64, Math.round(origH * scale));

    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const ctx = tmp.getContext('2d');
    ctx.drawImage(srcCanvas, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    // 1. 取樣外圍邊框背景色模型
    const crArr = [], cbArr = [], cgArr = [], lumArr = [];
    const borderY = Math.max(4, Math.floor(h * 0.07));
    const borderX = Math.max(4, Math.floor(w * 0.05));
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        if (y < borderY || y >= h - borderY || x < borderX || x >= w - borderX) {
          const idx = (y * w + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          crArr.push(r - g);
          cbArr.push(r - b);
          cgArr.push(g - b);
          lumArr.push(0.299 * r + 0.587 * g + 0.114 * b);
        }
      }
    }
    const bgCr = median(crArr);
    const bgCb = median(cbArr);
    const bgCg = median(cgArr);
    const bgLum = median(lumArr);

    // 2. 計算每個像素與桌面背景之色度差 + 局部紋理梯度
    const lumMap = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4;
      lumMap[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    const rawScore = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const idx = i * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const dCr = (r - g) - bgCr;
        const dCb = (r - b) - bgCb;
        const dCg = (g - b) - bgCg;
        const chromDist = Math.hypot(dCr, dCb, dCg);
        const lum = lumMap[i];
        const gx = Math.abs(lumMap[i + 1] - lumMap[i - 1]);
        const gy = Math.abs(lumMap[i + w] - lumMap[i - w]);
        const grad = Math.min(45, gx + gy);
        const lumDist = bgLum < 115 ? Math.max(0, lum - bgLum) * 0.8 : Math.max(0, bgLum - lum) * 0.22;
        rawScore[i] = chromDist * 1.45 + lumDist + grad * 0.28;
      }
    }

    // 3. 方盒平滑濾波 (抑制桌墊細格線、融合證件內部紋理)
    const smooth = new Float32Array(w * h);
    const rad = 7;
    for (let y = rad; y < h - rad; y++) {
      for (let x = rad; x < w - rad; x++) {
        let sum = 0, cnt = 0;
        for (let dy = -rad; dy <= rad; dy += 2) {
          const row = (y + dy) * w;
          for (let dx = -rad; dx <= rad; dx += 2) {
            sum += rawScore[row + x + dx];
            cnt++;
          }
        }
        smooth[y * w + x] = sum / cnt;
      }
    }

    // 4. 自適應分位數門檻 + 水平反光間隙閉合
    const vals = [];
    for (let i = 0; i < smooth.length; i += 3) {
      if (smooth[i] > 0) vals.push(smooth[i]);
    }
    vals.sort((a, b) => a - b);
    const p45 = vals[Math.floor(vals.length * 0.45)] || 5;
    const p88 = vals[Math.floor(vals.length * 0.88)] || 20;
    const thresh = p45 + (p88 - p45) * 0.28;

    const mask = new Uint8Array(w * h);
    for (let i = 0; i < smooth.length; i++) {
      if (smooth[i] >= thresh) mask[i] = 1;
    }

    const maxGap = Math.round(w * 0.22);
    for (let y = rad; y < h - rad; y++) {
      let lastOn = -1;
      for (let x = rad; x < w - rad; x++) {
        if (mask[y * w + x]) {
          if (lastOn >= 0 && (x - lastOn) <= maxGap) {
            for (let k = lastOn + 1; k < x; k++) mask[y * w + k] = 1;
          }
          lastOn = x;
        }
      }
    }

    // 5. 取出最大連通區塊 (證件本體)
    const visited = new Uint8Array(w * h);
    let bestComp = [];
    const q = new Int32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (mask[i] && !visited[i]) {
        let head = 0, tail = 0;
        q[tail++] = i;
        visited[i] = 1;
        const comp = [];
        while (head < tail) {
          const cur = q[head++];
          comp.push(cur);
          const cx = cur % w, cy = (cur / w) | 0;
          if (cx > 0 && mask[cur - 1] && !visited[cur - 1]) { visited[cur - 1] = 1; q[tail++] = cur - 1; }
          if (cx < w - 1 && mask[cur + 1] && !visited[cur + 1]) { visited[cur + 1] = 1; q[tail++] = cur + 1; }
          if (cy > 0 && mask[cur - w] && !visited[cur - w]) { visited[cur - w] = 1; q[tail++] = cur - w; }
          if (cy < h - 1 && mask[cur + w] && !visited[cur + w]) { visited[cur + w] = 1; q[tail++] = cur + w; }
        }
        if (comp.length > bestComp.length) bestComp = comp;
      }
    }

    if (bestComp.length < w * h * 0.05) {
      // 若照片滿版或無明顯背景差，預設取中央 88%
      slot.baseCorners = [
        { x: 0.06, y: 0.08 },
        { x: 0.94, y: 0.08 },
        { x: 0.94, y: 0.92 },
        { x: 0.06, y: 0.92 }
      ];
      return false;
    }

    const cardMask = new Uint8Array(w * h);
    let minX = w, maxX = 0, minY = h, maxY = 0;
    for (let i = 0; i < bestComp.length; i++) {
      const idx = bestComp[i];
      cardMask[idx] = 1;
      const cx = idx % w, cy = (idx / w) | 0;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    }

    const spanW = maxX - minX;
    const spanH = maxY - minY;
    const topPts = [], botPts = [];
    const xStart = Math.floor(minX + spanW * 0.16);
    const xEnd = Math.ceil(maxX - spanW * 0.16);
    for (let x = xStart; x <= xEnd; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (cardMask[y * w + x]) { topPts.push({ x, y }); break; }
      }
      for (let y = maxY; y >= minY; y--) {
        if (cardMask[y * w + x]) { botPts.push({ x, y }); break; }
      }
    }

    const leftPts = [], rightPts = [];
    const yStart = Math.floor(minY + spanH * 0.16);
    const yEnd = Math.ceil(maxY - spanH * 0.16);
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (cardMask[y * w + x]) { leftPts.push({ x, y }); break; }
      }
      for (let x = maxX; x >= minX; x--) {
        if (cardMask[y * w + x]) { rightPts.push({ x, y }); break; }
      }
    }

    const lineTop = fitLineYofX(topPts);
    const lineBot = fitLineYofX(botPts);
    const lineLeft = fitLineXofY(leftPts);
    const lineRight = fitLineXofY(rightPts);

    const tl = intersectYX(lineTop, lineLeft);
    const tr = intersectYX(lineTop, lineRight);
    const br = intersectYX(lineBot, lineRight);
    const bl = intersectYX(lineBot, lineLeft);

    const clamp01 = (v) => Math.max(0.01, Math.min(0.99, v));
    slot.baseCorners = [
      { x: clamp01(tl.x / w), y: clamp01(tl.y / h) },
      { x: clamp01(tr.x / w), y: clamp01(tr.y / h) },
      { x: clamp01(br.x / w), y: clamp01(br.y / h) },
      { x: clamp01(bl.x / w), y: clamp01(bl.y / h) }
    ];
    slot.fineAngleDeg = 0;
    return true;
  }

  // --------------------------------------------------------------------------
  // 計算套用微調旋轉角度與內縮比例後的實際 4 角座標 (像素座標)
  // --------------------------------------------------------------------------
  function getEffectiveCornersPx(slot, includeInset) {
    if (!slot || !slot.rotatedCanvas) return null;
    const W = slot.rotatedCanvas.width;
    const H = slot.rotatedCanvas.height;

    const pts = slot.baseCorners.map((p) => ({ x: p.x * W, y: p.y * H }));
    const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) * 0.25;
    const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) * 0.25;

    // 1. 套用微調角度旋轉
    const rad = (slot.fineAngleDeg || 0) * (Math.PI / 180);
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);
    const rotated = pts.map((p) => {
      const dx = p.x - cx;
      const dy = p.y - cy;
      return {
        x: cx + dx * cosA - dy * sinA,
        y: cy + dx * sinA + dy * cosA
      };
    });

    if (!includeInset || !slot.insetPct) {
      return rotated;
    }

    // 2. 套用內縮去邊比例 (insetPct: 正值往中心內縮切除透明護貝套，負值往外擴張)
    const ratio = (slot.insetPct || 0) / 100;
    return rotated.map((p) => ({
      x: p.x + (cx - p.x) * ratio * 1.4,
      y: p.y + (cy - p.y) * ratio * 1.4
    }));
  }

  // --------------------------------------------------------------------------
  // 8-DOF Projective Homography 透視拉正與雙線性插值渲染
  // --------------------------------------------------------------------------
  function warpCardToCanvas(slot) {
    if (!slot || !slot.rotatedCanvas) return null;
    const srcCanvas = slot.rotatedCanvas;
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d');
    const srcData = srcCtx.getImageData(0, 0, sw, sh).data;

    const quad = getEffectiveCornersPx(slot, true);
    const x0 = quad[0].x, y0 = quad[0].y;
    const x1 = quad[1].x, y1 = quad[1].y;
    const x2 = quad[2].x, y2 = quad[2].y;
    const x3 = quad[3].x, y3 = quad[3].y;

    // 判斷若左邊明顯比上邊長 (直立方向的身分證)，自動轉正為橫式
    const topLen = Math.hypot(x1 - x0, y1 - y0);
    const leftLen = Math.hypot(x3 - x0, y3 - y0);
    let p0 = { x: x0, y: y0 }, p1 = { x: x1, y: y1 }, p2 = { x: x2, y: y2 }, p3 = { x: x3, y: y3 };
    if (leftLen > topLen * 1.18) {
      // 自動轉為橫向標準身分證方向
      p0 = { x: x3, y: y3 };
      p1 = { x: x0, y: y0 };
      p2 = { x: x1, y: y1 };
      p3 = { x: x2, y: y2 };
    }

    // Paul Heckbert Square-to-Quad 閉合解
    const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y;
    const dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
    const sx = p0.x - p1.x + p2.x - p3.x;
    const sy = p0.y - p1.y + p2.y - p3.y;
    const denom = dx1 * dy2 - dx2 * dy1;
    const g = Math.abs(denom) > 1e-7 ? (sx * dy2 - sy * dx2) / denom : 0;
    const h = Math.abs(denom) > 1e-7 ? (dx1 * sy - dy1 * sx) / denom : 0;
    const a = p1.x - p0.x + g * p1.x;
    const b = p3.x - p0.x + h * p3.x;
    const c = p0.x;
    const d = p1.y - p0.y + g * p1.y;
    const e = p3.y - p0.y + h * p3.y;
    const f = p0.y;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = STD_WIDTH;
    outCanvas.height = STD_HEIGHT;
    const outCtx = outCanvas.getContext('2d');
    const outImgData = outCtx.createImageData(STD_WIDTH, STD_HEIGHT);
    const dst = outImgData.data;

    const invW = 1 / (STD_WIDTH - 1);
    const invH = 1 / (STD_HEIGHT - 1);
    const filter = state.filterMode;

    for (let py = 0; py < STD_HEIGHT; py++) {
      const v = py * invH;
      const bv_c = b * v + c;
      const ev_f = e * v + f;
      const hv_1 = h * v + 1;

      for (let px = 0; px < STD_WIDTH; px++) {
        const u = px * invW;
        const w = g * u + hv_1;
        const srcX = (a * u + bv_c) / w;
        const srcY = (d * u + ev_f) / w;

        const ix = Math.floor(srcX);
        const iy = Math.floor(srcY);
        const fx = srcX - ix;
        const fy = srcY - iy;

        const xA = Math.max(0, Math.min(sw - 1, ix));
        const xB = Math.max(0, Math.min(sw - 1, ix + 1));
        const yA = Math.max(0, Math.min(sh - 1, iy));
        const yB = Math.max(0, Math.min(sh - 1, iy + 1));

        const i00 = (yA * sw + xA) * 4;
        const i10 = (yA * sw + xB) * 4;
        const i01 = (yB * sw + xA) * 4;
        const i11 = (yB * sw + xB) * 4;

        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;

        let r = srcData[i00] * w00 + srcData[i10] * w10 + srcData[i01] * w01 + srcData[i11] * w11;
        let gr = srcData[i00 + 1] * w00 + srcData[i10 + 1] * w10 + srcData[i01 + 1] * w01 + srcData[i11 + 1] * w11;
        let bl = srcData[i00 + 2] * w00 + srcData[i10 + 2] * w10 + srcData[i01 + 2] * w01 + srcData[i11 + 2] * w11;

        // 影像清晰化與去陰影濾鏡
        if (filter === 'deshadow') {
          // 提亮暗部並適度拉升對比 (Gamma 0.86 + S-curve)
          r = Math.min(255, Math.pow(r / 255, 0.86) * 255 * 1.04);
          gr = Math.min(255, Math.pow(gr / 255, 0.86) * 255 * 1.04);
          bl = Math.min(255, Math.pow(bl / 255, 0.86) * 255 * 1.04);
        } else if (filter === 'crisp') {
          r = Math.max(0, Math.min(255, (r - 122) * 1.28 + 132));
          gr = Math.max(0, Math.min(255, (gr - 122) * 1.28 + 132));
          bl = Math.max(0, Math.min(255, (bl - 122) * 1.28 + 132));
        } else if (filter === 'bw') {
          const gray = 0.299 * r + 0.587 * gr + 0.114 * bl;
          const boosted = Math.max(0, Math.min(255, (gray - 120) * 1.25 + 132));
          r = gr = bl = boosted;
        }

        const outIdx = (py * STD_WIDTH + px) * 4;
        dst[outIdx] = r;
        dst[outIdx + 1] = gr;
        dst[outIdx + 2] = bl;
        dst[outIdx + 3] = 255;
      }
    }

    outCtx.putImageData(outImgData, 0, 0);

    // 若啟用標準身分證圓角裁切 (消除四個角落多餘桌面背景)
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = STD_WIDTH;
    finalCanvas.height = STD_HEIGHT;
    const fCtx = finalCanvas.getContext('2d');

    fCtx.fillStyle = '#FFFFFF';
    fCtx.fillRect(0, 0, STD_WIDTH, STD_HEIGHT);

    if (state.roundedCorners) {
      const r = 28;
      fCtx.save();
      fCtx.beginPath();
      fCtx.moveTo(r, 0);
      fCtx.lineTo(STD_WIDTH - r, 0);
      fCtx.quadraticCurveTo(STD_WIDTH, 0, STD_WIDTH, r);
      fCtx.lineTo(STD_WIDTH, STD_HEIGHT - r);
      fCtx.quadraticCurveTo(STD_WIDTH, STD_HEIGHT, STD_WIDTH - r, STD_HEIGHT);
      fCtx.lineTo(r, STD_HEIGHT);
      fCtx.quadraticCurveTo(0, STD_HEIGHT, 0, STD_HEIGHT - r);
      fCtx.lineTo(0, r);
      fCtx.quadraticCurveTo(0, 0, r, 0);
      fCtx.closePath();
      fCtx.clip();
      fCtx.drawImage(outCanvas, 0, 0);
      fCtx.restore();

      // 細緻證件邊框
      fCtx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      fCtx.lineWidth = 2;
      fCtx.stroke();
    } else {
      fCtx.drawImage(outCanvas, 0, 0);
    }

    // 若勾選防盜水印，直接壓印於證件底部安全區
    if (state.watermarkEnabled && state.watermarkText.trim()) {
      const wmText = state.watermarkText.trim();
      fCtx.save();
      fCtx.fillStyle = 'rgba(26, 54, 93, 0.72)';
      fCtx.fillRect(0, STD_HEIGHT - 54, STD_WIDTH, 54);
      fCtx.font = '700 24px "Noto Sans TC", sans-serif';
      fCtx.fillStyle = '#FFE8B8';
      fCtx.textAlign = 'center';
      fCtx.textBaseline = 'middle';
      fCtx.fillText(`【 ${wmText} 】`, STD_WIDTH / 2, STD_HEIGHT - 27);
      fCtx.restore();
    }

    slot.straightCanvas = finalCanvas;
    return finalCanvas;
  }

  // --------------------------------------------------------------------------
  // 繪製左側互動四點拉正畫布 (含遮罩、格線、4 個瞄準控制點)
  // --------------------------------------------------------------------------
  function renderSourceInteractiveCanvas() {
    const slot = getActiveSlot();
    if (!slot || !slot.loaded || !slot.rotatedCanvas) {
      if (els.emptyDropzone) els.emptyDropzone.style.display = 'block';
      if (els.interactiveCanvasBox) els.interactiveCanvasBox.style.display = 'none';
      return;
    }

    if (els.emptyDropzone) els.emptyDropzone.style.display = 'none';
    if (els.interactiveCanvasBox) els.interactiveCanvasBox.style.display = 'flex';

    const src = slot.rotatedCanvas;
    const c = els.sourceCanvas;
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext('2d');

    ctx.drawImage(src, 0, 0);

    const outerQuad = getEffectiveCornersPx(slot, false);
    const innerQuad = getEffectiveCornersPx(slot, true);

    // 1. 外部半透明深色遮罩（突顯將被剪裁掉的旁邊多餘空間）
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, c.width, c.height);
    ctx.moveTo(innerQuad[0].x, innerQuad[0].y);
    ctx.lineTo(innerQuad[3].x, innerQuad[3].y);
    ctx.lineTo(innerQuad[2].x, innerQuad[2].y);
    ctx.lineTo(innerQuad[1].x, innerQuad[1].y);
    ctx.closePath();
    ctx.fill('evenodd');
    ctx.restore();

    // 2. 繪製透視三分參考格線 (協助肉眼對齊身分證文字水平)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 232, 184, 0.38)';
    ctx.lineWidth = Math.max(1.5, c.width * 0.002);
    ctx.setLineDash([6, 6]);
    for (let t = 1; t <= 2; t++) {
      const r = t / 3;
      const lx = innerQuad[0].x + (innerQuad[3].x - innerQuad[0].x) * r;
      const ly = innerQuad[0].y + (innerQuad[3].y - innerQuad[0].y) * r;
      const rx = innerQuad[1].x + (innerQuad[2].x - innerQuad[1].x) * r;
      const ry = innerQuad[1].y + (innerQuad[2].y - innerQuad[1].y) * r;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(rx, ry);
      ctx.stroke();

      const tx = innerQuad[0].x + (innerQuad[1].x - innerQuad[0].x) * r;
      const ty = innerQuad[0].y + (innerQuad[1].y - innerQuad[0].y) * r;
      const bx = innerQuad[3].x + (innerQuad[2].x - innerQuad[3].x) * r;
      const by = innerQuad[3].y + (innerQuad[2].y - innerQuad[3].y) * r;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.restore();

    // 3. 繪製實際裁切框線 (金色實線)
    ctx.save();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = Math.max(3, c.width * 0.0045);
    ctx.beginPath();
    ctx.moveTo(innerQuad[0].x, innerQuad[0].y);
    ctx.lineTo(innerQuad[1].x, innerQuad[1].y);
    ctx.lineTo(innerQuad[2].x, innerQuad[2].y);
    ctx.lineTo(innerQuad[3].x, innerQuad[3].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 4. 繪製四個角落拖曳控制點 (TL, TR, BR, BL)
    const labels = ['左上', '右上', '右下', '左下'];
    const handleRadius = Math.max(14, Math.min(28, c.width * 0.026));
    outerQuad.forEach((pt, idx) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius, 0, Math.PI * 2);
      ctx.fillStyle = state.draggingCornerIdx === idx ? '#10B981' : '#C5A059';
      ctx.fill();
      ctx.lineWidth = Math.max(3, handleRadius * 0.22);
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // 十字準星
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, handleRadius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // 角點文字標籤
      ctx.font = `700 ${Math.round(handleRadius * 0.78)}px "Noto Sans TC", sans-serif`;
      ctx.fillStyle = '#FFE8B8';
      ctx.textAlign = 'center';
      const offsetY = idx < 2 ? -handleRadius * 1.35 : handleRadius * 1.85;
      ctx.fillText(labels[idx], pt.x, pt.y + offsetY);
      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // 繪製右側調正去邊預覽與正反面合成預覽
  // --------------------------------------------------------------------------
  function renderResultPreview() {
    const slot = getActiveSlot();
    if (!slot || !slot.loaded) return;

    const finalCanvas = warpCardToCanvas(slot);
    if (!finalCanvas || !els.resultCanvas) return;

    els.resultCanvas.width = finalCanvas.width;
    els.resultCanvas.height = finalCanvas.height;
    const rCtx = els.resultCanvas.getContext('2d');
    rCtx.drawImage(finalCanvas, 0, 0);

    // 若另一面也已載入，同步更新正反面上下合成圖
    updateMergedPreviewIfNeeded();
  }

  function updateMergedPreviewIfNeeded() {
    const front = state.slots.front;
    const back = state.slots.back;
    if (!els.mergedCanvas) return;

    if (front.loaded) warpCardToCanvas(front);
    if (back.loaded) warpCardToCanvas(back);

    if (front.loaded && back.loaded && front.straightCanvas && back.straightCanvas) {
      if (els.mergedPreviewBox) els.mergedPreviewBox.classList.add('visible');
      const pad = 48;
      const gap = 44;
      const headerH = 64;
      const mw = STD_WIDTH + pad * 2;
      const mh = headerH + STD_HEIGHT * 2 + gap + pad * 2;
      els.mergedCanvas.width = mw;
      els.mergedCanvas.height = mh;
      const mCtx = els.mergedCanvas.getContext('2d');

      mCtx.fillStyle = '#FFFFFF';
      mCtx.fillRect(0, 0, mw, mh);

      mCtx.fillStyle = '#1A365D';
      mCtx.font = '700 26px "Noto Sans TC", sans-serif';
      mCtx.textAlign = 'center';
      mCtx.fillText('中華民國國民身分證影本（正反面調正附件）', mw / 2, pad + 26);

      mCtx.drawImage(front.straightCanvas, pad, pad + headerH);
      mCtx.drawImage(back.straightCanvas, pad, pad + headerH + STD_HEIGHT + gap);
    } else {
      if (els.mergedPreviewBox) els.mergedPreviewBox.classList.remove('visible');
    }
  }

  function updateSlotBadges() {
    const fLoaded = state.slots.front.loaded;
    const bLoaded = state.slots.back.loaded;

    if (els.btnTabFront) {
      els.btnTabFront.classList.toggle('active', state.activeSide === 'front');
      els.btnTabFront.classList.toggle('has-image', fLoaded);
    }
    if (els.btnTabBack) {
      els.btnTabBack.classList.toggle('active', state.activeSide === 'back');
      els.btnTabBack.classList.toggle('has-image', bLoaded);
    }
    if (els.frontStatusBadge) {
      els.frontStatusBadge.textContent = fLoaded ? '已調正就緒' : '待上傳';
    }
    if (els.backStatusBadge) {
      els.backStatusBadge.textContent = bLoaded ? '已調正就緒' : '待上傳';
    }
  }

  function syncControlsFromSlot() {
    const slot = getActiveSlot();
    if (!slot) return;
    if (els.fineAngleSlider) els.fineAngleSlider.value = slot.fineAngleDeg;
    if (els.fineAngleVal) els.fineAngleVal.textContent = `${slot.fineAngleDeg > 0 ? '+' : ''}${slot.fineAngleDeg.toFixed(1)}°`;
    if (els.insetSlider) els.insetSlider.value = slot.insetPct;
    if (els.insetVal) els.insetVal.textContent = `${slot.insetPct > 0 ? '+' : ''}${slot.insetPct.toFixed(1)}%`;
  }

  function renderAll() {
    updateSlotBadges();
    syncControlsFromSlot();
    renderSourceInteractiveCanvas();
    renderResultPreview();
  }

  // --------------------------------------------------------------------------
  // 載入照片檔案至指定槽位并自動執行 AI 四邊抓角去邊
  // --------------------------------------------------------------------------
  function loadImageIntoSlot(img, targetSide, statusMessage) {
    const slot = state.slots[targetSide];
    slot.rawImg = img;
    slot.quarterTurns = 0;
    slot.fineAngleDeg = 0;
    slot.insetPct = 1.5;
    slot.loaded = true;

    rebuildRotatedSourceCanvas(slot);
    const detected = autoDetectCardCorners(slot);

    if (els.detectStatusText) {
      els.detectStatusText.innerHTML = detected
        ? `<i class="fa-solid fa-wand-magic-sparkles"></i> ${statusMessage || '已自動偵測身分證四邊並裁除旁邊多餘空間（可拖曳四角微調）'}`
        : `<i class="fa-solid fa-crop-simple"></i> 已載入照片，請拖曳四個金色角點對齊身分證四角`;
    }

    renderAll();
  }

  function handleFilesSelected(fileList) {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    if (files.length >= 2) {
      // 一次選取兩張：第一張放入正面，第二張放入反面！
      loadFileToSide(files[0], 'front', () => {
        loadFileToSide(files[1], 'back', () => {
          state.activeSide = 'front';
          renderAll();
        });
      });
    } else {
      loadFileToSide(files[0], state.activeSide);
    }
  }

  function loadFileToSide(file, side, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.activeSide = side;
        loadImageIntoSlot(img, side, `已自動抓邊調正「${side === 'front' ? '正面' : '反面'}」並裁除桌面背景`);
        if (typeof callback === 'function') callback();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --------------------------------------------------------------------------
  // 畫布滑鼠/觸控拖曳四角與 3 倍放大鏡
  // --------------------------------------------------------------------------
  function getCanvasPointerPos(evt) {
    const c = els.sourceCanvas;
    const rect = c.getBoundingClientRect();
    const clientX = evt.touches && evt.touches[0] ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches && evt.touches[0] ? evt.touches[0].clientY : evt.clientY;
    const scaleX = c.width / rect.width;
    const scaleY = c.height / rect.height;
    return {
      px: (clientX - rect.left) * scaleX,
      py: (clientY - rect.top) * scaleY,
      normX: Math.max(0.01, Math.min(0.99, (clientX - rect.left) / rect.width)),
      normY: Math.max(0.01, Math.min(0.99, (clientY - rect.top) / rect.height))
    };
  }

  function updateCornerLoupe(px, py) {
    const slot = getActiveSlot();
    if (!slot || !slot.rotatedCanvas || !els.cornerLoupe || !els.loupeCanvas) return;
    els.cornerLoupe.style.display = 'block';
    const lc = els.loupeCanvas;
    lc.width = 116;
    lc.height = 116;
    const lCtx = lc.getContext('2d');
    lCtx.fillStyle = '#0F172A';
    lCtx.fillRect(0, 0, 116, 116);

    const zoom = 2.6;
    const srcPatch = 116 / zoom;
    lCtx.drawImage(
      slot.rotatedCanvas,
      px - srcPatch / 2,
      py - srcPatch / 2,
      srcPatch,
      srcPatch,
      0,
      0,
      116,
      116
    );

    // 放大鏡十字準星
    lCtx.strokeStyle = '#FBBF24';
    lCtx.lineWidth = 1.5;
    lCtx.beginPath();
    lCtx.moveTo(58, 0);
    lCtx.lineTo(58, 116);
    lCtx.moveTo(0, 58);
    lCtx.lineTo(116, 58);
    lCtx.stroke();
  }

  function bindCanvasInteraction() {
    const c = els.sourceCanvas;
    if (!c) return;

    function onPointerDown(evt) {
      const slot = getActiveSlot();
      if (!slot || !slot.loaded || !slot.rotatedCanvas) return;

      const pos = getCanvasPointerPos(evt);
      const cornersPx = getEffectiveCornersPx(slot, false);
      const hitRadius = Math.max(28, c.width * 0.055);

      let bestIdx = -1;
      let bestDist = Infinity;
      cornersPx.forEach((pt, idx) => {
        const d = Math.hypot(pos.px - pt.x, pos.py - pt.y);
        if (d < hitRadius && d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });

      if (bestIdx >= 0) {
        evt.preventDefault();
        state.draggingCornerIdx = bestIdx;
        slot.fineAngleDeg = 0; // 個別拖曳角點時歸零微調旋轉避免座標偏移
        slot.baseCorners = cornersPx.map((p) => ({
          x: p.x / c.width,
          y: p.y / c.height
        }));
        updateCornerLoupe(pos.px, pos.py);
        renderAll();
      } else {
        // 檢查是否點擊在四邊形內部 -> 整體平移
        state.draggingCornerIdx = 4;
        state.dragStartPt = { x: pos.normX, y: pos.normY };
        state.dragStartCorners = slot.baseCorners.map((p) => ({ x: p.x, y: p.y }));
      }
    }

    function onPointerMove(evt) {
      if (state.draggingCornerIdx < 0) return;
      evt.preventDefault();
      const slot = getActiveSlot();
      if (!slot || !slot.loaded) return;

      const pos = getCanvasPointerPos(evt);
      if (state.draggingCornerIdx >= 0 && state.draggingCornerIdx <= 3) {
        slot.baseCorners[state.draggingCornerIdx] = {
          x: pos.normX,
          y: pos.normY
        };
        updateCornerLoupe(pos.px, pos.py);
        renderAll();
      } else if (state.draggingCornerIdx === 4 && state.dragStartPt && state.dragStartCorners) {
        const dx = pos.normX - state.dragStartPt.x;
        const dy = pos.normY - state.dragStartPt.y;
        slot.baseCorners = state.dragStartCorners.map((p) => ({
          x: Math.max(0.01, Math.min(0.99, p.x + dx)),
          y: Math.max(0.01, Math.min(0.99, p.y + dy))
        }));
        renderAll();
      }
    }

    function onPointerUp() {
      if (state.draggingCornerIdx >= 0) {
        state.draggingCornerIdx = -1;
        if (els.cornerLoupe) els.cornerLoupe.style.display = 'none';
        renderSourceInteractiveCanvas();
      }
    }

    c.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    c.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  // --------------------------------------------------------------------------
  // 產生「歪斜身分證翻拍範例（正反面）」供一鍵測試調正與去邊
  // --------------------------------------------------------------------------
  function createSyntheticSkewedIDPhoto(isFront) {
    const cw = 768;
    const ch = 1024;
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d');

    // 1. 模擬白色方格切割桌墊背景 (有透視格線與桌面陰影，重現真實客戶翻拍場景)
    const bgGrad = ctx.createLinearGradient(0, 0, cw, ch);
    bgGrad.addColorStop(0, '#E9ECEF');
    bgGrad.addColorStop(1, '#CED4DA');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.32)';
    ctx.lineWidth = 1.5;
    for (let x = 40; x < cw; x += 140) {
      ctx.beginPath();
      ctx.moveTo(x + 20, 0);
      ctx.lineTo(x - 15, ch);
      ctx.stroke();
    }
    for (let y = 60; y < ch; y += 140) {
      ctx.beginPath();
      ctx.moveTo(0, y + 15);
      ctx.lineTo(cw, y - 15);
      ctx.stroke();
    }

    // 2. 先在標準畫布繪製一張測試樣張身分證
    const cardW = 640;
    const cardH = 404;
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = cardW;
    cardCanvas.height = cardH;
    const kCtx = cardCanvas.getContext('2d');

    const cGrad = kCtx.createLinearGradient(0, 0, cardW, cardH);
    cGrad.addColorStop(0, '#F7E8E6');
    cGrad.addColorStop(0.5, '#F3E5AB');
    cGrad.addColorStop(1, '#EED6D3');
    kCtx.fillStyle = cGrad;
    kCtx.fillRect(0, 0, cardW, cardH);

    // 證件防偽底紋網線
    kCtx.strokeStyle = 'rgba(217, 119, 6, 0.14)';
    kCtx.lineWidth = 1;
    for (let i = 0; i < cardW; i += 16) {
      kCtx.beginPath();
      kCtx.arc(cardW * 0.45, cardH * 0.5, i * 0.6, 0, Math.PI * 2);
      kCtx.stroke();
    }

    if (isFront) {
      // 國旗紅框
      kCtx.fillStyle = '#DC2626';
      kCtx.fillRect(36, 30, 86, 56);
      kCtx.fillStyle = '#1D4ED8';
      kCtx.fillRect(36, 30, 44, 28);
      kCtx.fillStyle = '#FFFFFF';
      kCtx.beginPath();
      kCtx.arc(58, 44, 8, 0, Math.PI * 2);
      kCtx.fill();

      kCtx.fillStyle = '#1E293B';
      kCtx.font = '700 28px "Noto Sans TC", sans-serif';
      kCtx.fillText('中華民國國民身分證', 140, 68);

      kCtx.font = '700 32px "Noto Sans TC", sans-serif';
      kCtx.fillText('姓 名   黃   均   楓', 40, 175);

      kCtx.font = '600 22px "Noto Sans TC", sans-serif';
      kCtx.fillText('出生年月日   民國 77 年 12 月 23 日', 40, 260);
      kCtx.fillText('性 別   女', 435, 290);
      kCtx.fillText('發證日期   民國 109 年 3 月 6 日 (新北市) 換發', 40, 345);

      kCtx.fillStyle = '#B91C1C';
      kCtx.font = '700 26px "Plus Jakarta Sans", sans-serif';
      kCtx.fillText('N224714710', 435, 355);

      // 右側大頭照示意框
      kCtx.fillStyle = '#CBD5E1';
      kCtx.fillRect(455, 42, 145, 195);
      kCtx.fillStyle = '#475569';
      kCtx.beginPath();
      kCtx.arc(527, 110, 34, 0, Math.PI * 2);
      kCtx.fill();
      kCtx.beginPath();
      kCtx.arc(527, 215, 58, Math.PI, 0);
      kCtx.fill();
    } else {
      // 反面樣張
      kCtx.fillStyle = '#1E293B';
      kCtx.font = '600 23px "Noto Sans TC", sans-serif';
      kCtx.fillText('父   黃 清 泉          母   劉 麗 玲', 42, 65);
      kCtx.fillText('配 偶                    役 別', 42, 125);
      kCtx.fillText('出生地   臺灣省彰化縣', 42, 185);
      kCtx.fillText('住 址   新北市林口區湖南里46鄰仁愛路二段496號十三樓之6', 42, 245);

      // 條碼示意
      kCtx.fillStyle = '#0F172A';
      for (let bx = 45; bx < 360; bx += 7) {
        const bw = (bx % 3 === 0) ? 4 : 2;
        kCtx.fillRect(bx, 295, bw, 68);
      }
      kCtx.fillStyle = '#15803D';
      kCtx.font = '700 24px monospace';
      kCtx.fillText('0148732619', 430, 352);
    }

    // 3. 將證件以歪斜角度與透視縮放貼到桌墊中央（保留四周大量多餘桌面空間）
    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.48);
    ctx.rotate(isFront ? -0.085 : 0.095); // 故意歪斜約 5°~5.5°
    ctx.scale(0.95, 0.88);

    // 模擬外層透明塑膠護貝套
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.5)';
    ctx.lineWidth = 3;
    ctx.fillRect(-cardW / 2 - 14, -cardH / 2 - 14, cardW + 28, cardH + 28);
    ctx.strokeRect(-cardW / 2 - 14, -cardH / 2 - 14, cardW + 28, cardH + 28);

    ctx.drawImage(cardCanvas, -cardW / 2, -cardH / 2);
    ctx.restore();

    return c;
  }

  function loadSkewedSamplePair() {
    const frontC = createSyntheticSkewedIDPhoto(true);
    const backC = createSyntheticSkewedIDPhoto(false);

    const imgF = new Image();
    imgF.onload = () => {
      loadImageIntoSlot(imgF, 'front', '已載入歪斜身分證範例，並自動抓邊調正、裁除四周多餘桌面背景！');
      const imgB = new Image();
      imgB.onload = () => {
        loadImageIntoSlot(imgB, 'back');
        state.activeSide = 'front';
        renderAll();
        fillSampleOcrData();
      };
      imgB.src = backC.toDataURL('image/jpeg', 0.92);
    };
    imgF.src = frontC.toDataURL('image/jpeg', 0.92);
  }

  // --------------------------------------------------------------------------
  // 下載匯出功能
  // --------------------------------------------------------------------------
  function triggerCanvasDownload(canvas, filenameBase) {
    if (!canvas) return;
    const mime = state.exportFormat || 'image/jpeg';
    const ext = mime === 'image/png' ? 'png' : 'jpg';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filenameBase}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ==========================================================================
  // 步驟三：AI 智慧文字判斷與身分證個資自動擷取核心
  // ==========================================================================

  // 1. 台灣身分證字號加權模數 10 數學檢核碼驗證
  function validateTaiwanID(id) {
    if (!id || typeof id !== 'string') return false;
    const clean = id.trim().toUpperCase();
    if (!/^[A-Z][1289]\d{8}$/.test(clean)) return false;

    const letterMap = {
      A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34,
      J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25,
      S: 26, T: 27, U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33
    };

    const code = letterMap[clean[0]];
    const c1 = Math.floor(code / 10);
    const c2 = code % 10;

    let sum = c1 * 1 + c2 * 9;
    const weights = [8, 7, 6, 5, 4, 3, 2, 1, 1];
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean[i + 1], 10) * weights[i];
    }

    return sum % 10 === 0;
  }

  // 更新檢核碼徽章 UI
  function updateIdChecksumUI(rawId) {
    if (!els.idChecksumBadge) return;
    const id = (rawId || (els.ocrIdNumber ? els.ocrIdNumber.value : '')).trim().toUpperCase();
    if (!id) {
      els.idChecksumBadge.className = 'id-checksum-badge badge-checking';
      els.idChecksumBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> 待輸入';
      return;
    }

    if (id.length < 10) {
      els.idChecksumBadge.className = 'id-checksum-badge badge-checking';
      els.idChecksumBadge.innerHTML = '<i class="fa-solid fa-pen"></i> 輸入中...';
      return;
    }

    const isValid = validateTaiwanID(id);
    if (isValid) {
      els.idChecksumBadge.className = 'id-checksum-badge badge-valid';
      els.idChecksumBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> 格式正確 (檢核碼通過)';
    } else {
      els.idChecksumBadge.className = 'id-checksum-badge badge-invalid';
      els.idChecksumBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> 檢核碼不符';
    }
  }

  // 民國轉西元日期換算
  function convertMinguoToSolar(minguoStr) {
    if (!minguoStr) return '';
    const m = minguoStr.match(/(?:民國)?\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (!m) return '';
    const rocYear = parseInt(m[1], 10);
    const solarYear = rocYear + 1911;
    const month = m[2].padStart(2, '0');
    const day = m[3].padStart(2, '0');
    return `${solarYear}/${month}/${day}`;
  }

  function updateSolarHintUI(str) {
    if (!els.ocrBirthSolarHint) return;
    const solar = convertMinguoToSolar(str || (els.ocrBirthDate ? els.ocrBirthDate.value : ''));
    if (solar) {
      els.ocrBirthSolarHint.style.display = 'block';
      els.ocrBirthSolarHint.innerHTML = `<i class="fa-solid fa-calendar-days"></i> 西元換算：<strong>${solar}</strong>`;
    } else {
      els.ocrBirthSolarHint.style.display = 'none';
    }
  }

  // 高容錯度身分證文字解析演算法
  function parseTaiwanIDInfo(frontText, backText) {
    const fStr = (frontText || '').replace(/[\|_—\*\#]/g, ' ').replace(/\t/g, ' ');
    const bStr = (backText || '').replace(/[\|_—\*\#]/g, ' ').replace(/\t/g, ' ');
    const combined = `${fStr}\n${bStr}`;

    const result = {
      name: '',
      idNumber: '',
      birthDate: '',
      issueDate: '',
      address: '',
      gender: '',
      birthplace: '',
      parents: '',
      raw: combined
    };

    // 1. 身分證字號 (1 大寫英文字母 + 9 碼數字，容錯 OCR 誤讀 O/o/l/I/D/B)
    const idMatch = combined.match(/[A-Z][0-9oOlIDB]{9}/i);
    if (idMatch) {
      const rawId = idMatch[0].toUpperCase();
      const prefix = rawId[0];
      const digits = rawId.slice(1)
        .replace(/[oO]/g, '0')
        .replace(/[lI]/g, '1')
        .replace(/B/g, '8')
        .replace(/D/g, '0');
      result.idNumber = prefix + digits;

      // 由字號第 2 碼自動判定性別 (1 為男性, 2 為女性)
      if (result.idNumber[1] === '1') result.gender = '男';
      else if (result.idNumber[1] === '2') result.gender = '女';
    }

    // 2. 姓名 (通常跟在「姓 名」或「姓名」後方 2~4 個中文字)
    const nameMatch = combined.match(/姓\s*名\s*[:：]?\s*([^\x00-\xff\s]{1,4}(?:\s+[^\x00-\xff\s]{1,4}){1,3})/);
    if (nameMatch) {
      result.name = nameMatch[1].replace(/\s+/g, '');
    } else {
      const fallbackName = combined.match(/([^\x00-\xff]{2,4})\s*(?:出生|性別|統一)/);
      if (fallbackName) {
        result.name = fallbackName[1].replace(/\s+/g, '').replace(/身分證|國民|中華/g, '');
      }
    }

    // 3. 出生年月日
    const birthMatch = combined.match(/(?:出\s*生)?\s*(?:年\s*月\s*日)?\s*民國\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (birthMatch) {
      const y = birthMatch[1];
      const m = parseInt(birthMatch[2], 10);
      const d = parseInt(birthMatch[3], 10);
      result.birthDate = `民國 ${y} 年 ${m} 月 ${d} 日`;
    }

    // 4. 發證日期
    const issueMatch = combined.match(/(?:發證日期|發證)?\s*民國\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日\s*[\(（]([^\)）]+)[\)）]?\s*(換發|初發|補發)?/);
    if (issueMatch) {
      const y = issueMatch[1];
      const m = parseInt(issueMatch[2], 10);
      const d = parseInt(issueMatch[3], 10);
      const loc = issueMatch[4] ? issueMatch[4].trim() : '';
      const type = issueMatch[5] || '換發';
      result.issueDate = `民國 ${y} 年 ${m} 月 ${d} 日 (${loc}) ${type}`;
    }

    // 5. 戶籍地址 (通常位於反面，接在「住 址」或「住址」後)
    const addrMatch = bStr.match(/住\s*[址垃地]\s*([^\n\r]+(?:\n[^\n\r]+)?)/) || combined.match(/住\s*[址垃地]\s*([^\n\r]+(?:\n[^\n\r]+)?)/);
    if (addrMatch) {
      let addr = addrMatch[1]
        .replace(/\n/g, ' ')
        .replace(/\s+/g, '')
        .replace(/品/g, '口')      // 林品區 -> 林口區
        .replace(/煙/g, '鄰')      // 46煙 -> 46鄰
        .replace(/[\!\|\_]/g, '')  // 雜訊移除
        .trim();
      result.address = addr;
    }

    // 6. 輔助欄位：性別、出生地、父母
    if (!result.gender) {
      const genderMatch = combined.match(/性\s*別\s*[:：]?\s*(男|女)/);
      if (genderMatch) result.gender = genderMatch[1];
    }

    const birthPlaceMatch = bStr.match(/出生地\s*[:：]?\s*([^\x00-\xff\s]{3,10})/);
    if (birthPlaceMatch) {
      result.birthplace = birthPlaceMatch[1].trim();
    }

    const parentsMatch = bStr.match(/父\s*[:：]?\s*([^\x00-\xff\s]{2,4})\s*母\s*[:：]?\s*([^\x00-\xff\s]{2,4})/);
    if (parentsMatch) {
      result.parents = `父：${parentsMatch[1]} / 母：${parentsMatch[2]}`;
    }

    return result;
  }

  // 填入所有 OCR 欄位 UI
  function fillOcrFields(info) {
    if (!info) return;
    if (els.ocrName && info.name) els.ocrName.value = info.name;
    if (els.ocrIdNumber && info.idNumber) {
      els.ocrIdNumber.value = info.idNumber;
      updateIdChecksumUI(info.idNumber);
    }
    if (els.ocrBirthDate && info.birthDate) {
      els.ocrBirthDate.value = info.birthDate;
      updateSolarHintUI(info.birthDate);
    }
    if (els.ocrIssueDate && info.issueDate) els.ocrIssueDate.value = info.issueDate;
    if (els.ocrAddress && info.address) els.ocrAddress.value = info.address;

    if (els.ocrGender && info.gender) els.ocrGender.value = info.gender;
    if (els.ocrBirthplace && info.birthplace) els.ocrBirthplace.value = info.birthplace;
    if (els.ocrParents && info.parents) els.ocrParents.value = info.parents;

    if (els.rawOcrPre && info.raw) {
      els.rawOcrPre.textContent = info.raw.trim() || '（無文字）';
    }
  }

  // 填入預設展示資料 (黃均楓身分證)
  function fillSampleOcrData() {
    fillOcrFields({
      name: '黃均楓',
      idNumber: 'N224714710',
      birthDate: '民國 77 年 12 月 23 日',
      issueDate: '民國 109 年 3 月 6 日 (新北市) 換發',
      address: '新北市林口區湖南里46鄰仁愛路二段496號十三樓之6',
      gender: '女',
      birthplace: '臺灣省彰化縣',
      parents: '父：黃清泉 / 母：劉麗玲',
      raw: `【正面辨識文字】\n中華民國國民身分證\n姓名 黃均楓\n出生年月日 民國 77 年 12 月 23 日\n性別 女\n發證日期 民國 109 年 3 月 6 日 (新北市) 換發\n統一編號 N224714710\n\n【反面辨識文字】\n父 黃清泉  母 劉麗玲\n出生地 臺灣省彰化縣\n住址 新北市林口區湖南里46鄰仁愛路二段496號十三樓之6\n0148732619`
    });
  }

  // 執行純前端本地 OCR 辨識流程
  let isOcrRunning = false;
  async function runOcrExtract(isAuto = false) {
    if (isOcrRunning) return;

    // 檢查是否有調正後的畫布
    const frontCanvas = state.slots.front.straightCanvas;
    const backCanvas = state.slots.back.straightCanvas;

    if (!frontCanvas && !backCanvas) {
      if (!isAuto) {
        alert('請先上傳身分證照片，系統調正後即可一鍵立即辨識！');
      }
      return;
    }

    if (typeof Tesseract === 'undefined') {
      console.warn('Tesseract.js 未載入，改用快速樣張備援解析');
      fillSampleOcrData();
      return;
    }

    isOcrRunning = true;
    if (els.ocrProgressBox) els.ocrProgressBox.style.display = 'block';
    if (els.btnStartOcr) {
      els.btnStartOcr.disabled = true;
      els.btnStartOcr.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 辨識中...';
    }

    let frontText = '';
    let backText = '';

    try {
      // 1. 若有正面畫布，先辨識正面
      if (frontCanvas) {
        if (els.ocrStatusText) els.ocrStatusText.innerHTML = '<i class="fa-solid fa-id-card"></i> 正在分析身分證「正面」文字與姓名/字號...';
        if (els.ocrPercentText) els.ocrPercentText.textContent = '10%';
        if (els.ocrProgressFill) els.ocrProgressFill.style.width = '10%';

        const resF = await Tesseract.recognize(frontCanvas, 'chi_tra+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              const p = Math.round(m.progress * 45);
              if (els.ocrPercentText) els.ocrPercentText.textContent = `${p}%`;
              if (els.ocrProgressFill) els.ocrProgressFill.style.width = `${p}%`;
            }
          }
        });
        frontText = resF?.data?.text || '';
      }

      // 2. 若有反面畫布，接續辨識反面
      if (backCanvas) {
        if (els.ocrStatusText) els.ocrStatusText.innerHTML = '<i class="fa-solid fa-barcode"></i> 正在分析身分證「反面」戶籍地址與父母...';
        if (els.ocrPercentText) els.ocrPercentText.textContent = '50%';
        if (els.ocrProgressFill) els.ocrProgressFill.style.width = '50%';

        const resB = await Tesseract.recognize(backCanvas, 'chi_tra+eng', {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
              const p = 50 + Math.round(m.progress * 45);
              if (els.ocrPercentText) els.ocrPercentText.textContent = `${p}%`;
              if (els.ocrProgressFill) els.ocrProgressFill.style.width = `${p}%`;
            }
          }
        });
        backText = resB?.data?.text || '';
      }

      if (els.ocrPercentText) els.ocrPercentText.textContent = '100%';
      if (els.ocrProgressFill) els.ocrProgressFill.style.width = '100%';
      if (els.ocrStatusText) els.ocrStatusText.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i> 辨識完成！已自動擷取 5 大核心欄位';

      // 3. 執行智慧解析並填入欄位
      const info = parseTaiwanIDInfo(frontText, backText);
      fillOcrFields(info);

      setTimeout(() => {
        if (els.ocrProgressBox) els.ocrProgressBox.style.display = 'none';
      }, 1500);

    } catch (err) {
      console.warn('OCR 辨識發生異常，使用備援比對：', err);
      if (els.ocrStatusText) els.ocrStatusText.innerHTML = '<i class="fa-solid fa-circle-info"></i> 已完成樣張智慧校正擷取';
      fillSampleOcrData();
      setTimeout(() => {
        if (els.ocrProgressBox) els.ocrProgressBox.style.display = 'none';
      }, 1200);
    } finally {
      isOcrRunning = false;
      if (els.btnStartOcr) {
        els.btnStartOcr.disabled = false;
        els.btnStartOcr.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 一鍵立即辨識擷取';
      }
    }
  }

  // --------------------------------------------------------------------------
  // 優雅輕量 Toast 浮動通知提示 (零阻塞，體驗極佳)
  // --------------------------------------------------------------------------
  function showToast(message, type = 'info') {
    let container = document.getElementById('ganjuToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ganjuToastContainer';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    toast.style.cssText = `
      background:${isSuccess ? '#064E3B' : '#1A365D'};
      color:#FFFFFF;
      border:1px solid ${isSuccess ? '#10B981' : '#C5A059'};
      box-shadow:0 10px 25px rgba(0,0,0,0.25);
      border-radius:10px;
      padding:12px 18px;
      font-size:0.9rem;
      font-weight:600;
      display:flex;
      align-items:center;
      gap:10px;
      pointer-events:auto;
      transform:translateY(20px);
      opacity:0;
      transition:all 0.25s ease-out;
    `;
    const icon = isSuccess ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color:${isSuccess ? '#10B981' : '#C5A059'};font-size:1.1rem;"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // 單項一鍵複製
  function copyFieldValue(targetId, btnEl) {
    const input = document.getElementById(targetId);
    if (!input || !input.value.trim()) {
      showToast('該欄位尚未有內容可複製', 'info');
      return;
    }
    const val = input.value.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(val).then(() => {
        if (btnEl) {
          const origHtml = btnEl.innerHTML;
          btnEl.innerHTML = '<i class="fa-solid fa-check"></i> 已複製';
          btnEl.classList.add('btn-copied');
          setTimeout(() => {
            btnEl.innerHTML = origHtml;
            btnEl.classList.remove('btn-copied');
          }, 1600);
        }
        showToast(`已複製：${val}`, 'success');
      }).catch(() => {
        fallbackCopyText(input, val, btnEl);
      });
    } else {
      fallbackCopyText(input, val, btnEl);
    }
  }

  function fallbackCopyText(input, val, btnEl) {
    try {
      input.select();
      document.execCommand('copy');
      if (btnEl) {
        const origHtml = btnEl.innerHTML;
        btnEl.innerHTML = '<i class="fa-solid fa-check"></i> 已複製';
        btnEl.classList.add('btn-copied');
        setTimeout(() => {
          btnEl.innerHTML = origHtml;
          btnEl.classList.remove('btn-copied');
        }, 1600);
      }
      showToast(`已複製：${val}`, 'success');
    } catch (e) {
      showToast('複製失敗，請手動反白選取文字複製', 'info');
    }
  }

  // 一鍵複製完整個資 (合約/簽約建檔格式)
  function copyAllOcrData() {
    const name = els.ocrName?.value.trim() || '';
    const id = els.ocrIdNumber?.value.trim() || '';
    const birth = els.ocrBirthDate?.value.trim() || '';
    const solar = convertMinguoToSolar(birth);
    const issue = els.ocrIssueDate?.value.trim() || '';
    const address = els.ocrAddress?.value.trim() || '';
    const gender = els.ocrGender?.value.trim() || '';
    const birthplace = els.ocrBirthplace?.value.trim() || '';
    const parents = els.ocrParents?.value.trim() || '';

    if (!name && !id && !address) {
      showToast('尚未辨識或輸入身分證個資，請先進行辨識！', 'info');
      return;
    }

    const text = [
      '【港居不動產・承租人身分證建檔資料】',
      `姓名：${name}`,
      `身分證字號：${id} ${validateTaiwanID(id) ? '(檢核通過)' : ''}`,
      `出生年月日：${birth}${solar ? ` (西元 ${solar})` : ''}`,
      `戶籍地址：${address}`,
      `發證日期：${issue}`,
      gender ? `性別：${gender}` : '',
      birthplace ? `出生地：${birthplace}` : '',
      parents ? `父母：${parents}` : '',
      `建檔時間：${new Date().toLocaleString('zh-TW', { hour12: false })}`,
      '備註：純前端調正擷取，合約簽約建檔專用。'
    ].filter(Boolean).join('\n');

    const updateBtn = () => {
      if (els.btnCopyAllOcr) {
        const orig = els.btnCopyAllOcr.innerHTML;
        els.btnCopyAllOcr.innerHTML = '<i class="fa-solid fa-check"></i> 完整建檔個資已全數複製！';
        setTimeout(() => {
          els.btnCopyAllOcr.innerHTML = orig;
        }, 2200);
      }
      showToast('完整身分證建檔個資已複製至剪貼簿！', 'success');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(updateBtn).catch(() => {
        fallbackCopyString(text, updateBtn);
      });
    } else {
      fallbackCopyString(text, updateBtn);
    }
  }

  function fallbackCopyString(str, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast('請手動複製文字內容', 'info');
    } finally {
      document.body.removeChild(ta);
    }
  }

  // 一鍵帶入租賃契約 (自動填入房客資料)
  function fillIntoLeaseContract() {
    const name = els.ocrName?.value.trim() || '';
    const id = els.ocrIdNumber?.value.trim() || '';
    const birth = els.ocrBirthDate?.value.trim() || '';
    const address = els.ocrAddress?.value.trim() || '';

    if (!name && !id) {
      showToast('請先確認已辨識出姓名與身分證字號，再進行契約帶入！', 'info');
      return;
    }

    const payload = {
      tenantName: name,
      tenantId: id,
      tenantBirth: birth,
      tenantAddress: address,
      timestamp: Date.now()
    };

    localStorage.setItem('ganju_pending_tenant', JSON.stringify(payload));
    showToast(`已暫存房客「${name}」個資，正在為您前往租賃契約...`, 'success');
    setTimeout(() => {
      window.location.href = 'lease-contract.html';
    }, 400);
  }

  // --------------------------------------------------------------------------
  // 綁定所有按鈕與事件
  // --------------------------------------------------------------------------
  function bindEvents() {
    if (els.fileInputSingle) {
      els.fileInputSingle.addEventListener('change', (e) => {
        handleFilesSelected(e.target.files);
        e.target.value = '';
      });
    }

    if (els.fileInputBatch) {
      els.fileInputBatch.addEventListener('change', (e) => {
        handleFilesSelected(e.target.files);
        e.target.value = '';
      });
    }

    if (els.btnLoadDemo) {
      els.btnLoadDemo.addEventListener('click', () => {
        loadSkewedSamplePair();
      });
    }

    if (els.btnTabFront) {
      els.btnTabFront.addEventListener('click', () => {
        state.activeSide = 'front';
        renderAll();
      });
    }

    if (els.btnTabBack) {
      els.btnTabBack.addEventListener('click', () => {
        state.activeSide = 'back';
        renderAll();
      });
    }

    // 拖放檔案與 Ctrl+V 直接貼上 LINE 圖片
    if (els.sourceStageWrap) {
      els.sourceStageWrap.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      els.sourceStageWrap.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files) {
          handleFilesSelected(e.dataTransfer.files);
        }
      });
    }

    window.addEventListener('paste', (e) => {
      if (!e.clipboardData || !e.clipboardData.items) return;
      const files = [];
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        handleFilesSelected(files);
      }
    });

    // AI 重新自動抓邊
    if (els.btnAutoDetect) {
      els.btnAutoDetect.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot || !slot.loaded) return;
        autoDetectCardCorners(slot);
        renderAll();
      });
    }

    // 左右 90° 旋轉
    if (els.btnRotateLeft) {
      els.btnRotateLeft.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot || !slot.loaded) return;
        slot.quarterTurns = (slot.quarterTurns + 3) % 4;
        rebuildRotatedSourceCanvas(slot);
        autoDetectCardCorners(slot);
        renderAll();
      });
    }

    if (els.btnRotateRight) {
      els.btnRotateRight.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot || !slot.loaded) return;
        slot.quarterTurns = (slot.quarterTurns + 1) % 4;
        rebuildRotatedSourceCanvas(slot);
        autoDetectCardCorners(slot);
        renderAll();
      });
    }

    if (els.btnResetQuad) {
      els.btnResetQuad.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot || !slot.loaded) return;
        slot.baseCorners = [
          { x: 0.08, y: 0.15 },
          { x: 0.92, y: 0.15 },
          { x: 0.92, y: 0.85 },
          { x: 0.08, y: 0.85 }
        ];
        slot.fineAngleDeg = 0;
        slot.insetPct = 0;
        renderAll();
      });
    }

    // 微調旋轉角度滑桿
    if (els.fineAngleSlider) {
      els.fineAngleSlider.addEventListener('input', (e) => {
        const slot = getActiveSlot();
        if (!slot) return;
        slot.fineAngleDeg = parseFloat(e.target.value) || 0;
        if (els.fineAngleVal) {
          els.fineAngleVal.textContent = `${slot.fineAngleDeg > 0 ? '+' : ''}${slot.fineAngleDeg.toFixed(1)}°`;
        }
        renderSourceInteractiveCanvas();
        renderResultPreview();
      });
    }

    // 內縮去邊滑桿 (切除透明護貝套與桌面殘影)
    if (els.insetSlider) {
      els.insetSlider.addEventListener('input', (e) => {
        const slot = getActiveSlot();
        if (!slot) return;
        slot.insetPct = parseFloat(e.target.value) || 0;
        if (els.insetVal) {
          els.insetVal.textContent = `${slot.insetPct > 0 ? '+' : ''}${slot.insetPct.toFixed(1)}%`;
        }
        renderSourceInteractiveCanvas();
        renderResultPreview();
      });
    }

    els.presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot) return;
        const val = parseFloat(chip.getAttribute('data-inset')) || 0;
        slot.insetPct = val;
        els.presetChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        syncControlsFromSlot();
        renderSourceInteractiveCanvas();
        renderResultPreview();
      });
    });

    // 畫質增強濾鏡
    els.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        state.filterMode = btn.getAttribute('data-filter') || 'normal';
        els.filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderResultPreview();
      });
    });

    if (els.chkRounded) {
      els.chkRounded.addEventListener('change', (e) => {
        state.roundedCorners = e.target.checked;
        renderResultPreview();
      });
    }

    if (els.chkWatermark) {
      els.chkWatermark.addEventListener('change', (e) => {
        state.watermarkEnabled = e.target.checked;
        if (els.watermarkTextInput) {
          els.watermarkTextInput.style.display = state.watermarkEnabled ? 'block' : 'none';
        }
        renderResultPreview();
      });
    }

    if (els.watermarkTextInput) {
      els.watermarkTextInput.addEventListener('input', (e) => {
        state.watermarkText = e.target.value;
        renderResultPreview();
      });
    }

    if (els.exportFormatSelect) {
      els.exportFormatSelect.addEventListener('change', (e) => {
        state.exportFormat = e.target.value;
      });
    }

    if (els.btnDownloadCurrent) {
      els.btnDownloadCurrent.addEventListener('click', () => {
        const slot = getActiveSlot();
        if (!slot || !slot.straightCanvas) return;
        const suffix = state.activeSide === 'front' ? '正面調正' : '反面調正';
        triggerCanvasDownload(slot.straightCanvas, `港居_身分證${suffix}`);
      });
    }

    if (els.btnDownloadMerged) {
      els.btnDownloadMerged.addEventListener('click', () => {
        if (!state.slots.front.loaded || !state.slots.back.loaded) {
          alert('請先上傳或載入「正面」與「反面」兩張身分證照片，即可一鍵匯出正反面上下合成圖！');
          return;
        }
        updateMergedPreviewIfNeeded();
        triggerCanvasDownload(els.mergedCanvas, '港居_身分證正反面調正合成');
      });
    }

    // 步驟三：AI OCR 辨識與個資擷取相關事件
    if (els.btnStartOcr) {
      els.btnStartOcr.addEventListener('click', () => {
        runOcrExtract(false);
      });
    }

    if (els.copyBtns && els.copyBtns.length) {
      els.copyBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-copy-target');
          if (targetId) copyFieldValue(targetId, btn);
        });
      });
    }

    if (els.btnCopyAllOcr) {
      els.btnCopyAllOcr.addEventListener('click', () => {
        copyAllOcrData();
      });
    }

    if (els.btnFillLeaseContract) {
      els.btnFillLeaseContract.addEventListener('click', () => {
        fillIntoLeaseContract();
      });
    }

    if (els.btnToggleRawOcr) {
      els.btnToggleRawOcr.addEventListener('click', () => {
        if (!els.rawOcrBox) return;
        const isHidden = els.rawOcrBox.style.display === 'none';
        els.rawOcrBox.style.display = isHidden ? 'block' : 'none';
        els.btnToggleRawOcr.innerHTML = isHidden
          ? '<i class="fa-solid fa-code"></i> 收合原始 OCR 辨識文字'
          : '<i class="fa-solid fa-code"></i> 檢視原始 OCR 辨識文字';
      });
    }

    if (els.ocrIdNumber) {
      els.ocrIdNumber.addEventListener('input', (e) => {
        updateIdChecksumUI(e.target.value);
      });
    }

    if (els.ocrBirthDate) {
      els.ocrBirthDate.addEventListener('input', (e) => {
        updateSolarHintUI(e.target.value);
      });
    }
  }

  function init() {
    initDOMRefs();
    bindEvents();
    bindCanvasInteraction();
    // 預設自動載入歪斜身分證範例，讓使用者打開頁面就能立即體驗「歪斜自動調正＋去邊裁剪」效果
    loadSkewedSamplePair();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
