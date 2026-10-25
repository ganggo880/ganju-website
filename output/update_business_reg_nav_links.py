#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml、sw.js 與自動化稽核套件
納入 Phase 68「住宅租賃設址營業與稅賦補償協議書產生器」(business-registration-agreement.html)
"""

import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "business-registration-agreement.html"
NEW_TOOL_TITLE = "設址營業與稅賦補償協議"
NEW_TOOL_ICON = "fa-file-invoice-dollar"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="business-registration-agreement.html" class="nav-link"><i class="fa-solid fa-file-invoice-dollar" style="color: #63b3ed;"></i> 設址營業與稅賦補償協議</a></li>\n            '
footer_link_snippet = '<li><a href="business-registration-agreement.html">設址營業與稅賦補償協議</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "business-registration-agreement.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (43) -> (44)
    content = content.replace("全部工具中心 (43)", "全部工具中心 (44)")

    if "business-registration-agreement.html" not in content:
        target_nav = '<li><a href="sublease-consent-agreement.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            target_direct = '<a href="sublease-consent-agreement.html"'
            if target_direct in content:
                direct_snippet = '<a href="business-registration-agreement.html" class="nav-link"><i class="fa-solid fa-file-invoice-dollar" style="color: #63b3ed;"></i> 設址營業與稅賦補償協議</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="ownership-change-notice.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        target_footer = '<li><a href="sublease-consent-agreement.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="ownership-change-notice.html">'
            if target_footer2 in content:
                content = content.replace(target_footer2, footer_link_snippet + target_footer2)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {updated_nav_count} 個 HTML 頁面的導覽列與頁尾連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

idx_content = idx_content.replace("全部工具 (43)", "全部工具 (44)")
idx_content = idx_content.replace("房東節稅與法務 (26)", "房東節稅與法務 (27)")
idx_content = idx_content.replace("本系列 43 款線上工具集", "本系列 44 款線上工具集")
idx_content = idx_content.replace("專屬的 43 款高階數位工具系統", "專屬的 44 款高階數位工具系統")

tool_card_snippet = """        <!-- 0za. 住宅租賃設址營業與稅賦補償協議書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #0284c7;">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>設址營業與稅賦補償協議</h3>
            <p>依據所得稅法與房屋稅條例合規設計，特約許可設址稅差精算與嚴禁設址雙模式、限期遷址切結、雙方電子手寫簽章與A4無痕列印。</p>
          </div>
          <a href="business-registration-agreement.html" class="tool-hub-btn">
            <span>立即產製協議書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if 'href="business-registration-agreement.html" class="tool-hub-btn"' not in idx_content:
    target_pos = idx_content.find('<!-- 0z. 住宅租賃承租人轉租同意書與管理協議產生器 -->')
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
    <loc>https://ganggo880.github.io/ganju-website/business-registration-agreement.html</loc>
    <lastmod>2026-10-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if "business-registration-agreement.html" not in sm_content:
    sm_content = sm_content.replace("</urlset>", sitemap_snippet + "</urlset>")
    with open(sitemap_path, 'w', encoding='utf-8') as f:
        f.write(sm_content)
    print("✅ 已更新 sitemap.xml 加入 business-registration-agreement.html")

# 4. 更新 sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

sw_content = sw_content.replace("ganju-pwa-v4.8", "ganju-pwa-v4.9")

if "'./business-registration-agreement.html'" not in sw_content:
    sw_content = sw_content.replace(
        "  './sublease-consent-agreement.html',\n",
        "  './business-registration-agreement.html',\n  './sublease-consent-agreement.html',\n"
    )

if "'./css/business-registration-agreement.css'" not in sw_content:
    sw_content = sw_content.replace(
        "  './css/sublease-consent-agreement.css',\n",
        "  './css/business-registration-agreement.css',\n  './css/sublease-consent-agreement.css',\n"
    )

if "'./js/business-registration-agreement.js'" not in sw_content:
    sw_content = sw_content.replace(
        "  './js/sublease-consent-agreement.js',\n",
        "  './js/business-registration-agreement.js',\n  './js/sublease-consent-agreement.js',\n"
    )

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已更新 sw.js 升級至 ganju-pwa-v4.9 並納入快取清單")

# 5. 更新 4 大自動化稽核腳本
for py_script in ["audit_site_specs.py", "verify_project_health.py"]:
    p = os.path.join(ROOT, "output", py_script)
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    if '"business-registration-agreement.html"' not in c:
        c = c.replace(
            '    "sublease-consent-agreement.html",\n',
            '    "sublease-consent-agreement.html",\n    "business-registration-agreement.html",\n'
        )
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"✅ 已更新 output/{py_script}")

for js_script in ["audit_mobile_rwd.js", "test_pwa_offline.js"]:
    p = os.path.join(ROOT, "output", js_script)
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    if "'business-registration-agreement.html'" not in c:
        c = c.replace(
            "  'sublease-consent-agreement.html',\n",
            "  'sublease-consent-agreement.html',\n  'business-registration-agreement.html',\n"
        )
        with open(p, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"✅ 已更新 output/{js_script}")
