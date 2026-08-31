import os
import sys
import re
import glob

sys.stdout.reconfigure(encoding='utf-8')

print("=== 執行全站資安防禦性加固 (Security Hardening) ===")

WORKSPACE = os.path.abspath(".")
ALL_HTML = glob.glob(os.path.join(WORKSPACE, "*.html"))

# 1. 加固 HTML 檔案：補齊 rel="noopener noreferrer" 與 Referrer Policy
for html_path in ALL_HTML:
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # A. 補齊 Referrer-Policy 與 X-Content-Type-Options
    if 'name="referrer"' not in content:
        security_meta = '  <meta name="referrer" content="strict-origin-when-cross-origin">\n  <meta http-equiv="X-Content-Type-Options" content="nosniff">\n'
        content = re.sub(r'(<meta\s+name=["\']viewport["\'][^>]*>\n)', r'\1' + security_meta, content, count=1, flags=re.IGNORECASE)

    # B. 加固 target="_blank" 連結，加入 rel="noopener noreferrer"
    def fix_blank_link(match):
        tag = match.group(0)
        if 'rel=' not in tag:
            return tag[:-1] + ' rel="noopener noreferrer">'
        elif 'noopener' not in tag:
            return re.sub(r'rel=["\'](.*?)["\']', r'rel="\1 noopener noreferrer"', tag)
        return tag

    content = re.sub(r'<a\s+[^>]*target=["\']_blank["\'][^>]*>', fix_blank_link, content, flags=re.IGNORECASE)

    if content != original:
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✓ 已完成安全加固: {os.path.basename(html_path)}")

print("\n全站 HTML 安全加固完成！")
