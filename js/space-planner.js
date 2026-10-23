// 港居不動產 — Web 端互動式 2D 平面格局配置與 3D 即時轉換系統 核心引擎 (space-planner.js)
// 涵蓋四大模組：
// 1. 既有外牆建置與底圖兩點比例尺校正 (ANSI31 45° CAD 剖面線、門窗打斷與開啟弧線)
// 2. 玄關連動與參數化自動隔間 (玄關/採光面/水電管道間錨點、3 組拓撲方案、拖拉隔間與點擊尺寸改淨寬、坪數換算)
// 3. 標準 CAD 家具圖塊庫與動線防呆 (11 款標準圖塊、自動貼牆轉向、門扇迴轉半徑 85cm 衝突紅框警示)
// 4. 多方案切換、Three.js 60FPS 低多邊形 3D 即時轉換 (娃娃屋俯視/第一人稱漫遊) 與 PNG/SVG/PDF/JSON 出圖

(function () {
  'use strict';

  // =========================================================================
  // 0. 公用 DOM 建構與 Toast 工具 (避免直接操作未過濾之 innerHTML，符合全站資安規範)
  // =========================================================================
  function showToast(message) {
    let toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    if (window._plannerToastTimer) clearTimeout(window._plannerToastTimer);
    window._plannerToastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 3200);
  }

  function createEl(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach((k) => {
        if (k === 'className') el.className = attrs[k];
        else if (k === 'textContent') el.textContent = attrs[k];
        else if (k === 'style' && typeof attrs[k] === 'object') {
          Object.assign(el.style, attrs[k]);
        } else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else {
          el.setAttribute(k, attrs[k]);
        }
      });
    }
    if (Array.isArray(children)) {
      children.forEach((c) => {
        if (c === null || c === undefined) return;
        if (typeof c === 'string' || typeof c === 'number') {
          el.appendChild(document.createTextNode(String(c)));
        } else {
          el.appendChild(c);
        }
      });
    }
    return el;
  }

  function initPageLayout() {
    const themeToggleBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('ganggo_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = cur === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ganggo_theme', next);
        showToast(next === 'dark' ? '🌙 已切換至深色模式' : '☀️ 已切換至淺色模式');
        requestRender2D();
        rebuild3DScene();
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
    dropdowns.forEach((dd) => {
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
      dropdowns.forEach((dd) => dd.classList.remove('open'));
    });
  }

  // =========================================================================
  // 1. 標準 CAD 家具圖塊與人體工學尺寸目錄 (Module 3 Catalog)
  // =========================================================================
  const FURNITURE_CATALOG = {
    double_bed: {
      catalogId: 'double_bed',
      name: '雙人床組',
      widthCm: 152,
      depthCm: 188,
      heightCm: 55,
      roomTypes: ['master_bed'],
      color3D: 0xe2e8f0,
      accent3D: 0x1a365d
    },
    single_bed: {
      catalogId: 'single_bed',
      name: '單人床組',
      widthCm: 106,
      depthCm: 188,
      heightCm: 55,
      roomTypes: ['single_bed', 'study'],
      color3D: 0xe2e8f0,
      accent3D: 0x3b82f6
    },
    wardrobe: {
      catalogId: 'wardrobe',
      name: '系統衣櫃',
      widthCm: 150,
      depthCm: 60,
      heightCm: 220,
      roomTypes: ['master_bed', 'single_bed'],
      color3D: 0xd6c7b2,
      accent3D: 0x8b6f47
    },
    desk: {
      catalogId: 'desk',
      name: '書桌椅組',
      widthCm: 120,
      depthCm: 60,
      heightCm: 75,
      roomTypes: ['master_bed', 'single_bed', 'study'],
      color3D: 0xc8b294,
      accent3D: 0x334155
    },
    sofa: {
      catalogId: 'sofa',
      name: '三人座沙發',
      widthCm: 210,
      depthCm: 85,
      heightCm: 82,
      roomTypes: ['living'],
      color3D: 0x475569,
      accent3D: 0xc5a059
    },
    coffee_table: {
      catalogId: 'coffee_table',
      name: '客廳茶几',
      widthCm: 110,
      depthCm: 55,
      heightCm: 42,
      roomTypes: ['living'],
      color3D: 0xc5a059,
      accent3D: 0x1e293b
    },
    dining_table: {
      catalogId: 'dining_table',
      name: '四人餐桌椅',
      widthCm: 130,
      depthCm: 80,
      heightCm: 75,
      roomTypes: ['living'],
      color3D: 0xbfa588,
      accent3D: 0x475569
    },
    toilet: {
      catalogId: 'toilet',
      name: '單體馬桶',
      widthCm: 42,
      depthCm: 68,
      heightCm: 72,
      roomTypes: ['bath'],
      color3D: 0xffffff,
      accent3D: 0x94a3b8
    },
    basin: {
      catalogId: 'basin',
      name: '洗手台面盆',
      widthCm: 65,
      depthCm: 48,
      heightCm: 82,
      roomTypes: ['bath'],
      color3D: 0xf8fafc,
      accent3D: 0x64748b
    },
    shower: {
      catalogId: 'shower',
      name: '淋浴隔間',
      widthCm: 90,
      depthCm: 90,
      heightCm: 200,
      roomTypes: ['bath'],
      color3D: 0xbae6fd,
      accent3D: 0x64748b
    },
    kitchen_counter: {
      catalogId: 'kitchen_counter',
      name: '一字型流理台',
      widthCm: 180,
      depthCm: 60,
      heightCm: 85,
      roomTypes: ['kitchen'],
      color3D: 0xe2e8f0,
      accent3D: 0x334155
    }
  };

  const ROOM_TYPE_META = {
    living: { label: '客廳 / 餐廳', fillLight: 'rgba(197, 160, 89, 0.09)', fillDark: 'rgba(197, 160, 89, 0.14)', floor3D: 0xdccbb4 },
    master_bed: { label: '主臥室 (雙人)', fillLight: 'rgba(26, 54, 93, 0.07)', fillDark: 'rgba(59, 130, 246, 0.14)', floor3D: 0xc8ad8d },
    single_bed: { label: '次臥室 (單人)', fillLight: 'rgba(43, 76, 126, 0.07)', fillDark: 'rgba(96, 165, 250, 0.12)', floor3D: 0xcfb699 },
    study: { label: '採光書房', fillLight: 'rgba(16, 185, 129, 0.07)', fillDark: 'rgba(16, 185, 129, 0.12)', floor3D: 0xd4be9e },
    bath: { label: '衛浴間', fillLight: 'rgba(14, 165, 233, 0.10)', fillDark: 'rgba(14, 165, 233, 0.16)', floor3D: 0x94a3b8 },
    kitchen: { label: '廚房區', fillLight: 'rgba(245, 158, 11, 0.09)', fillDark: 'rgba(245, 158, 11, 0.14)', floor3D: 0xcbd5e1 },
    entrance: { label: '落塵玄關', fillLight: 'rgba(100, 116, 139, 0.10)', fillDark: 'rgba(148, 163, 184, 0.14)', floor3D: 0x64748b }
  };

  // =========================================================================
  // 2. 狀態管理與統一 JSON Schema (State & Multi-Version Store)
  // =========================================================================
  let idCounter = 100;
  function nextId(prefix) {
    idCounter += 1;
    return `${prefix}_${idCounter}`;
  }

  const appState = {
    schemaVersion: '1.0.0',
    projectId: 'prj_ganju_default',
    projectName: '高雄小港・中安路高質感三房包租規劃案',
    updatedAt: new Date().toISOString(),
    settings: {
      floorHeightCm: 300,
      extThicknessCm: 24,
      intThicknessCm: 12,
      gridSizeCm: 10,
      snapToGrid: true,
      orthoLock: true,
      showHatch: true,
      autoAlignFurniture: true,
      showClearanceZones: true,
      liveTopologySync: true,
      activeScheme: 1,
      exportDim: true,
      exportRoomName: true,
      exportTable: true,
      exportWatermark: true
    },
    backgroundMap: {
      dataUrl: null,
      imgObj: null,
      opacity: 0.45,
      scaleCmPerPx: 1.0,
      offsetX: 0,
      offsetY: 0,
      calibrated: false
    },
    activeVersionKey: 'planA',
    versions: {
      original: null,
      planA: null,
      planB: null
    }
  };

  // 互動與視圖狀態
  const uiState = {
    activeTool: 'select', // 'select' | 'wall_int' | 'wall_ext' | 'add_door' | 'add_window' | 'calibrate'
    viewMode: 'split',    // '2d' | 'split' | '3d'
    cameraMode3D: 'dollhouse', // 'dollhouse' | 'firstperson'
    cutawayWall: true,
    warmLight3D: true,
    zoom2D: 0.56,
    panX2D: 80,
    panY2D: 65,
    selectedItem: null, // { kind: 'wall'|'opening'|'furniture'|'room'|'anchor', id: string }
    hoveredItem: null,
    dragging: null,
    drawingWall: null,  // { x1, y1, x2, y2, type }
    calibrating: null,  // { x1, y1, x2, y2, step }
    snapIndicator: null,// { x, y }
    clickableDimBoxes: [], // [{ x, y, w, h, targetKind, targetId, prop, currentVal, label }]
    collisions: [],
    undoStack: [],
    readonlyMode: false
  };

  function getActiveVersion() {
    return appState.versions[appState.activeVersionKey];
  }

  function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function pushUndo() {
    const snap = cloneDeep(getActiveVersion());
    uiState.undoStack.push(snap);
    if (uiState.undoStack.length > 25) uiState.undoStack.shift();
  }

  function performUndo() {
    if (uiState.undoStack.length === 0) {
      showToast('目前沒有可復原的步驟');
      return;
    }
    appState.versions[appState.activeVersionKey] = uiState.undoStack.pop();
    uiState.selectedItem = null;
    recalculateCollisionsAndSchedule();
    requestRender2D();
    rebuild3DScene();
    showToast('↩️ 已復原上一步變更');
  }

  // =========================================================================
  // 3. 模組二：既有外牆胚體與「玄關驅動全局連動」參數化自動隔間演算法
  // =========================================================================
  function getEnvelopeBounds(ver) {
    const extWalls = (ver.walls || []).filter((w) => w.type === 'exterior');
    if (extWalls.length === 0) {
      return { minX: 0, minY: 0, maxX: 960, maxY: 720, width: 960, height: 720 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    extWalls.forEach((w) => {
      minX = Math.min(minX, w.x1, w.x2);
      minY = Math.min(minY, w.y1, w.y2);
      maxX = Math.max(maxX, w.x1, w.x2);
      maxY = Math.max(maxY, w.y1, w.y2);
    });
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(300, maxX - minX),
      height: Math.max(300, maxY - minY)
    };
  }

  function buildExteriorEnvelope(widthCm, heightCm, daylightSides) {
    const extT = appState.settings.extThicknessCm || 24;
    const dl = daylightSides || ['north', 'east'];
    const walls = [
      { id: 'w_ext_north', x1: 0, y1: 0, x2: widthCm, y2: 0, thickness: extT, type: 'exterior', locked: true, side: 'north', hasDaylight: dl.includes('north') },
      { id: 'w_ext_east', x1: widthCm, y1: 0, x2: widthCm, y2: heightCm, thickness: extT, type: 'exterior', locked: true, side: 'east', hasDaylight: dl.includes('east') },
      { id: 'w_ext_south', x1: 0, y1: heightCm, x2: widthCm, y2: heightCm, thickness: extT, type: 'exterior', locked: true, side: 'south', hasDaylight: dl.includes('south') },
      { id: 'w_ext_west', x1: 0, y1: 0, x2: 0, y2: heightCm, thickness: extT, type: 'exterior', locked: true, side: 'west', hasDaylight: dl.includes('west') }
    ];
    return walls;
  }

  /**
   * 依據「入口玄關大門位置」、「既有開窗採光面」與「固定水電管道間」
   * 在不更動既有鎖定外牆的前提下，自動演算生成室內隔間牆、門窗、空間與標準 CAD 家具
   * schemeId:
   *   0 = 原始屋況 (老式傳統隔間)
   *   1 = 自動方案 1：標準公私分明格局 (玄關 -> 客餐廳 -> 採光雙臥 + 管道間衛廚)
   *   2 = 自動方案 2：大尺度開闊客餐廳 (外商主管大主臥 + 開放採光書房 + 衛廚)
   *   3 = 自動方案 3：高收益緊湊三房配置 (3 間採光臥室 + 客餐廳 + 管道間衛廚)
   */
  function solveParametricLayout(ver, schemeId, autoFurnish = true) {
    const bounds = getEnvelopeBounds(ver);
    const W = bounds.width;
    const H = bounds.height;
    const ox = bounds.minX;
    const oy = bounds.minY;
    const intT = appState.settings.intThicknessCm || 12;

    // 保留所有 locked 既有外牆
    const lockedWalls = (ver.walls || []).filter((w) => w.locked || w.type === 'exterior');
    if (lockedWalls.length === 0) {
      const created = buildExteriorEnvelope(W, H, ['north', 'east']);
      lockedWalls.push(...created);
    }

    // 讀取關鍵錨點
    if (!ver.anchors) {
      ver.anchors = {
        entrance: { side: 'south', t: 0.25, widthCm: 100, swingDir: 1, hingeSide: 1 },
        plumbingCore: { x: ox + Math.round(W * 0.16), y: oy + Math.round(H * 0.56), widthCm: 76, depthCm: 58, label: '水電管道間' },
        daylightSides: ['north', 'east']
      };
    }

    const ent = ver.anchors.entrance;
    const pipe = ver.anchors.plumbingCore;
    const dlSides = ver.anchors.daylightSides || ['north', 'east'];

    // 同步外牆採光屬性
    lockedWalls.forEach((w) => {
      if (w.side) {
        w.hasDaylight = dlSides.includes(w.side);
      }
    });

    // 計算玄關在平面上的實際座標，決定「公領域 (玄關/客餐廳)」與「私領域 (臥室群)」的方位
    let entX = ox + W * ent.t;
    let entY = oy + H;
    let entWallId = 'w_ext_south';
    if (ent.side === 'north') {
      entX = ox + W * ent.t;
      entY = oy;
      entWallId = 'w_ext_north';
    } else if (ent.side === 'west') {
      entX = ox;
      entY = oy + H * ent.t;
      entWallId = 'w_ext_west';
    } else if (ent.side === 'east') {
      entX = ox + W;
      entY = oy + H * ent.t;
      entWallId = 'w_ext_east';
    } else {
      ent.side = 'south';
      entWallId = 'w_ext_south';
    }

    const interiorWalls = [];
    const openings = [];
    const rooms = [];

    // 置入入口玄關大門開口
    openings.push({
      id: 'op_entrance_main',
      wallId: entWallId,
      type: 'entrance',
      t: Math.max(0.12, Math.min(0.88, ent.t)),
      widthCm: 100,
      sillHeightCm: 0,
      heightCm: 210,
      swingDir: ent. side === 'north' || ent.side === 'west' ? 1 : -1,
      hingeSide: 1
    });

    // 決定採光臥室帶在北側或南側 (遠離玄關或優先貼近採光面)
    const bedroomsAtTop = (ent.side === 'south') || (dlSides.includes('north') && ent.side !== 'north');
    // 決定衛浴與廚房在左側或右側 (貼近固定水電管道間 pipe.x)
    const wetAtLeft = (pipe.x - ox) < W * 0.5;

    const bedZoneDepth = Math.round(H * (schemeId === 2 ? 0.44 : 0.42));
    const splitY = bedroomsAtTop ? (oy + bedZoneDepth) : (oy + H - bedZoneDepth);
    const bedY0 = bedroomsAtTop ? oy : splitY;
    const bedY1 = bedroomsAtTop ? splitY : (oy + H);
    const pubY0 = bedroomsAtTop ? splitY : oy;
    const pubY1 = bedroomsAtTop ? (oy + H) : splitY;
    const pubH = Math.abs(pubY1 - pubY0);

    // 橫向主隔間牆 (區隔公私領域)
    const mainHorizWallId = 'w_int_horiz_main';
    interiorWalls.push({
      id: mainHorizWallId,
      x1: ox,
      y1: splitY,
      x2: ox + W,
      y2: splitY,
      thickness: intT,
      type: 'interior',
      locked: false
    });

    // 水電濕區 (衛浴 + 廚房) 寬度，自動貼近管道間
    const wetWidth = Math.max(220, Math.min(310, Math.round(W * 0.30)));
    const wetSplitX = wetAtLeft ? (ox + wetWidth) : (ox + W - wetWidth);
    const wetX0 = wetAtLeft ? ox : wetSplitX;
    const wetX1 = wetAtLeft ? wetSplitX : (ox + W);
    const livX0 = wetAtLeft ? wetSplitX : ox;
    const livX1 = wetAtLeft ? (ox + W) : wetSplitX;

    // 讓水電管道間自動吸附於濕區角落附近，視覺與邏輯完全一致
    pipe.x = Math.max(wetX0 + 45, Math.min(wetX1 - 45, pipe.x));
    pipe.y = Math.max(pubY0 + 45, Math.min(pubY1 - 45, pipe.y));

    // 垂直隔間牆：切分客餐廳與衛廚濕區
    const wetVertWallId = 'w_int_wet_vert';
    interiorWalls.push({
      id: wetVertWallId,
      x1: wetSplitX,
      y1: pubY0,
      x2: wetSplitX,
      y2: pubY1,
      thickness: intT,
      type: 'interior',
      locked: false
    });

    // 濕區內部水平分牆：切分「衛浴間」與「廚房區」
    const bathH = Math.round(pubH * 0.52);
    const wetMidY = pubY0 + bathH;
    const wetSubWallId = 'w_int_wet_sub';
    interiorWalls.push({
      id: wetSubWallId,
      x1: wetX0,
      y1: wetMidY,
      x2: wetX1,
      y2: wetMidY,
      thickness: intT,
      type: 'interior',
      locked: false
    });

    // 衛浴門與廚房開口 (開向客餐廳)
    openings.push({
      id: 'op_door_bath',
      wallId: wetVertWallId,
      type: 'door',
      t: 0.26,
      widthCm: 75,
      sillHeightCm: 0,
      heightCm: 210,
      swingDir: wetAtLeft ? -1 : 1,
      hingeSide: 1
    });
    openings.push({
      id: 'op_door_kitchen',
      wallId: wetVertWallId,
      type: 'door',
      t: 0.76,
      widthCm: 85,
      sillHeightCm: 0,
      heightCm: 210,
      swingDir: wetAtLeft ? -1 : 1,
      hingeSide: -1
    });

    // 加入公領域與濕區房間定義
    rooms.push({
      id: 'rm_living',
      name: schemeId === 2 ? '開闊客餐廳' : '客廳 / 餐廳',
      roomType: 'living',
      x: livX0,
      y: pubY0,
      widthCm: Math.abs(livX1 - livX0),
      heightCm: pubH
    });
    rooms.push({
      id: 'rm_bath',
      name: '衛浴間',
      roomType: 'bath',
      x: wetX0,
      y: pubY0,
      widthCm: Math.abs(wetX1 - wetX0),
      heightCm: bathH
    });
    rooms.push({
      id: 'rm_kitchen',
      name: '廚房區',
      roomType: 'kitchen',
      x: wetX0,
      y: wetMidY,
      widthCm: Math.abs(wetX1 - wetX0),
      heightCm: Math.abs(pubY1 - wetMidY)
    });

    // 依據不同方案切分私領域臥室帶 (bedY0 ~ bedY1)
    if (schemeId === 3) {
      // 方案 3：高投報緊湊三房 (主臥 + 次臥 A + 次臥 B)
      const b1X = ox + Math.round(W * 0.36);
      const b2X = ox + Math.round(W * 0.68);
      interiorWalls.push(
        { id: 'w_int_bed1', x1: b1X, y1: bedY0, x2: b1X, y2: bedY1, thickness: intT, type: 'interior', locked: false },
        { id: 'w_int_bed2', x1: b2X, y1: bedY0, x2: b2X, y2: bedY1, thickness: intT, type: 'interior', locked: false }
      );
      openings.push(
        { id: 'op_door_b1', wallId: mainHorizWallId, type: 'door', t: 0.22, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: 1 },
        { id: 'op_door_b2', wallId: mainHorizWallId, type: 'door', t: 0.52, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: 1 },
        { id: 'op_door_b3', wallId: mainHorizWallId, type: 'door', t: 0.82, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: -1 }
      );
      rooms.push(
        { id: 'rm_master', name: '主臥室 A', roomType: 'master_bed', x: ox, y: bedY0, widthCm: b1X - ox, heightCm: bedZoneDepth },
        { id: 'rm_bed2', name: '次臥室 B', roomType: 'single_bed', x: b1X, y: bedY0, widthCm: b2X - b1X, heightCm: bedZoneDepth },
        { id: 'rm_bed3', name: '次臥室 C', roomType: 'single_bed', x: b2X, y: bedY0, widthCm: (ox + W) - b2X, heightCm: bedZoneDepth }
      );
    } else if (schemeId === 2) {
      // 方案 2：大尺度一房一書房 (豪華大主臥 62% + 獨立採光書房 38%)
      const bSplitX = dlSides.includes('east') ? (ox + Math.round(W * 0.40)) : (ox + Math.round(W * 0.60));
      interiorWalls.push({
        id: 'w_int_bed1',
        x1: bSplitX,
        y1: bedY0,
        x2: bSplitX,
        y2: bedY1,
        thickness: intT,
        type: 'interior',
        locked: false
      });
      openings.push(
        { id: 'op_door_b1', wallId: mainHorizWallId, type: 'door', t: 0.28, widthCm: 90, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: 1 },
        { id: 'op_door_b2', wallId: mainHorizWallId, type: 'door', t: 0.76, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: -1 }
      );
      rooms.push(
        { id: 'rm_master', name: '豪華大主臥', roomType: 'master_bed', x: ox, y: bedY0, widthCm: bSplitX - ox, heightCm: bedZoneDepth },
        { id: 'rm_study', name: '獨立採光書房', roomType: 'study', x: bSplitX, y: bedY0, widthCm: (ox + W) - bSplitX, heightCm: bedZoneDepth }
      );
    } else {
      // 方案 1 (預設) 或 0 (原始屋況)：標準雙臥室 (主臥 54% + 次臥 46%)
      const ratio = schemeId === 0 ? 0.48 : 0.55;
      const bSplitX = ox + Math.round(W * ratio);
      interiorWalls.push({
        id: 'w_int_bed1',
        x1: bSplitX,
        y1: bedY0,
        x2: bSplitX,
        y2: bedY1,
        thickness: intT,
        type: 'interior',
        locked: false
      });
      openings.push(
        { id: 'op_door_b1', wallId: mainHorizWallId, type: 'door', t: 0.32, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: 1 },
        { id: 'op_door_b2', wallId: mainHorizWallId, type: 'door', t: 0.78, widthCm: 85, sillHeightCm: 0, heightCm: 210, swingDir: bedroomsAtTop ? -1 : 1, hingeSide: -1 }
      );
      rooms.push(
        { id: 'rm_master', name: '主臥室', roomType: 'master_bed', x: ox, y: bedY0, widthCm: bSplitX - ox, heightCm: bedZoneDepth },
        { id: 'rm_bed2', name: '次臥室', roomType: 'single_bed', x: bSplitX, y: bedY0, widthCm: (ox + W) - bSplitX, heightCm: bedZoneDepth }
      );
    }

    // 在標記為 hasDaylight 的外牆上自動嵌入採光窗戶 (避開玄關門位置)
    lockedWalls.forEach((ew) => {
      if (!ew.hasDaylight) return;
      if (ew.id === entWallId) {
        const winT = ent.t < 0.5 ? 0.76 : 0.24;
        openings.push({
          id: nextId('op_win'),
          wallId: ew.id,
          type: 'window',
          t: winT,
          widthCm: 160,
          sillHeightCm: 90,
          heightCm: 120,
          swingDir: 1,
          hingeSide: 1
        });
      } else {
        openings.push(
          {
            id: nextId('op_win'),
            wallId: ew.id,
            type: 'window',
            t: 0.28,
            widthCm: 160,
            sillHeightCm: 90,
            heightCm: 120,
            swingDir: 1,
            hingeSide: 1
          },
          {
            id: nextId('op_win'),
            wallId: ew.id,
            type: 'window',
            t: 0.74,
            widthCm: 160,
            sillHeightCm: 90,
            heightCm: 120,
            swingDir: 1,
            hingeSide: 1
          }
        );
      }
    });

    ver.walls = [...lockedWalls, ...interiorWalls];
    ver.openings = openings;
    ver.rooms = rooms;

    if (autoFurnish) {
      autoFurnishVersion(ver);
    }
  }

  /**
   * 模組三：依據各房間空間屬性 (客廳、主臥、次臥、書房、衛浴、廚房)
   * 自動配置符合人體工學比例且避開門扇迴轉半徑的 2D CAD 圖塊
   */
  function autoFurnishVersion(ver) {
    const furnList = [];
    const wallMargin = 18;

    (ver.rooms || []).forEach((rm) => {
      const rx = rm.x;
      const ry = rm.y;
      const rw = rm.widthCm;
      const rh = rm.heightCm;
      const cx = rx + rw / 2;
      const cy = ry + rh / 2;

      if (rm.roomType === 'master_bed') {
        // 雙人床貼靠遠離室內門的外牆側
        const bedOnTop = ry === 0;
        const bedY = bedOnTop ? (ry + wallMargin + 188 / 2) : (ry + rh - wallMargin - 188 / 2);
        furnList.push({
          id: nextId('furn'),
          catalogId: 'double_bed',
          name: '雙人床組',
          x: rx + Math.min(rw * 0.42, Math.max(110, rw - 160)),
          y: bedY,
          widthCm: 152,
          depthCm: 188,
          heightCm: 55,
          rotation: bedOnTop ? 0 : 180
        });
        if (rw >= 310) {
          furnList.push({
            id: nextId('furn'),
            catalogId: 'wardrobe',
            name: '系統衣櫃',
            x: rx + rw - wallMargin - 60 / 2,
            y: bedOnTop ? (ry + wallMargin + 150 / 2 + 10) : (ry + rh - wallMargin - 150 / 2 - 10),
            widthCm: 150,
            depthCm: 60,
            heightCm: 220,
            rotation: 90
          });
        }
      } else if (rm.roomType === 'single_bed') {
        const bedOnTop = ry === 0;
        const bedY = bedOnTop ? (ry + wallMargin + 188 / 2) : (ry + rh - wallMargin - 188 / 2);
        furnList.push({
          id: nextId('furn'),
          catalogId: 'single_bed',
          name: '單人床組',
          x: rx + wallMargin + 106 / 2 + 12,
          y: bedY,
          widthCm: 106,
          depthCm: 188,
          heightCm: 55,
          rotation: bedOnTop ? 0 : 180
        });
        if (rw >= 250) {
          furnList.push({
            id: nextId('furn'),
            catalogId: 'desk',
            name: '書桌椅組',
            x: rx + rw - wallMargin - 60 / 2 - 6,
            y: bedOnTop ? (ry + wallMargin + 120 / 2 + 10) : (ry + rh - wallMargin - 120 / 2 - 10),
            widthCm: 120,
            depthCm: 60,
            heightCm: 75,
            rotation: 90
          });
        }
      } else if (rm.roomType === 'study') {
        furnList.push({
          id: nextId('furn'),
          catalogId: 'desk',
          name: '書桌椅組',
          x: cx,
          y: ry + wallMargin + 60 / 2 + 16,
          widthCm: 120,
          depthCm: 60,
          heightCm: 75,
          rotation: 0
        });
        furnList.push({
          id: nextId('furn'),
          catalogId: 'wardrobe',
          name: '系統書櫃/衣櫃',
          x: rx + rw - wallMargin - 60 / 2,
          y: cy,
          widthCm: 150,
          depthCm: 60,
          heightCm: 220,
          rotation: 90
        });
      } else if (rm.roomType === 'living') {
        // 沙發與茶几組 + 餐桌椅
        const sofaX = rx + rw * 0.56;
        const sofaY = ry + rh - wallMargin - 85 / 2 - 10;
        furnList.push({
          id: nextId('furn'),
          catalogId: 'sofa',
          name: '三人座沙發',
          x: sofaX,
          y: sofaY,
          widthCm: 210,
          depthCm: 85,
          heightCm: 82,
          rotation: 180
        });
        furnList.push({
          id: nextId('furn'),
          catalogId: 'coffee_table',
          name: '客廳茶几',
          x: sofaX,
          y: sofaY - 82,
          widthCm: 110,
          depthCm: 55,
          heightCm: 42,
          rotation: 0
        });
        if (rh >= 360) {
          furnList.push({
            id: nextId('furn'),
            catalogId: 'dining_table',
            name: '四人餐桌椅',
            x: rx + Math.min(rw * 0.68, rw - 100),
            y: ry + 115,
            widthCm: 130,
            depthCm: 80,
            heightCm: 75,
            rotation: 0
          });
        }
      } else if (rm.roomType === 'bath') {
        furnList.push({
          id: nextId('furn'),
          catalogId: 'shower',
          name: '淋浴隔間',
          x: rx + wallMargin + 45,
          y: ry + wallMargin + 45,
          widthCm: 90,
          depthCm: 90,
          heightCm: 200,
          rotation: 0
        });
        furnList.push({
          id: nextId('furn'),
          catalogId: 'toilet',
          name: '單體馬桶',
          x: rx + wallMargin + 34,
          y: ry + rh - wallMargin - 30,
          widthCm: 42,
          depthCm: 68,
          heightCm: 72,
          rotation: 90
        });
        furnList.push({
          id: nextId('furn'),
          catalogId: 'basin',
          name: '洗手台面盆',
          x: rx + rw * 0.58,
          y: ry + wallMargin + 26,
          widthCm: 65,
          depthCm: 48,
          heightCm: 82,
          rotation: 0
        });
      } else if (rm.roomType === 'kitchen') {
        furnList.push({
          id: nextId('furn'),
          catalogId: 'kitchen_counter',
          name: '一字型流理台',
          x: cx,
          y: ry + rh - wallMargin - 30,
          widthCm: Math.min(180, rw - 36),
          depthCm: 60,
          heightCm: 85,
          rotation: 180
        });
      }
    });

    ver.furniture = furnList;
  }

  // =========================================================================
  // 4. 模組三：家具貼牆自動轉向 (Auto-Align) 與開門迴轉半徑 (85cm) 衝突檢測
  // =========================================================================
  function getFurnitureEffectiveBox(f) {
    const rot = ((f.rotation % 360) + 360) % 360;
    const swapped = (rot === 90 || rot === 270);
    const w = swapped ? f.depthCm : f.widthCm;
    const h = swapped ? f.widthCm : f.depthCm;
    return {
      left: f.x - w / 2,
      right: f.x + w / 2,
      top: f.y - h / 2,
      bottom: f.y + h / 2,
      w,
      h
    };
  }

  /**
   * 當拖曳家具靠近任何牆面 (閾值 28cm) 時，自動貼齊牆面內側並自動旋轉面向室內
   */
  function autoAlignFurnitureToWalls(f, ver) {
    if (!appState.settings.autoAlignFurniture) return;
    const threshold = 28;
    let bestDist = threshold;
    let snapAction = null;

    (ver.walls || []).forEach((w) => {
      const isHoriz = Math.abs(w.y1 - w.y2) < 1;
      const isVert = Math.abs(w.x1 - w.x2) < 1;
      const halfT = (w.thickness || 12) / 2;

      if (isHoriz) {
        const minX = Math.min(w.x1, w.x2);
        const maxX = Math.max(w.x1, w.x2);
        if (f.x >= minX && f.x <= maxX) {
          const dy = f.y - w.y1;
          const absDy = Math.abs(dy) - halfT - f.depthCm / 2;
          if (Math.abs(absDy) < bestDist) {
            bestDist = Math.abs(absDy);
            if (dy > 0) {
              // 牆在上方，家具背靠北牆朝南 (rotation = 0)
              snapAction = {
                rotation: 0,
                x: f.x,
                y: w.y1 + halfT + f.depthCm / 2 + 2
              };
            } else {
              // 牆在下方，家具背靠南牆朝北 (rotation = 180)
              snapAction = {
                rotation: 180,
                x: f.x,
                y: w.y1 - halfT - f.depthCm / 2 - 2
              };
            }
          }
        }
      } else if (isVert) {
        const minY = Math.min(w.y1, w.y2);
        const maxY = Math.max(w.y1, w.y2);
        if (f.y >= minY && f.y <= maxY) {
          const dx = f.x - w.x1;
          const absDx = Math.abs(dx) - halfT - f.depthCm / 2;
          if (Math.abs(absDx) < bestDist) {
            bestDist = Math.abs(absDx);
            if (dx > 0) {
              // 牆在左側，背靠西牆朝東 (rotation = 270)
              snapAction = {
                rotation: 270,
                x: w.x1 + halfT + f.depthCm / 2 + 2,
                y: f.y
              };
            } else {
              // 牆在右側，背靠東牆朝西 (rotation = 90)
              snapAction = {
                rotation: 90,
                x: w.x1 - halfT - f.depthCm / 2 - 2,
                y: f.y
              };
            }
          }
        }
      }
    });

    if (snapAction) {
      f.rotation = snapAction.rotation;
      f.x = Math.round(snapAction.x);
      f.y = Math.round(snapAction.y);
    }
  }

  /**
   * 計算門窗在平面上的幾何位置與門扇開啟迴轉半徑圓心
   */
  function getOpeningGeometry(op, ver) {
    const wall = (ver.walls || []).find((w) => w.id === op.wallId);
    if (!wall) return null;
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // 法向量
    const nx = -uy;
    const ny = ux;

    const cx = wall.x1 + dx * op.t;
    const cy = wall.y1 + dy * op.t;
    const halfW = (op.widthCm || 85) / 2;
    const pStart = { x: cx - ux * halfW, y: cy - uy * halfW };
    const pEnd = { x: cx + ux * halfW, y: cy + uy * halfW };
    const hingePt = op.hingeSide === -1 ? pEnd : pStart;
    const latchPt = op.hingeSide === -1 ? pStart : pEnd;

    // 迴轉半徑扇形中心區
    const swingRadius = op.widthCm || 85;
    const swingDir = op.swingDir || 1;
    const swingCenter = {
      x: cx + nx * swingDir * (swingRadius * 0.45),
      y: cy + ny * swingDir * (swingRadius * 0.45),
      r: swingRadius * 0.52
    };

    return {
      wall,
      cx,
      cy,
      ux,
      uy,
      nx,
      ny,
      halfW,
      pStart,
      pEnd,
      hingePt,
      latchPt,
      swingRadius,
      swingDir,
      swingCenter
    };
  }

  /**
   * 即時檢測所有家具是否與「門扇開啟迴轉半徑 (80~90cm)」或「其他家具」發生動線重疊
   * 並同步更新右側坪數統計表 (1 m² = 0.3025 坪)
   */
  function recalculateCollisionsAndSchedule() {
    const ver = getActiveVersion();
    if (!ver) return;

    const collisions = [];
    const furns = ver.furniture || [];
    const openings = ver.openings || [];

    // 1. 檢測家具 vs 門扇開啟迴轉範圍
    openings.forEach((op) => {
      if (op.type !== 'door' && op.type !== 'entrance') return;
      const geom = getOpeningGeometry(op, ver);
      if (!geom) return;

      furns.forEach((f) => {
        const box = getFurnitureEffectiveBox(f);
        // 計算圓心到矩形最近點距離
        const closestX = Math.max(box.left, Math.min(geom.swingCenter.x, box.right));
        const closestY = Math.max(box.top, Math.min(geom.swingCenter.y, box.bottom));
        const dist = Math.hypot(geom.swingCenter.x - closestX, geom.swingCenter.y - closestY);
        if (dist < geom.swingCenter.r - 6) {
          collisions.push({
            furnId: f.id,
            openingId: op.id,
            reason: `${f.name} 侵入${op.type === 'entrance' ? '玄關大門' : '室內門'}迴轉半徑 (${op.widthCm}cm)`
          });
        }
      });
    });

    // 2. 檢測家具 vs 家具重疊
    for (let i = 0; i < furns.length; i++) {
      const b1 = getFurnitureEffectiveBox(furns[i]);
      for (let j = i + 1; j < furns.length; j++) {
        const b2 = getFurnitureEffectiveBox(furns[j]);
        const overlapX = Math.min(b1.right, b2.right) - Math.max(b1.left, b2.left);
        const overlapY = Math.min(b1.bottom, b2.bottom) - Math.max(b1.top, b2.top);
        if (overlapX > 6 && overlapY > 6) {
          collisions.push({
            furnId: furns[i].id,
            otherFurnId: furns[j].id,
            reason: `${furns[i].name} 與 ${furns[j].name} 空間重疊`
          });
          collisions.push({
            furnId: furns[j].id,
            otherFurnId: furns[i].id,
            reason: `${furns[j].name} 與 ${furns[i].name} 空間重疊`
          });
        }
      }
    }

    uiState.collisions = collisions;

    // 更新底部狀態列警示徽章
    const badgeEl = document.getElementById('collisionBadge');
    if (badgeEl) {
      badgeEl.replaceChildren();
      if (collisions.length === 0) {
        badgeEl.className = 'collision-alert-badge ok';
        badgeEl.appendChild(createEl('i', { className: 'fa-solid fa-circle-check' }));
        badgeEl.appendChild(document.createTextNode(' 動線檢測合格：門扇迴轉半徑 (85cm) 與走道淨寬無衝突'));
      } else {
        badgeEl.className = 'collision-alert-badge warn';
        badgeEl.appendChild(createEl('i', { className: 'fa-solid fa-triangle-exclamation' }));
        badgeEl.appendChild(document.createTextNode(` 動線衝突警示 (${collisions.length}處)：${collisions[0].reason}`));
      }
    }

    // 更新右側空間與坪數換算表 (1 平方公尺 = 0.3025 坪)
    updateRoomScheduleDOM(ver);
  }

  function updateRoomScheduleDOM(ver) {
    const tbody = document.getElementById('roomScheduleBody');
    const summaryEl = document.getElementById('totalAreaSummaryText');
    if (!tbody || !summaryEl) return;

    tbody.replaceChildren();
    let totalM2 = 0;

    (ver.rooms || []).forEach((rm) => {
      const m2 = (rm.widthCm * rm.heightCm) / 10000;
      const ping = m2 * 0.3025;
      totalM2 += m2;

      const tr = createEl('tr', {
        style: { cursor: 'pointer' },
        onClick: () => {
          uiState.selectedItem = { kind: 'room', id: rm.id };
          renderInspectorPanel();
          requestRender2D();
        }
      }, [
        createEl('td', { textContent: rm.name, style: { fontWeight: '700' } }),
        createEl('td', { textContent: `${Math.round(rm.widthCm)}×${Math.round(rm.heightCm)}` }),
        createEl('td', { className: 'num', textContent: m2.toFixed(2) }),
        createEl('td', { className: 'num', textContent: `${ping.toFixed(2)} 坪` })
      ]);
      tbody.appendChild(tr);
    });

    const totalPing = totalM2 * 0.3025;
    summaryEl.textContent = `${totalM2.toFixed(2)} m² ／ ${totalPing.toFixed(2)} 坪`;
  }

  // =========================================================================
  // 5. 模組一〜三：2D CAD 平面格局畫布渲染器 (ANSI31 45°斜線、門扇開啟弧線、CAD 家具圖塊)
  // =========================================================================
  let raf2DPending = false;
  function requestRender2D() {
    if (raf2DPending) return;
    raf2DPending = true;
    requestAnimationFrame(() => {
      raf2DPending = false;
      render2DCanvas();
    });
  }

  function worldToScreen(wx, wy) {
    return {
      x: uiState.panX2D + wx * uiState.zoom2D,
      y: uiState.panY2D + wy * uiState.zoom2D
    };
  }

  function screenToWorld(sx, sy) {
    return {
      x: (sx - uiState.panX2D) / uiState.zoom2D,
      y: (sy - uiState.panY2D) / uiState.zoom2D
    };
  }

  function render2DCanvas() {
    const canvas = document.getElementById('cadCanvas2D');
    const wrap = document.getElementById('canvas2DWrap');
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.max(300, Math.floor(rect.width));
    const ch = Math.max(400, Math.floor(rect.height));

    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.fillStyle = isDark ? '#0B192C' : '#F8FAFC';
    ctx.fillRect(0, 0, cw, ch);

    // 1. 繪製 CAD 10cm / 100cm 工程格線
    drawCadGrid(ctx, cw, ch, isDark);

    const ver = getActiveVersion();
    if (!ver) {
      ctx.restore();
      return;
    }

    uiState.clickableDimBoxes = [];

    ctx.save();
    ctx.translate(uiState.panX2D, uiState.panY2D);
    ctx.scale(uiState.zoom2D, uiState.zoom2D);

    // 2. 繪製半透明背景描繪底圖 (若已上傳)
    if (appState.backgroundMap.imgObj) {
      ctx.save();
      ctx.globalAlpha = appState.backgroundMap.opacity;
      const sc = appState.backgroundMap.scaleCmPerPx || 1.0;
      const img = appState.backgroundMap.imgObj;
      ctx.drawImage(
        img,
        appState.backgroundMap.offsetX,
        appState.backgroundMap.offsetY,
        img.width * sc,
        img.height * sc
      );
      ctx.restore();
    }

    // 3. 繪製各房間區域底色、空間名稱、坪數換算與可點擊尺寸標註
    drawRooms2D(ctx, ver, isDark);

    // 4. 繪製既有開窗採光面金色指示帶
    drawDaylightIndicators2D(ctx, ver, isDark);

    // 5. 繪製標準 CAD 家具圖塊 (含衝突紅框警示)
    drawFurnitureList2D(ctx, ver, isDark);

    // 6. 繪製固定水電管道間錨點 (可自由拖曳)
    drawPlumbingCoreAnchor2D(ctx, ver, isDark);

    // 7. 繪製牆體 (含門窗打斷與 CAD 45° 雙斜線 ANSI31 剖面填充)
    drawWallsWithANSI31Hatch2D(ctx, ver, isDark);

    // 8. 繪製門扇開啟 90° 弧線、迴轉半徑扇形與窗戶多線符號
    drawOpenings2D(ctx, ver, isDark);

    // 9. 繪製外框總尺寸標註線與指北針
    drawExteriorDimensionsAndCompass2D(ctx, ver, isDark);

    // 10. 繪製互動中輔助線 (拉線繪牆預覽 / 磁吸端點圓環 / 兩點比例尺校正基準線)
    drawInteractiveOverlays2D(ctx, isDark);

    ctx.restore();
    ctx.restore();
  }

  function drawCadGrid(ctx, cw, ch, isDark) {
    const step10 = 10 * uiState.zoom2D;
    const step100 = 100 * uiState.zoom2D;

    if (step10 >= 5) {
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.06)' : 'rgba(15, 23, 42, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = uiState.panX2D % step10; x < cw; x += step10) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
      }
      for (let y = uiState.panY2D % step10; y < ch; y += step10) {
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
      }
      ctx.stroke();
    }

    ctx.strokeStyle = isDark ? 'rgba(197, 160, 89, 0.14)' : 'rgba(26, 54, 93, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = uiState.panX2D % step100; x < cw; x += step100) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
    }
    for (let y = uiState.panY2D % step100; y < ch; y += step100) {
      ctx.moveTo(0, y);
      ctx.lineTo(cw, y);
    }
    ctx.stroke();
  }

  function drawRooms2D(ctx, ver, isDark) {
    (ver.rooms || []).forEach((rm) => {
      const meta = ROOM_TYPE_META[rm.roomType] || ROOM_TYPE_META.living;
      const isSelected = uiState.selectedItem && uiState.selectedItem.kind === 'room' && uiState.selectedItem.id === rm.id;

      ctx.save();
      ctx.fillStyle = isDark ? meta.fillDark : meta.fillLight;
      ctx.fillRect(rm.x, rm.y, rm.widthCm, rm.heightCm);

      if (isSelected) {
        ctx.strokeStyle = '#C5A059';
        ctx.lineWidth = 3 / uiState.zoom2D;
        ctx.setLineDash([8 / uiState.zoom2D, 5 / uiState.zoom2D]);
        ctx.strokeRect(rm.x + 2, rm.y + 2, rm.widthCm - 4, rm.heightCm - 4);
        ctx.setLineDash([]);
      }

      // 空間名稱與坪數換算 (1 m² = 0.3025 坪)
      const m2 = (rm.widthCm * rm.heightCm) / 10000;
      const ping = m2 * 0.3025;
      const cx = rm.x + rm.widthCm / 2;
      const cy = rm.y + rm.heightCm / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isDark ? '#F8FAFC' : '#1A365D';
      ctx.font = '800 22px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
      ctx.fillText(rm.name, cx, cy - 16);

      ctx.fillStyle = isDark ? '#FFE8B8' : '#B08C45';
      ctx.font = '800 18px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
      ctx.fillText(`${ping.toFixed(2)} 坪 (${m2.toFixed(1)} m²)`, cx, cy + 10);

      // 可點擊修改淨寬/淨深之互動尺寸膠囊
      const dimText = `淨寬 ${Math.round(rm.widthCm)} × 深 ${Math.round(rm.heightCm)} cm ✎`;
      const pillW = 210;
      const pillH = 26;
      const pillX = cx - pillW / 2;
      const pillY = cy + 26;

      ctx.fillStyle = isDark ? 'rgba(15, 35, 65, 0.9)' : 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark ? '#E2E8F0' : '#0F2341';
      ctx.font = '700 13px "Plus Jakarta Sans", "Noto Sans TC", sans-serif';
      ctx.fillText(dimText, cx, pillY + pillH / 2);

      // 註冊點擊熱區 (世界座標)
      uiState.clickableDimBoxes.push({
        x: pillX,
        y: pillY,
        w: pillW,
        h: pillH,
        targetKind: 'room',
        targetId: rm.id,
        currentVal: Math.round(rm.widthCm),
        label: `修改「${rm.name}」目標淨寬 (cm)：`
      });

      ctx.restore();
    });
  }

  function drawDaylightIndicators2D(ctx, ver, isDark) {
    (ver.walls || []).forEach((w) => {
      if (w.type !== 'exterior' || !w.hasDaylight) return;
      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(255, 232, 184, 0.55)' : 'rgba(197, 160, 89, 0.65)';
      ctx.lineWidth = 8;
      ctx.setLineDash([16, 10]);
      const mx = (w.x1 + w.x2) / 2;
      const my = (w.y1 + w.y2) / 2;
      let ox = 0, oy = 0;
      if (w.side === 'north') oy = -22;
      else if (w.side === 'south') oy = 22;
      else if (w.side === 'east') ox = 22;
      else if (w.side === 'west') ox = -22;

      ctx.beginPath();
      ctx.moveTo(w.x1 + ox, w.y1 + oy);
      ctx.lineTo(w.x2 + ox, w.y2 + oy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = isDark ? '#FFE8B8' : '#B08C45';
      ctx.font = '800 14px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☀️ 既有開窗採光面', mx + ox * 1.9, my + oy * 1.9);
      ctx.restore();
    });
  }

  /**
   * 繪製牆體與標準 CAD 45度雙斜線剖面填充 (ANSI31 Hatch)
   * 當門窗嵌入牆體時，自動打斷牆線
   */
  function drawWallsWithANSI31Hatch2D(ctx, ver, isDark) {
    const openings = ver.openings || [];

    (ver.walls || []).forEach((w) => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;

      const ux = dx / len;
      const uy = dy / len;
      const nx = -uy;
      const ny = ux;
      const halfT = (w.thickness || (w.type === 'exterior' ? 24 : 12)) / 2;

      // 找出此牆上的所有門窗開口區間 [tStart, tEnd]
      const wallOps = openings
        .filter((op) => op.wallId === w.id)
        .map((op) => {
          const halfRatio = ((op.widthCm || 85) / 2) / len;
          return {
            t0: Math.max(0, op.t - halfRatio),
            t1: Math.min(1, op.t + halfRatio),
            op
          };
        })
        .sort((a, b) => a.t0 - b.t0);

      // 切分為實心牆段 (門窗開口處自動打斷)
      const solidSegments = [];
      let cursor = 0;
      wallOps.forEach((item) => {
        if (item.t0 > cursor + 0.005) {
          solidSegments.push([cursor, item.t0]);
        }
        cursor = Math.max(cursor, item.t1);
      });
      if (cursor < 0.995) {
        solidSegments.push([cursor, 1]);
      }

      const isSelected = uiState.selectedItem && uiState.selectedItem.kind === 'wall' && uiState.selectedItem.id === w.id;
      const isHovered = uiState.hoveredItem && uiState.hoveredItem.kind === 'wall' && uiState.hoveredItem.id === w.id;

      solidSegments.forEach(([tA, tB]) => {
        const ax = w.x1 + dx * tA;
        const ay = w.y1 + dy * tA;
        const bx = w.x1 + dx * tB;
        const by = w.y1 + dy * tB;

        const p1 = { x: ax + nx * halfT, y: ay + ny * halfT };
        const p2 = { x: bx + nx * halfT, y: by + ny * halfT };
        const p3 = { x: bx - nx * halfT, y: by - ny * halfT };
        const p4 = { x: ax - nx * halfT, y: ay - ny * halfT };

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();

        // 牆體底色：區分「既有鎖定外牆」與「室內可調隔間牆」
        if (w.type === 'exterior') {
          ctx.fillStyle = isDark ? '#1E3A5F' : '#CBD5E1';
        } else {
          ctx.fillStyle = isDark ? '#334155' : '#E2E8F0';
        }
        ctx.fill();

        // 渲染標準 CAD 45度雙斜線剖面填充 (ANSI31 Hatch)
        if (appState.settings.showHatch) {
          ctx.save();
          ctx.clip();
          const minX = Math.min(p1.x, p2.x, p3.x, p4.x) - 20;
          const maxX = Math.max(p1.x, p2.x, p3.x, p4.x) + 20;
          const minY = Math.min(p1.y, p2.y, p3.y, p4.y) - 20;
          const maxY = Math.max(p1.y, p2.y, p3.y, p4.y) + 20;
          const span = (maxX - minX) + (maxY - minY);

          ctx.strokeStyle = w.type === 'exterior'
            ? (isDark ? 'rgba(255, 232, 184, 0.55)' : 'rgba(15, 35, 65, 0.55)')
            : (isDark ? 'rgba(203, 213, 225, 0.45)' : 'rgba(51, 65, 85, 0.45)');
          ctx.lineWidth = 1.2;
          const hatchStep = 14;
          ctx.beginPath();
          for (let d = -span; d <= span; d += hatchStep) {
            // 雙斜線第一條
            ctx.moveTo(minX + d, minY);
            ctx.lineTo(minX + d + (maxY - minY), maxY);
            // 雙斜線第二條 (ANSI31 雙線特徵)
            ctx.moveTo(minX + d + 4, minY);
            ctx.lineTo(minX + d + 4 + (maxY - minY), maxY);
          }
          ctx.stroke();
          ctx.restore();
        }

        // 牆邊框線
        ctx.strokeStyle = isSelected
          ? '#C5A059'
          : isHovered
            ? '#3B82F6'
            : (w.type === 'exterior'
              ? (isDark ? '#F8FAFC' : '#0F2341')
              : (isDark ? '#CBD5E1' : '#334155'));
        ctx.lineWidth = isSelected || isHovered ? 3 : (w.type === 'exterior' ? 2.4 : 1.8);
        ctx.stroke();
        ctx.restore();
      });

      // 針對室內隔間牆顯示可拖拉微調手把與長度標籤
      if (w.type === 'interior') {
        const mx = (w.x1 + w.x2) / 2;
        const my = (w.y1 + w.y2) / 2;
        ctx.save();
        ctx.fillStyle = isSelected ? '#C5A059' : (isDark ? '#1E293B' : '#FFFFFF');
        ctx.strokeStyle = '#C5A059';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  /**
   * 繪製門窗符號、門扇開啟弧線 (Door Swing Arc) 與開門迴轉半徑扇形
   */
  function drawOpenings2D(ctx, ver, isDark) {
    (ver.openings || []).forEach((op) => {
      const geom = getOpeningGeometry(op, ver);
      if (!geom) return;

      const { wall, pStart, pEnd, hingePt, latchPt, nx, ny, swingRadius, swingDir } = geom;
      const halfT = (wall.thickness || 12) / 2;
      const isSelected = uiState.selectedItem && uiState.selectedItem.kind === 'opening' && uiState.selectedItem.id === op.id;

      ctx.save();

      if (op.type === 'window' || op.type === 'floor_window') {
        // 標準 CAD 4線窗框符號
        const c1 = { x: pStart.x + nx * halfT, y: pStart.y + ny * halfT };
        const c2 = { x: pEnd.x + nx * halfT, y: pEnd.y + ny * halfT };
        const c3 = { x: pEnd.x - nx * halfT, y: pEnd.y - ny * halfT };
        const c4 = { x: pStart.x - nx * halfT, y: pStart.y - ny * halfT };

        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(186, 230, 253, 0.65)';
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#C5A059' : (isDark ? '#38BDF8' : '#0284C7');
        ctx.lineWidth = isSelected ? 2.6 : 1.6;
        ctx.stroke();

        // 窗戶雙玻璃中心線
        ctx.beginPath();
        ctx.moveTo(pStart.x + nx * 3, pStart.y + ny * 3);
        ctx.lineTo(pEnd.x + nx * 3, pEnd.y + ny * 3);
        ctx.moveTo(pStart.x - nx * 3, pStart.y - ny * 3);
        ctx.lineTo(pEnd.x - nx * 3, pEnd.y - ny * 3);
        ctx.stroke();
      } else {
        // 門扇 (入口玄關大門 / 室內單開門)
        const isEntrance = op.type === 'entrance';
        const openEndPt = {
          x: hingePt.x + nx * swingDir * swingRadius,
          y: hingePt.y + ny * swingDir * swingRadius
        };

        const angClosed = Math.atan2(latchPt.y - hingePt.y, latchPt.x - hingePt.x);
        const angOpen = Math.atan2(openEndPt.y - hingePt.y, openEndPt.x - hingePt.x);

        // 計算最短 90 度圓弧方向
        let diff = angOpen - angClosed;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const anticlockwise = diff < 0;

        // 迴轉半徑防呆扇形區
        if (appState.settings.showClearanceZones) {
          ctx.fillStyle = isEntrance
            ? 'rgba(16, 185, 129, 0.14)'
            : (isDark ? 'rgba(197, 160, 89, 0.10)' : 'rgba(197, 160, 89, 0.12)');
          ctx.beginPath();
          ctx.moveTo(hingePt.x, hingePt.y);
          ctx.arc(hingePt.x, hingePt.y, swingRadius, angClosed, angOpen, anticlockwise);
          ctx.closePath();
          ctx.fill();
        }

        // 門扇開啟 90 度虛線圓弧
        ctx.strokeStyle = isEntrance ? '#10B981' : (isSelected ? '#C5A059' : (isDark ? '#94A3B8' : '#475569'));
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(hingePt.x, hingePt.y, swingRadius, angClosed, angOpen, anticlockwise);
        ctx.stroke();
        ctx.setLineDash([]);

        // 門板實線 (厚度 6cm 矩形)
        ctx.strokeStyle = isEntrance ? '#059669' : (isSelected ? '#C5A059' : (isDark ? '#F8FAFC' : '#1A365D'));
        ctx.lineWidth = isEntrance ? 4.5 : 3.2;
        ctx.beginPath();
        ctx.moveTo(hingePt.x, hingePt.y);
        ctx.lineTo(openEndPt.x, openEndPt.y);
        ctx.stroke();

        // 若為入口玄關大門錨點，繪製醒目玄關標記 (提示可拖曳)
        if (isEntrance) {
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.roundRect(geom.cx - 58, geom.cy - 14, 116, 28, 14);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 13px "Noto Sans TC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚪 入口玄關 (可拖曳)', geom.cx, geom.cy);
        }
      }

      ctx.restore();
    });
  }

  /**
   * 繪製固定水電管道間錨點 (模組二：衛浴/流理台排水點，可自由拖曳)
   */
  function drawPlumbingCoreAnchor2D(ctx, ver, isDark) {
    if (!ver.anchors || !ver.anchors.plumbingCore) return;
    const p = ver.anchors.plumbingCore;
    const hw = (p.widthCm || 76) / 2;
    const hd = (p.depthCm || 58) / 2;

    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(14, 165, 233, 0.22)' : 'rgba(14, 165, 233, 0.16)';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.rect(p.x - hw, p.y - hd, hw * 2, hd * 2);
    ctx.fill();
    ctx.stroke();

    // 管道間標準 CAD 對角交叉線 (X)
    ctx.beginPath();
    ctx.moveTo(p.x - hw, p.y - hd);
    ctx.lineTo(p.x + hw, p.y + hd);
    ctx.moveTo(p.x + hw, p.y - hd);
    ctx.lineTo(p.x - hw, p.y + hd);
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.roundRect(p.x - 52, p.y - 12, 104, 24, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 12px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚰 水電管道間', p.x, p.y);
    ctx.restore();
  }

  /**
   * 模組三：繪製 11 款國家標準 2D CAD 建築家具線條圖塊
   * 若與門扇開啟迴轉半徑重疊，立即渲染紅色警示框與衝突標記
   */
  function drawFurnitureList2D(ctx, ver, isDark) {
    const collidingIds = new Set(uiState.collisions.map((c) => c.furnId));

    (ver.furniture || []).forEach((f) => {
      const hasCollision = collidingIds.has(f.id);
      const isSelected = uiState.selectedItem && uiState.selectedItem.kind === 'furniture' && uiState.selectedItem.id === f.id;
      const w = f.widthCm;
      const d = f.depthCm;

      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(((f.rotation || 0) * Math.PI) / 180);

      // 圖塊背景與外框
      ctx.fillStyle = hasCollision
        ? 'rgba(239, 68, 68, 0.22)'
        : (isDark ? 'rgba(30, 41, 59, 0.88)' : 'rgba(255, 255, 255, 0.92)');
      ctx.strokeStyle = hasCollision
        ? '#EF4444'
        : isSelected
          ? '#C5A059'
          : (isDark ? '#CBD5E1' : '#1E293B');
      ctx.lineWidth = hasCollision || isSelected ? 2.6 : 1.5;

      ctx.beginPath();
      ctx.rect(-w / 2, -d / 2, w, d);
      ctx.fill();
      ctx.stroke();

      // 依 catalogId 繪製精細 2D CAD 內部建築線條
      ctx.strokeStyle = hasCollision ? '#EF4444' : (isDark ? '#94A3B8' : '#334155');
      ctx.lineWidth = 1.2;

      if (f.catalogId === 'double_bed') {
        // 床頭板 + 雙枕頭 + 棉被折線
        ctx.strokeRect(-w / 2 + 4, -d / 2 + 4, w - 8, 12);
        ctx.strokeRect(-w / 2 + 14, -d / 2 + 22, w / 2 - 20, 28);
        ctx.strokeRect(6, -d / 2 + 22, w / 2 - 20, 28);
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, -d / 2 + 62);
        ctx.lineTo(w / 2 - 4, -d / 2 + 62);
        ctx.lineTo(w / 2 - 22, -d / 2 + 82);
        ctx.lineTo(-w / 2 + 4, -d / 2 + 82);
        ctx.stroke();
      } else if (f.catalogId === 'single_bed') {
        ctx.strokeRect(-w / 2 + 4, -d / 2 + 4, w - 8, 12);
        ctx.strokeRect(-w / 2 + 16, -d / 2 + 22, w - 32, 28);
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, -d / 2 + 62);
        ctx.lineTo(w / 2 - 4, -d / 2 + 62);
        ctx.stroke();
      } else if (f.catalogId === 'wardrobe') {
        // 衣櫃吊衣桿與衣架斜線符號
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, 0);
        ctx.lineTo(w / 2 - 8, 0);
        for (let ix = -w / 2 + 20; ix < w / 2 - 15; ix += 18) {
          ctx.moveTo(ix - 5, -d * 0.3);
          ctx.lineTo(ix + 5, d * 0.3);
        }
        ctx.stroke();
      } else if (f.catalogId === 'sofa') {
        // 沙發靠背、左右扶手與三座墊分界
        ctx.strokeRect(-w / 2 + 4, -d / 2 + 4, w - 8, 18);
        ctx.strokeRect(-w / 2 + 4, -d / 2 + 4, 18, d - 8);
        ctx.strokeRect(w / 2 - 22, -d / 2 + 4, 18, d - 8);
        ctx.beginPath();
        ctx.moveTo(-w / 6, -d / 2 + 22);
        ctx.lineTo(-w / 6, d / 2 - 4);
        ctx.moveTo(w / 6, -d / 2 + 22);
        ctx.lineTo(w / 6, d / 2 - 4);
        ctx.stroke();
      } else if (f.catalogId === 'coffee_table') {
        ctx.strokeRect(-w / 2 + 8, -d / 2 + 8, w - 16, d - 16);
      } else if (f.catalogId === 'dining_table') {
        ctx.strokeRect(-w / 2 + 10, -d / 2 + 10, w - 20, d - 20);
        // 四張餐椅弧線
        ctx.strokeRect(-w / 4 - 16, -d / 2 - 8, 32, 8);
        ctx.strokeRect(w / 4 - 16, -d / 2 - 8, 32, 8);
        ctx.strokeRect(-w / 4 - 16, d / 2, 32, 8);
        ctx.strokeRect(w / 4 - 16, d / 2, 32, 8);
      } else if (f.catalogId === 'desk') {
        ctx.strokeRect(-w / 2 + 6, -d / 2 + 6, w - 12, d - 16);
        ctx.beginPath();
        ctx.arc(0, d / 2 - 4, 18, 0, Math.PI);
        ctx.stroke();
      } else if (f.catalogId === 'toilet') {
        // 水箱 + 橢圓馬桶座
        ctx.strokeRect(-w / 2 + 4, -d / 2 + 3, w - 8, 18);
        ctx.beginPath();
        ctx.ellipse(0, 8, w * 0.36, d * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.catalogId === 'basin') {
        ctx.beginPath();
        ctx.ellipse(0, 3, w * 0.35, d * 0.3, 0, 0, Math.PI * 2);
        ctx.moveTo(0, -d / 2 + 4);
        ctx.lineTo(0, -4);
        ctx.stroke();
      } else if (f.catalogId === 'shower') {
        // 乾濕分離對角排水斜線與中心落水頭
        ctx.beginPath();
        ctx.moveTo(-w / 2, -d / 2);
        ctx.lineTo(w / 2, d / 2);
        ctx.moveTo(w / 2, -d / 2);
        ctx.lineTo(-w / 2, d / 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (f.catalogId === 'kitchen_counter') {
        // 流理台水槽 + 雙口爐同心圓
        ctx.strokeRect(-w * 0.38, -d * 0.3, w * 0.32, d * 0.6);
        ctx.beginPath();
        ctx.arc(w * 0.16, 0, 13, 0, Math.PI * 2);
        ctx.arc(w * 0.34, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 家具名稱標籤 (轉正顯示)
      ctx.rotate(-((f.rotation || 0) * Math.PI) / 180);
      ctx.fillStyle = hasCollision ? '#DC2626' : (isDark ? '#E2E8F0' : '#1E293B');
      ctx.font = '700 12px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hasCollision ? `⚠️ ${f.name}` : f.name, 0, 0);

      ctx.restore();
    });
  }

  function drawExteriorDimensionsAndCompass2D(ctx, ver, isDark) {
    const bounds = getEnvelopeBounds(ver);
    const { minX, minY, maxX, maxY, width, height } = bounds;

    ctx.save();
    ctx.strokeStyle = isDark ? '#94A3B8' : '#475569';
    ctx.fillStyle = isDark ? '#F8FAFC' : '#1A365D';
    ctx.lineWidth = 1.4;
    ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 上方總寬尺寸線
    const topY = minY - 48;
    ctx.beginPath();
    ctx.moveTo(minX, minY - 18);
    ctx.lineTo(minX, topY - 8);
    ctx.moveTo(maxX, minY - 18);
    ctx.lineTo(maxX, topY - 8);
    ctx.moveTo(minX, topY);
    ctx.lineTo(maxX, topY);
    ctx.stroke();
    ctx.fillText(`建築外框總寬：${Math.round(width)} cm`, (minX + maxX) / 2, topY - 14);

    // 左側總深尺寸線
    const leftX = minX - 48;
    ctx.beginPath();
    ctx.moveTo(minX - 18, minY);
    ctx.lineTo(leftX - 8, minY);
    ctx.moveTo(minX - 18, maxY);
    ctx.lineTo(leftX - 8, maxY);
    ctx.moveTo(leftX, minY);
    ctx.lineTo(leftX, maxY);
    ctx.stroke();

    ctx.save();
    ctx.translate(leftX - 16, (minY + maxY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`建築外框總深：${Math.round(height)} cm`, 0, 0);
    ctx.restore();

    // 右上角標準建築指北針 (North Arrow)
    const compX = maxX + 65;
    const compY = minY + 45;
    ctx.beginPath();
    ctx.arc(compX, compY, 24, 0, Math.PI * 2);
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#C5A059';
    ctx.beginPath();
    ctx.moveTo(compX, compY - 20);
    ctx.lineTo(compX - 8, compY + 8);
    ctx.lineTo(compX, compY + 2);
    ctx.lineTo(compX + 8, compY + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDark ? '#FFE8B8' : '#1A365D';
    ctx.font = '900 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('N', compX, compY - 30);

    ctx.restore();
  }

  function drawInteractiveOverlays2D(ctx, isDark) {
    // 磁吸端點圓環
    if (uiState.snapIndicator) {
      ctx.save();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(uiState.snapIndicator.x, uiState.snapIndicator.y, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 拉線繪製牆體預覽與即時尺寸標註
    if (uiState.drawingWall) {
      const dw = uiState.drawingWall;
      const len = Math.round(Math.hypot(dw.x2 - dw.x1, dw.y2 - dw.y1));
      ctx.save();
      ctx.strokeStyle = '#C5A059';
      ctx.lineWidth = dw.type === 'exterior' ? 24 : 12;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(dw.x1, dw.y1);
      ctx.lineTo(dw.x2, dw.y2);
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      const mx = (dw.x1 + dw.x2) / 2;
      const my = (dw.y1 + dw.y2) / 2;
      ctx.fillStyle = '#1A365D';
      ctx.beginPath();
      ctx.roundRect(mx - 48, my - 34, 96, 26, 6);
      ctx.fill();
      ctx.fillStyle = '#FFE8B8';
      ctx.font = '800 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${len} cm`, mx, my - 21);
      ctx.restore();
    }

    // 模組一：兩點比例尺校正基準線
    if (uiState.calibrating && uiState.calibrating.x1 !== undefined) {
      const cal = uiState.calibrating;
      ctx.save();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(cal.x1, cal.y1);
      ctx.lineTo(cal.x2, cal.y2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cal.x1, cal.y1, 7, 0, Math.PI * 2);
      ctx.arc(cal.x2, cal.y2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // =========================================================================
  // 6. 2D 畫布滑鼠/觸控互動、點擊尺寸改淨寬與屬性微調面板
  // =========================================================================
  function snapPoint(wx, wy, ver) {
    uiState.snapIndicator = null;
    if (!appState.settings.snapToGrid) {
      return { x: Math.round(wx), y: Math.round(wy) };
    }

    // 優先吸附既有牆體端點 (磁吸半徑 22cm)
    let bestDist = 22;
    let snapped = null;
    (ver.walls || []).forEach((w) => {
      [[w.x1, w.y1], [w.x2, w.y2]].forEach(([px, py]) => {
        const d = Math.hypot(wx - px, wy - py);
        if (d < bestDist) {
          bestDist = d;
          snapped = { x: px, y: py };
        }
      });
    });

    if (snapped) {
      uiState.snapIndicator = snapped;
      return snapped;
    }

    const g = appState.settings.gridSizeCm || 10;
    return {
      x: Math.round(wx / g) * g,
      y: Math.round(wy / g) * g
    };
  }

  function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return { dist: Math.hypot(px - projX, py - projY), t, projX, projY };
  }

  function hitTest2D(wx, wy, ver) {
    // 1. 優先檢查可點擊尺寸膠囊
    for (let i = uiState.clickableDimBoxes.length - 1; i >= 0; i--) {
      const b = uiState.clickableDimBoxes[i];
      if (wx >= b.x && wx <= b.x + b.w && wy >= b.y && wy <= b.y + b.h) {
        return { kind: 'dim_pill', box: b };
      }
    }

    // 2. 檢查固定水電管道間錨點
    if (ver.anchors && ver.anchors.plumbingCore) {
      const p = ver.anchors.plumbingCore;
      const hw = (p.widthCm || 76) / 2;
      const hd = (p.depthCm || 58) / 2;
      if (wx >= p.x - hw && wx <= p.x + hw && wy >= p.y - hd && wy <= p.y + hd) {
        return { kind: 'anchor_pipe', id: 'plumbingCore' };
      }
    }

    // 3. 檢查門窗開口 (特別是入口玄關大門錨點)
    for (let i = (ver.openings || []).length - 1; i >= 0; i--) {
      const op = ver.openings[i];
      const geom = getOpeningGeometry(op, ver);
      if (!geom) continue;
      if (Math.hypot(wx - geom.cx, wy - geom.cy) <= Math.max(42, op.widthCm * 0.45)) {
        return { kind: 'opening', id: op.id, op };
      }
    }

    // 4. 檢查家具圖塊
    for (let i = (ver.furniture || []).length - 1; i >= 0; i--) {
      const f = ver.furniture[i];
      const box = getFurnitureEffectiveBox(f);
      if (wx >= box.left && wx <= box.right && wy >= box.top && wy <= box.bottom) {
        return { kind: 'furniture', id: f.id, furn: f };
      }
    }

    // 5. 檢查牆體 (室內隔間牆優先於外牆)
    const sortedWalls = [...(ver.walls || [])].sort((a, b) => (a.type === 'interior' ? -1 : 1));
    for (let i = 0; i < sortedWalls.length; i++) {
      const w = sortedWalls[i];
      const res = pointToSegmentDist(wx, wy, w.x1, w.y1, w.x2, w.y2);
      if (res.dist <= Math.max(16, (w.thickness || 12) * 0.85)) {
        return { kind: 'wall', id: w.id, wall: w, t: res.t };
      }
    }

    // 6. 檢查房間區域
    for (let i = (ver.rooms || []).length - 1; i >= 0; i--) {
      const rm = ver.rooms[i];
      if (wx >= rm.x && wx <= rm.x + rm.widthCm && wy >= rm.y && wy <= rm.y + rm.heightCm) {
        return { kind: 'room', id: rm.id, room: rm };
      }
    }

    return null;
  }

  /**
   * 模組二：拖拉室內隔間牆或直接輸入房間淨寬 (cm) 時，自動維持相連牆體與鄰房尺寸
   */
  function moveInteriorWallAndSyncRooms(ver, wall, newCoord) {
    if (wall.locked || wall.type === 'exterior') return;
    const isVert = Math.abs(wall.x1 - wall.x2) < 1;
    const isHoriz = Math.abs(wall.y1 - wall.y2) < 1;
    const bounds = getEnvelopeBounds(ver);

    if (isVert) {
      const oldX = wall.x1;
      const clampedX = Math.max(bounds.minX + 140, Math.min(bounds.maxX - 140, Math.round(newCoord)));
      const deltaX = clampedX - oldX;
      wall.x1 = clampedX;
      wall.x2 = clampedX;

      // 同步連接到此垂直牆端點的水平內牆
      (ver.walls || []).forEach((ow) => {
        if (ow.id === wall.id || ow.locked) return;
        if (Math.abs(ow.x1 - oldX) <= 15) ow.x1 = clampedX;
        if (Math.abs(ow.x2 - oldX) <= 15) ow.x2 = clampedX;
      });

      // 同步更新以此牆為界的房間淨寬與位置
      (ver.rooms || []).forEach((rm) => {
        if (Math.abs((rm.x + rm.widthCm) - oldX) <= 20) {
          rm.widthCm = Math.max(120, clampedX - rm.x);
        } else if (Math.abs(rm.x - oldX) <= 20) {
          const rightEdge = rm.x + rm.widthCm;
          rm.x = clampedX;
          rm.widthCm = Math.max(120, rightEdge - clampedX);
        }
      });

      // 微調房間內家具不穿牆
      (ver.furniture || []).forEach((f) => {
        if (Math.abs(f.x - oldX) < 95) f.x += deltaX;
      });
    } else if (isHoriz) {
      const oldY = wall.y1;
      const clampedY = Math.max(bounds.minY + 140, Math.min(bounds.maxY - 140, Math.round(newCoord)));
      const deltaY = clampedY - oldY;
      wall.y1 = clampedY;
      wall.y2 = clampedY;

      (ver.walls || []).forEach((ow) => {
        if (ow.id === wall.id || ow.locked) return;
        if (Math.abs(ow.y1 - oldY) <= 15) ow.y1 = clampedY;
        if (Math.abs(ow.y2 - oldY) <= 15) ow.y2 = clampedY;
      });

      (ver.rooms || []).forEach((rm) => {
        if (Math.abs((rm.y + rm.heightCm) - oldY) <= 20) {
          rm.heightCm = Math.max(120, clampedY - rm.y);
        } else if (Math.abs(rm.y - oldY) <= 20) {
          const bottomEdge = rm.y + rm.heightCm;
          rm.y = clampedY;
          rm.heightCm = Math.max(120, bottomEdge - clampedY);
        }
      });

      (ver.furniture || []).forEach((f) => {
        if (Math.abs(f.y - oldY) < 95) f.y += deltaY;
      });
    }
  }

  /**
   * 開啟畫布內嵌輸入框 (用於點擊尺寸直接改房間淨寬 cm，或兩點比例尺校正輸入實際長度 cm)
   */
  let activePopoverCallback = null;
  function openCanvasPopover(label, defaultVal, onConfirm) {
    const pop = document.getElementById('canvasPopover');
    const lbl = document.getElementById('popoverLabel');
    const inp = document.getElementById('popoverInput');
    if (!pop || !lbl || !inp) return;

    lbl.textContent = label;
    inp.value = defaultVal;
    pop.hidden = false;
    inp.focus();
    inp.select();
    activePopoverCallback = onConfirm;
  }

  function closeCanvasPopover() {
    const pop = document.getElementById('canvasPopover');
    if (pop) pop.hidden = true;
    activePopoverCallback = null;
    uiState.calibrating = null;
    requestRender2D();
  }

  /**
   * 選取元素時，動態渲染右側「選取物件直覺微調」面板
   */
  function renderInspectorPanel() {
    const container = document.getElementById('inspectorContainer');
    const tagEl = document.getElementById('selectedTypeTag');
    if (!container || !tagEl) return;

    container.replaceChildren();
    const ver = getActiveVersion();
    const sel = uiState.selectedItem;

    if (!sel || !ver) {
      tagEl.textContent = '未選取';
      container.appendChild(
        createEl('div', {
          style: { fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' },
          textContent: '👆 點擊畫布上的隔間牆、門窗、空間名稱或家具圖塊，即可在此直接輸入精準尺寸（cm）、切換牆厚或修改空間名稱。'
        })
      );
      return;
    }

    if (sel.kind === 'room') {
      const rm = (ver.rooms || []).find((r) => r.id === sel.id);
      if (!rm) return;
      tagEl.textContent = '空間區域';

      const nameInput = createEl('input', {
        type: 'text',
        value: rm.name,
        onInput: (e) => {
          rm.name = e.target.value;
          recalculateCollisionsAndSchedule();
          requestRender2D();
          rebuild3DScene();
        }
      });

      const wInput = createEl('input', {
        type: 'number',
        min: '120',
        max: '1200',
        value: Math.round(rm.widthCm),
        onChange: (e) => {
          const targetW = Math.max(120, Number(e.target.value) || rm.widthCm);
          applyRoomTargetWidth(ver, rm, targetW);
        }
      });

      const hInput = createEl('input', {
        type: 'number',
        min: '120',
        max: '1200',
        value: Math.round(rm.heightCm),
        onChange: (e) => {
          const targetH = Math.max(120, Number(e.target.value) || rm.heightCm);
          applyRoomTargetHeight(ver, rm, targetH);
        }
      });

      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '空間名稱：' }), nameInput]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '目標淨寬 (cm)：' }), wInput]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '目標淨深 (cm)：' }), hInput]));
    } else if (sel.kind === 'wall') {
      const w = (ver.walls || []).find((item) => item.id === sel.id);
      if (!w) return;
      tagEl.textContent = w.type === 'exterior' ? '既有外牆 (鎖定)' : '室內隔間牆';

      const typeSelect = createEl('select', {
        onChange: (e) => {
          w.type = e.target.value;
          w.locked = w.type === 'exterior';
          w.thickness = w.type === 'exterior' ? 24 : 12;
          renderInspectorPanel();
          requestRender2D();
          rebuild3DScene();
        }
      }, [
        createEl('option', { value: 'interior', textContent: '室內隔間牆 (可調)', ...(w.type === 'interior' ? { selected: 'selected' } : {}) }),
        createEl('option', { value: 'exterior', textContent: '既有外牆 (鎖定)', ...(w.type === 'exterior' ? { selected: 'selected' } : {}) })
      ]);

      const thickSelect = createEl('select', {
        onChange: (e) => {
          w.thickness = Number(e.target.value);
          requestRender2D();
          rebuild3DScene();
        }
      }, [10, 12, 15, 20, 24].map((val) =>
        createEl('option', {
          value: String(val),
          textContent: `${val} cm`,
          ...(Number(w.thickness) === val ? { selected: 'selected' } : {})
        })
      ));

      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '牆體屬性：' }), typeSelect]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '牆體厚度：' }), thickSelect]));
    } else if (sel.kind === 'furniture') {
      const f = (ver.furniture || []).find((item) => item.id === sel.id);
      if (!f) return;
      tagEl.textContent = 'CAD 家具圖塊';

      const wInput = createEl('input', {
        type: 'number',
        min: '30',
        max: '400',
        value: Math.round(f.widthCm),
        onChange: (e) => {
          f.widthCm = Math.max(30, Number(e.target.value) || f.widthCm);
          recalculateCollisionsAndSchedule();
          requestRender2D();
          rebuild3DScene();
        }
      });

      const dInput = createEl('input', {
        type: 'number',
        min: '30',
        max: '400',
        value: Math.round(f.depthCm),
        onChange: (e) => {
          f.depthCm = Math.max(30, Number(e.target.value) || f.depthCm);
          recalculateCollisionsAndSchedule();
          requestRender2D();
          rebuild3DScene();
        }
      });

      const rotInput = createEl('input', {
        type: 'number',
        step: '90',
        value: Math.round(f.rotation || 0),
        onChange: (e) => {
          f.rotation = ((Number(e.target.value) % 360) + 360) % 360;
          recalculateCollisionsAndSchedule();
          requestRender2D();
          rebuild3DScene();
        }
      });

      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '圖塊名稱：' }), createEl('strong', { textContent: f.name })]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '寬度 (cm)：' }), wInput]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '深度 (cm)：' }), dInput]));
      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '旋轉角度：' }), rotInput]));
    } else if (sel.kind === 'opening') {
      const op = (ver.openings || []).find((item) => item.id === sel.id);
      if (!op) return;
      tagEl.textContent = op.type === 'window' ? '採光窗戶' : (op.type === 'entrance' ? '入口玄關大門' : '室內門扇');

      const wInput = createEl('input', {
        type: 'number',
        min: '60',
        max: '300',
        value: Math.round(op.widthCm),
        onChange: (e) => {
          op.widthCm = Math.max(60, Number(e.target.value) || op.widthCm);
          recalculateCollisionsAndSchedule();
          requestRender2D();
          rebuild3DScene();
        }
      });

      container.appendChild(createEl('div', { className: 'inspector-row' }, [createEl('label', { textContent: '開口寬度 (cm)：' }), wInput]));
    }
  }

  function applyRoomTargetWidth(ver, rm, targetW) {
    pushUndo();
    const rightEdge = rm.x + rm.widthCm;
    // 尋找位於此房間右側或左側的室內垂直隔間牆
    const rightWall = (ver.walls || []).find(
      (w) => w.type === 'interior' && Math.abs(w.x1 - w.x2) < 1 && Math.abs(w.x1 - rightEdge) <= 20
    );
    const leftWall = (ver.walls || []).find(
      (w) => w.type === 'interior' && Math.abs(w.x1 - w.x2) < 1 && Math.abs(w.x1 - rm.x) <= 20
    );

    if (rightWall) {
      moveInteriorWallAndSyncRooms(ver, rightWall, rm.x + targetW);
    } else if (leftWall) {
      moveInteriorWallAndSyncRooms(ver, leftWall, rightEdge - targetW);
    } else {
      rm.widthCm = targetW;
    }
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    rebuild3DScene();
    showToast(`✅ 已將「${rm.name}」淨寬更新為 ${Math.round(rm.widthCm)} cm`);
  }

  function applyRoomTargetHeight(ver, rm, targetH) {
    pushUndo();
    const bottomEdge = rm.y + rm.heightCm;
    const bottomWall = (ver.walls || []).find(
      (w) => w.type === 'interior' && Math.abs(w.y1 - w.y2) < 1 && Math.abs(w.y1 - bottomEdge) <= 20
    );
    const topWall = (ver.walls || []).find(
      (w) => w.type === 'interior' && Math.abs(w.y1 - w.y2) < 1 && Math.abs(w.y1 - rm.y) <= 20
    );

    if (bottomWall) {
      moveInteriorWallAndSyncRooms(ver, bottomWall, rm.y + targetH);
    } else if (topWall) {
      moveInteriorWallAndSyncRooms(ver, topWall, bottomEdge - targetH);
    } else {
      rm.heightCm = targetH;
    }
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    rebuild3DScene();
    showToast(`✅ 已將「${rm.name}」淨深更新為 ${Math.round(rm.heightCm)} cm`);
  }

  // =========================================================================
  // 7. 模組四：Three.js (WebGL) 60 FPS 低多邊形 3D 即時轉換與雙視角引擎
  // =========================================================================
  let threeRenderer = null;
  let threeScene = null;
  let threeCamera = null;
  let threeControls = null;
  let buildingGroup3D = null;
  let exteriorWallMeshes3D = [];
  let keysPressed = {};

  function init3DEngine() {
    const canvas = document.getElementById('webglCanvas3D');
    const wrap = document.getElementById('canvas3DWrap');
    if (!canvas || !wrap || typeof THREE === 'undefined') return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(300, rect.width || 600);
    const h = Math.max(400, rect.height || 560);

    threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x0f2341);

    threeCamera = new THREE.PerspectiveCamera(48, w / h, 5, 10000);
    threeCamera.position.set(480, 920, 1180);

    threeRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    threeRenderer.setSize(w, h);
    threeRenderer.shadowMap.enabled = false; // 關閉昂貴陰影貼圖，確保無獨顯文書筆電 60 FPS

    if (THREE.OrbitControls) {
      threeControls = new THREE.OrbitControls(threeCamera, canvas);
      threeControls.enableDamping = true;
      threeControls.dampingFactor = 0.08;
      threeControls.target.set(480, 80, 360);
      threeControls.maxPolarAngle = Math.PI / 2 - 0.03;
      threeControls.update();
    }

    // 環境光與方向光
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x334155, 0.85);
    hemiLight.position.set(0, 1200, 0);
    threeScene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 0.72);
    dirLight.position.set(600, 1400, 900);
    threeScene.add(dirLight);

    buildingGroup3D = new THREE.Group();
    threeScene.add(buildingGroup3D);

    rebuild3DScene();
    start3DAnimationLoop();
  }

  /**
   * 依據目前 2D 格局方案，即時擠出 3D 牆體 (自動挖空門高 210cm、窗台高 90cm)
   * 並置入對應比例之 3D 低多邊形 (Low-Poly) 家具模型
   */
  function rebuild3DScene() {
    if (!threeScene || !buildingGroup3D || typeof THREE === 'undefined') return;

    // 清除既有 3D 物件並釋放幾何記憶體
    while (buildingGroup3D.children.length > 0) {
      const child = buildingGroup3D.children[0];
      buildingGroup3D.remove(child);
    }
    exteriorWallMeshes3D = [];

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    threeScene.background = new THREE.Color(isDark ? 0x0b192c : 0xe2e8f0);

    const ver = getActiveVersion();
    if (!ver) return;

    const floorH = appState.settings.floorHeightCm || 300;
    const headerFloorEl = document.getElementById('headerFloorHeightText');
    if (headerFloorEl) headerFloorEl.textContent = String(floorH);

    const bounds = getEnvelopeBounds(ver);

    // 1. 外部建築底板
    const baseGeo = new THREE.BoxGeometry(bounds.width + 160, 8, bounds.height + 160);
    const baseMat = new THREE.MeshLambertMaterial({ color: isDark ? 0x1e293b : 0xcbd5e1 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(bounds.minX + bounds.width / 2, -5, bounds.minY + bounds.height / 2);
    buildingGroup3D.add(baseMesh);

    // 2. 各房間地板材質 (溫潤木地板 / 衛浴石材磚)
    (ver.rooms || []).forEach((rm) => {
      const meta = ROOM_TYPE_META[rm.roomType] || ROOM_TYPE_META.living;
      const rGeo = new THREE.BoxGeometry(rm.widthCm, 4, rm.heightCm);
      const rMat = new THREE.MeshLambertMaterial({ color: meta.floor3D });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.position.set(rm.x + rm.widthCm / 2, 0, rm.y + rm.heightCm / 2);
      buildingGroup3D.add(rMesh);
    });

    // 3. 固定水電管道間 3D 立柱
    if (ver.anchors && ver.anchors.plumbingCore) {
      const p = ver.anchors.plumbingCore;
      const pGeo = new THREE.BoxGeometry(p.widthCm || 76, floorH, p.depthCm || 58);
      const pMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.55 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(p.x, floorH / 2, p.y);
      buildingGroup3D.add(pMesh);
    }

    // 4. 垂直擠出所有 2D 牆體，並在門洞 (高 210cm) 與窗洞 (檯度 90cm, 高 120cm) 自動挖空
    const extWallMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const intWallMat = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });
    const topCapMat = new THREE.MeshLambertMaterial({ color: 0x1a365d });
    const glassMat = new THREE.MeshLambertMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.42 });
    const doorWoodMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const entranceDoorMat = new THREE.MeshLambertMaterial({ color: 0x059669 });

    const openings = ver.openings || [];

    (ver.walls || []).forEach((w) => {
      const dx = w.x2 - w.x1;
      const dy = w.y2 - w.y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;

      const angle = -Math.atan2(dy, dx);
      const thick = w.thickness || (w.type === 'exterior' ? 24 : 12);
      const wallGroup = new THREE.Group();
      wallGroup.position.set(w.x1, 0, w.y1);
      wallGroup.rotation.y = angle;

      const wallOps = openings
        .filter((op) => op.wallId === w.id)
        .map((op) => {
          const halfRatio = ((op.widthCm || 85) / 2) / len;
          return {
            t0: Math.max(0, op.t - halfRatio),
            t1: Math.min(1, op.t + halfRatio),
            op
          };
        })
        .sort((a, b) => a.t0 - b.t0);

      let cursor = 0;
      const mat = w.type === 'exterior' ? extWallMat : intWallMat;

      wallOps.forEach((item) => {
        // 開口左側實心全高牆段
        if (item.t0 > cursor + 0.005) {
          const segLen = (item.t0 - cursor) * len;
          const segCenter = ((cursor + item.t0) / 2) * len;
          addWallBlock3D(wallGroup, segCenter, 0, segLen, floorH, thick, mat, topCapMat);
        }

        // 開口區段：自動挖空門窗並補齊窗台下牆 (sill) 與門窗上楣樑 (lintel)
        const opLen = (item.t1 - item.t0) * len;
        const opCenter = ((item.t0 + item.t1) / 2) * len;
        const op = item.op;

        if (op.type === 'window' || op.type === 'floor_window') {
          const sillH = op.type === 'floor_window' ? 0 : 90;
          const winH = op.type === 'floor_window' ? 210 : 120;
          if (sillH > 0) {
            addWallBlock3D(wallGroup, opCenter, 0, opLen, sillH, thick, mat, null);
          }
          const lintelH = Math.max(10, floorH - (sillH + winH));
          addWallBlock3D(wallGroup, opCenter, sillH + winH, opLen, lintelH, thick, mat, topCapMat);

          // 嵌入半透明玻璃窗
          const gGeo = new THREE.BoxGeometry(opLen, winH, 4);
          const gMesh = new THREE.Mesh(gGeo, glassMat);
          gMesh.position.set(opCenter, sillH + winH / 2, 0);
          wallGroup.add(gMesh);
        } else {
          // 門洞：門高 210cm，上方補 210~floorH 之門楣樑
          const doorH = Math.min(210, floorH - 20);
          const lintelH = Math.max(10, floorH - doorH);
          addWallBlock3D(wallGroup, opCenter, doorH, opLen, lintelH, thick, mat, topCapMat);

          // 半開啟 3D 門扇模型
          const leafGeo = new THREE.BoxGeometry(opLen, doorH, 5);
          const leafMat = op.type === 'entrance' ? entranceDoorMat : doorWoodMat;
          const leafMesh = new THREE.Mesh(leafGeo, leafMat);
          const pivot = new THREE.Group();
          pivot.position.set(item.t0 * len, doorH / 2, 0);
          leafMesh.position.set(opLen / 2, 0, 0);
          pivot.add(leafMesh);
          pivot.rotation.y = (op.swingDir || 1) * 0.85;
          wallGroup.add(pivot);
        }

        cursor = Math.max(cursor, item.t1);
      });

      if (cursor < 0.995) {
        const segLen = (1 - cursor) * len;
        const segCenter = ((cursor + 1) / 2) * len;
        addWallBlock3D(wallGroup, segCenter, 0, segLen, floorH, thick, mat, topCapMat);
      }

      buildingGroup3D.add(wallGroup);

      if (w.type === 'exterior') {
        exteriorWallMeshes3D.push({ group: wallGroup, side: w.side, x: (w.x1 + w.x2) / 2, z: (w.y1 + w.y2) / 2 });
      }
    });

    // 5. 將所有 2D CAD 圖塊替換為對應比例之 3D 低多邊形家具模型
    const collidingIds = new Set(uiState.collisions.map((c) => c.furnId));
    (ver.furniture || []).forEach((f) => {
      const meshGroup = buildProceduralFurniture3D(f, collidingIds.has(f.id));
      meshGroup.position.set(f.x, 2, f.y);
      meshGroup.rotation.y = -((f.rotation || 0) * Math.PI) / 180;
      buildingGroup3D.add(meshGroup);
    });
  }

  function addWallBlock3D(parentGroup, centerX, bottomY, length, height, thickness, mat, capMat) {
    if (length <= 1 || height <= 1) return;
    const geo = new THREE.BoxGeometry(length, height, thickness);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(centerX, bottomY + height / 2, 0);
    parentGroup.add(mesh);

    if (capMat) {
      const capGeo = new THREE.BoxGeometry(length + 0.5, 4, thickness + 0.5);
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(centerX, bottomY + height + 2, 0);
      parentGroup.add(capMesh);
    }
  }

  /**
   * 程序化低多邊形 (Procedural Low-Poly) 3D 家具生成器 — 確保 60 FPS 流暢度
   */
  function buildProceduralFurniture3D(f, isColliding) {
    const g = new THREE.Group();
    const w = f.widthCm;
    const d = f.depthCm;
    const h = f.heightCm || 60;
    const cat = FURNITURE_CATALOG[f.catalogId] || FURNITURE_CATALOG.sofa;

    const mainMat = new THREE.MeshLambertMaterial({ color: isColliding ? 0xef4444 : cat.color3D });
    const accentMat = new THREE.MeshLambertMaterial({ color: isColliding ? 0xb91c1c : cat.accent3D });

    if (f.catalogId === 'double_bed' || f.catalogId === 'single_bed') {
      // 床架 + 床頭板 + 枕頭 + 被單
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 32, d), mainMat);
      base.position.y = 16;
      g.add(base);

      const head = new THREE.Mesh(new THREE.BoxGeometry(w, 92, 12), accentMat);
      head.position.set(0, 46, -d / 2 + 6);
      g.add(head);

      const blanket = new THREE.Mesh(new THREE.BoxGeometry(w - 6, 8, d * 0.62), accentMat);
      blanket.position.set(0, 35, d * 0.16);
      g.add(blanket);
    } else if (f.catalogId === 'sofa') {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 38, d), mainMat);
      seat.position.y = 19;
      g.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(w, 82, 20), accentMat);
      back.position.set(0, 41, -d / 2 + 10);
      g.add(back);
    } else if (f.catalogId === 'wardrobe') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mainMat);
      body.position.y = h / 2;
      g.add(body);
    } else if (f.catalogId === 'dining_table' || f.catalogId === 'desk' || f.catalogId === 'coffee_table') {
      const topH = 6;
      const top = new THREE.Mesh(new THREE.BoxGeometry(w, topH, d), mainMat);
      top.position.y = h - topH / 2;
      g.add(top);

      const legGeo = new THREE.BoxGeometry(6, h - topH, 6);
      [[-w / 2 + 8, -d / 2 + 8], [w / 2 - 8, -d / 2 + 8], [-w / 2 + 8, d / 2 - 8], [w / 2 - 8, d / 2 - 8]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, accentMat);
        leg.position.set(lx, (h - topH) / 2, lz);
        g.add(leg);
      });
    } else if (f.catalogId === 'toilet') {
      const bowl = new THREE.Mesh(new THREE.BoxGeometry(w, 40, d * 0.65), mainMat);
      bowl.position.set(0, 20, d * 0.12);
      g.add(bowl);

      const tank = new THREE.Mesh(new THREE.BoxGeometry(w, 72, d * 0.32), mainMat);
      tank.position.set(0, 36, -d * 0.32);
      g.add(tank);
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mainMat);
      box.position.y = h / 2;
      g.add(box);
    }

    return g;
  }

  /**
   * 3D 動畫迴圈：支援「娃娃屋視角外牆自動半降剖切」與「室內第一人稱漫遊 (WASD)」
   */
  let fpYaw = 0;
  function moveFirstPerson(dir) {
    if (!threeCamera || uiState.cameraMode3D !== 'firstperson') return;
    const speed = 18;
    if (dir === 'forward') {
      threeCamera.position.x += Math.sin(fpYaw) * speed;
      threeCamera.position.z -= Math.cos(fpYaw) * speed;
    } else if (dir === 'backward') {
      threeCamera.position.x -= Math.sin(fpYaw) * speed;
      threeCamera.position.z += Math.cos(fpYaw) * speed;
    } else if (dir === 'left') {
      fpYaw -= 0.12;
    } else if (dir === 'right') {
      fpYaw += 0.12;
    }
    threeCamera.lookAt(
      threeCamera.position.x + Math.sin(fpYaw) * 200,
      162,
      threeCamera.position.z - Math.cos(fpYaw) * 200
    );
  }

  function start3DAnimationLoop() {
    function animate() {
      requestAnimationFrame(animate);
      if (!threeRenderer || !threeScene || !threeCamera) return;
      if (uiState.viewMode === '2d') return;

      if (uiState.cameraMode3D === 'dollhouse') {
        if (threeControls) {
          threeControls.enabled = true;
          threeControls.update();
        }
        // 娃娃屋俯視：若勾選「自動剖切外牆」，將靠近鏡頭側的外牆自動調降為 22% 高度，方便一眼鳥瞰室內格局
        exteriorWallMeshes3D.forEach((item) => {
          if (!uiState.cutawayWall) {
            item.group.scale.y = 1.0;
            return;
          }
          const camX = threeCamera.position.x;
          const camZ = threeCamera.position.z;
          let shouldLower = false;
          if (item.side === 'south' && camZ > item.z) shouldLower = true;
          if (item.side === 'north' && camZ < item.z) shouldLower = true;
          if (item.side === 'east' && camX > item.x) shouldLower = true;
          if (item.side === 'west' && camX < item.x) shouldLower = true;
          item.group.scale.y = shouldLower ? 0.22 : 1.0;
        });
      } else {
        // 室內第一人稱漫遊視角 (眼高 165cm)：全數恢復外牆完整高度
        if (threeControls) threeControls.enabled = false;
        exteriorWallMeshes3D.forEach((item) => {
          item.group.scale.y = 1.0;
        });
        if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveFirstPerson('forward');
        if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveFirstPerson('backward');
        if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveFirstPerson('left');
        if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveFirstPerson('right');
      }

      threeRenderer.render(threeScene, threeCamera);
    }
    requestAnimationFrame(animate);
  }

  function switch3DCameraMode(mode) {
    uiState.cameraMode3D = mode;
    const btnDoll = document.getElementById('btnCameraDollhouse');
    const btnFP = document.getElementById('btnCameraFirstPerson');
    const pad = document.getElementById('walkthroughPad');

    if (btnDoll) btnDoll.classList.toggle('active', mode === 'dollhouse');
    if (btnFP) btnFP.classList.toggle('active', mode === 'firstperson');
    if (pad) pad.hidden = mode !== 'firstperson';

    const ver = getActiveVersion();
    const bounds = getEnvelopeBounds(ver);
    const cx = bounds.minX + bounds.width / 2;
    const cz = bounds.minY + bounds.height / 2;

    if (mode === 'dollhouse') {
      threeCamera.position.set(cx, 920, cz + 820);
      if (threeControls) {
        threeControls.target.set(cx, 80, cz);
        threeControls.update();
      }
      showToast('🏠 已切換為「3D 俯視娃娃屋視角」');
    } else {
      // 將第一人稱漫遊鏡頭置於客餐廳中央 (眼高 165cm)
      threeCamera.position.set(cx + 80, 165, cz + 150);
      fpYaw = 0;
      threeCamera.lookAt(cx + 80, 162, cz - 100);
      showToast('🚶 已切換為「室內第一人稱漫遊視角」，可使用 WASD 或畫面方向鍵走動');
    }
  }

  // =========================================================================
  // 8. 模組四：業務成果匯出 (PNG / SVG / PDF 標準工程圖框) 與多版本專案分享
  // =========================================================================
  function generatePresentationCanvas() {
    const ver = getActiveVersion();
    const bounds = getEnvelopeBounds(ver);
    const showDim = document.getElementById('chkExportDim')?.checked ?? true;
    const showName = document.getElementById('chkExportRoomName')?.checked ?? true;
    const showTable = document.getElementById('chkExportTable')?.checked ?? true;
    const showWatermark = document.getElementById('chkExportWatermark')?.checked ?? true;

    const outW = 1920;
    const outH = 1350;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = outW;
    offCanvas.height = outH;
    const ctx = offCanvas.getContext('2d');

    // 白底標準建築圖紙背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outW, outH);

    // 外圖框雙線
    ctx.strokeStyle = '#1A365D';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, outW - 56, outH - 56);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(36, 36, outW - 72, outH - 72);

    // 頂部標題列
    ctx.fillStyle = '#1A365D';
    ctx.fillRect(36, 36, outW - 72, 86);
    ctx.fillStyle = '#FFE8B8';
    ctx.font = '900 30px "Noto Sans TC", sans-serif';
    ctx.fillText(`港居不動產開發有限公司 — 室內空間格局配置圖 (${ver.label || appState.activeVersionKey})`, 64, 88);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 18px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`案名：${appState.projectName} ｜ 樓高：${appState.settings.floorHeightCm} cm`, outW - 64, 86);
    ctx.textAlign = 'left';

    // 計算平面圖繪製區域縮放
    const drawAreaW = showTable ? 1260 : 1740;
    const drawAreaH = 1080;
    const scale = Math.min((drawAreaW - 220) / bounds.width, (drawAreaH - 220) / bounds.height);
    const offsetX = 140 - bounds.minX * scale;
    const offsetY = 220 - bounds.minY * scale;

    // 暫存並切換為出圖專用座標轉換
    const prevZoom = uiState.zoom2D;
    const prevPanX = uiState.panX2D;
    const prevPanY = uiState.panY2D;
    uiState.zoom2D = scale;
    uiState.panX2D = offsetX;
    uiState.panY2D = offsetY;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (showName) {
      drawRooms2D(ctx, ver, false);
    }
    drawDaylightIndicators2D(ctx, ver, false);
    drawFurnitureList2D(ctx, ver, false);
    drawPlumbingCoreAnchor2D(ctx, ver, false);
    drawWallsWithANSI31Hatch2D(ctx, ver, false);
    drawOpenings2D(ctx, ver, false);
    if (showDim) {
      drawExteriorDimensionsAndCompass2D(ctx, ver, false);
    }
    ctx.restore();

    uiState.zoom2D = prevZoom;
    uiState.panX2D = prevPanX;
    uiState.panY2D = prevPanY;

    // 右側空間坪數統計表欄
    if (showTable) {
      const tx = 1360;
      const ty = 160;
      const tw = 490;
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.fillRect(tx, ty, tw, 920);
      ctx.strokeRect(tx, ty, tw, 920);

      ctx.fillStyle = '#1A365D';
      ctx.font = '800 22px "Noto Sans TC", sans-serif';
      ctx.fillText('📊 各空間面積與坪數統計表', tx + 24, ty + 44);
      ctx.font = '600 15px "Noto Sans TC", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('換算標準：1 平方公尺 (m²) = 0.3025 坪', tx + 24, ty + 72);

      let rowY = ty + 115;
      let totalM2 = 0;
      ctx.font = '700 17px "Noto Sans TC", sans-serif';
      (ver.rooms || []).forEach((rm, idx) => {
        const m2 = (rm.widthCm * rm.heightCm) / 10000;
        const ping = m2 * 0.3025;
        totalM2 += m2;

        ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F1F5F9';
        ctx.fillRect(tx + 16, rowY - 24, tw - 32, 42);
        ctx.fillStyle = '#0F172A';
        ctx.fillText(`${rm.name} (${Math.round(rm.widthCm)}×${Math.round(rm.heightCm)}cm)`, tx + 26, rowY);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#B08C45';
        ctx.fillText(`${m2.toFixed(2)} m² / ${ping.toFixed(2)} 坪`, tx + tw - 26, rowY);
        ctx.textAlign = 'left';
        rowY += 48;
      });

      const totalPing = totalM2 * 0.3025;
      ctx.fillStyle = '#1A365D';
      ctx.fillRect(tx + 16, rowY + 12, tw - 32, 54);
      ctx.fillStyle = '#FFE8B8';
      ctx.font = '800 20px "Noto Sans TC", sans-serif';
      ctx.fillText(`室內主建合計：${totalM2.toFixed(2)} m² （${totalPing.toFixed(2)} 坪）`, tx + 28, rowY + 46);
    }

    // 港居不動產公司浮水印與證號頁尾
    if (showWatermark) {
      ctx.save();
      ctx.translate(outW / 2 - 140, outH / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.fillStyle = 'rgba(26, 54, 93, 0.05)';
      ctx.font = '900 68px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('港居不動產 GANJU REAL ESTATE', 0, 0);
      ctx.restore();

      ctx.fillStyle = '#1A365D';
      ctx.font = '700 16px "Noto Sans TC", sans-serif';
      ctx.fillText(
        '港居不動產開發有限公司 ｜ 統編：96797997 ｜ 租賃管理證號：(112) 登字第013739號 ｜ 服務專線：07-791-2288 / 0968-863-880',
        60,
        outH - 54
      );
    }

    return offCanvas;
  }

  function export2DPng() {
    const outCanvas = generatePresentationCanvas();
    const link = document.createElement('a');
    link.download = `${appState.projectName}_${appState.activeVersionKey}_2D格局圖.png`;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    showToast('🖼️ 已匯出高解析 2D PNG 平面格局圖！');
  }

  function export2DPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      export2DPng();
      return;
    }
    const outCanvas = generatePresentationCanvas();
    const imgData = outCanvas.toDataURL('image/jpeg', 0.95);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.addImage(imgData, 'JPEG', 5, 5, 287, 200);
    pdf.save(`${appState.projectName}_${appState.activeVersionKey}_A4工程格局圖.pdf`);
    showToast('📄 已匯出 A4 橫式標準 PDF 工程格局圖！');
  }

  function export2DSvg() {
    const ver = getActiveVersion();
    const bounds = getEnvelopeBounds(ver);
    const pad = 120;
    const vbW = bounds.width + pad * 2;
    const vbH = bounds.height + pad * 2;

    const lines = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX - pad} ${bounds.minY - pad} ${vbW} ${vbH}" width="1600" height="1200">`);
    lines.push(`<rect x="${bounds.minX - pad}" y="${bounds.minY - pad}" width="${vbW}" height="${vbH}" fill="#FFFFFF"/>`);

    // 繪製房間與坪數文字
    (ver.rooms || []).forEach((rm) => {
      const m2 = (rm.widthCm * rm.heightCm) / 10000;
      const ping = (m2 * 0.3025).toFixed(2);
      const cx = rm.x + rm.widthCm / 2;
      const cy = rm.y + rm.heightCm / 2;
      lines.push(`<rect x="${rm.x}" y="${rm.y}" width="${rm.widthCm}" height="${rm.heightCm}" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>`);
      lines.push(`<text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1A365D">${rm.name}</text>`);
      lines.push(`<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#B08C45">${ping} 坪 (${Math.round(rm.widthCm)}x${Math.round(rm.heightCm)}cm)</text>`);
    });

    // 繪製家具
    (ver.furniture || []).forEach((f) => {
      const box = getFurnitureEffectiveBox(f);
      lines.push(`<rect x="${box.left}" y="${box.top}" width="${box.w}" height="${box.h}" fill="#FFFFFF" stroke="#334155" stroke-width="2"/>`);
      lines.push(`<text x="${f.x}" y="${f.y + 4}" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#334155">${f.name}</text>`);
    });

    // 繪製牆體
    (ver.walls || []).forEach((w) => {
      const thick = w.thickness || (w.type === 'exterior' ? 24 : 12);
      const color = w.type === 'exterior' ? '#1A365D' : '#475569';
      lines.push(`<line x1="${w.x1}" y1="${w.y1}" x2="${w.x2}" y2="${w.y2}" stroke="${color}" stroke-width="${thick}" stroke-linecap="square"/>`);
    });

    lines.push(`<text x="${bounds.minX}" y="${bounds.maxY + 70}" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1A365D">港居不動產開發有限公司 (${appState.projectName} - ${ver.label})</text>`);
    lines.push('</svg>');

    const blob = new Blob([lines.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appState.projectName}_${appState.activeVersionKey}_向量格局圖.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📐 已匯出乾淨的 SVG 向量平面格局圖！');
  }

  function snapshot3DPng() {
    if (!threeRenderer || !threeScene || !threeCamera) return;
    threeRenderer.render(threeScene, threeCamera);
    const link = document.createElement('a');
    link.download = `${appState.projectName}_${appState.activeVersionKey}_3D立體預覽.png`;
    link.href = threeRenderer.domElement.toDataURL('image/png');
    link.click();
    showToast('📸 已擷取 3D 立體空間預覽圖 (PNG)！');
  }

  /**
   * 專案持久化 (Save / Load / JSON / 多方案比對 Modal / 分享連結)
   */
  const STORAGE_KEY = 'ganju_space_planner_projects_v1';

  function serializeProjectState() {
    return {
      schemaVersion: appState.schemaVersion,
      projectId: appState.projectId,
      projectName: appState.projectName,
      updatedAt: new Date().toISOString(),
      settings: cloneDeep(appState.settings),
      activeVersionKey: appState.activeVersionKey,
      versions: cloneDeep(appState.versions)
    };
  }

  function saveProjectToDatabase() {
    appState.projectName = document.getElementById('projectNameInput')?.value.trim() || appState.projectName;
    const payload = serializeProjectState();
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {
      list = [];
    }
    const existingIdx = list.findIndex((item) => item.projectId === payload.projectId);
    if (existingIdx >= 0) {
      list[existingIdx] = payload;
    } else {
      list.unshift(payload);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20)));
    showToast(`💾 專案「${payload.projectName}」已儲存至專案資料庫（含三方案版本）！`);
  }

  function loadProjectObject(data) {
    if (!data || !data.versions) {
      showToast('⚠️ 專案資料格式不符');
      return;
    }
    appState.projectId = data.projectId || nextId('prj');
    appState.projectName = data.projectName || '未命名空間規劃案';
    if (data.settings) Object.assign(appState.settings, data.settings);
    appState.versions = cloneDeep(data.versions);
    appState.activeVersionKey = data.activeVersionKey || 'planA';

    const nameInp = document.getElementById('projectNameInput');
    if (nameInp) nameInp.value = appState.projectName;

    syncVersionTabsUI();
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    rebuild3DScene();
  }

  function openCompareVersionsModal() {
    const backdrop = document.getElementById('compareModalBackdrop');
    const body = document.getElementById('compareModalBody');
    if (!backdrop || !body) return;

    body.replaceChildren();
    const keys = ['original', 'planA', 'planB'];
    const stats = keys.map((k) => {
      const v = appState.versions[k];
      let totalM2 = 0;
      (v.rooms || []).forEach((r) => {
        totalM2 += (r.widthCm * r.heightCm) / 10000;
      });
      const intWallsLen = (v.walls || [])
        .filter((w) => w.type === 'interior')
        .reduce((acc, w) => acc + Math.hypot(w.x2 - w.x1, w.y2 - w.y1), 0);
      return {
        key: k,
        label: v.label || k,
        roomCount: (v.rooms || []).length,
        bedCount: (v.rooms || []).filter((r) => r.roomType === 'master_bed' || r.roomType === 'single_bed').length,
        totalM2: totalM2.toFixed(2),
        totalPing: (totalM2 * 0.3025).toFixed(2),
        intWallMeters: (intWallsLen / 100).toFixed(1),
        furnCount: (v.furniture || []).length
      };
    });

    const table = createEl('table', { className: 'compare-table' }, [
      createEl('thead', null, [
        createEl('tr', null, [
          createEl('th', { textContent: '評估指標' }),
          ...stats.map((s) => createEl('th', { textContent: s.label }))
        ])
      ]),
      createEl('tbody', null, [
        createEl('tr', null, [
          createEl('td', { textContent: '總空間分區數' }),
          ...stats.map((s) => createEl('td', { textContent: `${s.roomCount} 區（含 ${s.bedCount} 臥室）` }))
        ]),
        createEl('tr', null, [
          createEl('td', { textContent: '室內淨面積 / 坪數' }),
          ...stats.map((s) => createEl('td', { textContent: `${s.totalM2} m² （${s.totalPing} 坪）`, style: { fontWeight: '800', color: 'var(--accent-gold-hover)' } }))
        ]),
        createEl('tr', null, [
          createEl('td', { textContent: '室內輕隔間總長（工程估算）' }),
          ...stats.map((s) => createEl('td', { textContent: `${s.intWallMeters} 公尺 (m)` }))
        ]),
        createEl('tr', null, [
          createEl('td', { textContent: '已配置標準 CAD 家具數' }),
          ...stats.map((s) => createEl('td', { textContent: `${s.furnCount} 件` }))
        ]),
        createEl('tr', null, [
          createEl('td', { textContent: '一鍵切換預覽' }),
          ...stats.map((s) =>
            createEl('td', null, [
              createEl('button', {
                type: 'button',
                className: 'tool-action-btn gold',
                textContent: `切換至 ${s.label}`,
                onClick: () => {
                  appState.activeVersionKey = s.key;
                  syncVersionTabsUI();
                  recalculateCollisionsAndSchedule();
                  requestRender2D();
                  rebuild3DScene();
                  backdrop.hidden = true;
                }
              })
            ])
          )
        ])
      ])
    ]);

    body.appendChild(table);
    backdrop.hidden = false;
  }

  function openProjectsLibraryModal(mode) {
    const backdrop = document.getElementById('projectsModalBackdrop');
    const body = document.getElementById('projectsModalBody');
    if (!backdrop || !body) return;
    body.replaceChildren();

    if (mode === 'clone') {
      const curKey = appState.activeVersionKey;
      const curVer = getActiveVersion();
      body.appendChild(
        createEl('p', {
          style: { marginBottom: '12px', fontWeight: '700' },
          textContent: `請選擇要將目前「${curVer.label}」完整格局複製覆蓋至哪一個方案分支：`
        })
      );
      const btnRow = createEl('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } });
      ['original', 'planA', 'planB'].forEach((targetKey) => {
        if (targetKey === curKey) return;
        const targetLabel = appState.versions[targetKey].label;
        btnRow.appendChild(
          createEl('button', {
            type: 'button',
            className: 'tool-action-btn gold',
            textContent: `複製至「${targetLabel}」`,
            onClick: () => {
              const copied = cloneDeep(curVer);
              copied.label = targetLabel;
              appState.versions[targetKey] = copied;
              appState.activeVersionKey = targetKey;
              syncVersionTabsUI();
              recalculateCollisionsAndSchedule();
              requestRender2D();
              rebuild3DScene();
              backdrop.hidden = true;
              showToast(`✅ 已複製格局至「${targetLabel}」並切換檢視！`);
            }
          })
        );
      });
      body.appendChild(btnRow);
      backdrop.hidden = false;
      return;
    }

    let list = [];
    try {
      list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {
      list = [];
    }

    if (list.length === 0) {
      body.appendChild(
        createEl('p', {
          style: { color: 'var(--text-muted)' },
          textContent: '目前尚無已儲存之歷史專案。點擊上方「儲存專案」即可將全室三方案格局寫入本機資料庫。'
        })
      );
    } else {
      list.forEach((item) => {
        const card = createEl('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            marginBottom: '8px'
          }
        }, [
          createEl('div', null, [
            createEl('div', { style: { fontWeight: '800' }, textContent: item.projectName }),
            createEl('div', { style: { fontSize: '0.78rem', color: 'var(--text-muted)' }, textContent: `更新時間：${new Date(item.updatedAt).toLocaleString('zh-TW')}` })
          ]),
          createEl('button', {
            type: 'button',
            className: 'tool-action-btn primary',
            textContent: '載入此專案',
            onClick: () => {
              loadProjectObject(item);
              backdrop.hidden = true;
              showToast(`📂 已載入專案「${item.projectName}」`);
            }
          })
        ]);
        body.appendChild(card);
      });
    }

    backdrop.hidden = false;
  }

  // =========================================================================
  // 9. 初始化預設三版本專案 (原始屋況 / 方案 A / 方案 B) 與綁定全域事件
  // =========================================================================
  function initDefaultProjectVersions() {
    // 原始屋況 (方案 0)
    const vOrig = {
      label: '原始屋況',
      walls: buildExteriorEnvelope(960, 720, ['north', 'east']),
      anchors: {
        entrance: { side: 'south', t: 0.25, widthCm: 100, swingDir: -1, hingeSide: 1 },
        plumbingCore: { x: 150, y: 420, widthCm: 76, depthCm: 58, label: '水電管道間' },
        daylightSides: ['north', 'east']
      },
      openings: [],
      rooms: [],
      furniture: []
    };
    solveParametricLayout(vOrig, 0, false);

    // 方案 A：標準雙臥公私分明 (預設作用中)
    const vPlanA = {
      label: '方案 A (標準雙臥)',
      walls: buildExteriorEnvelope(960, 720, ['north', 'east']),
      anchors: {
        entrance: { side: 'south', t: 0.25, widthCm: 100, swingDir: -1, hingeSide: 1 },
        plumbingCore: { x: 150, y: 420, widthCm: 76, depthCm: 58, label: '水電管道間' },
        daylightSides: ['north', 'east']
      },
      openings: [],
      rooms: [],
      furniture: []
    };
    solveParametricLayout(vPlanA, 1, true);

    // 方案 B：高投報緊湊三房配置
    const vPlanB = {
      label: '方案 B (高投報三房)',
      walls: buildExteriorEnvelope(960, 720, ['north', 'east']),
      anchors: {
        entrance: { side: 'south', t: 0.25, widthCm: 100, swingDir: -1, hingeSide: 1 },
        plumbingCore: { x: 150, y: 420, widthCm: 76, depthCm: 58, label: '水電管道間' },
        daylightSides: ['north', 'east']
      },
      openings: [],
      rooms: [],
      furniture: []
    };
    solveParametricLayout(vPlanB, 3, true);

    appState.versions.original = vOrig;
    appState.versions.planA = vPlanA;
    appState.versions.planB = vPlanB;
    appState.activeVersionKey = 'planA';

    // 檢查 URL Hash 是否帶有分享專案
    if (window.location.hash && window.location.hash.startsWith('#plan=')) {
      try {
        const b64 = decodeURIComponent(window.location.hash.slice(6));
        const decoded = JSON.parse(decodeURIComponent(escape(atob(b64))));
        loadProjectObject(decoded);
        showToast('🔗 已成功載入分享連結之空間格局專案！');
      } catch (_) {
        // Ignore malformed share hash
      }
    }
  }

  function syncVersionTabsUI() {
    document.querySelectorAll('.version-tab-btn[data-version]').forEach((btn) => {
      const isAct = btn.getAttribute('data-version') === appState.activeVersionKey;
      btn.classList.toggle('active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });
  }

  function setActiveTool(toolName) {
    uiState.activeTool = toolName;
    uiState.drawingWall = null;
    document.querySelectorAll('.draw-tool-btn[data-tool]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tool') === toolName);
    });
    requestRender2D();
  }

  function bindAllEvents() {
    const canvas2D = document.getElementById('cadCanvas2D');

    // 1. 工具列按鈕切換
    document.querySelectorAll('.draw-tool-btn[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.getAttribute('data-tool');
        setActiveTool(t);
        if (t === 'calibrate') {
          uiState.calibrating = { step: 0 };
          showToast('📏 請在底圖上依序點擊「起點」與「終點」拉出基準線');
        }
      });
    });

    // 2. 多方案切換 (原始屋況 / 方案 A / 方案 B)
    document.querySelectorAll('.version-tab-btn[data-version]').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.activeVersionKey = btn.getAttribute('data-version');
        uiState.selectedItem = null;
        syncVersionTabsUI();
        recalculateCollisionsAndSchedule();
        renderInspectorPanel();
        requestRender2D();
        rebuild3DScene();
        showToast(`已切換至「${getActiveVersion().label}」`);
      });
    });

    document.getElementById('btnCloneVersion')?.addEventListener('click', () => openProjectsLibraryModal('clone'));
    document.getElementById('btnCompareModal')?.addEventListener('click', () => openCompareVersionsModal());
    document.getElementById('btnCloseCompareModal')?.addEventListener('click', () => {
      document.getElementById('compareModalBackdrop').hidden = true;
    });
    document.getElementById('btnCloseProjectsModal')?.addEventListener('click', () => {
      document.getElementById('projectsModalBackdrop').hidden = true;
    });

    // 3. 2D / 2D+3D / 3D 檢視切換
    document.querySelectorAll('.view-mode-btn[data-viewmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-viewmode');
        uiState.viewMode = mode;
        document.querySelectorAll('.view-mode-btn').forEach((b) => b.classList.toggle('active', b === btn));
        const container = document.getElementById('viewportContainer');
        if (container) {
          container.className = `viewport-split-container mode-${mode}`;
        }
        setTimeout(() => {
          handleResizeViewports();
        }, 40);
      });
    });

    // 4. 模組二：玄關方位、偏移滑桿、採光面與 3 組自動隔間方案卡片
    document.getElementById('entranceSideSelect')?.addEventListener('change', (e) => {
      const ver = getActiveVersion();
      if (!ver.anchors) return;
      pushUndo();
      ver.anchors.entrance.side = e.target.value;
      if (appState.settings.liveTopologySync) {
        solveParametricLayout(ver, appState.settings.activeScheme, true);
      }
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
    });

    document.getElementById('entranceOffsetSlider')?.addEventListener('input', (e) => {
      const ver = getActiveVersion();
      if (!ver.anchors) return;
      ver.anchors.entrance.t = Number(e.target.value) / 100;
      const entOp = (ver.openings || []).find((op) => op.type === 'entrance');
      if (entOp) entOp.t = ver.anchors.entrance.t;
      if (appState.settings.liveTopologySync) {
        solveParametricLayout(ver, appState.settings.activeScheme, true);
      }
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
    });

    document.querySelectorAll('.daylight-btn[data-side]').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const activeSides = Array.from(document.querySelectorAll('.daylight-btn.active')).map((b) => b.getAttribute('data-side'));
        const ver = getActiveVersion();
        if (ver.anchors) ver.anchors.daylightSides = activeSides;
        pushUndo();
        solveParametricLayout(ver, appState.settings.activeScheme, true);
        recalculateCollisionsAndSchedule();
        requestRender2D();
        rebuild3DScene();
        showToast('☀️ 已依開窗採光面重新分配臥室與採光窗！');
      });
    });

    document.querySelectorAll('.scheme-card-btn[data-scheme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sId = Number(btn.getAttribute('data-scheme'));
        appState.settings.activeScheme = sId;
        document.querySelectorAll('.scheme-card-btn').forEach((b) => b.classList.toggle('active', b === btn));
        const ver = getActiveVersion();
        pushUndo();
        solveParametricLayout(ver, sId, true);
        recalculateCollisionsAndSchedule();
        renderInspectorPanel();
        requestRender2D();
        rebuild3DScene();
        showToast(`✨ 已套用「自動隔間方案 ${sId}」並完成家具配置！`);
      });
    });

    // 5. 快速屋況外框範本
    document.querySelectorAll('.template-pill-btn[data-envelope]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-envelope');
        const ver = getActiveVersion();
        pushUndo();
        if (type === 'empty') {
          ver.walls = [];
          ver.openings = [];
          ver.rooms = [];
          ver.furniture = [];
          setActiveTool('wall_ext');
          showToast('已切換為空白畫布，請點擊拉線繪製外牆');
        } else {
          const dims = type === 'large' ? [1120, 780] : (type === 'compact' ? [780, 600] : [960, 720]);
          ver.walls = buildExteriorEnvelope(dims[0], dims[1], ver.anchors?.daylightSides || ['north', 'east']);
          ver.anchors.plumbingCore.x = Math.round(dims[0] * 0.16);
          ver.anchors.plumbingCore.y = Math.round(dims[1] * 0.56);
          solveParametricLayout(ver, appState.settings.activeScheme, true);
          showToast(`🏠 已載入 ${dims[0]}×${dims[1]} cm 既有外牆胚體`);
        }
        recalculateCollisionsAndSchedule();
        requestRender2D();
        rebuild3DScene();
      });
    });

    // 6. 模組一：底圖上傳與兩點比例尺校正
    document.getElementById('btnUploadBg')?.addEventListener('click', () => {
      document.getElementById('bgFileInput')?.click();
    });

    document.getElementById('bgFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          appState.backgroundMap.dataUrl = ev.target.result;
          appState.backgroundMap.imgObj = img;
          appState.backgroundMap.scaleCmPerPx = 960 / Math.max(100, img.width);
          requestRender2D();
          showToast('🖼️ 底圖已載入！可點擊「兩點校正」拉一條基準線設定實際長度 (cm)');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('btnStartCalibrate')?.addEventListener('click', () => {
      setActiveTool('calibrate');
      uiState.calibrating = { step: 0 };
      showToast('📏 比例尺校正：請在畫布上點擊基準線的「起點」與「終點」');
    });

    document.getElementById('btnClearBg')?.addEventListener('click', () => {
      appState.backgroundMap.imgObj = null;
      appState.backgroundMap.dataUrl = null;
      requestRender2D();
      showToast('已清除背景底圖');
    });

    document.getElementById('bgOpacitySlider')?.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      appState.backgroundMap.opacity = val / 100;
      const lbl = document.getElementById('bgOpacityVal');
      if (lbl) lbl.textContent = `${val}%`;
      requestRender2D();
    });

    // 7. 模組三：左側 CAD 家具圖塊庫點擊新增與 Drag & Drop
    document.getElementById('btnAutoFurnishAll')?.addEventListener('click', () => {
      const ver = getActiveVersion();
      pushUndo();
      autoFurnishVersion(ver);
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
      showToast('✨ 已依各空間屬性重新配置全室標準 CAD 家具圖塊！');
    });

    document.querySelectorAll('.furn-item-btn[data-furn]').forEach((btn) => {
      const catId = btn.getAttribute('data-furn');
      btn.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', catId);
      });
      btn.addEventListener('click', () => {
        addFurnitureToCenter(catId);
      });
    });

    canvas2D?.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    canvas2D?.addEventListener('drop', (e) => {
      e.preventDefault();
      const catId = e.dataTransfer?.getData('text/plain');
      if (!catId || !FURNITURE_CATALOG[catId]) return;
      const rect = canvas2D.getBoundingClientRect();
      const worldPt = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      addFurnitureAtPoint(catId, worldPt.x, worldPt.y);
    });

    // 8. 畫布滑鼠操作 (點擊尺寸改淨寬 / 拖拉隔間牆 / 拖曳玄關與管道間 / 拉線繪牆)
    if (canvas2D) {
      canvas2D.addEventListener('pointerdown', handleCanvasPointerDown);
      canvas2D.addEventListener('pointermove', handleCanvasPointerMove);
      window.addEventListener('pointerup', handleCanvasPointerUp);
      canvas2D.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        uiState.zoom2D = Math.max(0.22, Math.min(2.2, uiState.zoom2D * factor));
        requestRender2D();
      }, { passive: false });
    }

    // 9. 畫布內嵌輸入框確認與取消
    document.getElementById('btnPopoverConfirm')?.addEventListener('click', () => {
      const val = Number(document.getElementById('popoverInput')?.value);
      if (activePopoverCallback && val > 0) {
        activePopoverCallback(val);
      }
      closeCanvasPopover();
    });
    document.getElementById('btnPopoverCancel')?.addEventListener('click', closeCanvasPopover);

    // 10. 頂部工具列操作 (樓高、旋轉、翻轉門、刪除、復原、3D 鏡頭)
    document.getElementById('floorHeightInput')?.addEventListener('change', (e) => {
      appState.settings.floorHeightCm = Math.max(220, Math.min(450, Number(e.target.value) || 300));
      rebuild3DScene();
      showToast(`已將 3D 牆面擠出樓高更新為 ${appState.settings.floorHeightCm} cm`);
    });

    document.getElementById('btnRotateSelected')?.addEventListener('click', rotateSelectedElement);
    document.getElementById('btnFlipDoor')?.addEventListener('click', flipSelectedDoor);
    document.getElementById('btnDeleteSelected')?.addEventListener('click', deleteSelectedElement);
    document.getElementById('btnUndo')?.addEventListener('click', performUndo);

    document.getElementById('btnCameraDollhouse')?.addEventListener('click', () => switch3DCameraMode('dollhouse'));
    document.getElementById('btnCameraFirstPerson')?.addEventListener('click', () => switch3DCameraMode('firstperson'));
    document.getElementById('chkCutawayWall')?.addEventListener('change', (e) => {
      uiState.cutawayWall = e.target.checked;
    });

    document.querySelectorAll('.walk-btn[data-move]').forEach((btn) => {
      btn.addEventListener('click', () => {
        moveFirstPerson(btn.getAttribute('data-move'));
      });
    });

    // 11. 勾選開關同步
    document.getElementById('chkSnapGrid')?.addEventListener('change', (e) => { appState.settings.snapToGrid = e.target.checked; });
    document.getElementById('chkOrthoLock')?.addEventListener('change', (e) => { appState.settings.orthoLock = e.target.checked; });
    document.getElementById('chkShowHatch')?.addEventListener('change', (e) => {
      appState.settings.showHatch = e.target.checked;
      requestRender2D();
    });
    document.getElementById('chkAutoAlignFurn')?.addEventListener('change', (e) => { appState.settings.autoAlignFurniture = e.target.checked; });
    document.getElementById('chkShowClearance')?.addEventListener('change', (e) => {
      appState.settings.showClearanceZones = e.target.checked;
      requestRender2D();
    });
    document.getElementById('chkLiveTopology')?.addEventListener('change', (e) => { appState.settings.liveTopologySync = e.target.checked; });

    // 12. 縮放、出圖與專案儲存分享
    document.getElementById('btnZoomIn')?.addEventListener('click', () => {
      uiState.zoom2D = Math.min(2.2, uiState.zoom2D * 1.15);
      requestRender2D();
    });
    document.getElementById('btnZoomOut')?.addEventListener('click', () => {
      uiState.zoom2D = Math.max(0.25, uiState.zoom2D / 1.15);
      requestRender2D();
    });
    document.getElementById('btnZoomReset')?.addEventListener('click', () => {
      uiState.zoom2D = 0.56;
      uiState.panX2D = 80;
      uiState.panY2D = 65;
      requestRender2D();
    });
    document.getElementById('btn3DResetCam')?.addEventListener('click', () => switch3DCameraMode('dollhouse'));
    document.getElementById('btn3DToggleRoof')?.addEventListener('click', (e) => {
      uiState.warmLight3D = !uiState.warmLight3D;
      e.currentTarget.classList.toggle('active', uiState.warmLight3D);
      if (threeScene) {
        threeScene.children.forEach((ch) => {
          if (ch.isDirectionalLight) {
            ch.color.setHex(uiState.warmLight3D ? 0xffe4b5 : 0xffffff);
            ch.intensity = uiState.warmLight3D ? 0.92 : 0.68;
          } else if (ch.isHemisphereLight) {
            ch.intensity = uiState.warmLight3D ? 0.95 : 0.75;
          }
        });
      }
      showToast(uiState.warmLight3D ? '💡 已開啟 3D 室內暖光氛圍照明' : '☀️ 已切換為 3D 標準自然光照明');
    });

    // 第一人稱漫遊視角下支援滑鼠於 3D 畫布直接拖曳環視 360°
    const canvas3D = document.getElementById('webglCanvas3D');
    let fpDragging = false;
    let fpLastX = 0;
    canvas3D?.addEventListener('pointerdown', (e) => {
      if (uiState.cameraMode3D === 'firstperson') {
        fpDragging = true;
        fpLastX = e.clientX;
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (fpDragging && uiState.cameraMode3D === 'firstperson' && threeCamera) {
        const dx = e.clientX - fpLastX;
        fpLastX = e.clientX;
        fpYaw += dx * 0.006;
        threeCamera.lookAt(
          threeCamera.position.x + Math.sin(fpYaw) * 200,
          162,
          threeCamera.position.z - Math.cos(fpYaw) * 200
        );
      }
    });
    window.addEventListener('pointerup', () => {
      fpDragging = false;
    });

    document.getElementById('btnExportPng')?.addEventListener('click', export2DPng);
    document.getElementById('btnExportSvg')?.addEventListener('click', export2DSvg);
    document.getElementById('btnExportPdf')?.addEventListener('click', export2DPdf);
    document.getElementById('btnSnapshot3D')?.addEventListener('click', snapshot3DPng);

    document.getElementById('btnSaveProject')?.addEventListener('click', saveProjectToDatabase);
    document.getElementById('btnOpenProjectsModal')?.addEventListener('click', () => openProjectsLibraryModal('load'));
    document.getElementById('btnExportJson')?.addEventListener('click', () => {
      const payload = serializeProjectState();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${appState.projectName}_專案結構.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📤 已匯出單一 JSON Schema 專案檔！');
    });
    document.getElementById('btnImportJson')?.addEventListener('click', () => {
      document.getElementById('jsonFileInput')?.click();
    });
    document.getElementById('jsonFileInput')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          loadProjectObject(parsed);
          showToast('📥 已成功匯入 JSON 專案檔！');
        } catch (_) {
          showToast('⚠️ JSON 格式解析失敗');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btnShareLink')?.addEventListener('click', () => {
      const payload = serializeProjectState();
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#plan=${encodeURIComponent(encoded)}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('🔗 專案預覽分享連結已複製至剪貼簿！');
        });
      } else {
        window.location.hash = `plan=${encodeURIComponent(encoded)}`;
        showToast('🔗 已更新網址列為專案分享連結！');
      }
    });

    // 鍵盤快捷鍵支援 (WASD 漫遊 / R 旋轉 / Delete 刪除 / V, W, E, D, N 工具切換)
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      keysPressed[e.code] = true;
      if (e.key === 'r' || e.key === 'R') rotateSelectedElement();
      else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelectedElement();
      else if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      else if (e.key === 'w' || e.key === 'W') setActiveTool('wall_int');
      else if (e.key === 'e' || e.key === 'E') setActiveTool('wall_ext');
      else if (e.key === 'd' || e.key === 'D') setActiveTool('add_door');
      else if (e.key === 'n' || e.key === 'N') setActiveTool('add_window');
    });
    window.addEventListener('keyup', (e) => {
      keysPressed[e.code] = false;
    });

    window.addEventListener('resize', handleResizeViewports);
  }

  function addFurnitureToCenter(catId) {
    const ver = getActiveVersion();
    const bounds = getEnvelopeBounds(ver);
    addFurnitureAtPoint(catId, bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2);
  }

  function addFurnitureAtPoint(catId, wx, wy) {
    const meta = FURNITURE_CATALOG[catId];
    if (!meta) return;
    const ver = getActiveVersion();
    pushUndo();
    const newFurn = {
      id: nextId('furn'),
      catalogId: catId,
      name: meta.name,
      x: Math.round(wx),
      y: Math.round(wy),
      widthCm: meta.widthCm,
      depthCm: meta.depthCm,
      heightCm: meta.heightCm,
      rotation: 0
    };
    autoAlignFurnitureToWalls(newFurn, ver);
    ver.furniture.push(newFurn);
    uiState.selectedItem = { kind: 'furniture', id: newFurn.id };
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    rebuild3DScene();
    showToast(`🛋️ 已置入「${meta.name}」`);
  }

  function rotateSelectedElement() {
    const ver = getActiveVersion();
    const sel = uiState.selectedItem;
    if (!sel || !ver) {
      showToast('請先點選畫布上的家具或門扇');
      return;
    }
    pushUndo();
    if (sel.kind === 'furniture') {
      const f = (ver.furniture || []).find((item) => item.id === sel.id);
      if (f) {
        f.rotation = ((f.rotation || 0) + 90) % 360;
        recalculateCollisionsAndSchedule();
        renderInspectorPanel();
        requestRender2D();
        rebuild3DScene();
      }
    } else if (sel.kind === 'opening') {
      flipSelectedDoor();
    }
  }

  function flipSelectedDoor() {
    const ver = getActiveVersion();
    const sel = uiState.selectedItem;
    if (!sel || sel.kind !== 'opening') {
      showToast('請先點選一扇門以翻轉開啟方向');
      return;
    }
    const op = (ver.openings || []).find((item) => item.id === sel.id);
    if (!op) return;
    pushUndo();
    if (op.hingeSide === 1) {
      op.hingeSide = -1;
    } else {
      op.hingeSide = 1;
      op.swingDir = (op.swingDir || 1) * -1;
    }
    recalculateCollisionsAndSchedule();
    requestRender2D();
    rebuild3DScene();
    showToast('↔️ 已翻轉門扇開啟方向與鉸鏈側');
  }

  function deleteSelectedElement() {
    const ver = getActiveVersion();
    const sel = uiState.selectedItem;
    if (!sel || !ver) return;

    if (sel.kind === 'wall') {
      const w = (ver.walls || []).find((item) => item.id === sel.id);
      if (w && w.locked) {
        showToast('🔒 此為「既有結構外牆」，已鎖定保護避免誤刪！（可於右側屬性面板解除鎖定）');
        return;
      }
      pushUndo();
      ver.walls = (ver.walls || []).filter((item) => item.id !== sel.id);
      ver.openings = (ver.openings || []).filter((op) => op.wallId !== sel.id);
    } else if (sel.kind === 'furniture') {
      pushUndo();
      ver.furniture = (ver.furniture || []).filter((item) => item.id !== sel.id);
    } else if (sel.kind === 'opening') {
      const op = (ver.openings || []).find((item) => item.id === sel.id);
      if (op && op.type === 'entrance') {
        showToast('🚪 入口玄關大門為必要空間錨點，可直接拖曳移動位置');
        return;
      }
      pushUndo();
      ver.openings = (ver.openings || []).filter((item) => item.id !== sel.id);
    }

    uiState.selectedItem = null;
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    rebuild3DScene();
    showToast('🗑️ 已刪除選取物件');
  }

  function handleCanvasPointerDown(e) {
    const canvas = document.getElementById('cadCanvas2D');
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const rawW = screenToWorld(sx, sy);
    const ver = getActiveVersion();
    const snapped = snapPoint(rawW.x, rawW.y, ver);

    // 1. 比例尺校正模式
    if (uiState.activeTool === 'calibrate') {
      if (!uiState.calibrating || uiState.calibrating.step === 0) {
        uiState.calibrating = { x1: rawW.x, y1: rawW.y, x2: rawW.x, y2: rawW.y, step: 1 };
      } else {
        uiState.calibrating.x2 = rawW.x;
        uiState.calibrating.y2 = rawW.y;
        const distUnits = Math.hypot(uiState.calibrating.x2 - uiState.calibrating.x1, uiState.calibrating.y2 - uiState.calibrating.y1);
        if (distUnits > 5) {
          openCanvasPopover('📏 輸入基準線實際長度 (cm)：', Math.round(distUnits), (actualCm) => {
            const ratio = actualCm / distUnits;
            appState.backgroundMap.scaleCmPerPx *= ratio;
            appState.backgroundMap.calibrated = true;
            const statusEl = document.getElementById('scaleStatusText');
            if (statusEl) statusEl.textContent = `已校正 (${actualCm}cm)`;
            setActiveTool('select');
            requestRender2D();
            showToast(`✅ 底圖比例尺已自動校正完成（基準線 = ${actualCm} cm）！`);
          });
        }
      }
      requestRender2D();
      return;
    }

    // 2. 繪製外牆或隔間牆模式
    if (uiState.activeTool === 'wall_int' || uiState.activeTool === 'wall_ext') {
      const wType = uiState.activeTool === 'wall_ext' ? 'exterior' : 'interior';
      uiState.drawingWall = {
        x1: snapped.x,
        y1: snapped.y,
        x2: snapped.x,
        y2: snapped.y,
        type: wType
      };
      requestRender2D();
      return;
    }

    // 3. 嵌入門扇或窗戶模式
    if (uiState.activeTool === 'add_door' || uiState.activeTool === 'add_window') {
      const hit = hitTest2D(rawW.x, rawW.y, ver);
      if (hit && hit.kind === 'wall') {
        pushUndo();
        const isWin = uiState.activeTool === 'add_window';
        const newOp = {
          id: nextId('op'),
          wallId: hit.wall.id,
          type: isWin ? 'window' : 'door',
          t: Math.max(0.12, Math.min(0.88, hit.t)),
          widthCm: isWin ? 150 : 85,
          sillHeightCm: isWin ? 90 : 0,
          heightCm: isWin ? 120 : 210,
          swingDir: 1,
          hingeSide: 1
        };
        ver.openings.push(newOp);
        uiState.selectedItem = { kind: 'opening', id: newOp.id };
        setActiveTool('select');
        recalculateCollisionsAndSchedule();
        renderInspectorPanel();
        requestRender2D();
        rebuild3DScene();
        showToast(isWin ? '🪟 已於牆面嵌入標準採光窗' : '🚪 已於牆面嵌入室內門扇（含開啟弧線）');
      } else {
        showToast('請直接點擊任一牆面以嵌入門窗');
      }
      return;
    }

    // 4. 選擇與直覺拖拉微調模式
    const hit = hitTest2D(rawW.x, rawW.y, ver);
    if (!hit) {
      uiState.selectedItem = null;
      uiState.dragging = { kind: 'pan', startSX: sx, startSY: sy, origPanX: uiState.panX2D, origPanY: uiState.panY2D };
      renderInspectorPanel();
      requestRender2D();
      return;
    }

    // 點擊尺寸膠囊：直接開啟淨寬輸入框
    if (hit.kind === 'dim_pill') {
      const b = hit.box;
      openCanvasPopover(b.label, b.currentVal, (targetVal) => {
        const rm = (ver.rooms || []).find((r) => r.id === b.targetId);
        if (rm) applyRoomTargetWidth(ver, rm, targetVal);
      });
      return;
    }

    if (hit.kind === 'anchor_pipe') {
      pushUndo();
      uiState.selectedItem = { kind: 'anchor', id: 'plumbingCore' };
      uiState.dragging = { kind: 'anchor_pipe' };
      requestRender2D();
      return;
    }

    if (hit.kind === 'opening') {
      pushUndo();
      uiState.selectedItem = { kind: 'opening', id: hit.id };
      uiState.dragging = { kind: 'opening', op: hit.op };
      renderInspectorPanel();
      requestRender2D();
      return;
    }

    if (hit.kind === 'furniture') {
      pushUndo();
      uiState.selectedItem = { kind: 'furniture', id: hit.id };
      uiState.dragging = {
        kind: 'furniture',
        furn: hit.furn,
        offsetX: rawW.x - hit.furn.x,
        offsetY: rawW.y - hit.furn.y
      };
      renderInspectorPanel();
      requestRender2D();
      return;
    }

    if (hit.kind === 'wall') {
      uiState.selectedItem = { kind: 'wall', id: hit.id };
      if (!hit.wall.locked && hit.wall.type === 'interior') {
        pushUndo();
        uiState.dragging = { kind: 'wall', wall: hit.wall };
      }
      renderInspectorPanel();
      requestRender2D();
      return;
    }

    if (hit.kind === 'room') {
      uiState.selectedItem = { kind: 'room', id: hit.id };
      uiState.dragging = { kind: 'pan', startSX: sx, startSY: sy, origPanX: uiState.panX2D, origPanY: uiState.panY2D };
      renderInspectorPanel();
      requestRender2D();
    }
  }

  function handleCanvasPointerMove(e) {
    const canvas = document.getElementById('cadCanvas2D');
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const rawW = screenToWorld(sx, sy);
    const ver = getActiveVersion();
    const snapped = snapPoint(rawW.x, rawW.y, ver);

    const coordEl = document.getElementById('cursorCoordText');
    if (coordEl) {
      coordEl.textContent = `X: ${Math.round(snapped.x)} cm, Y: ${Math.round(snapped.y)} cm`;
    }

    if (uiState.calibrating && uiState.calibrating.step === 1) {
      uiState.calibrating.x2 = rawW.x;
      uiState.calibrating.y2 = rawW.y;
      requestRender2D();
      return;
    }

    if (uiState.drawingWall) {
      let tx = snapped.x;
      let ty = snapped.y;
      // 90度正交鎖定
      if (appState.settings.orthoLock) {
        if (Math.abs(tx - uiState.drawingWall.x1) > Math.abs(ty - uiState.drawingWall.y1)) {
          ty = uiState.drawingWall.y1;
        } else {
          tx = uiState.drawingWall.x1;
        }
      }
      uiState.drawingWall.x2 = tx;
      uiState.drawingWall.y2 = ty;
      requestRender2D();
      return;
    }

    if (!uiState.dragging) {
      const hit = hitTest2D(rawW.x, rawW.y, ver);
      uiState.hoveredItem = hit;
      if (hit && (hit.kind === 'dim_pill' || hit.kind === 'furniture' || hit.kind === 'opening' || hit.kind === 'anchor_pipe')) {
        canvas.style.cursor = 'pointer';
      } else if (hit && hit.kind === 'wall' && hit.wall.type === 'interior') {
        const isVert = Math.abs(hit.wall.x1 - hit.wall.x2) < 1;
        canvas.style.cursor = isVert ? 'ew-resize' : 'ns-resize';
      } else {
        canvas.style.cursor = uiState.activeTool === 'select' ? 'default' : 'crosshair';
      }
      requestRender2D();
      return;
    }

    const drag = uiState.dragging;
    if (drag.kind === 'pan') {
      uiState.panX2D = drag.origPanX + (sx - drag.startSX);
      uiState.panY2D = drag.origPanY + (sy - drag.startSY);
      requestRender2D();
    } else if (drag.kind === 'furniture') {
      const f = drag.furn;
      f.x = Math.round(rawW.x - drag.offsetX);
      f.y = Math.round(rawW.y - drag.offsetY);
      autoAlignFurnitureToWalls(f, ver);
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
    } else if (drag.kind === 'wall') {
      const w = drag.wall;
      const isVert = Math.abs(w.x1 - w.x2) < 1;
      moveInteriorWallAndSyncRooms(ver, w, isVert ? snapped.x : snapped.y);
      recalculateCollisionsAndSchedule();
      renderInspectorPanel();
      requestRender2D();
      rebuild3DScene();
    } else if (drag.kind === 'anchor_pipe') {
      const bounds = getEnvelopeBounds(ver);
      const p = ver.anchors.plumbingCore;
      p.x = Math.max(bounds.minX + 50, Math.min(bounds.maxX - 50, Math.round(rawW.x)));
      p.y = Math.max(bounds.minY + 50, Math.min(bounds.maxY - 50, Math.round(rawW.y)));
      if (appState.settings.liveTopologySync) {
        solveParametricLayout(ver, appState.settings.activeScheme, true);
      }
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
    } else if (drag.kind === 'opening') {
      const op = drag.op;
      if (op.type === 'entrance') {
        // 入口玄關大門支援沿四面外牆自由拖曳，並即時驅動全局隔間連動！
        const extWalls = (ver.walls || []).filter((w) => w.type === 'exterior');
        let bestWall = null;
        let bestT = 0.5;
        let bestD = Infinity;
        extWalls.forEach((ew) => {
          const res = pointToSegmentDist(rawW.x, rawW.y, ew.x1, ew.y1, ew.x2, ew.y2);
          if (res.dist < bestD) {
            bestD = res.dist;
            bestWall = ew;
            bestT = Math.max(0.15, Math.min(0.85, res.t));
          }
        });
        if (bestWall && ver.anchors && ver.anchors.entrance) {
          ver.anchors.entrance.side = bestWall.side || 'south';
          ver.anchors.entrance.t = bestT;
          op.wallId = bestWall.id;
          op.t = bestT;
          const sideSel = document.getElementById('entranceSideSelect');
          if (sideSel && bestWall.side) sideSel.value = bestWall.side;
          if (appState.settings.liveTopologySync) {
            solveParametricLayout(ver, appState.settings.activeScheme, true);
          }
        }
      } else {
        const wall = (ver.walls || []).find((w) => w.id === op.wallId);
        if (wall) {
          const res = pointToSegmentDist(rawW.x, rawW.y, wall.x1, wall.y1, wall.x2, wall.y2);
          op.t = Math.max(0.12, Math.min(0.88, res.t));
        }
      }
      recalculateCollisionsAndSchedule();
      requestRender2D();
      rebuild3DScene();
    }
  }

  function handleCanvasPointerUp() {
    if (uiState.drawingWall) {
      const dw = uiState.drawingWall;
      const len = Math.hypot(dw.x2 - dw.x1, dw.y2 - dw.y1);
      if (len >= 30) {
        const ver = getActiveVersion();
        pushUndo();
        const isExt = dw.type === 'exterior';
        const thick = isExt
          ? Number(document.getElementById('extWallThicknessSelect')?.value || 24)
          : Number(document.getElementById('intWallThicknessSelect')?.value || 12);
        const newWall = {
          id: nextId('w'),
          x1: dw.x1,
          y1: dw.y1,
          x2: dw.x2,
          y2: dw.y2,
          thickness: thick,
          type: dw.type,
          locked: isExt,
          hasDaylight: false
        };
        ver.walls.push(newWall);
        uiState.selectedItem = { kind: 'wall', id: newWall.id };
        renderInspectorPanel();
        rebuild3DScene();
        showToast(`🧱 已新增${isExt ? '既有結構外牆' : '室內隔間牆'} (${Math.round(len)} cm)`);
      }
      uiState.drawingWall = null;
      requestRender2D();
    }
    uiState.dragging = null;
  }

  function handleResizeViewports() {
    requestRender2D();
    if (threeRenderer && threeCamera) {
      const wrap = document.getElementById('canvas3DWrap');
      if (wrap) {
        const rect = wrap.getBoundingClientRect();
        const w = Math.max(280, rect.width);
        const h = Math.max(360, rect.height);
        threeCamera.aspect = w / h;
        threeCamera.updateProjectionMatrix();
        threeRenderer.setSize(w, h);
      }
    }
  }

  // 對外暴露可嵌入 React / Next.js 或外部自動化測試之公開介面
  window.GanjuSpacePlanner = {
    getState: () => appState,
    getUIState: () => uiState,
    solveParametricLayout,
    autoFurnishVersion,
    rebuild3DScene,
    requestRender2D
  };

  document.addEventListener('DOMContentLoaded', () => {
    initPageLayout();
    initDefaultProjectVersions();
    bindAllEvents();
    recalculateCollisionsAndSchedule();
    renderInspectorPanel();
    requestRender2D();
    init3DEngine();
  });
})();
