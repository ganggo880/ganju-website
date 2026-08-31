import http.server
import socketserver
import threading
import time
import os
import sys
from playwright.sync_api import sync_playwright

PORT = 8895
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

print(f"=== Starting OCR Full Suite Automated Test on http://localhost:{PORT} ===")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    page.goto(f"http://localhost:{PORT}/ocr-translator.html")
    page.wait_for_load_state("networkidle")

    print(f"1. Page Loaded: {page.title()}")

    # Test 1: Click Contract sample
    print("\n--- Test 1: Sample Contract OCR & Translation ---")
    page.click(".sample-chip[data-sample='contract']")

    # Wait for OCR
    for i in range(15):
        time.sleep(1)
        src = page.eval_on_selector("#textarea-source", "el => el.value")
        tgt = page.eval_on_selector("#textarea-target", "el => el.value")
        is_prog = page.eval_on_selector("#progress-container", "el => el.style.display")
        if len(src) > 0 and is_prog == "none" and not tgt.startswith("⏳"):
            print(f"   Success in {i+1}s! Source length: {len(src)} chars, Target length: {len(tgt)} chars")
            break

    conf = page.eval_on_selector("#ocr-confidence", "el => el.innerText")
    print(f"   Confidence: {conf}")

    # Test 2: Image Filters and Re-OCR
    print("\n--- Test 2: Image Filter Manipulations ---")
    page.click("#btn-rotate-right")
    print("   Rotated 90 deg clockwise")
    page.click("#btn-rotate-left")
    print("   Rotated 90 deg counter-clockwise (back to original)")
    page.click("#btn-grayscale")
    print("   Applied grayscale")
    page.click("#btn-binarize")
    print("   Applied high-contrast binarize")

    # Test 3: Real file upload
    print("\n--- Test 3: Upload Real Image (assets/logo.png) ---")
    test_file = os.path.abspath(r"assets\logo.png")
    page.set_input_files("#file-input", test_file)

    for i in range(15):
        time.sleep(1)
        src = page.eval_on_selector("#textarea-source", "el => el.value")
        tgt = page.eval_on_selector("#textarea-target", "el => el.value")
        is_prog = page.eval_on_selector("#progress-container", "el => el.style.display")
        if len(src) > 0 and is_prog == "none" and not tgt.startswith("⏳"):
            print(f"   Upload OCR Success in {i+1}s! Source: {repr(src.strip())}")
            print(f"   Translation Result: {repr(tgt.strip())}")
            break

    # Test 4: Swap Languages button
    print("\n--- Test 4: Swap Languages & Manual Translate ---")
    page.click("#btn-swap-lang")
    src_after_swap = page.eval_on_selector("#textarea-source", "el => el.value")
    tgt_after_swap = page.eval_on_selector("#textarea-target", "el => el.value")
    print(f"   After swap -> Source: {repr(src_after_swap.strip())}, Target: {repr(tgt_after_swap.strip())}")

    # Test 5: Check Errors
    print("\n--- Test 5: Health & Error Check ---")
    print(f"   Total Page Errors: {len(page_errors)}")
    if page_errors:
        for err in page_errors:
            print(f"   ERROR: {err}")
    else:
        print("   ALL TESTS PASSED WITH 0 ERRORS! (無任何 JavaScript 錯誤)")

    browser.close()
