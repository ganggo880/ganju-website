import glob
import re

print("Updating navbar dropdowns and index.html for tenant-screening-checker.html...")

screening_li = '''            <li><a href="tenant-screening-checker.html" class="nav-link"><i class="fa-solid fa-user-check" style="color: #10b981;"></i> 租客審查與信用評分</a></li>\n'''
screening_a = '''              <a href="tenant-screening-checker.html" class="nav-link"><i class="fa-solid fa-user-check" style="color: #10b981;"></i> 租客審查與信用評分</a>\n'''

screening_card = '''        <!-- 0e. 租客承租資格審查與租賃信用評分表產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #10b981;">
              <i class="fa-solid fa-user-check"></i>
            </div>
            <span class="tool-hub-badge"><i class="fa-solid fa-user-shield"></i> 嚴選房客</span>
          </div>
          <div class="tool-hub-body">
            <h3>租客承租資格審查與租賃信用評分表產生器</h3>
            <p>依據30%房租所得比法則與租賃專法注意義務，整合司法裁判查驗、前租約照會、一票否決紅旗防呆與A4診斷書列印。</p>
          </div>
          <a href="tenant-screening-checker.html" class="tool-hub-btn">
            <span>立即審查租客信用</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

'''

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('全部工具 (23)', '全部工具 (24)')
content = content.replace('全部工具中心 (23)', '全部工具中心 (24)')
content = content.replace('房東節稅與法務 (10)', '房東節稅與法務 (11)')
content = content.replace('23 款高階數位神器', '24 款高階數位神器')

if '0e. 租客承租資格審查' not in content:
    target = '<!-- 0d. 租約續約協議書與租金調幅精算產生器 -->'
    if target in content:
        content = content.replace(target, screening_card + target)
        print("  -> Inserted card into index.html")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update all HTML files for nav dropdown
for fpath in glob.glob('*.html'):
    if fpath in ['tenant-screening-checker.html', 'island_standalone.html', 'island.html']:
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    
    c = c.replace('全部工具中心 (23)', '全部工具中心 (24)')
    
    if 'tenant-screening-checker.html' not in c:
        if '<li><a href="lease-renewal-agreement.html"' in c:
            c = c.replace('<li><a href="lease-renewal-agreement.html"', screening_li + '            <li><a href="lease-renewal-agreement.html"')
            print(f"  -> Added <li> before renewal in {fpath}")
        elif '<a href="lease-renewal-agreement.html"' in c:
            c = c.replace('<a href="lease-renewal-agreement.html"', screening_a + '              <a href="lease-renewal-agreement.html"')
            print(f"  -> Added <a> before renewal in {fpath}")
        elif '<li><a href="lease-termination-agreement.html"' in c:
            c = c.replace('<li><a href="lease-termination-agreement.html"', screening_li + '            <li><a href="lease-termination-agreement.html"')
            print(f"  -> Added <li> before termination in {fpath}")
        elif '<a href="lease-termination-agreement.html"' in c:
            c = c.replace('<a href="lease-termination-agreement.html"', screening_a + '              <a href="lease-termination-agreement.html"')
            print(f"  -> Added <a> before termination in {fpath}")
        else:
            print(f"  ⚠️ Could not find injection point in {fpath}")
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)

print("Done updating navigation links!")
