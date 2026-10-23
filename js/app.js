// Calcspace — formula editor and toolkit interactions.
document.addEventListener("DOMContentLoaded", () => {
  // Mode state: 'calc', 'ip', 'conv', 'history'
  let currentTab = "calc";
  const escapeHTML = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const preferences = {
    get(key, fallback) {
      try {
        return localStorage.getItem(key) || fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch {}
    },
  };
  let toastTimer;
  function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("visible"), 2200);
  }
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext)
      return navigator.clipboard.writeText(text);
    const field = document.createElement("textarea");
    field.value = text;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    if (!ok) throw new Error("Copy failed");
  }

  // DOM Elements - Navigation
  const tabButtons = document.querySelectorAll(".tab-btn");
  const viewSections = {
    calc: document.getElementById("view-calc"),
    ip: document.getElementById("view-ip"),
    conv: document.getElementById("view-conv"),
    history: document.getElementById("view-history"),
  };

  // Sound & Theme
  const soundBtn = document.getElementById("btn-sound-toggle");
  const themeBtn = document.getElementById("btn-theme-toggle");

  const formulaInput = document.getElementById("formula-input");
  const formulaResult = document.getElementById("formula-result");
  const formulaStatus = document.getElementById("formula-status");
  const fractionButton = document.getElementById("fraction-toggle");
  const copyResultButton = document.getElementById("copy-result");
  let resultValue = null;
  let displayFraction = false;
  let historyCursor = -1;
  let draftExpression = "";

  // ----------------------------------------------------
  // Tab Switching
  // ----------------------------------------------------
  function switchTab(tabName) {
    currentTab = tabName;
    tabButtons.forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-selected", "false");
      }
    });

    Object.keys(viewSections).forEach((key) => {
      if (viewSections[key]) {
        if (key === tabName) {
          viewSections[key].classList.remove("hidden");
        } else {
          viewSections[key].classList.add("hidden");
        }
      }
    });

    if (tabName === "history") {
      renderHistory();
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.soundEngine.playClick();
      switchTab(btn.dataset.tab);
    });
  });

  document
    .querySelectorAll("[data-open-tab]")
    .forEach((button) =>
      button.addEventListener("click", () => switchTab(button.dataset.openTab)),
    );
  document
    .getElementById("show-all-history")
    .addEventListener("click", () => switchTab("history"));
  document.querySelectorAll("[data-example]").forEach((button) =>
    button.addEventListener("click", () => {
      loadFormula(button.dataset.example);
    }),
  );

  // Sound Toggle
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const enabled = window.soundEngine.toggle();
      soundBtn.setAttribute("aria-pressed", String(enabled));
      soundBtn.innerHTML = enabled
        ? `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg><span class="hidden sm:inline">Âm thanh</span>`
        : `<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path></svg><span class="hidden sm:inline">Tắt tiếng</span>`;
    });
  }

  // Dark/Light Theme Toggle
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      window.soundEngine.playClick();
      const isDark = document.documentElement.classList.toggle("dark");
      document.documentElement.classList.toggle("light", !isDark);
      preferences.set("fx570_theme", isDark ? "dark" : "light");
      themeBtn.innerHTML = isDark
        ? `<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span class="hidden sm:inline">Sáng</span>`
        : `<svg class="w-4 h-4 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg><span class="hidden sm:inline">Tối</span>`;
    });
  }

  // Restore saved theme
  const savedTheme = preferences.get("fx570_theme", "dark");
  document.documentElement.classList.toggle("light", savedTheme === "light");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
    const label = themeBtn.querySelector("span");
    if (label) label.textContent = "Tối";
  }

  // Formula editor: the native textarea owns selection, undo, paste and IME.
  function renderResult() {
    document.getElementById("formula-result-area").hidden =
      resultValue === null;
    const fraction =
      displayFraction && resultValue !== null
        ? window.casioCalc.toFraction(resultValue)
        : null;
    formulaResult.textContent =
      resultValue === null
        ? ""
        : fraction
          ? `${fraction.num}/${fraction.den}`
          : window.casioCalc.formatNumber(resultValue);
    fractionButton.disabled = resultValue === null;
    fractionButton.setAttribute("aria-pressed", String(displayFraction));
    copyResultButton.disabled = resultValue === null;
  }

  function updateScreen() {
    const calc = window.casioCalc;
    if (formulaInput.value !== calc.expression)
      formulaInput.value = calc.expression;
    formulaInput.style.height = "auto";
    formulaInput.style.height =
      Math.min(220, Math.max(80, formulaInput.scrollHeight)) + "px";
    document
      .querySelectorAll("[data-angle]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.angle === calc.angleMode),
        ),
      );
    renderResult();
    renderRecentHistory();
  }

  function resetResult() {
    resultValue = null;
    displayFraction = false;
    formulaStatus.hidden = true;
    formulaStatus.textContent = "";
    formulaInput.setAttribute("aria-invalid", "false");
    document.getElementById("formula-form").classList.remove("has-error");
  }

  function changed() {
    window.casioCalc.expression = formulaInput.value;
    window.casioCalc.isResultDisplayed = false;
    resetResult();
    historyCursor = -1;
    updateScreen();
  }

  function loadFormula(expression, context = {}) {
    if (context.angleMode === "DEG" || context.angleMode === "RAD")
      window.casioCalc.angleMode = context.angleMode;
    if (/\bans\b/i.test(expression) && Number.isFinite(context.ans))
      window.casioCalc.ans = context.ans;
    formulaInput.value = expression;
    changed();
    formulaInput.focus({ preventScroll: true });
    formulaInput.setSelectionRange(expression.length, expression.length);
  }

  function insertMath(button) {
    const start = formulaInput.selectionStart;
    const end = formulaInput.selectionEnd;
    const selected = formulaInput.value.slice(start, end);
    let insertion = button.dataset.insert;
    let caret;
    if (button.dataset.template) {
      const template =
        selected || !button.dataset.empty
          ? button.dataset.template
          : button.dataset.empty;
      const slot = template.indexOf("{}");
      insertion = template.replace("{}", selected);
      caret = start + (slot >= 0 ? slot + selected.length : insertion.length);
      // With a selection, leave a complete function ready for the next operator.
      if (selected) caret = start + insertion.length;
      if (button.hasAttribute("data-fraction"))
        caret = selected ? start + insertion.length - 1 : start + 1;
    } else caret = start + insertion.length;
    if (
      formulaInput.value.length - (end - start) + insertion.length >
      formulaInput.maxLength
    ) {
      toast("Công thức tối đa 1.000 ký tự.");
      return;
    }
    formulaInput.focus({ preventScroll: true });
    formulaInput.setSelectionRange(start, end);
    // insertText preserves the browser's native undo stack; fall back when unavailable.
    if (!document.execCommand("insertText", false, insertion)) {
      formulaInput.setRangeText(insertion, start, end, "end");
      changed();
    }
    formulaInput.setSelectionRange(caret, caret);
    window.soundEngine.playClick();
  }

  document
    .querySelectorAll("[data-insert], [data-template]")
    .forEach((button) => {
      button.type = "button";
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => insertMath(button));
    });
  formulaInput.addEventListener("input", (event) => {
    if (!event.isComposing) changed();
  });
  formulaInput.addEventListener("compositionend", changed);
  formulaInput.addEventListener("keydown", (event) => {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      document.getElementById("formula-form").requestSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      loadFormula("");
    } else if (
      (event.altKey && event.key === "ArrowUp") ||
      (event.altKey && event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const history = window.casioCalc.history;
      if (!history.length) return;
      if (historyCursor === -1) draftExpression = formulaInput.value;
      const next = Math.max(
        -1,
        Math.min(
          history.length - 1,
          historyCursor + (event.key === "ArrowUp" ? 1 : -1),
        ),
      );
      loadFormula(next === -1 ? draftExpression : history[next].expr);
      historyCursor = next;
    }
  });
  document
    .getElementById("formula-clear")
    .addEventListener("click", () => loadFormula(""));
  document
    .getElementById("formula-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      if (!formulaInput.value.trim()) {
        formulaInput.focus();
        return;
      }
      // Editing and choosing tools never evaluates a formula. Only submit does.
      if (resultValue !== null) return;
      const calc = window.casioCalc;
      let value;
      let error = "";
      try {
        value = calc.evaluateValue(calc.expression);
        if (!Number.isFinite(value))
          error =
            "Phép tính không có kết quả thực hữu hạn. Kiểm tra miền xác định hoặc phép chia cho 0.";
      } catch {
        error =
          "Công thức chưa hợp lệ. Kiểm tra dấu ngoặc, tên hàm và các phép toán.";
      }
      if (error) {
        formulaStatus.textContent = error;
        formulaStatus.hidden = false;
        formulaInput.setAttribute("aria-invalid", "true");
        document.getElementById("formula-form").classList.add("has-error");
        formulaInput.focus();
        return;
      }
      resetResult();
      resultValue = value;
      calc.rawResult = value;
      calc.result = calc.formatNumber(value);
      calc.addHistory(calc.expression, calc.result, { ans: calc.ans });
      calc.ans = value;
      updateScreen();
      window.soundEngine.playBeep();
    });
  document.querySelectorAll("[data-angle]").forEach((button) =>
    button.addEventListener("click", () => {
      if (window.casioCalc.angleMode === button.dataset.angle) return;
      window.casioCalc.angleMode = button.dataset.angle;
      resetResult();
      updateScreen();
    }),
  );
  fractionButton.addEventListener("click", () => {
    if (resultValue === null) return;
    displayFraction = !displayFraction;
    renderResult();
  });
  copyResultButton.addEventListener("click", async () => {
    try {
      await copyText(formulaResult.textContent);
      toast("Đã sao chép kết quả");
    } catch {
      toast("Không thể sao chép. Hãy chọn kết quả để chép thủ công.");
    }
  });

  // ----------------------------------------------------
  // IP / CIDR Calculator Subnet Module
  // ----------------------------------------------------
  const ipInput = document.getElementById("ip-input");
  const prefixSelect = document.getElementById("ip-prefix-select");
  const ipCalcBtn = document.getElementById("ip-calc-btn");
  const ipResultContainer = document.getElementById("ip-results");
  const ipPresets = document.querySelectorAll(".ip-preset-btn");

  // Populate CIDR dropdown /0 to /32
  if (prefixSelect) {
    prefixSelect.innerHTML = "";
    for (let p = 32; p >= 0; p--) {
      const opt = document.createElement("option");
      opt.value = p;
      const maskStr = window.ipCalc.intToIp(window.ipCalc.prefixToMask(p));
      const hosts =
        p >= 32 ? 1 : p === 31 ? 2 : Math.max(0, Math.pow(2, 32 - p) - 2);
      opt.textContent = `/${p} — Mask: ${maskStr} (${hosts.toLocaleString()} hosts)`;
      if (p === 24) opt.selected = true;
      prefixSelect.appendChild(opt);
    }
  }

  function runIpCalculation() {
    const rawIp = ipInput.value.trim();
    if (!rawIp) {
      ipResultContainer.textContent = "Vui lòng nhập địa chỉ IPv4.";
      return;
    }

    let prefix = parseInt(prefixSelect.value, 10);
    // If input contains slash, parse prefix from it
    if (rawIp.includes("/")) {
      const slashPart = rawIp.split("/")[1];
      const parsedP = parseInt(slashPart, 10);
      if (!isNaN(parsedP) && parsedP >= 0 && parsedP <= 32) {
        prefix = parsedP;
        prefixSelect.value = prefix;
      }
    }

    const res = window.ipCalc.calculate(rawIp, prefix);
    if (res.error) {
      ipResultContainer.innerHTML = `
        <div class="p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
          <strong>Lỗi:</strong> ${res.error}
        </div>
      `;
      return;
    }

    renderIpResults(res);
  }

  function renderIpResults(res) {
    ipResultContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Card 1: Network & Broadcast -->
        <div class="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60 shadow-sm space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
            <span class="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Địa chỉ & Phân loại</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${res.classification.badge}">
              ${res.classification.type} (${res.classification.rfc})
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">IP Đã Nhập:</span>
            <div class="flex items-center gap-2">
              <code class="font-mono font-bold text-neutral-900 dark:text-neutral-100 text-base">${res.cidr}</code>
              <button class="copy-btn text-xs text-indigo-500 hover:text-indigo-400" data-copy="${res.cidr}">Copy</button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">Network ID:</span>
            <div class="flex items-center gap-2">
              <code class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">${res.networkCidr}</code>
              <button class="copy-btn text-xs text-indigo-500 hover:text-indigo-400" data-copy="${res.network}">Copy</button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">Broadcast:</span>
            <div class="flex items-center gap-2">
              <code class="font-mono font-bold text-rose-600 dark:text-rose-400 text-base">${res.broadcast}</code>
              <button class="copy-btn text-xs text-indigo-500 hover:text-indigo-400" data-copy="${res.broadcast}">Copy</button>
            </div>
          </div>
        </div>

        <!-- Card 2: Subnet Mask & Hosts -->
        <div class="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700/60 shadow-sm space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
            <span class="text-xs uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">Mặt nạ & Khả dụng</span>
            <span class="text-xs font-semibold text-indigo-500 dark:text-indigo-400">Prefix /${res.prefix}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">Subnet Mask:</span>
            <div class="flex items-center gap-2">
              <code class="font-mono font-bold text-neutral-900 dark:text-neutral-100">${res.subnetMask}</code>
              <button class="copy-btn text-xs text-indigo-500 hover:text-indigo-400" data-copy="${res.subnetMask}">Copy</button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">Wildcard Mask:</span>
            <div class="flex items-center gap-2">
              <code class="font-mono text-neutral-700 dark:text-neutral-300">${res.wildcardMask}</code>
              <button class="copy-btn text-xs text-indigo-500 hover:text-indigo-400" data-copy="${res.wildcardMask}">Copy</button>
            </div>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-neutral-600 dark:text-neutral-300">Host Khả Dụng:</span>
            <span class="font-mono font-bold text-amber-600 dark:text-amber-400">${res.usableHosts} máy (trong tổng ${res.totalAddresses})</span>
          </div>
        </div>

        <!-- Card 3: Usable Range (Span 2) -->
        <div class="md:col-span-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 shadow-sm">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Dải IP Gán Cho Thiết Bị (Usable Host Range)</span>
              <p class="font-mono text-base sm:text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">${res.hostRange}</p>
            </div>
            <button class="copy-btn px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors" data-copy="${res.hostRange}">
              Copy Dải IP
            </button>
          </div>
        </div>

        <!-- Card 4: Binary Representation (Span 2) -->
        <div class="md:col-span-2 p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 font-mono text-xs sm:text-sm space-y-2 overflow-x-auto">
          <div class="text-xs font-bold uppercase tracking-wider text-neutral-500 pb-1 border-b border-neutral-200 dark:border-neutral-700">Dạng Nhị Phân 32-bit (Binary Breakdown)</div>
          <div class="flex justify-between items-center gap-4">
            <span class="text-neutral-500 w-28">IP Address:</span>
            <span class="text-indigo-600 dark:text-indigo-400 font-bold">${res.ipBinary}</span>
          </div>
          <div class="flex justify-between items-center gap-4">
            <span class="text-neutral-500 w-28">Subnet Mask:</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">${res.maskBinary}</span>
          </div>
          <div class="flex justify-between items-center gap-4">
            <span class="text-neutral-500 w-28">Wildcard:</span>
            <span class="text-neutral-600 dark:text-neutral-400">${res.wildcardBinary}</span>
          </div>
        </div>
      </div>
    `;

    // Bind copy buttons
    ipResultContainer.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        window.soundEngine.playClick();
        try {
          await copyText(btn.dataset.copy);
        } catch {
          toast("Không thể sao chép. Hãy chọn và chép thủ công.");
          return;
        }
        const originalText = btn.textContent;
        btn.textContent = "Đã chép!";
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      });
    });
  }

  if (ipCalcBtn) {
    ipCalcBtn.addEventListener("click", () => {
      window.soundEngine.playClick();
      runIpCalculation();
    });
  }

  if (ipInput) {
    ipInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        window.soundEngine.playClick();
        runIpCalculation();
      }
    });
  }

  if (prefixSelect) {
    prefixSelect.addEventListener("change", () => {
      ipInput.value = ipInput.value.split("/")[0];
      window.soundEngine.playClick();
      runIpCalculation();
    });
  }

  ipPresets.forEach((btn) => {
    btn.addEventListener("click", () => {
      window.soundEngine.playClick();
      const ip = btn.dataset.ip;
      ipInput.value = ip;
      runIpCalculation();
    });
  });

  // ----------------------------------------------------
  // Unit Converter Module
  // ----------------------------------------------------
  const convCategory = document.getElementById("conv-category");
  const convFromVal = document.getElementById("conv-from-val");
  const convFromUnit = document.getElementById("conv-from-unit");
  const convToVal = document.getElementById("conv-to-val");
  const convToUnit = document.getElementById("conv-to-unit");
  const convTableBody = document.getElementById("conv-quick-table");
  const downloadTool = document.getElementById("download-calc-tool");

  function populateUnitDropdowns(catKey) {
    const cat = window.unitConverter.definitions[catKey];
    if (!cat) return;

    convFromUnit.innerHTML = "";
    convToUnit.innerHTML = "";

    const keys = Object.keys(cat.units);
    keys.forEach((unitKey, idx) => {
      const u = cat.units[unitKey];
      const opt1 = new Option(u.name, unitKey);
      const opt2 = new Option(u.name, unitKey);

      convFromUnit.add(opt1);
      convToUnit.add(opt2);
    });

    // Default select
    if (keys.length > 1) {
      convFromUnit.selectedIndex = 0;
      convToUnit.selectedIndex = 1;
    }

    if (catKey === "speed") {
      if (downloadTool) downloadTool.classList.remove("hidden");
    } else {
      if (downloadTool) downloadTool.classList.add("hidden");
    }

    runConversion("from");
    renderQuickTable(catKey);
  }

  function runConversion(direction = "from") {
    const catKey = convCategory.value;
    if (direction === "from") {
      const val = parseFloat(convFromVal.value);
      if (isNaN(val)) {
        convToVal.value = "";
        return;
      }
      const res = window.unitConverter.convert(
        catKey,
        val,
        convFromUnit.value,
        convToUnit.value,
      );
      convToVal.value = window.casioCalc.cleanFloat(res);
    } else {
      const val = parseFloat(convToVal.value);
      if (isNaN(val)) {
        convFromVal.value = "";
        return;
      }
      const res = window.unitConverter.convert(
        catKey,
        val,
        convToUnit.value,
        convFromUnit.value,
      );
      convFromVal.value = window.casioCalc.cleanFloat(res);
    }
  }

  function renderQuickTable(catKey) {
    if (!convTableBody) return;
    const cat = window.unitConverter.definitions[catKey];
    if (!cat) return;

    const parsedValue = parseFloat(convFromVal.value);
    const baseVal = Number.isFinite(parsedValue) ? parsedValue : 0;
    const currentFromUnit = convFromUnit.value;

    convTableBody.innerHTML = "";
    Object.keys(cat.units).forEach((uKey) => {
      const u = cat.units[uKey];
      const converted = window.unitConverter.convert(
        catKey,
        baseVal,
        currentFromUnit,
        uKey,
      );
      const tr = document.createElement("tr");
      tr.className =
        "border-b border-neutral-200 dark:border-neutral-800 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800/40";
      tr.innerHTML = `
        <td class="py-2 px-3 font-medium text-neutral-700 dark:text-neutral-300">${u.name}</td>
        <td class="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">${window.casioCalc.cleanFloat(converted)}</td>
      `;
      convTableBody.appendChild(tr);
    });
  }

  if (convCategory) {
    convCategory.addEventListener("change", () => {
      window.soundEngine.playClick();
      populateUnitDropdowns(convCategory.value);
    });
    convFromVal.addEventListener("input", () => {
      runConversion("from");
      renderQuickTable(convCategory.value);
    });
    convToVal.addEventListener("input", () => {
      runConversion("to");
      renderQuickTable(convCategory.value);
    });
    convFromUnit.addEventListener("change", () => {
      window.soundEngine.playClick();
      runConversion("from");
      renderQuickTable(convCategory.value);
    });
    convToUnit.addEventListener("change", () => {
      window.soundEngine.playClick();
      runConversion("from");
    });
    populateUnitDropdowns("storage");
    convFromUnit.value = "GB";
    convToUnit.value = "GiB";
    runConversion();
    renderQuickTable("storage");
    document.getElementById("conv-swap").addEventListener("click", () => {
      [convFromUnit.value, convToUnit.value] = [
        convToUnit.value,
        convFromUnit.value,
      ];
      convFromVal.value = convToVal.value;
      runConversion();
      renderQuickTable(convCategory.value);
    });
  }

  // Download Time Calculator
  const dlSize = document.getElementById("dl-size");
  const dlSizeUnit = document.getElementById("dl-size-unit");
  const dlSpeed = document.getElementById("dl-speed");
  const dlSpeedUnit = document.getElementById("dl-speed-unit");
  const dlResult = document.getElementById("dl-result");

  function calculateDownload() {
    if (!dlSize || !dlSpeed || !dlResult) return;
    const size = parseFloat(dlSize.value);
    const speed = parseFloat(dlSpeed.value);
    if (
      !Number.isFinite(size) ||
      !Number.isFinite(speed) ||
      size < 0 ||
      speed <= 0
    ) {
      dlResult.textContent = "--";
      return;
    }
    const res = window.unitConverter.calculateDownloadTime(
      size,
      dlSizeUnit.value,
      speed,
      dlSpeedUnit.value,
    );
    if (res) {
      dlResult.textContent = res.formattedTime;
    }
  }

  if (dlSize) {
    [dlSize, dlSizeUnit, dlSpeed, dlSpeedUnit].forEach((el) => {
      el.addEventListener("input", calculateDownload);
      el.addEventListener("change", calculateDownload);
    });
  }

  // ----------------------------------------------------
  // History Panel
  // ----------------------------------------------------
  const historyList = document.getElementById("history-list");
  const historyClearBtn = document.getElementById("history-clear-btn");

  function renderHistory() {
    if (!historyList) return;
    const list = window.casioCalc.history;
    if (!list || list.length === 0) {
      historyList.innerHTML = `
        <div class="text-center py-12 text-neutral-400">
          <p class="text-base font-semibold">Chưa có phép tính nào</p>
          <p class="text-xs text-neutral-500 mt-1">Nhấn Enter hoặc Tính kết quả để lưu phép tính tại đây.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = list
      .map(
        (item, idx) => `
      <button type="button" class="w-full text-left p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between hover:border-indigo-500 transition-colors cursor-pointer history-item" data-idx="${idx}">
        <div>
          <div class="text-xs text-neutral-500 font-mono">${escapeHTML(item.time)}</div>
          <div class="text-sm font-mono text-neutral-700 dark:text-neutral-300">${escapeHTML(item.expr)}</div>
        </div>
        <div class="text-right">
          <div class="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400">${escapeHTML(item.result)}</div>
          <span class="text-xs text-neutral-400">Click để dùng lại</span>
        </div>
      </button>
    `,
      )
      .join("");

    historyList.querySelectorAll(".history-item").forEach((el) => {
      el.addEventListener("click", () => {
        window.soundEngine.playClick();
        const idx = el.dataset.idx;
        const item = list[idx];
        if (item) {
          switchTab("calc");
          loadFormula(item.expr, item);
        }
      });
    });
  }

  if (historyClearBtn) {
    historyClearBtn.addEventListener("click", () => {
      window.soundEngine.playClick();
      window.casioCalc.clearHistory();
      renderHistory();
      renderRecentHistory();
    });
  }

  function renderRecentHistory() {
    const container = document.getElementById("recent-history");
    const list = window.casioCalc.history.slice(0, 3);
    if (!list.length) {
      container.innerHTML =
        '<div class="recent-empty"><span>↺</span><p>Những con số bắt đầu từ đây.</p><small>Phép tính của bạn sẽ xuất hiện tại đây.<br>Thử một ví dụ để bắt đầu nhé.</small></div>';
      return;
    }
    container.innerHTML = list
      .map(
        (item, index) =>
          `<button class="recent-item" data-index="${index}" title="Dùng lại phép tính"><span>${escapeHTML(item.expr)}</span><strong>${escapeHTML(item.result)}</strong></button>`,
      )
      .join("");
    container.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", () => {
        const item = list[Number(button.dataset.index)];
        loadFormula(item.expr, item);
      }),
    );
  }

  calculateDownload();
  // Initial load
  updateScreen();
  runIpCalculation();
});
