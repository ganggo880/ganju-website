const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8891;
const CDP_PORT = 9445;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  const chrome = spawn('google-chrome', [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listResp = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?http://127.0.0.1:${PORT}/index.html`, { method: 'PUT' });
    const target = await listResp.json();
    const WebSocket = require('ws');
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const send = (method, params = {}) => new Promise((resolve) => {
      const msgId = id++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === msgId) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.on('open', r));
    await send('Page.enable');
    await send('Runtime.enable');
    await new Promise(r => setTimeout(r, 1000));

    // 1. Check window.GanjuTracker and window.dataLayer
    const check1 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            hasTracker: typeof window.GanjuTracker === 'object',
            trackerVersion: window.GanjuTracker?.version,
            hasDataLayer: Array.isArray(window.dataLayer),
            dataLayerLen: window.dataLayer.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Tracker Check 1:', check1.result.value);

    // 2. Trigger programmatic track
    await send('Runtime.evaluate', {
      expression: `
        window.GanjuTracker.track('test_custom_event', { foo: 'bar', num: 123 });
      `
    });

    // 3. Click floating line button and test auto delegation
    await send('Runtime.evaluate', {
      expression: `
        const lineBtn = document.querySelector('.float-btn-line');
        if (lineBtn) lineBtn.click();
      `
    });

    const check2 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            events: window.dataLayer.map(e => e.event)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DataLayer Events:', check2.result.value);

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
