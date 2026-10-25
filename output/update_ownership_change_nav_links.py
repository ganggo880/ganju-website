#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml、sw.js 與自動化稽核套件
納入 Phase 66「住宅租賃買賣不破租賃通知與押金移轉確認書產生器」(ownership-change-notice.html)
"""

import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "ownership-change-notice.html"
NEW_TOOL_TITLE = "買賣不破租賃與押金移轉通知"
NEW_TOOL_ICON = "fa-house-chimney-user"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="ownership-change-notice.html" class="nav-link"><i class="fa-solid fa-house-chimney-user" style="color: #63b3ed;"></i> 買賣不破租賃與押金移轉通知</a></li>\n            '
footer_link_snippet = '<li><a href="ownership-change-notice.html">買賣不破租賃與押金移轉通知</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "ownership-change-notice.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (41) -> (42)
    content = content.replace("全部工具中心 (41)", "全部工具中心 (42)")

    if "ownership-change-notice.html" not in content:
        target_nav = '<li><a href="dispute-mediation-request.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            target_direct = '<a href="dispute-mediation-request.html"'
            if target_direct in content:
                direct_snippet = '<a href="ownership-change-notice.html" class="nav-link"><i class="fa-solid fa-house-chimney-user" style="color: #63b3ed;"></i> 買賣不破租賃與押金移轉通知</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="arrears-installment-agreement.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        target_footer = '<li><a href="dispute-mediation-request.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="arrears-installment-agreement.html">'
            if target_footer2 in content:
                content = content.replace(target_footer2, footer_link_snippet + target_footer2)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {updated_nav_count} 個 HTML 頁面的導覽列與頁尾連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

idx_content = idx_content.replace("全部工具 (41)", "全部工具 (42)")
idx_content = idx_content.replace("房東節稅與法務 (24)", "房東節稅與法務 (25)")
idx_content = idx_content.replace("本系列 41 款線上工具集", "本系列 42 款線上工具集")
idx_content = idx_content.replace("專屬的 41 款高階數位工具系統", "專屬的 42 款高階數位工具系統")

tool_card_snippet = """        <!-- 0y. 住宅租賃買賣不破租賃通知與押金移轉確認書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #0284c7;">
              <i class="fa-solid fa-house-chimney-user"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>買賣不破租賃與押金移轉通知書</h3>
            <p>依據民法第425條買賣不破租賃原則設計，原租約法定承受宣告、押金全額移轉簽收、新受款帳戶指定、三方手寫簽章與A4無痕列印。</p>
          </div>
          <a href="ownership-change-notice.html" class="tool-hub-btn">
            <span>立即產製通知書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if 'href="ownership-change-notice.html" class="tool-hub-btn"' not in idx_content:
    target_pos = idx_content.find('<!-- 0x. 住宅租賃爭議調處與調解聲請書產生器 -->')
    if target_pos != -1:
        idx_content = idx_content[:target_pos] + tool_card_snippet + idx_content[target_pos:]
    else:
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
    <loc>https://ganggo880.github.io/ganju-website/ownership-change-notice.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "ownership-change-notice.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 ownership-change-notice.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

sw_content = sw_content.replace("ganju-pwa-v4.6", "ganju-pwa-v4.7")

if "'./ownership-change-notice.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './dispute-mediation-request.html',\n",
        "  './ownership-change-notice.html',\n  './dispute-mediation-request.html',\n"
    )

if "'./css/ownership-change-notice.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/dispute-mediation-request.css',\n",
        "  './css/ownership-change-notice.css',\n  './css/dispute-mediation-request.css',\n"
    )

if "'./js/ownership-change-notice.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/dispute-mediation-request.js',\n",
        "  './js/ownership-change-notice.js',\n  './js/dispute-mediation-request.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v4.7 並納入快取清單")

# 5. 更新 4 大自動化稽核腳本
for py_script in ["audit_site_specs.py", "verify_project_health.py"]:
    p = os.path.join(ROOT, "output", py_script)
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    if '"ownership-change-notice.html"' not in c:
        c = c.replace(
            '    "dispute-mediation-request.html",\n',
            '    "dispute-mediation-request.html",\n    "ownership-change-notice.html",\n'
        )
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"✅ 已更新 output/{py_script}")

for js_script in ["audit_mobile_rwd.js", "test_pwa_offline.js"]:
    p = os.path.join(ROOT, "output", js_script)
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    if "'ownership-change-notice.html'" not in c:
        c = c.replace(
            "  'dispute-mediation-request.html',\n",
            "  'dispute-mediation-request.html',\n  'ownership-change-notice.html',\n"
        )
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"✅ 已更新 output/{js_script}")
