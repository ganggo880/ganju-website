// sw.js - 港居不動產 PWA 離線 Service Worker
// 提供全站 12 款不動產線上工具與 3D 智慧島 100% 離線運作與極速快取體驗

const CACHE_NAME = 'ganju-pwa-v1.4';

// 核心離線資源清單 (全站 14 頁、Sitemap、CSS、JS、Icon)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './rent-calculator.html',
  './file-converter.html',
  './photo-watermark.html',
  './id-card-watermark.html',
  './image-converter.html',
  './card-merger.html',
  './photo-time-location.html',
  './ocr-translator.html',
  './space-planner.html',
  './island.html',
  './lease-contract.html',
  './tax-calculator.html',
  './repair-inspection.html',
  './manifest.json',
  './sitemap.xml',
  './robots.txt',
  
  // 樣式表
  './styles.css',
  './rent-calc.css',
  './watermark.css',
  './css/tokens.css',
  './css/components.css',
  './css/space-planner.css',
  './css/lease-contract.css',
  './css/tax-calculator.css',
  './css/repair-inspection.css',
  './css/ocr-translator.css',
  './css/converter.css',
  './css/card-merger.css',
  './css/image-converter.css',
  './css/photo-time-location.css',
  './css/id-card-watermark.css',
  
  // 腳本庫
  './script.js',
  './rent-calc.js',
  './js/utils.js',
  './js/navigation.js',
  './js/layout.js',
  './js/pwa.js',
  './js/space-planner.js',
  './js/lease-contract.js',
  './js/tax-calculator.js',
  './js/repair-inspection.js',
  './js/ocr-translator.js',
  './js/converter.js',
  './js/image-converter.js',
  './js/card-merger.js',
  './js/photo-time-location.js',
  './js/exif-parser.js',
  './js/watermark-engine.js',
  './js/watermark-app.js',
  './js/id-card-watermark.js',
  
  // 圖示與品牌
  './assets/logo.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon-32.png'
];

// 1. 安裝事件：預先快取全站核心靜態檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 cache.addAll 進行預載，個別檔案若失敗進行容錯捕捉
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[PWA SW] Precache 略過非關鍵資源: ${url}`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. 啟動事件：清除舊版快取並立即接管控制權
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[PWA SW] 清除舊版本快取: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 擷取事件：智慧快取策略
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 僅處理 GET 請求，忽略其他非 HTTP 協議
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // A. 頁面導航（HTML 文件）：Network First，若離線則 Fallback 至 Cache
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(req);
          if (cachedResponse) return cachedResponse;
          // 若特定頁面未快取，回傳已快取的首頁
          return caches.match('./index.html') || caches.match('./');
        })
    );
    return;
  }

  // B. 靜態資源（CSS、JS、字型、圖片、第三方 CDN 庫）：Cache First，背景動態擴充快取
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // 背景觸發更新以保證最新 (Stale-While-Revalidate)
        fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // 未快取則從網路取得並動態存入快取（包含 cdnjs、Three.js、FontAwesome）
      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // 網路失敗且無快取時的靜態防護
          return new Response('Offline resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});
