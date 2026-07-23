// 港居不動產 官方網站 互動邏輯腳本
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
    });

    // 點擊選單項目後自動關閉選單
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });

    // 點擊頁面其他區域自動關閉選單
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && e.target !== mobileToggle) {
        navMenu.classList.remove('active');
      }
    });
  }

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

    let annualIncome = 0;
    if (plan === 'master') {
      // 全包租：約以市場行情 85%-90% 穩定全包年收 (零空置風險)
      annualIncome = Math.round(monthlyRent * 12 * 0.88);
      calcSubText.innerHTML = `<strong>全包租優勢</strong>：港居全額承擔空置期與招租成本，全年穩定撥款 NT$ ${annualIncome.toLocaleString()}，屋主零負擔！`;
    } else {
      // 代管：收取市場行情代管服務費 10%，享 90% 年收益
      annualIncome = Math.round(monthlyRent * 12 * 0.90);
      calcSubText.innerHTML = `<strong>代管優勢</strong>：收益極大化，預估年扣除服務費後淨收 NT$ ${annualIncome.toLocaleString()}！`;
    }

    calcAnnualTotal.textContent = `NT$ ${annualIncome.toLocaleString()}`;
  }

  if (rentSlider && planSelect) {
    rentSlider.addEventListener('input', calculateROI);
    planSelect.addEventListener('change', calculateROI);
    calculateROI(); // 初化執行
  }

  // 3. 精選房源多條件篩選器 Filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const propertyCards = document.querySelectorAll('.property-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      propertyCards.forEach(card => {
        const category = card.dataset.category || '';
        if (filter === 'all' || category.includes(filter)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. VR 看房與房源詳情 Modal 彈窗
  const modal = document.getElementById('propertyModal');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');
  const openModalBtns = document.querySelectorAll('.open-modal-btn');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      const price = btn.dataset.price;
      const img = btn.dataset.img;

      modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
          <span style="background: var(--accent-gold); color: #FFF; font-size: 0.8rem; padding: 4px 12px; border-radius: 4px; font-weight: 700;">3D VR 實境虛擬導覽</span>
          <h3 style="font-size: 1.6rem; color: var(--primary-navy); margin-top: 8px;">${title}</h3>
          <p style="color: var(--accent-gold-hover); font-weight: 800; font-size: 1.3rem;">${price}</p>
        </div>

        <div style="position: relative; width: 100%; height: 320px; border-radius: 12px; overflow: hidden; margin-bottom: 24px; background: #000;">
          <img src="${img}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.85;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #FFF;">
            <i class="fa-solid fa-vr-cardboard" style="font-size: 3.5rem; color: var(--accent-gold); margin-bottom: 12px;"></i>
            <p style="font-weight: 700; font-size: 1.1rem;">點擊啟動 360° VR 空間實境瀏覽</p>
            <p style="font-size: 0.85rem; color: #CBD5E1;">支援全景視角切換與空間細節丈量</p>
          </div>
        </div>

        <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h4 style="color: var(--primary-navy); margin-bottom: 10px;"><i class="fa-solid fa-circle-info"></i> 周邊生活機能與配備說明</h4>
          <p style="font-size: 0.92rem; color: var(--text-muted); line-height: 1.7;">
            本物件由港居不動產專責託管維護。周邊擁有便利超商、捷運站與綠意公園。室內採光極佳，配備品牌一級變頻冷氣、系統櫃裝潢與乾濕分離衛浴。
          </p>
        </div>

        <div style="display: flex; gap: 14px;">
          <a href="https://lin.ee/NVFhBDE" target="_blank" class="btn btn-gold" style="flex: 1;">
            <i class="fa-brands fa-line"></i> 專員 Line 立即預約看房
          </a>
          <a href="tel:0968863880" class="btn btn-primary" style="flex: 1;">
            <i class="fa-solid fa-phone"></i> 致電 陳經理 0968-863-880
          </a>
        </div>
      `;

      modal.classList.add('active');
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

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
