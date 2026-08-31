import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8894
DIRECTORY = r"g:\我的雲端硬碟\ai agent\Matt Pocock skills"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(f"http://localhost:{PORT}/ocr-translator.html")
    page.wait_for_load_state("networkidle")

    # Evaluate JS adaptive thresholding function
    res = page.evaluate("""() => {
        // Create test canvas with gradient shadow and text
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // Gradient background (simulating phone shadow)
        const grad = ctx.createLinearGradient(0, 0, 400, 200);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(1, '#666666');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 200);

        // Draw text
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('港居不動產 租賃委託', 30, 100);

        // Test adaptive thresholding
        const imgData = ctx.getImageData(0, 0, 400, 200);
        const d = imgData.data;
        const w = 400;
        const h = 200;

        // Convert to grayscale array
        const gray = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
            gray[i] = Math.round(0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2]);
        }

        // Integral image
        const integral = new Float64Array((w + 1) * (h + 1));
        for (let y = 0; y < h; y++) {
            let sum = 0;
            for (let x = 0; x < w; x++) {
                sum += gray[y * w + x];
                integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + sum;
            }
        }

        // Adaptive Binarize using 25x25 window
        const s = 12; // window radius
        const C = 8;  // delta offset
        let blackCount = 0;
        let whiteCount = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const x1 = Math.max(0, x - s);
                const y1 = Math.max(0, y - s);
                const x2 = Math.min(w, x + s + 1);
                const y2 = Math.min(h, y + s + 1);
                const count = (x2 - x1) * (y2 - y1);
                const sum = integral[y2 * (w + 1) + x2] - integral[y1 * (w + 1) + x2] - integral[y2 * (w + 1) + x1] + integral[y1 * (w + 1) + x1];
                const mean = sum / count;

                const val = gray[y * w + x] < (mean - C) ? 0 : 255;
                if (val === 0) blackCount++;
                else whiteCount++;
            }
        }

        return { w, h, blackCount, whiteCount, success: blackCount > 100 };
    }""")

    print("Adaptive Thresholding Simulation Result:", res)
    browser.close()
