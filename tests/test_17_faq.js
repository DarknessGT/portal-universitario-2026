/**
 * Pruebas Automatizadas con Selenium WebDriver
 * Módulo 17: FAQ (Preguntas Frecuentes Desplegables)
 * Autor: Marcos Molina (Estudiante 17)
 * Curso: Aseguramiento de la Calidad de Software
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');

async function ejecutarPruebas() {
  console.log('================================================================');
  console.log(' INICIANDO SUITE DE PRUEBAS AUTOMATIZADAS - MÓDULO 17: FAQ');
  console.log(' Herramientas: Selenium WebDriver + Google Chrome (Headless)');
  console.log('================================================================\n');

  // Configuración de Chrome Headless para ejecución local y en CI
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1280,1024');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  const resultados = [];
  const dirEvidencias = path.join(__dirname, '..', 'evidencias');
  if (!fs.existsSync(dirEvidencias)) {
    fs.mkdirSync(dirEvidencias, { recursive: true });
  }

  // Funciones de utilidad robustas
  async function safeClick(by) {
    const el = await driver.wait(until.elementLocated(by), 5000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el);
    await driver.sleep(150);
    await driver.executeScript("arguments[0].click();", el);
    await driver.sleep(250);
    return el;
  }

  async function safeType(by, text) {
    const el = await driver.wait(until.elementLocated(by), 5000);
    await driver.executeScript("arguments[0].scrollIntoView({block:'center', inline:'nearest'});", el);
    await driver.sleep(100);
    await el.clear();
    await el.sendKeys(text);
    await driver.sleep(100);
  }

  function reportarCaso(id, nombre, datos, esperado, obtenido, pass) {
    resultados.push({ id, nombre, pass });
    console.log('----------------------------------------------------------------');
    console.log(`CASO DE PRUEBA: ${id} - ${nombre}`);
    console.log(`Datos:     ${datos}`);
    console.log(`Esperado:  ${esperado}`);
    console.log(`Obtenido:  ${obtenido}`);
    console.log(`ESTADO:    ${pass ? '✅ PASS' : '❌ FAIL'}`);
  }

  try {
    const fileUrl = 'file://' + path.resolve(__dirname, '../modules/17-faq/index.html');
    await driver.get(fileUrl);
    await driver.sleep(500);

    // =========================================================================
    // CP-17-01: Despliegue y contracción interactiva del acordeón
    // =========================================================================
    try {
      // Estado inicial: cerrado (hidden presente)
      const hiddenInicial = await (await driver.wait(until.elementLocated(By.id('faq-ans-1')), 5000)).getAttribute('hidden');

      // Primer clic: abrir
      await safeClick(By.id('faq-btn-1'));
      const hiddenAbierto = await (await driver.findElement(By.id('faq-ans-1'))).getAttribute('hidden');
      const expandedAbierto = await (await driver.findElement(By.id('faq-btn-1'))).getAttribute('aria-expanded');

      // Segundo clic: cerrar
      await safeClick(By.id('faq-btn-1'));
      const hiddenCerrado = await (await driver.findElement(By.id('faq-ans-1'))).getAttribute('hidden');
      const expandedCerrado = await (await driver.findElement(By.id('faq-btn-1'))).getAttribute('aria-expanded');

      const pass01 = (hiddenInicial !== null) && 
                     (hiddenAbierto === null) && 
                     (expandedAbierto === 'true') && 
                     (hiddenCerrado !== null) && 
                     (expandedCerrado === 'false');

      reportarCaso(
        'CP-17-01',
        'Despliegue y contracción interactiva del acordeón',
        'Clic interactivo sobre #faq-btn-1 (abrir y cerrar)',
        'Alterna hidden y aria-expanded entre true y false',
        `Abierto(hidden=${hiddenAbierto}, expanded=${expandedAbierto}) | Cerrado(hidden=${hiddenCerrado}, expanded=${expandedCerrado})`,
        pass01
      );
    } catch (e) {
      reportarCaso('CP-17-01', 'Despliegue de acordeón', 'Clic #faq-btn-1', 'Toggle exitoso', `Error: ${e.message}`, false);
    }

    // =========================================================================
    // CP-17-02: Búsqueda dinámica y filtro en tiempo real
    // =========================================================================
    try {
      await safeType(By.id('faqSearchInput'), 'asignacion');

      const itemsVisibles = await driver.findElements(By.css('.faq-item'));
      const statsText = await (await driver.findElement(By.id('faqStats'))).getText();

      await safeClick(By.id('btnClearSearch'));

      const itemsRestaurados = await driver.findElements(By.css('.faq-item'));

      const pass02 = (itemsVisibles.length === 1) && 
                     statsText.includes('1 de 6') && 
                     (itemsRestaurados.length === 6);

      reportarCaso(
        'CP-17-02',
        'Búsqueda dinámica en tiempo real y restauración de filtro',
        'Búsqueda "asignacion" seguida de clic en Limpiar',
        'Filtra a 1 pregunta y al limpiar restaura las 6 preguntas',
        `Filtradas: ${itemsVisibles.length} items (${statsText}) | Restauradas: ${itemsRestaurados.length} items`,
        pass02
      );
    } catch (e) {
      reportarCaso('CP-17-02', 'Búsqueda dinámica', 'Input search', 'Filtro correcto', `Error: ${e.message}`, false);
    }

    // =========================================================================
    // CP-17-03: Registro exitoso de nueva consulta válida
    // =========================================================================
    try {
      // Seleccionar categoría
      const selectCat = await driver.findElement(By.id('faqCategorySelect'));
      await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", selectCat);
      await selectCat.sendKeys('Académico');

      // Llenar campos válidos
      await safeType(By.id('faqUserEmail'), 'marcosmolina@miumg.edu.gt');
      await safeType(By.id('faqUserQuestion'), '¿Cuándo inician las evaluaciones del segundo parcial?');
      await safeType(By.id('faqUserAnswer'), 'Necesito conocer el calendario oficial de exámenes parciales del décimo semestre.');

      // Enviar formulario mediante clic seguro
      await safeClick(By.id('btnSubmitQuestion'));

      const feedback = await driver.wait(until.elementLocated(By.id('faqFormFeedback')), 5000);
      const feedbackText = await feedback.getText();
      const feedbackClass = await feedback.getAttribute('class');

      // Verificar que la nueva FAQ esté en el acordeón
      const primerTitulo = await (await driver.findElement(By.css('.faq-item:first-child .faq-title'))).getText();

      const pass03 = feedbackClass.includes('success') && 
                     primerTitulo.includes('segundo parcial');

      reportarCaso(
        'CP-17-03',
        'Registro exitoso de nueva consulta válida en FAQ',
        'Categoría=academico, email=marcosmolina@miumg.edu.gt, pregunta>10 chars',
        'Feedback de éxito visible y pregunta agregada al inicio del acordeón',
        `Clase: ${feedbackClass}, Mensaje: "${feedbackText.substring(0, 45)}...", Título nuevo: "${primerTitulo}"`,
        pass03
      );
    } catch (e) {
      reportarCaso('CP-17-03', 'Registro exitoso', 'Form submit válido', 'Pregunta agregada', `Error: ${e.message}`, false);
    }

    // =========================================================================
    // CP-17-04: Validación de campos obligatorios y formatos incorrectos
    // =========================================================================
    try {
      // Limpiar formulario y rellenar con valores inválidos
      const selectCat = await driver.findElement(By.id('faqCategorySelect'));
      await selectCat.sendKeys('');

      await safeType(By.id('faqUserEmail'), 'correo-invalido-sin-arroba');
      await safeType(By.id('faqUserQuestion'), 'Corta'); // Menor a 10 chars
      await safeType(By.id('faqUserAnswer'), 'Muy corta'); // Menor a 15 chars

      await safeClick(By.id('btnSubmitQuestion'));

      const errEmail = await (await driver.findElement(By.id('err-email'))).getText();
      const errQ = await (await driver.findElement(By.id('err-question'))).getText();
      const errAns = await (await driver.findElement(By.id('err-answer'))).getText();
      const feedbackClass = await (await driver.findElement(By.id('faqFormFeedback'))).getAttribute('class');

      const pass04 = errEmail.length > 0 && 
                     errQ.length > 0 && 
                     errAns.length > 0 && 
                     feedbackClass.includes('error');

      reportarCaso(
        'CP-17-04',
        'Validación negativa de entradas y campos no conformes',
        'Email sin formato @, pregunta < 10 chars, detalle < 15 chars',
        'Envío bloqueado, feedback de error y mensajes específicos por campo',
        `ErrEmail: "${errEmail}" | ErrPregunta: "${errQ}" | ErrDetalle: "${errAns}"`,
        pass04
      );
    } catch (e) {
      reportarCaso('CP-17-04', 'Validación negativa', 'Datos inválidos', 'Bloqueo y errores', `Error: ${e.message}`, false);
    }

    // =========================================================================
    // CP-17-05: Sanitización contra inyección XSS (DevSecOps)
    // =========================================================================
    try {
      const selectCat = await driver.findElement(By.id('faqCategorySelect'));
      await selectCat.sendKeys('Campus Virtual');

      await safeType(By.id('faqUserEmail'), 'seguridad@miumg.edu.gt');
      await safeType(By.id('faqUserQuestion'), '<script id="xss-test">window.__xssInjected=true;</script> ¿Es seguro el portal?');
      await safeType(By.id('faqUserAnswer'), '<img src="invalid.png" onerror="window.__xssImgInjected=true;"> Validación de seguridad.');

      await safeClick(By.id('btnSubmitQuestion'));

      // Verificar si las variables inyectadas existen en window
      const xssInjected = await driver.executeScript('return window.__xssInjected === true;');
      const xssImgInjected = await driver.executeScript('return window.__xssImgInjected === true;');

      // Verificar que el elemento <script id="xss-test"> no existe en el DOM
      const scriptElements = await driver.findElements(By.id('xss-test'));

      const pass05 = (!xssInjected) && (!xssImgInjected) && (scriptElements.length === 0);

      reportarCaso(
        'CP-17-05',
        'Sanitización y mitigación contra Cross-Site Scripting (XSS)',
        'Payloads: <script>...</script> y <img onerror=...>',
        'Ningún script ejecutado en contexto y entidades HTML escapadas de forma segura',
        `Script ejecutado: ${xssInjected}, Img onerror ejecutado: ${xssImgInjected}, Nodos script en DOM: ${scriptElements.length}`,
        pass05
      );

      // Captura de evidencia fotográfica automática de la prueba de seguridad
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(path.join(dirEvidencias, 'evidencia_test_17_faq.png'), screenshot, 'base64');
      console.log(`📸 Evidencia fotográfica guardada en: evidencias/evidencia_test_17_faq.png`);

    } catch (e) {
      reportarCaso('CP-17-05', 'Sanitización XSS', 'Payload XSS', 'Escape seguro', `Error: ${e.message}`, false);
    }

  } finally {
    await driver.quit();
  }

  // =========================================================================
  // RESUMEN FINAL
  // =========================================================================
  const total = resultados.length;
  const passed = resultados.filter(r => r.pass).length;
  const failed = total - passed;

  console.log('\n================================================================');
  console.log(' RESUMEN FINAL DE EJECUCIÓN');
  console.log('================================================================');
  console.log(`Total Casos Ejecutados: ${total}`);
  console.log(`Casos Aprobados (PASS): ${passed}`);
  console.log(`Casos Fallidos  (FAIL): ${failed}`);
  console.log(`Tasa de Éxito:          ${((passed / total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

ejecutarPruebas().catch(err => {
  console.error('Error fatal durante la ejecución de las pruebas:', err);
  process.exit(1);
});
