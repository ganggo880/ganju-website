#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 55「住宅租賃屋況定期巡檢維護報告書產生器」(routine-inspection-report.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "routine-inspection-report.html"
NEW_TOOL_TITLE = "屋況定期巡檢維護報告"
NEW_TOOL_ICON = "fa-clipboard-check"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="routine-inspection-report.html" class="nav-link"><i class="fa-solid fa-clipboard-check" style="color: #63b3ed;"></i> 屋況定期巡檢維護報告</a></li>\n            '
footer_link_snippet = '<li><a href="routine-inspection-report.html">屋況定期巡檢維護報告</a></li>\n            '

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "routine-inspection-report.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (30) -> (31)
    content = content.replace("全部工具中心 (30)", "全部工具中心 (31)")

    # 檢查是否已包含 routine-inspection-report.html
    if "routine-inspection-report.html" not in content:
        # 導覽列下拉插入點：尋找 <li><a href="tenant-check-in-form.html"
        target_nav = '<li><a href="tenant-check-in-form.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
        else:
            # 針對可能使用直接 <a href="tenant-check-in-form.html" 的頁面
            target_direct = '<a href="tenant-check-in-form.html"'
            if target_direct in content:
                direct_snippet = '<a href="routine-inspection-report.html" class="nav-link"><i class="fa-solid fa-clipboard-check" style="color: #63b3ed;"></i> 屋況定期巡檢維護報告</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
            else:
                target2 = '<li><a href="island.html"'
                if target2 in content:
                    end_li = content.find("</li>", content.find(target2))
                    if end_li != -1:
                        insert_pos = end_li + 5
                        content = content[:insert_pos] + "\n            " + nav_link_snippet.strip() + content[insert_pos:]

        # 頁尾插入點：尋找 <li><a href="tenant-check-in-form.html">房客遷入登記資料卡</a></li>
        target_footer = '<li><a href="tenant-check-in-form.html">房客遷入登記資料卡</a></li>'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {len(html_files)} 個 HTML 頁面的導覽列與頁尾連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

# 更新統計文字
idx_content = idx_content.replace("全部工具 (30)", "全部工具 (31)")
idx_content = idx_content.replace("房東節稅與法務 (17)", "房東節稅與法務 (18)")
idx_content = idx_content.replace("本系列 30 款線上工具集", "本系列 31 款線上工具集")
idx_content = idx_content.replace("專屬的 30 款高階數位工具系統", "專屬的 31 款高階數位工具系統")

tool_card_snippet = """        <!-- 0m. 住宅租賃屋況定期巡檢維護報告書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-clipboard-check"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>住宅租賃屋況定期巡檢維護報告書</h3>
            <p>遵循《租賃住宅市場發展及管理條例》第28條受託巡檢規範，整合消防瓦斯、配電盤、給水防漏六大安全檢驗矩陣、相片存證、雙手寫簽章與A4無痕列印出圖。</p>
          </div>
          <a href="routine-inspection-report.html" class="tool-hub-btn">
            <span>立即產製巡檢報告書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "routine-inspection-report.html" not in idx_content:
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
    <loc>https://ganggo880.github.io/ganju-website/routine-inspection-report.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "routine-inspection-report.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 routine-inspection-report.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v3.5", "ganju-pwa-v3.6")

# 加入資源至 PRECACHE_ASSETS
if "'./routine-inspection-report.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './tenant-check-in-form.html',\n",
        "  './routine-inspection-report.html',\n  './tenant-check-in-form.html',\n"
    )

if "'./css/routine-inspection-report.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/tenant-check-in-form.css',\n",
        "  './css/routine-inspection-report.css',\n  './css/tenant-check-in-form.css',\n"
    )

if "'./js/routine-inspection-report.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/tenant-check-in-form.js',\n",
        "  './js/routine-inspection-report.js',\n  './js/tenant-check-in-form.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v3.6 並納入快取清單")
