// output/audit_mobile_rwd.js
// 港居不動產 全站 10 款線上工具 360px~414px 行動端極限驗收與觸控熱區自動化稽核引擎
// 使用 Node.js 內建 http + WebSocket + Chrome DevTools Protocol (CDP)，零第三方依賴

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8899;
const CDP_PORT = 9333;
const ROOT_DIR = path.resolve(__dirname, '..');

const PAGES = [
  'index.html',
  'rent-calculator.html',
  'file-converter.html',
  'photo-watermark.html',
  'id-card-watermark.html',
  'image-converter.html',
  'card-merger.html',
  'photo-time-location.html',
  'ocr-translator.html',
  'space-planner.html',
  'lease-contract.html',
  'tax-calculator.html',
  'repair-inspection.html',
  'utility-splitter.html',
  'deposit-settlement.html',
  'rent-subsidy-checker.html',
  'rent-receipt.html',
  'listing-post-generator.html',
  'legal-notice-generator.html',
  'property-roi-calculator.html',
  'viewing-checklist.html',
  'depreciation-calculator.html',
  'lease-termination-agreement.html',
  'lease-renewal-agreement.html',
  'tenant-screening-checker.html',
  'mandate-contract.html',
  'guarantor-agreement.html',
  'repair-work-order.html',
  'holding-deposit-receipt.html',
  'privacy.html'
];

const VIEWPORTS = [
  { name: '360px (Galaxy S8/極限緊湊)', width: 360, height: 640 },
  { name: '375px (iPhone SE/迷你螢幕)', width: 375, height: 667 },
  { name: '390px (iPhone 13/14/標準)', width: 390, height: 844 },
  { name: '414px (iPhone Plus/大螢幕)', width: 414, height: 896 }
];

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

// 1. 本地靜態 HTTP 伺服器
function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[HTTP] 本地測試伺服器已啟動: http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

// 2. 啟動 Headless Chrome
function startChrome() {
  const profileDir = `/tmp/chrome_audit_${Date.now()}`;
  const chrome = spawn('google-chrome', [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--hide-scrollbars'
  ]);

  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        const data = await res.json();
        if (data.webSocketDebuggerUrl) {
          console.log(`[Chrome] Headless Chrome CDP 就緒: ${data.webSocketDebuggerUrl}`);
          resolve({ chrome, profileDir });
          return;
        }
      } catch (_) {}
    }
    chrome.kill();
    reject(new Error('啟動 Headless Chrome 逾時'));
  });
}

// 3. CDP Client 封裝
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.events = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        try {
          const res = JSON.parse(msg.data);
          if (res.id && this.pending.has(res.id)) {
            const { resolve, reject } = this.pending.get(res.id);
            this.pending.delete(res.id);
            if (res.error) reject(res.error);
            else resolve(res.result);
          } else if (res.method && this.events.has(res.method)) {
            this.events.get(res.method)(res.params);
          }
        } catch (e) {
          console.error('CDP 訊息解析錯誤', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    this.events.set(event, handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

// 4. 建立新頁面並接管
async function createPageSession() {
  const newTabRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new`, { method: 'PUT' });
  const tab = await newTabRes.json();
  const client = new CDPClient(tab.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');
  await client.send('CSS.enable');

  return { client, tabId: tab.id };
}

// 5. 評估頁面在特定 Viewport 的表現
async function auditPageAtViewport(client, pageUrl, vp) {
  // 1. 設定螢幕模擬尺寸 (模擬真實手機)
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 2,
    mobile: true
  });
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5
  });

  // 2. 收集 Console 錯誤
  const consoleErrors = [];
  client.on('Runtime.exceptionThrown', (params) => {
    consoleErrors.push(params.exceptionDetails?.text || 'Uncaught exception');
  });

  // 3. 載入目標網址
  await client.send('Page.navigate', { url: pageUrl });

  // 等待載入完成
  await new Promise((resolve) => {
    let timer = setTimeout(resolve, 3000);
    client.on('Page.loadEventFired', () => {
      clearTimeout(timer);
      setTimeout(resolve, 800); // 額外等待 800ms 讓動態腳本與字型渲染完成
    });
  });

  // 4. 在瀏覽器端執行深度檢測
  const evalRes = await client.send('Runtime.evaluate', {
    expression: `
      (() => {
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const docEl = document.documentElement;
        const body = document.body;

        // A. 橫向滾動溢出檢測
        const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
        const hasOverflow = scrollW > vpW + 0.5;
        const overflowPx = Math.max(0, scrollW - vpW);

        // 逐一掃描是哪些元素凸出去
        const overflowingElements = [];
        const allNodes = document.querySelectorAll('*');
        allNodes.forEach((el) => {
          // 忽略隱藏元素
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > vpW + 0.5) {
            // 抓出 class 或 tag
            const tag = el.tagName.toLowerCase();
            const id = el.id ? '#' + el.id : '';
            const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
            const selector = tag + id + cls;
            overflowingElements.push({
              selector,
              width: Math.round(r.width),
              right: Math.round(r.right),
              excess: Math.round(r.right - vpW)
            });
          }
        });

        // 僅取前 5 個最嚴重的溢出節點
        overflowingElements.sort((a, b) => b.excess - a.excess);
        const topOverflows = overflowingElements.slice(0, 5);

        // B. 觸控熱區檢測 (Interactive Elements >= 44x44px)
        const interactiveSelector = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [tabindex="0"], label.snap-check-label, .btn, .nav-link, .tool-action-btn, .mobile-toggle';
        const interactiveElements = document.querySelectorAll(interactiveSelector);
        const smallTouchTargets = [];

        interactiveElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
          if (el.closest('[hidden]')) return;

          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;

          // 若在一般文章段落內的行內純文字連結，且父元素不是按鈕，略過
          if (el.tagName.toLowerCase() === 'a' && el.parentElement && el.parentElement.tagName.toLowerCase() === 'p' && style.display === 'inline') {
            return;
          }

          // WCAG 2.2 SC 2.5.8: 若為 checkbox / radio，檢查其父 label 或關聯 label[for="..."] 之實際觸控有效區域
          if (el.tagName.toLowerCase() === 'input' && (el.type === 'checkbox' || el.type === 'radio')) {
            const parentLabel = el.closest('label');
            const forLabel = el.id ? document.querySelector('label[for="' + CSS.escape(el.id) + '"]') : null;
            const assocLabel = parentLabel || forLabel;
            if (assocLabel) {
              const lr = assocLabel.getBoundingClientRect();
              if (lr.width >= 43.5 && lr.height >= 43.5) {
                return; // 關聯 label 符合觸控熱區規範
              }
            }
          }

          // 允許 43.5px 容錯 (次像素縮放)
          if (r.width < 43.5 || r.height < 43.5) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? '#' + el.id : '';
            const cls = el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
            const text = (el.textContent || el.value || el.title || el.getAttribute('aria-label') || '').trim().slice(0, 24);
            smallTouchTargets.push({
              selector: tag + id + cls,
              width: Math.round(r.width),
              height: Math.round(r.height),
              text: text || '(無文字標籤)'
            });
          }
        });

        // 去重 (相同選擇器只取一次)
        const uniqueSmallTargets = [];
        const seen = new Set();
        smallTouchTargets.forEach(t => {
          const key = t.selector + '_' + t.width + 'x' + t.height;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueSmallTargets.push(t);
          }
        });

        return {
          viewport: { w: vpW, h: vpH },
          scrollWidth: scrollW,
          hasOverflow,
          overflowPx,
          topOverflows,
          totalInteractive: interactiveElements.length,
          smallTouchCount: uniqueSmallTargets.length,
          smallTouchTargets: uniqueSmallTargets.slice(0, 8)
        };
      })()
    `,
    returnByValue: true
  });

  return {
    viewport: vp,
    result: evalRes.result?.value || {},
    errors: consoleErrors
  };
}

// 主執行流程
async function runFullMobileAudit() {
  console.log('================================================================');
  console.log('📱 港居不動產 全站 10 款頁面 行動端 (360px~414px) 實機極限驗收');
  console.log('   嚴格檢驗標準：橫向滾動溢出嚴格為 0px ｜ 觸控熱區 ≥ 44×44px');
  console.log('================================================================\n');

  const server = await startStaticServer();
  const { chrome } = await startChrome();
  const { client, tabId } = await createPageSession();

  const auditReport = [];

  try {
    for (const page of PAGES) {
      const pageUrl = `http://127.0.0.1:${PORT}/${page}`;
      console.log(`🔍 正在深度檢測頁面: [${page}] ...`);

      const pageResults = [];
      for (const vp of VIEWPORTS) {
        const audit = await auditPageAtViewport(client, pageUrl, vp);
        pageResults.push(audit);
      }

      auditReport.push({
        page,
        viewports: pageResults
      });
    }
  } finally {
    client.close();
    chrome.kill();
    server.close();
  }

  // 整理報表並輸出
  generateAuditMarkdownReport(auditReport);
}

function generateAuditMarkdownReport(auditReport) {
  let md = `# 📱 港居不動產 全站 10 款頁面 行動端極限驗收與觸控優化報告\n\n`;
  md += `> **檢驗日期**：2026-10-23\n`;
  md += `> **檢驗規格**：Google Chrome Headless (CDP 協議 ＋ 真實 Touch 事件模擬)\n`;
  md += `> **測試斷點**：360px (Galaxy S8)、375px (iPhone SE)、390px (iPhone 14)、414px (iPhone Plus)\n`;
  md += `> **品質門檻**：\n`;
  md += `> 1. **橫向溢出 (Horizontal Overflow)**：嚴格為 **0 px** (禁止出現任何橫向滾動條)\n`;
  md += `> 2. **觸控熱區 (Touch Target Size)**：按鈕/表單/連結皆需 **≥ 44×44 px** (WCAG 2.1 AA 標準)\n\n`;
  md += `---\n\n`;
  md += `## 📊 全站 10 頁驗收總表\n\n`;
  md += `| # | 頁面名稱 | 360px 溢出 | 375px 溢出 | 390px 溢出 | 414px 溢出 | <44px 觸控項目 | 狀態 |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  let totalPages = auditReport.length;
  let passCount = 0;
  const issuesToFix = [];

  auditReport.forEach((item, idx) => {
    const p = item.page;
    const v360 = item.viewports.find(v => v.viewport.width === 360)?.result || {};
    const v375 = item.viewports.find(v => v.viewport.width === 375)?.result || {};
    const v390 = item.viewports.find(v => v.viewport.width === 390)?.result || {};
    const v414 = item.viewports.find(v => v.viewport.width === 414)?.result || {};

    const hasAnyOverflow = v360.hasOverflow || v375.hasOverflow || v390.hasOverflow || v414.hasOverflow;
    const smallTargets = v360.smallTouchTargets || [];

    const statusPass = !hasAnyOverflow && smallTargets.length === 0;
    if (statusPass) passCount++;

    const statusBadge = statusPass ? '✅ 完美合格' : '⚠️ 待微調';

    md += `| ${idx + 1} | \`${p}\` | ${v360.overflowPx ? `❌ +${v360.overflowPx}px` : '✅ 0px'} | ${v375.overflowPx ? `❌ +${v375.overflowPx}px` : '✅ 0px'} | ${v390.overflowPx ? `❌ +${v390.overflowPx}px` : '✅ 0px'} | ${v414.overflowPx ? `❌ +${v414.overflowPx}px` : '✅ 0px'} | ${smallTargets.length > 0 ? `⚠️ ${smallTargets.length}項` : '✅ 0項'} | ${statusBadge} |\n`;

    if (!statusPass) {
      issuesToFix.push({
        page: p,
        v360,
        smallTargets
      });
    }
  });

  md += `\n**驗收合格率**：${passCount} / ${totalPages} 頁 (${Math.round((passCount / totalPages) * 100)}%)\n\n`;

  if (issuesToFix.length > 0) {
    md += `## 🛠️ 待優化細項清單 (依頁面)\n\n`;
    issuesToFix.forEach((issue) => {
      md += `### 📄 \`${issue.page}\`\n\n`;
      if (issue.v360.hasOverflow) {
        md += `#### 1. 360px 橫向溢出 (+${issue.v360.overflowPx}px)\n`;
        md += `溢出元素清單：\n`;
        (issue.v360.topOverflows || []).forEach(o => {
          md += `- 選擇器: \`${o.selector}\` ｜ 寬度: ${o.width}px ｜ 凸出量: +${o.excess}px\n`;
        });
        md += `\n`;
      }

      if (issue.smallTargets.length > 0) {
        md += `#### 2. 觸控熱區小於 44×44px 項目 (${issue.smallTargets.length} 個)\n`;
        md += `| 選擇器 | 實測尺寸 | 標籤文字 |\n`;
        md += `|---|---|---|\n`;
        issue.smallTargets.forEach(t => {
          md += `| \`${t.selector}\` | ${t.width} × ${t.height} px | ${t.text} |\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });
  } else {
    md += `🎉 **全站 10 大頁面在 360px、375px、390px、414px 下完全零橫向滾動溢出，所有可點擊元件均嚴格符合 ≥ 44×44px 觸控標準！**\n\n`;
  }

  const outPath = path.join(ROOT_DIR, 'output', '全站10頁行動端極限驗收與觸控優化報告.md');
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`\n📄 驗收報告已儲存至: output/全站10頁行動端極限驗收與觸控優化報告.md`);
  console.log(md);
}

runFullMobileAudit().catch(err => {
  console.error('稽核執行失敗:', err);
  process.exit(1);
});
