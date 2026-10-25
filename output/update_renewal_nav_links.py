import glob
import re

print("Updating navbar dropdowns and index.html for lease-renewal-agreement.html...")

renewal_li = '''            <li><a href="lease-renewal-agreement.html" class="nav-link"><i class="fa-solid fa-file-signature" style="color: #48bb78;"></i> 租約續約協議書</a></li>\n'''
renewal_a = '''              <a href="lease-renewal-agreement.html" class="nav-link"><i class="fa-solid fa-file-signature" style="color: #48bb78;"></i> 租約續約協議書</a>\n'''

renewal_card = '''        <!-- 0d. 租約續約協議書與租金調幅精算產生器 -->
        <article class="tool-hub-card" data-category="landlord">
          <div class="tool-hub-header">
            <div class="tool-hub-icon-wrap" style="color: #48bb78;">
              <i class="fa-solid fa-file-signature"></i>
            </div>
            <span class="tool-hub-badge"><i class="fa-solid fa-shield-halved"></i> 續約展期</span>
          </div>
          <div class="tool-hub-body">
            <h3>住宅租賃續約協議書與租金調幅產生器</h3>
            <p>依民法第451條防範不定期租賃，內建主計總處房租CPI調幅試算、原押金結轉與法定2個月上限檢核、原約繼續拘束宣告與雙電子簽章。</p>
          </div>
          <a href="lease-renewal-agreement.html" class="tool-hub-btn">
            <span>立即產生續約協議</span> <i class="fa-solid fa-arrow-right"></i>
          </a>
        </article>

'''

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('全部工具 (22)', '全部工具 (23)')
content = content.replace('全部工具中心 (22)', '全部工具中心 (23)')
content = content.replace('房東節稅與法務 (8)', '房東節稅與法務 (10)')
content = content.replace('房東節稅與法務 (9)', '房東節稅與法務 (10)')
content = content.replace('22 款高階數位神器', '23 款高階數位神器')

if '0d. 租約續約協議書' not in content:
    target = '<!-- 0c. 租約提前終止協議書與遷讓交還切結產生器 -->'
    if target in content:
        content = content.replace(target, renewal_card + target)
        print("  -> Inserted card into index.html")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update all HTML files for nav dropdown
for fpath in glob.glob('*.html'):
    if fpath in ['lease-renewal-agreement.html', 'island_standalone.html', 'island.html']:
        continue
    
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()
    
    c = c.replace('全部工具中心 (22)', '全部工具中心 (23)')
    
    if 'lease-renewal-agreement.html' not in c:
        # Check if it uses <li> or <a>
        if '<li><a href="lease-termination-agreement.html"' in c:
            c = c.replace('<li><a href="lease-termination-agreement.html"', renewal_li + '            <li><a href="lease-termination-agreement.html"')
            print(f"  -> Added <li> to {fpath}")
        elif '<a href="lease-termination-agreement.html"' in c:
            c = c.replace('<a href="lease-termination-agreement.html"', renewal_a + '              <a href="lease-termination-agreement.html"')
            print(f"  -> Added <a> to {fpath}")
        elif '<li><a href="depreciation-calculator.html"' in c:
            c = c.replace('<li><a href="depreciation-calculator.html"', renewal_li + '            <li><a href="depreciation-calculator.html"')
            print(f"  -> Added <li> before depreciation in {fpath}")
        elif '<a href="depreciation-calculator.html"' in c:
            c = c.replace('<a href="depreciation-calculator.html"', renewal_a + '              <a href="depreciation-calculator.html"')
            print(f"  -> Added <a> before depreciation in {fpath}")
        else:
            print(f"  ⚠️ Could not find injection point in {fpath}")
        
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(c)

print("Done updating navigation links!")
