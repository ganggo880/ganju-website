#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 30 個 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 52「租屋定金收據與承租保留切結產生器」(holding-deposit-receipt.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "holding-deposit-receipt.html"
NEW_TOOL_TITLE = "租屋定金收據與切結"
NEW_TOOL_ICON = "fa-receipt"

# 1. 更新所有 HTML 檔案之導覽列下拉選單
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="holding-deposit-receipt.html" class="nav-link"><i class="fa-solid fa-receipt" style="color: #63b3ed;"></i> 租屋定金收據與切結</a></li>\n            '

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "holding-deposit-receipt.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (27) -> (28)
    content = content.replace("全部工具中心 (27)", "全部工具中心 (28)")

    # 檢查是否已包含 holding-deposit-receipt.html
    if "holding-deposit-receipt.html" not in content:
        # 尋找 <li><a href="repair-work-order.html" 或 <li><a href="guarantor-agreement.html"
        target = '<li><a href="repair-work-order.html"'
        if target in content:
            content = content.replace(target, nav_link_snippet + target)
        else:
            # 備用插入點
            target2 = '<li><a href="island.html"'
            if target2 in content:
                end_li = content.find("</li>", content.find(target2))
                if end_li != -1:
                    insert_pos = end_li + 5
                    content = content[:insert_pos] + "\n            " + nav_link_snippet.strip() + content[insert_pos:]

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {len(html_files)} 個 HTML 頁面的導覽列連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

# 更新統計文字
idx_content = idx_content.replace("全部工具 (27)", "全部工具 (28)")
idx_content = idx_content.replace("房東節稅與法務 (14)", "房東節稅與法務 (15)")
idx_content = idx_content.replace("本系列 27 款線上工具集", "本系列 28 款線上工具集")
idx_content = idx_content.replace("專屬的 27 款高階數位工具系統", "專屬的 28 款高階數位工具系統")

tool_card_snippet = """        <!-- 0j. 租屋定金收據與承租保留切結產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-receipt"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>租屋定金收據與承租保留切結產生器</h3>
            <p>依據《民法》第248/249條法規設計，明定定金契約推定成立、保留截止日時與定金折抵條款，繁體中文金融大寫轉換、雙電子簽章與A4列印。</p>
          </div>
          <a href="holding-deposit-receipt.html" class="tool-hub-btn">
            <span>立即產製定金收據</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "holding-deposit-receipt.html" not in idx_content:
    grid_pos = idx_content.find('<div class="tools-hub-grid" id="toolsHubGrid">')
    if grid_pos != -1:
        insert_point = grid_pos + len('<div class="tools-hub-grid" id="toolsHubGrid">\n')
        idx_content = idx_content[:insert_point] + tool_card_snippet + idx_content[insert_point:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(idx_content)

print("✅ 已更新 index.html 工具中心卡片與統計")

# 3. 更新 sitemap.xml
sitemap_path = os.path.join(ROOT, "sitemap.xml")
with open(sitemap_path, 'r', encoding='utf-8') as f:
    sm_content = f.read()

sitemap_snippet = """  <url>
    <loc>https://ganggo880.github.io/ganju-website/holding-deposit-receipt.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "holding-deposit-receipt.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 holding-deposit-receipt.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v3.2", "ganju-pwa-v3.3")

# 加入資源至 PRECACHE_ASSETS
if "'./holding-deposit-receipt.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './repair-work-order.html',\n",
        "  './holding-deposit-receipt.html',\n  './repair-work-order.html',\n"
    )

if "'./css/holding-deposit-receipt.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/repair-work-order.css',\n",
        "  './css/holding-deposit-receipt.css',\n  './css/repair-work-order.css',\n"
    )

if "'./js/holding-deposit-receipt.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/repair-work-order.js',\n",
        "  './js/holding-deposit-receipt.js',\n  './js/repair-work-order.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v3.3 並納入快取清單")
