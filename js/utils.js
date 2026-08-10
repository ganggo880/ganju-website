// 港居不動產 公用工具函式 (Shared Utilities)

/**
 * 格式化數字加上千分位點逗號
 * @param {number|string} num 
 * @returns {string}
 */
export function formatCommas(num) {
  if (num === null || num === undefined || num === '') return '0';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * 計算兩日期的包含首尾天數差
 * @param {string} startStr 
 * @param {string} endStr 
 * @returns {number}
 */
export function calculateDateDiff(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  if (end < start) return 0;
  
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包含首尾日
}

/**
 * 彈出浮動 Toast 提示訊息
 * @param {string} message 
 */
export function showToast(message) {
  let toastEl = document.getElementById('toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    document.body.appendChild(toastEl);
  }
  
  toastEl.innerText = message;
  toastEl.classList.add('show');
  
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  window.toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

/**
 * 導覽列「線上工具」下拉選單控制器
 *
 * CSS 只用 :hover / :focus-within 開啟，觸控裝置（平板橫向、觸控筆電）
 * 在 >992px 時點一下不會有任何反應。此處補上點擊開合與 Esc 關閉，
 * 讓滑鼠、鍵盤、觸控三種操作方式都走得通。
 */
export function initNavDropdown() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  const closeAll = (except) => {
    dropdowns.forEach(dd => {
      if (dd === except) return;
      dd.classList.remove('open');
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };

  dropdowns.forEach(dd => {
    const toggle = dd.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = dd.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      closeAll(dd);
    });
  });

  // 點擊選單以外區域關閉
  document.addEventListener('click', (e) => {
    if (![...dropdowns].some(dd => dd.contains(e.target))) closeAll(null);
  });

  // Esc 關閉並把焦點還給觸發鈕
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = [...dropdowns].find(dd => dd.classList.contains('open'));
    if (!open) return;
    closeAll(null);
    const t = open.querySelector('.nav-dropdown-toggle');
    if (t) t.focus();
  });
}

/**
 * 全域深淺色主題切換器
 */
export function initThemeSwitcher() {
  const themeToggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('ganggo_theme') || 'light';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('ganggo_theme', newTheme);
      showToast(newTheme === 'dark' ? '已切換至深色模式 🌙' : '已切換至淺色模式 ☀️');
    });
  }
}
