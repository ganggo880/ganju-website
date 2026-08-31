import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8897
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

    # Test file chooser on dropzone click
    print("Testing file chooser trigger on dropzone click...")
    with page.expect_file_chooser() as fc_info:
        page.click("#dropzone")
    file_chooser = fc_info.value
    print(f"File chooser opened successfully! Multiple={file_chooser.is_multiple()}")

    browser.close()
