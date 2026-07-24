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
