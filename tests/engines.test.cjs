// Run: node --test tests/engines.test.cjs (Node 18+; no dependencies).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const context = vm.createContext({
  window: {},
  localStorage: { getItem: () => null, setItem: () => {} },
  console,
});
for (const file of ["calculator", "ip-calc", "converter"])
  vm.runInContext(
    readFileSync(`${__dirname}/../js/${file}.js`, "utf8"),
    context,
  );
const { casioCalc: calc, ipCalc: ip, unitConverter: conv } = context.window;
function result(expression) {
  calc.clear();
  calc.expression = expression;
  calc.evaluate();
  return calc.result;
}
for (const [expr, expected] of [
  ["0.1+0.2", "0.3"],
  ["sin⁻¹(0.5)", "30"],
  ["cos⁻¹(0.5)", "60"],
  ["tan⁻¹(1)", "45"],
  ["sin(30)²+cos(30)²", "1"],
  ["2(3+4)", "14"],
  ["2π", "6.28318530718"],
  ["-2^2", "-4"],
  ["2^-3", "0.125"],
  ["2^3^2", "512"],
  ["(-2)^2", "4"],
  ["200×15%", "30"],
  ["50%+25%", "0.75"],
  ["5!", "120"],
  ["5!-2", "118"],
  ["1e-14", "1.00000000 × 10^-14"],
  ["1÷0", "Math ERROR"],
  ["0÷0", "Math ERROR"],
  ["tan(90)", "Math ERROR"],
  ["√(-1)", "Math ERROR"],
  ["log(0)", "Math ERROR"],
  ["sin⁻¹(2)", "Math ERROR"],
  ["1..2", "Syntax ERROR"],
  ["2abc+3", "Syntax ERROR"],
  ["(2+3", "Syntax ERROR"],
  ["2+3)", "Syntax ERROR"],
  ["2+", "Syntax ERROR"],
  ["()", "Syntax ERROR"],
  ["∛(-8)", "-2"],
  ["1/3+1/6", "0.5"],
  ["1×10^-6", "0.000001"],
])
  test(`calculate ${expr}`, () => assert.equal(result(expr), expected));
test("fraction and answer chaining", () => {
  result("1/3");
  calc.toggleFraction();
  assert.equal(calc.result, "1/3");
  calc.toggleFraction();
  calc.input("×");
  calc.input("3");
  calc.evaluate();
  assert.equal(calc.result, "1");
});
test("cursor inserts and deletes at selected position", () => {
  calc.clear();
  calc.input("12");
  calc.cursor = 1;
  calc.input("+");
  assert.equal(calc.expression, "1+2");
  calc.deleteChar();
  assert.equal(calc.expression, "12");
  assert.equal(calc.cursor, 1);
});
test("invalid result keeps previous answer", () => {
  result("42");
  result("1/0");
  assert.equal(calc.ans, 42);
});
test("radian mode", () => {
  calc.angleMode = "RAD";
  assert.equal(result("sin(π/2)"), "1");
  calc.angleMode = "DEG";
});
test("IPv4 subnet boundaries", () => {
  const r = ip.calculate("192.168.1.150/26");
  assert.equal(r.network, "192.168.1.128");
  assert.equal(r.broadcast, "192.168.1.191");
  assert.equal(r.lastHost, "192.168.1.190");
  assert.equal(ip.calculate("10.0.0.0/31").firstHost, "10.0.0.0");
  assert.equal(ip.calculate("10.0.0.0/31").lastHost, "10.0.0.1");
  assert.equal(ip.calculate("10.0.0.1/32").hostRange, "10.0.0.1");
  assert.equal(ip.calculate("10.0.0.1/0").subnetMask, "0.0.0.0");
});
for (const input of [
  "1.2.3.4/33",
  "1.2.3.4/-1",
  "1.2.3.4/24x",
  "1.2.3.4/",
  "1.2.3.4/1/2",
  "1.2.3.4/2.5",
  "1.2.3.256",
  "1.2.3.2e1",
  "1.2.3.0x10",
  "1.2.3.1.5",
])
  test(`reject IP ${input}`, () => assert.ok(ip.calculate(input).error));
test("integer custom prefix required", () =>
  assert.ok(ip.calculate("1.2.3.4", 24.5).error));
test("unit conversions", () => {
  assert.equal(conv.convert("storage", 1, "GB", "B"), 1e9);
  assert.equal(conv.convert("storage", 1, "GiB", "B"), 1073741824);
  assert.equal(conv.convert("speed", 100, "Mbps", "MBps"), 12.5);
  assert.equal(conv.convert("temperature", 32, "F", "C"), 0);
  assert.equal(conv.convert("length", 0, "m", "km"), 0);
});
test("download duration carries rounded seconds", () => {
  assert.equal(
    conv.calculateDownloadTime(59.9, "B", 8, "bps").formattedTime,
    "1 phút 0 giây",
  );
  assert.equal(conv.calculateDownloadTime(-1, "GB", 100, "Mbps"), null);
  assert.equal(conv.calculateDownloadTime(1, "GB", 0, "Mbps"), null);
});

test("fraction toggle never replaces an error with stale result", () => {
  result("1/3");
  result("1/0");
  calc.toggleFraction();
  assert.equal(calc.result, "Math ERROR");
});
