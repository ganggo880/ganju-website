// 港居不動產 全站版面與導覽模組 (Dynamic Layout Controller)
import { initThemeSwitcher, initNavDropdown } from './utils.js';

export function initLayout() {
  // 1. 初始化全域主題切換器
  initThemeSwitcher();

  // 2. 自動點亮當前頁面導覽列 Active 狀態
  highlightActiveNavLink();

  // 3. 行動端選單 Drawer 控制
  setupMobileDrawer();

  // 4.「線上工具」下拉選單（滑鼠 hover 以外補上點擊與鍵盤操作）
  initNavDropdown();
}

/**
 * 自動依據當前 URL 點亮對應的導覽選單項目
 */
function highlightActiveNavLink() {
  const navLinks = document.querySelectorAll('.nav-menu .nav-link');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;

    // 清除既有 active
    link.classList.remove('active');

    // 匹配路徑或首頁錨點
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else if (currentPath === 'index.html' && href.startsWith('#home')) {
      link.classList.add('active');
    }
  });

  // 當前頁若是下拉選單內的工具頁，一併點亮「線上工具」觸發鈕
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    if (toggle) toggle.classList.toggle('active', !!dd.querySelector('.nav-dropdown-menu .nav-link.active'));
  });
}

/**
 * 手機端 Drawer 選單互動與閉合邏輯
 */
function setupMobileDrawer() {
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = navMenu.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });

    // 點擊選單項目自動收合
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // 點擊頁面外圍自動收合
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && e.target !== mobileToggle) {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// 自動載入執行
document.addEventListener('DOMContentLoaded', () => {
  initLayout();
});
