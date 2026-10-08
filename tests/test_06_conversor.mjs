// Pruebas automatizadas del MÓDULO 06: Conversor Celsius ↔ Fahrenheit.
//
// Ejecución (desde la raíz del proyecto):
//   node --test tests/test_06_conversor.mjs
//
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as esperarMs } from "node:timers/promises";

const URL_MODULO = new URL("../modules/06-conversor/index.html", import.meta.url).href;
const ESPERA_MS = 5000;
const ARRANQUE_CHROME_MS = 20000;
const INTERVALO_SONDEO_MS = 25;
const PANTALLA_ESCRITORIO = { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false };
const PANTALLA_MOVIL = { width: 390, height: 844, deviceScaleFactor: 1, mobile: true };

// Resultados redondeados a 2 decimales por el módulo: se comparan con media centésima de margen.
const TOLERANCIA = 0.005;

// Mensajes reales de modulo.js.
const MENSAJES = {
  vacio: "Ingrese una temperatura para convertir.",
  exponenteIncompleto: "La notación científica está incompleta. Complete el exponente (ej. 1.5e+10).",
  bajoCeroAbsolutoC: "La temperatura no puede ser inferior al cero absoluto (-273.15 °C).",
  bajoCeroAbsolutoF: "La temperatura no puede ser inferior al cero absoluto (-459.67 °F)."
};

// ---------- Localización y arranque de Chrome ----------

function rutaChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const candidatas = {
    win32: ["PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"]
      .map(variable => process.env[variable])
      .filter(Boolean)
      .map(base => join(base, "Google", "Chrome", "Application", "chrome.exe")),
    darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
  }[process.platform] ?? [];
  return candidatas.find(ruta => existsSync(ruta)) ?? "google-chrome";
}

// Inicia Chrome headless con un perfil temporal y devuelve la URL WebSocket del navegador,
// leída del archivo DevToolsActivePort que Chrome escribe en ese perfil.
async function iniciarChrome(perfil) {
  const ejecutable = rutaChrome();
  const proceso = spawn(ejecutable, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${perfil}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "about:blank"
  ], { stdio: "ignore" });

  let falloArranque = null;
  proceso.once("error", error => {
    falloArranque = new Error(
      `No se pudo iniciar Chrome (${ejecutable}): ${error.message}. ` +
      "Indique la ruta del ejecutable en la variable de entorno CHROME_BIN."
    );
  });

  const archivoPuerto = join(perfil, "DevToolsActivePort");
  const limite = Date.now() + ARRANQUE_CHROME_MS;
  while (Date.now() < limite) {
    if (falloArranque) throw falloArranque;
    if (proceso.exitCode !== null) throw new Error(`Chrome terminó al iniciar (código ${proceso.exitCode}).`);
    if (existsSync(archivoPuerto)) {
      const [puerto, ruta] = (await readFile(archivoPuerto, "utf8")).trim().split(/\r?\n/);
      if (puerto && ruta) return { proceso, urlNavegador: `ws://127.0.0.1:${puerto}${ruta}` };
    }
    await esperarMs(50); // solo durante el arranque de Chrome
  }
  throw new Error("Chrome no publicó DevToolsActivePort a tiempo.");
}

// ---------- Cliente WebSocket mínimo (RFC 6455) ----------
// Node 20 no incluye WebSocket global sin flags experimentales; CDP solo necesita mensajes de texto.

function conectarWebSocket(url, alRecibir) {
  const { hostname, port, pathname } = new URL(url);
  return new Promise((resolver, rechazar) => {
    const peticion = request({
      host: hostname,
      port,
      path: pathname,
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Key": randomBytes(16).toString("base64"),
        "Sec-WebSocket-Version": "13"
      }
    });
    peticion.once("error", rechazar);
    peticion.once("response", respuesta => rechazar(new Error(`CDP rechazó el WebSocket: HTTP ${respuesta.statusCode}`)));
    peticion.once("upgrade", (_respuesta, socket, inicio) => {
      let pendiente = inicio;
      let fragmentos = [];

      const enviarTrama = (opcode, datos) => {
        const mascara = randomBytes(4);
        const largo = datos.length;
        const cabecera = largo < 126 ? Buffer.alloc(2) : largo < 65536 ? Buffer.alloc(4) : Buffer.alloc(10);
        cabecera[0] = 0x80 | opcode;
        if (largo < 126) {
          cabecera[1] = 0x80 | largo;
        } else if (largo < 65536) {
          cabecera[1] = 0x80 | 126;
          cabecera.writeUInt16BE(largo, 2);
        } else {
          cabecera[1] = 0x80 | 127;
          cabecera.writeBigUInt64BE(BigInt(largo), 2);
        }
        const enmascarado = Buffer.from(datos.map((byte, i) => byte ^ mascara[i % 4]));
        socket.write(Buffer.concat([cabecera, mascara, enmascarado]));
      };

      socket.on("data", trozo => {
        pendiente = Buffer.concat([pendiente, trozo]);
        while (pendiente.length >= 2) {
          const fin = (pendiente[0] & 0x80) !== 0;
          const opcode = pendiente[0] & 0x0f;
          let largo = pendiente[1] & 0x7f;
          let desplazamiento = 2;
          if (largo === 126) {
            if (pendiente.length < 4) return;
            largo = pendiente.readUInt16BE(2);
            desplazamiento = 4;
          } else if (largo === 127) {
            if (pendiente.length < 10) return;
            largo = Number(pendiente.readBigUInt64BE(2));
            desplazamiento = 10;
          }
          if (pendiente.length < desplazamiento + largo) return;
          const datos = pendiente.subarray(desplazamiento, desplazamiento + largo);
          pendiente = pendiente.subarray(desplazamiento + largo);

          if (opcode === 0x8) { socket.end(); return; }           // cierre
          if (opcode === 0x9) { enviarTrama(0xa, datos); continue; } // ping → pong
          if (opcode === 0x1 || opcode === 0x0) {                  // texto o continuación
            fragmentos.push(Buffer.from(datos));
            if (fin) {
              alRecibir(Buffer.concat(fragmentos).toString("utf8"));
              fragmentos = [];
            }
          }
        }
      });

      resolver({
        socket,
        enviar: texto => enviarTrama(0x1, Buffer.from(texto, "utf8")),
        cerrar: () => socket.destroy()
      });
    });
    peticion.end();
  });
}

// ---------- Cliente CDP ----------

async function conectarCDP(urlNavegador) {
  let siguienteId = 0;
  const pendientes = new Map();
  const conexion = await conectarWebSocket(urlNavegador, texto => {
    const mensaje = JSON.parse(texto);
    if (mensaje.id === undefined || !pendientes.has(mensaje.id)) return; // eventos: no se usan
    const { resolver, rechazar, metodo } = pendientes.get(mensaje.id);
    pendientes.delete(mensaje.id);
    if (mensaje.error) rechazar(new Error(`${metodo}: ${mensaje.error.message}`));
    else resolver(mensaje.result);
  });
  conexion.socket.once("close", () => {
    for (const { rechazar, metodo } of pendientes.values()) rechazar(new Error(`${metodo}: conexión CDP cerrada`));
    pendientes.clear();
  });
  return {
    enviar(metodo, params = {}, sessionId) {
      const id = ++siguienteId;
      return new Promise((resolver, rechazar) => {
        pendientes.set(id, { resolver, rechazar, metodo });
        conexion.enviar(JSON.stringify({ id, method: metodo, params, sessionId }));
      });
    },
    cerrar: conexion.cerrar
  };
}

// ---------- Pruebas ----------

describe("Módulo 06 - Conversor Celsius ↔ Fahrenheit", () => {
  let perfil;
  let chrome;
  let cdp;
  let sesion;

  const pagina = (metodo, params) => cdp.enviar(metodo, params, sesion);

  // Ejecuta la función en la página con los argumentos indicados (serializados como JSON).
  async function enPagina(funcion, ...argumentos) {
    const { result, exceptionDetails } = await pagina("Runtime.evaluate", {
      expression: `(${funcion})(...${JSON.stringify(argumentos)})`,
      returnByValue: true,
      awaitPromise: true
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
    }
    return result.value;
  }

  // Sondea el DOM hasta que la condición se cumpla (sin esperas fijas).
  async function esperar(descripcion, funcion, ...argumentos) {
    const limite = Date.now() + ESPERA_MS;
    let ultimoError;
    while (Date.now() < limite) {
      try {
        if (await enPagina(funcion, ...argumentos)) return;
      } catch (error) {
        ultimoError = error; // p. ej. contexto destruido durante una navegación
      }
      await esperarMs(INTERVALO_SONDEO_MS);
    }
    throw new Error(`Tiempo agotado esperando: ${descripcion}${ultimoError ? ` (${ultimoError.message})` : ""}`);
  }

  // Funciones que se ejecutan dentro de la página.
  const texto = id => enPagina(i => document.getElementById(i).innerText.trim(), id);
  const valor = id => enPagina(i => document.getElementById(i).value, id);
  const atributo = (id, nombre) => enPagina((i, n) => document.getElementById(i).getAttribute(n), id, nombre);
  const habilitado = id => enPagina(i => !document.getElementById(i).disabled, id);
  const visible = id => enPagina(i => {
    const elemento = document.getElementById(i);
    return !!elemento && getComputedStyle(elemento).display !== "none" && elemento.getClientRects().length > 0;
  }, id);
  const filasHistorial = () => enPagina(() => [...document.querySelectorAll("#historial-06 li")].map(li => li.innerText));

  async function esperarTexto(id, esperado) {
    await esperar(`#${id} con el texto "${esperado}"`, (i, t) => document.getElementById(i)?.innerText.trim() === t, id, esperado);
  }

  async function esperarVisibilidad(id, esVisible) {
    await esperar(`#${id} ${esVisible ? "visible" : "oculto"}`, (i, v) => {
      const elemento = document.getElementById(i);
      return (getComputedStyle(elemento).display !== "none" && elemento.getClientRects().length > 0) === v;
    }, id, esVisible);
  }

  async function esperarFilasHistorial(cantidad) {
    await esperar(`${cantidad} filas en el historial`, n => document.querySelectorAll("#historial-06 li").length === n, cantidad);
  }

  // Carga una página nueva para que cada prueba empiece sin historial ni sentido invertido.
  async function abrirModulo() {
    // Marca el documento actual para no confundirlo con el nuevo mientras se navega.
    await enPagina(() => { document.__prueba06Anterior = true; });
    await pagina("Page.navigate", { url: URL_MODULO });
    // modulo.js reescribe la ayuda al iniciar (con "-" en lugar del "−" del HTML):
    // si este texto aparece en el documento nuevo, el script del módulo se ejecutó.
    await esperar("carga del módulo", () =>
      !document.__prueba06Anterior &&
      document.readyState === "complete" &&
      document.getElementById("ayuda-06")?.innerText.trim() === "Acepta punto o coma decimal. Mínimo: -273.15 °C."
    );
  }

  // Clic real del ratón en el centro del elemento, comprobando que no esté tapado.
  async function clic(selector) {
    const punto = await enPagina(s => {
      const elemento = document.querySelector(s);
      if (!elemento) throw new Error(`No existe ${s}`);
      // Desplazamiento instantáneo: el CSS global usa scroll-behavior: smooth y, con la animación,
      // las coordenadas se calcularían antes de que el elemento llegue a su posición final.
      elemento.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
      const caja = elemento.getBoundingClientRect();
      const x = caja.left + caja.width / 2;
      const y = caja.top + caja.height / 2;
      const enPunto = document.elementFromPoint(x, y);
      if (!elemento.contains(enPunto)) throw new Error(`${s} está tapado por otro elemento`);
      return { x, y };
    }, selector);
    for (const type of ["mousePressed", "mouseReleased"]) {
      await pagina("Input.dispatchMouseEvent", { type, ...punto, button: "left", clickCount: 1 });
    }
  }

  // Escribe como un teclado real (keydown → beforeinput → input), así se ejercita el filtro del campo.
  async function escribir(textoAEscribir) {
    await enPagina(() => {
      const campo = document.getElementById("entrada-06");
      campo.focus();
      campo.setSelectionRange(campo.value.length, campo.value.length);
    });
    for (const caracter of textoAEscribir) {
      await pagina("Input.dispatchKeyEvent", { type: "keyDown", key: caracter, text: caracter, unmodifiedText: caracter });
      await pagina("Input.dispatchKeyEvent", { type: "keyUp", key: caracter });
    }
  }

  async function pulsarEnter() {
    const tecla = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await pagina("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", unmodifiedText: "\r", ...tecla });
    await pagina("Input.dispatchKeyEvent", { type: "keyUp", ...tecla });
  }

  const convertir = () => clic("#btn-convertir-06");
  const invertir = () => clic("#btn-invertir-06");
  const limpiar = () => clic("#btn-limpiar-06");

  // Espera a que el resultado deje de ser "—" y lo devuelve como número.
  async function leerResultadoNumerico() {
    await esperar("un resultado numérico", () => document.getElementById("salida-06").innerText.trim() !== "—");
    return Number(await texto("salida-06"));
  }

  function assertCercano(actual, esperado) {
    assert.ok(
      Math.abs(actual - esperado) <= TOLERANCIA,
      `Se esperaba ${esperado} ± ${TOLERANCIA} y se obtuvo ${actual}`
    );
  }

  async function esperarError(mensaje) {
    await esperarVisibilidad("error-06", true);
    assert.equal(await texto("error-06"), mensaje);
    assert.equal(await atributo("entrada-06", "aria-invalid"), "true");
    assert.equal(await texto("salida-06"), "—");
  }

  async function cerrarChrome() {
    try {
      await cdp?.enviar("Browser.close");
    } catch {
      // Chrome pudo cerrarse antes de responder.
    }
    cdp?.cerrar();
    if (chrome && chrome.proceso.exitCode === null) {
      const salida = once(chrome.proceso, "exit");
      const limite = esperarMs(5000).then(() => chrome.proceso.kill());
      await Promise.race([salida, limite]);
    }
    if (perfil) await rm(perfil, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  }

  before(async () => {
    perfil = await mkdtemp(join(tmpdir(), "test06-chrome-"));
    try {
      chrome = await iniciarChrome(perfil);
      cdp = await conectarCDP(chrome.urlNavegador);
      const { targetId } = await cdp.enviar("Target.createTarget", { url: "about:blank" });
      ({ sessionId: sesion } = await cdp.enviar("Target.attachToTarget", { targetId, flatten: true }));
      await pagina("Emulation.setDeviceMetricsOverride", PANTALLA_ESCRITORIO);
    } catch (error) {
      await cerrarChrome();
      throw error;
    }
  });

  after(cerrarChrome);

  beforeEach(abrirModulo);

  it("carga el módulo con su estado inicial", async () => {
    assert.equal(await enPagina(() => document.title), "Módulo 06 - Conversor");
    assert.ok(await visible("form-conversor-06"));
    assert.equal(await texto("sentido-06"), "Celsius → Fahrenheit");
    assert.equal(await texto("simbolo-entrada-06"), "°C");
    assert.equal(await texto("simbolo-salida-06"), "°F");
    assert.equal(await valor("entrada-06"), "");
    assert.equal(await texto("salida-06"), "—");
    assert.equal(await visible("error-06"), false);
    assert.ok(await visible("historial-vacio-06"));
    assert.equal(await habilitado("btn-borrar-historial-06"), false);
  });

  describe("Conversión", () => {
    it("convierte 100 °C en 212 °F al pulsar Convertir", async () => {
      await escribir("100");
      await convertir();
      await esperarTexto("salida-06", "212");
      assert.equal(await texto("resultado-06"), "100 °C = 212 °F");
    });

    it("convierte 36,6 °C (coma decimal) en 97.88 °F", async () => {
      await escribir("36,6");
      await convertir();
      assertCercano(await leerResultadoNumerico(), (36.6 * 9) / 5 + 32);
    });

    it("convierte Fahrenheit → Celsius tras invertir el sentido", async () => {
      await invertir();
      await esperarTexto("sentido-06", "Fahrenheit → Celsius");
      await escribir("98.6");
      await convertir();
      await esperarTexto("salida-06", "37");
      assert.equal(await texto("resultado-06"), "98.6 °F = 37 °C");
    });

    it("-40 es la misma temperatura en ambas escalas", async () => {
      await escribir("-40");
      await convertir();
      await esperarTexto("salida-06", "-40");
    });

    it("convierte en tiempo real mientras se escribe, sin registrar historial", async () => {
      await escribir("0");
      await esperarTexto("salida-06", "32");
      assert.equal((await filasHistorial()).length, 0);
      assert.ok(await visible("historial-vacio-06"));
    });

    it("convierte al pulsar Enter en el campo", async () => {
      await escribir("25");
      await pulsarEnter();
      await esperarTexto("salida-06", "77");
      await esperarFilasHistorial(1);
    });
  });

  describe("Invertir sentido", () => {
    it("cambia fórmula y unidades y recalcula el valor escrito", async () => {
      await escribir("100");
      await esperarTexto("salida-06", "212");

      await invertir();
      await esperarTexto("sentido-06", "Fahrenheit → Celsius");
      assert.equal(await texto("formula-06"), "°C = (°F − 32) × 5/9");
      assert.equal(await texto("simbolo-entrada-06"), "°F");
      assert.equal(await texto("simbolo-salida-06"), "°C");
      assert.equal(await valor("entrada-06"), "100");
      assertCercano(await leerResultadoNumerico(), ((100 - 32) * 5) / 9);

      await invertir();
      await esperarTexto("sentido-06", "Celsius → Fahrenheit");
      await esperarTexto("salida-06", "212");
      // Invertir recalcula como en tiempo real: no registra conversiones.
      assert.equal((await filasHistorial()).length, 0);
    });
  });

  describe("Validaciones", () => {
    it("muestra un error si se convierte con el campo vacío", async () => {
      await convertir();
      await esperarError(MENSAJES.vacio);
      assert.equal((await filasHistorial()).length, 0);
    });

    it("bloquea caracteres no numéricos al escribir", async () => {
      await escribir("abc");
      assert.equal(await valor("entrada-06"), "");
      await escribir("1x2");
      assert.equal(await valor("entrada-06"), "12");
    });

    it("rechaza la notación científica incompleta", async () => {
      await escribir("1e");
      await convertir();
      await esperarError(MENSAJES.exponenteIncompleto);
    });

    it("oculta el error cuando se corrige la entrada", async () => {
      await convertir();
      await esperarError(MENSAJES.vacio);
      await escribir("10");
      await esperarVisibilidad("error-06", false);
      await esperarTexto("salida-06", "50");
      assert.equal(await atributo("entrada-06", "aria-invalid"), null);
    });
  });

  describe("Límite del cero absoluto", () => {
    it("acepta exactamente -273.15 °C y lo convierte en -459.67 °F", async () => {
      await escribir("-273.15");
      await convertir();
      await esperarTexto("salida-06", "-459.67");
      assert.equal(await visible("error-06"), false);
    });

    it("rechaza temperaturas por debajo de -273.15 °C", async () => {
      await escribir("-273.16");
      await convertir();
      await esperarError(MENSAJES.bajoCeroAbsolutoC);
    });

    it("rechaza temperaturas por debajo de -459.67 °F en sentido inverso", async () => {
      await invertir();
      await esperarTexto("sentido-06", "Fahrenheit → Celsius");
      await escribir("-459.68");
      await convertir();
      await esperarError(MENSAJES.bajoCeroAbsolutoF);
    });
  });

  describe("Conversiones rápidas e indicador", () => {
    it("convierte 37 °C con un clic y actualiza el indicador y el historial", async () => {
      await clic('#rapidas-06 button[data-celsius="37"]');
      await esperarTexto("salida-06", "98.6");
      assert.equal(await valor("entrada-06"), "37");
      assert.equal(await atributo("termometro-06", "aria-label"), "Indicador de temperatura: templado");
      await esperarFilasHistorial(1);
      assert.match((await filasHistorial())[0], /37 °C → 98\.6 °F/);
    });
  });

  describe("Historial", () => {
    it("no repite la misma conversión confirmada dos veces seguidas", async () => {
      await escribir("100");
      await convertir();
      await convertir();
      await esperarFilasHistorial(1);
      assert.equal(await habilitado("btn-borrar-historial-06"), true);
    });

    it("conserva solo las 5 conversiones más recientes", async () => {
      for (const temperatura of ["1", "2", "3", "4", "5", "6"]) {
        await limpiar();
        await escribir(temperatura);
        await convertir();
      }
      await esperarFilasHistorial(5);
      const filas = await filasHistorial();
      assert.match(filas[0], /6 °C → 42\.8 °F/);
      assert.match(filas[4], /2 °C → 35\.6 °F/);
    });

    it("Borrar vacía el historial y se deshabilita", async () => {
      await escribir("100");
      await convertir();
      await esperarFilasHistorial(1);

      await clic("#btn-borrar-historial-06");
      await esperarFilasHistorial(0);
      assert.ok(await visible("historial-vacio-06"));
      assert.equal(await habilitado("btn-borrar-historial-06"), false);
    });
  });

  describe("Limpiar", () => {
    it("vacía entrada, resultado y error, pero conserva el historial", async () => {
      await escribir("100");
      await convertir();
      await esperarFilasHistorial(1);

      await limpiar();
      await esperarTexto("salida-06", "—");
      assert.equal(await valor("entrada-06"), "");
      assert.equal(await texto("resultado-06"), "");
      assert.equal(await visible("error-06"), false);
      assert.equal((await filasHistorial()).length, 1);
    });
  });

  describe("Accesibilidad", () => {
    it("asocia etiqueta, ayuda y error al campo y anuncia los cambios", async () => {
      assert.equal(await enPagina(() => document.querySelector('label[for="entrada-06"]') !== null), true);
      assert.deepEqual((await atributo("entrada-06", "aria-describedby")).split(/\s+/), ["ayuda-06", "error-06"]);
      assert.equal(await atributo("error-06", "role"), "alert");
      assert.equal(await atributo("resultado-06", "aria-live"), "polite");
      assert.equal(await atributo("btn-invertir-06", "aria-label"), "Invertir sentido de la conversión");
    });

    it("el indicador anuncia la categoría y vuelve a su estado inicial al limpiar", async () => {
      assert.equal(await atributo("termometro-06", "aria-label"), "Indicador de temperatura: sin conversión");
      await escribir("100");
      await convertir();
      await esperarTexto("salida-06", "212");
      assert.equal(await atributo("termometro-06", "aria-label"), "Indicador de temperatura: cálido");

      await limpiar();
      await esperarTexto("salida-06", "—");
      assert.equal(await atributo("termometro-06", "aria-label"), "Indicador de temperatura: sin conversión");
    });
  });

  describe("Pantalla móvil (390 px)", () => {
    beforeEach(async () => {
      await pagina("Emulation.setDeviceMetricsOverride", PANTALLA_MOVIL);
      await abrirModulo();
    });

    afterEach(async () => {
      await pagina("Emulation.setDeviceMetricsOverride", PANTALLA_ESCRITORIO);
    });

    it("convierte e invierte sin desplazamiento horizontal", async () => {
      await escribir("20");
      await esperarTexto("salida-06", "68");
      await invertir();
      await esperarTexto("sentido-06", "Fahrenheit → Celsius");
      assertCercano(await leerResultadoNumerico(), ((20 - 32) * 5) / 9);
      assert.ok(
        await enPagina(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        "La página no debe desplazarse horizontalmente en móvil"
      );
    });
  });
});
