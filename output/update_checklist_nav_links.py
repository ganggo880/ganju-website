import os
import re

WORKSPACE = os.path.abspath(".")
FILES = [
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
    "privacy.html"
]

target_li = '<li><a href="viewing-checklist.html" class="nav-link"><i class="fa-solid fa-clipboard-list" style="color: #38bdf8;"></i> 看屋 30 項自檢表</a></li>'
target_a = '<a href="viewing-checklist.html" class="nav-link"><i class="fa-solid fa-clipboard-list" style="color: #38bdf8;"></i> 看屋 30 項自檢表</a>'

card_html = """        <!-- 6b. 看屋 30 項自檢與避坑評分表 -->
        <article class="tool-hub-card" data-category="tenant">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #38bdf8;">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            <span class="tool-hub-badge"><i class="fa-solid fa-house-circle-check"></i> 看屋避坑</span>
          </div>
          <div class="tool-hub-body">
            <h3>租客看屋 30 項自檢與避坑評分表</h3>
            <p>6 大分區 30 項實戰檢核、水壓暗漏/電路消防/隔音避坑、100 分綜合宜居指數、待改善地雷備忘錄與 A4 看屋診斷單。</p>
          </div>
          <a href="viewing-checklist.html" class="tool-hub-btn">
            <span>立即自檢查驗屋況</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>
"""

for fname in FILES:
    fpath = os.path.join(WORKSPACE, fname)
    if not os.path.exists(fpath):
        print(f"File not found: {fname}")
        continue
    
    with open(fpath, "r", encoding="utf-8") as fp:
        content = fp.read()
    
    if "viewing-checklist.html" in content and fname != "index.html" and fname != "property-roi-calculator.html":
        print(f"Already present in: {fname}")
        continue
    
    # Update index.html
    if fname == "index.html":
        if "viewing-checklist.html" not in content:
            # 1. Nav dropdown
            content = content.replace(
                '<li><a href="property-roi-calculator.html" class="nav-link"><i class="fa-solid fa-chart-line" style="color: #38bdf8;"></i> 物業投報與現金流</a></li>',
                target_li + '\n            <li><a href="property-roi-calculator.html" class="nav-link"><i class="fa-solid fa-chart-line" style="color: #38bdf8;"></i> 物業投報與現金流</a></li>'
            )
            # 2. #tools section headers & counts
            content = content.replace(
                '打造的 19 款高階數位神器',
                '打造的 20 款高階數位神器'
            )
            content = content.replace(
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (19)',
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (20)'
            )
            content = content.replace(
                '<i class="fa-solid fa-hand-holding-heart" style="color: #f687b3;"></i> 租客權益與試算 (4)',
                '<i class="fa-solid fa-hand-holding-heart" style="color: #f687b3;"></i> 租客權益與試算 (5)'
            )
            # 3. Add card before tool 7
            content = content.replace(
                '        <!-- 7. 300億租金補貼試算 -->',
                card_html + '\n        <!-- 7. 300億租金補貼試算 -->'
            )
            with open(fpath, "w", encoding="utf-8") as fp:
                fp.write(content)
            print("Updated index.html")
        continue

    # Update property-roi-calculator.html
    if fname == "property-roi-calculator.html":
        if "viewing-checklist.html" not in content:
            content = content.replace(
                '<li><a href="property-roi-calculator.html" class="nav-link active">',
                target_li + '\n            <li><a href="property-roi-calculator.html" class="nav-link active">'
            )
            content = content.replace(
                '<h4 class="footer-col-title">租客與空間神器</h4>\n          <ul>\n            <li><a href="rent-subsidy-checker.html">',
                '<h4 class="footer-col-title">租客與空間神器</h4>\n          <ul>\n            <li><a href="viewing-checklist.html"><i class="fa-solid fa-clipboard-list"></i> 看屋 30 項自檢表</a></li>\n            <li><a href="rent-subsidy-checker.html">'
            )
            with open(fpath, "w", encoding="utf-8") as fp:
                fp.write(content)
            print("Updated property-roi-calculator.html")
        continue

    # Other files:
    if '<li><a href="property-roi-calculator.html"' in content:
        content = content.replace(
            '<li><a href="property-roi-calculator.html"',
            target_li + '\n            <li><a href="property-roi-calculator.html"'
        )
    elif '<a href="property-roi-calculator.html"' in content:
        content = content.replace(
            '<a href="property-roi-calculator.html"',
            target_a + '\n              <a href="property-roi-calculator.html"'
        )
    else:
        print(f"Warning: neither pattern found in {fname}")
    
    with open(fpath, "w", encoding="utf-8") as fp:
        fp.write(content)
    print(f"Updated: {fname}")

print("All navigation updates applied successfully.")
