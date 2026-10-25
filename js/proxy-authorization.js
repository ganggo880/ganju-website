/**
 * 港居不動產 - 租賃住宅授權委託代理人委任書產生器核心邏輯
 * 檔案：js/proxy-authorization.js
 * 遵循法規：《民法》第103/167/528/534條、《租賃住宅市場發展及管理條例》
 */

(function () {
    'use strict';

    // 模組狀態
    const state = {
        mode: 'landlord', // 'landlord' (房東授權) | 'tenant' (租客授權)
        docNo: '',
        authDate: '',
        startDate: '',
        endDate: '',
        propertyAddress: '',
        principal: {
            name: '',
            id: '',
            phone: '',
            address: ''
        },
        proxy: {
            name: '',
            id: '',
            phone: '',
            address: '',
            relation: '親屬'
        },
        scopes: {
            lease_sign: true,
            payment: true,
            inspection: true,
            repair: true,
            hoa: false,
            moveout: true,
            terminate: false
        },
        specialNotes: '',
        showIdAttachment: true
    };

    // 權限說明常數資料庫
    const SCOPE_DEFINITIONS = {
        landlord: {
            lease_sign: {
                title: '代理簽訂、變更或換發住宅租賃契約',
                desc: '包含議定各項租賃條件、代為於租賃契約及住戶公約簽名蓋章。'
            },
            payment: {
                title: '代理代收各期租金、押金保證金及公用事業代墊款',
                desc: '包含開立收據或將款項轉匯入委任人指定專屬金融帳戶。'
            },
            inspection: {
                title: '代理起租現場屋況與隨附設備點交驗收、交付房屋鑰匙及門禁磁扣',
                desc: '包含代簽現場設備點交清冊與水電瓦斯錶指針底數紀錄。'
            },
            repair: {
                title: '代理通報修繕協調、代墊修繕款項確認與廠商入室施工現場監督',
                desc: '包含日常修繕通報確認、小額代墊款核可與修繕完工驗收單簽名。'
            },
            hoa: {
                title: '代理出席公寓大廈區分所有權人會議（區權會）及社區管委會行使權利',
                desc: '包含代表委任人出席社區會議、參與公共事務發言與行使議案表決權。'
            },
            moveout: {
                title: '代理租約期滿或終止時現場點交退租、瑕疵責任確認與結算返還押金',
                desc: '包含代辦退租點驗、鑰匙收回、房屋現況瑕疵查驗及押金扣抵差額結算。'
            },
            terminate: {
                title: '代理協議提前終止租賃契約、和解協議簽署及點交遷讓交還房屋',
                desc: '依民法第534條特約特別授權：包含提前解約違約金協商與終止協議書簽署。'
            }
        },
        tenant: {
            lease_sign: {
                title: '代理簽訂、變更或換發住宅租賃契約',
                desc: '包含代表承租人審閱合約條款、確認租金繳納方式及簽章承租。'
            },
            payment: {
                title: '代理支付各期租金、押金保證金及分租水電瓦斯公電代繳款',
                desc: '包含代為辦理轉帳支付或臨櫃繳納，並代為領取繳租收據憑證。'
            },
            inspection: {
                title: '代理起租現場屋況與隨附設備會同點交驗收、簽收鑰匙磁扣',
                desc: '包含拍照存證屋況現況瑕疵、核對設備功能正常並於點交單簽認。'
            },
            repair: {
                title: '代理通報租賃住宅設備瑕疵修繕請求與廠商入室維修配合點驗',
                desc: '包含與出租人或代管公司聯繫修繕事宜並於派工驗收證明單簽認。'
            },
            hoa: {
                title: '代理出席社區住戶座談會及向管委會申報承租人居住登記',
                desc: '包含登記住戶汽機車車牌、信箱信件領取與門禁磁扣增辦。'
            },
            moveout: {
                title: '代理租約期滿或退租時會同房東現場驗收房屋、交還鑰匙配件',
                desc: '包含確認家具設備完整無缺損、水電錶指針結算並收回剩餘押金。'
            },
            terminate: {
                title: '代理協議提前終止租約、違約金協商結算與遷讓返還房屋',
                desc: '依民法第534條特約特別授權：包含合意解約協議書簽署與清空交屋。'
            }
        }
    };

    // 簽章畫布實例
    let sigPrincipalPad = null;
    let sigProxyPad = null;

    // 工具函式：XSS 轉義
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 初始化自動產生單號與今日日期
    function initDefaults() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const randomSeq = Math.floor(10 + Math.random() * 90);
        state.docNo = `POA-${yyyy}${mm}${dd}-${randomSeq}`;
        state.authDate = dateStr;
        state.startDate = dateStr;

        // 預設授權一年
        const endYear = yyyy + 1;
        state.endDate = `${endYear}-${mm}-${dd}`;
    }

    // 綁定輸入元件
    function bindInputs() {
        // 模式切換按鈕
        const btnLandlord = document.getElementById('modeLandlordBtn');
        const btnTenant = document.getElementById('modeTenantBtn');

        if (btnLandlord && btnTenant) {
            btnLandlord.addEventListener('click', function () {
                setMode('landlord');
            });
            btnTenant.addEventListener('click', function () {
                setMode('tenant');
            });
        }

        // 基本欄位
        bindField('inputDocNo', 'docNo');
        bindField('inputAuthDate', 'authDate');
        bindField('inputStartDate', 'startDate');
        bindField('inputEndDate', 'endDate');
        bindField('inputPropertyAddress', 'propertyAddress');

        // 委任人
        bindField('inputPrincipalName', 'name', state.principal);
        bindField('inputPrincipalId', 'id', state.principal);
        bindField('inputPrincipalPhone', 'phone', state.principal);
        bindField('inputPrincipalAddress', 'address', state.principal);

        // 受任人
        bindField('inputProxyName', 'name', state.proxy);
        bindField('inputProxyId', 'id', state.proxy);
        bindField('inputProxyPhone', 'phone', state.proxy);
        bindField('inputProxyAddress', 'address', state.proxy);
        bindField('selectProxyRelation', 'relation', state.proxy);

        // 特約說明
        bindField('inputSpecialNotes', 'specialNotes');

        // 身分證黏貼格顯示核選框
        const chkId = document.getElementById('chkShowIdAttachment');
        if (chkId) {
            chkId.addEventListener('change', function () {
                state.showIdAttachment = this.checked;
                updatePreview();
            });
        }

        // 授權項目核選框
        Object.keys(state.scopes).forEach(key => {
            const el = document.getElementById(`chkScope_${key}`);
            if (el) {
                el.addEventListener('change', function () {
                    state.scopes[key] = this.checked;
                    updatePreview();
                });
            }
        });

        // 快速全選 / 反選
        const btnSelectAll = document.getElementById('btnSelectAllScopes');
        const btnDeselectAll = document.getElementById('btnDeselectAllScopes');

        if (btnSelectAll) {
            btnSelectAll.addEventListener('click', function () {
                Object.keys(state.scopes).forEach(k => {
                    state.scopes[k] = true;
                    const el = document.getElementById(`chkScope_${k}`);
                    if (el) el.checked = true;
                });
                updatePreview();
            });
        }

        if (btnDeselectAll) {
            btnDeselectAll.addEventListener('click', function () {
                Object.keys(state.scopes).forEach(k => {
                    state.scopes[k] = false;
                    const el = document.getElementById(`chkScope_${k}`);
                    if (el) el.checked = false;
                });
                updatePreview();
            });
        }

        // 操作工具按鈕
        const btnPrint = document.getElementById('btnPrintA4');
        const btnDownload = document.getElementById('btnDownloadCanvas');
        const btnCopyLine = document.getElementById('btnCopyLine');
        const btnSample = document.getElementById('btnLoadSample');
        const btnReset = document.getElementById('btnResetForm');

        if (btnPrint) btnPrint.addEventListener('click', handlePrint);
        if (btnDownload) btnDownload.addEventListener('click', handleDownloadImage);
        if (btnCopyLine) btnCopyLine.addEventListener('click', handleCopyLine);
        if (btnSample) btnSample.addEventListener('click', handleLoadSample);
        if (btnReset) btnReset.addEventListener('click', handleReset);
    }

    function bindField(elementId, stateKey, parentObj) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.addEventListener('input', function () {
            if (parentObj) {
                parentObj[stateKey] = this.value.trim();
            } else {
                state[stateKey] = this.value.trim();
            }
            updatePreview();
        });
    }

    // 切換模式
    function setMode(newMode) {
        state.mode = newMode;

        const btnLandlord = document.getElementById('modeLandlordBtn');
        const btnTenant = document.getElementById('modeTenantBtn');

        if (btnLandlord && btnTenant) {
            if (newMode === 'landlord') {
                btnLandlord.classList.add('active');
                btnTenant.classList.remove('active');
            } else {
                btnTenant.classList.add('active');
                btnLandlord.classList.remove('active');
            }
        }

        // 更新表單各處標籤文字 (委任人是房東還是租客)
        updateModeLabels();
        updatePreview();
    }

    function updateModeLabels() {
        const isLandlord = (state.mode === 'landlord');

        const lblPrincipalTitle = document.getElementById('lblPrincipalSectionTitle');
        const lblProxyTitle = document.getElementById('lblProxySectionTitle');
        const previewDocTitle = document.getElementById('previewDocTitle');

        if (lblPrincipalTitle) {
            lblPrincipalTitle.innerHTML = isLandlord
                ? '<i class="fa-solid fa-user-tie"></i> 委任人（出租人／房屋所有權人）資料'
                : '<i class="fa-solid fa-user-tag"></i> 委任人（承租人）資料';
        }

        if (lblProxyTitle) {
            lblProxyTitle.innerHTML = isLandlord
                ? '<i class="fa-solid fa-handshake"></i> 受任人（代理出租／管理人）資料'
                : '<i class="fa-solid fa-handshake"></i> 受任人（代為承租／簽約人）資料';
        }

        if (previewDocTitle) {
            previewDocTitle.textContent = isLandlord
                ? '住宅租賃委託代理人授權書（出租專用）'
                : '住宅租賃委託代理人授權書（承租專用）';
        }

        // 更新各權限項目的描述文字
        const defs = SCOPE_DEFINITIONS[state.mode];
        Object.keys(defs).forEach(key => {
            const nameEl = document.getElementById(`scopeName_${key}`);
            const descEl = document.getElementById(`scopeDesc_${key}`);
            if (nameEl) nameEl.textContent = defs[key].title;
            if (descEl) descEl.textContent = defs[key].desc;
        });
    }

    // 初始化手寫簽名板
    function initSignatures() {
        const canvasPrincipal = document.getElementById('sigPrincipalCanvas');
        const canvasProxy = document.getElementById('sigProxyCanvas');
        const clearPrincipalBtn = document.getElementById('clearPrincipalSig');
        const clearProxyBtn = document.getElementById('clearProxySig');

        if (canvasPrincipal) {
            sigPrincipalPad = setupSignaturePad(canvasPrincipal, function (dataUrl) {
                const img = document.getElementById('previewPrincipalSigImg');
                const ph = document.getElementById('previewPrincipalSigPlaceholder');
                if (img && ph) {
                    if (dataUrl) {
                        img.src = dataUrl;
                        img.style.display = 'block';
                        ph.style.display = 'none';
                    } else {
                        img.style.display = 'none';
                        ph.style.display = 'block';
                    }
                }
            });
        }

        if (canvasProxy) {
            sigProxyPad = setupSignaturePad(canvasProxy, function (dataUrl) {
                const img = document.getElementById('previewProxySigImg');
                const ph = document.getElementById('previewProxySigPlaceholder');
                if (img && ph) {
                    if (dataUrl) {
                        img.src = dataUrl;
                        img.style.display = 'block';
                        ph.style.display = 'none';
                    } else {
                        img.style.display = 'none';
                        ph.style.display = 'block';
                    }
                }
            });
        }

        if (clearPrincipalBtn && sigPrincipalPad) {
            clearPrincipalBtn.addEventListener('click', function () {
                sigPrincipalPad.clear();
            });
        }

        if (clearProxyBtn && sigProxyPad) {
            clearProxyBtn.addEventListener('click', function () {
                sigProxyPad.clear();
            });
        }
    }

    function setupSignaturePad(canvas, onChange) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let hasDrawn = false;

        function resize() {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 2;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#0f172a';
        }

        resize();
        window.addEventListener('resize', resize);

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        }

        function start(e) {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            hasDrawn = true;
        }

        function end() {
            if (!isDrawing) return;
            isDrawing = false;
            if (hasDrawn && onChange) {
                onChange(canvas.toDataURL('image/png'));
            }
        }

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', end);

        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', end);

        return {
            clear: function () {
                const rect = canvas.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
                hasDrawn = false;
                if (onChange) onChange(null);
            },
            isEmpty: function () {
                return !hasDrawn;
            },
            toDataURL: function () {
                return hasDrawn ? canvas.toDataURL('image/png') : null;
            }
        };
    }

    // 更新右側 A4 即時預覽畫面
    function updatePreview() {
        const isLandlord = (state.mode === 'landlord');

        // 單號與日期
        setText('previewDocNo', state.docNo || 'POA-XXXXXXXX-XX');
        setText('previewAuthDate', state.authDate || '____ 年 __ 月 __ 日');
        setText('previewStartDate', state.startDate || '____ 年 __ 月 __ 日');
        setText('previewEndDate', state.endDate || '____ 年 __ 月 __ 日');

        // 房屋標的
        setText('previewPropertyAddress', state.propertyAddress || '（尚未指定租賃房屋標的門牌地址）');

        // 委任人資料
        setText('previewPrincipalName', state.principal.name || '___________');
        setText('previewPrincipalId', state.principal.id || '___________');
        setText('previewPrincipalPhone', state.principal.phone || '___________');
        setText('previewPrincipalAddress', state.principal.address || '___________');

        // 受任人資料
        setText('previewProxyName', state.proxy.name || '___________');
        setText('previewProxyId', state.proxy.id || '___________');
        setText('previewProxyPhone', state.proxy.phone || '___________');
        setText('previewProxyAddress', state.proxy.address || '___________');
        setText('previewProxyRelation', state.proxy.relation || '親屬');

        // 角色徽章與文字標籤
        setText('previewPrincipalBadge', isLandlord ? '委任人（出租人）' : '委任人（承租人）');
        setText('previewProxyBadge', isLandlord ? '受任人（代管代理人）' : '受任人（承租代理人）');

        // 簽名欄標籤與姓名
        setText('previewPrincipalSigLabel', isLandlord ? '委任人（出租人）親簽' : '委任人（承租人）親簽');
        setText('previewProxySigLabel', isLandlord ? '受任人（代管代理人）親簽' : '受任人（承租代理人）親簽');
        setText('previewPrincipalSignName', state.principal.name || '___________');
        setText('previewProxySignName', state.proxy.name || '___________');

        // 動態更新前言文字
        const preambleEl = document.getElementById('previewPreamble');
        if (preambleEl) {
            if (isLandlord) {
                preambleEl.textContent = `立授權書人 ${state.principal.name || '_______'}（以下簡稱委任人），為坐落於「${state.propertyAddress || '指定租賃標的門牌'}」之房屋所有權人／合法出租人，因事務繁忙或差旅在外，特依《民法》第103條、第167條、第528條及第534條之規定，委任 ${state.proxy.name || '_______'}（以下簡稱受任人）為合法代理人，授權於下列核定之權限範圍內，全權代理處理有關該租賃住宅之一切出租、點交及管理事宜，並具法律完全拘束力。`;
            } else {
                preambleEl.textContent = `立授權書人 ${state.principal.name || '_______'}（以下簡稱委任人），因工作差旅、兵役就學或事務繁忙不克親自辦理，特依《民法》第103條、第167條、第528條及第534條之規定，委任 ${state.proxy.name || '_______'}（以下簡稱受任人）為合法代理人，就租賃坐落於「${state.propertyAddress || '指定租賃標的門牌'}」之住宅房屋，授權於下列核定之權限範圍內，代為簽約、點交、繳納租金押金及受領房屋之一切承租事宜。`;
            }
        }

        // 授權項目清單渲染
        const clauseListEl = document.getElementById('previewClauseList');
        if (clauseListEl) {
            clauseListEl.innerHTML = '';
            const defs = SCOPE_DEFINITIONS[state.mode];

            Object.keys(defs).forEach((key, index) => {
                const isChecked = Boolean(state.scopes[key]);
                const item = defs[key];

                const li = document.createElement('li');
                li.className = 'doc-clause-item';
                li.innerHTML = `
                    <span class="doc-check-box ${isChecked ? 'checked' : ''}">${isChecked ? '✓' : ''}</span>
                    <div class="doc-clause-text">
                        <strong>${index + 1}. ${escapeHTML(item.title)}：</strong>
                        <span>${escapeHTML(item.desc)}</span>
                    </div>
                `;
                clauseListEl.appendChild(li);
            });
        }

        // 特別約定事項
        const notesBox = document.getElementById('previewSpecialNotesBox');
        const notesText = document.getElementById('previewSpecialNotes');
        if (notesBox && notesText) {
            if (state.specialNotes.trim()) {
                notesBox.style.display = 'block';
                notesText.textContent = state.specialNotes;
            } else {
                notesBox.style.display = 'none';
            }
        }

        // 身分證黏貼格顯示切換
        const idSection = document.getElementById('previewIdSection');
        if (idSection) {
            idSection.style.display = state.showIdAttachment ? 'block' : 'none';
        }
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    // 列印功能
    function handlePrint() {
        window.print();
    }

    // 匯出高畫質 Canvas 圖卡 (840×1080px)
    function handleDownloadImage() {
        const canvas = document.createElement('canvas');
        canvas.width = 840;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // 背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 840, 1080);

        // 頂部海軍藍裝飾條
        ctx.fillStyle = '#1a365d';
        ctx.fillRect(0, 0, 840, 24);

        // 品牌標頭
        ctx.fillStyle = '#c5a059';
        ctx.font = 'bold 16px "Noto Serif TC", serif, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司 ｜ GANJU REAL ESTATE', 420, 60);

        // 主標題
        ctx.fillStyle = '#111827';
        ctx.font = '900 28px "Noto Serif TC", serif, sans-serif';
        const docTitle = state.mode === 'landlord'
            ? '住宅租賃委託代理人授權書（出租專用）'
            : '住宅租賃委託代理人授權書（承租專用）';
        ctx.fillText(docTitle, 420, 98);

        // 分隔線
        ctx.strokeStyle = '#c5a059';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 115);
        ctx.lineTo(780, 115);
        ctx.stroke();

        // 單號與日期
        ctx.fillStyle = '#4b5563';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`授權字號：${state.docNo || 'POA-20261025-01'}`, 60, 140);
        ctx.textAlign = 'right';
        ctx.fillText(`授權有效期間：${state.startDate} 至 ${state.endDate}`, 780, 140);

        // 雙方資訊卡 (左右對稱雙卡)
        // 左：委任人
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(60, 160, 345, 135, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(state.mode === 'landlord' ? '委任人（出租人）' : '委任人（承租人）', 75, 186);

        ctx.fillStyle = '#334155';
        ctx.font = '13px sans-serif';
        ctx.fillText(`姓名：${state.principal.name || '未填寫'}`, 75, 212);
        ctx.fillText(`身分證號：${state.principal.id || '未填寫'}`, 75, 234);
        ctx.fillText(`電話：${state.principal.phone || '未填寫'}`, 75, 256);
        ctx.fillText(`戶籍：${(state.principal.address || '未填寫').substring(0, 18)}...`, 75, 278);

        // 右：受任人
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(435, 160, 345, 135, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#c5a059';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(state.mode === 'landlord' ? '受任人（代理人）' : '受任人（承租代理人）', 450, 186);

        ctx.fillStyle = '#334155';
        ctx.font = '13px sans-serif';
        ctx.fillText(`姓名：${state.proxy.name || '未填寫'}（關係：${state.proxy.relation}）`, 450, 212);
        ctx.fillText(`身分證號：${state.proxy.id || '未填寫'}`, 450, 234);
        ctx.fillText(`電話：${state.proxy.phone || '未填寫'}`, 450, 256);
        ctx.fillText(`戶籍：${(state.proxy.address || '未填寫').substring(0, 18)}...`, 450, 278);

        // 租賃房屋標的
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(60, 310, 720, 42, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`委任租賃標的：${state.propertyAddress || '尚未指定門牌地址'}`, 75, 336);

        // 授權項目清單標題
        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 16px "Noto Serif TC", serif, sans-serif';
        ctx.fillText('授權委任權限範圍（核准項目）：', 60, 380);

        // 授權項目列表
        const defs = SCOPE_DEFINITIONS[state.mode];
        let currentY = 410;
        ctx.font = '13px sans-serif';

        Object.keys(defs).forEach((k, idx) => {
            const isChecked = Boolean(state.scopes[k]);
            const item = defs[k];

            // 核選格
            ctx.fillStyle = isChecked ? '#1a365d' : '#ffffff';
            ctx.strokeStyle = '#1a365d';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(65, currentY - 12, 14, 14, 2);
            ctx.fill();
            ctx.stroke();

            if (isChecked) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px sans-serif';
                ctx.fillText('✓', 68, currentY);
            }

            // 文字
            ctx.fillStyle = isChecked ? '#0f172a' : '#94a3b8';
            ctx.font = isChecked ? 'bold 13px sans-serif' : '13px sans-serif';
            ctx.fillText(`${idx + 1}. ${item.title}`, 90, currentY);

            // 描述
            ctx.fillStyle = isChecked ? '#475569' : '#cbd5e1';
            ctx.font = '11px sans-serif';
            ctx.fillText(item.desc.substring(0, 46) + '...', 110, currentY + 18);

            currentY += 40;
        });

        // 法律切結宣告摘要
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.roundRect(60, 710, 720, 85, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '11px sans-serif';
        ctx.fillText('【法律效力與切結宣告】', 75, 730);
        ctx.fillText('1. 本授權書依民法第103條規定，代理人於代理權限內以本人名義所為之意思表示，直接對委任人發生效力。', 75, 748);
        ctx.fillText('2. 委任人承諾受任人於上述授權範圍內簽署之所有契約與點交單，委任人均無條件承受並負完全法律責任。', 75, 765);
        ctx.fillText('3. 授權終止或撤回須以書面正式通知受託代管單位與相對人，未經書面通知前不得對抗善意第三人。', 75, 782);

        // 簽名區域
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(60, 810, 345, 120);
        ctx.strokeRect(435, 810, 345, 120);

        ctx.fillStyle = '#1a365d';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('委任人親筆簽名蓋章：', 75, 835);
        ctx.fillText('受任人親筆簽名蓋章：', 450, 835);

        // 畫入簽名 (若有)
        const principalSigImg = document.getElementById('previewPrincipalSigImg');
        const proxySigImg = document.getElementById('previewProxySigImg');

        if (principalSigImg && principalSigImg.style.display !== 'none' && principalSigImg.src) {
            ctx.drawImage(principalSigImg, 100, 845, 200, 75);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 12px sans-serif';
            ctx.fillText('（委任人親自簽署區）', 150, 880);
        }

        if (proxySigImg && proxySigImg.style.display !== 'none' && proxySigImg.src) {
            ctx.drawImage(proxySigImg, 475, 845, 200, 75);
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 12px sans-serif';
            ctx.fillText('（受任人親自簽署區）', 525, 880);
        }

        // 底部官方資訊
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('港居不動產開發有限公司 ｜ 高雄市特許租賃住宅服務業 ｜ 統編：96797997 ｜ 僅供租賃授權備查使用', 420, 960);

        // 下載檔案
        const link = document.createElement('a');
        link.download = `租賃授權委任書_${state.docNo || 'POA'}_${state.principal.name || '委任人'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // LINE 文字複製
    function handleCopyLine() {
        const isLandlord = (state.mode === 'landlord');
        const checkedScopeTitles = [];
        const defs = SCOPE_DEFINITIONS[state.mode];

        Object.keys(defs).forEach((k, i) => {
            if (state.scopes[k]) {
                checkedScopeTitles.push(`  ${i + 1}. ${defs[k].title}`);
            }
        });

        const text = `【港居不動產 租賃住宅授權委託代理備忘】
━━━━━━━━━━━━━━━━━━━━
📄 授權單號：${state.docNo || 'POA-20261025-01'}
📌 授權性質：${isLandlord ? '房東委託代理出租' : '租客委託代理承租'}
📍 租賃標的：${state.propertyAddress || '指定房屋門牌'}
📅 有效期間：${state.startDate} 至 ${state.endDate}

👤 委任人（本人）：${state.principal.name || '未填'}（身分證：${state.principal.id || '未填'}）
🤝 受任人（代理）：${state.proxy.name || '未填'}（關係：${state.proxy.relation}／電話：${state.proxy.phone || '未填'}）

📋 授權委任範圍：
${checkedScopeTitles.join('\n')}
${state.specialNotes ? `\n⚠️ 特別約定事項：\n  ${state.specialNotes}` : ''}

⚖️ 法務聲明：
本授權書依民法§103/§528規定成立，受任人於權限內之行為直接對委任人發生效力，特此通知備查。
━━━━━━━━━━━━━━━━━━━━
港居不動產開發有限公司（統編：96797997）`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                alert('✅ 授權委任通知文字已成功複製至剪貼簿！可直接貼至 LINE 給雙方與代管專員。');
            }).catch(() => {
                promptCopy(text);
            });
        } else {
            promptCopy(text);
        }
    }

    function promptCopy(text) {
        window.prompt('請複製以下授權備忘文字：', text);
    }

    // 載入示範資料
    function handleLoadSample() {
        const isLandlord = (state.mode === 'landlord');

        state.propertyAddress = '高雄市小港區中安路 880 號 5 樓之 2';

        if (isLandlord) {
            state.principal.name = '林鴻章';
            state.principal.id = 'E123456789';
            state.principal.phone = '0912-345-678';
            state.principal.address = '高雄市左營區博愛二路 120 號';

            state.proxy.name = '陳俊銘';
            state.proxy.id = 'S189012345';
            state.proxy.phone = '0988-888-888';
            state.proxy.address = '高雄市小港區中安路 880 號';
            state.proxy.relation = '代管經辦專員';

            state.specialNotes = '受任人代收各期租金時，應於受領後三日內匯入委任人指定台灣銀行帳戶。';
        } else {
            state.principal.name = '陳美玲';
            state.principal.id = 'A234567890';
            state.principal.phone = '0933-222-111';
            state.principal.address = '台北市大安區信義路三段 100 號';

            state.proxy.name = '陳冠廷';
            state.proxy.id = 'A198765432';
            state.proxy.phone = '0955-666-777';
            state.proxy.address = '高雄市前鎮區中山二路 50 號';
            state.proxy.relation = '親屬（胞弟）';

            state.specialNotes = '受任人僅代理辦理合約簽署與現場鑰匙點交，不可擅自提前終止契約。';
        }

        // 回填至表單 DOM
        syncStateToForm();
        updatePreview();
    }

    function syncStateToForm() {
        setVal('inputPropertyAddress', state.propertyAddress);
        setVal('inputPrincipalName', state.principal.name);
        setVal('inputPrincipalId', state.principal.id);
        setVal('inputPrincipalPhone', state.principal.phone);
        setVal('inputPrincipalAddress', state.principal.address);

        setVal('inputProxyName', state.proxy.name);
        setVal('inputProxyId', state.proxy.id);
        setVal('inputProxyPhone', state.proxy.phone);
        setVal('inputProxyAddress', state.proxy.address);
        setVal('selectProxyRelation', state.proxy.relation);

        setVal('inputSpecialNotes', state.specialNotes);
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    }

    // 重設表單
    function handleReset() {
        if (!confirm('確定要清空目前填寫的所有資料嗎？')) return;

        state.principal.name = '';
        state.principal.id = '';
        state.principal.phone = '';
        state.principal.address = '';

        state.proxy.name = '';
        state.proxy.id = '';
        state.proxy.phone = '';
        state.proxy.address = '';
        state.proxy.relation = '親屬';

        state.propertyAddress = '';
        state.specialNotes = '';

        initDefaults();
        syncStateToForm();

        if (sigPrincipalPad) sigPrincipalPad.clear();
        if (sigProxyPad) sigProxyPad.clear();

        updatePreview();
    }

    // 啟動主流程
    document.addEventListener('DOMContentLoaded', function () {
        initDefaults();
        bindInputs();
        initSignatures();
        setMode('landlord');
        updatePreview();
    });

})();
