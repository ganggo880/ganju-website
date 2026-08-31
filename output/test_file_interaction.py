import os
import time
from playwright.sync_api import sync_playwright

file_path = os.path.abspath("ocr-translator.html")
file_url = f"file:///{file_path.replace(os.sep, '/')}"

print(f"Testing direct file URL interactions: {file_url}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    page.goto(file_url)

    # 1. Test clicking dropzone
    print("1. Testing file chooser on dropzone click...")
    with page.expect_file_chooser() as fc_info:
        page.click("#dropzone")
    print("   File chooser successfully opened on dropzone click!")

    # 2. Test sample contract chip
    print("2. Testing Sample Contract OCR...")
    page.click(".sample-chip[data-sample='contract']")

    for i in range(15):
        time.sleep(1)
        src = page.eval_on_selector("#textarea-source", "el => el.value")
        tgt = page.eval_on_selector("#textarea-target", "el => el.value")
        is_prog = page.eval_on_selector("#progress-container", "el => el.style.display")
        if len(src) > 0 and is_prog == "none" and not tgt.startswith("⏳"):
            print(f"   OCR completed in {i+1}s! Extracted {len(src)} chars, Translated {len(tgt)} chars")
            break

    # 3. Test real image file upload
    print("3. Testing real image upload (assets/logo.png)...")
    test_file = os.path.abspath(r"assets\logo.png")
    page.set_input_files("#file-input", test_file)

    for i in range(15):
        time.sleep(1)
        src = page.eval_on_selector("#textarea-source", "el => el.value")
        tgt = page.eval_on_selector("#textarea-target", "el => el.value")
        is_prog = page.eval_on_selector("#progress-container", "el => el.style.display")
        if len(src) > 0 and is_prog == "none" and not tgt.startswith("⏳"):
            print(f"   Real image OCR Success in {i+1}s! Extracted: {repr(src.strip())}")
            break

    print(f"\n--- Total Console Logs: {len(console_logs)} ---")
    print(f"--- Total Page Errors: {len(page_errors)} ---")
    if page_errors:
        for err in page_errors:
            print(f"ERROR: {err}")
    else:
        print("PERFECT: ZERO ERRORS ON file:/// PROTOCOL!")

    browser.close()
