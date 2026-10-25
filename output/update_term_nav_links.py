import os
import re

WORKSPACE = os.path.abspath(".")
FILES = [
    "index.html",
    "depreciation-calculator.html",
    "viewing-checklist.html",
    "property-roi-calculator.html",
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
    "privacy.html"
]

target_li = '<li><a href="lease-termination-agreement.html" class="nav-link"><i class="fa-solid fa-file-circle-xmark" style="color: #f56565;"></i> 提前解約協議與切結</a></li>'

card_html = """        <!-- 0c. 租約提前終止協議書與遷讓交還切結產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #f56565;">
              <i class="fa-solid fa-file-circle-xmark"></i>
            </div>
            <span class="tool-hub-badge"><i class="fa-solid fa-file-shield"></i> 提前解約</span>
          </div>
          <div class="tool-hub-body">
            <h3>住宅租約提前終止協議與遷讓切結產生器</h3>
            <p>符合民法第453條與租賃專法規範，支援合意解約與法定免責終止，內建鑰匙配件點收清單、押金返還與債權債務消滅免責條款。</p>
          </div>
          <a href="lease-termination-agreement.html" class="tool-hub-btn">
            <span>立即產生解約協議</span> <i class="fa-solid fa-arrow-right"></i>
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
    
    if "lease-termination-agreement.html" in content and fname != "index.html":
        print(f"Already present in: {fname}")
        continue
    
    # 1. Update index.html
    if fname == "index.html":
        if "lease-termination-agreement.html" not in content:
            # Nav dropdown
            content = content.replace(
                '<li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a></li>',
                target_li + '\n            <li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a></li>'
            )
            # #tools section headers & counts
            content = content.replace(
                '打造的 21 款高階數位神器',
                '打造的 22 款高階數位神器'
            )
            content = content.replace(
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (21)',
                '<i class="fa-solid fa-layer-group"></i> 全部工具 (22)'
            )
            content = content.replace(
                '<i class="fa-solid fa-user-shield"></i> 房東節稅與法務 (8)',
                '<i class="fa-solid fa-user-shield"></i> 房東節稅與法務 (9)'
            )
            # Card insertion before depreciation card
            content = content.replace(
                '        <!-- 0b. 設備折舊與殘值賠償精算器 -->',
                card_html + '        <!-- 0b. 設備折舊與殘值賠償精算器 -->'
            )
            # Footer links
            content = content.replace(
                '<li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>',
                '<li><a href="lease-termination-agreement.html"><i class="fa-solid fa-file-circle-xmark"></i> 提前解約協議與切結</a></li>\n            <li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>'
            )
            print("Updated index.html nav, #tools, and footer")
    else:
        # Update navbar dropdown
        if 'depreciation-calculator.html' in content:
            content = content.replace(
                '<li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a></li>',
                target_li + '\n            <li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #38bdf8;"></i> 設備折舊與殘值賠償</a></li>'
            )
            # Also footer links if present
            if '<li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>' in content:
                content = content.replace(
                    '<li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>',
                    '<li><a href="lease-termination-agreement.html"><i class="fa-solid fa-file-circle-xmark"></i> 提前解約協議與切結</a></li>\n            <li><a href="depreciation-calculator.html"><i class="fa-solid fa-calculator"></i> 設備折舊與殘值賠償</a></li>'
                )
            print(f"Updated {fname} dropdown and footer")
        else:
            print(f"Notice: depreciation-calculator.html not found in {fname}")

    with open(fpath, "w", encoding="utf-8") as fp:
        fp.write(content)

print("Batch update completed!")
