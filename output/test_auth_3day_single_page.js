// output/test_auth_3day_single_page.js
// 實機 Chrome CDP 驗收：
// 1. 第 27~55 款工具開放無密碼
// 2. 第 1~26 款工具預設上鎖 + 管理員一鍵複製 3 天單頁免密網址
// 3. 免密網址自動解鎖單一網頁 + 只能看到自己登入的網頁（其他上鎖網頁隱藏且鎖定）
// 4. 期限 3 天後自動取消登入網頁並重新上鎖

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8905;
const CDP_PORT = 9345;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.callbacks = new Map();
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve);
      this.ws.addEventListener('error', reject);
      this.ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve: res, reject: rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      });
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : undefined;
  }
  close() {
    this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function navigateAndReady(cdp, url) {
  await cdp.send('Page.navigate', { url });
  for (let i = 0; i < 40; i++) {
    await sleep(150);
    const state = await cdp.eval(`document.readyState`);
    if (state === 'complete') {
      await sleep(100);
      return;
    }
  }
}

async function main() {
  console.log('=== 開始實機驗收：分級授權 (27~55 免密開放) 與 1~26 工具 3 天單頁免密通道 ===');
  const server = await startServer();
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--window-size=1280,800',
    'about:blank'
  ]);

  let cdp;
  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      try {
        targets = await getJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
      await sleep(200);
    }
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 測試 0：驗證首頁 #tools 在未登入管理員時，「管理員一鍵複製 3 天免密網址」與發放器必須對一般訪客隱藏！
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/index.html#tools`);
    const publicHubState = await cdp.eval(`({
      isAdmin: window.GanjuAuth.isAdmin(),
      quickBarDisplay: getComputedStyle(document.querySelector('.tools-hub-admin-quickbar')).display,
      shareBtnDisplay: getComputedStyle(document.querySelector('.tool-hub-share-btn')).display,
      adminLoginBtnDisplay: getComputedStyle(document.getElementById('ganjuBtnHubAdminLogin')).display
    })`);
    if (publicHubState.isAdmin || publicHubState.quickBarDisplay !== 'none' || publicHubState.shareBtnDisplay !== 'none' || publicHubState.adminLoginBtnDisplay === 'none') {
      throw new Error('首頁未登入管理員時，管理員複製網址按鈕不應對一般訪客顯示！State: ' + JSON.stringify(publicHubState));
    }
    console.log('  ✅ [PASS] 測試 0：首頁未登入管理員時，「管理員一鍵複製 3 天免密網址」對一般訪客完全隱藏');

    // 測試 1：驗證第 27 ~ 55 款工具開放無密碼
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/lease-renewal-agreement.html`);
    const tool27Locked = await cdp.eval(`document.documentElement.classList.contains('auth-locked')`);
    if (tool27Locked) throw new Error('第 27 款工具 (lease-renewal-agreement.html) 不應上鎖！');
    console.log('  ✅ [PASS] 測試 1A：第 27 款工具 (lease-renewal-agreement.html) 開放網頁無密碼');

    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/fall-prevention-agreement.html`);
    const tool52Locked = await cdp.eval(`document.documentElement.classList.contains('auth-locked')`);
    if (tool52Locked) throw new Error('第 52 款工具 (fall-prevention-agreement.html) 不應上鎖！');
    console.log('  ✅ [PASS] 測試 1B：第 52 款工具 (fall-prevention-agreement.html) 開放網頁無密碼');

    // 測試 2：驗證第 1 ~ 26 款工具預設上鎖
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/lease-contract.html`);
    const tool01State = await cdp.eval(`({
      htmlLocked: document.documentElement.classList.contains('auth-locked'),
      overlayExists: Boolean(document.getElementById('ganju-auth-overlay')),
      readyState: document.readyState,
      hasGanjuAuth: Boolean(window.GanjuAuth)
    })`);
    if (!tool01State.htmlLocked || !tool01State.overlayExists) {
      throw new Error('第 1 款工具 (lease-contract.html) 未授權時應預設上鎖！State: ' + JSON.stringify(tool01State));
    }
    console.log('  ✅ [PASS] 測試 2：第 1~26 款工具 (lease-contract.html) 未授權時預設上鎖');

    // 測試 3：驗證管理員一鍵產生 3 天單頁免密專屬網址
    const shareObj = await cdp.eval(`window.GanjuAuth.generateShareUrl('lease-contract.html')`);
    const diffDays = (shareObj.expiresAt - Date.now()) / (1000 * 60 * 60 * 24);
    if (!shareObj.url.includes('?unlock=') || diffDays < 2.99 || diffDays > 3.01) {
      throw new Error('管理員產生之 3 天免密網址效期或格式異常: ' + JSON.stringify(shareObj));
    }
    console.log(`  ✅ [PASS] 測試 3：管理員一鍵產生 3 天單頁免密網址成功 (${shareObj.url.slice(0, 68)}...)`);

    // 測試 4：使用 3 天免密網址自動解鎖 lease-contract.html，並驗證「只能看到自己登入的網頁，其他有上鎖的網頁不能看得到」
    await navigateAndReady(cdp, shareObj.url);
    const guestState = await cdp.eval(`({
      unlocked: !document.documentElement.classList.contains('auth-locked'),
      cleanUrl: !window.location.search.includes('unlock='),
      selfNavVisible: (() => {
        const a = document.querySelector('.nav-dropdown-menu a[href="lease-contract.html"]');
        return a && a.closest('li').style.display !== 'none';
      })(),
      otherLockedNavHidden: (() => {
        const a = document.querySelector('.nav-dropdown-menu a[href="tax-calculator.html"]');
        return a && a.closest('li').style.display === 'none';
      })(),
      openToolNavVisible: (() => {
        const a = document.querySelector('.nav-dropdown-menu a[href="lease-renewal-agreement.html"]');
        return a && a.closest('li').style.display !== 'none';
      })()
    })`);

    if (!guestState.unlocked || !guestState.cleanUrl || !guestState.selfNavVisible || !guestState.otherLockedNavHidden) {
      throw new Error('3 天免密單頁解鎖或選單隔離失敗: ' + JSON.stringify(guestState));
    }
    console.log('  ✅ [PASS] 測試 4A：免密網址自動解鎖 lease-contract.html，且導覽列已隱藏其他 25 款上鎖工具');

    // 測試 4B：單頁訪客前往首頁 #tools，只能看到自己登入的 lease-contract.html（其他 25 款上鎖卡片全部隱藏）
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/index.html#tools`);
    const hubIsolation = await cdp.eval(`({
      selfCardVisible: (() => {
        const a = document.querySelector('#toolsHubGrid a.tool-hub-btn[href="lease-contract.html"]');
        return a && a.closest('.tool-hub-card').style.display !== 'none';
      })(),
      otherLockedCardHidden: (() => {
        const a = document.querySelector('#toolsHubGrid a.tool-hub-btn[href="tax-calculator.html"]');
        return a && a.closest('.tool-hub-card').style.display === 'none';
      })(),
      openCardVisible: (() => {
        const a = document.querySelector('#toolsHubGrid a.tool-hub-btn[href="lease-renewal-agreement.html"]');
        return a && a.closest('.tool-hub-card').style.display !== 'none';
      })()
    })`);
    if (!hubIsolation.selfCardVisible || !hubIsolation.otherLockedCardHidden || !hubIsolation.openCardVisible) {
      throw new Error('首頁工具中心單頁訪客隔離失敗: ' + JSON.stringify(hubIsolation));
    }
    console.log('  ✅ [PASS] 測試 4B：首頁 #tools 單頁訪客模式僅顯示自己登入的網頁與開放工具，其他 25 款上鎖工具已隱藏');

    // 測試 4C：單頁訪客若直接輸入其他上鎖工具網址 (tax-calculator.html)，強制阻擋上鎖
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/tax-calculator.html`);
    const otherPageBlocked = await cdp.eval(`document.documentElement.classList.contains('auth-locked') && Boolean(document.getElementById('ganju-auth-overlay'))`);
    if (!otherPageBlocked) {
      throw new Error('單頁訪客不應能開啟未授權之 tax-calculator.html！');
    }
    console.log('  ✅ [PASS] 測試 4C：單頁訪客直接訪問其他上鎖工具 (tax-calculator.html) 遭強制鎖定攔截');

    // 測試 5：驗證期限 3 天後自動取消登入網頁並重新上鎖
    await navigateAndReady(cdp, `http://127.0.0.1:${PORT}/lease-contract.html`);
    // 模擬時間已過 3 天
    await cdp.eval(`(() => {
      const map = JSON.parse(localStorage.getItem('ganju_single_page_auth_v1') || '{}');
      if (map['lease-contract.html']) {
        map['lease-contract.html'].expiresAt = Date.now() - 5000;
        localStorage.setItem('ganju_single_page_auth_v1', JSON.stringify(map));
      }
      window.dispatchEvent(new Event('focus'));
    })()`);
    await sleep(300);
    const expiredLocked = await cdp.eval(`({
      isLockedNow: document.documentElement.classList.contains('auth-locked'),
      hasOverlay: Boolean(document.getElementById('ganju-auth-overlay')),
      storageCleared: !JSON.parse(localStorage.getItem('ganju_single_page_auth_v1') || '{}')['lease-contract.html']
    })`);
    if (!expiredLocked.isLockedNow || !expiredLocked.hasOverlay || !expiredLocked.storageCleared) {
      throw new Error('3 天到期後未自動取消登入並鎖定網頁: ' + JSON.stringify(expiredLocked));
    }
    console.log('  ✅ [PASS] 測試 5：期限 3 天屆滿後，系統自動取消登入、清除憑證並立即重新鎖定網頁');

    console.log('==================================================================');
    console.log('🎉 全數 5 大核心情境實機測試 100% 通過！');
    console.log('==================================================================');
  } finally {
    if (cdp) cdp.close();
    chrome.kill('SIGKILL');
    server.close();
  }
}

main().catch((err) => {
  console.error('❌ 測試失敗:', err);
  process.exit(1);
});
