// Prueba automatizada del módulo 12 (Encuesta con 4 tipos de pregunta).
// Los 5 casos documentados en modules/12-encuesta/README.md (CP-01 a CP-05).
// Requisitos: Node.js 18+ y Google Chrome. No requiere npm install.
// Ejecutar desde la raíz del proyecto: node --test tests/test_12_encuesta.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const pausa = (ms) => new Promise((espera) => setTimeout(espera, ms));

const chromeBinario = (() => {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;

  const candidatos = process.platform === "win32"
    ? [
        join(process.env.PROGRAMFILES || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
        join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
        join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe")
      ]
    : ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"];

  return candidatos.find((ruta) => existsSync(ruta)) || candidatos[0];
})();

const MENSAJE_BLOQUEO = 'Tu respuesta ya fue registrada. Usa "Votar otra vez" para continuar.';

test("encuesta 12: los 4 tipos de pregunta, validaciones y resultados", async (t) => {
  const perfil = await mkdtemp(join(tmpdir(), "encuesta-12-"));
  const pagina = pathToFileURL(resolve("modules/12-encuesta/index.html")).href;
  const chrome = spawn(chromeBinario, [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-extensions",
    "--remote-allow-origins=*",
    "--remote-debugging-port=0",
    `--user-data-dir=${perfil}`,
    pagina
  ], { stdio: "ignore" });

  let errorInicio = "";
  chrome.on("error", (error) => { errorInicio = error.message; });

  let socket;
  t.after(async () => {
    try { socket?.close(); } catch { /* el socket ya se cerró */ }
    if (chrome.exitCode === null) chrome.kill();
    await rm(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  let destino;
  for (let intento = 0; intento < 150; intento += 1) {
    if (errorInicio) {
      throw new Error(`No se pudo iniciar Chrome (${chromeBinario}): ${errorInicio}. Define CHROME_BIN con la ruta correcta.`);
    }
    if (chrome.exitCode !== null) {
      throw new Error(`Chrome terminó antes de iniciar la prueba (${chromeBinario}).`);
    }
    try {
      const [puerto] = (await readFile(join(perfil, "DevToolsActivePort"), "utf8")).split("\n");
      const paginas = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
      destino = paginas.find((paginaAbierta) => paginaAbierta.type === "page" && paginaAbierta.url === pagina)
        || paginas.find((paginaAbierta) => paginaAbierta.type === "page" && paginaAbierta.url.startsWith("file:"));
      if (destino) break;
    } catch { /* Chrome todavía está iniciando */ }
    await pausa(100);
  }
  assert.ok(destino, "Chrome debe abrir el módulo 12 de encuesta.");

  socket = new WebSocket(destino.webSocketDebuggerUrl);
  await new Promise((resolver, rechazar) => {
    socket.addEventListener("open", resolver, { once: true });
    socket.addEventListener("error", () => rechazar(new Error("No se pudo conectar a Chrome.")), { once: true });
  });

  let siguienteId = 0;
  const pendientes = new Map();

  socket.addEventListener("message", (evento) => {
    const mensaje = JSON.parse(evento.data);
    const espera = pendientes.get(mensaje.id);
    if (!espera) return;
    pendientes.delete(mensaje.id);
    clearTimeout(espera.reloj);
    if (mensaje.error) espera.rechazar(new Error(mensaje.error.message));
    else espera.resolver(mensaje.result);
  });

  const enviar = (metodo, params = {}) => new Promise((resolver, rechazar) => {
    const id = ++siguienteId;
    const reloj = setTimeout(() => {
      pendientes.delete(id);
      rechazar(new Error(`Chrome no respondió a ${metodo}.`));
    }, 15000);

    pendientes.set(id, {
      resolver: (valor) => { clearTimeout(reloj); resolver(valor); },
      rechazar: (error) => { clearTimeout(reloj); rechazar(error); }
    });
    socket.send(JSON.stringify({ id, method: metodo, params }));
  });

  await enviar("Page.enable");
  await enviar("Runtime.enable");

  const evaluar = async (expresion) => {
    const respuesta = await enviar("Runtime.evaluate", {
      expression: expresion,
      returnByValue: true,
      awaitPromise: true
    });
    if (respuesta.exceptionDetails) {
      throw new Error(respuesta.exceptionDetails.exception?.description || respuesta.exceptionDetails.text || "Error al evaluar la página.");
    }
    return respuesta.result.value;
  };

  let lista = false;
  for (let intento = 0; intento < 100; intento += 1) {
    lista = await evaluar('document.readyState === "complete" && document.getElementById("app-12") !== null');
    if (lista) break;
    await pausa(50);
  }
  assert.equal(lista, true, "La página debe cargar el formulario de la encuesta.");

  const estado = () => evaluar(`(() => {
    const leerBloque = (pregunta) => {
      const bloque = document.querySelector('[data-result="' + pregunta + '"]');
      if (!bloque) return {};
      return Object.fromEntries([...bloque.querySelectorAll("[data-option]")].map((fila) => [
        fila.dataset.option,
        { votos: Number(fila.dataset.votes), porcentaje: Number(fila.dataset.percent) }
      ]));
    };
    const marcados = (nombre) => [...document.querySelectorAll('input[name="' + nombre + '"]:checked')].map((item) => item.value);
    return {
      q1: leerBloque("q1"),
      q2: leerBloque("q2"),
      q3: leerBloque("q3"),
      promedio: document.getElementById("promedio-12").dataset.average,
      escalaTotal: Number(document.getElementById("escala-total-12").dataset.scaleRecords),
      textos: Number(document.getElementById("comentarios-12").dataset.answers),
      listaTextos: [...document.querySelectorAll("#lista-comentarios-12 .encuesta-answer")].map((item) => item.textContent),
      sinTextosVisible: !document.getElementById("sin-comentarios-12").hidden,
      registros: Number(document.getElementById("resultados-12").dataset.records),
      seleccionQ1: marcados("q1-12"),
      seleccionQ2: marcados("q2-12"),
      seleccionQ3: marcados("q3-12"),
      comentario: document.getElementById("comentario-12").value,
      contador: document.getElementById("contador-12").textContent,
      resultadosVisibles: !document.getElementById("resultados-12").hidden,
      enviarActivo: !document.getElementById("enviar-12").disabled,
      nuevoVotoActivo: !document.getElementById("nuevo-voto-12").disabled,
      mensaje: document.getElementById("resultado-12").textContent.trim()
    };
  })()`);

  const accionar = (id) => evaluar(`(() => {
    const elemento = document.getElementById("${id}");
    if (!elemento) return false;
    elemento.click();
    return true;
  })()`);

  const marcar = (nombre, valor) => evaluar(`(() => {
    const control = document.querySelector('input[name="${nombre}"][value="${valor}"]');
    if (!control) return false;
    control.click();
    return control.checked;
  })()`);

  const escribirTexto = (texto) => evaluar(`(() => {
    const campo = document.getElementById("comentario-12");
    campo.value = ${JSON.stringify(texto)};
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    return campo.value.length;
  })()`);

  const dispararSubmit = () => evaluar(
    'document.getElementById("encuesta-form-12").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))'
  );

  const borrarMensaje = () => evaluar('document.getElementById("resultado-12").textContent = ""');

  const preparar = async () => {
    await accionar("reiniciar-12");
    await borrarMensaje();
  };

  const llenarCompleto = async () => {
    await marcar("q1-12", "notas");
    await marcar("q1-12", "calendario");
    await marcar("q2-12", "correo");
    await marcar("q3-12", "4");
    await escribirTexto("Excelente portal");
  };

  const tabla = [];
  const registrar = (id, caso, esperado, obtenido) => {
    tabla.push({ id, caso, esperado, obtenido, estado: "PASS" });
    console.log(`${id} | ${caso} | Esperado: ${esperado} | Obtenido: ${obtenido} | PASS`);
  };

  await t.test("CP-01: envío incompleto", async () => {
    await preparar();
    await marcar("q1-12", "notas");
    await accionar("enviar-12");

    const actual = await estado();
    assert.equal(actual.mensaje, "Selecciona una opción en la pregunta de opción única.", "Debe validar primero la opción única.");
    assert.equal(actual.registros, 0, "No debe registrar la respuesta incompleta.");
    assert.equal(actual.resultadosVisibles, false, "Los resultados no deben mostrarse.");
    assert.equal(actual.enviarActivo, true, "El formulario debe seguir habilitado tras el error.");
    registrar("CP-01", "Envío incompleto", "Validación y 0 registros", `${actual.mensaje} / ${actual.registros} registros`);
  });

  await t.test("CP-02: respuesta válida completa (4 tipos)", async () => {
    await preparar();
    await llenarCompleto();
    await accionar("enviar-12");

    const actual = await estado();
    assert.equal(actual.mensaje, "Respuesta registrada (1 respuesta).");
    assert.equal(actual.registros, 1, "Debe registrar una respuesta.");

    assert.equal(actual.q1.notas.votos, 1, "Notas debe tener 1 voto.");
    assert.equal(actual.q1.calendario.votos, 1, "Calendario debe tener 1 voto.");
    assert.equal(actual.q1.biblioteca.votos, 0, "Biblioteca debe quedar en cero.");
    assert.equal(actual.q1.notas.porcentaje, 100, "Notas debe marcar 100% (la única respuesta lo incluye).");
    assert.equal(actual.q1.calendario.porcentaje, 100, "Calendario debe marcar 100% (la única respuesta lo incluye).");

    assert.equal(actual.q2.correo.votos, 1, "Correo debe tener 1 voto.");
    assert.equal(actual.q2.correo.porcentaje, 100, "Correo debe marcar 100%.");
    assert.equal(actual.q2.portal.votos, 0, "Portal debe quedar en cero.");

    assert.equal(actual.q3["4"].votos, 1, "La escala 4 debe tener 1 voto.");
    assert.equal(actual.promedio, "4.0", "El promedio debe ser 4.0.");
    assert.equal(actual.escalaTotal, 1, "La escala debe contar 1 respuesta.");

    assert.equal(actual.textos, 1, "Debe contar 1 texto libre.");
    assert.deepEqual(actual.listaTextos, ["Excelente portal"], "La lista debe contener el texto enviado.");
    assert.equal(actual.sinTextosVisible, false, "El aviso de lista vacía debe ocultarse.");
    assert.equal(actual.contador, "16/200", "El contador de caracteres debe actualizarse.");

    assert.equal(actual.resultadosVisibles, true, "Los resultados deben mostrarse.");
    assert.equal(actual.enviarActivo, false, "El formulario debe bloquearse tras registrar.");
    assert.equal(actual.nuevoVotoActivo, true, "Debe habilitarse Votar otra vez.");
    assert.doesNotMatch(JSON.stringify(actual), /NaN|Infinity/, "No debe aparecer NaN ni Infinity.");

    registrar("CP-02", "Respuesta válida completa", "1 registro, promedio 4.0, 1 texto", `${actual.registros} registro / promedio ${actual.promedio} / ${actual.textos} texto`);
  });

  await t.test("CP-03: acumular tres respuestas", async () => {
    await preparar();

    await marcar("q1-12", "notas");
    await marcar("q2-12", "portal");
    await marcar("q3-12", "5");
    await escribirTexto("Muy bueno");
    await accionar("enviar-12");

    await accionar("nuevo-voto-12");
    await marcar("q1-12", "notas");
    await marcar("q1-12", "eventos");
    await marcar("q2-12", "portal");
    await marcar("q3-12", "3");
    await escribirTexto("   ");
    await accionar("enviar-12");

    await accionar("nuevo-voto-12");
    await marcar("q1-12", "biblioteca");
    await marcar("q2-12", "sms");
    await marcar("q3-12", "4");
    await escribirTexto("Falta la sección de becas");
    await accionar("enviar-12");

    const actual = await estado();
    assert.equal(actual.registros, 3, "Debe acumular tres registros.");
    assert.equal(actual.q1.notas.votos, 2, "Notas debe acumular 2 votos.");
    assert.equal(actual.q1.notas.porcentaje, 67, "Notas debe marcar 67% (2 de 3 respuestas).");
    assert.equal(actual.q1.eventos.votos, 1, "Eventos debe acumular 1 voto.");
    assert.equal(actual.q1.eventos.porcentaje, 33, "Eventos debe marcar 33% (1 de 3 respuestas).");
    assert.equal(actual.q2.portal.votos, 2, "Portal debe acumular 2 votos.");
    assert.equal(actual.q2.sms.votos, 1, "SMS debe acumular 1 voto.");
    assert.equal(actual.promedio, "4.0", "El promedio de 5, 3 y 4 debe ser 4.0.");
    assert.equal(actual.escalaTotal, 3, "La escala debe contar 3 respuestas.");
    assert.equal(actual.textos, 2, "Los textos en blanco no deben contarse.");
    assert.deepEqual(actual.listaTextos, ["Muy bueno", "Falta la sección de becas"], "La lista solo debe tener los textos con contenido.");
    assert.equal(actual.enviarActivo, false, "El formulario debe quedar bloqueado tras el último envío.");
    assert.doesNotMatch(JSON.stringify(actual), /NaN|Infinity/, "No debe aparecer NaN ni Infinity.");

    registrar("CP-03", "Tres respuestas acumuladas", "3 registros, promedio 4.0, 2 textos", `${actual.registros} registros / promedio ${actual.promedio} / ${actual.textos} textos`);
  });

  await t.test("CP-04: doble envío no duplica el registro", async () => {
    await preparar();
    await marcar("q1-12", "eventos");
    await marcar("q2-12", "sms");
    await marcar("q3-12", "2");
    await accionar("enviar-12");
    await accionar("enviar-12");
    await dispararSubmit();

    const actual = await estado();
    assert.equal(actual.registros, 1, "El segundo envío no debe duplicar el registro.");
    assert.equal(actual.q1.eventos.votos, 1, "El conteo de la opción múltiple debe permanecer en 1.");
    assert.equal(actual.enviarActivo, false, "El botón registrar debe quedar bloqueado.");
    assert.equal(actual.mensaje, MENSAJE_BLOQUEO, "Debe informar que la respuesta ya fue registrada.");

    registrar("CP-04", "Doble envío", "1 registro y bloqueo", `${actual.registros} registro / ${actual.mensaje}`);
  });

  await t.test("CP-05: reiniciar la encuesta", async () => {
    await preparar();
    await llenarCompleto();
    await accionar("enviar-12");

    const conVoto = await estado();
    assert.equal(conVoto.registros, 1, "Debe registrar la respuesta previa al reinicio.");
    assert.equal(conVoto.resultadosVisibles, true, "Los resultados deben estar visibles antes de reiniciar.");

    await accionar("reiniciar-12");

    const limpio = await estado();
    assert.equal(limpio.registros, 0, "El reinicio debe dejar los registros en cero.");
    assert.equal(limpio.q1.notas.votos, 0, "Las barras de la opción múltiple deben reiniciarse.");
    assert.equal(limpio.q2.correo.votos, 0, "Las barras de la opción única deben reiniciarse.");
    assert.equal(limpio.q3["4"].votos, 0, "Las barras de la escala deben reiniciarse.");
    assert.equal(limpio.promedio, "", "El promedio debe quedar vacío.");
    assert.equal(limpio.escalaTotal, 0, "El total de la escala debe ser 0.");
    assert.equal(limpio.textos, 0, "La lista de textos debe quedar vacía.");
    assert.equal(limpio.sinTextosVisible, true, "Debe mostrarse el aviso de lista vacía.");
    assert.equal(limpio.seleccionQ1.length + limpio.seleccionQ2.length + limpio.seleccionQ3.length, 0, "Debe limpiar todas las selecciones.");
    assert.equal(limpio.comentario, "", "Debe limpiar el texto libre.");
    assert.equal(limpio.contador, "0/200", "El contador de caracteres debe volver a cero.");
    assert.equal(limpio.resultadosVisibles, false, "El reinicio debe ocultar los resultados.");
    assert.equal(limpio.enviarActivo, true, "El reinicio debe habilitar el formulario.");
    assert.equal(limpio.nuevoVotoActivo, false, "Votar otra vez debe deshabilitarse.");
    assert.equal(limpio.mensaje, "Encuesta reiniciada. Ya puedes registrar otra respuesta.");

    registrar("CP-05", "Reiniciar encuesta", "0 registros y todo limpio", `${limpio.registros} registros / promedio "${limpio.promedio}" / ${limpio.textos} textos`);
  });

  await t.test("Diseño adaptable sin scroll horizontal", async () => {
    await preparar();
    await llenarCompleto();
    await accionar("enviar-12");

    for (const ancho of [320, 768, 1024]) {
      await enviar("Emulation.setDeviceMetricsOverride", {
        width: ancho,
        height: 812,
        deviceScaleFactor: 1,
        mobile: ancho < 700
      });

      const layout = await evaluar(`(() => {
        const app = document.getElementById("app-12");
        const botones = [...app.querySelectorAll("button")];
        const campos = [...app.querySelectorAll("input, textarea")];
        return {
          pageWidth: document.documentElement.scrollWidth,
          visibleWidth: document.documentElement.clientWidth,
          botonesCaben: botones.every((boton) => {
            const caja = boton.getBoundingClientRect();
            const limite = app.getBoundingClientRect();
            return caja.left >= limite.left - 1 && caja.right <= limite.right + 1;
          }),
          camposCaben: campos.every((campo) => {
            const caja = campo.getBoundingClientRect();
            const limite = app.getBoundingClientRect();
            return caja.left >= limite.left - 1 && caja.right <= limite.right + 1;
          }),
          minimaAltura: Math.min(...botones.map((boton) => boton.getBoundingClientRect().height)),
          registros: document.getElementById("resultados-12").dataset.records
        };
      })()`);

      assert.equal(layout.pageWidth, layout.visibleWidth, `No debe haber scroll horizontal a ${ancho}px.`);
      assert.equal(layout.botonesCaben, true, `Los botones deben caber a ${ancho}px.`);
      assert.equal(layout.camposCaben, true, `Los campos deben caber a ${ancho}px.`);
      assert.ok(layout.minimaAltura >= 48, `Los botones deben conservar la altura táctil a ${ancho}px.`);
      assert.equal(layout.registros, "1", `El resultado debe mantenerse a ${ancho}px.`);
    }

    await enviar("Emulation.clearDeviceMetricsOverride");
    console.log("Diseño adaptable 320px / 768px / 1024px: sin scroll horizontal, controles visibles y con altura táctil | PASS");
  });

  console.log("\nResumen de casos de prueba del módulo 12 (Encuesta con 4 tipos):");
  console.log("ID | Caso | Esperado | Obtenido | Estado");
  console.log("-- | ---- | -------- | -------- | ------");
  for (const fila of tabla) {
    console.log(`${fila.id} | ${fila.caso} | ${fila.esperado} | ${fila.obtenido} | ${fila.estado}`);
  }
  console.log(`\n${tabla.length}/5 casos funcionales automatizados + diseño adaptable: PASS`);
});
