#!/usr/bin/env python3
"""
港居不動產 全站線上工具授權鎖定系統整合腳本
將 css/auth-guard.css 與 js/auth-guard.js 注入至 26 款工具頁面
並在 index.html #tools 區塊加入「內部專屬授權專區」質感告示橫幅
"""

import os
import glob
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOOL_PAGES = [
    'card-merger.html',
    'deposit-settlement.html',
    'depreciation-calculator.html',
    'file-converter.html',
    'id-card-watermark.html',
    'image-converter.html',
    'island.html',
    'island_standalone.html',
    'lease-contract.html',
    'lease-renewal-agreement.html',
    'lease-termination-agreement.html',
    'legal-notice-generator.html',
    'listing-post-generator.html',
    'ocr-translator.html',
    'photo-time-location.html',
    'photo-watermark.html',
    'property-roi-calculator.html',
    'rent-calculator.html',
    'rent-receipt.html',
    'rent-subsidy-checker.html',
    'repair-inspection.html',
    'space-planner.html',
    'tax-calculator.html',
    'tenant-screening-checker.html',
    'utility-splitter.html',
    'viewing-checklist.html'
]

AUTH_HEAD_SNIPPET = """  <!-- Auth Guard: 港居內部專屬線上工具授權驗證系統 -->
  <link rel="stylesheet" href="css/auth-guard.css">
  <script src="js/auth-guard.js"></script>
"""

INDEX_AUTH_CSS = """  <link rel="stylesheet" href="css/auth-guard.css">\n"""

AUTH_NOTICE_BANNER = """      <!-- 內部授權提示橫幅 -->
      <div class="tools-hub-auth-notice">
        <i class="fa-solid fa-shield-halved"></i>
        <div>
          <strong>內部專屬授權專區</strong>：本系列 24 款線上工具集為港居不動產同仁、受邀特約房東與客戶專屬系統，進入工具需輸入授權通行碼。如需申請開通請洽港居 LINE 官方客服。
        </div>
      </div>
"""

def update_tool_pages():
    updated = 0
    for page in TOOL_PAGES:
        filepath = os.path.join(ROOT_DIR, page)
        if not os.path.exists(filepath):
            print(f"⚠️ 找不到檔案: {page}")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'auth-guard.js' in content:
            print(f"✓ 已存在 auth-guard: {page}")
            continue

        # 插入在 </head> 之前
        if '</head>' in content:
            new_content = content.replace('</head>', f"{AUTH_HEAD_SNIPPET}</head>", 1)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ 成功注入 auth-guard: {page}")
            updated += 1
        else:
            print(f"❌ 找不到 </head>: {page}")

    print(f"\n工具頁面更新完成，共更新 {updated} 個檔案。")

def update_index_page():
    index_path = os.path.join(ROOT_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 注入 auth-guard.css
    if 'css/auth-guard.css' not in content:
        content = content.replace('</head>', f"{INDEX_AUTH_CSS}</head>", 1)
        print("✅ index.html 成功注入 css/auth-guard.css")

    # 2. 更新 section-desc
    old_desc = '合法合規・純前端零上傳・專為房東、租客與租管從業人員打造的 24 款高階數位神器，完全免費開放使用。'
    new_desc = '合法合規・純前端本地運算・港居同仁與特約房東/客戶專屬的 24 款高階數位工具系統（內部授權限定）。'
    if old_desc in content:
        content = content.replace(old_desc, new_desc)
        print("✅ index.html 成功更新工具中心敘述文字")

    # 3. 注入 tools-hub-auth-notice
    if 'tools-hub-auth-notice' not in content:
        target = '<div class="tools-hub-grid" id="toolsHubGrid">'
        if target in content:
            content = content.replace(target, f"{AUTH_NOTICE_BANNER}\n      {target}", 1)
            print("✅ index.html 成功加入內部授權提示橫幅")

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    print("🚀 開始整合全站線上工具授權防護...")
    update_tool_pages()
    update_index_page()
    print("🎉 全站線上工具授權防護整合完畢！")
