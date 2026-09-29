import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pageUrl = new URL("../modules/05-calculadora/index.html", import.meta.url).href;
const cases = [
  { id: "CP-01", name: "Suma correcta", input: "7 + 5 =", keys: ["7", "+", "5", "="], expected: "12" },
  { id: "CP-02", name: "Resta correcta", input: "10 − 4 =", keys: ["1", "0", "-", "4", "="], expected: "6" },
  { id: "CP-03", name: "Multiplicación correcta", input: "5 × 6 =", keys: ["5", "*", "6", "="], expected: "30" },
  { id: "CP-04", name: "División correcta", input: "20 ÷ 4 =", keys: ["2", "0", "/", "4", "="], expected: "5" },
  { id: "CP-05", name: "División entre cero", input: "10 ÷ 0 =", keys: ["1", "0", "/", "0", "="], expected: "No se puede dividir entre cero." }
];
const testDirectory = await mkdtemp(join(tmpdir(), "calculadora-test-"));
const screenshotDirectory = join(testDirectory, "capturas");
const profileDirectory = join(testDirectory, "perfil-chrome");
await mkdir(screenshotDirectory);

let chrome;
let chromeError = "";
let cdpBuffer = "";
let nextId = 0;
const pending = new Map();

function receiveCdpMessages(chunk) {
  cdpBuffer += chunk;
  let separator;

  while ((separator = cdpBuffer.indexOf("\0")) !== -1) {
    const message = JSON.parse(cdpBuffer.slice(0, separator));
    cdpBuffer = cdpBuffer.slice(separator + 1);
    const request = pending.get(message.id);
    if (!request) continue;

    pending.delete(message.id);
    clearTimeout(request.timeout);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  }
}

function send(method, params = {}, sessionId) {
  if (!chrome || chrome.exitCode !== null) return Promise.reject(new Error("Chrome no está ejecutándose."));

  const id = ++nextId;
  const command = { id, method, params };
  if (sessionId) command.sessionId = sessionId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Chrome no respondió a ${method}.`));
    }, 10000);
    pending.set(id, { resolve, reject, timeout });
    chrome.stdio[3].write(`${JSON.stringify(command)}\0`);
  });
}

try {
  chrome = spawn("google-chrome", [
    "--headless",
    "--disable-gpu",
    "--no-first-run",
    "--disable-background-networking",
    "--remote-debugging-pipe",
    `--user-data-dir=${profileDirectory}`
  ], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });

  chrome.stderr.setEncoding("utf8");
  chrome.stderr.on("data", chunk => { chromeError += chunk; });
  chrome.stdio[4].setEncoding("utf8");
  chrome.stdio[4].on("data", receiveCdpMessages);
  chrome.stdio[3].on("error", () => {});
  chrome.stdio[4].on("error", () => {});
  chrome.on("error", error => { chromeError += error.message; });

  await new Promise(resolve => {
    chrome.once("spawn", resolve);
    chrome.once("error", resolve);
  });
  await send("Browser.getVersion");
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);
  await send("Page.navigate", { url: pageUrl }, sessionId);

  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    }, sessionId);
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text || "Error al evaluar la página.");
    }
    return response.result.value;
  }

  let pageReady = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    pageReady = await evaluate('document.readyState === "complete" && document.getElementById("app-05") !== null');
    if (pageReady) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.equal(pageReady, true, "La página debe cargar la calculadora.");

  async function pressKey(key) {
    const modifier = key === "Enter" ? 13 : key.length === 1 ? key.charCodeAt(0) : 0;
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code: key === "Enter" ? "Enter" : `Digit${key}`,
      windowsVirtualKeyCode: modifier
    }, sessionId);
    await send("Input.dispatchKeyEvent", { type: "keyUp", key }, sessionId);
  }

  async function clickButton(action, value) {
    const result = await evaluate(`(() => {
      const button = [...document.querySelectorAll("#app-05 button[data-action]")]
        .find(item => item.dataset.action === ${JSON.stringify(action)} && item.dataset.value === ${JSON.stringify(value)});
      if (!button) return false;
      button.click();
      return true;
    })()`);
    assert.equal(result, true, `Debe existir el botón para ${action} ${value || ""}.`);
  }

  async function reset() {
    await clickButton("clear");
  }

  const results = [];
  for (const testCase of cases) {
    await reset();
    for (const key of testCase.keys) {
      if (key === "=") await clickButton("calculate");
      else if (["+", "-", "*", "/"].includes(key)) await clickButton("operator", key);
      else await clickButton("digit", key);
    }

    const actual = await evaluate(`({ display: document.getElementById("pantalla-05").textContent, status: document.getElementById("resultado-05").textContent })`);
    assert.equal(testCase.id === "CP-05" ? actual.status : actual.display, testCase.expected, testCase.id);
    assert.doesNotMatch(`${actual.display} ${actual.status}`, /NaN|Infinity/);
    results.push({ ...testCase, actual: testCase.id === "CP-05" ? actual.status : actual.display, status: "PASS" });
  }

  await reset();
  await clickButton("digit", "0");
  await clickButton("decimal");
  await clickButton("digit", "1");
  await clickButton("operator", "*");
  await clickButton("digit", "5");
  await clickButton("calculate");
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "0.5", "Debe calcular correctamente números decimales.");

  await reset();
  for (const [action, value] of [["digit", "7"], ["operator", "-"], ["digit", "1"], ["digit", "2"], ["calculate", undefined]]) {
    await clickButton(action, value);
  }
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "-5", "Debe mostrar resultados negativos correctamente.");

  await reset();
  for (const [action, value] of [["digit", "2"], ["operator", "+"], ["digit", "3"], ["operator", "*"], ["digit", "4"], ["calculate", undefined]]) {
    await clickButton(action, value);
  }
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "20", "Las operaciones encadenadas deben ejecutarse en orden.");

  await reset();
  for (const character of "1234567890123") await clickButton("digit", character);
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "123456789012", "Debe limitar cada número a doce dígitos.");

  await reset();
  await clickButton("digit", "2");
  await clickButton("operator", "+");
  await clickButton("operator", "*");
  await clickButton("digit", "3");
  await clickButton("calculate");
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "6", "Un operador consecutivo debe reemplazar al pendiente.");

  await reset();
  for (const key of ["1", "0", "/"]) await clickButton(["+", "-", "*", "/"].includes(key) ? "operator" : "digit", key);
  await clickButton("calculate");
  assert.match(await evaluate('document.getElementById("resultado-05").textContent'), /Ingresa el segundo número/);
  await reset();
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "0", "C debe restablecer la calculadora.");

  for (const width of [320, 375, 768, 1024]) {
    const height = width < 700 ? 812 : 960;
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 700 }, sessionId);
    await reset();
    for (const key of ["7", "+", "5", "="]) {
      if (key === "+") await clickButton("operator", "+");
      else if (key === "=") await clickButton("calculate");
      else await clickButton("digit", key);
    }

    const layout = await evaluate(`(() => {
      const app = document.getElementById("app-05");
      const calculator = app.querySelector(".calculator-shell");
      const buttons = [...app.querySelectorAll("button")];
      return {
        viewport: innerWidth,
        pageWidth: document.documentElement.scrollWidth,
        visibleWidth: document.documentElement.clientWidth,
        bodyWidth: document.body.scrollWidth,
        appWidth: app.clientWidth,
        calculatorWidth: calculator.getBoundingClientRect().width,
        buttonCount: buttons.length,
        buttonsVisible: buttons.every(button => button.getBoundingClientRect().left >= app.getBoundingClientRect().left && button.getBoundingClientRect().right <= app.getBoundingClientRect().right + 1),
        minimumButtonHeight: Math.min(...buttons.map(button => button.getBoundingClientRect().height)),
        display: document.getElementById("pantalla-05").textContent
      };
    })()`);
    assert.equal(layout.pageWidth, layout.visibleWidth, `No debe existir scroll horizontal a ${width}px.`);
    assert.equal(layout.bodyWidth, layout.visibleWidth, `El contenido debe caber a ${width}px.`);
    assert.equal(layout.buttonsVisible, true, `Todos los botones deben caber a ${width}px.`);
    assert.ok(layout.minimumButtonHeight >= 48, `Los botones deben tener un mínimo táctil a ${width}px.`);
    assert.equal(layout.display, "12");

    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
    const screenshotPath = join(screenshotDirectory, `calculadora-${width}px.png`);
    await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));
    console.log(`Responsive ${JSON.stringify(layout)} captura=${screenshotPath}`);
  }

  await reset();
  await send("Runtime.evaluate", {
    expression: 'document.getElementById("pantalla-05").focus()',
    returnByValue: true
  }, sessionId);
  await pressKey("a");
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "0", "Las teclas ajenas a la calculadora deben ignorarse.");
  for (const key of ["1", "0", "/", "4", "Enter"]) await pressKey(key);
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "2.5", "El teclado y Enter con la pantalla enfocada deben funcionar.");

  await reset();
  await send("Runtime.evaluate", {
    expression: 'document.getElementById("pantalla-05").focus()',
    returnByValue: true
  }, sessionId);
  for (const key of ["0", ",", "1", "+", "0", ",", "2", "Enter"]) await pressKey(key);
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "0.3", "El teclado debe aceptar la coma decimal.");
  await clickButton("digit", "8");
  await pressKey("Escape");
  assert.equal(await evaluate('document.getElementById("pantalla-05").textContent'), "0", "Escape debe restablecer completamente la calculadora.");

  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  await reset();
  for (const digit of "999999999999") await clickButton("digit", digit);
  await clickButton("operator", "*");
  for (const digit of "999999999999") await clickButton("digit", digit);
  await clickButton("calculate");
  const longResult = await evaluate(`(() => {
    const display = document.getElementById("pantalla-05");
    return {
      value: display.textContent,
      displayWidth: display.clientWidth,
      displayContentWidth: display.scrollWidth,
      pageWidth: document.documentElement.scrollWidth,
      visibleWidth: document.documentElement.clientWidth
    };
  })()`);
  assert.equal(longResult.value, "9.99999999998e+23");
  assert.ok(longResult.displayContentWidth <= longResult.displayWidth, "Un resultado largo debe caber en la pantalla.");
  assert.equal(longResult.pageWidth, longResult.visibleWidth, "Un resultado largo no debe provocar scroll horizontal.");
  const longResultScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }, sessionId);
  await writeFile(join(screenshotDirectory, "calculadora-resultado-largo-320px.png"), Buffer.from(longResultScreenshot.data, "base64"));

  console.log("\nCasos de prueba funcionales:");
  for (const testCase of results) {
    console.log(`${testCase.id} | ${testCase.name} | Entrada: ${testCase.input} | Esperado: ${testCase.expected} | Obtenido: ${testCase.actual} | ${testCase.status}`);
  }
  console.log("PASS | Decimales, límite de dígitos, operador consecutivo, operación incompleta, limpieza y teclado");
  console.log(`Capturas para revisión visual: ${screenshotDirectory}`);
} catch (error) {
  console.error(error.stack || error);
  if (chrome && chrome.exitCode !== null && chromeError) console.error(chromeError);
  process.exitCode = 1;
} finally {
  for (const request of pending.values()) {
    clearTimeout(request.timeout);
    request.reject(new Error("Finalizó la prueba."));
  }
  pending.clear();
  if (chrome && chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await new Promise(resolve => chrome.once("exit", resolve));
  }
  await rm(profileDirectory, { recursive: true, force: true });
}
