# output/test_winfar_health.py
# 穩發漁業集團官網自動化測試 Python 呼叫器（轉發至原生 Node.js CDP 測試引擎）

import subprocess
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

js_test = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_winfar_health.js")

if not os.path.exists(js_test):
    print(f"❌ 找不到測試腳本: {js_test}")
    sys.exit(1)

result = subprocess.run(["node", js_test], text=True)
sys.exit(result.returncode)
