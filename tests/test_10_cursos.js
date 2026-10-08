/**
 * Automatiza CP10-01: registra un curso válido y confirma que se visualiza.
 * Requiere un servidor HTTP activo y selenium-webdriver instalado en tests/.
 */
const { Builder, By, until } = require("selenium-webdriver");

/** Clave que se limpia para que la prueba siempre comience sin cursos previos. */
const CLAVE_ALMACENAMIENTO = "portal_universitario_cursos_est10";
/** URL base configurable para usar un servidor local distinto durante CI. */
const URL_BASE = process.env.PORTAL_URL || "http://127.0.0.1:8000";

/**
 * Ejecuta el flujo Selenium de registro y reporta PASS o FAIL de forma explícita.
 * @returns {Promise<void>} Promesa que termina tras cerrar el navegador.
 */
async function ejecutarPrueba() {
  let navegador;

  try {
    navegador = await new Builder().forBrowser("chrome").build();
    await navegador.manage().setTimeouts({ implicit: 0, pageLoad: 10000, script: 10000 });
    await navegador.get(`${URL_BASE}/modules/10-cursos/index.html`);
    await navegador.wait(until.elementLocated(By.id("curso-form")), 5000);

    // Se limpia el estado específico del módulo y se recarga para simular un inicio de prueba limpio.
    await navegador.executeScript("localStorage.removeItem(arguments[0]);", CLAVE_ALMACENAMIENTO);
    await navegador.navigate().refresh();
    await navegador.wait(until.elementLocated(By.id("curso-codigo")), 5000);

    await navegador.findElement(By.id("curso-codigo")).sendKeys("prog-101");
    await navegador.findElement(By.id("curso-nombre")).sendKeys("Programación I");
    await navegador.findElement(By.id("curso-docente")).sendKeys("Juan Pérez");
    await navegador.findElement(By.id("curso-horario")).sendKeys("Lunes 08:00 - 10:00");
    await navegador.findElement(By.id("btn-registrar-curso")).click();

    const fila = await navegador.wait(
      until.elementLocated(By.css('#lista-cursos-cuerpo tr[data-codigo="PROG-101"]')),
      5000
    );
    await navegador.wait(until.elementTextContains(fila, "Programación I"), 5000);

    const textoFila = await fila.getText();
    if (!textoFila.includes("Juan Pérez") || !textoFila.includes("Lunes 08:00 - 10:00")) {
      throw new Error("La fila del curso no contiene todos los datos registrados.");
    }

    console.log("PASS: CP10-01 registró y mostró correctamente el curso PROG-101.");
  } catch (error) {
    console.error(`FAIL: CP10-01 no pudo completarse. ${error.message}`);
    process.exitCode = 1;
  } finally {
    // El cierre se ejecuta tanto si hay éxito como si Selenium falla a mitad del flujo.
    if (navegador) {
      await navegador.quit();
    }
  }
}

// Punto de entrada de la prueba para permitir ejecución directa con Node.js.
ejecutarPrueba();
