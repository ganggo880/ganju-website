import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

PORT = 8892
DIRECTORY = r"g:\我的雲端硬碟\ai agent\Matt Pocock skills\output\winfar-website"

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

print(f"=== 穩發漁業集團官網自動化測試 (http://localhost:{PORT}) ===")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    page.goto(f"http://localhost:{PORT}/index.html")
    page.wait_for_load_state("networkidle")

    print(f"1. 網頁標題: {page.title()}")

    # Test broken images
    images = page.query_selector_all("img")
    print(f"2. 總圖片數: {len(images)} 張")
    broken_images = []
    for img in images:
        src = img.get_attribute("src")
        natural_width = img.evaluate("el => el.naturalWidth")
        if natural_width == 0:
            broken_images.append(src)

    if broken_images:
        print(f"   ⚠️ 破圖清單: {broken_images}")
    else:
        print("   ✅ 所有圖片皆成功載入，0 破圖！")

    # Test modals
    inquiry_btn = page.query_selector(".open-inquiry-modal")
    if inquiry_btn:
        inquiry_btn.click()
        time.sleep(0.5)
        modal_visible = page.eval_on_selector("#inquiryModal", "el => el.classList.contains('active') || el.style.display !== 'none'")
        print(f"3. B2B 詢價彈窗測試: {'成功開啟' if modal_visible else '未顯示'}")
        close_btn = page.query_selector("#inquiryModal .close-modal, #inquiryModal .modal-close")
        if close_btn:
            close_btn.click()

    # RWD check at 360px
    page.set_viewport_size({"width": 360, "height": 740})
    time.sleep(0.5)
    scroll_w = page.evaluate("() => document.documentElement.scrollWidth")
    inner_w = page.evaluate("() => window.innerWidth")
    overflow = scroll_w - inner_w
    print(f"4. 360px 手機 RWD 橫向溢出檢測: {overflow}px ({'✅ 完全無溢出' if overflow <= 0 else '⚠️ 發現橫向溢出'})")

    print(f"5. Console 錯誤數: {len(page_errors)} 個")
    if page_errors:
        for err in page_errors:
            print(f"   ❌ 錯誤: {err}")
    else:
        print("   ✅ 0 JavaScript 錯誤！")

    browser.close()
