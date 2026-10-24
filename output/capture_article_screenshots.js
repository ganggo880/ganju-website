const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8895;
const CDP_PORT = 9450;
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

    // 1. Desktop Blog Section Screenshot
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));

    await send('Runtime.evaluate', { expression: `
      document.getElementById('blog').scrollIntoView();
    ` });
    await new Promise(r => setTimeout(r, 600));

    const blogPic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'index_blog_section.png'), Buffer.from(blogPic.data, 'base64'));
    console.log('Saved index_blog_section.png');

    // 2. Open Article Modal (tax-guide)
    await send('Runtime.evaluate', { expression: `
      document.querySelector('[data-article-id="tax-guide"]').click();
    ` });
    await new Promise(r => setTimeout(r, 600));

    const modalDeskPic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'index_article_modal_desktop.png'), Buffer.from(modalDeskPic.data, 'base64'));
    console.log('Saved index_article_modal_desktop.png');

    // 3. Mobile Article Modal (390px)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const modalMobPic = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'index_article_modal_mobile.png'), Buffer.from(modalMobPic.data, 'base64'));
    console.log('Saved index_article_modal_mobile.png');

    ws.close();
  } catch (err) {
    console.error('Error during article screenshot capture:', err);
  } finally {
    chrome.kill();
    server.close();
    process.exit(0);
  }
});
