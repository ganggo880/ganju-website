const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8893;
const CDP_PORT = 9448;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACT_DIR = '/home/ken-ubuntu/.gemini/antigravity/brain/dab8f5a7-cdc1-411f-aeae-54c0c61b65da';

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
    await send('DOM.enable');

    // 1. FAQ Section screenshot
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 500));
    await send('Runtime.evaluate', { expression: 'document.getElementById("faq").scrollIntoView();' });
    await new Promise(r => setTimeout(r, 600));

    const faqPic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'index_faq_section.png'), Buffer.from(faqPic.data, 'base64'));
    console.log('Saved index_faq_section.png');

    // 2. Open Success Modal and screenshot
    await send('Runtime.evaluate', { expression: `
      document.getElementById("successModalName").textContent = "陳建宏 先生";
      document.getElementById("successModalPhone").textContent = "0912-345-678";
      document.getElementById("successModalRegion").textContent = "小港區";
      document.getElementById("successModalPlan").textContent = "租賃住宅全包租";
      document.getElementById("bookingSuccessModal").classList.add("active");
    ` });
    await new Promise(r => setTimeout(r, 500));

    const modalPic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'index_lead_success_modal.png'), Buffer.from(modalPic.data, 'base64'));
    console.log('Saved index_lead_success_modal.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
    server.close();
  }
});
