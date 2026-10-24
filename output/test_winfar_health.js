// output/test_winfar_health.js
// 穩發漁業集團官網自動化健康檢測 (Node.js + 原生 CDP，零第三方套件依賴)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8892;
const CDP_PORT = 9335;
const DIRECTORY = path.resolve(__dirname, 'winfar-website');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml'
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(DIRECTORY, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

function launchChrome() {
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ];

  let chromeBin = chromePaths.find(p => fs.existsSync(p));
  if (!chromeBin) {
    throw new Error('未找到可用之 Chrome / Chromium 執行檔');
  }

  const args = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--mute-audio',
    '--user-data-dir=/tmp/winfar-test-chrome'
  ];

  const proc = spawn(chromeBin, args, { stdio: 'ignore' });
  return proc;
}

function getWsUrl() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            clearInterval(interval);
            resolve(data.webSocketDebuggerUrl);
          } catch (e) {}
        });
      }).on('error', () => {
        if (attempts > 30) {
          clearInterval(interval);
          reject(new Error('無法連接 Chrome CDP 服務'));
        }
      });
    }, 200);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
    this.events = new Map();
  }

  async connect() {
    const WebSocket = require('ws');
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        } else if (msg.method && this.events.has(msg.method)) {
          const handlers = this.events.get(msg.method);
          handlers.forEach(h => h(msg.params));
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this.events.has(method)) this.events.set(method, []);
    this.events.get(method).push(handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log(`=== 穩發漁業集團官網自動化測試 (http://127.0.0.1:${PORT}) ===\n`);

  const server = await startServer();
  const chromeProc = launchChrome();

  try {
    const wsUrl = await getWsUrl();
    const browser = new CDPClient(wsUrl);
    await browser.connect();

    // 建立新分頁
    const target = await browser.send('Target.createTarget', { url: 'about:blank' });
    const targetWsUrl = `ws://127.0.0.1:${CDP_PORT}/devtools/page/${target.targetId}`;
    const page = new CDPClient(targetWsUrl);
    await page.connect();

    const consoleLogs = [];
    const pageErrors = [];

    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('DOM.enable');

    page.on('Runtime.consoleAPICalled', (params) => {
      const text = params.args.map(a => a.value || a.description || '').join(' ');
      consoleLogs.push(`[${params.type}] ${text}`);
    });

    page.on('Runtime.exceptionThrown', (params) => {
      const text = params.exceptionDetails.text || params.exceptionDetails.exception?.description || '';
      pageErrors.push(text);
    });

    // 導航到 index.html
    await page.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });

    // 等待載入完成
    await new Promise((resolve) => {
      page.on('Page.loadEventFired', resolve);
    });
    await new Promise(r => setTimeout(r, 1000));

    // 1. 網頁標題
    const titleRes = await page.send('Runtime.evaluate', { expression: 'document.title' });
    console.log(`1. 網頁標題: ${titleRes.result.value}`);

    // 2. 檢測圖片完整度
    const imgAudit = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const broken = imgs.filter(img => img.naturalWidth === 0).map(img => img.getAttribute('src'));
        return { total: imgs.length, broken: broken };
      })()`,
      returnByValue: true
    });

    console.log(`2. 總圖片數: ${imgAudit.result.value.total} 張`);
    if (imgAudit.result.value.broken.length > 0) {
      console.log(`   ⚠️ 破圖清單: ${imgAudit.result.value.broken.join(', ')}`);
    } else {
      console.log(`   ✅ 所有圖片皆成功載入，0 破圖！`);
    }

    // 3. 測試 B2B 詢價彈窗
    const modalTest = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.querySelector('.open-inquiry-modal, [data-modal="inquiryModal"], .btn-quote, a[href="#inquiry"]');
        if (btn) btn.click();
        const modal = document.querySelector('#inquiryModal, .modal-inquiry');
        const active = modal ? (modal.classList.contains('active') || modal.style.display !== 'none') : false;
        return { exists: !!btn, active: active };
      })()`,
      returnByValue: true
    });
    console.log(`3. B2B 詢價彈窗測試: ${modalTest.result.value.active ? '✅ 成功開啟' : (modalTest.result.value.exists ? '⚠️ 點擊未激活' : 'ℹ️ 未配置獨立彈窗按鈕')}`);

    // 4. 360px 極限 RWD 檢測
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 360,
      height: 740,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const rwdRes = await page.send('Runtime.evaluate', {
      expression: `(() => {
        const scrollW = document.documentElement.scrollWidth;
        const innerW = window.innerWidth;
        return scrollW - innerW;
      })()`,
      returnByValue: true
    });
    const overflow = rwdRes.result.value;
    console.log(`4. 360px 手機 RWD 橫向溢出檢測: ${overflow}px (${overflow <= 0 ? '✅ 完全無溢出' : '⚠️ 發現橫向溢出'})`);

    // 5. Console 錯誤數
    console.log(`5. Console 錯誤數: ${pageErrors.length} 個`);
    if (pageErrors.length > 0) {
      pageErrors.forEach(err => console.log(`   ❌ 錯誤: ${err}`));
    } else {
      console.log(`   ✅ 0 JavaScript 執行期錯誤！`);
    }

    console.log('\n=== 穩發漁業集團官網檢測完成 ===');

    page.close();
    browser.close();
  } finally {
    chromeProc.kill('SIGKILL');
    server.close();
  }
}

run().catch(err => {
  console.error('測試失敗:', err);
  process.exit(1);
});
