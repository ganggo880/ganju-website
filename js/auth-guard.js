/**
 * 港居不動產 線上工具專屬授權驗證防護系統 (GANJU Auth Guard)
 * 
 * 功能亮點：
 * 1. 零閃爍防護 (Zero FOUC)：載入初期立即鎖定，未授權前遮蔽底層所有工具互動
 * 2. 多重驗證機制：支援內部通行碼驗證、URL 參數免密解鎖 (?auth=96797997 或 ?key=ganju888)
 * 3. 跨工具會話保持：驗證一次即全站工具通用，支援「記住此裝置 30 天」
 * 4. 隨時手動鎖定：頂部提供快速重新鎖定按鈕，便於公用設備登出
 * 5. 官方 LINE 申請通道：未獲授權訪客一鍵導流至 LINE 專員申請開通
 */

(function () {
  'use strict';

  // 1. 授權密碼與雜湊配置 (支援統編、專屬通行碼)
  const AUTH_CONFIG = {
    SESSION_KEY: 'ganju_auth_session',
    DAYS_VALID: 30,
    PASSCODES: ['96797997', 'ganju888', 'ganju2026'],
    PASSCODE_HASHES: [
      '7e7401e2de12a1efcc3198e0b767e5f009309093c5b37129c21a49e239374629', // 96797997
      'a4ec2ff20b5e58b30aa2a57c514984e303c77e08a1b20f56481d2910b9aba857', // ganju888
      '1e626b2328672e7cb1e1e030b1362c29be60bb4b650a5929fefacf8a486578e5'  // ganju2026
    ]
  };

  // 2. 豁免判定：若嵌入於 iframe 中（如首頁 3D 營運島微縮預覽），不阻擋 iframe 內正常展示
  if (window.self !== window.top) {
    return;
  }

  // 3. 檢查目前是否已取得授權
  function isSessionValid() {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.SESSION_KEY) || sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      if (!session || !session.authorized) return false;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        // 已過期，清除紀錄
        localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // 4. 驗證輸入字串（支援純字串比對與 SHA-256 比對）
  async function checkPasscode(input) {
    if (!input) return false;
    const clean = input.trim().toLowerCase();
    
    // 直球比對
    if (AUTH_CONFIG.PASSCODES.includes(clean)) return true;

    // SHA-256 雜湊比對
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
      console.warn('[GanjuAuth] SubtleCrypto 未支援，採備用比對', err);
    }
    return false;
  }

  // 5. 儲存授權憑證
  function saveAuthSession(rememberDevice) {
    const expiresAt = Date.now() + (AUTH_CONFIG.DAYS_VALID * 24 * 60 * 60 * 1000);
    const sessionData = JSON.stringify({
      authorized: true,
      authTime: Date.now(),
      expiresAt: rememberDevice ? expiresAt : null
    });

    if (rememberDevice) {
      localStorage.setItem(AUTH_CONFIG.SESSION_KEY, sessionData);
      sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    } else {
      sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, sessionData);
      localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    }
  }

  // 6. 清除授權（手動鎖定）
  function clearAuthSession() {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    window.location.reload();
  }

  // 7. 檢查 URL 帶參免密自動解鎖 (?auth=96797997 或 ?key=ganju888)
  function checkUrlParamAuth() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('auth') || urlParams.get('key') || urlParams.get('pass');
      if (urlCode) {
        const cleanCode = urlCode.trim().toLowerCase();
        if (AUTH_CONFIG.PASSCODES.includes(cleanCode)) {
          saveAuthSession(true);
          // 清除 URL 參數以保持網址簡潔與安全
          urlParams.delete('auth');
          urlParams.delete('key');
          urlParams.delete('pass');
          const newSearch = urlParams.toString();
          const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
          return true;
        }
      }
    } catch (e) {
      console.error('[GanjuAuth] URL 參數解析失敗', e);
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // 即時執行：若未授權，立刻在 <html> 加上 auth-locked，阻絕 FOUC 閃爍
  // --------------------------------------------------------------------------
  const urlUnlocked = checkUrlParamAuth();
  const sessionUnlocked = isSessionValid();
  const isAuthorized = urlUnlocked || sessionUnlocked;

  if (!isAuthorized) {
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
  // DOM Ready 流程：掛載鎖定遮罩或注入頂部解鎖徽章
  // --------------------------------------------------------------------------
  function onReady() {
    if (isAuthorized) {
      injectUnlockedBadge();
      return;
    }

    // 尚未授權：建立全螢幕毛玻璃鎖定彈窗
    mountAuthOverlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  /**
   * 建立並掛載全螢幕鎖定 Overlay
   */
  function mountAuthOverlay() {
    if (document.getElementById('ganju-auth-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ganju-auth-overlay';
    overlay.className = 'ganju-auth-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'authModalTitle');

    overlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-badge-icon">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div class="auth-brand-sub">港居不動產開發有限公司・系統防護</div>
        <h2 id="authModalTitle" class="auth-title">
          <i class="fa-solid fa-lock"></i> 內部專屬工具授權驗證
        </h2>
        <p class="auth-desc">
          本線上工具集為港居同仁、特約房東與受邀貴賓專屬系統，暫不對公眾開放。請輸入專屬通行授權碼以解鎖使用完整功能。
        </p>

        <form id="ganjuAuthForm" class="auth-form" onsubmit="return false;">
          <div class="auth-input-group">
            <label for="ganjuPasscodeInput" class="auth-input-label">
              <i class="fa-solid fa-key" style="color: var(--accent-gold, #C5A059);"></i> 內部授權通行碼 (Passcode)
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
              <span>記住此裝置（30 天內免重複輸入）</span>
            </label>
          </div>

          <div id="ganjuAuthError" class="auth-error-msg" hidden>
            <i class="fa-solid fa-circle-exclamation"></i>
            <span id="ganjuAuthErrorText">授權通行碼不正確，請重新輸入或聯繫官方開通。</span>
          </div>

          <button type="submit" id="ganjuSubmitAuth" class="btn-auth-unlock">
            <i class="fa-solid fa-unlock-keyhole"></i> 驗證並解鎖進入系統
          </button>
        </form>

        <div class="auth-divider">
          <span>尚未取得授權通行碼？</span>
        </div>

        <div class="auth-actions">
          <a href="https://lin.ee/Q71pw2I" target="_blank" rel="noopener noreferrer" class="btn-auth-line">
            <i class="fa-brands fa-line"></i> 聯繫官方 LINE 申請開通
          </a>
          <a href="index.html" class="btn-auth-home">
            <i class="fa-solid fa-arrow-left"></i> 返回品牌官網首頁
          </a>
        </div>

        <div class="auth-footer-note">
          <i class="fa-solid fa-shield-alt"></i> 統一編號：96797997 ｜ 純前端本地安全防護
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 聚焦輸入框
    const input = document.getElementById('ganjuPasscodeInput');
    if (input) {
      setTimeout(() => input.focus(), 150);
    }

    // 密碼明文切換
    const toggleBtn = document.getElementById('ganjuTogglePwd');
    const eyeIcon = document.getElementById('ganjuToggleEyeIcon');
    if (toggleBtn && input && eyeIcon) {
      toggleBtn.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        eyeIcon.className = isPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      });
    }

    // 表單提交處理
    const form = document.getElementById('ganjuAuthForm');
    const submitBtn = document.getElementById('ganjuSubmitAuth');
    const errorBox = document.getElementById('ganjuAuthError');
    const errorText = document.getElementById('ganjuAuthErrorText');
    const rememberBox = document.getElementById('ganjuRememberDevice');

    async function handleAuthSubmit() {
      const code = input ? input.value : '';
      if (!code.trim()) {
        showError('請輸入授權通行碼');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在驗證...';

      const valid = await checkPasscode(code);

      if (valid) {
        // 驗證成功！
        submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> 驗證通過，進入系統中...';
        saveAuthSession(rememberBox ? rememberBox.checked : true);

        setTimeout(() => {
          overlay.classList.add('auth-fade-out');
          document.documentElement.classList.remove('auth-locked');
          document.body.classList.remove('auth-locked');

          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            injectUnlockedBadge();
            showWelcomeToast();
          }, 350);
        }, 500);
      } else {
        // 驗證失敗
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> 驗證並解鎖進入系統';
        showError('授權通行碼不正確，請重新輸入或聯繫官方開通。');
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
        // 重置震動動畫
        errorBox.style.animation = 'none';
        void errorBox.offsetWidth;
        errorBox.style.animation = 'authShake 0.4s ease-in-out';
      }
    }

    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); handleAuthSubmit(); });
    if (submitBtn) submitBtn.addEventListener('click', handleAuthSubmit);
  }

  /**
   * 注入頂部導覽列解鎖徽章與重新鎖定按鈕
   */
  function injectUnlockedBadge() {
    if (document.getElementById('ganjuAuthBadge')) return;

    // 尋找 TopBar 的 badges 區域
    const topBarBadges = document.querySelector('.top-bar-badges');
    if (topBarBadges) {
      const badge = document.createElement('span');
      badge.id = 'ganjuAuthBadge';
      badge.className = 'top-bar-badge auth-status-badge';
      badge.innerHTML = `
        <i class="fa-solid fa-shield-halved"></i> 內部授權中
        <button type="button" class="btn-auth-relock" id="ganjuBtnRelock" title="重新鎖定此裝置">
          <i class="fa-solid fa-lock"></i> 鎖定
        </button>
      `;
      topBarBadges.appendChild(badge);

      const relockBtn = document.getElementById('ganjuBtnRelock');
      if (relockBtn) {
        relockBtn.addEventListener('click', () => {
          if (confirm('確定要鎖定本裝置並清除授權嗎？（下次開啟需重新輸入通行碼）')) {
            clearAuthSession();
          }
        });
      }
    }
  }

  /**
   * 解鎖成功浮動 Toast 提示
   */
  function showWelcomeToast() {
    const toast = document.createElement('div');
    toast.className = 'ganju-auth-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: rgba(16, 185, 129, 0.95);
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
      animation: authToastIn 0.35s ease;
    `;
    toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> 內部專屬工具授權驗證通過，歡迎使用！';
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // 對外公開全域 API 供同仁需要時手動呼叫
  window.GanjuAuth = {
    isAuthorized: isSessionValid,
    lock: clearAuthSession,
    unlock: function () { saveAuthSession(true); window.location.reload(); }
  };

})();
