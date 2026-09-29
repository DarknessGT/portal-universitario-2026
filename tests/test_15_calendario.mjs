// Prueba de integración sin dependencias npm: Node.js 22+ y Google Chrome.
// Ejecutar desde la raíz: node --test tests/test_15_calendario.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const pausa = (ms) => new Promise(resolve => setTimeout(resolve, ms));

test("calendario 15: fechas oficiales, navegación, filtros y vista móvil", async (t) => {
  const perfil = await mkdtemp(join(tmpdir(), "calendario-15-"));
  const pagina = pathToFileURL(resolve("modules/15-calendario/index.html")).href;
  const chrome = spawn(process.env.CHROME_BIN || "google-chrome", [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--remote-allow-origins=*",
    "--remote-debugging-port=0", `--user-data-dir=${perfil}`, pagina
  ], { stdio: "ignore" });
  chrome.on("error", () => {});
  let socket;
  t.after(async () => {
    socket?.close();
    chrome.kill();
    await rm(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  let destino;
  for (let intento = 0; intento < 100; intento++) {
    if (chrome.exitCode !== null) throw new Error("Chrome terminó antes de iniciar la prueba.");
    try {
      const [puerto] = (await readFile(join(perfil, "DevToolsActivePort"), "utf8")).split("\n");
      const paginas = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
      destino = paginas.find(p => p.type === "page" && p.url === pagina);
      if (destino) break;
    } catch { /* Chrome todavía está iniciando. */ }
    await pausa(100);
  }
  assert.ok(destino, "Chrome debe abrir el módulo 15");
  socket = new WebSocket(destino.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let siguienteId = 0;
  const pendientes = new Map();
  socket.addEventListener("message", (mensaje) => {
    const respuesta = JSON.parse(mensaje.data);
    if (!respuesta.id || !pendientes.has(respuesta.id)) return;
    const { resolve, reject } = pendientes.get(respuesta.id);
    pendientes.delete(respuesta.id);
    if (respuesta.error || respuesta.result?.exceptionDetails) reject(new Error(JSON.stringify(respuesta.error || respuesta.result.exceptionDetails)));
    else resolve(respuesta.result);
  });
  const comando = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++siguienteId;
    pendientes.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const ejecutar = async (codigo) => (await comando("Runtime.evaluate", {
    expression: `(() => { ${codigo} })()`, returnByValue: true
  })).result.value;
  let listo = false;
  for (let intento = 0; intento < 100; intento++) {
    listo = await ejecutar('return !!document.querySelector("#mes-15") && document.querySelector("#mes-15").textContent !== "Calendario 2026";');
    if (listo) break;
    await pausa(50);
  }
  assert.ok(listo, "El calendario debe inicializarse sin errores de JavaScript");

  await t.test("enero y límites del año", async () => {
    await ejecutar('while (!document.querySelector("#anterior-15").disabled) document.querySelector("#anterior-15").click();');
    const datos = await ejecutar('return [document.querySelector("#mes-15").textContent, document.querySelector("#total-15").textContent, document.querySelector("#anterior-15").disabled, document.querySelectorAll("#dias-15 .calendar-day").length];');
    assert.deepEqual(datos, ["enero de 2026", "2 fechas", true, 31]);
  });

  await t.test("febrero y días del intervalo de inscripciones", async () => {
    const datos = await ejecutar('document.querySelector("#siguiente-15").click(); return [document.querySelector("#total-15").textContent, document.querySelectorAll("#dias-15 .calendar-day").length, document.querySelectorAll("#dias-15 .calendar-day--event").length];');
    assert.deepEqual(datos, ["3 fechas", 28, 19]); // 1–6, 16–22 y 23–28.
  });

  await t.test("un evento que cruza de marzo a abril", async () => {
    const datos = await ejecutar('document.querySelector("#siguiente-15").click(); const marzo = document.querySelector("#eventos-15").textContent.includes("Asueto de Semana Santa"); document.querySelector("#siguiente-15").click(); return [marzo, document.querySelector("#eventos-15").textContent.includes("Asueto de Semana Santa"), document.querySelector("#mes-15").textContent];');
    assert.deepEqual(datos, [true, true, "abril de 2026"]);
  });

  await t.test("filtrado y estado sin resultados", async () => {
    const datos = await ejecutar('const filtro = document.querySelector("#filtro-15"); filtro.value = "inscripciones"; filtro.dispatchEvent(new Event("change")); const sinResultados = !document.querySelector("#sin-eventos-15").hidden; filtro.value = "evaluaciones"; filtro.dispatchEvent(new Event("change")); return [sinResultados, document.querySelector("#total-15").textContent];');
    assert.deepEqual(datos, [true, "1 fecha"]);
  });

  await t.test("dos actividades el 12 de julio y selección accesible", async () => {
    const datos = await ejecutar('document.querySelector("#filtro-15").value = "todas"; document.querySelector("#filtro-15").dispatchEvent(new Event("change")); for (let i = 0; i < 3; i++) document.querySelector("#siguiente-15").click(); const dia = document.querySelector("[data-fecha=\\"2026-07-12\\"]"); dia.click(); return [document.querySelector("#total-15").textContent, document.querySelector("[data-fecha=\\"2026-07-12\\"]").getAttribute("aria-pressed"), document.activeElement.dataset.fecha, document.querySelector("#limpiar-15").hidden];');
    assert.deepEqual(datos, ["2 fechas", "true", "2026-07-12", false]);
    await comando("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", text: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await comando("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    assert.equal(await ejecutar('return document.querySelector("[data-fecha=\\"2026-07-12\\"]").getAttribute("aria-pressed");'), "false");
    await comando("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", text: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await comando("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    assert.equal(await ejecutar('return document.querySelector("[data-fecha=\\"2026-07-12\\"]").getAttribute("aria-pressed");'), "true");
  });

  await t.test("diciembre y diseño a 375 px sin desbordamiento", async () => {
    await comando("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    const datos = await ejecutar('document.querySelector("#limpiar-15").click(); while (!document.querySelector("#siguiente-15").disabled) document.querySelector("#siguiente-15").click(); return [document.querySelector("#mes-15").textContent, document.querySelector("#total-15").textContent, document.documentElement.scrollWidth <= window.innerWidth, getComputedStyle(document.querySelector(".calendar-layout")).gridTemplateColumns.split(" ").length];');
    assert.deepEqual(datos, ["diciembre de 2026", "1 fecha", true, 1]);
  });
});
