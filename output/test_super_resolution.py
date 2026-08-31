import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8893
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

    # Test dictionary correction function
    test_text = "港居丕動產開發有限公句 租貸住宅委託代菅合約 統蝙96797997 營葉員證號:(108)登字第354198號 押金NT$ 36,000元整 癸約日期:115年08月06日"
    
    corrected = page.evaluate("""(str) => {
        const dict = [
            [/丕動產/g, '不動產'],
            [/不勤產/g, '不動產'],
            [/有限公句/g, '有限公司'],
            [/租貸住宅/g, '租賃住宅'],
            [/組賃/g, '租賃'],
            [/代菅/g, '代管'],
            [/統蝙/g, '統編'],
            [/統偏/g, '統編'],
            [/營葉員/g, '營業員'],
            [/癸約/g, '契約'],
            [/抽金/g, '押金'],
            [/包組/g, '包租'],
            [/點父/g, '點交']
        ];
        let res = str;
        dict.forEach(([pat, rep]) => {
            res = res.replace(pat, rep);
        });
        return res;
    }""", test_text)

    print("Original OCR with flaws:\n", test_text)
    print("\nSmart Dictionary Corrected:\n", corrected)

    browser.close()
