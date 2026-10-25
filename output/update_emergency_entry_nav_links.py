#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次更新港居不動產全站 51 頁導覽列、頁尾與工具中心卡片
支援 Phase 72: emergency-entry-agreement.html
"""

import os
import re
import glob

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_HTML = "emergency-entry-agreement.html"
NEW_TOOL_NAME = "緊急避難開門授權協議書"
NEW_TOOL_ICON = "fa-door-open"
NEW_TOOL_ICON_COLOR = "#ef4444"

NAV_ITEM_ACTIVE = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link active"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'
NAV_ITEM_NORMAL = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'

FOOTER_LINK = f'<li><a href="{NEW_TOOL_HTML}">{NEW_TOOL_NAME}</a></li>'

TOOL_CARD = f'''        <!-- 0ze. 住宅租賃緊急避難與緊急開門進入授權協議書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #ef4444;">
              <i class="fa-solid {NEW_TOOL_ICON}"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>{NEW_TOOL_NAME}</h3>
            <p>依據《刑法》第24/306條及《民法》第150條，明定瓦斯外洩、失火、漏水爆管及失聯急難之第三方會同開門SOP與錄影存證。</p>
          </div>
          <a href="{NEW_TOOL_HTML}" class="tool-hub-btn">
            <span>立即產製協議書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>
'''

def update_index_html():
    index_path = os.path.join(WORKSPACE, "index.html")
    with open(index_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 更新數字 47 -> 48, 30 -> 31
    content = content.replace("全部工具中心 (47)", "全部工具中心 (48)")
    content = content.replace("全部工具 (47)", "全部工具 (48)")
    content = content.replace("房東節稅與法務 (30)", "房東節稅與法務 (31)")
    content = content.replace("專屬的 47 款高階數位工具系統", "專屬的 48 款高階數位工具系統")
    content = content.replace("本系列 47 款線上工具集", "本系列 48 款線上工具集")
    content = content.replace("首創 47 款全功能線上不動產工具集", "首創 48 款全功能線上不動產工具集")

    # 插入工具卡片 (若尚未存在)
    if NEW_TOOL_HTML not in content:
        target = '<!-- 0zd. 住宅租賃租約公證聲請暨逕受強制執行約定書產生器 -->'
        if target in content:
            content = content.replace(target, TOOL_CARD + "\n" + target)
            print("  ✅ index.html: 成功插入工具卡片")
        else:
            print("  ⚠️ index.html: 找不到 0zd 標記，改於 toolsHubGrid 開頭插入")
            content = content.replace('<div class="tools-hub-grid" id="toolsHubGrid">', '<div class="tools-hub-grid" id="toolsHubGrid">\n' + TOOL_CARD)

    with open(index_path, "w", encoding="utf-8") as fp:
        fp.write(content)

def update_all_html_files():
    html_files = glob.glob(os.path.join(WORKSPACE, "*.html"))
    print(f"盤點待更新 HTML 檔案數: {len(html_files)}")

    for fpath in html_files:
        fname = os.path.basename(fpath)
        with open(fpath, "r", encoding="utf-8") as fp:
            content = fp.read()

        changed = False

        # 1. 數字更新
        if "全部工具中心 (47)" in content:
            content = content.replace("全部工具中心 (47)", "全部工具中心 (48)")
            changed = True
        if "首創 47 款全功能線上不動產工具集" in content:
            content = content.replace("首創 47 款全功能線上不動產工具集", "首創 48 款全功能線上不動產工具集")
            changed = True

        # 2. 導覽列下拉選單更新
        nav_item_to_insert = NAV_ITEM_ACTIVE if fname == NEW_TOOL_HTML else NAV_ITEM_NORMAL
        if f'href="{NEW_TOOL_HTML}"' not in content:
            # 尋找插入錨點：在 lease-notarization-agreement.html 的前面插入
            pattern = r'(<li><a href="lease-notarization-agreement\.html"[^>]*>.*?</a></li>)'
            m = re.search(pattern, content)
            if m:
                target_str = m.group(1)
                replacement = f"{nav_item_to_insert}\n            {target_str}"
                content = content.replace(target_str, replacement, 1)
                changed = True
                print(f"  ✅ {fname}: 導覽列成功插入 {NEW_TOOL_NAME}")
            else:
                # 檢查是否為 watermark 工具的 <div class="nav-dropdown-menu"> 格式
                div_pattern = r'(<a href="lease-notarization-agreement\.html"[^>]*>.*?</a>)'
                div_m = re.search(div_pattern, content)
                if div_m:
                    div_target = div_m.group(1)
                    div_nav_item = f'<a href="{NEW_TOOL_HTML}" class="nav-link"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a>'
                    replacement = f"{div_nav_item}\n            {div_target}"
                    content = content.replace(div_target, replacement, 1)
                    changed = True
                    print(f"  ✅ {fname}: 導覽列(div格式)成功插入 {NEW_TOOL_NAME}")
                else:
                    print(f"  ⚠️ {fname}: 導覽列找不到插入錨點")

        # 3. 頁尾連結更新
        if f'href="{NEW_TOOL_HTML}"' not in content or fname == NEW_TOOL_HTML:
            # 如果頁尾中沒有此連結，尋找 房東法務專區 插入
            footer_pattern = r'(<div class="footer-col-title">房東法務專區</div>\s*<ul class="footer-links">\s*)(<li><a href="[^"]*">.*?</a></li>)'
            m = re.search(footer_pattern, content)
            if m:
                # 檢查 footer 內是否已有此連結
                if f'href="{NEW_TOOL_HTML}"' not in m.group(0):
                    prefix = m.group(1)
                    first_link = m.group(2)
                    replacement = f"{prefix}<li><a href=\"{NEW_TOOL_HTML}\">{NEW_TOOL_NAME}</a></li>\n            {first_link}"
                    content = content.replace(m.group(0), replacement, 1)
                    changed = True
                    print(f"  ✅ {fname}: 頁尾成功插入 {NEW_TOOL_NAME}")

        if changed:
            with open(fpath, "w", encoding="utf-8") as fp:
                fp.write(content)

def update_sitemap():
    sitemap_path = os.path.join(WORKSPACE, "sitemap.xml")
    with open(sitemap_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    if NEW_TOOL_HTML not in content:
        url_entry = f'''  <url>
    <loc>https://ganggo880.github.io/ganju-website/{NEW_TOOL_HTML}</loc>
    <lastmod>2026-10-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
</urlset>'''
        content = content.replace('</urlset>', url_entry)
        with open(sitemap_path, "w", encoding="utf-8") as fp:
            fp.write(content)
        print("  ✅ sitemap.xml: 成功加入新頁面")
    else:
        print("  ℹ️ sitemap.xml: 已存在新頁面")

def update_sw():
    sw_path = os.path.join(WORKSPACE, "sw.js")
    with open(sw_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 升級版本號
    content = re.sub(r'ganju-pwa-v\d+\.\d+', 'ganju-pwa-v5.3', content)

    # 加入預載清單
    new_assets = f'''  './{NEW_TOOL_HTML}',
  './css/{NEW_TOOL_HTML.replace(".html", ".css")}',
  './js/{NEW_TOOL_HTML.replace(".html", ".js")}',
'''
    if f'./{NEW_TOOL_HTML}' not in content:
        target = "  './lease-notarization-agreement.html',"
        if target in content:
            content = content.replace(target, new_assets + target)
            print("  ✅ sw.js: 成功加入預載快取資源與升級版本為 ganju-pwa-v5.3")
        else:
            print("  ⚠️ sw.js: 找不到插入錨點")

    with open(sw_path, "w", encoding="utf-8") as fp:
        fp.write(content)

if __name__ == "__main__":
    print("🚀 開始執行全站更新以整合 Phase 72: emergency-entry-agreement.html...")
    update_index_html()
    update_all_html_files()
    update_sitemap()
    update_sw()
    print("✨ 全站更新完成！")
