#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml 與 sw.js
納入 Phase 57「租賃住宅住戶違規行為勸導限期改善通知單產生器」(rules-violation-notice.html)
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "rules-violation-notice.html"
NEW_TOOL_TITLE = "住戶違規改善通知單"
NEW_TOOL_ICON = "fa-triangle-exclamation"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="rules-violation-notice.html" class="nav-link"><i class="fa-solid fa-triangle-exclamation" style="color: #63b3ed;"></i> 住戶違規改善通知單</a></li>\n            '
footer_link_snippet = '<li><a href="rules-violation-notice.html">住戶違規改善通知單</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "rules-violation-notice.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (32) -> (33)
    content = content.replace("全部工具中心 (32)", "全部工具中心 (33)")

    # 檢查是否已包含 rules-violation-notice.html
    if "rules-violation-notice.html" not in content:
        # 導覽列下拉插入點：尋找 <li><a href="abandoned-property-agreement.html"
        target_nav = '<li><a href="abandoned-property-agreement.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            # 針對可能使用直接 <a href="abandoned-property-agreement.html" 的頁面
            target_direct = '<a href="abandoned-property-agreement.html"'
            if target_direct in content:
                direct_snippet = '<a href="rules-violation-notice.html" class="nav-link"><i class="fa-solid fa-triangle-exclamation" style="color: #63b3ed;"></i> 住戶違規改善通知單</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="routine-inspection-report.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        # 頁尾插入點：尋找 <li><a href="abandoned-property-agreement.html">
        target_footer = '<li><a href="abandoned-property-agreement.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="routine-inspection-report.html">屋況定期巡檢維護報告</a></li>'
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
idx_content = idx_content.replace("全部工具 (32)", "全部工具 (33)")
idx_content = idx_content.replace("房東節稅與法務 (19)", "房東節稅與法務 (20)")
idx_content = idx_content.replace("本系列 32 款線上工具集", "本系列 33 款線上工具集")
idx_content = idx_content.replace("專屬的 32 款高階數位工具系統", "專屬的 33 款高階數位工具系統")

tool_card_snippet = """        <!-- 0p. 租賃住宅住戶違規行為勸導限期改善通知單產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #dc2626;">
              <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>租賃住宅住戶違規行為勸導限期改善通知單</h3>
            <p>遵循《租賃專法》第10條第1項第3款與《公寓大廈管理條例》第16/47條，涵蓋梯間雜物、深夜噪音、吸菸、違規養寵等六大情境，現場照片存證、雙簽與A4列印。</p>
          </div>
          <a href="rules-violation-notice.html" class="tool-hub-btn">
            <span>立即產製勸導通知單</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

tool_card_snippet_abandoned = """        <!-- 0n. 租賃住宅承租人遺留物處理授權與拋棄切結書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid fa-file-signature"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>租賃住宅承租人遺留物處理授權與拋棄切結書</h3>
            <p>遵循《租賃住宅市場發展及管理條例》第12條與《民法》第445條法定留置權，涵蓋退租合意、事前授權與催告期滿處置，動態造冊、清運規費押金扣抵與雙簽存證。</p>
          </div>
          <a href="abandoned-property-agreement.html" class="tool-hub-btn">
            <span>立即產製拋棄切結書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if "rules-violation-notice.html" not in idx_content:
    grid_pos = idx_content.find('<div class="tools-hub-grid" id="toolsHubGrid">')
    if grid_pos != -1:
        insert_point = grid_pos + len('<div class="tools-hub-grid" id="toolsHubGrid">\n')
        # 如果 abandoned 也還沒在卡片網格中，一併補齊
        cards_to_insert = tool_card_snippet
        if "abandoned-property-agreement.html" not in idx_content[grid_pos:]:
            cards_to_insert += tool_card_snippet_abandoned
        idx_content = idx_content[:insert_point] + cards_to_insert + idx_content[insert_point:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(idx_content)

print("✅ 已更新 index.html 工具中心卡片與統計")

# 3. 更新 sitemap.xml
sitemap_path = os.path.join(ROOT, "sitemap.xml")
with open(sitemap_path, 'r', encoding='utf-8') as f:
    sm_content = f.read()

sitemap_snippet = """  <url>
    <loc>https://ganggo880.github.io/ganju-website/rules-violation-notice.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "rules-violation-notice.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 rules-violation-notice.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

# 升級快取版本
sw_content = sw_content.replace("ganju-pwa-v3.7", "ganju-pwa-v3.8")

# 加入資源至 PRECACHE_ASSETS
if "'./rules-violation-notice.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './abandoned-property-agreement.html',\n",
        "  './rules-violation-notice.html',\n  './abandoned-property-agreement.html',\n"
    )

if "'./css/rules-violation-notice.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/abandoned-property-agreement.css',\n",
        "  './css/rules-violation-notice.css',\n  './css/abandoned-property-agreement.css',\n"
    )

if "'./js/rules-violation-notice.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/abandoned-property-agreement.js',\n",
        "  './js/rules-violation-notice.js',\n  './js/abandoned-property-agreement.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v3.8 並納入快取清單")
