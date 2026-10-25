#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 60「住宅租賃合租公約與共同承租協議書產生器」(roommate-agreement.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "roommate-agreement.html"
NEW_TOOL_TITLE = "合租公約與承租協議"
NEW_TOOL_ICON = "fa-users"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="roommate-agreement.html" class="nav-link"><i class="fa-solid fa-users" style="color: #63b3ed;"></i> 合租公約與承租協議</a></li>\n            '
footer_link_snippet = '<li><a href="roommate-agreement.html">合租公約與承租協議</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "roommate-agreement.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (35) -> (36)
    content = content.replace("全部工具中心 (35)", "全部工具中心 (36)")

    # 檢查是否已包含 roommate-agreement.html
    if "roommate-agreement.html" not in content:
        # 導覽列下拉插入點：尋找 <li><a href="proxy-authorization.html"
        target_nav = '<li><a href="proxy-authorization.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            target_direct = '<a href="proxy-authorization.html"'
            if target_direct in content:
                direct_snippet = '<a href="roommate-agreement.html" class="nav-link"><i class="fa-solid fa-users" style="color: #63b3ed;"></i> 合租公約與承租協議</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="rent-arrears-notice.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        # 頁尾插入點：尋找 <li><a href="proxy-authorization.html">
        target_footer = '<li><a href="proxy-authorization.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="rent-arrears-notice.html">'
            if target_footer2 in content:
                content = content.replace(target_footer2, footer_link_snippet + target_footer2)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {updated_nav_count} 個 HTML 頁面的導覽列與頁尾連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

# 更新統計文字
idx_content = idx_content.replace("全部工具 (35)", "全部工具 (36)")
idx_content = idx_content.replace("租客權益與試算 (5)", "租客權益與試算 (6)")
idx_content = idx_content.replace("本系列 35 款線上工具集", "本系列 36 款線上工具集")
idx_content = idx_content.replace("專屬的 35 款高階數位工具系統", "專屬的 36 款高階數位工具系統")

tool_card_snippet = """        <!-- 0s. 住宅租賃合租公約與共同承租連帶責任協議書產生器 -->
        <article class="tool-hub-card" data-category="tenant">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #06b6d4;">
              <i class="fa-solid fa-users"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>住宅租賃合租公約與承租協議書</h3>
            <p>依據《民法》第272/280/443條規定，支援多人合租分攤試算、主約代表指派、對外連帶責任宣告、中途退租替補義務、生活公約輪值與A4無痕列印。</p>
          </div>
          <a href="roommate-agreement.html" class="tool-hub-btn">
            <span>立即產製合租協議</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "roommate-agreement.html" not in idx_content:
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
    <loc>https://ganggo880.github.io/ganju-website/roommate-agreement.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "roommate-agreement.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 roommate-agreement.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v4.0", "ganju-pwa-v4.1")

# 加入資源至 PRECACHE_ASSETS
if "'./roommate-agreement.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './proxy-authorization.html',\n",
        "  './roommate-agreement.html',\n  './proxy-authorization.html',\n"
    )

if "'./css/roommate-agreement.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/proxy-authorization.css',\n",
        "  './css/roommate-agreement.css',\n  './css/proxy-authorization.css',\n"
    )

if "'./js/roommate-agreement.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/proxy-authorization.js',\n",
        "  './js/roommate-agreement.js',\n  './js/proxy-authorization.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v4.1 並納入快取清單")
