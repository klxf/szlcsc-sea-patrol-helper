// ==UserScript==
// @name         立创商城大航海计划助手
// @namespace    https://github.com/klxf/szlcsc-sea-patrol-helper
// @version      1.3
// @description  在搜索结果与详情页中标记大航海计划内的器件（支持自定义数据源）
// @author       klxf
// @match        https://so.szlcsc.com/*
// @match        https://list.szlcsc.com/*
// @match        https://item.szlcsc.com/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
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

    let COMPONENT_DATA = {};
    let matcher = null;
    let highlighter = null;

    const TARGET_SELECTOR = 'div div section div div div:nth-child(2) dl dd';

    const SVG = `<svg t="1774202466413" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1796" width="256" height="256"><path d="M512 0a512 512 0 0 0 0 1024c122.148571 0 234.203429-42.934857 322.267429-114.322286l56.905142-54.491428A509.513143 509.513143 0 0 0 1024 512a512 512 0 0 0-512-512zM390.290286 173.494857s42.496-42.496 127.488-42.496c84.918857 0 127.414857 42.422857 127.414857 42.422857v127.488s-21.211429-10.605714-63.707429-16.822857v-58.88s0-31.817143-63.707428-31.817143c-63.780571 0-63.780571 31.817143-63.780572 31.817143v58.88c-42.422857 6.217143-63.634286 16.822857-63.634285 16.822857V173.494857zM305.371429 343.332571l212.406857-42.422857 212.333714 42.422857 21.211429 106.203429-233.545143-63.634286-233.618286 63.634286 21.211429-106.203429z m466.285714 148.699429V640.731429s-21.211429 42.422857-84.992 42.422857c-57.782857 0-80.603429-52.370286-147.675429-62.171429V433.956571l232.594286 58.148572z m-509.805714 0l234.642285-58.660571v187.392c-68.608 8.996571-91.355429 62.390857-149.650285 62.390857-63.707429 0-84.918857-42.422857-84.918858-42.422857V492.032z m553.252571 276.114286s-63.707429 42.422857-127.414857 42.422857-84.992-63.634286-169.910857-63.634286c-84.992 0-84.992 63.634286-169.910857 63.634286-84.992 0-127.488-42.422857-127.488-42.422857s-42.422857-21.211429-42.422858-63.707429c0-47.908571 63.634286-21.211429 63.634286-21.211428s21.284571 42.422857 106.276572 42.422857c84.918857 0 84.918857-63.707429 169.910857-63.707429 84.918857 0 84.918857 63.707429 169.910857 63.707429 84.918857 0 106.203429-42.422857 106.203428-42.422857s63.634286-26.331429 63.634286 21.211428c0 42.422857-42.422857 63.634286-42.422857 63.634286z" fill="#33A0FE" p-id="1797"></path></svg>`;

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
    GM_registerMenuCommand('清理缓存', async () => {
        try {
            GM_setValue(STORAGE_KEY_URL, undefined);
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
                const text = this.extractor.extractFromDD(dd);
                if (!text) return;

                const match = this.matcher.findMatch(text);
                if (match) {
                    this.mark(dd, match);
                }
                dd._lcscChecked = true;
            });
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
            const h1 = document.querySelector('h1');
            if (!h1) return false;

            const rawText = h1.textContent || '';
            const cleanText = rawText.trim().toUpperCase().replace(/\s+/g, '');

            log('H1 文本:', rawText, '清理后:', cleanText);

            if (COMPONENT_DATA[cleanText]) {
                if (h1.querySelector('.spprj-sailor-icon')) return true;

                const data = COMPONENT_DATA[cleanText];
                const svgWrapper = document.createElement('span');
                svgWrapper.innerHTML = SVG;
                const svg = svgWrapper.querySelector('svg');

                svg.style.height = '27px';
                svg.style.width = 'auto';
                svg.style.verticalAlign = 'middle';
                svg.style.marginLeft = '8px';
                svg.style.display = 'inline-block';
                svg.style.cursor = 'help';

                const svgTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                svgTitle.textContent = `大航海计划: 免费数量 ${data.freeQty} 个，起订需付 ¥${data.minTotal}`;
                svg.prepend(svgTitle);

                h1.after(svg);
                log('已添加大航海标识:', cleanText);
                return true;
            } else {
                log('未匹配:', cleanText);
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

        /* 设置弹窗样式 */
        #spprj-settings-modal .spprj-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #spprj-settings-modal .spprj-modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #spprj-settings-modal h3 { margin: 0 0 15px 0; font-size: 18px; color: #333; }
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
        .spprj-btn-primary { background: #ff4444; color: white; }
        .spprj-btn-secondary { background: #e0e0e0; color: #333; }
        .spprj-modal-buttons button:hover { opacity: 0.9; }
        .spprj-status { margin-top: 10px; font-size: 13px; min-height: 20px; }
    `);

    async function init() {
        const hasLocalData = loadStoredData();
        matcher = new ComponentMatcher(COMPONENT_DATA);

        if (location.hostname.includes('item.szlcsc.com')) {
            processItemPage();
        } else {
            highlighter = new Highlighter();
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
