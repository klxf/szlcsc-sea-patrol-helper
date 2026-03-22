// ==UserScript==
// @name         立创商城大航海计划助手
// @namespace    https://github.com/klxf/szlcsc-sea-patrol-helper
// @version      1.2
// @description  在搜索结果与详情页中标记大航海计划内的器件
// @author       klxf
// @match        https://so.szlcsc.com/*
// @match        https://list.szlcsc.com/*
// @match        https://item.szlcsc.com/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = false;

    function log(...args) {
        if (DEBUG) console.log('[SPPrj]', ...args);
    }

    const TARGET_SELECTOR = 'div div section div div div:nth-child(2) dl dd';

    // 大航海计划器件列表
    const COMPONENT_DATA = {
        "0805W8F1002T5E":{"freeQty":50,"minTotal":0.75,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4701T5E":{"freeQty":50,"minTotal":0.38,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF0000T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F4701T5E":{"freeQty":50,"minTotal":0.59,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F0000T5E":{"freeQty":50,"minTotal":0.64,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1003TCE":{"freeQty":50,"minTotal":0.23,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2002T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1000T5E":{"freeQty":50,"minTotal":0.65,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F100JT5E":{"freeQty":50,"minTotal":0.75,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F0000T5E":{"freeQty":50,"minTotal":1.18,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4702T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF220JT5E":{"freeQty":50,"minTotal":0.39,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5100T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4700T5E":{"freeQty":50,"minTotal":0.44,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1003T5E":{"freeQty":50,"minTotal":0.72,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F5101T5E":{"freeQty":50,"minTotal":0.73,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2001T5E":{"freeQty":50,"minTotal":0.76,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1004T5E":{"freeQty":50,"minTotal":1.08,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F100JT5E":{"freeQty":50,"minTotal":1.09,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1000T5E":{"freeQty":50,"minTotal":1.24,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1001T5E":{"freeQty":50,"minTotal":1.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1002T5E":{"freeQty":50,"minTotal":1.43,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2002T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1004TCE":{"freeQty":50,"minTotal":0.23,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3001T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5102T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1501T5E":{"freeQty":50,"minTotal":0.41,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3301T5E":{"freeQty":50,"minTotal":0.45,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF330JT5E":{"freeQty":50,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1200T5E":{"freeQty":50,"minTotal":0.53,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F4700T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F4701T5E":{"freeQty":50,"minTotal":1.13,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF4702TCE":{"freeQty":50,"minTotal":0.24,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2003T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2000T5E":{"freeQty":50,"minTotal":0.38,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2202T5E":{"freeQty":50,"minTotal":0.47,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3301T5E":{"freeQty":50,"minTotal":0.66,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2201T5E":{"freeQty":50,"minTotal":0.69,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3300T5E":{"freeQty":50,"minTotal":0.69,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F5100T5E":{"freeQty":50,"minTotal":0.72,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1004T5E":{"freeQty":50,"minTotal":0.81,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1003T5E":{"freeQty":50,"minTotal":1.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF4700TCE":{"freeQty":50,"minTotal":0.25,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF5102TCE":{"freeQty":50,"minTotal":0.25,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF6800T5E":{"freeQty":50,"minTotal":0.38,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1202T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF6801T5E":{"freeQty":50,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1201T5E":{"freeQty":50,"minTotal":0.51,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1005T5E":{"freeQty":50,"minTotal":0.58,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F4702T5E":{"freeQty":50,"minTotal":0.62,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F200JT5E":{"freeQty":50,"minTotal":0.64,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2202T5E":{"freeQty":50,"minTotal":0.69,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2000T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2200T5E":{"freeQty":50,"minTotal":0.74,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3001T5E":{"freeQty":50,"minTotal":0.76,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F2001T5E":{"freeQty":50,"minTotal":1.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1501TCE":{"freeQty":50,"minTotal":0.25,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5601T5E":{"freeQty":50,"minTotal":0.34,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1203T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1802T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2402T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4991T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3000T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF8201T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1503T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4992T5E":{"freeQty":50,"minTotal":0.38,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5602T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1801T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2201T5E":{"freeQty":50,"minTotal":0.41,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2702T5E":{"freeQty":50,"minTotal":0.41,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3901T5E":{"freeQty":50,"minTotal":0.43,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3300T5E":{"freeQty":50,"minTotal":0.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3303T5E":{"freeQty":50,"minTotal":0.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5600T5E":{"freeQty":50,"minTotal":0.47,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF100KT5E":{"freeQty":50,"minTotal":0.62,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F330JT5E":{"freeQty":50,"minTotal":0.64,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3002T5E":{"freeQty":50,"minTotal":0.66,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1503T5E":{"freeQty":50,"minTotal":0.67,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F5102T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F6801T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F470JT5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1500T5E":{"freeQty":50,"minTotal":0.75,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F510JT5E":{"freeQty":50,"minTotal":0.75,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3000T5E":{"freeQty":50,"minTotal":0.79,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F220KT5E":{"freeQty":50,"minTotal":1.1,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F200JT5E":{"freeQty":50,"minTotal":1.52,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF5101TCE":{"freeQty":50,"minTotal":0.24,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF6201T5E":{"freeQty":50,"minTotal":0.34,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2401T5E":{"freeQty":50,"minTotal":0.39,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1502T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF8202T5E":{"freeQty":50,"minTotal":0.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1302T5E":{"freeQty":50,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2701T5E":{"freeQty":50,"minTotal":0.64,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F8201T5E":{"freeQty":50,"minTotal":0.65,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1201T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F5601T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2203T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F4703T5E":{"freeQty":50,"minTotal":0.68,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3901T5E":{"freeQty":50,"minTotal":0.83,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F3000T5E":{"freeQty":50,"minTotal":1.42,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2200T5E":{"freeQty":50,"minTotal":0.39,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1001T5E":{"freeQty":0,"minTotal":0.88,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F6802T5E":{"freeQty":50,"minTotal":0.61,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F5600T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1501T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1202T5E":{"freeQty":50,"minTotal":0.79,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F6800T5E":{"freeQty":50,"minTotal":0.84,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2000TCE":{"freeQty":50,"minTotal":0.2,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1502TCE":{"freeQty":50,"minTotal":0.22,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2200TCE":{"freeQty":50,"minTotal":0.24,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF3300TCE":{"freeQty":50,"minTotal":0.26,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF5100TCE":{"freeQty":50,"minTotal":0.27,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF3302TCE":{"freeQty":50,"minTotal":0.27,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF470JT5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3302T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF499JT5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF750JT5E":{"freeQty":50,"minTotal":0.45,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF510JT5E":{"freeQty":50,"minTotal":0.47,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF200JT5E":{"freeQty":50,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2702T5E":{"freeQty":50,"minTotal":0.7,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1502T5E":{"freeQty":50,"minTotal":0.72,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F100LT5E":{"freeQty":50,"minTotal":0.0,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1200TCE":{"freeQty":50,"minTotal":0.2,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF499JTCE":{"freeQty":50,"minTotal":0.21,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF3301TCE":{"freeQty":50,"minTotal":0.23,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2202TCE":{"freeQty":50,"minTotal":0.31,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF7501T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF7502T5E":{"freeQty":50,"minTotal":0.35,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3902T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2701T5E":{"freeQty":50,"minTotal":0.37,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3003T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5103T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF6802T5E":{"freeQty":50,"minTotal":0.42,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF4703T5E":{"freeQty":50,"minTotal":0.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2004T5E":{"freeQty":50,"minTotal":0.51,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3302T5E":{"freeQty":50,"minTotal":0.74,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F220JT5E":{"freeQty":50,"minTotal":1.47,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1202TCE":{"freeQty":50,"minTotal":0.2,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF8200T5E":{"freeQty":50,"minTotal":0.42,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF9101T5E":{"freeQty":50,"minTotal":0.44,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3601T5E":{"freeQty":50,"minTotal":0.44,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2700T5E":{"freeQty":50,"minTotal":0.52,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F3900T5E":{"freeQty":50,"minTotal":0.69,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F1200T5E":{"freeQty":50,"minTotal":1.53,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F499JT5E":{"freeQty":50,"minTotal":0.64,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF5101T5E":{"freeQty":0,"minTotal":0.85,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F510KT5E":{"freeQty":50,"minTotal":1.39,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1002T5E":{"freeQty":0,"minTotal":0.79,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2003T5E":{"freeQty":50,"minTotal":0.79,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2402T5E":{"freeQty":50,"minTotal":0.82,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1200T5E":{"freeQty":0,"minTotal":1.29,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1002TCE":{"freeQty":0,"minTotal":0.5,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1003T5E":{"freeQty":0,"minTotal":0.83,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F1001T5E":{"freeQty":0,"minTotal":1.55,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF100JTCE":{"freeQty":0,"minTotal":0.41,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3900T5E":{"freeQty":50,"minTotal":0.36,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1000T5E":{"freeQty":0,"minTotal":0.82,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF100JT5E":{"freeQty":0,"minTotal":0.2,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF470KT5E":{"freeQty":50,"minTotal":0.63,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1001TCE":{"freeQty":0,"minTotal":0.39,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1500T5E":{"freeQty":50,"minTotal":0.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2001T5E":{"freeQty":0,"minTotal":0.85,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF4701TCE":{"freeQty":0,"minTotal":0.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF1000TCE":{"freeQty":0,"minTotal":0.45,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF0000TCE":{"freeQty":0,"minTotal":0.52,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF1004T5E":{"freeQty":0,"minTotal":0.82,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF220JTCE":{"freeQty":0,"minTotal":0.49,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2001TCE":{"freeQty":0,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF330JTCE":{"freeQty":0,"minTotal":0.58,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2002TCE":{"freeQty":0,"minTotal":0.58,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF3002T5E":{"freeQty":0,"minTotal":0.85,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2201TCE":{"freeQty":0,"minTotal":0.48,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0402WGF2003TCE":{"freeQty":0,"minTotal":0.55,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F220JT5E":{"freeQty":0,"minTotal":1.46,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"1206W4F100KT5E":{"freeQty":0,"minTotal":1.96,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF200KT5E":{"freeQty":0,"minTotal":1.24,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF220KT5E":{"freeQty":0,"minTotal":1.33,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF510KT5E":{"freeQty":0,"minTotal":1.38,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F470KT5E":{"freeQty":0,"minTotal":2.21,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F100KT5E":{"freeQty":0,"minTotal":2.4,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0603WAF2203T5E":{"freeQty":0,"minTotal":0.94,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"0805W8F2401T5E":{"freeQty":0,"minTotal":1.53,"category":"贴片电阻","brand":"UNI-ROYAL(厚声)"},"CL05B104KO5NNNC":{"freeQty":50,"minTotal":0.4,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CC0603KRX7R9BB104":{"freeQty":50,"minTotal":0.86,"category":"贴片电容(MLCC)","brand":"YAGEO(国巨)"},"CL10A106KP8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10A105KB8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10A106MA8NRNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21A106KAYNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21A226MAQNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05B104KB54PNC":{"freeQty":50,"minTotal":1.26,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05A105KA5NQNC":{"freeQty":50,"minTotal":1.26,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CC0805KRX7R9BB104":{"freeQty":50,"minTotal":1.59,"category":"贴片电容(MLCC)","brand":"YAGEO(国巨)"},"CL05A106MQ5NUNC":{"freeQty":50,"minTotal":1.88,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10A226MQ8NRNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10A475KO8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B105KBFNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31A226KAHNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"GRM21BR61H106KE43L":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"muRata(村田)"},"CL21A475KAQNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21A476MQYNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31A107MQHNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31A476MPHNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05A475MP5NRNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B102KB8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10A225KO8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B104KCFNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31B104KBCNNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31B105KBHNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C101JB8NNNC":{"freeQty":50,"minTotal":1.27,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"1206B102K202NT":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL21A225KBQNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"1206B475K500NT":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B103K500NT":{"freeQty":50,"minTotal":0.88,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL10C220JB8NNNC":{"freeQty":50,"minTotal":1.39,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C200JB8NNNC":{"freeQty":50,"minTotal":1.67,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B103KBANNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL31B225KBHNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05B103KB5NNNC":{"freeQty":50,"minTotal":0.44,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05A225MQ5NSNC":{"freeQty":50,"minTotal":0.8,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C120JB8NNNC":{"freeQty":50,"minTotal":1.53,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C100JB8NNNC":{"freeQty":50,"minTotal":1.53,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B474KA8NNNC":{"freeQty":50,"minTotal":2.39,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B102KBCNNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05B224KO5NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL05C100JB5NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C330JB8NNNC":{"freeQty":50,"minTotal":1.61,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B223KB8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B473KB8NNNC":{"freeQty":50,"minTotal":1.64,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B221KB8NNNC":{"freeQty":50,"minTotal":1.65,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C150JB8NNNC":{"freeQty":50,"minTotal":1.65,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B224KA8NNNC":{"freeQty":50,"minTotal":2.33,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21C101JBANNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21C220JBANNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B224KBFNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21C222JBFNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B333KB8NNNC":{"freeQty":50,"minTotal":1.27,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10C331JB8NNNC":{"freeQty":50,"minTotal":1.93,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL10B332KB8NNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B223KBANNNC":{"freeQty":50,"minTotal":2.43,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0402CG220J500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL21C470JBANNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0402CG330J500NT":{"freeQty":50,"minTotal":0.36,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402CG150J500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B222K500NT":{"freeQty":50,"minTotal":1.01,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL21B474KBFNNNE":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0402CG470J500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402B221K500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402B223K500NT":{"freeQty":50,"minTotal":0.61,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL10C470JB8NNNC":{"freeQty":50,"minTotal":0.99,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21C200JBANNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0402CG101J500NT":{"freeQty":50,"minTotal":0.34,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B151K500NT":{"freeQty":50,"minTotal":0.98,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL10C180JB8NNNC":{"freeQty":50,"minTotal":1.62,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"CL21B473KBCNNNC":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0402B102K500NT":{"freeQty":50,"minTotal":0.39,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B472K500NT":{"freeQty":50,"minTotal":0.94,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"1206B103K500NT":{"freeQty":50,"minTotal":0.0,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402CG120J500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B471K500NT":{"freeQty":50,"minTotal":0.92,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0805B472K500NT":{"freeQty":50,"minTotal":1.64,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CC0805KRX7R9BB221":{"freeQty":50,"minTotal":2.16,"category":"贴片电容(MLCC)","brand":"YAGEO(国巨)"},"0402CG200J500NT":{"freeQty":50,"minTotal":0.36,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402CG180J500NT":{"freeQty":50,"minTotal":0.37,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0402B472K500NT":{"freeQty":50,"minTotal":0.38,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603CG300J500NT":{"freeQty":50,"minTotal":1.04,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B682K500NT":{"freeQty":50,"minTotal":1.09,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0805B471K500NT":{"freeQty":50,"minTotal":1.54,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"0603B822K500NT":{"freeQty":50,"minTotal":1.04,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"CL31A106KBHNNNE":{"freeQty":0,"minTotal":7.76,"category":"贴片电容(MLCC)","brand":"SAMSUNG(三星)"},"0805B333K500NT":{"freeQty":50,"minTotal":2.59,"category":"贴片电容(MLCC)","brand":"FH(风华)"},"SS8050(RANGE:200-350)":{"freeQty":5,"minTotal":3.83,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"MMBT5551(RANGE:200-300)":{"freeQty":5,"minTotal":3.87,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"S8050 J3Y(RANGE:200-350)":{"freeQty":5,"minTotal":3.78,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"MMBT3904(RANGE:100-300)":{"freeQty":5,"minTotal":2.7,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"SS8550 Y2(RANGE:200-350)":{"freeQty":5,"minTotal":3.82,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"S9013 J3(RANGE:200-350)":{"freeQty":5,"minTotal":3.71,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"MMBT5401(RANGE:200-300)":{"freeQty":5,"minTotal":3.94,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"S8550(RANGE:120-200)":{"freeQty":5,"minTotal":3.9,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"MMBT2222A 1P":{"freeQty":5,"minTotal":4.1,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"D882(RANGE:160-320)":{"freeQty":5,"minTotal":1.61,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"S9012 2T1(RANGE:200-350)":{"freeQty":5,"minTotal":4.35,"category":"三极管(BJT)","brand":"CJ(江苏长电/长晶)"},"SS34":{"freeQty":5,"minTotal":2.78,"category":"肖特基二极管","brand":"MDD(辰达半导体)"},"1N5819WS":{"freeQty":5,"minTotal":2.9,"category":"肖特基二极管","brand":"Hottech(合科泰)"},"SS14":{"freeQty":5,"minTotal":4.69,"category":"肖特基二极管","brand":"MDD(辰达半导体)"},"SS54":{"freeQty":5,"minTotal":1.13,"category":"肖特基二极管","brand":"MDD(辰达半导体)"},"SS210":{"freeQty":5,"minTotal":8.05,"category":"肖特基二极管","brand":"MDD(辰达半导体)"},"B5819W SL":{"freeQty":5,"minTotal":2.31,"category":"肖特基二极管","brand":"CJ(江苏长电/长晶)"},"AMS1117-3.3":{"freeQty":2,"minTotal":4.23,"category":"线性稳压器(LDO)","brand":"AMS"},"L78M05ABDT-TR":{"freeQty":2,"minTotal":3.02,"category":"线性稳压器(LDO)","brand":"ST(意法半导体)"},"HT7533-1":{"freeQty":2,"minTotal":2.27,"category":"线性稳压器(LDO)","brand":"HOLTEK(合泰/盛群)"},"XC6206P332MR-G":{"freeQty":2,"minTotal":1.98,"category":"线性稳压器(LDO)","brand":"TOREX(特瑞仕)"},"AMS1117-5.0":{"freeQty":2,"minTotal":4.21,"category":"线性稳压器(LDO)","brand":"AMS"},"78L05G-AB3-R":{"freeQty":2,"minTotal":1.36,"category":"线性稳压器(LDO)","brand":"UTC(友顺)"},"NCD0805R1":{"freeQty":5,"minTotal":3.73,"category":"发光二极管_LED","brand":"国星光电"},"KT-0603R":{"freeQty":5,"minTotal":3.84,"category":"发光二极管_LED","brand":"KENTO"},"KT-0805G":{"freeQty":5,"minTotal":4.45,"category":"发光二极管_LED","brand":"KENTO"},"KT-0603W":{"freeQty":5,"minTotal":3.32,"category":"发光二极管_LED","brand":"KENTO"},"KT-0805Y":{"freeQty":5,"minTotal":4.19,"category":"发光二极管_LED","brand":"KENTO"},"KT-0805W":{"freeQty":5,"minTotal":5.54,"category":"发光二极管_LED","brand":"KENTO"},"X50328MSB2GI":{"freeQty":2,"minTotal":3.96,"category":"无源晶振","brand":"YXC(扬兴晶振)"},"X322525MOB4SI":{"freeQty":2,"minTotal":3.63,"category":"无源晶振","brand":"YXC(扬兴晶振)"},"X322512MSB4SI":{"freeQty":2,"minTotal":3.67,"category":"无源晶振","brand":"YXC(扬兴晶振)"},"X322516MLB4SI":{"freeQty":2,"minTotal":3.57,"category":"无源晶振","brand":"YXC(扬兴晶振)"},"X49SM8MSD2SC":{"freeQty":2,"minTotal":1.73,"category":"无源晶振","brand":"YXC(扬兴晶振)"},"Q13FC13500004":{"freeQty":2,"minTotal":3.33,"category":"无源晶振","brand":"EPSON(爱普生)"},"1N4148WS":{"freeQty":5,"minTotal":2.68,"category":"开关二极管","brand":"CJ(江苏长电/长晶)"},"BAV99,215":{"freeQty":5,"minTotal":4.73,"category":"开关二极管","brand":"Nexperia(安世)"},"1N4148W":{"freeQty":5,"minTotal":3.11,"category":"开关二极管","brand":"ST(先科)"},"BAV70":{"freeQty":5,"minTotal":4.14,"category":"开关二极管","brand":"CJ(江苏长电/长晶)"},"2N7002":{"freeQty":3,"minTotal":4.09,"category":"场效应管(MOSFET)","brand":"CJ(江苏长电/长晶)"},"AO3401A":{"freeQty":3,"minTotal":2.61,"category":"场效应管(MOSFET)","brand":"AOS"},"AO3400A":{"freeQty":3,"minTotal":1.0,"category":"场效应管(MOSFET)","brand":"AOS"},"SI2301CDS-T1-GE3":{"freeQty":3,"minTotal":2.84,"category":"场效应管(MOSFET)","brand":"VISHAY(威世)"},"4D03WGJ0103T5E":{"freeQty":5,"minTotal":4.66,"category":"排阻","brand":"UNI-ROYAL(厚声)"},"4D03WGJ0102T5E":{"freeQty":5,"minTotal":1.82,"category":"排阻","brand":"UNI-ROYAL(厚声)"},"4D03WGJ0472T5E":{"freeQty":5,"minTotal":6.01,"category":"排阻","brand":"UNI-ROYAL(厚声)"},"LM358DR2G":{"freeQty":2,"minTotal":2.93,"category":"运算放大器","brand":"onsemi(安森美)"},"NE5532DR":{"freeQty":2,"minTotal":3.04,"category":"运算放大器","brand":"TI(德州仪器)"},"LM324DT":{"freeQty":2,"minTotal":3.06,"category":"运算放大器","brand":"ST(意法半导体)"},"GZ1608D601TF":{"freeQty":5,"minTotal":1.39,"category":"磁珠","brand":"Sunlord(顺络)"},"GZ2012D601TF":{"freeQty":5,"minTotal":2.62,"category":"磁珠","brand":"Sunlord(顺络)"},"GZ2012D101TF":{"freeQty":5,"minTotal":1.31,"category":"磁珠","brand":"Sunlord(顺络)"},"TAJB107K006RNJ":{"freeQty":2,"minTotal":0.0,"category":"钽电容","brand":"Kyocera AVX"},"TAJA106K016RNJ":{"freeQty":2,"minTotal":0.0,"category":"钽电容","brand":"Kyocera AVX"},"SDFL2012S100KTF":{"freeQty":5,"minTotal":2.33,"category":"贴片电感","brand":"Sunlord(顺络)"},"SDFL1608S100KTF":{"freeQty":5,"minTotal":1.56,"category":"贴片电感","brand":"Sunlord(顺络)"},"M7":{"freeQty":10,"minTotal":4.92,"category":"通用二极管","brand":"MDD(辰达半导体)"},"SM4007PL":{"freeQty":10,"minTotal":4.06,"category":"通用二极管","brand":"MDD(辰达半导体)"},"TPS5430DDAR":{"freeQty":5,"minTotal":0.0,"category":"DC-DC电源芯片","brand":"TI(德州仪器)"},"XL1509-5.0E1":{"freeQty":5,"minTotal":0.0,"category":"DC-DC电源芯片","brand":"XLSEMI(芯龙)"},"PSM712-LF-T7":{"freeQty":5,"minTotal":0.0,"category":"静电和浪涌保护(TVS_ESD)","brand":"PROTEK"},"P6SMB6.8CA/TR13":{"freeQty":5,"minTotal":1.64,"category":"静电和浪涌保护(TVS_ESD)","brand":"Brightking(君耀电子)"},"SP3485EN-L/TR":{"freeQty":2,"minTotal":0.0,"category":"RS-485_RS-422芯片","brand":"MaxLinear(迈凌)"},"SP485EEN-L/TR":{"freeQty":2,"minTotal":4.33,"category":"RS-485_RS-422芯片","brand":"MaxLinear(迈凌)"},"74HC595D,118":{"freeQty":2,"minTotal":4.74,"category":"移位寄存器","brand":"Nexperia(安世)"},"ULN2003ADR":{"freeQty":5,"minTotal":0.0,"category":"达林顿晶体管阵列","brand":"TI(德州仪器)"},"74HC14D,653":{"freeQty":2,"minTotal":4.14,"category":"反相器","brand":"Nexperia(安世)"},"US1M":{"freeQty":2,"minTotal":3.6,"category":"快恢复_高效率二极管","brand":"MDD(辰达半导体)"},"MB10S-50MIL":{"freeQty":5,"minTotal":2.36,"category":"整流桥","brand":"MDD(辰达半导体)"},"TS-1187A-B-A-B":{"freeQty":2,"minTotal":2.14,"category":"轻触开关","brand":"XKB Connection(中国星坤)"},"CJ431":{"freeQty":1,"minTotal":4.27,"category":"电压基准芯片","brand":"CJ(江苏长电/长晶)"},"W25Q128JVSIQ":{"freeQty":2,"minTotal":266.4,"category":"NOR FLASH","brand":"Winbond(华邦)"},"LM393DR2G":{"freeQty":2,"minTotal":3.65,"category":"比较器","brand":"onsemi(安森美)"},"SP3232EEY-L/TR":{"freeQty":2,"minTotal":5.23,"category":"RS232芯片","brand":"MaxLinear(迈凌)"},"OP07CDR":{"freeQty":1,"minTotal":4.24,"category":"精密运放","brand":"TI(德州仪器)"},"TL072CDT":{"freeQty":5,"minTotal":0.0,"category":"FET输入运放","brand":"ST(意法半导体)"}
    };

    const SVG = `<svg t="1774202466413" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1796" width="256" height="256"><path d="M512 0a512 512 0 0 0 0 1024c122.148571 0 234.203429-42.934857 322.267429-114.322286l56.905142-54.491428A509.513143 509.513143 0 0 0 1024 512a512 512 0 0 0-512-512zM390.290286 173.494857s42.496-42.496 127.488-42.496c84.918857 0 127.414857 42.422857 127.414857 42.422857v127.488s-21.211429-10.605714-63.707429-16.822857v-58.88s0-31.817143-63.707428-31.817143c-63.780571 0-63.780571 31.817143-63.780572 31.817143v58.88c-42.422857 6.217143-63.634286 16.822857-63.634285 16.822857V173.494857zM305.371429 343.332571l212.406857-42.422857 212.333714 42.422857 21.211429 106.203429-233.545143-63.634286-233.618286 63.634286 21.211429-106.203429z m466.285714 148.699429V640.731429s-21.211429 42.422857-84.992 42.422857c-57.782857 0-80.603429-52.370286-147.675429-62.171429V433.956571l232.594286 58.148572z m-509.805714 0l234.642285-58.660571v187.392c-68.608 8.996571-91.355429 62.390857-149.650285 62.390857-63.707429 0-84.918857-42.422857-84.918858-42.422857V492.032z m553.252571 276.114286s-63.707429 42.422857-127.414857 42.422857-84.992-63.634286-169.910857-63.634286c-84.992 0-84.992 63.634286-169.910857 63.634286-84.992 0-127.488-42.422857-127.488-42.422857s-42.422857-21.211429-42.422858-63.707429c0-47.908571 63.634286-21.211429 63.634286-21.211428s21.284571 42.422857 106.276572 42.422857c84.918857 0 84.918857-63.707429 169.910857-63.707429 84.918857 0 84.918857 63.707429 169.910857 63.707429 84.918857 0 106.203429-42.422857 106.203428-42.422857s63.634286-26.331429 63.634286 21.211428c0 42.422857-42.422857 63.634286-42.422857 63.634286z" fill="#33A0FE" p-id="1797"></path></svg>`;

    function processItemPage() {
        if (!location.hostname.includes('item.szlcsc.com')) return;

        log('处理详情页');

        const tryProcess = () => {
            const h1 = document.querySelector('h1');
            if (!h1) {
                log('未找到 H1 标签');
                return false;
            }

            const rawText = h1.textContent || h1.innerText || '';
            const cleanText = rawText.trim().toUpperCase().replace(/\s+/g, '');

            log('H1 文本:', rawText, '清理后:', cleanText);

            if (COMPONENT_DATA[cleanText]) {
                log('匹配到大航海器件:', cleanText);

                if (h1.querySelector('.spprj-sailor-icon')) {
                    log('已存在标识，跳过');
                    return true;
                }

                const svgWrapper = document.createElement('span');
                svgWrapper.innerHTML = SVG;
                const svg = svgWrapper.querySelector('svg');

                svg.style.height = '27px';
                svg.style.width = 'auto';
                svg.style.verticalAlign = 'middle';
                svg.style.marginLeft = '8px';
                svg.style.display = 'inline-block';

                h1.after(svg);

                const data = COMPONENT_DATA[cleanText];
                svg.style.cursor = 'help';

                const svgTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                svgTitle.textContent = `大航海计划: 免费数量 ${data.freeQty} 个，起订需付 ¥${data.minTotal}`;
                svg.prepend(svgTitle);

                log('已添加大航海标识');
                return true;
            } else {
                log('未匹配:', cleanText);
            }
            return false;
        };

        if (tryProcess()) return;

        const observer = new MutationObserver((mutations, obs) => {
            if (tryProcess()) {
                obs.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => observer.disconnect(), 5000);
    }

    class TextExtractor {
        constructor(matcher) {
            if (!matcher) {
                throw new Error('TextExtractor requires a matcher instance');
            }
            this.matcher = matcher;
        }

        extractFromDD(dd) {
            if (!dd || dd._lcscChecked) return null;
            if (!this.matcher) {
                console.error('[SPPrj] Matcher not initialized in TextExtractor');
                return null;
            }

            const ddText = this._normalize(dd.textContent);
            if (this.matcher.hasExact(ddText)) {
                return ddText;
            }

            const highlightSpan = dd.querySelector('.LUCENE_HIGHLIGHT_CLASS');
            if (highlightSpan) {
                const parentText = this._getParentText(highlightSpan);
                if (parentText && this.matcher.hasExact(parentText)) {
                    log('父级文本匹配:', parentText);
                    return parentText;
                }

                const extracted = this._extractByPosition(highlightSpan);
                if (extracted) {
                    log('位置截取匹配:', extracted);
                    return extracted;
                }

                const highlightOnly = this._normalize(highlightSpan.textContent);
                if (this.matcher.hasExact(highlightOnly)) {
                    return highlightOnly;
                }
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
                if (this.matcher.hasExact(text)) {
                    return text;
                }
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
                if (this.matcher.hasExact(candidate)) {
                    return candidate;
                }
            }

            for (let len = highlightText.length; len <= Math.min(highlightText.length + 5, containerText.length); len++) {
                const candidate = containerText.substring(0, len);
                if (this.matcher.hasExact(candidate)) {
                    return candidate;
                }
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
            Object.entries(data).forEach(([k, v]) => {
                const normalized = k.toUpperCase().replace(/\s+/g, '');
                this.map.set(normalized, { key: k, data: v });
            });
            log('构建索引:', this.map.size, '条');
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
            this.matcher = new ComponentMatcher(COMPONENT_DATA);
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
                        if (m.type === 'childList' && m.addedNodes.length > 0) {
                            shouldScan = true;
                        }
                        if (m.type === 'attributes' && m.attributeName === 'class') {
                            if (m.target.matches?.(TARGET_SELECTOR) && m.target._lcscMatched) {
                                this.enforceStyle(m.target);
                            }
                        }
                    });
                    if (shouldScan) setTimeout(() => this.scan(), 300);
                }).observe(c, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
            });

            setTimeout(() => this.scan(), 500);
            log('初始化完成');
        }

        enforceStyle(dd) {
            if (!dd._lcscMatched && !dd.hasAttribute('data-spprj-marked')) return;
            if (!dd.classList.contains('spprj-matched')) {
                dd.classList.add('spprj-matched');
                dd.setAttribute('data-spprj-marked', 'true');
            }
            if (!dd.hasAttribute('data-spprj-marked')) {
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

            // 定位
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

        /* 问号标记 */
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

        /* Tooltip */
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

        .spprj-tip-title {
            color: #ff6b6b;
            font-weight: bold;
            margin-bottom: 8px;
            border-bottom: 1px solid #555;
            padding-bottom: 4px;
            font-size: 14px;
        }

        .spprj-tip-row {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
            color: #ccc;
            font-size: 12px;
        }

        .spprj-tip-val {
            color: #4ade80;
            font-weight: 600;
            margin-left: 10px;
        }
    `);

    if (location.hostname.includes('item.szlcsc.com')) {
        // 详情页
        processItemPage();
    } else {
        // 搜索/列表页
        const hl = new Highlighter();
    }

})();
