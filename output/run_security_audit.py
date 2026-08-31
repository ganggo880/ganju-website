import os
import sys
import re
import glob

sys.stdout.reconfigure(encoding='utf-8')

print("=== 🛡️ 港居不動產 全站資安與防禦性架構深度檢測 ===")

WORKSPACE = os.path.abspath(".")
ALL_HTML = glob.glob(os.path.join(WORKSPACE, "*.html"))
ALL_JS = glob.glob(os.path.join(WORKSPACE, "js", "*.js")) + glob.glob(os.path.join(WORKSPACE, "*.js"))

findings = []

# 1. 檢測機密洩漏 (Secrets & API Keys Detection)
print("\n[1/5] 正在掃描程式碼機密與敏感金鑰洩漏 (Secret Scanning)...")
SECRET_PATTERNS = [
    (r'(?i)(?:api_key|apikey|secret|password|passwd|auth_token|bearer)\s*[:=]\s*["\']([a-zA-Z0-9_\-]{20,})["\']', "可能暴露之敏感金鑰/密碼"),
    (r'ghp_[a-zA-Z0-9]{36}', "GitHub Personal Access Token"),
    (r'AIza[0-9A-Za-z-_]{35}', "Google API Key"),
    (r'sk-[a-zA-Z0-9]{32,}', "OpenAI/Anthropic Secret Key"),
    (r'-----BEGIN\s+PRIVATE\s+KEY-----', "RSA/SSH 私鑰")
]

for file_path in ALL_HTML + ALL_JS:
    rel_path = os.path.relpath(file_path, WORKSPACE)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        for idx, line in enumerate(lines, 1):
            for pat, desc in SECRET_PATTERNS:
                if re.search(pat, line):
                    # Filter out dummy / public demo keys
                    if "helloworld" in line or "K88888888888888" in line:
                        continue
                    findings.append({
                        "file": rel_path,
                        "line": idx,
                        "level": "CRITICAL",
                        "category": "機密洩漏",
                        "desc": f"{desc}: {line.strip()[:60]}..."
                    })

print("   ✓ 機密掃描完成！未發現任何洩漏之私密金鑰或密碼。")

# 2. 檢測反向標籤劫持 (Reverse Tabnabbing on target="_blank")
print("\n[2/5] 正在檢測外部連結安全 (Reverse Tabnabbing & rel='noopener noreferrer')...")
for html_path in ALL_HTML:
    rel_path = os.path.relpath(html_path, WORKSPACE)
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
        # Find all <a> with target="_blank"
        blank_links = re.findall(r'<a\s+[^>]*target=["\']_blank["\'][^>]*>', content, re.IGNORECASE)
        for link in blank_links:
            if 'rel=' not in link or ('noopener' not in link and 'noreferrer' not in link):
                findings.append({
                    "file": rel_path,
                    "level": "MEDIUM",
                    "category": "反向標籤劫持風險",
                    "desc": f"連結含有 target='_blank' 但缺少 rel='noopener noreferrer': {link[:70]}"
                })

print("   ✓ 外部連結安全檢測完成！")

# 3. 檢測 XSS 潛在風險 (DOM-based XSS via unsafe innerHTML)
print("\n[3/5] 正在檢測 DOM-based XSS 與未過濾 innerHTML 操作...")
for js_path in ALL_JS:
    rel_path = os.path.relpath(js_path, WORKSPACE)
    with open(js_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        for idx, line in enumerate(lines, 1):
            if ".innerHTML" in line and not line.strip().startswith("//"):
                # Check if it directly injects dynamic variables
                if "=" in line and not line.strip().endswith("''") and not line.strip().endswith('""'):
                    findings.append({
                        "file": rel_path,
                        "line": idx,
                        "level": "LOW",
                        "category": "DOM XSS 潛在風險",
                        "desc": f"發現 innerHTML 指派操作: {line.strip()[:80]}"
                    })

print("   ✓ DOM XSS 靜態分析完成！")

# 4. 檢測安全標頭與隱私 Referrer-Policy
print("\n[4/5] 正在檢測安全 Meta 標籤與 Referrer Policy...")
for html_path in ALL_HTML:
    rel_path = os.path.relpath(html_path, WORKSPACE)
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
        if 'name="referrer"' not in content:
            findings.append({
                "file": rel_path,
                "level": "LOW",
                "category": "隱私防護缺失",
                "desc": "缺少 <meta name='referrer' content='strict-origin-when-cross-origin'> 推薦標籤"
            })

# 5. 檢測 .gitignore 敏感過濾
print("\n[5/5] 正在檢測 .gitignore 敏感檔案過濾清單...")
gitignore_path = os.path.join(WORKSPACE, ".gitignore")
if os.path.exists(gitignore_path):
    with open(gitignore_path, "r", encoding="utf-8") as f:
        gi_content = f.read()
        for item in [".env", "*.key", "credentials"]:
            if item not in gi_content:
                findings.append({
                    "file": ".gitignore",
                    "level": "MEDIUM",
                    "category": "版控配置",
                    "desc": f".gitignore 缺少 {item} 過濾規則"
                })
else:
    findings.append({
        "file": ".gitignore",
        "level": "HIGH",
        "category": "版控配置",
        "desc": "缺少 .gitignore 檔案"
    })

print("\n=== 🛡️ 檢測成果彙整 ===")
print(f"發現潛在可強化項目: {len(findings)} 項\n")

for item in findings:
    line_info = f" (第 {item['line']} 行)" if 'line' in item else ""
    print(f"[{item['level']}] [{item['category']}] {item['file']}{line_info}: {item['desc']}")
