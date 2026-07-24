// 港居不動產 導覽列與選單控制邏輯 (Navigation Component)
import { initThemeSwitcher } from './utils.js';

export function initNavigation() {
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // 初始化深淺色主題切換
  initThemeSwitcher();

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navMenu.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // 點擊選單項目自動關閉抽屜
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // 點擊外圍關閉選單
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && e.target !== mobileToggle) {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// 頁面載入自動初始化
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});
