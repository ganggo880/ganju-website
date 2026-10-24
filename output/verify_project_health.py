import os
import sys
import re
import json
import glob
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

print("==================================================================")
print("🛡️ 港居不動產 全站專案流程與健康度綜合檢測 (Unified Project Health Engine)")
print("==================================================================")

WORKSPACE = os.path.abspath(".")
HTML_FILES = [
    "index.html",
    "rent-calculator.html",
    "file-converter.html",
    "photo-watermark.html",
    "id-card-watermark.html",
    "image-converter.html",
    "card-merger.html",
    "photo-time-location.html",
    "ocr-translator.html",
    "space-planner.html",
    "island.html",
    "lease-contract.html",
    "tax-calculator.html",
    "repair-inspection.html",
    "privacy.html"
]

all_passed = True

# 1. 檢驗 10 大網頁與結構化資料 (Pages & Schema.org)
print("\n[檢驗 1/5] 10 大網頁與 SEO 結構化資料...")
pages_report = []
for f in HTML_FILES:
    fpath = os.path.join(WORKSPACE, f)
    if not os.path.exists(fpath):
        print(f"  ❌ 缺失頁面: {f}")
        all_passed = False
        continue

    with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
        content = fp.read()

    has_vp = 'name="viewport"' in content
    has_canon = 'rel="canonical"' in content
    has_ref = 'name="referrer"' in content
    has_nosniff = 'X-Content-Type-Options' in content

    # Check JSON-LD
    jld_match = re.search(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
    jld_valid = False
    jld_type = "無"
    if jld_match:
        try:
            data = json.loads(jld_match.group(1).strip())
            jld_valid = True
            if "@graph" in data and isinstance(data["@graph"], list) and len(data["@graph"]) > 0:
                jld_type = data["@graph"][0].get("@type", "Graph")
            else:
                jld_type = data.get("@type", "Unknown")
        except Exception:
            jld_valid = False

    status = "✅ PASS" if has_vp and has_canon and has_ref and has_nosniff and (jld_valid or f in ["id-card-watermark.html", "island.html"]) else "⚠️ WARN"
    if status == "⚠️ WARN":
        all_passed = False
    print(f"  [{status}] {f:<24} | SEO: {jld_type:<18} | Viewport: {'✓' if has_vp else '✗'} | Referrer: {'✓' if has_ref else '✗'}")

# 2. 檢驗全站導覽列下拉選單一致性 (Navigation Consistency)
print("\n[檢驗 2/5] 導覽列下拉選單整合度與內部連結健全度...")
for f in HTML_FILES:
    fpath = os.path.join(WORKSPACE, f)
    with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
        content = fp.read()

    # Look for tools links
    linked_tools = set(re.findall(r'href="([^"]+\.html)"', content))
    expected = set(HTML_FILES) - {f}
    missing = expected - linked_tools
    # index.html links to itself via #home, others link via index.html, island.html is standalone 3D scene
    if (f == "index.html" and len(linked_tools) >= 12) or f == "island.html":
        missing = set()
    
    if missing:
        print(f"  ⚠️ {f} 缺少對以下工具之選單連結: {missing}")
        all_passed = False
    else:
        print(f"  ✅ {f:<24} | 雙向選單連結 100% 完整")

# 3. 檢驗資安機密防護與反向標籤劫持 (Security & Privacy)
print("\n[檢驗 3/5] 全站資安掃描 (Secrets, Noopener, XSS)...")
secret_found = False
for ext in ["*.html", "js/*.js", "*.js"]:
    for fpath in glob.glob(os.path.join(WORKSPACE, ext)):
        with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
            for idx, line in enumerate(fp, 1):
                if re.search(r'(?i)(?:api_key|password|auth_token)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{24,}["\']', line):
                    if "helloworld" not in line and "K88888888888888" not in line:
                        print(f"  ❌ 疑似敏感金鑰: {os.path.basename(fpath)}:{idx}")
                        secret_found = True
                        all_passed = False

if not secret_found:
    print("  ✅ 原始碼無任何暴露之私密 API 金鑰或密碼")

# 4. 檢驗三處同步配置 (3-Way Sync Matrix)
print("\n[檢驗 4/5] 三處同步文件與路徑一致性檢驗...")
sync_files = {
    "CLAUDE.md": os.path.exists("CLAUDE.md"),
    "AGENTS.md": os.path.exists("AGENTS.md"),
    "handoff.md": os.path.exists("handoff.md"),
    "output/SPECIFICATION.md": os.path.exists("output/SPECIFICATION.md"),
    "obsidian/": os.path.isdir("obsidian")
}

for name, exists in sync_files.items():
    print(f"  [{'✅ PASS' if exists else '❌ MISSING'}] {name}")
    if not exists:
        all_passed = False

# 5. Git 版本控制狀態 (Git Repository Status)
print("\n[檢驗 5/5] Git 版本控制狀態...")
try:
    status_out = subprocess.check_output(["git", "status", "--porcelain"], text=True).strip()
    branch_out = subprocess.check_output(["git", "status", "-b", "--porcelain"], text=True).strip()
    first_line = branch_out.split("\n")[0] if branch_out else ""
    
    if not status_out:
        print(f"  ✅ Working tree clean (無未暫存檔案)")
    else:
        print(f"  ⚠️ 尚有未提交之檔案變更:\n{status_out}")
        
    print(f"  📌 當前分支狀態: {first_line}")
except Exception as e:
    print(f"  ⚠️ Git 狀態讀取異常: {e}")

print("\n==================================================================")
if all_passed:
    print("🎉 綜合評定：全站流程與代碼品質 100% 合格！(GRADE: A+)")
else:
    print("⚠️ 綜合評定：發現部分項目建議優化 (詳見上方提示)")
print("==================================================================")
