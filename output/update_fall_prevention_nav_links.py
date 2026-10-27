#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次更新港居不動產全站 58 頁導覽列、頁尾與工具中心卡片
支援 Phase 79: fall-prevention-agreement.html
"""

import os
import re
import glob

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_HTML = "fall-prevention-agreement.html"
NEW_TOOL_NAME = "陽台窗戶防墜安全切結書"
NEW_TOOL_ICON = "fa-person-falling-burst"
NEW_TOOL_ICON_COLOR = "#14b8a6"

NAV_ITEM_ACTIVE = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link active"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'
NAV_ITEM_NORMAL = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'

FOOTER_LINK = f'<li><a href="{NEW_TOOL_HTML}">{NEW_TOOL_NAME}</a></li>'

TOOL_CARD = f'''        <!-- 0zl. 住宅租賃陽台窗戶防墜安全與隱形鐵窗特約切結書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: {NEW_TOOL_ICON_COLOR};">
              <i class="fa-solid {NEW_TOOL_ICON}"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>{NEW_TOOL_NAME}</h3>
            <p>依據《公寓大廈管理條例》第8條第2項與《兒少法》第51條，規範既有防墜保管與自費增設隱形鐵窗三模式、窗邊80cm禁擺攀爬家具、火警逃生鋼絲剪保管與免責切結。</p>
          </div>
          <a href="{NEW_TOOL_HTML}" class="tool-hub-btn">
            <span>立即產製切結書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>
'''

def update_index_html():
    index_path = os.path.join(WORKSPACE, "index.html")
    with open(index_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 更新數字 54 -> 55, 37 -> 38
    content = content.replace("全部工具中心 (54)", "全部工具中心 (55)")
    content = content.replace("全部工具 (54)", "全部工具 (55)")
    content = content.replace("房東節稅與法務 (37)", "房東節稅與法務 (38)")
    content = content.replace("專屬的 54 款高階數位工具系統", "專屬的 55 款高階數位工具系統")
    content = content.replace("本系列 54 款線上工具集", "本系列 55 款線上工具集")
    content = content.replace("首創 54 款全功能線上不動產工具集", "首創 55 款全功能線上不動產工具集")

    # 插入工具卡片 (若尚未存在)
    if NEW_TOOL_HTML not in content:
        target = '<!-- 0zk. 住宅租賃天然災害防汛防颱與緊急應變責任切結書產生器 -->'
        if target in content:
            content = content.replace(target, TOOL_CARD + "\n" + target)
            print("  ✅ index.html: 成功插入陽台窗戶防墜安全切結書工具卡片")
        else:
            print("  ⚠️ index.html: 找不到 0zk 標記，改於 toolsHubGrid 開頭插入")
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
        if "全部工具中心 (54)" in content:
            content = content.replace("全部工具中心 (54)", "全部工具中心 (55)")
            changed = True
        if "線上工具 (54)" in content:
            content = content.replace("線上工具 (54)", "線上工具 (55)")
            changed = True
        if "首創 54 款全功能線上不動產工具集" in content:
            content = content.replace("首創 54 款全功能線上不動產工具集", "首創 55 款全功能線上不動產工具集")
            changed = True

        # 2. 導覽列下拉選單更新
        nav_item_to_insert = NAV_ITEM_ACTIVE if fname == NEW_TOOL_HTML else NAV_ITEM_NORMAL
        if f'href="{NEW_TOOL_HTML}"' not in content:
            # 尋找插入錨點：在 disaster-prevention-agreement.html 的前面插入
            pattern = r'(<li><a href="disaster-prevention-agreement\.html"[^>]*>.*?</a></li>)'
            m = re.search(pattern, content)
            if m:
                target_str = m.group(1)
                replacement = f"{nav_item_to_insert}\n            {target_str}"
                content = content.replace(target_str, replacement, 1)
                changed = True
                print(f"  ✅ {fname}: 導覽列成功插入 {NEW_TOOL_NAME}")
            else:
                # watermark 工具的 <div class="nav-dropdown-menu"> 格式
                pattern2 = r'(<a href="disaster-prevention-agreement\.html"[^>]*>.*?</a>)'
                m2 = re.search(pattern2, content)
                if m2:
                    t2 = m2.group(1)
                    r2 = f'<a href="{NEW_TOOL_HTML}" class="dropdown-link"><i class="fa-solid {NEW_TOOL_ICON}"></i> {NEW_TOOL_NAME}</a>\n          {t2}'
                    content = content.replace(t2, r2, 1)
                    changed = True
                    print(f"  ✅ {fname}: 水印導覽列成功插入 {NEW_TOOL_NAME}")

        # 3. 頁尾房東法務專區更新
        if FOOTER_LINK not in content:
            target_footer = '<li><a href="disaster-prevention-agreement.html">防汛防颱緊急應變切結書</a></li>'
            if target_footer in content:
                content = content.replace(target_footer, f"{FOOTER_LINK}\n            {target_footer}")
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
        entry = f"""  <url>
    <loc>https://ganggo880.github.io/ganju-website/{NEW_TOOL_HTML}</loc>
    <lastmod>2026-10-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
"""
        target = '  <url>\n    <loc>https://ganggo880.github.io/ganju-website/disaster-prevention-agreement.html</loc>'
        if target in content:
            content = content.replace(target, entry + target)
            print("  ✅ sitemap.xml: 成功插入新頁面 URL")
        else:
            content = content.replace('</urlset>', entry + '</urlset>')
            print("  ✅ sitemap.xml: 尾端插入新頁面 URL")

        with open(sitemap_path, "w", encoding="utf-8") as fp:
            fp.write(content)

def update_service_worker():
    sw_path = os.path.join(WORKSPACE, "sw.js")
    with open(sw_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 升級快取版本
    content = re.sub(r"const CACHE_NAME = 'ganju-pwa-v\d+\.\d+';", "const CACHE_NAME = 'ganju-pwa-v6.0';", content)

    # 插入預載資產
    if f"'./{NEW_TOOL_HTML}'" not in content:
        target = "  './disaster-prevention-agreement.html',"
        new_assets = f"""  './{NEW_TOOL_HTML}',
  './css/{os.path.splitext(NEW_TOOL_HTML)[0]}.css',
  './js/{os.path.splitext(NEW_TOOL_HTML)[0]}.js',"""
        if target in content:
            content = content.replace(target, f"{new_assets}\n{target}")
            print("  ✅ sw.js: 成功插入 3 項離線快取資產並升級至 ganju-pwa-v6.0")
        else:
            print("  ⚠️ sw.js 找不到插入目標，請手動確認")

    with open(sw_path, "w", encoding="utf-8") as fp:
        fp.write(content)

if __name__ == '__main__':
    print("=== 開始執行 Phase 79 全站導覽列與資產清單更新 ===")
    update_index_html()
    update_all_html_files()
    update_sitemap()
    update_service_worker()
    print("=== Phase 79 批次更新完成 ===")
