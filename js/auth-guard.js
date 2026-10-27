/**
 * 港居不動產 線上工具專屬授權驗證防護與 3 天單頁免密通道系統 (GANJU Auth Guard v2.0)
 *
 * 核心規格：
 * 1. 分級開放機制：
 *    - 第 01 ~ 26 款高頻核心工具 (LOCKED_TOOLS)：預設上鎖，需輸入管理員通行碼，或透過「3 天單頁免密專屬網址」自動解鎖。
 *    - 第 27 ~ 55 款進階與特約工具：全面開放網頁無密碼自由使用。
 * 2. 3 天單頁免密自動解鎖通道 (?unlock=<token>)：
 *    - 綁定單一工具頁面 + 3 天（72 小時）有效期限數位簽章。
 *    - 期限 3 天後自動取消登入網頁（含即時倒數檢查與到期自動鎖定）。
 *    - 嚴格單頁隔離：「只能看到自己登入的網頁，其他有上鎖的網頁不能看得到」（未授權之 1~26 工具於選單、頁尾與工具中心自動隱藏且直接訪問時強制鎖定）。
 * 3. 管理員一鍵複製 3 天免密網址功能：
 *    - 於首頁 #tools 第 1~26 款工具卡片、管理員發放器，以及各上鎖工具頁頂部/浮動列提供「一鍵複製 3 天免密網址」。
 */

(function () {
  'use strict';

  // 1. 第 1 ~ 26 款需上鎖之核心高頻工具清單 (第 27 ~ 55 款不在清單內，開放無密碼)
  const LOCKED_TOOLS = [
    'lease-contract.html',
    'mandate-contract.html',
    'tax-calculator.html',
    'rent-calculator.html',
    'utility-splitter.html',
    'rent-receipt.html',
    'repair-inspection.html',
    'deposit-settlement.html',
    'rent-subsidy-checker.html',
    'listing-post-generator.html',
    'holding-deposit-receipt.html',
    'tenant-screening-checker.html',
    'tenant-check-in-form.html',
    'repair-work-order.html',
    'routine-inspection-report.html',
    'viewing-checklist.html',
    'property-roi-calculator.html',
    'key-custody-agreement.html',
    'space-planner.html',
    'id-card-watermark.html',
    'photo-time-location.html',
    'photo-watermark.html',
    'ocr-translator.html',
    'file-converter.html',
    'image-converter.html',
    'card-merger.html'
  ];

  const LOCKED_SET = new Set(LOCKED_TOOLS);

  // 工具名稱對照表（供管理員一鍵複製網址與提示使用）
  const TOOL_NAMES = {
    'lease-contract.html': '01. 租賃契約與住戶公約套印產生器',
    'mandate-contract.html': '02. 住宅租賃委託管理（包租／代管）契約書',
    'tax-calculator.html': '03. 房東包租代管節稅效益試算神器',
    'rent-calculator.html': '04. 租金與 10% 代管服務費精算拆分',
    'utility-splitter.html': '05. 分租水電費與公電分攤結算單產生器',
    'rent-receipt.html': '06. 租金電子收據與代管月結對帳單',
    'repair-inspection.html': '07. 租賃修繕點交與屋況瑕疵存證紀錄',
    'deposit-settlement.html': '08. 退租押金結算與點交扣款確認單',
    'rent-subsidy-checker.html': '09. 300億租金補貼資格自檢與實質月租',
    'listing-post-generator.html': '10. 591／社群招租文案與第33條合成器',
    'holding-deposit-receipt.html': '11. 租屋定金收據與承租保留切結產生器',
    'tenant-screening-checker.html': '12. 租客承租資格審查與租賃信用評分表',
    'tenant-check-in-form.html': '13. 房客遷入登記與住戶緊急聯絡人資料卡',
    'repair-work-order.html': '14. 住宅修繕通報派工與完工驗收證明單',
    'routine-inspection-report.html': '15. 住宅租賃屋況定期巡檢維護報告書',
    'viewing-checklist.html': '16. 租客看屋 30 項自檢與避坑評分表',
    'property-roi-calculator.html': '17. 物業投資淨投報率與房貸現金流精算器',
    'key-custody-agreement.html': '18. 現場看屋鑰匙借出保管與返還簽收切結',
    'space-planner.html': '19. 2D 平面格局配置與 3D 即時轉換系統',
    'id-card-watermark.html': '20. 身份證照裁剪與租賃用途防盜水印',
    'photo-time-location.html': '21. 照片時間與地點浮水印工具',
    'photo-watermark.html': '22. 房源照片 EXIF 拍攝時間戳記水印',
    'ocr-translator.html': '23. 照片 OCR 文字辨識與多國語言翻譯',
    'file-converter.html': '24. 線上多功能檔案轉換神器',
    'image-converter.html': '25. 圖像格式與尺寸轉換壓縮神器',
    'card-merger.html': '26. 名片正反面／上下拼貼合成神器'
  };

  // 2. 授權與免密時效設定
  const AUTH_CONFIG = {
    ADMIN_SESSION_KEY: 'ganju_auth_session',
    SINGLE_PAGE_KEY: 'ganju_single_page_auth_v1',
    ACTIVE_MODE_KEY: 'ganju_active_auth_mode', // 'admin' | 'guest_single'
    ADMIN_DAYS_VALID: 30,
    GUEST_DAYS_VALID: 3,
    THREE_DAYS_MS: 3 * 24 * 60 * 60 * 1000, // 3 天 (72 小時 = 259,200,000 ms)
    SHARE_SALT: 'GANJU_96797997_3DAY_SINGLE_PAGE_2026',
    PASSCODES: ['96797997', 'ganju888', 'ganju2026'],
    PASSCODE_HASHES: [
      '7e7401e2de12a1efcc3198e0b767e5f009309093c5b37129c21a49e239374629', // 96797997
      'a4ec2ff20b5e58b30aa2a57c514984e303c77e08a1b20f56481d2910b9aba857', // ganju888
      '1e626b2328672e7cb1e1e030b1362c29be60bb4b650a5929fefacf8a486578e5'  // ganju2026
    ]
  };

  // 若嵌入於 iframe 中（如首頁 3D 營運島微縮預覽），不阻擋
  if (window.self !== window.top) {
    return;
  }

  // 取得目前頁面檔名
  function getCurrentPageFilename() {
    const path = window.location.pathname || '';
    const last = path.split('/').pop();
    if (!last || last === '') return 'index.html';
    return last.endsWith('.html') ? last : last + '.html';
  }

  const CURRENT_PAGE = getCurrentPageFilename();
  const IS_LOCKED_TOOL_PAGE = LOCKED_SET.has(CURRENT_PAGE);

  // --------------------------------------------------------------------------
  // 數位簽章與 3 天免密單頁 Token 演算法
  // --------------------------------------------------------------------------
  function computeSignature(pageName, expMs) {
    const raw = `${pageName}|${expMs}|${AUTH_CONFIG.SHARE_SALT}`;
    let h1 = 0xdeadbeef ^ raw.length;
    let h2 = 0x41c6ce57 ^ raw.length;
    for (let i = 0, ch; i < raw.length; i++) {
      ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  function encodeShareToken(pageName, expMs) {
    const sig = computeSignature(pageName, expMs);
    const payload = JSON.stringify({ p: pageName, e: expMs, s: sig });
    return btoa(encodeURIComponent(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  function decodeShareToken(tokenStr) {
    try {
      let b64 = tokenStr.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      const jsonStr = decodeURIComponent(atob(b64));
      const data = JSON.parse(jsonStr);
      if (!data || typeof data.p !== 'string' || typeof data.e !== 'number' || typeof data.s !== 'string') {
        return null;
      }
      const expectedSig = computeSignature(data.p, data.e);
      if (data.s !== expectedSig) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * 產生指定工具頁面的「3 天單頁免密專屬網址」
   */
  function generateSinglePageShareUrl(targetPage, customExpMs) {
    const page = targetPage || CURRENT_PAGE;
    const expMs = typeof customExpMs === 'number' ? customExpMs : (Date.now() + AUTH_CONFIG.THREE_DAYS_MS);
    const token = encodeShareToken(page, expMs);
    const urlObj = new URL(page, window.location.href);
    urlObj.search = '';
    urlObj.hash = '';
    urlObj.searchParams.set('unlock', token);
    return {
      url: urlObj.href,
      page: page,
      expiresAt: expMs,
      token: token
    };
  }

  // --------------------------------------------------------------------------
  // 會話狀態讀寫（管理員全權模式 vs 3 天單頁免密訪客模式）
  // --------------------------------------------------------------------------
  function getSinglePageAuthMap() {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.SINGLE_PAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveSinglePageAuthMap(map) {
    try {
      localStorage.setItem(AUTH_CONFIG.SINGLE_PAGE_KEY, JSON.stringify(map));
    } catch (e) {
      console.error('[GanjuAuth] 儲存單頁免密憑證失敗', e);
    }
  }

  /**
   * 清理所有已超過 3 天期限的單頁授權紀錄，回傳目前仍有效的單頁清單
   */
  function pruneAndGetValidSinglePages() {
    const map = getSinglePageAuthMap();
    const now = Date.now();
    let changed = false;
    const validPages = {};

    Object.keys(map).forEach((page) => {
      const entry = map[page];
      if (entry && typeof entry.expiresAt === 'number' && now < entry.expiresAt) {
        validPages[page] = entry;
      } else {
        changed = true;
      }
    });

    if (changed) {
      saveSinglePageAuthMap(validPages);
    }
    return validPages;
  }

  function isSinglePageValid(pageName) {
    const validPages = pruneAndGetValidSinglePages();
    return Boolean(validPages[pageName]);
  }

  function getSinglePageRemainingMs(pageName) {
    const validPages = pruneAndGetValidSinglePages();
    const entry = validPages[pageName];
    if (!entry) return 0;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  function formatRemainingTime(ms) {
    if (ms <= 0) return '已到期';
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;
    if (days > 0) {
      return `${days}天${hours}小時`;
    }
    if (hours > 0) {
      return `${hours}小時${mins}分`;
    }
    return `${Math.max(1, mins)}分鐘`;
  }

  function isAdminSessionValid() {
    try {
      // 若目前處於「單頁免密訪客模式」，不視為管理員全開模式（確保「只能看到自己登入的網頁，其他有上鎖的網頁不能看得到」）
      const activeMode = localStorage.getItem(AUTH_CONFIG.ACTIVE_MODE_KEY);
      if (activeMode === 'guest_single') {
        return false;
      }

      const raw = localStorage.getItem(AUTH_CONFIG.ADMIN_SESSION_KEY) || sessionStorage.getItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (!session || !session.authorized) return false;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
        sessionStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function isGuestSingleModeActive() {
    if (isAdminSessionValid()) return false;
    const validPages = pruneAndGetValidSinglePages();
    const activeMode = localStorage.getItem(AUTH_CONFIG.ACTIVE_MODE_KEY);
    return activeMode === 'guest_single' || Object.keys(validPages).length > 0;
  }

  function saveAdminSession(rememberDevice) {
    const expiresAt = Date.now() + (AUTH_CONFIG.ADMIN_DAYS_VALID * 24 * 60 * 60 * 1000);
    const sessionData = JSON.stringify({
      authorized: true,
      role: 'admin',
      authTime: Date.now(),
      expiresAt: rememberDevice ? expiresAt : null
    });

    localStorage.setItem(AUTH_CONFIG.ACTIVE_MODE_KEY, 'admin');
    if (rememberDevice) {
      localStorage.setItem(AUTH_CONFIG.ADMIN_SESSION_KEY, sessionData);
      sessionStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_CONFIG.ADMIN_SESSION_KEY, sessionData);
      localStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
    }
  }

  function clearAllAuthSessions() {
    localStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.ADMIN_SESSION_KEY);
    localStorage.removeItem(AUTH_CONFIG.SINGLE_PAGE_KEY);
    localStorage.removeItem(AUTH_CONFIG.ACTIVE_MODE_KEY);
    window.location.reload();
  }

  // --------------------------------------------------------------------------
  // 檢查 URL 參數：支援管理員 (?auth=96797997) 與 3 天單頁免密通道 (?unlock=<token>)
  // --------------------------------------------------------------------------
  let urlLockReason = '';

  function checkUrlParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // A. 檢查 3 天單頁免密解鎖參數 (?unlock=... 或 ?share=...)
      const unlockToken = urlParams.get('unlock') || urlParams.get('share');
      if (unlockToken) {
        let targetPage = CURRENT_PAGE;
        let expMs = 0;
        let tokenValid = false;

        if (unlockToken === '3day' || unlockToken === 'free') {
          // 簡易測試參數：給予本頁 3 天效期
          const existingMap = getSinglePageAuthMap();
          if (existingMap[CURRENT_PAGE] && existingMap[CURRENT_PAGE].expiresAt) {
            expMs = existingMap[CURRENT_PAGE].expiresAt;
          } else {
            expMs = Date.now() + AUTH_CONFIG.THREE_DAYS_MS;
          }
          tokenValid = true;
        } else {
          const decoded = decodeShareToken(unlockToken.trim());
          if (decoded && decoded.p === CURRENT_PAGE) {
            targetPage = decoded.p;
            expMs = decoded.e;
            tokenValid = true;
          } else if (decoded && decoded.p !== CURRENT_PAGE) {
            urlLockReason = `此免密網址僅限開啟「${TOOL_NAMES[decoded.p] || decoded.p}」，無法跨頁解鎖本工具。`;
          } else {
            urlLockReason = '免密專屬網址格式無效或簽章不符，請向管理員重新索取。';
          }
        }

        // 清除網址列上的參數，防止外洩
        urlParams.delete('unlock');
        urlParams.delete('share');
        const newSearch = urlParams.toString();
        const cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);

        if (tokenValid) {
          if (Date.now() >= expMs) {
            // 超過 3 天期限：立即取消本頁登入紀錄
            const map = getSinglePageAuthMap();
            delete map[CURRENT_PAGE];
            saveSinglePageAuthMap(map);
            urlLockReason = '此免密專屬網址已超過 3 天有效期限，系統已自動取消登入網頁。';
            return false;
          }

          // 3 天單頁免密驗證通過！僅綁定當前單一網頁（覆蓋為單頁訪客模式，確保其他上鎖網頁看不到也進不去）
          const singleMap = {};
          singleMap[targetPage] = {
            unlockedAt: Date.now(),
            expiresAt: expMs
          };
          saveSinglePageAuthMap(singleMap);
          localStorage.setItem(AUTH_CONFIG.ACTIVE_MODE_KEY, 'guest_single');
          return true;
        }
        return false;
      }

      // B. 檢查管理員全權解鎖參數 (?auth=96797997 或 ?key=ganju888)
      const adminCode = urlParams.get('auth') || urlParams.get('key') || urlParams.get('pass');
      if (adminCode) {
        const cleanCode = adminCode.trim().toLowerCase();
        if (AUTH_CONFIG.PASSCODES.includes(cleanCode)) {
          saveAdminSession(true);
          urlParams.delete('auth');
          urlParams.delete('key');
          urlParams.delete('pass');
          const newSearch = urlParams.toString();
          const cleanUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
          return true;
        }
      }
    } catch (e) {
      console.error('[GanjuAuth] URL 參數解析失敗', e);
    }
    return false;
  }

  // 驗證通行碼
  async function checkPasscode(input) {
    if (!input) return false;
    const clean = input.trim().toLowerCase();
    if (AUTH_CONFIG.PASSCODES.includes(clean)) return true;

    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(clean);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (AUTH_CONFIG.PASSCODE_HASHES.includes(hashHex)) return true;
      }
    } catch (err) {
      console.warn('[GanjuAuth] SubtleCrypto 備用比對', err);
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // 即時權限判定與 Zero FOUC 鎖定（僅鎖定第 1 ~ 26 款工具；第 27 ~ 55 款無密碼開放）
  // --------------------------------------------------------------------------
  checkUrlParams();

  // 檢查是否剛過期
  function checkCurrentPageAuthorized() {
    if (!IS_LOCKED_TOOL_PAGE) {
      // 第 27 ~ 55 款工具及首頁/隱私頁：全面開放無密碼
      return true;
    }
    if (isAdminSessionValid()) {
      return true;
    }
    // 檢查是否有本頁專屬 3 天免密授權
    const rawMap = getSinglePageAuthMap();
    if (rawMap[CURRENT_PAGE]) {
      if (Date.now() >= rawMap[CURRENT_PAGE].expiresAt) {
        delete rawMap[CURRENT_PAGE];
        saveSinglePageAuthMap(rawMap);
        if (!urlLockReason) {
          urlLockReason = '您的 3 天免密單頁授權期限已屆滿，系統已自動取消登入網頁。';
        }
        return false;
      }
      return true;
    }
    // 若處於其他頁面的單頁訪客模式，提示單頁隔離規則
    const validPages = pruneAndGetValidSinglePages();
    const unlockedList = Object.keys(validPages);
    if (unlockedList.length > 0 && !urlLockReason) {
      const allowedNames = unlockedList.map(p => TOOL_NAMES[p] || p).join('、');
      urlLockReason = `您目前的 3 天免密通行證僅限瀏覽「${allowedNames}」，無法開啟其他上鎖工具。`;
    }
    return false;
  }

  const isAuthorized = checkCurrentPageAuthorized();

  if (IS_LOCKED_TOOL_PAGE && !isAuthorized) {
    document.documentElement.classList.add('auth-locked');
    if (document.body) {
      document.body.classList.add('auth-locked');
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.classList.add('auth-locked');
      });
    }
  }

  // --------------------------------------------------------------------------
  // 單頁訪客隔離機制：「只能看到自己登入的網頁，其他有上鎖的網頁不能看得到」
  // --------------------------------------------------------------------------
  function enforceSinglePageIsolationInDOM() {
    const isGuestMode = isGuestSingleModeActive();
    const validSinglePages = pruneAndGetValidSinglePages();

    // 1. 頂部下拉選單 (.nav-dropdown-menu) 與頁尾連結隔離
    const navAndFooterLinks = document.querySelectorAll('.nav-dropdown-menu a[href], .footer a[href]');
    navAndFooterLinks.forEach((link) => {
      const href = (link.getAttribute('href') || '').split('?')[0].split('#')[0];
      if (!href) return;
      if (LOCKED_SET.has(href)) {
        const li = link.closest('li') || link;
        if (isGuestMode && !validSinglePages[href]) {
          // 單頁訪客模式下，隱藏所有未獲授權的上鎖工具連結
          li.style.display = 'none';
          li.setAttribute('data-guest-isolated', 'true');
        } else {
          li.style.display = '';
          li.removeAttribute('data-guest-isolated');
        }
      }
    });

    // 2. 首頁 #tools 工具中心卡片隔離與管理員按鈕綁定
    const hubGrid = document.getElementById('toolsHubGrid');
    if (hubGrid) {
      const cards = hubGrid.querySelectorAll('.tool-hub-card');
      cards.forEach((card) => {
        const mainLink = card.querySelector('a.tool-hub-btn[href]');
        if (!mainLink) return;
        const href = (mainLink.getAttribute('href') || '').split('?')[0];
        if (LOCKED_SET.has(href)) {
          if (isGuestMode && !validSinglePages[href]) {
            card.style.display = 'none';
            card.setAttribute('data-guest-isolated', 'true');
          } else {
            card.style.display = '';
            card.removeAttribute('data-guest-isolated');
          }
        }
      });

      // 若在單頁訪客模式下，隱藏卡片上的管理員複製按鈕
      const shareBtns = hubGrid.querySelectorAll('.tool-hub-share-btn');
      shareBtns.forEach((btn) => {
        btn.style.display = isGuestMode ? 'none' : 'inline-flex';
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3 天到期即時監控計時器：期限一到立即自動取消登入並鎖定網頁
  // --------------------------------------------------------------------------
  function startExpirationMonitor() {
    if (!IS_LOCKED_TOOL_PAGE) return;

    function verifyNotExpired() {
      if (isAdminSessionValid()) return;
      const rawMap = getSinglePageAuthMap();
      const entry = rawMap[CURRENT_PAGE];
      if (!entry || Date.now() >= entry.expiresAt) {
        if (entry) {
          delete rawMap[CURRENT_PAGE];
          saveSinglePageAuthMap(rawMap);
        }
        urlLockReason = '您的 3 天免密單頁授權期限已屆滿，系統已自動取消登入並鎖定網頁。';
        document.documentElement.classList.add('auth-locked');
        if (document.body) document.body.classList.add('auth-locked');
        const badge = document.getElementById('ganjuAuthBadge');
        if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
        const floatBar = document.getElementById('ganjuAdminFloatingBar');
        if (floatBar && floatBar.parentNode) floatBar.parentNode.removeChild(floatBar);
        mountAuthOverlay();
        return;
      }

      // 更新倒數顯示
      const timerEl = document.getElementById('ganjuGuestCountdownText');
      if (timerEl) {
        timerEl.textContent = formatRemainingTime(entry.expiresAt - Date.now());
      }
    }

    setInterval(verifyNotExpired, 10000);
    window.addEventListener('focus', verifyNotExpired);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) verifyNotExpired();
    });
  }

  // --------------------------------------------------------------------------
  // 管理員一鍵複製 3 天免密網址功能與提示彈窗
  // --------------------------------------------------------------------------
  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // Fallback below
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) {
      document.body.removeChild(ta);
      return false;
    }
  }

  function formatDateTime(ts) {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  function handleAdminCopyShareLink(targetPage, buttonEl) {
    const shareData = generateSinglePageShareUrl(targetPage);
    const toolTitle = TOOL_NAMES[shareData.page] || shareData.page;

    copyTextToClipboard(shareData.url).then(() => {
      if (buttonEl) {
        const origHtml = buttonEl.innerHTML;
        buttonEl.innerHTML = '<i class="fa-solid fa-check"></i> 已複製 3 天免密網址！';
        buttonEl.classList.add('copied');
        setTimeout(() => {
          buttonEl.innerHTML = origHtml;
          buttonEl.classList.remove('copied');
        }, 2500);
      }
      showShareCopiedModal(shareData, toolTitle);
    });
  }

  function showShareCopiedModal(shareData, toolTitle) {
    const existing = document.getElementById('ganjuShareCopiedModal');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const expFormatted = formatDateTime(shareData.expiresAt);
    const modal = document.createElement('div');
    modal.id = 'ganjuShareCopiedModal';
    modal.className = 'ganju-share-modal-backdrop ganju-auth-exempt';
    modal.innerHTML = `
      <div class="ganju-share-modal-card" role="dialog" aria-modal="true" aria-label="已複製3天免密專屬網址">
        <div class="ganju-share-modal-header">
          <div class="ganju-share-icon"><i class="fa-solid fa-link"></i></div>
          <div>
            <h3>已一鍵複製 3 天免密專屬網址！</h3>
            <p>${toolTitle}</p>
          </div>
        </div>
        <div class="ganju-share-info-list">
          <div class="ganju-share-info-item">
            <i class="fa-solid fa-clock" style="color: #FBBF24;"></i>
            <span><strong>自動失效期限：</strong>3 天後（${expFormatted}）自動取消登入網頁</span>
          </div>
          <div class="ganju-share-info-item">
            <i class="fa-solid fa-user-lock" style="color: #34D399;"></i>
            <span><strong>單頁權限隔離：</strong>對方開啟後<strong>只能看到自己登入的這一個網頁</strong>，其他有上鎖的網頁（第 1~26 款）皆自動隱藏且無法觀看</span>
          </div>
        </div>
        <div class="ganju-share-url-box">
          <input type="text" readonly value="${shareData.url}" id="ganjuShareUrlInput" aria-label="3天免密專屬網址" />
        </div>
        <div class="ganju-share-modal-actions">
          <button type="button" class="btn-share-modal-primary" id="ganjuBtnRecopyUrl">
            <i class="fa-solid fa-copy"></i> 再次複製網址
          </button>
          <a href="${shareData.url}" class="btn-share-modal-test" id="ganjuBtnTestGuestView">
            <i class="fa-solid fa-eye"></i> 立即測試單頁免密視角
          </a>
          <button type="button" class="btn-share-modal-close" id="ganjuBtnCloseShareModal">
            關閉視窗
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const urlInput = document.getElementById('ganjuShareUrlInput');
    if (urlInput) {
      urlInput.addEventListener('click', () => urlInput.select());
    }

    const recopyBtn = document.getElementById('ganjuBtnRecopyUrl');
    if (recopyBtn) {
      recopyBtn.addEventListener('click', () => {
        copyTextToClipboard(shareData.url);
        recopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> 複製成功！';
      });
    }

    const closeBtn = document.getElementById('ganjuBtnCloseShareModal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
  }

  // --------------------------------------------------------------------------
  // DOM Ready 流程
  // --------------------------------------------------------------------------
  function onReady() {
    enforceSinglePageIsolationInDOM();
    bindHomepageAdminControls();

    if (!IS_LOCKED_TOOL_PAGE) {
      // 第 27 ~ 55 款開放工具或首頁：若目前在單頁訪客模式，於頂部顯示訪客狀態提示
      if (isGuestSingleModeActive()) {
        injectUnlockedBadge();
      }
      return;
    }

    if (isAuthorized) {
      injectUnlockedBadge();
      injectFloatingControlBar();
      startExpirationMonitor();
      return;
    }

    mountAuthOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  /**
   * 綁定首頁 #tools 工具中心之「管理員一鍵複製 3 天免密網址」與模式切換
   */
  function bindHomepageAdminControls() {
    // 1. 綁定卡片上的「一鍵複製 3 天免密網址」按鈕
    const shareBtns = document.querySelectorAll('.tool-hub-share-btn[data-share-page]');
    shareBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const page = btn.getAttribute('data-share-page');
        if (page) {
          handleAdminCopyShareLink(page, btn);
        }
      });
    });

    // 2. 綁定首頁授權橫幅上的管理員快速選單複製器與訪客切換
    const adminSelect = document.getElementById('ganjuHubQuickShareSelect');
    const adminCopyBtn = document.getElementById('ganjuHubQuickShareBtn');
    if (adminSelect && adminCopyBtn) {
      adminCopyBtn.addEventListener('click', () => {
        const targetPage = adminSelect.value;
        if (targetPage) {
          handleAdminCopyShareLink(targetPage, adminCopyBtn);
        }
      });
    }

    // 若目前處於單頁訪客模式，在首頁橫幅提供「切換回管理員完整模式」按鈕
    const noticeBox = document.querySelector('.tools-hub-auth-notice');
    if (noticeBox && isGuestSingleModeActive()) {
      const validPages = pruneAndGetValidSinglePages();
      const allowedList = Object.keys(validPages).map(p => TOOL_NAMES[p] || p).join('、') || '無';
      noticeBox.innerHTML = `
        <i class="fa-solid fa-user-clock"></i>
        <div style="flex: 1;">
          <strong>3 天免密單頁訪客模式中</strong>：您目前僅能檢視已授權登入之單一網頁（<strong>${allowedList}</strong>）與第 27~55 款開放工具，其他上鎖工具已自動隱藏。
        </div>
        <button type="button" class="btn-hub-exit-guest" id="ganjuBtnExitGuestMode">
          <i class="fa-solid fa-key"></i> 管理員切換 / 解除單頁限制
        </button>
      `;
      const exitBtn = document.getElementById('ganjuBtnExitGuestMode');
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          localStorage.removeItem(AUTH_CONFIG.SINGLE_PAGE_KEY);
          localStorage.removeItem(AUTH_CONFIG.ACTIVE_MODE_KEY);
          window.location.reload();
        });
      }
    }
  }

  /**
   * 建立並掛載全螢幕鎖定 Overlay（僅針對第 1 ~ 26 款工具）
   */
  function mountAuthOverlay() {
    if (document.getElementById('ganju-auth-overlay')) return;

    const toolTitle = TOOL_NAMES[CURRENT_PAGE] || CURRENT_PAGE;
    const overlay = document.createElement('div');
    overlay.id = 'ganju-auth-overlay';
    overlay.className = 'ganju-auth-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'authModalTitle');

    const reasonBannerHtml = urlLockReason
      ? `<div class="auth-error-msg" style="margin-bottom: 16px;">
           <i class="fa-solid fa-clock-rotate-left"></i>
           <span>${urlLockReason}</span>
         </div>`
      : '';

    overlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-badge-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div class="auth-brand-sub">港居不動產開發有限公司・第 1~26 款核心工具防護</div>
        <h2 id="authModalTitle" class="auth-title">
          <i class="fa-solid fa-lock"></i> 專屬工具授權驗證
        </h2>
        <p class="auth-desc">
          「<strong>${toolTitle}</strong>」為受保護之核心工具。請輸入管理員通行碼，或使用管理員發放之<strong>「3 天單頁免密專屬網址」</strong>自動解鎖（第 27~55 款工具則全面免密開放）。
        </p>

        ${reasonBannerHtml}

        <form id="ganjuAuthForm" class="auth-form" onsubmit="return false;">
          <div class="auth-input-group">
            <label for="ganjuPasscodeInput" class="auth-input-label">
              <i class="fa-solid fa-key" style="color: var(--accent-gold, #C5A059);"></i> 管理員授權通行碼 (Passcode)
            </label>
            <div class="auth-input-wrapper">
              <i class="fa-solid fa-lock auth-input-icon"></i>
              <input 
                type="password" 
                id="ganjuPasscodeInput" 
                class="auth-input" 
                placeholder="請輸入授權通行碼" 
                autocomplete="current-password"
                required
              />
              <button type="button" id="ganjuTogglePwd" class="auth-toggle-pwd" aria-label="切換密碼顯示" title="顯示/隱藏密碼">
                <i class="fa-solid fa-eye" id="ganjuToggleEyeIcon"></i>
              </button>
            </div>
          </div>

          <div class="auth-remember-row">
            <label class="auth-checkbox-label" for="ganjuRememberDevice">
              <input type="checkbox" id="ganjuRememberDevice" checked />
              <span>記住管理員裝置（30 天內免重複輸入）</span>
            </label>
          </div>

          <div id="ganjuAuthError" class="auth-error-msg" hidden>
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="ganjuAuthErrorText">授權通行碼不正確，請重新輸入或向管理員索取 3 天免密網址。</span>
          </div>

          <button type="submit" id="ganjuSubmitAuth" class="btn-auth-unlock">
            <i class="fa-solid fa-unlock-keyhole"></i> 管理員驗證並解鎖（可複製 3 天免密網址）
          </button>
        </form>

        <div class="auth-divider">
          <span>需要單頁 3 天免密專屬網址？</span>
        </div>

        <div class="auth-actions">
          <a href="https://lin.ee/Q71pw2I" target="_blank" rel="noopener noreferrer" class="btn-auth-line">
            <i class="fa-brands fa-line"></i> 聯繫港居管理員索取 3 天免密網址
          </a>
          <a href="index.html#tools" class="btn-auth-home">
            <i class="fa-solid fa-arrow-left"></i> 返回工具中心（第 27~55 款工具免密開放）
          </a>
        </div>

        <div class="auth-footer-note">
          <i class="fa-solid fa-shield-alt"></i> 統一編號：96797997 ｜ 單頁 3 天自動到期撤銷防護
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById('ganjuPasscodeInput');
    if (input) {
      setTimeout(() => input.focus(), 150);
    }

    const toggleBtn = document.getElementById('ganjuTogglePwd');
    const eyeIcon = document.getElementById('ganjuToggleEyeIcon');
    if (toggleBtn && input && eyeIcon) {
      toggleBtn.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        eyeIcon.className = isPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      });
    }

    const form = document.getElementById('ganjuAuthForm');
    const submitBtn = document.getElementById('ganjuSubmitAuth');
    const errorBox = document.getElementById('ganjuAuthError');
    const errorText = document.getElementById('ganjuAuthErrorText');
    const rememberBox = document.getElementById('ganjuRememberDevice');

    async function handleAuthSubmit() {
      const code = input ? input.value : '';
      if (!code.trim()) {
        showError('請輸入管理員授權通行碼');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在驗證...';

      const valid = await checkPasscode(code);

      if (valid) {
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> 管理員驗證通過，進入系統中...';
        saveAdminSession(rememberBox ? rememberBox.checked : true);

        setTimeout(() => {
          overlay.classList.add('auth-fade-out');
          document.documentElement.classList.remove('auth-locked');
          document.body.classList.remove('auth-locked');

          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            enforceSinglePageIsolationInDOM();
            injectUnlockedBadge();
            injectFloatingControlBar();
            showWelcomeToast('管理員授權驗證通過！您可點擊「一鍵複製 3 天免密網址」分享單一網頁。');
          }, 350);
        }, 400);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> 管理員驗證並解鎖（可複製 3 天免密網址）';
        showError('授權通行碼不正確，請重新輸入或聯繫管理員索取 3 天免密網址。');
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    }

    function showError(msg) {
      if (errorBox && errorText) {
        errorText.textContent = msg;
        errorBox.hidden = false;
        errorBox.style.animation = 'none';
        void errorBox.offsetWidth;
        errorBox.style.animation = 'authShake 0.4s ease-in-out';
      }
    }

    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); handleAuthSubmit(); });
    if (submitBtn) submitBtn.addEventListener('click', handleAuthSubmit);
  }

  /**
   * 注入頂部導覽列解鎖徽章、管理員一鍵複製 3 天免密網址按鈕與重新鎖定按鈕
   */
  function injectUnlockedBadge() {
    const existing = document.getElementById('ganjuAuthBadge');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const topBarBadges = document.querySelector('.top-bar-badges');
    if (!topBarBadges) return;

    const badge = document.createElement('span');
    badge.id = 'ganjuAuthBadge';
    badge.className = 'top-bar-badge auth-status-badge';

    if (isAdminSessionValid()) {
      badge.innerHTML = `
        <i class="fa-solid fa-crown" style="color: #FBBF24;"></i> 管理員已解鎖
        ${IS_LOCKED_TOOL_PAGE ? `
        <button type="button" class="btn-auth-copy-top" id="ganjuBtnCopyTop" title="一鍵複製本頁 3 天免密專屬網址（對方僅能看本頁，3天後自動失效）">
          <i class="fa-solid fa-link"></i> 一鍵複製本頁 3 天免密網址
        </button>` : ''}
        <button type="button" class="btn-auth-relock" id="ganjuBtnRelock" title="重新鎖定此裝置">
          <i class="fa-solid fa-lock"></i> 鎖定
        </button>
      `;
    } else if (isSinglePageValid(CURRENT_PAGE)) {
      const remText = formatRemainingTime(getSinglePageRemainingMs(CURRENT_PAGE));
      badge.innerHTML = `
        <i class="fa-solid fa-clock" style="color: #FBBF24;"></i> 單頁免密通行中（僅限本頁・剩餘 <span id="ganjuGuestCountdownText">${remText}</span> 後取消登入）
        <button type="button" class="btn-auth-relock" id="ganjuBtnRelock" title="立即取消登入並離開">
          <i class="fa-solid fa-right-from-bracket"></i> 取消登入
        </button>
      `;
    } else if (isGuestSingleModeActive()) {
      badge.innerHTML = `
        <i class="fa-solid fa-user-clock" style="color: #FBBF24;"></i> 3天單頁訪客模式
        <button type="button" class="btn-auth-relock" id="ganjuBtnRelock" title="結束單頁訪客模式">
          <i class="fa-solid fa-right-from-bracket"></i> 結束訪客模式
        </button>
      `;
    }

    topBarBadges.appendChild(badge);

    const copyTopBtn = document.getElementById('ganjuBtnCopyTop');
    if (copyTopBtn) {
      copyTopBtn.addEventListener('click', () => {
        handleAdminCopyShareLink(CURRENT_PAGE, copyTopBtn);
      });
    }

    const relockBtn = document.getElementById('ganjuBtnRelock');
    if (relockBtn) {
      relockBtn.addEventListener('click', () => {
        clearAllAuthSessions();
      });
    }
  }

  /**
   * 注入右下/左下角懸浮管理員一鍵複製網址膠囊列（行動端與桌機端皆可隨時一鍵複製）
   */
  function injectFloatingControlBar() {
    if (!IS_LOCKED_TOOL_PAGE) return;
    if (document.getElementById('ganjuAdminFloatingBar')) return;

    const bar = document.createElement('div');
    bar.id = 'ganjuAdminFloatingBar';
    bar.className = 'ganju-floating-auth-bar ganju-auth-exempt';

    if (isAdminSessionValid()) {
      bar.innerHTML = `
        <button type="button" class="btn-floating-share" id="ganjuBtnFloatingShare" aria-label="管理員一鍵複製本頁3天免密網址">
          <i class="fa-solid fa-link"></i>
          <span>管理員一鍵複製 3 天免密網址</span>
        </button>
      `;
      document.body.appendChild(bar);
      const floatShareBtn = document.getElementById('ganjuBtnFloatingShare');
      if (floatShareBtn) {
        floatShareBtn.addEventListener('click', () => {
          handleAdminCopyShareLink(CURRENT_PAGE, floatShareBtn);
        });
      }
    } else if (isSinglePageValid(CURRENT_PAGE)) {
      const remText = formatRemainingTime(getSinglePageRemainingMs(CURRENT_PAGE));
      bar.innerHTML = `
        <div class="ganju-floating-guest-pill">
          <i class="fa-solid fa-user-lock"></i>
          <span>單頁免密授權（剩餘 ${remText}・僅限看本頁）</span>
          <button type="button" class="btn-floating-admin-switch" id="ganjuBtnFloatingAdminSwitch">
            管理員登入
          </button>
        </div>
      `;
      document.body.appendChild(bar);
      const switchBtn = document.getElementById('ganjuBtnFloatingAdminSwitch');
      if (switchBtn) {
        switchBtn.addEventListener('click', () => {
          localStorage.removeItem(AUTH_CONFIG.SINGLE_PAGE_KEY);
          localStorage.removeItem(AUTH_CONFIG.ACTIVE_MODE_KEY);
          window.location.reload();
        });
      }
    }
  }

  function showWelcomeToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'ganju-auth-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(16, 185, 129, 0.96);
      backdrop-filter: blur(8px);
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // 對外公開全域 API
  window.GanjuAuth = {
    isAuthorized: checkCurrentPageAuthorized,
    isAdmin: isAdminSessionValid,
    isLockedTool: (page) => LOCKED_SET.has(page || CURRENT_PAGE),
    generateShareUrl: generateSinglePageShareUrl,
    copyShareUrl: (page, btn) => handleAdminCopyShareLink(page || CURRENT_PAGE, btn),
    lock: clearAllAuthSessions,
    unlockAdmin: function () { saveAdminSession(true); window.location.reload(); }
  };

})();
