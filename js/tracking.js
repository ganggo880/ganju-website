/**
 * 港居不動產 全站 MarTech 行銷科技與關鍵轉換追蹤引擎 (GTM / GA4 / Meta Pixel)
 * 遵循 RFP §5.1 行銷與成效追蹤規範與 §6.2 交付標準
 * 具備 DataLayer 注入、GA4 gtag / Meta Pixel fbq 雙向觸發、純前端離線安全防護
 */

(function (window, document) {
  'use strict';

  // 1. 初始化 DataLayer
  window.dataLayer = window.dataLayer || [];

  // 2. 港居行銷追蹤核心控制器
  const GanjuTracker = {
    version: '1.0.0',
    config: {
      debug: false,
      enableConsoleLog: false
    },

    /**
     * 發送自訂轉換與行為事件
     * @param {string} eventName 事件代號 (e.g., 'lead_form_submit', 'line_consult_click')
     * @param {Object} [params={}] 事件附加參數 (維度與指標)
     */
    track: function (eventName, params) {
      if (!eventName || typeof eventName !== 'string') return;
      const cleanParams = params && typeof params === 'object' ? params : {};

      // 構建標準化事件載荷 (Payload)
      const payload = {
        event: eventName,
        page_title: document.title || '',
        page_location: window.location.href || '',
        page_path: window.location.pathname || '',
        timestamp: new Date().toISOString(),
        client_platform: 'ganju-web-static',
        ...cleanParams
      };

      // A. 推送至 Google Tag Manager (GTM DataLayer)
      try {
        window.dataLayer.push(payload);
      } catch (err) {
        if (this.config.debug) console.warn('[Tracker] DataLayer 推送失敗:', err);
      }

      // B. 觸發 Google Analytics 4 (GA4 gtag)
      if (typeof window.gtag === 'function') {
        try {
          window.gtag('event', eventName, cleanParams);
        } catch (err) {
          if (this.config.debug) console.warn('[Tracker] GA4 gtag 觸發失敗:', err);
        }
      }

      // C. 觸發 Meta Pixel (fbq)
      if (typeof window.fbq === 'function') {
        try {
          // 對齊 Meta 標準事件名稱
          const metaStandardMapping = {
            'lead_form_submit': 'Lead',
            'line_consult_click': 'Contact',
            'phone_call_click': 'Contact',
            'property_view': 'ViewContent',
            'property_line_book': 'Schedule',
            'roi_calculator_use': 'CustomizeProduct',
            'tax_calculator_eval': 'CustomizeProduct'
          };

          const standardEvent = metaStandardMapping[eventName];
          if (standardEvent) {
            window.fbq('track', standardEvent, cleanParams);
          } else {
            window.fbq('trackCustom', eventName, cleanParams);
          }
        } catch (err) {
          if (this.config.debug) console.warn('[Tracker] Meta Pixel 觸發失敗:', err);
        }
      }

      // D. 本地除錯記錄
      if (this.config.debug || this.config.enableConsoleLog) {
        console.log(`%c[GanjuTracker] 🎯 ${eventName}`, 'color: #C5A059; font-weight: bold; background: #1A365D; padding: 2px 6px; border-radius: 3px;', payload);
      }
    },

    /**
     * 全域自動監聽全站關鍵點擊行為 (Capture 階段代理，確保任何外連點擊均能精確捕獲)
     */
    initAutoListeners: function () {
      if (this._initialized) return;
      this._initialized = true;

      window.addEventListener('click', (event) => {
        const target = event.target && event.target.closest ? event.target.closest('a, button, [data-track-event]') : null;
        if (!target) return;

        // 1. 監聽具有 data-track-event 屬性之元件
        if (target.hasAttribute && target.hasAttribute('data-track-event')) {
          const eventName = target.getAttribute('data-track-event');
          const customParams = {};
          Array.from(target.attributes).forEach((attr) => {
            if (attr.name.startsWith('data-track-') && attr.name !== 'data-track-event') {
              const key = attr.name.replace('data-track-', '').replace(/-/g, '_');
              customParams[key] = attr.value;
            }
          });
          this.track(eventName, customParams);
          return;
        }

        // 2. 監聽所有撥打電話 (tel:) 連結
        const href = target.getAttribute ? (target.getAttribute('href') || '') : '';
        if (href.startsWith('tel:')) {
          const phone = href.replace('tel:', '').trim();
          const source = (target.getAttribute && target.getAttribute('aria-label')) || target.title || target.innerText.trim() || 'direct_call';
          this.track('phone_call_click', {
            phone_number: phone,
            source_location: source.slice(0, 50)
          });
          return;
        }

        // 3. 監聽所有 LINE 諮詢 (lin.ee) 連結
        if (href.includes('lin.ee')) {
          const source = (target.getAttribute && target.getAttribute('aria-label')) || target.title || target.innerText.trim() || 'line_button';
          this.track('line_consult_click', {
            source_location: source.slice(0, 50),
            destination_url: href
          });
          return;
        }
      }, true);
    }
  };

  // 掛載至 window 全域命名空間並立即啟動全域監聽器
  window.GanjuTracker = GanjuTracker;
  GanjuTracker.initAutoListeners();

})(window, document);
