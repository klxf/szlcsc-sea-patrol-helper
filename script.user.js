// ==UserScript==
// @name         立创商城大航海计划助手
// @namespace    https://github.com/klxf/szlcsc-sea-patrol-helper
// @version      2.1.1
// @description  在搜索结果与详情页中标记大航海计划内的器件
// @author       klxf
// @match        https://so.szlcsc.com/*
// @match        https://list.szlcsc.com/*
// @match        https://item.szlcsc.com/*
// @match        https://activity.szlcsc.com/sea_patrol_project.html*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @license      Apache-2.0
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = false;
    function log(...args) {
        if (DEBUG) console.log('[SPPrj]', ...args);
    }

    const DEFAULT_URL = 'https://raw.githubusercontent.com/klxf/szlcsc-sea-patrol-helper/refs/heads/master/sea_patrol_project.json';
    const STORAGE_KEY_DATA = 'szlcsc_sp_data';
    const STORAGE_KEY_URL = 'szlcsc_sp_url';
    const STORAGE_KEY_PREPARE = 'szlcsc_sp_prepare';

    let COMPONENT_DATA = {};
    let matcher = null;
    let highlighter = null;

    const TARGET_SELECTOR = 'div div section div div div:nth-child(2) dl dd';
    const PRODUCT_CODE_SELECTOR = 'div div section div div div:nth-child(2) dl:nth-child(5) dd';

    const LOGO = "https://static.szlcsc.com/ecp/assets/web/page/order/orderManage/images/big-sea.svg";

    function loadStoredData() {
        const saved = GM_getValue(STORAGE_KEY_DATA, null);
        if (saved) {
            COMPONENT_DATA = saved;
            log('已从存储加载数据:', Object.keys(COMPONENT_DATA).length, '条');
            return true;
        }
        return false;
    }

    function saveData(data) {
        COMPONENT_DATA = data;
        GM_setValue(STORAGE_KEY_DATA, data);
        if (matcher) {
            matcher.updateData(data);
        }
        log('数据已保存并更新索引');
    }

    function fetchDataFromURL(url) {
        return new Promise((resolve, reject) => {
            log('正在从 URL 获取数据:', url);
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'Accept': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            saveData(data);
                            resolve(data);
                        } else {
                            reject(new Error('HTTP ' + response.status));
                        }
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    function loadPrepareList() {
        return GM_getValue(STORAGE_KEY_PREPARE, []);
    }

    function savePrepareList(list) {
        GM_setValue(STORAGE_KEY_PREPARE, list);
    }

    function openSettings() {
        const existing = document.getElementById('spprj-settings-modal');
        if (existing) existing.remove();

        const currentUrl = GM_getValue(STORAGE_KEY_URL, DEFAULT_URL);

        const modal = document.createElement('div');
        modal.id = 'spprj-settings-modal';
        modal.innerHTML = `
            <div class="spprj-modal-overlay">
                <div class="spprj-modal-content">
                    <h3>设置数据源</h3>
                    <div class="spprj-form-group">
                        <label>数据 URL：</label>
                        <input type="text" id="spprj-url-input" value="${currentUrl}" placeholder="https://example.com/data.json">
                    </div>
                    <div class="spprj-modal-buttons">
                        <button id="spprj-btn-fetch" class="spprj-btn-primary">获取并保存</button>
                        <button id="spprj-btn-save" class="spprj-btn-secondary">仅保存 URL</button>
                        <button id="spprj-btn-close" class="spprj-btn-secondary">关闭</button>
                    </div>
                    <div id="spprj-status" class="spprj-status"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const urlInput = document.getElementById('spprj-url-input');
        const statusDiv = document.getElementById('spprj-status');

        document.getElementById('spprj-btn-close').onclick = () => modal.remove();

        document.getElementById('spprj-btn-save').onclick = () => {
            GM_setValue(STORAGE_KEY_URL, urlInput.value.trim());
            statusDiv.textContent = 'URL 已保存';
            statusDiv.style.color = '#4ade80';
        };

        document.getElementById('spprj-btn-fetch').onclick = async () => {
            const url = urlInput.value.trim();
            if (!url) {
                statusDiv.textContent = '请输入 URL';
                statusDiv.style.color = '#ff4444';
                return;
            }

            statusDiv.textContent = '获取中...';
            statusDiv.style.color = '#666';

            try {
                await fetchDataFromURL(url);
                GM_setValue(STORAGE_KEY_URL, url);
                statusDiv.textContent = `成功获取 ${Object.keys(COMPONENT_DATA).length} 条数据`;
                statusDiv.style.color = '#4ade80';

                if (highlighter) highlighter.rescan();
                if (location.hostname.includes('item.szlcsc.com')) {
                    location.reload();
                }
            } catch (e) {
                statusDiv.textContent = '获取失败: ' + e.message;
                statusDiv.style.color = '#ff4444';
            }
        };

        modal.querySelector('.spprj-modal-overlay').onclick = (e) => {
            if (e.target === modal.querySelector('.spprj-modal-overlay')) {
                modal.remove();
            }
        };
    }

    function openPrepareManager() {
        const existing = document.getElementById('spprj-prepare-modal');
        if (existing) existing.remove();

        const list = loadPrepareList();
        const modal = document.createElement('div');
        modal.id = 'spprj-prepare-modal';

        let rowsHtml = '';
        if (list.length === 0) {
            rowsHtml = '<tr><td colspan="3" style="text-align:center;color:#999;padding:20px;">预备料列表为空</td></tr>';
        } else {
            list.forEach((item, index) => {
                rowsHtml += `
                    <tr data-index="${index}">
                        <td style="padding:8px;border-bottom:1px solid #eee;">${item.cid}</td>
                        <td style="padding:8px;border-bottom:1px solid #eee;">
                            <input type="number" class="spprj-prepare-qty" data-index="${index}" value="${item.qty}" style="width:60px;padding:4px;border:1px solid #ddd;border-radius:4px;">
                        </td>
                        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">
                            <button class="spprj-btn-delete" data-index="${index}" style="background:#ff4444;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;">删除</button>
                        </td>
                    </tr>
                `;
            });
        }

        modal.innerHTML = `
            <div class="spprj-modal-overlay">
                <div class="spprj-modal-content" style="max-width:600px;">
                    <h3>管理大航海预备料</h3>
                    <div style="max-height:400px;overflow-y:auto;margin:15px 0;">
                        <table style="width:100%;border-collapse:collapse;font-size:14px;">
                            <thead>
                                <tr style="background:#f5f5f5;">
                                    <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">CID</th>
                                    <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;">数量</th>
                                    <th style="padding:10px;text-align:center;border-bottom:2px solid #ddd;">操作</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                    <div class="spprj-modal-buttons">
                        <button id="spprj-btn-clear" class="spprj-btn-primary">清空</button>
                        <button id="spprj-btn-close" class="spprj-btn-secondary">关闭</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('spprj-btn-close').onclick = () => modal.remove();

        document.getElementById('spprj-btn-clear').onclick = () => {
            if (confirm('确定要清空预备料列表吗？')) {
                savePrepareList([]);
                openPrepareManager();
            }
        };

        modal.querySelectorAll('.spprj-prepare-qty').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const newQty = parseInt(e.target.value, 10);
                const currentList = loadPrepareList();
                if (currentList[idx]) {
                    if (isNaN(newQty) || newQty <= 0) {
                        alert('请输入有效的数量');
                        e.target.value = currentList[idx].qty;
                        return;
                    }
                    currentList[idx].qty = newQty;
                    savePrepareList(currentList);
                }
            });
        });

        modal.querySelectorAll('.spprj-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const currentList = loadPrepareList();
                currentList.splice(idx, 1);
                savePrepareList(currentList);
                openPrepareManager();
            });
        });

        modal.querySelector('.spprj-modal-overlay').onclick = (e) => {
            if (e.target === modal.querySelector('.spprj-modal-overlay')) {
                modal.remove();
            }
        };
    }

    function initPrepareButton() {
        if (!location.href.includes('activity.szlcsc.com/sea_patrol_project.html')) return;
        if (document.getElementById('spprj-prepare-float-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'spprj-prepare-float-btn';
        btn.className = 'spprj-prepare-float-btn';
        btn.textContent = '一键备料';
        document.body.appendChild(btn);

        btn.addEventListener('click', async () => {
            const uuid = new URLSearchParams(location.search).get('uuid');
            if (!uuid) {
                alert('无法获取项目 UUID，请确认 URL 包含 uuid 参数');
                return;
            }

            const list = loadPrepareList();
            if (list.length === 0) {
                alert('预备料列表为空');
                return;
            }

            const productList = list.map(item => ({
                productCode: item.cid,
                purchaseNum: item.qty || 1
            }));

            try {
                const response = await fetch("https://activity.szlcsc.com/itp/voyage/async/pending/product/save", {
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        voyageCustomerProjectUuid: uuid,
                        productList: productList,
                        addType: "add"
                    }),
                    method: "POST",
                    mode: "cors",
                    credentials: "include"
                });

                const result = await response.json();
                if (response.ok && (result.code === 200 || result.success === true)) {
                    alert('备料成功！共提交 ' + productList.length + ' 个物料');
                } else {
                    alert('备料失败：' + (result.message || result.msg || JSON.stringify(result)));
                }
            } catch (e) {
                alert('备料请求失败：' + e.message);
            }
        });
    }

    GM_registerMenuCommand('设置数据源', openSettings);
    GM_registerMenuCommand('更新数据', async () => {
        const url = GM_getValue(STORAGE_KEY_URL, DEFAULT_URL);
        try {
            await fetchDataFromURL(url);
            alert(`数据已更新：${Object.keys(COMPONENT_DATA).length} 条`);
            if (highlighter) highlighter.rescan();
        } catch (e) {
            alert('获取失败: ' + e.message);
        }
    });
    GM_registerMenuCommand('管理预备料', openPrepareManager);
    GM_registerMenuCommand('清理缓存', async () => {
        try {
            GM_setValue(STORAGE_KEY_DATA, undefined);
            alert('缓存已清除');
        } catch (e) {
            alert('清理失败: ' + e.message);
        }
    });

    class TextExtractor {
        constructor(matcher) {
            if (!matcher) throw new Error('TextExtractor requires a matcher instance');
            this.matcher = matcher;
        }

        extractFromDD(dd) {
            if (!dd || dd._lcscChecked) return null;
            if (!this.matcher) return null;

            const ddText = this._normalize(dd.textContent);
            if (this.matcher.hasExact(ddText)) return ddText;

            const highlightSpan = dd.querySelector('.LUCENE_HIGHLIGHT_CLASS');
            if (highlightSpan) {
                const parentText = this._getParentText(highlightSpan);
                if (parentText && this.matcher.hasExact(parentText)) return parentText;

                const extracted = this._extractByPosition(highlightSpan);
                if (extracted) return extracted;

                const highlightOnly = this._normalize(highlightSpan.textContent);
                if (this.matcher.hasExact(highlightOnly)) return highlightOnly;
            }

            const link = dd.querySelector('a');
            if (link) {
                const linkText = this._normalize(link.textContent);
                if (this.matcher.hasExact(linkText)) return linkText;
            }

            return null;
        }

        _getParentText(highlightSpan) {
            let current = highlightSpan.parentElement;
            const dd = highlightSpan.closest('dd');
            while (current && current !== dd) {
                const text = this._normalize(current.textContent);
                if (this.matcher.hasExact(text)) return text;
                current = current.parentElement;
            }
            return null;
        }

        _extractByPosition(highlightSpan) {
            const highlightText = this._normalize(highlightSpan.textContent);
            if (!highlightText) return null;

            const container = highlightSpan.closest('a, span[class]') || highlightSpan.parentElement;
            if (!container) return null;

            const containerText = this._normalize(container.textContent);
            const idx = containerText.indexOf(highlightText);
            if (idx === -1) return null;

            const maxExtra = Math.min(5, containerText.length - idx - highlightText.length);
            for (let extra = 0; extra <= maxExtra; extra++) {
                const candidate = containerText.substring(idx, idx + highlightText.length + extra);
                if (this.matcher.hasExact(candidate)) return candidate;
            }

            for (let len = highlightText.length; len <= Math.min(highlightText.length + 5, containerText.length); len++) {
                const candidate = containerText.substring(0, len);
                if (this.matcher.hasExact(candidate)) return candidate;
            }
            return null;
        }

        _normalize(text) {
            if (!text) return null;
            return text.toUpperCase().replace(/\s+/g, '');
        }
    }

    class ComponentMatcher {
        constructor(data) {
            this.map = new Map();
            this.updateData(data || {});
        }

        updateData(data) {
            this.map.clear();
            Object.entries(data).forEach(([k, v]) => {
                const normalized = k.toUpperCase().replace(/\s+/g, '');
                this.map.set(normalized, { key: k, data: v });
            });
            log('索引已更新:', this.map.size, '条');
        }

        hasExact(text) {
            if (!text) return false;
            return this.map.has(text);
        }

        findMatch(text) {
            if (!text) return null;
            return this.map.get(text) || null;
        }
    }

    class Highlighter {
        constructor() {
            this.matcher = matcher || new ComponentMatcher(COMPONENT_DATA);
            this.extractor = new TextExtractor(this.matcher);
            this.tooltip = this.createTooltip();
            this.init();
        }

        createTooltip() {
            const tip = document.createElement('div');
            tip.id = 'spprj-tip';
            tip.innerHTML = `<div class="spprj-tip-title"></div>
                <div class="spprj-tip-row">免费数量: <span class="spprj-tip-val" id="tip-free"></span></div>
                <div class="spprj-tip-row">起订需付: <span class="spprj-tip-val" id="tip-price"></span></div>
                <div class="spprj-tip-row">* 仅立创商城现货可免费</div>`;
            document.body.appendChild(tip);
            return tip;
        }

        init() {
            const containers = document.querySelectorAll('.ant-spin-container');
            containers.forEach(c => {
                new MutationObserver((mutations) => {
                    let shouldScan = false;
                    mutations.forEach(m => {
                        if (m.type === 'childList' && m.addedNodes.length > 0) shouldScan = true;
                        if (m.type === 'attributes' && m.attributeName === 'class' && m.target._lcscMatched) {
                            this.enforceStyle(m.target);
                        }
                    });
                    if (shouldScan) setTimeout(() => this.scan(), 300);
                }).observe(c, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            });

            setTimeout(() => this.scan(), 500);
            log('Highlighter 初始化完成');
        }

        rescan() {
            document.querySelectorAll(TARGET_SELECTOR).forEach(dd => {
                dd._lcscChecked = false;
                dd._lcscMatched = false;
                dd.classList.remove('spprj-matched');
                dd.removeAttribute('data-spprj-marked');
                const badge = dd.querySelector('.spprj-badge');
                if (badge) badge.remove();
            });
            this.scan();
        }

        enforceStyle(dd) {
            if (!dd._lcscMatched && !dd.hasAttribute('data-spprj-marked')) return;
            if (!dd.classList.contains('spprj-matched')) {
                dd.classList.add('spprj-matched');
                dd.setAttribute('data-spprj-marked', 'true');
            }
            if (!dd.querySelector('.spprj-badge')) {
                const badge = document.createElement('span');
                badge.className = 'spprj-badge';
                badge.textContent = '?';
                dd.appendChild(badge);
            }
        }

        scan() {
            if (!this.matcher || this.matcher.map.size === 0) {
                log('数据为空，跳过扫描');
                return;
            }

            const dds = document.querySelectorAll(TARGET_SELECTOR);
            log('扫描到', dds.length, '个目标元素');

            dds.forEach(dd => {
                if (dd._lcscMatched) return;

                const productCodeDD = this._getProductCodeDD(dd);
                const productCodeText = productCodeDD ? productCodeDD.textContent.toUpperCase() : null;

                const text = this.extractor.extractFromDD(dd);
                if (!text) return;

                const match = this.matcher.findMatch(text);
                if (match) {
                    const dbProductCode = match.data.productCode;
                    if (dbProductCode && productCodeText) {
                        if (productCodeText === dbProductCode) {
                            log('型号和 productCode 同时匹配:', text, productCodeText);
                            this.mark(dd, match);
                        } else {
                            log('型号匹配但 productCode 不匹配:', text, 'db:', dbProductCode, 'page:', productCodeText);
                        }
                    } else if (!dbProductCode) {
                        log('仅型号匹配（无 productCode）:', text);
                        this.mark(dd, match);
                    } else {
                        log('需要 productCode 但未找到对应元素:', text);
                    }
                }
                dd._lcscChecked = true;
            });
        }

        _getProductCodeDD(targetDD) {
            // 从目标 dd 向上找到 section，然后查找 dl:nth-child(5) dd
            const section = targetDD.closest('section');
            if (!section) return null;

            const productCodeDL = section.querySelector('div div:nth-child(2) dl:nth-child(5)');
            if (!productCodeDL) return null;

            return productCodeDL.querySelector('dd');
        }

        mark(dd, { key, data }) {
            dd._lcscMatched = true;
            dd.classList.add('spprj-matched');
            dd.setAttribute('data-spprj-marked', 'true');

            if (!dd.querySelector('.spprj-badge')) {
                const badge = document.createElement('span');
                badge.className = 'spprj-badge';
                badge.textContent = '?';
                dd.appendChild(badge);
            }

            dd.addEventListener('mouseenter', (e) => this.showTip(e, data, key));
            dd.addEventListener('mouseleave', () => this.hideTip());
            log('标记:', key);
        }

        showTip(e, data, model) {
            this.tooltip.querySelector('.spprj-tip-title').textContent = model;
            this.tooltip.querySelector('#tip-free').textContent = (data.freeQty || 0) + '个';
            this.tooltip.querySelector('#tip-price').textContent = '¥' + (data.minTotal || 0);

            this.tooltip.style.display = 'block';
            this.tooltip.style.opacity = '1';

            const rect = this.tooltip.getBoundingClientRect();
            let left = e.clientX + 15;
            let top = e.clientY - rect.height - 10;
            if (left + rect.width > window.innerWidth) left = e.clientX - rect.width - 10;
            if (top < 0) top = e.clientY + 20;

            this.tooltip.style.left = left + 'px';
            this.tooltip.style.top = top + 'px';
        }

        hideTip() {
            this.tooltip.style.opacity = '0';
            setTimeout(() => {
                if (this.tooltip.style.opacity === '0') this.tooltip.style.display = 'none';
            }, 200);
        }
    }

    function processItemPage() {
        if (!location.hostname.includes('item.szlcsc.com')) return;

        log('处理详情页');
        if (!COMPONENT_DATA || Object.keys(COMPONENT_DATA).length === 0) {
            log('暂无数据，跳过详情页处理');
            return;
        }

        const tryProcess = () => {
            if (document.body.dataset.spprjItemProcessed) return true;

            const h1 = document.querySelector('h1');
            const addCartBtn = document.getElementById('addCartBtn-product');

            if (!h1 || !addCartBtn) return false;

            const rawText = h1.textContent || '';
            const cleanText = rawText.trim().toUpperCase().replace(/\s+/g, '');
            log('H1 文本:', rawText, '清理后:', cleanText);

            let productCode = document.querySelectorAll("section div:nth-child(2) div:nth-child(3) dl div:nth-child(4) dd")[0]?.textContent;
            if (!productCode || !(/^C\d+$/.test(productCode))) {
                const alt = document.querySelectorAll("section div:nth-child(2) div:nth-child(3) dl div:nth-child(3) dd")[0];
                productCode = alt ? alt.textContent : null;
            }

            if (!productCode) return false;

            const dbProductCode = COMPONENT_DATA[cleanText]?.productCode;
            const isSeaPatrol = COMPONENT_DATA[cleanText] && productCode === dbProductCode;

            const hasLogo = h1.parentElement ? !!h1.parentElement.querySelector('.spprj-sailor-icon') : false;

            if (isSeaPatrol && !hasLogo) {
                const data = COMPONENT_DATA[cleanText];
                const logoWrapper = document.createElement('span');
                const altText = `大航海计划: \n免费数量 ${data.freeQty} 个 \n起订需付 ¥${data.minTotal}`;
                logoWrapper.innerHTML = `<img alt="大航海计划" title="${altText}" width="61" height="24" class="spprj-sailor-icon ml-[6px]" src="${LOGO}" style="color: transparent;">`;
                h1.after(logoWrapper);
                log('已添加大航海标识:', cleanText);
            }

            if (!document.getElementById('addCartBtn-seaPatrol')) {
                const targetContainer = addCartBtn.parentElement?.parentElement;
                if (targetContainer) {
                    const seaBtn = document.createElement('button');
                    seaBtn.id = 'addCartBtn-seaPatrol';
                    seaBtn.className = 'mt-[10px] flex w-full items-center justify-center h-[48px] border-[#ABB5C9] hover:text-[rgba(57,74,111,0.8)] border-[1px] bg-[#F6F7F9] rounded-[30px] text-[16px] leading-[48px] text-[#394A6F]';
                    seaBtn.textContent = '大航海预备料';

                    seaBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const list = loadPrepareList();
                        const idx = list.findIndex(item => item.cid === productCode);
                        let minQty = parseInt(document.querySelectorAll('div div:nth-child(2) section div:nth-child(7) span')[0].textContent.replaceAll(' ', '').match(/\d+/)[0], 10);
                        if (isSeaPatrol && COMPONENT_DATA[cleanText]?.freeQty > 0 && minQty < COMPONENT_DATA[cleanText].freeQty) {
                            minQty = COMPONENT_DATA[cleanText].freeQty;
                        }
                        if (idx >= 0) {
                            list[idx].qty += minQty;
                            if (isSeaPatrol && list[idx].qty > COMPONENT_DATA[cleanText]?.freeQty) {
                                alert(`${productCode} 为已存在于预备料列表的大航海计划器件，数量增加 ${minQty} 个，已超出免费范围（${COMPONENT_DATA[cleanText].freeQty}）`);
                            } else {
                                alert(`${productCode} 已存在于预备料列表，数量增加 ${minQty} 个`);
                            }
                        } else {
                            list.push({ cid: productCode, qty: minQty });
                            alert(`已将 ${minQty} 个 ${productCode} 加入预备料列表`);
                        }
                        savePrepareList(list);
                    });

                    targetContainer.appendChild(seaBtn);
                    log('已添加预备料按钮:', productCode);
                }
            }

            const btnAdded = !!document.getElementById('addCartBtn-seaPatrol');
            const svgAdded = isSeaPatrol ? !!h1.parentElement?.querySelector('.spprj-sailor-icon') : true;

            if (btnAdded && svgAdded) {
                document.body.dataset.spprjItemProcessed = 'true';
                return true;
            }

            return false;
        };

        if (tryProcess()) return;

        const observer = new MutationObserver((mutations, obs) => {
            if (tryProcess()) obs.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 5000);
    }

    GM_addStyle(`
        .spprj-matched, [data-spprj-marked="true"] {
            position: relative !important;
            background: linear-gradient(90deg, rgba(255, 230, 230, 0.6) 0%, transparent 100%) !important;
            border-left: 3px solid #ff4444 !important;
            padding-left: 8px !important;
            transition: all 0.2s ease !important;
        }
        .spprj-matched:hover {
            background: linear-gradient(90deg, rgba(255, 230, 230, 0.9) 0%, rgba(255, 240, 240, 0.3) 100%) !important;
            box-shadow: 0 0 8px rgba(255, 0, 0, 0.1) !important;
        }
        .spprj-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            font-size: 11px;
            font-weight: bold;
            margin-left: 6px;
            cursor: help;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            vertical-align: middle;
        }
        #spprj-tip {
            position: fixed;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            font-size: 13px;
            z-index: 2147483647;
            display: none;
            opacity: 0;
            transition: opacity 0.2s;
            border: 1px solid #ff6b6b;
            pointer-events: none;
            min-width: 160px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .spprj-tip-title { color: #ff6b6b; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #555; padding-bottom: 4px; font-size: 14px; }
        .spprj-tip-row { display: flex; justify-content: space-between; margin: 4px 0; color: #ccc; font-size: 12px; }
        .spprj-tip-val { color: #4ade80; font-weight: 600; margin-left: 10px; }

        #spprj-settings-modal .spprj-modal-overlay,
        #spprj-prepare-modal .spprj-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #spprj-settings-modal .spprj-modal-content,
        #spprj-prepare-modal .spprj-modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #spprj-settings-modal h3,
        #spprj-prepare-modal h3 { margin: 0 0 15px 0; font-size: 18px; color: #333; }
        .spprj-form-group { margin-bottom: 15px; }
        .spprj-form-group label { display: block; margin-bottom: 5px; font-size: 14px; color: #666; }
        .spprj-form-group input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        .spprj-modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        .spprj-modal-buttons button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.2s;
        }
        .spprj-btn-primary { background: #3177F2; color: white; }
        .spprj-btn-secondary { background: #EDF9FF; color: #0093e6; }
        .spprj-modal-buttons button:hover { opacity: 0.9; }
        .spprj-status { margin-top: 10px; font-size: 13px; min-height: 20px; }

        .spprj-prepare-float-btn {
            position: fixed;
            bottom: 64px;
            right: 0;
            z-index: 999;
            padding: 12px 28px;
            background: #3177F2;
            color: #fff;
            border: none;
            border-radius: 30px 0 0 30px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            transition: all 0.2s ease;
        }
        .spprj-prepare-float-btn:hover { background: #014EFE; }
    `);

    async function init() {
        const hasLocalData = loadStoredData();
        matcher = new ComponentMatcher(COMPONENT_DATA);

        if (location.hostname.includes('item.szlcsc.com')) {
            processItemPage();
        } else {
            highlighter = new Highlighter();
        }

        if (location.href.includes('activity.szlcsc.com/sea_patrol_project.html')) {
            initPrepareButton();
        }

        if (!hasLocalData) {
            log('无本地数据，尝试获取默认 URL');
            try {
                await fetchDataFromURL(DEFAULT_URL);
                GM_setValue(STORAGE_KEY_URL, DEFAULT_URL);
                if (highlighter) highlighter.rescan();
                if (location.hostname.includes('item.szlcsc.com')) {
                    processItemPage();
                }
            } catch (e) {
                console.log('[SPPrj] 自动获取默认数据失败，请手动配置:', e);
            }
        }
    }

    init();

})();
