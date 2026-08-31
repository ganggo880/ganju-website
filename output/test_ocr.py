import http.server
import socketserver
import threading
import time
import sys
import os
from playwright.sync_api import sync_playwright

PORT = 8899
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

print(f"Server started on http://localhost:{PORT}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    print("Navigating to ocr-translator.html...")
    page.goto(f"http://localhost:{PORT}/ocr-translator.html")
    page.wait_for_load_state("networkidle")

    print(f"Page title: {page.title()}")

    # Click on sample contract chip
    print("Clicking sample contract chip...")
    page.click(".sample-chip[data-sample='contract']")

    # Wait for OCR progress and result
    print("Waiting for OCR processing (up to 30 seconds)...")
    for i in range(30):
        time.sleep(1)
        source_val = page.eval_on_selector("#textarea-source", "el => el.value")
        target_val = page.eval_on_selector("#textarea-target", "el => el.value")
        status_text = page.eval_on_selector("#progress-status-text", "el => el.innerText")
        pct_text = page.eval_on_selector("#progress-percent-text", "el => el.innerText")
        is_progress_visible = page.eval_on_selector("#progress-container", "el => el.style.display")
        
        print(f"Sec {i+1}: Progress display={is_progress_visible}, Status='{status_text}', Pct='{pct_text}', SourceLen={len(source_val)}, TargetLen={len(target_val)}")
        if len(source_val) > 0 and is_progress_visible == "none":
            print("OCR Completed successfully!")
            break

    print("\n--- Final Results ---")
    source_val = page.eval_on_selector("#textarea-source", "el => el.value")
    target_val = page.eval_on_selector("#textarea-target", "el => el.value")
    print(f"Extracted Text (first 200 chars):\n{source_val[:200]}\n")
    print(f"Translated Text (first 200 chars):\n{target_val[:200]}\n")

    print("--- Console Logs ---")
    for log in console_logs:
        print(log)

    print("--- Page Errors ---")
    for err in page_errors:
        print(err)

    browser.close()
