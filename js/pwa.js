// js/pwa.js - 港居不動產 PWA 安裝提示與離線連線狀態管理
// 支援 Chrome、Edge、Safari (iOS) 與 Android 桌面/主畫面原生應用安裝

(function () {
  'use strict';

  // 1. 註冊 Service Worker
  function registerSW() {
    if ('serviceWorker' in navigator) {
      const swPath = './sw.js';
      navigator.serviceWorker
        .register(swPath)
        .then((reg) => {
          console.log('[PWA] Service Worker 註冊成功，範圍:', reg.scope);

          // 監聽更新
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showToast('💡 港居線上工具集已有新版本，重整即可享受最新功能！', 'info');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker 註冊失敗 (可能是非 HTTPS 環境):', err);
        });
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', registerSW);
  } else {
    registerSW();
  }

  // 2. 監聽網路連線狀態切換
  window.addEventListener('online', () => {
    showToast('🌐 已恢復網路連線，快取自動同步更新。', 'success');
    const badge = document.getElementById('pwa-offline-badge');
    if (badge) badge.remove();
  });

  window.addEventListener('offline', () => {
    showToast('📶 目前處於離線狀態，全站 10 款工具可 100% 離線正常操作！', 'warning');
    showOfflineBadge();
  });

  function showOfflineBadge() {
    if (document.getElementById('pwa-offline-badge')) return;
    const badge = document.createElement('div');
    badge.id = 'pwa-offline-badge';
    badge.setAttribute('role', 'status');
    badge.innerHTML = '<i class="fa-solid fa-wifi-slash"></i> 離線模式運行中';
    badge.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      z-index: 9999;
      background: rgba(15, 35, 65, 0.92);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: var(--accent-gold, #C5A059);
      border: 1px solid var(--accent-gold, #C5A059);
      padding: 10px 16px;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      animation: fadeInBadge 0.3s ease-out;
    `;
    document.body.appendChild(badge);
  }

  // 3. 處理 PWA 安裝提示 (beforeinstallprompt)
  let deferredPrompt = null;
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (!isInstalled) {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止預設的微型資訊列
      e.preventDefault();
      deferredPrompt = e;
      // 延遲 3 秒後顯示友善的安裝橫幅，不打擾初次進站使用者
      setTimeout(() => {
        showInstallBanner();
      }, 3000);
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] 港居不動產工具集已成功安裝');
      deferredPrompt = null;
      hideInstallBanner();
      showToast('🎉 港居不動產工具集已安裝至您的主畫面！', 'success');
    });
  }

  function showInstallBanner() {
    if (document.getElementById('pwa-install-banner') || !deferredPrompt) return;
    // 若使用者過去 7 天內關閉過，暫不打擾
    const dismissedTime = localStorage.getItem('ganju_pwa_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 7 * 86400 * 1000) {
      return;
    }

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-inner">
        <div class="pwa-banner-icon">
          <img src="assets/icons/icon-192.png" alt="港居不動產" width="44" height="44" style="border-radius: 10px; display: block;">
        </div>
        <div class="pwa-banner-content">
          <div class="pwa-banner-title">安裝「港居不動產」工具 App</div>
          <div class="pwa-banner-desc">支援案場 100% 離線使用・更流暢的全螢幕體驗</div>
        </div>
        <div class="pwa-banner-actions">
          <button type="button" id="btn-pwa-install" class="pwa-btn-primary" aria-label="立即安裝港居工具App">
            <i class="fa-solid fa-download"></i> 免費安裝
          </button>
          <button type="button" id="btn-pwa-dismiss" class="pwa-btn-close" aria-label="關閉安裝提示">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    `;

    // 注入專屬樣式
    banner.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      max-width: 420px;
      width: calc(100% - 48px);
      z-index: 9998;
      background: var(--bg-card, #FFFFFF);
      border: 1.5px solid var(--accent-gold, #C5A059);
      border-radius: 16px;
      box-shadow: 0 12px 36px rgba(15, 35, 65, 0.22);
      overflow: hidden;
      animation: slideUpBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      transition: all 0.3s ease;
    `;

    const inner = banner.querySelector('.pwa-banner-inner');
    inner.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      flex-wrap: wrap;
    `;

    const content = banner.querySelector('.pwa-banner-content');
    content.style.cssText = `
      flex: 1;
      min-width: 140px;
    `;

    const title = banner.querySelector('.pwa-banner-title');
    title.style.cssText = `
      font-size: 0.92rem;
      font-weight: 800;
      color: var(--primary-navy, #1A365D);
      line-height: 1.3;
    `;

    const desc = banner.querySelector('.pwa-banner-desc');
    desc.style.cssText = `
      font-size: 0.78rem;
      color: var(--text-secondary, #64748B);
      margin-top: 2px;
      line-height: 1.3;
    `;

    const actions = banner.querySelector('.pwa-banner-actions');
    actions.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const btnInstall = banner.querySelector('#btn-pwa-install');
    btnInstall.style.cssText = `
      background: linear-gradient(135deg, var(--accent-gold, #C5A059), var(--accent-gold-hover, #B08C45));
      color: #FFFFFF;
      border: none;
      padding: 10px 14px;
      border-radius: 24px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 44px;
      min-width: 44px;
      box-shadow: 0 4px 12px rgba(197, 160, 89, 0.3);
      touch-action: manipulation;
    `;

    const btnDismiss = banner.querySelector('#btn-pwa-dismiss');
    btnDismiss.style.cssText = `
      background: transparent;
      color: var(--text-muted, #94A3B8);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      touch-action: manipulation;
    `;

    document.body.appendChild(banner);

    // 綁定安裝與關閉事件
    btnInstall.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('[PWA] 使用者安裝選擇:', choice.outcome);
      deferredPrompt = null;
      hideInstallBanner();
    });

    btnDismiss.addEventListener('click', () => {
      localStorage.setItem('ganju_pwa_dismissed', Date.now().toString());
      hideInstallBanner();
    });
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  // 4. Toast 通用輔助提示 (相容全站已有的 showToast 或原生 fallback)
  function showToast(msg, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
      return;
    }
    // 獨立原生 Toast 容器
    let toastContainer = document.getElementById('pwa-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'pwa-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#1A365D';
    toast.style.cssText = `
      background: ${bg};
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      animation: fadeInToast 0.3s ease-out;
      pointer-events: auto;
      max-width: 360px;
    `;
    toast.textContent = msg;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
})();
