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
  }

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
        if (item.available_from) imgBox.append(el('span', 'property-badge', `${item.available_from} 起可入住`));
        imgBox.append(el('span', 'property-price', item.price_label));

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

    const head = el('div', 'modal-listing-head');
    head.append(el('h3', 'modal-listing-title', item.title), el('p', 'modal-listing-price', item.price_label));
    const location = el('p', 'property-location');
    location.append(el('i', 'fa-solid fa-location-dot'), ` ${item.location || ''}`);
    head.append(location);
    if (item.available_from) head.append(el('p', 'modal-listing-available', `${item.available_from} 起可入住`));
    modalContent.append(head);

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
    line.href = safeUrl(listingData.booking_url) || BOOKING_URL_DEFAULT;
    line.target = '_blank';
    line.rel = 'noopener noreferrer';
    line.append(el('i', 'fa-brands fa-line'), ' 加 LINE 預約看房');
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

  if (evaluationForm) {
    evaluationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const region = document.getElementById('region').value;
      const planIntent = document.getElementById('planIntent').value;

      alert(`【港居不動產】感謝 ${name} 的預約！\n\n系統已成功接收您的預約需求：\n• 評估區域：${region}\n• 意向方案：${planIntent}\n\n陳俊銘 經理與專業團隊將於 24 小時內親自致電（${phone}）為您評估說明！`);

      evaluationForm.reset();
    });
  }

});
