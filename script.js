// 港居不動產 官方網站 互動邏輯腳本
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. 行動端 Drawer 選單
  //    ⚠️ 已移除此處原有的 toggle 邏輯。載入本檔的兩個頁面（index.html 搭配
  //    js/navigation.js、rent-calculator.html 搭配 js/layout.js）都另有一份
  //    相同的 #mobileToggle 監聽，兩份各切換一次 .active 正好互相抵銷，
  //    造成手機漢堡選單點了完全沒反應。統一由 navigation.js / layout.js 負責
  //    （那兩份還會同步維護 aria-expanded，無障礙資訊才正確）。

  // 2. 房東收益動態試算器 ROI Calculator
  const rentSlider = document.getElementById('rentSlider');
  const rentValue = document.getElementById('rentValue');
  const planSelect = document.getElementById('planSelect');
  const calcAnnualTotal = document.getElementById('calcAnnualTotal');
  const calcSubText = document.getElementById('calcSubText');

  function calculateROI() {
    const monthlyRent = parseInt(rentSlider.value, 10);
    const plan = planSelect.value;
    
    // 更新顯示金額
    rentValue.textContent = `NT$ ${monthlyRent.toLocaleString()}`;

    let annualText = '';
    if (plan === 'master') {
      // 全包租：約以市場行情 85%-90% 穩定全包年收 (零空置風險)
      const annualIncome = Math.round(monthlyRent * 12 * 0.88);
      annualText = `NT$ ${annualIncome.toLocaleString()}`;
      calcSubText.innerHTML = `<strong>全包租優勢</strong>：港居全額承擔空置期與招租成本，全年穩定撥款 ${annualText}，屋主零負擔！`;
    } else {
      // 代管：代管費月租金 12%～15%（與 #disclosure 法定揭示一致，業主 2026-10-21），淨收 85%～88%
      const low = Math.round(monthlyRent * 12 * 0.85);
      const high = Math.round(monthlyRent * 12 * 0.88);
      annualText = `NT$ ${low.toLocaleString()}～${high.toLocaleString()}`;
      calcSubText.innerHTML = `<strong>代管優勢</strong>：收益極大化，預估年扣除服務費（月租金 12%～15%）後淨收 ${annualText}！`;
    }

    calcAnnualTotal.textContent = annualText;

    // ROI 試算器使用事件防抖追蹤
    clearTimeout(roiTrackTimeout);
    roiTrackTimeout = setTimeout(() => {
      if (window.GanjuTracker) {
        window.GanjuTracker.track('roi_calculator_use', {
          monthly_rent: monthlyRent,
          plan_mode: isSublease ? 'sublease' : 'management'
        });
      }
    }, 1000);
  }

  let roiTrackTimeout = null;

  if (rentSlider && planSelect) {
    rentSlider.addEventListener('input', calculateROI);
    planSelect.addEventListener('change', calculateROI);
    calculateROI(); // 初化執行
  }

  // 3. 精選房源：由 data/listings.json 產生
  //    該檔由「出租物件自動刊登」系統（listing_auto）以 GitHub API 更新，欄位契約見該專案 adapters/website.py。
  //    🔴 資料來自檔案，一律用 textContent／createElement 寫入，不用 innerHTML。
  //    script.js 也被 rent-calculator.html 載入，那頁沒有房源區，所以每一步都先判空。
  const BOOKING_URL_DEFAULT = 'https://lin.ee/Q71pw2I';
  const propertiesGrid = document.getElementById('propertiesGrid');
  const propertiesFilter = document.getElementById('propertiesFilter');
  const propertiesEmpty = document.getElementById('propertiesEmpty');
  const modal = document.getElementById('propertyModal');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');
  let listingData = { listings: [] };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };

  // 只接受 http(s) 網址，擋掉 javascript: 之類
  const safeUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
      return '';
    }
  };

  function renderCards(district) {
    propertiesGrid.replaceChildren();
    listingData.listings
      .filter((item) => district === 'all' || item.district === district)
      .forEach((item) => {
        const card = el('div', 'property-card');
        const imgBox = el('div', 'property-img-box');
        const photo = safeUrl(item.photo);
        if (photo) {
          const img = el('img');
          img.src = photo;
          img.alt = item.title || '';
          img.loading = 'lazy';
          img.decoding = 'async';
          imgBox.append(img);
        }
        const isRented = item.status === 'rented' || item.is_rented;
        if (isRented) {
          card.classList.add('is-rented');
          imgBox.append(el('span', 'property-badge rented', '已圓滿出租'));
        } else if (item.available_from) {
          imgBox.append(el('span', 'property-badge', `${item.available_from} 起可入住`));
        }

        if (item.vr_url || item.has_vr) {
          const vrBadge = el('span', 'property-badge property-badge-vr');
          vrBadge.append(el('i', 'fa-solid fa-vr-cardboard'), ' 360° VR');
          imgBox.append(vrBadge);
        }

        imgBox.append(el('span', 'property-price', isRented ? '已出租' : item.price_label));

        const content = el('div', 'property-content');
        content.append(el('h3', 'property-title', item.title));
        const location = el('p', 'property-location');
        location.append(el('i', 'fa-solid fa-location-dot'), ` ${item.location || ''}`);
        content.append(location);
        const tags = el('div', 'property-tags');
        (item.tags || []).forEach((tag) => tags.append(el('span', 'property-tag', tag)));
        content.append(tags);
        const button = el('button', 'btn btn-primary property-detail-btn');
        button.type = 'button';
        button.append(el('i', 'fa-solid fa-circle-info'), ' 查看詳情與預約看房');
        button.addEventListener('click', () => openListing(item.id));
        content.append(button);

        card.append(imgBox, content);
        propertiesGrid.append(card);
      });
    if (propertiesEmpty) propertiesEmpty.hidden = listingData.listings.length > 0;
  }

  function renderFilters() {
    if (!propertiesFilter) return;
    const districts = [...new Set(listingData.listings.map((item) => item.district).filter(Boolean))];
    propertiesFilter.replaceChildren();
    const makeButton = (value, label) => {
      const button = el('button', 'filter-btn', label);
      button.type = 'button';
      button.addEventListener('click', () => {
        propertiesFilter.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        renderCards(value);
      });
      return button;
    };
    const all = makeButton('all', '全部房源');
    all.classList.add('active');
    propertiesFilter.append(all, ...districts.map((d) => makeButton(d, d)));
    propertiesFilter.hidden = districts.length < 2; // 只有一個行政區時不必篩選
  }

  function openListing(id) {
    const item = listingData.listings.find((listing) => listing.id === id);
    if (!item || !modal || !modalContent) return;
    modalContent.replaceChildren();

    const isRented = item.status === 'rented' || item.is_rented;

    // 若已出租，顯示圓滿成交公告橫幅 (SEO 留存與防呆)
    if (isRented) {
      const banner = el('div', 'rented-alert-banner');
      banner.append(
        el('i', 'fa-solid fa-circle-check'),
        el('span', '', '🎉 本物件已圓滿出租成交！感謝各界支持，歡迎加 LINE 諮詢同社區或周邊最新釋出優質房源。')
      );
      modalContent.append(banner);
    }

    const head = el('div', 'modal-listing-head');
    head.append(el('h3', 'modal-listing-title', item.title), el('p', 'modal-listing-price', isRented ? '已圓滿出租' : item.price_label));
    const location = el('p', 'property-location');
    location.append(el('i', 'fa-solid fa-location-dot'), ` ${item.location || ''}`);
    head.append(location);
    if (!isRented && item.available_from) head.append(el('p', 'modal-listing-available', `${item.available_from} 起可入住`));
    modalContent.append(head);

    // 支援 360° VR 虛擬實境導覽嵌入 (RFP §5.3)
    if (item.vr_url) {
      const vrBox = el('div', 'modal-vr-box');
      const vrTitle = el('h4', 'modal-vr-title');
      vrTitle.append(el('i', 'fa-solid fa-vr-cardboard'), ' 360° VR 虛擬實境線上看房');
      const vrIframe = el('iframe', 'modal-vr-frame');
      vrIframe.src = safeUrl(item.vr_url);
      vrIframe.setAttribute('allowfullscreen', 'true');
      vrIframe.setAttribute('loading', 'lazy');
      vrIframe.setAttribute('title', `${item.title || '房源'} 360° VR 導覽`);
      vrBox.append(vrTitle, vrIframe);
      modalContent.append(vrBox);
    }

    const photos = (item.photos || []).map(safeUrl).filter(Boolean);
    if (photos.length) {
      const gallery = el('div', 'modal-listing-photos');
      photos.forEach((src, index) => {
        const img = el('img');
        img.src = src;
        img.alt = `${item.title || ''} 照片 ${index + 1}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        gallery.append(img);
      });
      modalContent.append(gallery);
    }

    if (item.detail_text) modalContent.append(el('div', 'modal-listing-detail', item.detail_text));

    const actions = el('div', 'modal-listing-actions');
    const line = el('a', 'btn btn-gold');
    const bookingMsg = isRented
      ? `您好，我看到【${item.title || '精選房源'}】已圓滿出租，想諮詢同社區或周邊是否有相似優質房源釋出？`
      : `您好，我想預約看房：【${item.title || '精選房源'}】（租金：${item.price_label || '洽詢專員'}）`;
    const lineBtnText = isRented ? ' 加 LINE 諮詢同社區相似房源' : ' 加 LINE 預約看房';

    const lineBase = safeUrl(listingData.booking_url) || BOOKING_URL_DEFAULT;
    const lineUrlWithText = lineBase.includes('?') ? `${lineBase}&text=${encodeURIComponent(bookingMsg)}` : `${lineBase}?text=${encodeURIComponent(bookingMsg)}`;
    line.href = lineUrlWithText;
    line.target = '_blank';
    line.rel = 'noopener noreferrer';
    line.append(el('i', 'fa-brands fa-line'), lineBtnText);
    line.addEventListener('click', () => {
      if (window.GanjuTracker) {
        window.GanjuTracker.track('property_line_book', {
          listing_id: item.id,
          listing_title: item.title,
          price: item.price_label
        });
      }
    });
    actions.append(line);
    const phone = String(listingData.phone || '').replace(/[^\d+]/g, '');
    if (phone) {
      const call = el('a', 'btn btn-primary');
      call.href = `tel:${phone}`;
      call.append(el('i', 'fa-solid fa-phone'), ` 致電 ${listingData.phone}`);
      actions.append(call);
    }
    modalContent.append(actions);

    modal.classList.add('active');
    // 讓這個物件有自己的網址，FB 貼文的「物件詳情」可以直接連過來
    history.replaceState(null, '', `?listing=${encodeURIComponent(item.id)}#properties`);

    // 觸發房源瀏覽轉換事件
    if (window.GanjuTracker) {
      window.GanjuTracker.track('property_view', {
        listing_id: item.id,
        listing_title: item.title,
        price: item.price_label,
        district: item.district || ''
      });
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    if (new URLSearchParams(window.location.search).has('listing')) {
      history.replaceState(null, '', `${window.location.pathname}#properties`);
    }
  }

  if (propertiesGrid) {
    fetch('data/listings.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : { listings: [] }))
      .catch(() => ({ listings: [] }))
      .then((data) => {
        listingData = { ...data, listings: Array.isArray(data.listings) ? data.listings : [] };
        renderFilters();
        renderCards('all');
        const requested = new URLSearchParams(window.location.search).get('listing');
        if (requested) openListing(requested);
      });
  }

  // 4. 房源詳情 Modal 彈窗：關閉方式
  if (modalClose) modalClose.addEventListener('click', closeModal);

  // script.js 亦被 rent-calculator.html 載入，該頁沒有 #propertyModal，
  // 少了這道判空會丟出 TypeError 並中止本檔後續所有初始化。
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  }

  // 5. 資產評估預約表單提交處理 Lead Form Handler
  const evaluationForm = document.getElementById('evaluationForm');
  const bookingSuccessModal = document.getElementById('bookingSuccessModal');
  const bookingModalClose = document.getElementById('bookingModalClose');
  const btnLineInstantSend = document.getElementById('btnLineInstantSend');
  const formHoneypot = document.getElementById('formHoneypot');

  function closeBookingModal() {
    if (bookingSuccessModal) {
      bookingSuccessModal.classList.remove('active');
    }
  }

  if (evaluationForm) {
    evaluationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // 蜜罐防洗檢查：機器人自動填寫的話直接默默靜默處理
      if (formHoneypot && formHoneypot.value) {
        evaluationForm.reset();
        return;
      }

      const name = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const region = document.getElementById('region').value;
      const planIntent = document.getElementById('planIntent').value;
      const note = document.getElementById('note') ? document.getElementById('note').value.trim() : '';

      // 基本防呆驗證
      if (!name || !phone || !region) {
        alert('請填寫完整姓名、聯絡電話與房屋區域！');
        return;
      }

      // 組裝 LINE 帶參預約文字
      const lineMsg = `【港居官網現場評估預約】
尊稱：${name}
電話：${phone}
區域：${region}
意向方案：${planIntent}
備註需求：${note || '無特殊需求'}

陳俊銘經理您好，我已在官網送出預約，想與您進一步諮詢評估細節！`;

      const lineUrl = `https://lin.ee/Q71pw2I?text=${encodeURIComponent(lineMsg)}`;

      // 填入彈窗明細卡
      const smName = document.getElementById('successModalName');
      const smPhone = document.getElementById('successModalPhone');
      const smRegion = document.getElementById('successModalRegion');
      const smPlan = document.getElementById('successModalPlan');

      if (smName) smName.textContent = name;
      if (smPhone) smPhone.textContent = phone;
      if (smRegion) smRegion.textContent = region;
      if (smPlan) smPlan.textContent = planIntent;

      if (btnLineInstantSend) {
        btnLineInstantSend.href = lineUrl;
      }

      // 本地儲存預約紀錄 (LocalStorage)
      try {
        const historyKey = 'ganju_lead_history';
        const prev = JSON.parse(localStorage.getItem(historyKey) || '[]');
        prev.unshift({
          name,
          phone,
          region,
          planIntent,
          note,
          date: new Date().toISOString()
        });
        localStorage.setItem(historyKey, JSON.stringify(prev.slice(0, 10)));
      } catch (err) {
        console.warn('LocalStorage save failed:', err);
      }

      // 觸發關鍵轉換事件：資產評估表單送出
      if (window.GanjuTracker) {
        window.GanjuTracker.track('lead_form_submit', {
          region: region,
          plan_intent: planIntent,
          has_note: !!note
        });
      }

      // 開啟成功彈窗
      if (bookingSuccessModal) {
        bookingSuccessModal.classList.add('active');
      }

      evaluationForm.reset();
    });
  }

  if (bookingModalClose) {
    bookingModalClose.addEventListener('click', closeBookingModal);
  }

  if (bookingSuccessModal) {
    bookingSuccessModal.addEventListener('click', (e) => {
      if (e.target === bookingSuccessModal) closeBookingModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && bookingSuccessModal.classList.contains('active')) {
        closeBookingModal();
      }
    });
  }

  // 6. 房東常見問答手風琴互動 (FAQ Accordion Handler)
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentItem = btn.closest('.faq-item');
      if (!parentItem) return;
      const isExpanded = parentItem.classList.contains('active');

      // 點擊當前項切換開關
      parentItem.classList.toggle('active', !isExpanded);
      btn.setAttribute('aria-expanded', (!isExpanded).toString());
    });
  });

  // 7. 專欄文章深度閱讀彈窗 (Article Reading Modal Handler)
  const articleModal = document.getElementById('articleModal');
  const articleModalContent = document.getElementById('articleModalContent');
  const articleModalClose = document.getElementById('articleModalClose');
  const articleBtns = document.querySelectorAll('.btn-read-article');

  const BLOG_ARTICLES = {
    'tax-guide': {
      category: '稅務減免指南',
      title: '房東輕鬆省稅！包租代管租金所得稅減免與囤房稅 2.0 攻略',
      author: '陳俊銘 經理（特許租賃管理師）',
      date: '2026-10-24',
      readTime: '3 分鐘',
      bodyHtml: `
        <p>許多高雄在地房東常有一大顧慮：「房子出租報稅會不會被課重稅？萬一房客申請租金補貼，國稅局會不會回溯追稅？」事實上，政府為了鼓勵房東將房屋釋出給專業租賃業者，於<strong>《租賃住宅市場發展及管理條例》第 17 條</strong>明文制定了極具吸引力的租稅優惠！</p>
        
        <p>個人住宅所有權人只要將房屋委託給<strong>特許登記之包租或代管業者（如港居不動產）</strong>，契約約定供居住使用 1 年以上，即可依法享有三大核心租稅減免：</p>

        <div class="article-takeaway-box">
          <div class="article-takeaway-title"><i class="fa-solid fa-award" style="color: var(--accent-gold);"></i> 港居包租代管三大法定節稅權益</div>
          <ul class="article-takeaway-list">
            <li><strong>租金所得稅免稅額</strong>：每屋每月租金最高 <strong>NT$ 15,000 元</strong> 完全免稅（全年免稅額高達 18 萬元整）。</li>
            <li><strong>必要費用率加成 60%</strong>：月租金超過 1.5 萬元部分，得以 <strong>60%</strong> 作為法定必要扣除費用（相較房東自行出租僅 43% 費用率，應稅所得大幅縮減）。</li>
            <li><strong>2024 囤房稅 2.0 地方減徵</strong>：申報自租一般非自住稅率 2.0%~4.8%，委託合法包租代管減徵比照自住稅率 <strong>1.2%</strong>（省稅 50%）；地價稅比照自用優惠稅率 <strong>0.2% (千分之2)</strong>（減徵高達 80%）。</li>
          </ul>
        </div>

        <p>舉例來說，若您在小港區有一間月租 28,000 元之大樓住家，綜所稅率 12%：自租全年應繳綜所稅高達 23,000 元以上；若委託港居代管，扣除 15,000 免稅額後僅餘 13,000 元以 40% 計入所得，全年綜所稅僅需約 7,488 元，光是所得稅整整現省 1.5 萬元以上，加上房屋稅與地價稅省下來的差額，往往足以完全抵銷代管服務費！</p>
      `,
      ctaText: '立即使用「房東節稅與淨收益試算神器」精算您的物業',
      ctaUrl: 'tax-calculator.html'
    },
    'furnish-tips': {
      category: '屋況維護撇步',
      title: '屋況免改裝直上！如何吸引外商高管與工程師優質租客？',
      author: '陳俊銘 經理（特許租賃管理師）',
      date: '2026-10-24',
      readTime: '3 分鐘',
      bodyHtml: `
        <p>許多屋主在房子退租或新成屋交屋時，常被傳統統包工程或裝潢公司推銷數十萬甚至上百萬的「全室打掉重練」。然而在港居實務經驗中，對於高雄小港、前鎮、苓雅等區域的外商工程師、航空機師與醫療專業人士而言，<strong>過度花俏的木作裝潢反而不如「乾淨、採光、通風與簡約機能」來得吸引人</strong>。</p>

        <p>港居不動產主打<strong>「屋況免改裝直上」</strong>理念：只要您的物業具備基礎良好的防水水電、明亮採光與乾淨白牆，我們建議房東切勿花費大筆冤枉錢裝修，而是掌握以下三大關鍵微調：</p>

        <div class="article-takeaway-box">
          <div class="article-takeaway-title"><i class="fa-solid fa-wand-magic-sparkles" style="color: var(--accent-gold);"></i> 高投報輕裝修三大核心心法</div>
          <ul class="article-takeaway-list">
            <li><strong>色彩回歸中性低彩度</strong>：全室牆面採純白或百合白乳膠漆，視覺放大 20% 以上，為租客保留自由搭配軟裝之餘裕。</li>
            <li><strong>活動家具取代昂貴固定木作</strong>：挑選線條洗鍊的實木或極簡金屬活動家具（如三人沙發、獨立筒床墊、簡約餐桌椅），日後維護替換彈性高。</li>
            <li><strong>人體工學動線防呆</strong>：主臥預留至少 85cm 下床與衣櫃開門迴轉半徑，避免空間壓迫感。</li>
          </ul>
        </div>

        <p>港居更配備有自研之「2D/3D 平面格局配置系統」，在專員現場場勘後，能即時以 3D 娃娃屋向潛在租客呈現動線與採光格局，讓物件在招租市場脫穎而出，平均縮短空置期達 50% 以上！</p>
      `,
      ctaText: '體驗「2D/3D 格局配置系統」規劃最佳動線',
      ctaUrl: 'space-planner.html'
    },
    'inspection-legal': {
      category: '法規與保障',
      title: '點交原狀還原！依據租賃專法第 11 條之屋況瑕疵存證與責任劃分',
      author: '陳俊銘 經理（特許租賃管理師）',
      date: '2026-10-24',
      readTime: '4 分鐘',
      bodyHtml: `
        <p>租賃市場中最常引發房東與租客糾紛的，莫過於退租時的「押金返還扣抵」與「屋況修繕責任爭議」。牆壁的小刮傷該算誰的？冷氣遙控器不靈敏房東能扣押金嗎？依據<strong>《租賃住宅市場發展及管理條例》第 11 條</strong>，出租人與承租人在交付住宅時，應共同查驗屋況並簽訂<strong>「租賃標的現況確認書」</strong>。</p>

        <p>依據民法第 429 條（出租人修繕義務）及第 432 條（承租人之善良管理人保管義務），點交查驗必須嚴格區分四大法律責任歸屬：</p>

        <div class="article-takeaway-box">
          <div class="article-takeaway-title"><i class="fa-solid fa-scale-balanced" style="color: var(--accent-gold);"></i> 法律責任判定四大法定基準</div>
          <ul class="article-takeaway-list">
            <li><strong>🟢 自然折舊耗損（免責）</strong>：因時間經過與日常正常使用造成之油漆微黃、地板些許磨痕，依民法租客「完全免除還原責任」，房東不得扣抵押金。</li>
            <li><strong>🔵 出租人修繕改善</strong>：非因租客事由導致之水管自然老化滲漏、冷氣機件老化異音，屬房東法定維持租賃物合於使用收益之責任。</li>
            <li><strong>🔴 承租人注意義務疏失</strong>：人為重物重擊磁磚破損、牆面未經同意鑽大釘孔、寵物抓咬損壞，租客應負賠償或由押金抵扣。</li>
            <li><strong>⚪ 雙方合意現況點交</strong>：起租前既已存在之瑕疵（如門框微撞痕），雙方合意註記現況交付，退租時不得再行追究。</li>
          </ul>
        </div>

        <p>港居不動產全方位採用數位化存證管理，現場查驗拍照即時壓印不可竄改之時間戳記浮水印，並由甲乙雙方於手機觸控板親筆手寫電子簽章，一鍵匯出正式 A4 存證確認書，讓資產保全滴水不漏！</p>
      `,
      ctaText: '前往「租賃修繕點交與屋況瑕疵存證神器」',
      ctaUrl: 'repair-inspection.html'
    }
  };

  function openArticle(articleId) {
    const data = BLOG_ARTICLES[articleId];
    if (!data || !articleModal || !articleModalContent) return;

    articleModalContent.innerHTML = `
      <div class="article-header">
        <span class="article-badge"><i class="fa-solid fa-tag"></i> ${data.category}</span>
        <h2 class="article-modal-title" id="articleModalTitle">${data.title}</h2>
        <div class="article-meta-row">
          <span class="article-meta-item"><i class="fa-solid fa-user-pen" style="color: var(--accent-gold);"></i> ${data.author}</span>
          <span class="article-meta-item"><i class="fa-regular fa-calendar-days"></i> ${data.date}</span>
          <span class="article-meta-item"><i class="fa-regular fa-clock"></i> 閱讀時間約 ${data.readTime}</span>
        </div>
      </div>
      <div class="article-modal-body">
        ${data.bodyHtml}
        <div class="article-cta-box">
          <div class="article-cta-box-text">
            <h4><i class="fa-solid fa-toolbox" style="color: var(--accent-gold);"></i> 港居專用線上工具連動</h4>
            <p>免去繁瑣計算，線上立即執行專業試算與合約點交作業</p>
          </div>
          <a href="${data.ctaUrl}" class="article-cta-btn">
            ${data.ctaText} <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </div>
    `;

    articleModal.classList.add('active');

    // 觸發專欄文章閱讀與 CTA 追蹤
    if (window.GanjuTracker) {
      window.GanjuTracker.track('blog_article_view', {
        article_id: id,
        article_title: data.title,
        category: data.category
      });
    }

    const ctaBtn = articleModalContent.querySelector('.article-cta-btn');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        if (window.GanjuTracker) {
          window.GanjuTracker.track('blog_cta_click', {
            article_id: id,
            target_tool: data.ctaUrl
          });
        }
      });
    }
  }

  function closeArticleModal() {
    if (articleModal) articleModal.classList.remove('active');
  }

  articleBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.articleId;
      openArticle(id);
    });
  });

  if (articleModalClose) {
    articleModalClose.addEventListener('click', closeArticleModal);
  }

  if (articleModal) {
    articleModal.addEventListener('click', (e) => {
      if (e.target === articleModal) closeArticleModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && articleModal.classList.contains('active')) {
        closeArticleModal();
      }
    });
  }

  // 8. 客戶好評見證篩選互動 (Testimonials Tabs Handler)
  const testimonialTabs = document.querySelectorAll('.testimonial-tab-btn');
  const testimonialCards = document.querySelectorAll('.testimonial-card');

  testimonialTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      testimonialTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      testimonialCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (window.GanjuTracker) {
        window.GanjuTracker.track('testimonial_filter_click', { filter_category: filter });
      }
    });
  });

  // 9. 線上工具中心分類篩選互動 (Online Tools Hub Filter Handler)
  const toolCatBtns = document.querySelectorAll('.tools-cat-btn');
  const toolCards = document.querySelectorAll('.tool-hub-card');

  toolCatBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      toolCatBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      toolCards.forEach((card) => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (window.GanjuTracker) {
        window.GanjuTracker.track('tools_hub_filter_click', { filter_category: filter });
      }
    });
  });

});
