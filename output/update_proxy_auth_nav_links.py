#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 59「租賃住宅授權委託代理人委任書產生器」(proxy-authorization.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "proxy-authorization.html"
NEW_TOOL_TITLE = "租賃代理授權委任書"
NEW_TOOL_ICON = "fa-signature"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="proxy-authorization.html" class="nav-link"><i class="fa-solid fa-signature" style="color: #63b3ed;"></i> 租賃代理授權委任書</a></li>\n            '
footer_link_snippet = '<li><a href="proxy-authorization.html">租賃代理授權委任書</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "proxy-authorization.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (34) -> (35)
    content = content.replace("全部工具中心 (34)", "全部工具中心 (35)")

    # 檢查是否已包含 proxy-authorization.html
    if "proxy-authorization.html" not in content:
        # 導覽列下拉插入點：尋找 <li><a href="rent-arrears-notice.html"
        target_nav = '<li><a href="rent-arrears-notice.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            target_direct = '<a href="rent-arrears-notice.html"'
            if target_direct in content:
                direct_snippet = '<a href="proxy-authorization.html" class="nav-link"><i class="fa-solid fa-signature" style="color: #63b3ed;"></i> 租賃代理授權委任書</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="rules-violation-notice.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        # 頁尾插入點：尋找 <li><a href="rent-arrears-notice.html">
        target_footer = '<li><a href="rent-arrears-notice.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="rules-violation-notice.html">'
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
idx_content = idx_content.replace("全部工具 (34)", "全部工具 (35)")
idx_content = idx_content.replace("房東節稅與法務 (21)", "房東節稅與法務 (22)")
idx_content = idx_content.replace("本系列 34 款線上工具集", "本系列 35 款線上工具集")
idx_content = idx_content.replace("專屬的 34 款高階數位工具系統", "專屬的 35 款高階數位工具系統")

tool_card_snippet = """        <!-- 0r. 租賃住宅授權委託代理人委任書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #2563eb;">
              <i class="fa-solid fa-signature"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>租賃住宅授權委託代理人委任書</h3>
            <p>依據《民法》第103/167/528/534條規定，支援房東與租客雙模式、7大特別代理授權權限矩陣、雙方Retina電子手寫簽章、身分證影本黏貼格與A4無痕列印。</p>
          </div>
          <a href="proxy-authorization.html" class="tool-hub-btn">
            <span>立即產製委任書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "proxy-authorization.html" not in idx_content:
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
    <loc>https://ganggo880.github.io/ganju-website/proxy-authorization.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "proxy-authorization.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 proxy-authorization.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v3.9", "ganju-pwa-v4.0")

# 加入資源至 PRECACHE_ASSETS
if "'./proxy-authorization.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './rent-arrears-notice.html',\n",
        "  './proxy-authorization.html',\n  './rent-arrears-notice.html',\n"
    )

if "'./css/proxy-authorization.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/rent-arrears-notice.css',\n",
        "  './css/proxy-authorization.css',\n  './css/rent-arrears-notice.css',\n"
    )

if "'./js/proxy-authorization.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/rent-arrears-notice.js',\n",
        "  './js/proxy-authorization.js',\n  './js/rent-arrears-notice.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v4.0 並納入快取清單")
