#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次更新港居不動產全站 50 頁導覽列、頁尾與工具中心卡片
支援 Phase 71: lease-notarization-agreement.html
"""

import os
import re
import glob

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_HTML = "lease-notarization-agreement.html"
NEW_TOOL_NAME = "租約公證暨強執約定書"
NEW_TOOL_ICON = "fa-stamp"
NEW_TOOL_ICON_COLOR = "#c5a059"

NAV_ITEM_ACTIVE = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link active"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'
NAV_ITEM_NORMAL = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'

FOOTER_LINK = f'<li><a href="{NEW_TOOL_HTML}">{NEW_TOOL_NAME}</a></li>'

TOOL_CARD = f'''        <!-- 0zd. 住宅租賃租約公證聲請暨逕受強制執行約定書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: var(--accent-gold);">
              <i class="fa-solid {NEW_TOOL_ICON}"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>{NEW_TOOL_NAME}</h3>
            <p>依據《公證法》第13條及第109條，載明租期屆滿騰空交還、欠租違約金逕受強制執行特約，公證費孰高精算與雙方電子簽章。</p>
          </div>
          <a href="{NEW_TOOL_HTML}" class="tool-hub-btn">
            <span>立即產製約定書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>
'''

def update_index_html():
    index_path = os.path.join(WORKSPACE, "index.html")
    with open(index_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 更新數字 46 -> 47, 29 -> 30
    content = content.replace("全部工具中心 (46)", "全部工具中心 (47)")
    content = content.replace("全部工具 (46)", "全部工具 (47)")
    content = content.replace("房東節稅與法務 (29)", "房東節稅與法務 (30)")
    content = content.replace("專屬的 46 款高階數位工具系統", "專屬的 47 款高階數位工具系統")
    content = content.replace("本系列 46 款線上工具集", "本系列 47 款線上工具集")
    content = content.replace("首創 46 款全功能線上不動產工具集", "首創 47 款全功能線上不動產工具集")

    # 插入工具卡片 (若尚未存在)
    if NEW_TOOL_HTML not in content:
        target = '<!-- 0zc. 住宅租賃設籍約定暨退租遷出切結書產生器 -->'
        if target in content:
            content = content.replace(target, TOOL_CARD + "\n" + target)
            print("  ✅ index.html: 成功插入工具卡片")
        else:
            print("  ⚠️ index.html: 找不到 0zc 標記，改於 toolsHubGrid 開頭插入")
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
        if "全部工具中心 (46)" in content:
            content = content.replace("全部工具中心 (46)", "全部工具中心 (47)")
            changed = True
        if "首創 46 款全功能線上不動產工具集" in content:
            content = content.replace("首創 46 款全功能線上不動產工具集", "首創 47 款全功能線上不動產工具集")
            changed = True

        # 2. 導覽列下拉選單更新
        nav_item_to_insert = NAV_ITEM_ACTIVE if fname == NEW_TOOL_HTML else NAV_ITEM_NORMAL
        if f'href="{NEW_TOOL_HTML}"' not in content:
            # 尋找插入錨點：在 household-registration-agreement.html 的前面插入
            pattern = r'(<li><a href="household-registration-agreement\.html"[^>]*>.*?</a></li>)'
            m = re.search(pattern, content)
            if m:
                target_str = m.group(1)
                replacement = f"{nav_item_to_insert}\n            {target_str}"
                content = content.replace(target_str, replacement, 1)
                changed = True
                print(f"  ✅ {fname}: 導覽列成功插入 {NEW_TOOL_NAME}")
            else:
                print(f"  ⚠️ {fname}: 導覽列找不到插入錨點")

        # 3. 頁尾更新
        if f'<li><a href="{NEW_TOOL_HTML}">' not in content:
            # 尋找插入錨點：在 <li><a href="household-registration-agreement.html">設籍約定暨遷出切結書</a></li> 前面插入
            footer_pattern = r'(<li><a href="household-registration-agreement\.html">設籍約定暨遷出切結書</a></li>)'
            m = re.search(footer_pattern, content)
            if m:
                target_str = m.group(1)
                replacement = f"{FOOTER_LINK}\n            {target_str}"
                content = content.replace(target_str, replacement, 1)
                changed = True
                print(f"  ✅ {fname}: 頁尾成功插入 {NEW_TOOL_NAME}")
            else:
                print(f"  ⚠️ {fname}: 頁尾找不到插入錨點")

        if changed:
            with open(fpath, "w", encoding="utf-8") as fp:
                fp.write(content)

def update_sitemap():
    sitemap_path = os.path.join(WORKSPACE, "sitemap.xml")
    with open(sitemap_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    if NEW_TOOL_HTML not in content:
        target = '</urlset>'
        entry = f"""  <url>
    <loc>https://ganggo880.github.io/ganju-website/{NEW_TOOL_HTML}</loc>
    <lastmod>2026-10-26</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
</urlset>"""
        content = content.replace(target, entry)
        with open(sitemap_path, "w", encoding="utf-8") as fp:
            fp.write(content)
        print("  ✅ sitemap.xml: 成功加入條目")

def update_sw():
    sw_path = os.path.join(WORKSPACE, "sw.js")
    with open(sw_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 升級快取版本
    content = re.sub(r'ganju-pwa-v\d+\.\d+', 'ganju-pwa-v5.2', content)

    # 插入資產清單 (如果尚未存在)
    if NEW_TOOL_HTML not in content:
        target = "'household-registration-agreement.html',"
        replacement = f"'{NEW_TOOL_HTML}',\n  'css/{NEW_TOOL_HTML.replace('.html', '.css')}',\n  'js/{NEW_TOOL_HTML.replace('.html', '.js')}',\n  {target}"
        content = content.replace(target, replacement)
        print("  ✅ sw.js: 成功加入 PWA 預載資產")

    with open(sw_path, "w", encoding="utf-8") as fp:
        fp.write(content)

if __name__ == "__main__":
    print("🚀 開始執行全站 50 頁導覽與資產更新作業...")
    update_index_html()
    update_all_html_files()
    update_sitemap()
    update_sw()
    print("🎉 更新作業完成！")
