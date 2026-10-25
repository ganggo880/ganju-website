#!/usr/bin/env python3
"""
更新全站所有頁面之導覽列選單，將 mandate-contract.html (租賃委託管理/包租契約產生器) 納入
並更新 index.html #tools 區塊卡片與分類數量
"""

import os
import glob
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_NAV_ITEM = '<li><a href="mandate-contract.html" class="nav-link"><i class="fa-solid fa-handshake" style="color: var(--accent-gold);"></i> 租賃委託管理/包租契約</a></li>'

INDEX_TOOL_CARD = """        <!-- 0f. 住宅租賃委託管理（包租／代管）契約書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-handshake"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>住宅租賃委託管理（包租／代管）契約書產生器</h3>
            <p>依據內政部定型化契約範本設計，支援委託代管與保證包租雙模式切換、六大受託權限清單、5,000元免報備快速修繕代墊授權、雙電子簽章與A4列印。</p>
          </div>
          <a href="mandate-contract.html" class="tool-hub-btn">
            <span>立即產製委託合約</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>"""

def update_navbar_in_pages():
    html_files = sorted(glob.glob(os.path.join(ROOT_DIR, "*.html")))
    updated_count = 0

    for file_path in html_files:
        filename = os.path.basename(file_path)
        if filename == "mandate-contract.html":
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if 'href="mandate-contract.html"' in content and filename != "index.html":
            print(f"✓ 已存在選單連結: {filename}")
            continue

        # 尋找 <li><a href="tenant-screening-checker.html" class="nav-link" 並在它前面插入
        target = '<li><a href="tenant-screening-checker.html"'
        if target in content and f'href="mandate-contract.html"' not in content:
            new_content = content.replace(target, f"{NEW_NAV_ITEM}\n            {target}", 1)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"✅ 成功更新導覽列: {filename}")
            updated_count += 1
        else:
            print(f"⚠️ 未找到插入點或已存在: {filename}")

    print(f"\n導覽列更新完成，共更新 {updated_count} 個頁面。")

def update_index_page():
    index_path = os.path.join(ROOT_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 更新全部工具計數與房東分類計數
    content = content.replace("全部工具 (24)", "全部工具 (25)")
    content = content.replace("全部工具中心 (24)", "全部工具中心 (25)")
    content = content.replace("房東節稅與法務 (11)", "房東節稅與法務 (12)")
    content = content.replace("24 款高階數位工具系統", "25 款高階數位工具系統")
    content = content.replace("本系列 24 款線上工具集", "本系列 25 款線上工具集")

    # 插入工具卡片至 #toolsHubGrid
    if 'href="mandate-contract.html"' not in content:
        target = '<!-- 0e. 租客承租資格審查與租賃信用評分表產生器 -->'
        if target in content:
            content = content.replace(target, f"{INDEX_TOOL_CARD}\n\n        {target}", 1)
            print("✅ index.html 成功新增委託管理合約工具卡片")

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    update_navbar_in_pages()
    update_index_page()
    print("🎉 全站選單與首頁更新完畢！")
