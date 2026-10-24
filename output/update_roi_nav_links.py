import os
import re

WORKSPACE = os.path.abspath(".")
FILES = [
    "rent-calculator.html",
    "file-converter.html",
    "photo-watermark.html",
    "id-card-watermark.html",
    "image-converter.html",
    "card-merger.html",
    "photo-time-location.html",
    "ocr-translator.html",
    "space-planner.html",
    "lease-contract.html",
    "tax-calculator.html",
    "repair-inspection.html",
    "utility-splitter.html",
    "deposit-settlement.html",
    "rent-subsidy-checker.html",
    "rent-receipt.html",
    "listing-post-generator.html",
    "legal-notice-generator.html",
    "privacy.html"
]

target_li = '<li><a href="property-roi-calculator.html" class="nav-link"><i class="fa-solid fa-chart-line" style="color: #38bdf8;"></i> 物業投報與現金流</a></li>'
target_a = '<a href="property-roi-calculator.html" class="nav-link"><i class="fa-solid fa-chart-line" style="color: #38bdf8;"></i> 物業投報與現金流</a>'

for fname in FILES:
    fpath = os.path.join(WORKSPACE, fname)
    if not os.path.exists(fpath):
        print(f"File not found: {fname}")
        continue
    
    with open(fpath, "r", encoding="utf-8") as fp:
        content = fp.read()
    
    if "property-roi-calculator.html" in content:
        print(f"Already present in: {fname}")
        continue
    
    # 1. Update nav-dropdown-menu
    # Pattern 1: <li><a href="island.html" ...</li>
    if '<li><a href="island.html"' in content:
        content = content.replace(
            '<li><a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a></li>',
            '<li><a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a></li>\n            ' + target_li
        )
    # Pattern 2: <a href="island.html" ...</a>
    elif '<a href="island.html"' in content:
        content = content.replace(
            '<a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a>',
            '<a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a>\n              ' + target_a
        )
    elif '<li><a href="legal-notice-generator.html"' in content:
        content = re.sub(
            r'(<li><a href="legal-notice-generator\.html"[^>]*>.*?</li>)',
            target_li + '\n            \\1',
            content,
            count=1
        )
    
    # 2. Update footer if footer has landlord links
    if '<li><a href="tax-calculator.html"' in content and 'property-roi-calculator.html' not in content:
        content = content.replace(
            '<li><a href="tax-calculator.html"',
            '<li><a href="property-roi-calculator.html"><i class="fa-solid fa-chart-line"></i> 物業投報與房貸現金流</a></li>\n            <li><a href="tax-calculator.html"'
        )
    
    with open(fpath, "w", encoding="utf-8") as fp:
        fp.write(content)
    
    print(f"Updated: {fname}")

print("Batch update complete.")
