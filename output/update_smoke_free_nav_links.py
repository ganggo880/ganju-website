#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批次更新港居不動產全站 52 頁導覽列、頁尾與工具中心卡片
支援 Phase 73: smoke-free-agreement.html
"""

import os
import re
import glob

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NEW_TOOL_HTML = "smoke-free-agreement.html"
NEW_TOOL_NAME = "無菸住宅全面禁菸承諾書"
NEW_TOOL_ICON = "fa-ban-smoking"
NEW_TOOL_ICON_COLOR = "#ef4444"

NAV_ITEM_ACTIVE = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link active"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'
NAV_ITEM_NORMAL = f'<li><a href="{NEW_TOOL_HTML}" class="nav-link"><i class="fa-solid {NEW_TOOL_ICON}" style="color: {NEW_TOOL_ICON_COLOR};"></i> {NEW_TOOL_NAME}</a></li>'

FOOTER_LINK = f'<li><a href="{NEW_TOOL_HTML}">{NEW_TOOL_NAME}</a></li>'

TOOL_CARD = f'''        <!-- 0zf. 住宅租賃無菸住宅（全面禁菸）特約承諾書產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #ef4444;">
              <i class="fa-solid {NEW_TOOL_ICON}"></i>
            </div>
            <span class="tool-hub-badge locked"><i class="fa-solid fa-lock"></i> 內部特約</span>
          </div>
          <div class="tool-hub-body">
            <h3>{NEW_TOOL_NAME}</h3>
            <p>依據《菸害防制法》第18/19/20條與《民法》第432條，傳統紙菸、電子煙與加熱菸全面管制，設定三級處置罰則與除味清消粉刷賠償。</p>
          </div>
          <a href="{NEW_TOOL_HTML}" class="tool-hub-btn">
            <span>立即產製承諾書</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>
'''

def update_index_html():
    index_path = os.path.join(WORKSPACE, "index.html")
    with open(index_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 更新數字 48 -> 49, 31 -> 32
    content = content.replace("全部工具中心 (48)", "全部工具中心 (49)")
    content = content.replace("全部工具 (48)", "全部工具 (49)")
    content = content.replace("房東節稅與法務 (31)", "房東節稅與法務 (32)")
    content = content.replace("專屬的 48 款高階數位工具系統", "專屬的 49 款高階數位工具系統")
    content = content.replace("本系列 48 款線上工具集", "本系列 49 款線上工具集")
    content = content.replace("首創 48 款全功能線上不動產工具集", "首創 49 款全功能線上不動產工具集")

    # 插入工具卡片 (若尚未存在)
    if NEW_TOOL_HTML not in content:
        target = '<!-- 0ze. 住宅租賃緊急避難與緊急開門進入授權協議書產生器 -->'
        if target in content:
            content = content.replace(target, TOOL_CARD + "\n" + target)
            print("  ✅ index.html: 成功插入無菸承諾書工具卡片")
        else:
            print("  ⚠️ index.html: 找不到 0ze 標記，改於 toolsHubGrid 開頭插入")
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
        if "全部工具中心 (48)" in content:
            content = content.replace("全部工具中心 (48)", "全部工具中心 (49)")
            changed = True
        if "首創 48 款全功能線上不動產工具集" in content:
            content = content.replace("首創 48 款全功能線上不動產工具集", "首創 49 款全功能線上不動產工具集")
            changed = True

        # 2. 導覽列下拉選單更新
        nav_item_to_insert = NAV_ITEM_ACTIVE if fname == NEW_TOOL_HTML else NAV_ITEM_NORMAL
        if f'href="{NEW_TOOL_HTML}"' not in content:
            # 尋找插入錨點：在 emergency-entry-agreement.html 的前面插入
            pattern = r'(<li><a href="emergency-entry-agreement\.html"[^>]*>.*?</a></li>)'
            m = re.search(pattern, content)
            if m:
                target_str = m.group(1)
                replacement = f"{nav_item_to_insert}\n            {target_str}"
                content = content.replace(target_str, replacement, 1)
                changed = True
                print(f"  ✅ {fname}: 導覽列成功插入 {NEW_TOOL_NAME}")
            else:
                # 檢查是否為 watermark 工具的 <div class="nav-dropdown-menu"> 格式
                div_pattern = r'(<a href="emergency-entry-agreement\.html"[^>]*>.*?</a>)'
                m_div = re.search(div_pattern, content)
                if m_div:
                    target_div = m_div.group(1)
                    div_active = ' active' if fname == NEW_TOOL_HTML else ''
                    div_replacement = f'<a href="{NEW_TOOL_HTML}" class="dropdown-item{div_active}"><i class="fa-solid {NEW_TOOL_ICON}"></i> {NEW_TOOL_NAME}</a>\n              {target_div}'
                    content = content.replace(target_div, div_replacement, 1)
                    changed = True
                    print(f"  ✅ {fname} (div): 導覽列成功插入 {NEW_TOOL_NAME}")

        # 3. 頁尾「房東法務專區」連結更新
        if f'href="{NEW_TOOL_HTML}"' not in content:
            footer_pattern = r'(<li><a href="emergency-entry-agreement\.html">.*?</a></li>)'
            m_f = re.search(footer_pattern, content)
            if m_f:
                target_footer = m_f.group(1)
                replacement_f = f"{FOOTER_LINK}\n            {target_footer}"
                content = content.replace(target_footer, replacement_f, 1)
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
    <lastmod>2026-10-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""
        content = content.replace("</urlset>", entry)
        with open(sitemap_path, "w", encoding="utf-8") as fp:
            fp.write(content)
        print("  ✅ sitemap.xml: 成功新增 URL 項目")
    else:
        print("  ℹ️ sitemap.xml: 已包含 URL 項目")

def update_service_worker():
    sw_path = os.path.join(WORKSPACE, "sw.js")
    with open(sw_path, "r", encoding="utf-8") as fp:
        content = fp.read()

    # 升級快取版本至 v5.4
    content = re.sub(r"ganju-pwa-v\d+\.\d+", "ganju-pwa-v5.4", content)

    # 插入快取資產
    assets_to_add = [
        f"  './{NEW_TOOL_HTML}',",
        f"  './css/{NEW_TOOL_HTML.replace('.html', '.css')}',",
        f"  './js/{NEW_TOOL_HTML.replace('.html', '.js')}',"
    ]

    new_assets_str = "\n".join(assets_to_add)

    if NEW_TOOL_HTML not in content:
        anchor = "  './emergency-entry-agreement.html',"
        if anchor in content:
            content = content.replace(anchor, f"{new_assets_str}\n{anchor}")
            print("  ✅ sw.js: 成功插入 PWA 離線快取資產與升級 v5.4")
        else:
            print("  ⚠️ sw.js: 找不到 anchor，請手動確認")

    with open(sw_path, "w", encoding="utf-8") as fp:
        fp.write(content)

if __name__ == "__main__":
    print("🚀 開始執行 Phase 73 全站同步腳本...")
    update_index_html()
    update_all_html_files()
    update_sitemap()
    update_service_worker()
    print("✨ 全站同步完成！")
