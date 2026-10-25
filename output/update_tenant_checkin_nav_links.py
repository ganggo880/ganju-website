#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 54「租賃住宅房客遷入登記與住戶緊急聯絡人資料卡產生器」(tenant-check-in-form.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "tenant-check-in-form.html"
NEW_TOOL_TITLE = "房客遷入登記與聯絡人卡"
NEW_TOOL_ICON = "fa-building-user"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="tenant-check-in-form.html" class="nav-link"><i class="fa-solid fa-building-user" style="color: #63b3ed;"></i> 房客遷入登記與聯絡人卡</a></li>\n            '
footer_link_snippet = '<li><a href="tenant-check-in-form.html">房客遷入登記資料卡</a></li>\n            '

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "tenant-check-in-form.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (29) -> (30)
    content = content.replace("全部工具中心 (29)", "全部工具中心 (30)")

    # 檢查是否已包含 tenant-check-in-form.html
    if "tenant-check-in-form.html" not in content:
        # 導覽列下拉插入點：尋找 <li><a href="key-custody-agreement.html"
        target_nav = '<li><a href="key-custody-agreement.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
        else:
            # 針對可能使用直接 <a href="key-custody-agreement.html" 的頁面
            target_direct = '<a href="key-custody-agreement.html"'
            if target_direct in content:
                direct_snippet = '<a href="tenant-check-in-form.html" class="nav-link"><i class="fa-solid fa-building-user" style="color: #63b3ed;"></i> 房客遷入登記與聯絡人卡</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
            else:
                target2 = '<li><a href="island.html"'
                if target2 in content:
                    end_li = content.find("</li>", content.find(target2))
                    if end_li != -1:
                        insert_pos = end_li + 5
                        content = content[:insert_pos] + "\n            " + nav_link_snippet.strip() + content[insert_pos:]

        # 頁尾插入點：尋找 <li><a href="key-custody-agreement.html">鑰匙借出保管切結</a></li>
        target_footer = '<li><a href="key-custody-agreement.html">鑰匙借出保管切結</a></li>'
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
idx_content = idx_content.replace("全部工具 (29)", "全部工具 (30)")
idx_content = idx_content.replace("房東節稅與法務 (16)", "房東節稅與法務 (17)")
idx_content = idx_content.replace("本系列 29 款線上工具集", "本系列 30 款線上工具集")
idx_content = idx_content.replace("專屬的 29 款高階數位工具系統", "專屬的 30 款高階數位工具系統")

tool_card_snippet = """        <!-- 0l. 租賃住宅房客遷入登記與住戶緊急聯絡人資料卡產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-building-user"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>房客遷入登記與住戶緊急聯絡人資料卡</h3>
            <p>依據《公寓大廈管理條例》第35條與個資法規範設計，整合同住人名冊、汽機車車牌車籍、雙組法定緊急聯絡人、寵物晶片、合規切結、雙親筆簽章與A4無痕列印出圖。</p>
          </div>
          <a href="tenant-check-in-form.html" class="tool-hub-btn">
            <span>立即產製遷入登記表</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "tenant-check-in-form.html" not in idx_content:
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
    <loc>https://ganggo880.github.io/ganju-website/tenant-check-in-form.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "tenant-check-in-form.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 tenant-check-in-form.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v3.4", "ganju-pwa-v3.5")

# 加入資源至 PRECACHE_ASSETS
if "'./tenant-check-in-form.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './key-custody-agreement.html',\n",
        "  './tenant-check-in-form.html',\n  './key-custody-agreement.html',\n"
    )

if "'./css/tenant-check-in-form.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/key-custody-agreement.css',\n",
        "  './css/tenant-check-in-form.css',\n  './css/key-custody-agreement.css',\n"
    )

if "'./js/tenant-check-in-form.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/key-custody-agreement.js',\n",
        "  './js/tenant-check-in-form.js',\n  './js/key-custody-agreement.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v3.5 並納入快取清單")
