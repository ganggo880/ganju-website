import os
import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

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
    "utility-splitter.html",
    "deposit-settlement.html",
    "rent-subsidy-checker.html",
    "rent-receipt.html",
    "listing-post-generator.html",
    "legal-notice-generator.html",
    "property-roi-calculator.html",
    "viewing-checklist.html",
    "depreciation-calculator.html",
    "lease-termination-agreement.html",
    "lease-renewal-agreement.html",
    "tenant-screening-checker.html",
    "privacy.html"
]

print("=== 港居不動產全站技術規範與指南自動化稽核 ===")
print(f"盤點頁面總數: {len(HTML_FILES)} 頁\n")

for html_file in HTML_FILES:
    file_path = os.path.abspath(html_file)
    if not os.path.exists(file_path):
        print(f"[FAIL] 檔案不存在: {html_file}")
        continue
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    report = {
        "title": None,
        "has_viewport": False,
        "has_canonical": False,
        "json_ld_valid": False,
        "json_ld_type": None,
        "has_tokens_css": False,
        "has_components_css": False,
        "nav_tools_count": 0,
        "broken_internal_links": []
    }

    # 1. Title
    title_match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
    if title_match:
        report["title"] = title_match.group(1).strip()

    # 2. Viewport
    if 'name="viewport"' in content:
        report["has_viewport"] = True

    # 3. Canonical
    if 'rel="canonical"' in content:
        report["has_canonical"] = True

    # 4. JSON-LD
    json_ld_matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', content, re.DOTALL)
    if json_ld_matches:
        try:
            for jld in json_ld_matches:
                data = json.loads(jld.strip())
                report["json_ld_valid"] = True
                report["json_ld_type"] = data.get("@type")
        except Exception as e:
            report["json_ld_valid"] = False
            report["json_ld_error"] = str(e)

    # 5. CSS tokens & components
    if "tokens.css" in content:
        report["has_tokens_css"] = True
    if "components.css" in content:
        report["has_components_css"] = True

    # 6. Nav tools dropdown links
    tools_in_nav = set(re.findall(r'href="([^"]+\.html)"', content))
    report["nav_tools_count"] = len(tools_in_nav.intersection(set(HTML_FILES)))

    # 7. Check relative file links
    src_and_href = re.findall(r'(?:src|href)="([^"#?]+)"', content)
    for ref in src_and_href:
        if ref.startswith("http://") or ref.startswith("https://") or ref.startswith("mailto:") or ref.startswith("tel:"):
            continue
        ref_clean = ref.split("?")[0].split("#")[0]
        if not os.path.exists(ref_clean):
            report["broken_internal_links"].append(ref)

    status = "合格 PASS" if report["has_viewport"] and (report["json_ld_valid"] or html_file == "id-card-watermark.html") and len(report["broken_internal_links"]) == 0 else "待確認 WARN"
    print(f"[{status}] {html_file}")
    print(f"   • 標題: {report['title']}")
    print(f"   • Viewport: {'OK' if report['has_viewport'] else 'MISSING'} | Canonical: {'OK' if report['has_canonical'] else 'MISSING'}")
    print(f"   • JSON-LD: {report['json_ld_type'] if report['json_ld_valid'] else '無或免配置'} (Valid: {report['json_ld_valid']})")
    print(f"   • 選單整合頁面數: {report['nav_tools_count']}/{len(HTML_FILES)} 個頁面")
    if report["broken_internal_links"]:
        print(f"   • 失效內部連結: {report['broken_internal_links']}")
    print("")

print(f"=== 全站 {len(HTML_FILES)} 大頁面規範稽核完畢 ===")
