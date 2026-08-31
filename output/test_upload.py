import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8898
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

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    page.goto(f"http://localhost:{PORT}/ocr-translator.html")
    page.wait_for_load_state("networkidle")

    test_file = os.path.abspath(r"assets\logo.png")
    print(f"Uploading file: {test_file}")

    # Set file input directly
    page.set_input_files("#file-input", test_file)

    # Wait for OCR processing
    print("Waiting for OCR processing after file upload...")
    for i in range(15):
        time.sleep(1)
        source_val = page.eval_on_selector("#textarea-source", "el => el.value")
        target_val = page.eval_on_selector("#textarea-target", "el => el.value")
        status_text = page.eval_on_selector("#progress-status-text", "el => el.innerText")
        pct_text = page.eval_on_selector("#progress-percent-text", "el => el.innerText")
        is_progress_visible = page.eval_on_selector("#progress-container", "el => el.style.display")
        
        print(f"Sec {i+1}: Progress display={is_progress_visible}, Status='{status_text}', Pct='{pct_text}', SourceLen={len(source_val)}, TargetLen={len(target_val)}")
        if len(source_val) > 0 and is_progress_visible == "none" and not target_val.startswith("⏳"):
            print("OCR & Translation Completed successfully!")
            break

    source_val = page.eval_on_selector("#textarea-source", "el => el.value")
    target_val = page.eval_on_selector("#textarea-target", "el => el.value")
    confidence = page.eval_on_selector("#ocr-confidence", "el => el.innerText")

    print("\n--- Summary ---")
    print(f"Confidence: {confidence}")
    print(f"Source text:\n{source_val}")
    print(f"Target text:\n{target_val}")

    print("\n--- Console Logs ---")
    for log in console_logs:
        print(log)

    print("\n--- Page Errors ---")
    for err in page_errors:
        print(err)

    browser.close()
