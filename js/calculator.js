// Casio fx-570VN PLUS Scientific Math Engine
class CasioCalculator {
  constructor() {
    this.expression = "";
    this.result = "0";
    this.rawResult = 0;
    this.ans = 0;
    this.memory = 0;
    this.angleMode = "DEG"; // 'DEG' or 'RAD'
    this.shiftActive = false;
    this.alphaActive = false;
    this.isResultDisplayed = false;
    this.fractionMode = false; // toggle for S<=>D
    this.history = [];
    this.loadHistory();
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem("fx570_history");
      if (saved) {
        const items = JSON.parse(saved);
        this.history = Array.isArray(items)
          ? items
              .filter(
                (item) =>
                  item &&
                  typeof item.expr === "string" &&
                  typeof item.result === "string" &&
                  item.expr.length <= 1000,
              )
              .slice(0, 50)
          : [];
      }
    } catch (e) {
      this.history = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(
        "fx570_history",
        JSON.stringify(this.history.slice(0, 50)),
      );
    } catch (e) {}
  }

  addHistory(expr, res, context = {}) {
    this.history.unshift({
      expr,
      result: res,
      angleMode: this.angleMode,
      ans: context.ans ?? this.ans,
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    if (this.history.length > 50) this.history.pop();
    this.saveHistory();
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }

  toggleShift() {
    this.shiftActive = !this.shiftActive;
    if (this.shiftActive) this.alphaActive = false;
    return this.shiftActive;
  }

  toggleAlpha() {
    this.alphaActive = !this.alphaActive;
    if (this.alphaActive) this.shiftActive = false;
    return this.alphaActive;
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === "DEG" ? "RAD" : "DEG";
    return this.angleMode;
  }

  clear() {
    this.expression = "";
    this.result = "0";
    this.rawResult = 0;
    this.isResultDisplayed = false;
    this.fractionMode = false;
    this.shiftActive = false;
    this.alphaActive = false;
  }

  get expression() {
    return this._expression || "";
  }
  set expression(value) {
    this._expression = value;
    this.cursor = value.length;
  }

  deleteChar() {
    this.isResultDisplayed = false;
    if (this.cursor > 0) {
      const before = this.expression.slice(0, this.cursor);
      const token = [
        "sin⁻¹(",
        "cos⁻¹(",
        "tan⁻¹(",
        "sinh(",
        "cosh(",
        "tanh(",
        "sin(",
        "cos(",
        "tan(",
        "log(",
        "ln(",
        "abs(",
        "√(",
        "∛(",
        "Ans",
        "×10^",
      ].find((t) => before.endsWith(t));
      const next = this.cursor - (token ? token.length : 1);
      this.expression =
        before.slice(0, next) + this.expression.slice(this.cursor);
      this.cursor = next;
    }
  }

  input(char) {
    if (this.isResultDisplayed) {
      this.expression =
        ["+", "-", "×", "÷", "/", "^", "%", "²", "³", "!"].includes(char) &&
        !this.result.includes("ERROR")
          ? "Ans" + char
          : char;
      this.isResultDisplayed = false;
      this.fractionMode = false;
    } else if (this.expression.length + char.length <= 1000) {
      const next = this.cursor + char.length;
      this.expression =
        this.expression.slice(0, this.cursor) +
        char +
        this.expression.slice(this.cursor);
      this.cursor = next;
    }
  }

  // Factorial helper
  factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n > 170) return Infinity;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  // Float precision cleanup
  cleanFloat(n) {
    if (typeof n !== "number" || !isFinite(n)) return n;
    const rounded = parseFloat(n.toPrecision(12));
    return rounded;
  }

  // Continued fraction converter for S<=>D key
  toFraction(val, maxDenom = 100000) {
    if (!isFinite(val) || Math.floor(val) === val) return null;
    const sign = val < 0 ? -1 : 1;
    let x = Math.abs(val);

    let h1 = 1,
      h2 = 0,
      k1 = 0,
      k2 = 1;
    let b = x;
    let bestNum = Math.round(x);
    let bestDen = 1;
    let bestErr = Math.abs(x - bestNum);

    for (let iter = 0; iter < 25; iter++) {
      let a = Math.floor(b);
      let auxH = h1;
      h1 = a * h1 + h2;
      h2 = auxH;
      let auxK = k1;
      k1 = a * k1 + k2;
      k2 = auxK;
      if (k1 > maxDenom) break;

      let err = Math.abs(x - h1 / k1);
      if (err < bestErr) {
        bestNum = h1;
        bestDen = k1;
        bestErr = err;
      }
      if (err < 1e-9) break;
      if (Math.abs(b - a) < 1e-9) break;
      b = 1 / (b - a);
    }

    if (bestErr < 1e-6 && bestDen > 1) {
      return { num: sign * bestNum, den: bestDen };
    }
    return null;
  }

  toggleFraction() {
    if (
      !this.isResultDisplayed ||
      this.result.includes("ERROR") ||
      typeof this.rawResult !== "number" ||
      !isFinite(this.rawResult)
    )
      return;

    this.fractionMode = !this.fractionMode;
    if (this.fractionMode) {
      const frac = this.toFraction(this.rawResult);
      if (frac) {
        // Mixed fraction or simple fraction
        const whole = Math.trunc(frac.num / frac.den);
        const rem = Math.abs(frac.num % frac.den);
        if (Math.abs(whole) > 0 && rem > 0) {
          this.result = `${whole} ˩ ${rem}/${frac.den}  (${frac.num}/${frac.den})`;
        } else {
          this.result = `${frac.num}/${frac.den}`;
        }
      } else {
        this.result = this.formatNumber(this.rawResult);
      }
    } else {
      this.result = this.formatNumber(this.rawResult);
    }
  }

  formatNumber(val) {
    if (isNaN(val)) return "Math ERROR";
    if (!isFinite(val)) return val > 0 ? "Infinity" : "-Infinity";
    const cleaned = this.cleanFloat(val);
    // Exponential notation for huge/tiny numbers
    if (
      Math.abs(cleaned) >= 1e12 ||
      (Math.abs(cleaned) > 0 && Math.abs(cleaned) < 1e-9)
    ) {
      return cleaned
        .toExponential(8)
        .replace("e+", " × 10^")
        .replace("e-", " × 10^-");
    }
    return cleaned.toString();
  }

  evaluate() {
    if (!this.expression.trim()) return;

    const expr = this.expression;
    const originalExpr = expr;
    const originalAns = this.ans;

    try {
      const val = this.evaluateValue(expr);

      if (!Number.isFinite(val)) {
        this.result = "Math ERROR";
        this.isResultDisplayed = true;
      } else {
        this.rawResult = val;
        this.ans = val;
        this.result = this.formatNumber(val);
        this.isResultDisplayed = true;
        this.fractionMode = false;
        this.addHistory(originalExpr, this.result, { ans: originalAns });
      }
    } catch (err) {
      this.result = "Syntax ERROR";
      this.isResultDisplayed = true;
    }
  }

  // Shared by live preview and committed calculations; does not mutate state.
  evaluateValue(expression) {
    const normalized = expression
      .replace(/sqrt\s*\(/gi, "√(")
      .replace(/cbrt\s*\(/gi, "∛(")
      .replace(/asin\s*\(/gi, "sin⁻¹(")
      .replace(/acos\s*\(/gi, "cos⁻¹(")
      .replace(/atan\s*\(/gi, "tan⁻¹(")
      .replace(/\bpi\b/gi, "π")
      .replace(/\bans\b/gi, "Ans")
      .replace(/−/g, "-")
      .replace(/×10\^/g, "*10^")
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/²/g, "^2")
      .replace(/³/g, "^3");
    return this.parseExpression(normalized);
  }

  parseExpression(raw) {
    // Recursive descent: powers associate right; postfix percent is unary.
    const tokens = [];
    const pattern =
      /\s*(sin⁻¹|cos⁻¹|tan⁻¹|sinh|cosh|tanh|sin|cos|tan|log|ln|abs|Ans|π|e|√|∛|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[+*/^%!()\-])/y;
    let offset = 0;
    while (offset < raw.length) {
      if (!raw.slice(offset).trim()) break;
      pattern.lastIndex = offset;
      const match = pattern.exec(raw);
      if (!match) throw new Error("Syntax ERROR");
      tokens.push(match[1]);
      offset = pattern.lastIndex;
    }
    let pos = 0;
    let depth = 0;
    const isNumber = (t) => t !== undefined && /^(?:\d|\.)/.test(t);
    const functions = {
      sin: (x) =>
        this.snapTrig(
          Math.sin(this.angleMode === "DEG" ? (x * Math.PI) / 180 : x),
        ),
      cos: (x) =>
        this.snapTrig(
          Math.cos(this.angleMode === "DEG" ? (x * Math.PI) / 180 : x),
        ),
      tan: (x) => {
        const r = this.angleMode === "DEG" ? (x * Math.PI) / 180 : x;
        return Math.abs(Math.cos(r)) < 1e-14 ? NaN : this.snapTrig(Math.tan(r));
      },
      "sin⁻¹": (x) =>
        Math.asin(x) * (this.angleMode === "DEG" ? 180 / Math.PI : 1),
      "cos⁻¹": (x) =>
        Math.acos(x) * (this.angleMode === "DEG" ? 180 / Math.PI : 1),
      "tan⁻¹": (x) =>
        Math.atan(x) * (this.angleMode === "DEG" ? 180 / Math.PI : 1),
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      log: Math.log10,
      ln: Math.log,
      abs: Math.abs,
      "√": Math.sqrt,
      "∛": Math.cbrt,
    };
    const primary = () => {
      if (++depth > 100) throw new Error("Expression too deep");
      const t = tokens[pos++];
      let value;
      if (isNumber(t)) value = Number(t);
      else if (t === "Ans") value = this.ans;
      else if (t === "π") value = Math.PI;
      else if (t === "e") value = Math.E;
      else if (t === "(" || Object.hasOwn(functions, t)) {
        const fn = t !== "(";
        if (fn && tokens[pos++] !== "(")
          throw new Error("Expected opening bracket");
        value = sum();
        if (tokens[pos++] !== ")") throw new Error("Expected closing bracket");
        if (fn) value = functions[t](value);
      } else throw new Error("Expected value");
      depth--;
      while (tokens[pos] === "%" || tokens[pos] === "!") {
        value = tokens[pos++] === "%" ? value / 100 : this.factorial(value);
      }
      return value;
    };
    const power = () => {
      const value = primary();
      if (tokens[pos] === "^") {
        pos++;
        return value ** unary();
      }
      return value;
    };
    const unary = () => {
      if (tokens[pos] === "+" || tokens[pos] === "-") {
        const sign = tokens[pos++];
        return (sign === "-" ? -1 : 1) * unary();
      }
      return power();
    };
    const product = () => {
      let value = unary();
      while (pos < tokens.length) {
        const t = tokens[pos];
        if (t === "*" || t === "/") {
          pos++;
          const right = unary();
          value = t === "*" ? value * right : value / right;
        } else if (
          t === "(" ||
          t === "π" ||
          t === "e" ||
          t === "Ans" ||
          Object.hasOwn(functions, t)
        ) {
          value *= unary();
        } else break;
      }
      return value;
    };
    const sum = () => {
      let value = product();
      while (tokens[pos] === "+" || tokens[pos] === "-") {
        const op = tokens[pos++];
        const right = product();
        value = op === "+" ? value + right : value - right;
      }
      return value;
    };
    if (tokens.length > 500) throw new Error("Expression too long");
    const value = sum();
    if (pos !== tokens.length) throw new Error("Unexpected token");
    return value;
  }

  snapTrig(value) {
    return Math.abs(value) < 1e-15 ? 0 : value;
  }
}

window.casioCalc = new CasioCalculator();
