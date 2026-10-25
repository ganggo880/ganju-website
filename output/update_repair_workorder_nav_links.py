#!/usr/bin/env python3
"""
更新全站所有頁面之導覽列選單，將 repair-work-order.html (修繕派工與完工驗收證明單產生器) 納入
並更新 index.html #tools 區塊卡片與分類數量 (27款工具 / 房東專區 14 款)
"""

import os
import glob
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_NAV_ITEM = '<li><a href="repair-work-order.html" class="nav-link"><i class="fa-solid fa-wrench" style="color: var(--accent-gold);"></i> 修繕派工與驗收單</a></li>'

INDEX_TOOL_CARD = """        <!-- 0h. 租賃住宅修繕通報派工與完工驗收證明單產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-wrench"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>租賃住宅修繕通報派工與完工驗收證明單產生器</h3>
            <p>依據《民法》第429/430條修繕規範設計，支援多工項報價精算、前後照片存證對比、三方電子簽章、5,000元緊急代墊標記與A4請款單列印。</p>
          </div>
          <a href="repair-work-order.html" class="tool-hub-btn">
            <span>立即開立修繕派工單</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>"""

def update_navbar_in_pages():
    html_files = sorted(glob.glob(os.path.join(ROOT_DIR, "*.html")))
    updated_count = 0

    for file_path in html_files:
        filename = os.path.basename(file_path)
        if filename == "repair-work-order.html":
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        if 'href="repair-work-order.html"' in content and filename != "index.html":
            print(f"✓ 已存在選單連結: {filename}")
            continue

        # 尋找 <li><a href="guarantor-agreement.html" 並在它前面插入
        target = '<li><a href="guarantor-agreement.html"'
        if target in content and 'href="repair-work-order.html"' not in content:
            new_content = content.replace(target, f"{NEW_NAV_ITEM}\n            {target}", 1)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"✅ 成功更新導覽列: {filename}")
            updated_count += 1
        else:
            print(f"⚠️ 未找到插入點或需手動處理: {filename}")

    print(f"\n導覽列更新完成，共更新 {updated_count} 個頁面。")

def update_index_page():
    index_path = os.path.join(ROOT_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 更新全部工具計數與房東分類計數
    content = content.replace("全部工具 (26)", "全部工具 (27)")
    content = content.replace("全部工具中心 (26)", "全部工具中心 (27)")
    content = content.replace("房東節稅與法務 (13)", "房東節稅與法務 (14)")
    content = content.replace("26 款高階數位工具系統", "27 款高階數位工具系統")
    content = content.replace("本系列 26 款線上工具集", "本系列 27 款線上工具集")

    # 插入工具卡片至 #toolsHubGrid
    if 'href="repair-work-order.html"' not in content:
        target = '<!-- 0g. 租賃住宅連帶保證人保證書與履約切結書線上產生器 -->'
        if target in content:
            content = content.replace(target, f"{INDEX_TOOL_CARD}\n\n        {target}", 1)
            print("✅ index.html 成功新增修繕派工與驗收單工具卡片")

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    update_navbar_in_pages()
    update_index_page()
    print("🎉 全站選單與首頁更新完畢！")
