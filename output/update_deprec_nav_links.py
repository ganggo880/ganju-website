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
    "viewing-checklist.html",
    "privacy.html"
]

target_li = '<li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a></li>'
target_a = '<a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a>'

card_html = """        <!-- 0b. 設備折舊與殘值賠償精算器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #38bdf8;">
              <i class="fa-solid fa-calculator"></i>
            </div>
            <span class="tool-hub-badge"><i class="fa-solid fa-scale-balanced"></i> 退租折舊</span>
          </div>
          <div class="tool-hub-body">
            <h3>租賃設備折舊與損壞賠償殘值精算器</h3>
            <p>依行政院財政部固定資產耐用年數表與民法損害賠償標準，精算冷氣/熱水器/家具折舊現值與法定殘值，落實孰低原則防超額求償。</p>
          </div>
          <a href="depreciation-calculator.html" class="tool-hub-btn">
            <span>立即試算設備折舊</span> <i class="fa-solid fa-arrow-right"></i>
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
    
    if "depreciation-calculator.html" in content and fname != "index.html" and fname != "viewing-checklist.html" and fname != "property-roi-calculator.html":
        print(f"Already present in: {fname}")
        continue
    
    # 1. Update index.html
    if fname == "index.html":
        if "depreciation-calculator.html" not in content:
            # Nav dropdown
            content = content.replace(
                '<li><a href="viewing-checklist.html" class="nav-link"><i class="fa-solid fa-clipboard-list" style="color: #38bdf8;"></i> 看屋 30 項自檢表</a></li>',
                target_li + '\n            <li><a href="viewing-checklist.html" class="nav-link"><i class="fa-solid fa-clipboard-list" style="color: #38bdf8;"></i> 看屋 30 項自檢表</a></li>'
            )
            # #tools section headers & counts
            content = content.replace(
                '打造的 20 款高階數位神器',
                '打造的 21 款高階數位神器'
            )
            content = content.replace(
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (20)',
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (21)'
            )
            content = content.replace(
                '<i class="fa-solid fa-crown" style="color: var(--accent-gold);"></i> 房東節稅與法務 (7)',
                '<i class="fa-solid fa-crown" style="color: var(--accent-gold);"></i> 房東節稅與法務 (8)'
            )
            # Add card before property-roi-calculator
            content = content.replace(
                '        <!-- 0. 物業投資淨投報率與房貸現金流精算器 -->',
                card_html + '\n        <!-- 0. 物業投資淨投報率與房貸現金流精算器 -->'
            )
            with open(fpath, "w", encoding="utf-8") as fp:
                fp.write(content)
            print("Updated index.html")
        continue

    # 2. Update viewing-checklist.html and property-roi-calculator.html footers
    if fname in ["property-roi-calculator.html", "viewing-checklist.html"]:
        # Footer check
        if '<li><a href="property-roi-calculator.html"><i class="fa-solid fa-chart-line"></i> 物業投報與房貸現金流</a></li>' in content and 'depreciation-calculator.html' not in content:
            content = content.replace(
                '<li><a href="property-roi-calculator.html"><i class="fa-solid fa-chart-line"></i> 物業投報與房貸現金流</a></li>',
                '<li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>\n            <li><a href="property-roi-calculator.html"><i class="fa-solid fa-chart-line"></i> 物業投報與房貸現金流</a></li>'
            )

    # 3. Nav dropdown insertion for all files
    if '<li><a href="viewing-checklist.html"' in content:
        content = content.replace(
            '<li><a href="viewing-checklist.html"',
            target_li + '\n            <li><a href="viewing-checklist.html"'
        )
    elif '<a href="viewing-checklist.html"' in content:
        content = content.replace(
            '<a href="viewing-checklist.html"',
            target_a + '\n              <a href="viewing-checklist.html"'
        )
    else:
        print(f"Warning: pattern not found in {fname}")
    
    with open(fpath, "w", encoding="utf-8") as fp:
        fp.write(content)
    print(f"Updated: {fname}")

print("All navigation updates applied successfully.")
