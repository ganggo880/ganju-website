#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動更新全站 HTML 頁面、sitemap.xml、sw.js 與自動化稽核套件
納入 Phase 70「住宅租賃設籍約定暨退租遷出切結書產生器」(household-registration-agreement.html)
"""

import os
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_FILE = "household-registration-agreement.html"
NEW_TOOL_TITLE = "設籍約定暨遷出切結書"
NEW_TOOL_ICON = "fa-id-badge"

# 1. 更新所有 HTML 檔案之導覽列下拉選單與頁尾連結
html_files = [f for f in glob.glob(os.path.join(ROOT, "*.html")) if not f.endswith("island_standalone.html")]

nav_link_snippet = '<li><a href="household-registration-agreement.html" class="nav-link"><i class="fa-solid fa-id-badge" style="color: #3b82f6;"></i> 設籍約定暨遷出切結書</a></li>\n            '
footer_link_snippet = '<li><a href="household-registration-agreement.html">設籍約定暨遷出切結書</a></li>\n            '

updated_nav_count = 0

for fpath in html_files:
    fname = os.path.basename(fpath)
    if fname == "household-registration-agreement.html":
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 更新全部工具中心計數 (45) -> (46)
    content = content.replace("全部工具中心 (45)", "全部工具中心 (46)")

    if "household-registration-agreement.html" not in content:
        target_nav = '<li><a href="fire-safety-agreement.html"'
        if target_nav in content:
            content = content.replace(target_nav, nav_link_snippet + target_nav)
            updated_nav_count += 1
        else:
            target_direct = '<a href="fire-safety-agreement.html"'
            if target_direct in content:
                direct_snippet = '<a href="household-registration-agreement.html" class="nav-link"><i class="fa-solid fa-id-badge" style="color: #3b82f6;"></i> 設籍約定暨遷出切結書</a>\n          '
                content = content.replace(target_direct, direct_snippet + target_direct)
                updated_nav_count += 1
            else:
                target2 = '<li><a href="business-registration-agreement.html"'
                if target2 in content:
                    content = content.replace(target2, nav_link_snippet + target2)
                    updated_nav_count += 1

        target_footer = '<li><a href="fire-safety-agreement.html">'
        if target_footer in content:
            content = content.replace(target_footer, footer_link_snippet + target_footer)
        else:
            target_footer2 = '<li><a href="business-registration-agreement.html">'
            if target_footer2 in content:
                content = content.replace(target_footer2, footer_link_snippet + target_footer2)

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"✅ 已更新 {updated_nav_count} 個 HTML 頁面的導覽列與頁尾連結")

# 2. 更新 index.html 中的工具中心卡片
index_path = os.path.join(ROOT, "index.html")
with open(index_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

idx_content = idx_content.replace("全部工具 (45)", "全部工具 (46)")
idx_content = idx_content.replace("房東節稅與法務 (28)", "房東節稅與法務 (29)")
idx_content = idx_content.replace("本系列 45 款線上工具集", "本系列 46 款線上工具集")
idx_content = idx_content.replace("專屬的 45 款高階數位工具系統", "專屬的 46 款高階數位工具系統")

tool_card_snippet = """        <!-- 0zc. 住宅租賃設籍約定暨退租遷出切結書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #3b82f6;">
              <i class="fa-solid fa-id-badge"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>設籍約定暨遷出切結書</h3>
            <p>符合戶籍法第50條與定型化契約規範，設籍名冊登記、退租限期遷出、每日違約金精算、授權逕為遷徙與雙方電子簽章。</p>
          </div>
          <a href="household-registration-agreement.html" class="tool-hub-btn">
            <span>立即產製切結書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

"""

if 'href="household-registration-agreement.html" class="tool-hub-btn"' not in idx_content:
    target_pos = idx_content.find('<!-- 0zb. 住宅租賃用電用火安全暨失火責任切結協議書產生器 -->')
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
    <loc>https://ganggo880.github.io/ganju-website/household-registration-agreement.html</loc>
    <lastmod>2026-10-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
"""

if 'household-registration-agreement.html' not in sm_content:
    closing_tag = '</urlset>'
    if closing_tag in sm_content:
        sm_content = sm_content.replace(closing_tag, sitemap_snippet + closing_tag)
        with open(sitemap_path, 'w', encoding='utf-8') as f:
            f.write(sm_content)
        print("✅ 已更新 sitemap.xml 納入 household-registration-agreement.html")

# 4. 更新 sw.js 升級快取與預載清單
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, 'r', encoding='utf-8') as f:
    sw_content = f.read()

sw_content = sw_content.replace("ganju-pwa-v5.0", "ganju-pwa-v5.1")

sw_assets_snippet = """  './household-registration-agreement.html',
  './css/household-registration-agreement.css',
  './js/household-registration-agreement.js',
"""

if "'./household-registration-agreement.html'" not in sw_content:
    target_sw = "'./fire-safety-agreement.html',"
    if target_sw in sw_content:
        sw_content = sw_content.replace(target_sw, sw_assets_snippet + "  " + target_sw)
    else:
        target_sw2 = "];"
        idx = sw_content.find(target_sw2)
        if idx != -1:
            sw_content = sw_content[:idx] + sw_assets_snippet + sw_content[idx:]

with open(sw_path, 'w', encoding='utf-8') as f:
    f.write(sw_content)

print("✅ 已升級 sw.js 至 ganju-pwa-v5.1 並預載核心資產")

# 5. 更新 output/audit_site_specs.py
specs_path = os.path.join(ROOT, "output", "audit_site_specs.py")
if os.path.exists(specs_path):
    with open(specs_path, 'r', encoding='utf-8') as f:
        spec_content = f.read()
    
    spec_content = spec_content.replace("EXPECTED_PAGES_COUNT = 48", "EXPECTED_PAGES_COUNT = 49")
    spec_content = spec_content.replace("48 個頁面", "49 個頁面")
    
    if "'household-registration-agreement.html'" not in spec_content:
        target_spec = "'fire-safety-agreement.html',"
        if target_spec in spec_content:
            spec_content = spec_content.replace(target_spec, "'household-registration-agreement.html',\n    " + target_spec)
            
    with open(specs_path, 'w', encoding='utf-8') as f:
        f.write(spec_content)
    print("✅ 已更新 output/audit_site_specs.py 預期頁面數 (49)")

# 6. 更新 output/verify_project_health.py
health_path = os.path.join(ROOT, "output", "verify_project_health.py")
if os.path.exists(health_path):
    with open(health_path, 'r', encoding='utf-8') as f:
        health_content = f.read()
    
    health_content = health_content.replace("expected_page_count = 48", "expected_page_count = 49")
    health_content = health_content.replace("EXPECTED_PAGES = 48", "EXPECTED_PAGES = 49")
    health_content = health_content.replace("48 頁", "49 頁")
    health_content = health_content.replace("全站 48 頁", "全站 49 頁")
    
    with open(health_path, 'w', encoding='utf-8') as f:
        f.write(health_content)
    print("✅ 已更新 output/verify_project_health.py 頁面預期數 (49)")

# 7. 更新 output/test_pwa_offline.js
pwa_test_path = os.path.join(ROOT, "output", "test_pwa_offline.js")
if os.path.exists(pwa_test_path):
    with open(pwa_test_path, 'r', encoding='utf-8') as f:
        pwa_content = f.read()
    
    if "'household-registration-agreement.html'" not in pwa_content:
        target_pwa = "'fire-safety-agreement.html',"
        if target_pwa in pwa_content:
            pwa_content = pwa_content.replace(target_pwa, "'household-registration-agreement.html',\n  " + target_pwa)
            
    with open(pwa_test_path, 'w', encoding='utf-8') as f:
        f.write(pwa_content)
    print("✅ 已更新 output/test_pwa_offline.js 測試清單")

# 8. 更新 output/audit_mobile_rwd.js
rwd_test_path = os.path.join(ROOT, "output", "audit_mobile_rwd.js")
if os.path.exists(rwd_test_path):
    with open(rwd_test_path, 'r', encoding='utf-8') as f:
        rwd_content = f.read()
    
    if "'household-registration-agreement.html'" not in rwd_content:
        target_rwd = "'fire-safety-agreement.html',"
        if target_rwd in rwd_content:
            rwd_content = rwd_content.replace(target_rwd, "'household-registration-agreement.html',\n  " + target_rwd)
            
    with open(rwd_test_path, 'w', encoding='utf-8') as f:
        f.write(rwd_content)
    print("✅ 已更新 output/audit_mobile_rwd.js 測試清單")

print("🎉 全站關聯組件與測試套件自動更新完畢！")
