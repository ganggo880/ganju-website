#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全面清理與標準化全站 52 頁的導覽列下拉選單與頁尾房東法務專區連結，
去除重複連結，確保全站 100% 乾淨規範。
支援 Phase 73: smoke-free-agreement.html
"""

import os
import glob
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CANONICAL_DROPDOWN_ITEMS = """            <li><a href="index.html#tools" class="nav-link" style="color: var(--accent-gold); font-weight: 700;"><i class="fa-solid fa-table-cells"></i> 全部工具中心 (49)</a></li>
            <li><a href="island.html" class="nav-link" target="_blank"><i class="fa-solid fa-cube" style="color: #00e5ff;"></i> 3D 智慧營運島 (數位孿生)</a></li>
            <li><a href="smoke-free-agreement.html" class="nav-link"><i class="fa-solid fa-ban-smoking" style="color: #ef4444;"></i> 無菸住宅全面禁菸承諾書</a></li>
            <li><a href="emergency-entry-agreement.html" class="nav-link"><i class="fa-solid fa-door-open" style="color: #ef4444;"></i> 緊急避難開門授權協議書</a></li>
            <li><a href="lease-notarization-agreement.html" class="nav-link"><i class="fa-solid fa-stamp" style="color: #c5a059;"></i> 租約公證暨強執約定書</a></li>
            <li><a href="household-registration-agreement.html" class="nav-link"><i class="fa-solid fa-id-badge" style="color: #3b82f6;"></i> 設籍約定暨遷出切結書</a></li>
            <li><a href="fire-safety-agreement.html" class="nav-link"><i class="fa-solid fa-fire-extinguisher" style="color: #EF4444;"></i> 用電用火安全切結協議</a></li>
            <li><a href="business-registration-agreement.html" class="nav-link"><i class="fa-solid fa-file-invoice-dollar" style="color: var(--accent-gold);"></i> 設址營業與稅賦補償協議</a></li>
            <li><a href="sublease-consent-agreement.html" class="nav-link"><i class="fa-solid fa-people-arrows" style="color: #63b3ed;"></i> 承租人轉租同意與協議書</a></li>
            <li><a href="ownership-change-notice.html" class="nav-link"><i class="fa-solid fa-house-chimney-user" style="color: #63b3ed;"></i> 買賣不破租賃與押金移轉通知</a></li>
            <li><a href="dispute-mediation-request.html" class="nav-link"><i class="fa-solid fa-scale-unbalanced-flip" style="color: #63b3ed;"></i> 租賃爭議調處與調解聲請</a></li>
            <li><a href="arrears-installment-agreement.html" class="nav-link"><i class="fa-solid fa-handshake-simple" style="color: #63b3ed;"></i> 欠租分期清償和解協議</a></li>
            <li><a href="renovation-consent-agreement.html" class="nav-link"><i class="fa-solid fa-hammer" style="color: #63b3ed;"></i> 室內裝修改裝同意切結</a></li>
            <li><a href="parking-lease-agreement.html" class="nav-link"><i class="fa-solid fa-square-parking" style="color: #63b3ed;"></i> 汽機車停車位租用協議</a></li>
            <li><a href="pet-addendum-agreement.html" class="nav-link"><i class="fa-solid fa-paw" style="color: #f59e0b;"></i> 飼養寵物特約承諾書</a></li>
            <li><a href="roommate-agreement.html" class="nav-link"><i class="fa-solid fa-users" style="color: #63b3ed;"></i> 合租公約與承租協議</a></li>
            <li><a href="proxy-authorization.html" class="nav-link"><i class="fa-solid fa-signature" style="color: #63b3ed;"></i> 租賃代理授權委任書</a></li>
            <li><a href="rent-arrears-notice.html" class="nav-link"><i class="fa-solid fa-file-invoice-dollar" style="color: #63b3ed;"></i> 租金催繳與欠租催告書</a></li>
            <li><a href="rules-violation-notice.html" class="nav-link"><i class="fa-solid fa-triangle-exclamation" style="color: #63b3ed;"></i> 住戶違規改善通知單</a></li>
            <li><a href="abandoned-property-agreement.html" class="nav-link"><i class="fa-solid fa-file-signature" style="color: #63b3ed;"></i> 承租人遺留物拋棄切結</a></li>
            <li><a href="routine-inspection-report.html" class="nav-link"><i class="fa-solid fa-clipboard-check" style="color: #63b3ed;"></i> 屋況定期巡檢維護報告</a></li>
            <li><a href="tenant-check-in-form.html" class="nav-link"><i class="fa-solid fa-building-user" style="color: #63b3ed;"></i> 房客遷入登記與聯絡人卡</a></li>
            <li><a href="key-custody-agreement.html" class="nav-link"><i class="fa-solid fa-key" style="color: #63b3ed;"></i> 鑰匙借出保管與切結</a></li>
            <li><a href="holding-deposit-receipt.html" class="nav-link"><i class="fa-solid fa-receipt" style="color: #63b3ed;"></i> 租屋定金收據與切結</a></li>
            <li><a href="repair-work-order.html" class="nav-link"><i class="fa-solid fa-wrench" style="color: #63b3ed;"></i> 修繕派工與驗收單</a></li>
            <li><a href="guarantor-agreement.html" class="nav-link"><i class="fa-solid fa-user-shield" style="color: #63b3ed;"></i> 租賃連帶保證人切結書</a></li>
            <li><a href="mandate-contract.html" class="nav-link"><i class="fa-solid fa-handshake" style="color: #63b3ed;"></i> 租賃委託管理/包租契約</a></li>
            <li><a href="lease-contract.html" class="nav-link"><i class="fa-solid fa-file-signature" style="color: #63b3ed;"></i> 租約與住戶公約套印</a></li>
            <li><a href="tax-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #63b3ed;"></i> 房東節稅效益精算</a></li>
            <li><a href="repair-inspection.html" class="nav-link"><i class="fa-solid fa-clipboard-list" style="color: #63b3ed;"></i> 點交修繕瑕疵存證</a></li>
            <li><a href="utility-splitter.html" class="nav-link"><i class="fa-solid fa-bolt" style="color: #63b3ed;"></i> 分租水電公電分攤</a></li>
            <li><a href="deposit-settlement.html" class="nav-link"><i class="fa-solid fa-hand-holding-dollar" style="color: #63b3ed;"></i> 退租押金結算明細</a></li>
            <li><a href="rent-subsidy-checker.html" class="nav-link"><i class="fa-solid fa-house-chimney-crack" style="color: #63b3ed;"></i> 300億租補資格精算</a></li>
            <li><a href="rent-receipt.html" class="nav-link"><i class="fa-solid fa-receipt" style="color: #63b3ed;"></i> 租金收據與代管對帳</a></li>
            <li><a href="listing-post-generator.html" class="nav-link"><i class="fa-solid fa-bullhorn" style="color: #63b3ed;"></i> 591/社群招租文案</a></li>
            <li><a href="legal-notice-generator.html" class="nav-link"><i class="fa-solid fa-envelope-open-text" style="color: #63b3ed;"></i> 欠租催告存證信函</a></li>
            <li><a href="property-roi-calculator.html" class="nav-link"><i class="fa-solid fa-chart-line" style="color: #63b3ed;"></i> 物業淨投報與房貸精算</a></li>
            <li><a href="viewing-checklist.html" class="nav-link"><i class="fa-solid fa-list-check" style="color: #63b3ed;"></i> 看屋30項自檢評分表</a></li>
            <li><a href="depreciation-calculator.html" class="nav-link"><i class="fa-solid fa-chart-pie" style="color: #63b3ed;"></i> 設備折舊損耗殘值精算</a></li>
            <li><a href="lease-termination-agreement.html" class="nav-link"><i class="fa-solid fa-file-contract" style="color: #63b3ed;"></i> 租約提前終止協議書</a></li>
            <li><a href="lease-renewal-agreement.html" class="nav-link"><i class="fa-solid fa-file-pen" style="color: #63b3ed;"></i> 租約續約協議書</a></li>
            <li><a href="tenant-screening-checker.html" class="nav-link"><i class="fa-solid fa-user-check" style="color: #63b3ed;"></i> 租客審查與信用評分</a></li>
            <li><a href="space-planner.html" class="nav-link"><i class="fa-solid fa-compass-drafting" style="color: #63b3ed;"></i> 2D/3D格局配置系統</a></li>
            <li><a href="rent-calculator.html" class="nav-link"><i class="fa-solid fa-calculator" style="color: #63b3ed;"></i> 租金代管費換算</a></li>
            <li><a href="file-converter.html" class="nav-link"><i class="fa-solid fa-file-arrow-up" style="color: #63b3ed;"></i> 線上多功能轉檔</a></li>
            <li><a href="photo-watermark.html" class="nav-link"><i class="fa-solid fa-camera" style="color: #63b3ed;"></i> 房源照片時間水印</a></li>
            <li><a href="id-card-watermark.html" class="nav-link"><i class="fa-solid fa-id-badge" style="color: #63b3ed;"></i> 證件保護防偽水印</a></li>
            <li><a href="image-converter.html" class="nav-link"><i class="fa-solid fa-image" style="color: #63b3ed;"></i> 圖像格式轉換</a></li>
            <li><a href="card-merger.html" class="nav-link"><i class="fa-solid fa-address-card" style="color: #63b3ed;"></i> 名片正反合成</a></li>
            <li><a href="photo-time-location.html" class="nav-link"><i class="fa-solid fa-location-dot" style="color: #63b3ed;"></i> 照片時間地點水印</a></li>
            <li><a href="ocr-translator.html" class="nav-link"><i class="fa-solid fa-language" style="color: #63b3ed;"></i> 照片 OCR 翻譯</a></li>"""

CANONICAL_FOOTER_LANDLORD = """            <li><a href="smoke-free-agreement.html">無菸住宅全面禁菸承諾書</a></li>
            <li><a href="emergency-entry-agreement.html">緊急避難開門授權協議書</a></li>
            <li><a href="lease-notarization-agreement.html">租約公證暨強執約定書</a></li>
            <li><a href="household-registration-agreement.html">設籍約定暨遷出切結書</a></li>
            <li><a href="fire-safety-agreement.html">用電用火安全切結協議</a></li>
            <li><a href="business-registration-agreement.html">設址營業與稅賦補償協議</a></li>
            <li><a href="sublease-consent-agreement.html">承租人轉租同意與協議書</a></li>
            <li><a href="ownership-change-notice.html">買賣不破租賃與押金移轉通知</a></li>
            <li><a href="dispute-mediation-request.html">租賃爭議調處與調解聲請</a></li>
            <li><a href="arrears-installment-agreement.html">欠租分期清償和解協議</a></li>
            <li><a href="tax-calculator.html">房東節稅效益精算</a></li>
            <li><a href="rent-arrears-notice.html">租金催繳與欠租催告</a></li>
            <li><a href="rules-violation-notice.html">住戶違規改善通知單</a></li>
            <li><a href="abandoned-property-agreement.html">承租人遺留物拋棄切結</a></li>
            <li><a href="routine-inspection-report.html">屋況定期巡檢維護報告</a></li>
            <li><a href="mandate-contract.html">住宅租賃委託管理契約</a></li>"""

def clean_page(filepath):
    filename = os.path.basename(filepath)
    if filename in ["index.html", "privacy.html", "island.html"]:
        # 這些頁面的結構略有自定義，單獨處理或保留
        pass

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False

    # 1. 替換標準 ul.nav-dropdown-menu
    # 尋找 <ul class="nav-dropdown-menu"> ... </ul>
    nav_pattern = re.compile(r'(<ul class="nav-dropdown-menu">)(.*?)(</ul>)', re.DOTALL)
    match = nav_pattern.search(content)
    if match:
        # 針對當前檔案，為對應的連結加上 class="nav-link active"
        items = CANONICAL_DROPDOWN_ITEMS
        if filename != "index.html":
            # 尋找 href="{filename}" 並確保有 active
            items = re.sub(
                rf'href="{re.escape(filename)}" class="nav-link"',
                f'href="{filename}" class="nav-link active"',
                items
            )
        new_nav = f"{match.group(1)}\n{items}\n          {match.group(3)}"
        if match.group(0) != new_nav:
            content = content[:match.start()] + new_nav + content[match.end():]
            changed = True

    # 2. 替換標準 footer「房東法務專區」
    footer_pattern = re.compile(
        r'(<div class="footer-col-title">房東法務專區</div>\s*<ul class="footer-links">)(.*?)(</ul>)',
        re.DOTALL
    )
    f_match = footer_pattern.search(content)
    if f_match:
        new_footer = f"{f_match.group(1)}\n{CANONICAL_FOOTER_LANDLORD}\n          {f_match.group(3)}"
        if f_match.group(0) != new_footer:
            content = content[:f_match.start()] + new_footer + content[f_match.end():]
            changed = True

    # 3. 水印工具等使用 <div class="nav-dropdown-menu"> 的頁面相容處理
    watermark_pattern = re.compile(r'(<div class="nav-dropdown-menu">)(.*?)(</div>\s*</div>)', re.DOTALL)
    wm_match = watermark_pattern.search(content)
    if wm_match and "photo-watermark" in filename or "id-card" in filename or "photo-time" in filename:
        # 構建相容的 a 標籤版本
        wm_items = []
        for line in CANONICAL_DROPDOWN_ITEMS.strip().split("\n"):
            m_a = re.search(r'href="([^"]+)"[^>]*>(<i[^>]*></i>)\s*([^<]+)</a>', line)
            if m_a:
                h, icon, title = m_a.group(1), m_a.group(2), m_a.group(3)
                act = ' active' if h == filename else ''
                wm_items.append(f'              <a href="{h}" class="dropdown-item{act}">{icon} {title}</a>')
        new_wm_nav = f'{wm_match.group(1)}\n' + "\n".join(wm_items) + f'\n            {wm_match.group(3)}'
        if wm_match.group(0) != new_wm_nav:
            content = content[:wm_match.start()] + new_wm_nav + content[wm_match.end():]
            changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  [Cleaned] {filename}")
    else:
        print(f"  [OK] {filename}")

def main():
    print("=== 開始全站導覽列與頁尾標準化清理 (Phase 73) ===")
    html_files = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    for f in html_files:
        clean_page(f)
    print("=== 全站標準化清理完成 ===")

if __name__ == "__main__":
    main()
