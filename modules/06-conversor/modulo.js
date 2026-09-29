// MÓDULO 06: Conversor
// Actividad: Convertir Celsius ↔ Fahrenheit.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// Evite modificar módulos asignados a otros compañeros.

// ---------- Constantes ----------

// Cero absoluto por unidad: el límite exacto se considera válido.
const CERO_ABSOLUTO_06 = { C: -273.15, F: -459.67 };

// Temperatura completa: signo negativo opcional, punto o coma decimal y exponente entero opcional.
// Ej.: 36.6, 36,6, -5.5, .5, 1e10, 1,5e10, 2.221422162e+28, -2.2e-28
const PATRON_NUMERO_06 = /^-?(\d+([.,]\d+)?|[.,]\d+)([eE][+-]?\d+)?$/;

// Mantisa válida seguida de "e", "e+" o "e-" sin dígitos: notación científica a medio escribir.
// Ej.: 123445e, 123445e+, 1,5e-
const PATRON_EXPONENTE_INCOMPLETO_06 = /^-?(\d+([.,]\d+)?|[.,]\d+)[eE][+-]?$/;

// Estados intermedios permitidos mientras se escribe: "", "-", "36.", "-36,", ",5", "1e", "1e+", "1e-"
// La "e" solo puede aparecer una vez y después de una mantisa con al menos un dígito.
const PATRON_EDICION_06 = /^-?(\d*([.,]\d*)?|(\d+([.,]\d*)?|[.,]\d+)[eE][+-]?\d*)$/;

// Formato convencional: sin separadores de miles y con 15 cifras significativas como máximo.
const FORMATO_NUMERO_06 = new Intl.NumberFormat("en-US", { useGrouping: false, maximumSignificantDigits: 15 });

// Desde este valor absoluto el resultado se muestra en notación científica (ej. 2.221422162e+28).
// Con 10 cifras significativas la mantisa cabe en la caja de resultado sin desbordarse.
const UMBRAL_CIENTIFICA_06 = 1e12;
const CIFRAS_CIENTIFICA_06 = 10;

const SENTIDOS_06 = {
  "c-f": {
    origen: "C",
    destino: "F",
    nombreOrigen: "Celsius",
    nombreDestino: "Fahrenheit",
    formula: "°F = °C × 9/5 + 32",
    ejemplo: "Ej. 36.6",
    convertir: celsiusAFahrenheit
  },
  "f-c": {
    origen: "F",
    destino: "C",
    nombreOrigen: "Fahrenheit",
    nombreDestino: "Celsius",
    formula: "°C = (°F − 32) × 5/9",
    ejemplo: "Ej. 98.6",
    convertir: fahrenheitACelsius
  }
};

// ---------- Funciones puras (sin acceso al DOM) ----------

function celsiusAFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function fahrenheitACelsius(fahrenheit) {
  return ((fahrenheit - 32) * 5) / 9;
}

// Redondea a 2 decimales de forma simétrica y evita errores como 98.60000000000001.
function redondear(valor) {
  // Por encima de este valor los números ya no tienen parte decimal; multiplicar por 100 podría dar Infinity.
  if (Math.abs(valor) >= Number.MAX_SAFE_INTEGER) return valor;
  const redondeado = Math.sign(valor) * Math.round((Math.abs(valor) + Number.EPSILON) * 100) / 100;
  return redondeado === 0 ? 0 : redondeado; // evita mostrar "-0"
}

// Devuelve el número como texto limpio: "212", "98.6", "-459.67" o, si es muy grande, "2.221422162e+28".
function formatearResultado(valor) {
  const redondeado = redondear(valor);
  if (Math.abs(redondeado) >= UMBRAL_CIENTIFICA_06) {
    return formatearCientifica(redondeado);
  }
  return FORMATO_NUMERO_06.format(redondeado);
}

// Notación científica al estilo de JavaScript/calculadoras, sin ceros sobrantes: 1.8e+12, 2.221422162e+28.
function formatearCientifica(valor) {
  const [mantisa, exponente] = valor.toExponential(CIFRAS_CIENTIFICA_06 - 1).split("e");
  return `${mantisa.replace(/\.?0+$/, "")}e${exponente}`;
}

// Indica si el texto puede formar parte de una temperatura mientras se escribe.
function esEntradaParcialValida(texto) {
  return PATRON_EDICION_06.test(texto);
}

// Normaliza texto pegado: quita espacios y convierte el signo menos tipográfico (−).
function normalizarEntrada(texto) {
  return String(texto ?? "").trim().replace(/−/g, "-");
}

// Al borrar el único dígito que le queda al exponente ("2.2e+2" → "2.2e+"), devuelve la
// posición donde empieza el bloque "e", "e+" o "e-" para eliminarlo también ("2.2").
// Devuelve -1 si el carácter borrado no es ese último dígito del exponente.
function inicioExponenteQueQuedaVacio(texto, indiceBorrado) {
  const exponente = /[eE][+-]?(\d+)$/.exec(texto);
  if (!exponente || exponente[1].length !== 1) return -1;
  return indiceBorrado === texto.length - 1 ? exponente.index : -1;
}

// Valida el texto ingresado para la unidad indicada ("C" o "F").
// Devuelve { valido: true, valor } o { valido: false, mensaje }.
function validarTemperatura(texto, unidad) {
  const limpio = normalizarEntrada(texto);

  if (limpio === "") {
    return { valido: false, mensaje: "Ingrese una temperatura para convertir." };
  }

  if (PATRON_EXPONENTE_INCOMPLETO_06.test(limpio)) {
    return {
      valido: false,
      mensaje: "La notación científica está incompleta. Complete el exponente (ej. 1.5e+10)."
    };
  }

  if (!PATRON_NUMERO_06.test(limpio)) {
    return {
      valido: false,
      mensaje: "La temperatura debe ser un número. Use punto o coma decimal (ej. 36.6 o 36,6)."
    };
  }

  const valor = Number(limpio.replace(",", "."));
  const minimo = CERO_ABSOLUTO_06[unidad];

  // Solo ocurre con cifras de más de 308 dígitos, que JavaScript no puede representar.
  if (!Number.isFinite(valor)) {
    return { valido: false, mensaje: "La temperatura es demasiado grande para convertirse." };
  }

  if (valor < minimo) {
    return {
      valido: false,
      mensaje: `La temperatura no puede ser inferior al cero absoluto (${minimo} °${unidad}).`
    };
  }

  return { valido: true, valor };
}

// ---------- Interfaz ----------

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const ui = {
    form: $("form-conversor-06"),
    entrada: $("entrada-06"),
    salida: $("salida-06"),
    resultado: $("resultado-06"),
    error: $("error-06"),
    invertir: $("btn-invertir-06"),
    sentido: $("sentido-06"),
    formula: $("formula-06"),
    ayuda: $("ayuda-06"),
    unidadEntrada: $("unidad-entrada-06"),
    unidadSalida: $("unidad-salida-06"),
    simboloEntrada: $("simbolo-entrada-06"),
    simboloSalida: $("simbolo-salida-06")
  };

  if (!ui.form) return;

  const cajaEntrada = ui.entrada.closest(".conv-caja");
  let sentido = SENTIDOS_06[ui.form.dataset.sentido] ? ui.form.dataset.sentido : "c-f";

  function limpiarSalida() {
    ui.salida.value = "—";
    ui.resultado.textContent = "";
  }

  function mostrarError(mensaje) {
    ui.error.textContent = mensaje;
    ui.error.hidden = false;
    ui.entrada.setAttribute("aria-invalid", "true");
    cajaEntrada.dataset.invalido = "true";
    limpiarSalida();
  }

  function limpiarError() {
    ui.error.textContent = "";
    ui.error.hidden = true;
    ui.entrada.removeAttribute("aria-invalid");
    delete cajaEntrada.dataset.invalido;
  }

  function mostrarSentido() {
    const config = SENTIDOS_06[sentido];
    ui.form.dataset.sentido = sentido;
    ui.sentido.textContent = `${config.nombreOrigen} → ${config.nombreDestino}`;
    ui.formula.textContent = config.formula;
    ui.unidadEntrada.textContent = config.nombreOrigen;
    ui.unidadSalida.textContent = config.nombreDestino;
    ui.simboloEntrada.textContent = `°${config.origen}`;
    ui.simboloSalida.textContent = `°${config.destino}`;
    ui.entrada.placeholder = config.ejemplo;
    ui.ayuda.textContent = `Acepta punto o coma decimal. Mínimo: ${CERO_ABSOLUTO_06[config.origen]} °${config.origen}.`;
  }

  function convertir() {
    const config = SENTIDOS_06[sentido];
    const validacion = validarTemperatura(ui.entrada.value, config.origen);

    if (!validacion.valido) {
      mostrarError(validacion.mensaje);
      return;
    }

    const convertido = config.convertir(validacion.valor);

    // Una entrada finita puede desbordar al convertir (ej. 1e308 °C × 9 = Infinity).
    if (!Number.isFinite(convertido)) {
      mostrarError("La temperatura es demasiado grande para convertirse.");
      return;
    }

    limpiarError();
    ui.salida.value = formatearResultado(convertido);
    ui.resultado.textContent =
      `${formatearResultado(validacion.valor)} °${config.origen} = ${formatearResultado(convertido)} °${config.destino}`;
  }

  // ---------- Filtro de caracteres del campo de entrada ----------
  // Capa 1 (beforeinput): cancela la inserción si el texto resultante no puede formar
  // parte de una temperatura. Las eliminaciones siempre se permiten (ej. borrar el "1" de "1e5"
  // deja "e5"); la validación final al convertir rechaza esos restos incompletos. Única excepción:
  // borrar el último dígito del exponente elimina también "e+"/"e-".
  // Capa 2 (input): si una inserción se cuela (autocompletado, IME, etc.), se restaura el último valor válido.
  let ultimoValorValido = ui.entrada.value;

  ui.entrada.addEventListener("beforeinput", evento => {
    const campo = ui.entrada;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fin = campo.selectionEnd ?? campo.value.length;

    // Borrado de un solo carácter (Retroceso o Suprimir, sin selección): si deja el exponente
    // sin dígitos, se elimina también "e+"/"e-" para no dejar "2.221422162e+".
    const esBorradoSimple = (evento.inputType === "deleteContentBackward" || evento.inputType === "deleteContentForward")
      && inicio === fin;
    if (esBorradoSimple) {
      const indiceBorrado = evento.inputType === "deleteContentBackward" ? inicio - 1 : inicio;
      const inicioExponente = inicioExponenteQueQuedaVacio(campo.value, indiceBorrado);
      if (inicioExponente !== -1) {
        evento.preventDefault();
        campo.setRangeText("", inicioExponente, campo.value.length, "end");
        ultimoValorValido = campo.value;
      }
      return;
    }

    if (!evento.inputType.startsWith("insert")) return;
    const esPegado = evento.inputType === "insertFromPaste" || evento.inputType === "insertFromDrop";
    const original = evento.data ?? evento.dataTransfer?.getData("text/plain") ?? "";
    const insertado = esPegado ? normalizarEntrada(original) : original;
    const propuesto = campo.value.slice(0, inicio) + insertado + campo.value.slice(fin);

    if (!esEntradaParcialValida(propuesto)) {
      evento.preventDefault();
      return;
    }

    // Texto pegado válido tras normalizarlo (ej. " −36,6 "): se inserta ya limpio.
    if (esPegado && insertado !== original) {
      evento.preventDefault();
      campo.setRangeText(insertado, inicio, fin, "end");
      ultimoValorValido = campo.value;
    }
  });

  ui.entrada.addEventListener("input", evento => {
    const campo = ui.entrada;
    const esEliminacion = evento.inputType?.startsWith("delete") ?? false;
    if (esEliminacion || esEntradaParcialValida(campo.value)) {
      ultimoValorValido = campo.value;
      return;
    }
    const cursor = Math.max(0, (campo.selectionStart ?? 0) - (campo.value.length - ultimoValorValido.length));
    campo.value = ultimoValorValido;
    campo.setSelectionRange(cursor, cursor);
  });

  // Convertir con el botón o con Enter dentro del campo, sin recargar la página.
  ui.form.addEventListener("submit", evento => {
    evento.preventDefault();
    convertir();
  });

  // Invertir cambia el sentido; el valor ingresado se conserva para convertirlo de nuevo.
  ui.invertir.addEventListener("click", () => {
    sentido = sentido === "c-f" ? "f-c" : "c-f";
    mostrarSentido();
    limpiarError();
    limpiarSalida();
    ui.entrada.focus();
  });

  // Limpiar: el navegador vacía el campo; aquí se reinician salida, resultado y error.
  ui.form.addEventListener("reset", () => {
    ultimoValorValido = "";
    limpiarError();
    limpiarSalida();
    ui.entrada.focus();
  });

  mostrarSentido();
  console.log("Módulo 06 - Conversor: listo.");
});
