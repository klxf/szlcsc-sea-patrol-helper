(function () {
  "use strict";

  const DEFAULT_DATA_URL = "https://raw.githubusercontent.com/klxf/szlcsc-sea-patrol-helper/refs/heads/master/sea_patrol_project.json";
  const STORAGE_KEY_URL = "szlcsc_sea_patrol_data_url";
  const STORAGE_KEY_TOUR = "szlcsc_sea_patrol_tour_seen";

  const elements = {
    layout: document.getElementById("app-layout"),
    categoryTotal: document.getElementById("category-total"),
    categorySearch: document.getElementById("category-search"),
    categoryList: document.getElementById("category-list"),
    welcomeView: document.getElementById("welcome-view"),
    categoryView: document.getElementById("category-view"),
    backButton: document.getElementById("back-button"),
    selectedCategory: document.getElementById("selected-category"),
    materialCount: document.getElementById("material-count"),
    materialSearch: document.getElementById("material-search"),
    zeroFilter: document.getElementById("zero-filter"),
    availableFilter: document.getElementById("available-filter"),
    sortMode: document.getElementById("sort-mode"),
    materialList: document.getElementById("material-list"),
    settingsButton: document.getElementById("settings-button"),
    settingsDialog: document.getElementById("settings-dialog"),
    sourceUrl: document.getElementById("data-source-url"),
    sourceStatus: document.getElementById("source-status"),
    resetSource: document.getElementById("reset-source"),
    saveSource: document.getElementById("save-source"),
    tourButton: document.getElementById("tour-button"),
    tourOverlay: document.getElementById("tour-overlay"),
    tourSpotlight: document.getElementById("tour-spotlight"),
    tourPopover: document.getElementById("tour-popover"),
    tourStep: document.getElementById("tour-step"),
    tourTitle: document.getElementById("tour-title"),
    tourDescription: document.getElementById("tour-description"),
    tourBack: document.getElementById("tour-back"),
    tourNext: document.getElementById("tour-next"),
    tourSkip: document.getElementById("tour-skip")
  };

  const state = {
    sourceUrl: "",
    categories: [],
    materialMap: new Map(),
    activeCategory: "",
    categoryKeyword: "",
    materialKeyword: "",
    zeroOnly: false,
    availableOnly: false,
    sortMode: "price-asc"
  };
  const tour = {
    active: false,
    index: 0,
    steps: []
  };

  function getStoredSourceUrl() {
    try {
      return window.localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_DATA_URL;
    } catch (_) {
      return DEFAULT_DATA_URL;
    }
  }

  function storeSourceUrl(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY_URL, value);
    } catch (_) {
      // Privacy mode may block storage; the source remains usable in this session.
    }
  }

  function normalizeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeMaterials(rawData) {
    if (!rawData || typeof rawData !== "object") {
      throw new Error("数据源不是有效的 JSON 对象");
    }

    const entries = Array.isArray(rawData)
      ? rawData.map((item, index) => [String(item.productModel || item.model || item.cid || index), item])
      : Object.entries(rawData);
    const materialMap = new Map();

    entries.forEach(([model, raw], index) => {
      if (!raw || typeof raw !== "object") return;
      const normalizedModel = String(raw.productModel || raw.model || model || `物料 ${index + 1}`).trim();
      const material = {
        model: normalizedModel,
        category: String(raw.category || "未分类").trim() || "未分类",
        brand: String(raw.brand || "未知品牌").trim() || "未知品牌",
        encapsulation: String(raw.encapsulation || raw.package || "未知封装").trim() || "未知封装",
        productCode: String(raw.productCode || raw.cid || "").trim(),
        freeQty: normalizeNumber(raw.freeQty),
        minTotal: normalizeNumber(raw.minTotal),
        productPrice: normalizeNumber(raw.productPrice),
        needNumber: normalizeNumber(raw.needNumber),
        split: normalizeNumber(raw.split)
      };
      const key = normalizedModel.toLowerCase();
      materialMap.set(`${key}:${material.productCode.toLowerCase()}:${index}`, material);
    });

    if (materialMap.size === 0) {
      throw new Error("数据源中没有可用物料");
    }
    return materialMap;
  }

  function buildCategories() {
    const categoryMap = new Map();
    state.materialMap.forEach((material) => {
      if (!categoryMap.has(material.category)) {
        categoryMap.set(material.category, []);
      }
      categoryMap.get(material.category).push(material);
    });
    state.categories = Array.from(categoryMap.entries())
      .map(([name, materials]) => ({
        name,
        materials,
        count: materials.length
      }))
      .sort((left, right) => left.name.localeCompare(right.name, "zh-Hans-CN"));
  }

  function formatNumber(value, maximumFractionDigits = 4) {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits
    }).format(value);
  }

  function formatMoney(value) {
    return `¥${formatNumber(value)}`;
  }

  function lcscSearchUrl(productCode) {
    return `https://so.szlcsc.com/global.html?k=${encodeURIComponent(productCode)}`;
  }

  function createBadge(text, className) {
    const badge = document.createElement("span");
    badge.className = `badge${className ? ` ${className}` : ""}`;
    badge.textContent = text;
    return badge;
  }

  function createStat(label, value) {
    const stat = document.createElement("div");
    stat.className = "stat";
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    stat.append(labelNode, valueNode);
    return stat;
  }

  function createMaterialCard(material) {
    const card = document.createElement("article");
    card.className = "material-card";

    const top = document.createElement("div");
    top.className = "material-top";
    const model = document.createElement("h3");
    model.className = "material-model";
    model.textContent = material.model;
    top.appendChild(model);

    if (material.productCode) {
      const code = document.createElement("a");
      code.className = "material-code";
      code.href = lcscSearchUrl(material.productCode);
      code.target = "_blank";
      code.rel = "noopener noreferrer";
      code.textContent = material.productCode;
      top.appendChild(code);
    }

    const meta = document.createElement("div");
    meta.className = "material-meta";
    meta.appendChild(createBadge(material.brand));
    meta.appendChild(createBadge(material.encapsulation));
    if (material.freeQty > 0) {
      meta.appendChild(createBadge(`免费 ${material.freeQty}`, "free"));
    }
    if (material.minTotal === 0) {
      meta.appendChild(createBadge("零元起订", "zero"));
    } else {
      meta.appendChild(createBadge("付费起订", "warn"));
    }

    const stats = document.createElement("div");
    stats.className = "material-stats";
    stats.appendChild(createStat("最小总额", formatMoney(material.minTotal)));
    stats.appendChild(createStat("产品单价", formatMoney(material.productPrice)));
    stats.appendChild(createStat("需求数量", formatNumber(material.needNumber)));

    card.append(top, meta, stats);
    return card;
  }

  function setStatus(message, isError = false) {
    elements.sourceStatus.textContent = message;
    elements.sourceStatus.classList.toggle("error-state", isError);
  }

  function showState(kind) {
    elements.materialList.replaceChildren();
    const node = document.createElement("div");
    node.className = kind;
    if (kind === "loading-state") {
      node.textContent = "正在加载物料数据...";
    } else if (kind === "empty-state") {
      node.textContent = "没有符合当前条件的物料";
    } else {
      node.textContent = "暂无分类数据";
    }
    elements.materialList.appendChild(node);
  }

  function matchesMaterial(material, keyword) {
    return [
      material.model,
      material.brand,
      material.encapsulation,
      material.productCode,
      material.category
    ].some((value) => value.toLowerCase().includes(keyword));
  }

  function getVisibleCategories() {
    const keyword = state.categoryKeyword.trim().toLowerCase();
    if (!keyword) return state.categories;
    return state.categories.filter((category) =>
      category.name.toLowerCase().includes(keyword) ||
      category.materials.some((material) => matchesMaterial(material, keyword))
    );
  }

  function renderCategories() {
    const categories = getVisibleCategories();
    elements.categoryList.replaceChildren();
    elements.categoryTotal.textContent = `${categories.length} 个分类`;

    if (categories.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "没有匹配的分类";
      elements.categoryList.appendChild(empty);
      return;
    }

    categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "listitem");
      button.className = "category-button";
      if (category.name === state.activeCategory) {
        button.classList.add("active");
      }

      const name = document.createElement("span");
      name.className = "category-name";
      name.textContent = category.name;
      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = String(category.count);
      button.append(name, count);
      button.addEventListener("click", () => selectCategory(category.name));
      elements.categoryList.appendChild(button);
    });
  }

  function sortMaterials(materials) {
    const copied = [...materials];
    copied.sort((left, right) => {
      switch (state.sortMode) {
        case "min-total-asc":
          return left.minTotal - right.minTotal;
        case "free-desc":
          return right.freeQty - left.freeQty;
        case "model-asc":
          return left.model.localeCompare(right.model, "zh-Hans-CN");
        case "price-asc":
        default:
          return left.productPrice - right.productPrice;
      }
    });
    return copied;
  }

  function renderMaterials() {
    const category = state.categories.find((item) => item.name === state.activeCategory);
    if (!category) return;

    const keyword = state.materialKeyword.trim().toLowerCase();
    let materials = category.materials.filter((material) => {
      if (state.zeroOnly && material.minTotal !== 0) return false;
      if (state.availableOnly && material.freeQty <= 0) return false;
      if (keyword && !matchesMaterial(material, keyword)) return false;
      return true;
    });

    materials = sortMaterials(materials);
    elements.materialList.replaceChildren();
    elements.materialCount.textContent = `${materials.length} 条物料`;

    if (materials.length === 0) {
      showState("empty-state");
      return;
    }
    const fragment = document.createDocumentFragment();
    materials.forEach((material) => fragment.appendChild(createMaterialCard(material)));
    elements.materialList.appendChild(fragment);
  }

  function selectCategory(categoryName) {
    state.activeCategory = categoryName;
    elements.selectedCategory.textContent = categoryName;
    elements.materialSearch.value = "";
    state.materialKeyword = "";
    elements.welcomeView.hidden = true;
    elements.categoryView.hidden = false;
    elements.layout.classList.add("category-selected");
    renderCategories();
    renderMaterials();
    if (window.matchMedia("(max-width: 880px)").matches) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goBackToCategories() {
    state.activeCategory = "";
    elements.categoryView.hidden = true;
    elements.welcomeView.hidden = false;
    elements.layout.classList.remove("category-selected");
    renderCategories();
  }

  function isElementVisible(element) {
    if (!element) return false;
    return Boolean(element.getClientRects().length) && getComputedStyle(element).visibility !== "hidden";
  }

  function getTourSeen() {
    try {
      return window.localStorage.getItem(STORAGE_KEY_TOUR) === "1";
    } catch (_) {
      return true;
    }
  }

  function setTourSeen() {
    try {
      window.localStorage.setItem(STORAGE_KEY_TOUR, "1");
    } catch (_) {
      // Guided tour can still run for the current page view.
    }
  }

  function buildTourSteps() {
    const firstCategory = state.categories[0] ? state.categories[0].name : "";
    return [
      {
        target: ".brand h1",
        title: "欢迎来到大航海计划物料列表",
        description: "这里集中展示当前数据源中的全部物料，先花一分钟了解主要操作。"
      },
      {
        target: ".sidebar",
        prepare: () => {
          if (state.activeCategory) goBackToCategories();
        },
        title: "从分类开始",
        description: "物料已按分类分组，每个分类右侧显示它的物料数量。"
      },
      {
        target: "#category-search",
        title: "快速定位分类",
        description: "输入分类名称、型号、品牌、封装或 CID，可以快速缩小分类范围。"
      },
      {
        target: "#welcome-view",
        title: "推荐链接",
        description: "默认视图提供常用入口，包括活动页、脚本安装和项目仓库。"
      },
      {
        target: ".filter-bar",
        prepare: () => {
          if (!state.activeCategory && firstCategory) selectCategory(firstCategory);
        },
        title: "筛选和排序物料",
        description: "进入分类后，可以只看零元起订、有免费数量的物料，也可以按价格或数量排序。"
      },
      {
        target: ".material-list",
        title: "查看物料详情",
        description: "卡片展示品牌、封装、最小总额、单价和需求数量；点击 CID 可以打开立创搜索。"
      },
      {
        target: "#back-button",
        title: "返回分类列表",
        description: "在手机上选择分类后会进入内容区，点这里可以返回继续换分类。"
      },
      {
        target: "#settings-button",
        title: "自定义数据源",
        description: "设置里可以替换 JSON 数据源，保存后会加载新数据并记住你的选择。"
      },
      {
        target: "#tour-button",
        title: "随时重新开始",
        description: "以后需要回顾时，点击右下角的引导按钮即可重新打开这段漫游。"
      }
    ];
  }

  function positionTour() {
    if (!tour.active || !tour.steps[tour.index]) return;
    const target = document.querySelector(tour.steps[tour.index].target);
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const popoverRect = elements.tourPopover.getBoundingClientRect();
    const spacing = 14;
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    let top;

    if (spaceBelow >= popoverRect.height + spacing * 2) {
      top = targetRect.bottom + spacing;
    } else if (spaceAbove >= popoverRect.height + spacing * 2) {
      top = targetRect.top - popoverRect.height - spacing;
    } else {
      top = Math.max(12, Math.min(
        targetRect.top + targetRect.height / 2 - popoverRect.height / 2,
        window.innerHeight - popoverRect.height - 12
      ));
    }

    let left = targetRect.left + targetRect.width / 2 - popoverRect.width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - popoverRect.width - 12));

    elements.tourPopover.style.top = `${top}px`;
    elements.tourPopover.style.left = `${left}px`;
    elements.tourSpotlight.style.top = `${targetRect.top - 8}px`;
    elements.tourSpotlight.style.left = `${targetRect.left - 8}px`;
    elements.tourSpotlight.style.width = `${targetRect.width + 16}px`;
    elements.tourSpotlight.style.height = `${targetRect.height + 16}px`;
  }

  function renderTourStep() {
    const step = tour.steps[tour.index];
    if (!step) {
      endTour();
      return;
    }

    if (typeof step.prepare === "function") {
      step.prepare();
    }

    requestAnimationFrame(() => {
      const target = document.querySelector(step.target);
      if (!target || !isElementVisible(target)) {
        if (tour.index < tour.steps.length - 1) {
          tour.index += 1;
          renderTourStep();
          return;
        }
        if (tour.index > 0) {
          tour.index -= 1;
          renderTourStep();
          return;
        }
      }

      target.scrollIntoView({ block: "center", behavior: "smooth" });
      elements.tourStep.textContent = `${tour.index + 1} / ${tour.steps.length}`;
      elements.tourTitle.textContent = step.title;
      elements.tourDescription.textContent = step.description;
      elements.tourBack.disabled = tour.index === 0;
      elements.tourNext.textContent = tour.index === tour.steps.length - 1 ? "完成" : "下一步";
      positionTour();
      window.setTimeout(positionTour, 240);
    });
  }

  function startTour() {
    if (elements.settingsDialog.open) {
      elements.settingsDialog.close();
    }
    tour.steps = buildTourSteps();
    tour.index = 0;
    tour.active = true;
    elements.tourOverlay.hidden = false;
    elements.tourOverlay.classList.add("active");
    renderTourStep();
    elements.tourNext.focus();
  }

  function endTour() {
    tour.active = false;
    elements.tourOverlay.hidden = true;
    elements.tourOverlay.classList.remove("active");
    setTourSeen();
    elements.tourButton.focus();
  }

  async function loadData(sourceUrl, isInitial = false) {
    showState("loading-state");
    if (!isInitial) setStatus("正在加载数据...");
    state.sourceUrl = sourceUrl;
    elements.sourceUrl.value = sourceUrl;

    try {
      const response = await fetch(sourceUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      state.materialMap = normalizeMaterials(await response.json());
      buildCategories();
      renderCategories();
      goBackToCategories();
      const message = `已加载 ${state.materialMap.size} 条物料，${state.categories.length} 个分类`;
      if (!isInitial) setStatus(message);
      if (isInitial && !getTourSeen()) {
        window.setTimeout(startTour, 400);
      }
    } catch (error) {
      state.materialMap = new Map();
      state.categories = [];
      renderCategories();
      showState("loading-state");
      elements.materialList.replaceChildren();
      const errorNode = document.createElement("div");
      errorNode.className = "error-state";
      errorNode.textContent = `数据加载失败：${error.message}`;
      elements.materialList.appendChild(errorNode);
      if (!isInitial) setStatus(`数据加载失败：${error.message}`, true);
      if (isInitial && !getTourSeen()) {
        window.setTimeout(startTour, 400);
      }
    }
  }

  function openSettings() {
    elements.sourceUrl.value = state.sourceUrl;
    elements.sourceStatus.textContent = "";
    elements.settingsDialog.showModal();
  }

  function saveSettings() {
    const value = elements.sourceUrl.value.trim();
    if (!value) {
      setStatus("请输入数据源 URL", true);
      return;
    }
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("URL 协议必须是 http 或 https");
      }
      storeSourceUrl(url.href);
      elements.settingsDialog.close();
      loadData(url.href);
    } catch (error) {
      setStatus(`URL 无效：${error.message}`, true);
    }
  }

  function registerEvents() {
    let categorySearchTimer = 0;
    elements.categorySearch.addEventListener("input", () => {
      window.clearTimeout(categorySearchTimer);
      categorySearchTimer = window.setTimeout(() => {
        state.categoryKeyword = elements.categorySearch.value;
        renderCategories();
      }, 120);
    });

    let materialSearchTimer = 0;
    elements.materialSearch.addEventListener("input", () => {
      window.clearTimeout(materialSearchTimer);
      materialSearchTimer = window.setTimeout(() => {
        state.materialKeyword = elements.materialSearch.value;
        renderMaterials();
      }, 120);
    });

    elements.zeroFilter.addEventListener("change", () => {
      state.zeroOnly = elements.zeroFilter.checked;
      renderMaterials();
    });

    elements.availableFilter.addEventListener("change", () => {
      state.availableOnly = elements.availableFilter.checked;
      renderMaterials();
    });

    elements.sortMode.addEventListener("change", () => {
      state.sortMode = elements.sortMode.value;
      renderMaterials();
    });

    elements.backButton.addEventListener("click", goBackToCategories);
    elements.settingsButton.addEventListener("click", openSettings);
    elements.saveSource.addEventListener("click", saveSettings);
    elements.resetSource.addEventListener("click", () => {
      elements.sourceUrl.value = DEFAULT_DATA_URL;
      setStatus("已填入默认数据源，点击保存并加载生效");
    });

    elements.settingsDialog.addEventListener("cancel", () => {
      elements.sourceStatus.textContent = "";
    });

    elements.tourButton.addEventListener("click", startTour);
    elements.tourNext.addEventListener("click", () => {
      if (tour.index === tour.steps.length - 1) {
        endTour();
        return;
      }
      tour.index += 1;
      renderTourStep();
    });

    elements.tourBack.addEventListener("click", () => {
      if (tour.index === 0) return;
      tour.index -= 1;
      renderTourStep();
    });

    elements.tourSkip.addEventListener("click", endTour);

    document.addEventListener("keydown", (event) => {
      if (!tour.active) return;
      if (event.key === "Escape") {
        endTour();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        elements.tourNext.click();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        elements.tourBack.click();
      }
    });

    window.addEventListener("resize", positionTour, { passive: true });
    window.addEventListener("scroll", positionTour, { passive: true });
  }

  function init() {
    registerEvents();
    state.sourceUrl = getStoredSourceUrl();
    elements.sourceUrl.value = state.sourceUrl;
    loadData(state.sourceUrl, true);
  }

  init();
})();
