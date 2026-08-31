import os
from playwright.sync_api import sync_playwright

file_path = os.path.abspath("ocr-translator.html")
file_url = f"file:///{file_path.replace(os.sep, '/')}"

print(f"Testing direct file URL: {file_url}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page_errors = []

    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: page_errors.append(str(err)))

    page.goto(file_url)

    print("\n--- Console Logs on file:/// ---")
    for log in console_logs:
        print(log)

    print("\n--- Page Errors on file:/// ---")
    for err in page_errors:
        print(err)

    browser.close()
