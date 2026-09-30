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

// Categorías del indicador de temperatura (termómetro dual): la categoría N (1 a 6) fija la altura
// del líquido y sus colores en estilos.css: fría (azules/celestes), ambiente (amarillo crema) o
// cálida (amarillo/rojo).
// Los umbrales están en °C y se aplican a la temperatura de ENTRADA; si está en °F, primero se pasa a °C.
// Cada categoría va desde su valor "desde" (incluido) hasta el "desde" de la siguiente:
//   HELADO     < -30 °C       (incluye el cero absoluto y -40 °C)
//   FRÍO       -30 a < -10 °C (ej. -20 °C)
//   FRESCO     -10 a < 15 °C  (incluye la congelación del agua, 0 °C)
//   AMBIENTE    15 a < 25 °C  (ej. 20 °C)
//   TEMPLADO    25 a < 40 °C  (incluye la temperatura corporal, 37 °C)
//   CÁLIDO     ≥ 40 °C        (incluye la ebullición y cualquier valor enorme, ej. 1.5e10 °C)
const NIVELES_TEMPERATURA_06 = [
  { id: "helado", etiqueta: "HELADO", desdeCelsius: -Infinity },
  { id: "frio", etiqueta: "FRÍO", desdeCelsius: -30 },
  { id: "fresco", etiqueta: "FRESCO", desdeCelsius: -10 },
  { id: "ambiente", etiqueta: "AMBIENTE", desdeCelsius: 15 },
  { id: "templado", etiqueta: "TEMPLADO", desdeCelsius: 25 },
  { id: "calido", etiqueta: "CÁLIDO", desdeCelsius: 40 }
];

// Cantidad de conversiones que conserva el historial (solo en memoria).
const HISTORIAL_MAXIMO_06 = 5;

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

// Devuelve la categoría del indicador para una temperatura válida en la unidad indicada ("C" o "F").
function clasificarTemperatura(valor, unidad) {
  const celsius = unidad === "F" ? fahrenheitACelsius(valor) : valor;
  let nivel = NIVELES_TEMPERATURA_06[0];
  for (const candidato of NIVELES_TEMPERATURA_06) {
    if (celsius >= candidato.desdeCelsius) nivel = candidato;
  }
  return nivel;
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
    simboloSalida: $("simbolo-salida-06"),
    rapidas: $("rapidas-06"),
    indicador: $("termometro-06"),
    historial: $("historial-06"),
    historialVacio: $("historial-vacio-06"),
    borrarHistorial: $("btn-borrar-historial-06")
  };

  if (!ui.form) return;

  const cajaEntrada = ui.entrada.closest(".conv-caja");
  const chipsRapidos = [...ui.rapidas.querySelectorAll(".conv-chip[data-celsius]")];
  const descripcionInicialIndicador = ui.indicador.getAttribute("aria-label");
  let sentido = SENTIDOS_06[ui.form.dataset.sentido] ? ui.form.dataset.sentido : "c-f";
  let historial = [];

  // ---------- Indicador de temperatura ----------

  // Termómetro dual: data-nivel (0 a 6) fija en estilos.css la altura y los colores del líquido.
  // La categoría también se anuncia a lectores de pantalla mediante aria-label, sin texto visible.
  function llenarTermometro(nivel) {
    ui.indicador.dataset.nivel = String(nivel);
  }

  function mostrarIndicador(valor, unidad) {
    const nivel = clasificarTemperatura(valor, unidad);
    ui.indicador.dataset.estado = nivel.id;
    llenarTermometro(NIVELES_TEMPERATURA_06.indexOf(nivel) + 1);
    ui.indicador.setAttribute("aria-label", `Indicador de temperatura: ${nivel.etiqueta.toLowerCase()}`);
  }

  function reiniciarIndicador() {
    ui.indicador.dataset.estado = "sin-datos";
    llenarTermometro(0);
    ui.indicador.setAttribute("aria-label", descripcionInicialIndicador);
  }

  // ---------- Historial (solo en memoria) ----------

  function mostrarHistorial() {
    ui.historial.replaceChildren(...historial.map(registro => {
      const item = document.createElement("li");
      item.className = "conv-historial-item";
      // Cada número va junto a su unidad en un bloque que no se parte ("27000000032 °F").
      const temperatura = texto => {
        const bloque = document.createElement("span");
        bloque.className = "conv-historial-temperatura";
        bloque.textContent = texto;
        return bloque;
      };
      const valores = document.createElement("span");
      valores.className = "conv-historial-valores";
      valores.append(
        temperatura(`${registro.entrada} °${registro.origen}`),
        " → ",
        temperatura(`${registro.salida} °${registro.destino}`)
      );
      const direccion = document.createElement("span");
      direccion.className = "conv-historial-sentido";
      direccion.textContent = registro.direccion;
      item.append(valores, direccion);
      return item;
    }));
    const vacio = historial.length === 0;
    ui.historial.hidden = vacio;
    ui.historialVacio.hidden = !vacio;
    ui.borrarHistorial.disabled = vacio;
  }

  function registrarEnHistorial(conversion) {
    const registro = {
      entrada: formatearResultado(conversion.valor),
      origen: conversion.config.origen,
      salida: formatearResultado(conversion.convertido),
      destino: conversion.config.destino,
      direccion: `${conversion.config.nombreOrigen} → ${conversion.config.nombreDestino}`
    };
    // Evita duplicados accidentales: confirmar dos veces seguidas la misma conversión no repite la fila.
    const ultimo = historial[0];
    if (ultimo && ultimo.entrada === registro.entrada && ultimo.origen === registro.origen) return;
    historial = [registro, ...historial].slice(0, HISTORIAL_MAXIMO_06);
    mostrarHistorial();
  }

  // ---------- Resultado ----------

  function limpiarSalida() {
    ui.salida.value = "—";
    ui.resultado.textContent = "";
    reiniciarIndicador();
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

    // Las conversiones rápidas representan temperaturas de referencia fijas (congelación, cuerpo
    // humano...), expresadas en la unidad de entrada actual: 37 °C o, en Fahrenheit, 98.6 °F.
    chipsRapidos.forEach(chip => {
      chip.querySelector("strong").textContent = `${formatearResultado(valorRapido(chip))} °${config.origen}`;
    });
  }

  // Valor de una conversión rápida en la unidad de entrada actual.
  function valorRapido(chip) {
    const celsius = Number(chip.dataset.celsius);
    return SENTIDOS_06[sentido].origen === "F" ? celsiusAFahrenheit(celsius) : celsius;
  }

  // Calcula la conversión del valor actual sin tocar la interfaz.
  // Devuelve { valido: true, valor, convertido, config } o { valido: false, mensaje }.
  function calcularConversion() {
    const config = SENTIDOS_06[sentido];
    const validacion = validarTemperatura(ui.entrada.value, config.origen);
    if (!validacion.valido) return validacion;

    const convertido = config.convertir(validacion.valor);

    // Una entrada finita puede desbordar al convertir (ej. 1e308 °C × 9 = Infinity).
    if (!Number.isFinite(convertido)) {
      return { valido: false, mensaje: "La temperatura es demasiado grande para convertirse." };
    }

    return { valido: true, valor: validacion.valor, convertido, config };
  }

  function mostrarConversion(conversion) {
    const { valor, convertido, config } = conversion;
    limpiarError();
    ui.salida.value = formatearResultado(convertido);
    ui.resultado.textContent =
      `${formatearResultado(valor)} °${config.origen} = ${formatearResultado(convertido)} °${config.destino}`;
    mostrarIndicador(valor, config.origen);
  }

  // Conversión confirmada (botón Convertir, Enter o conversión rápida): muestra errores y registra en el historial.
  function confirmarConversion() {
    const conversion = calcularConversion();
    if (!conversion.valido) {
      mostrarError(conversion.mensaje);
      return;
    }
    mostrarConversion(conversion);
    registrarEnHistorial(conversion);
  }

  // Conversión en tiempo real: mientras se escribe no se muestran errores ni se registra historial.
  // Si el valor aún no es convertible (vacío, "-", "36.", "1e+", bajo el cero absoluto...), solo se vacía el resultado.
  function convertirEnTiempoReal() {
    limpiarError();
    const conversion = calcularConversion();
    if (conversion.valido) {
      mostrarConversion(conversion);
    } else {
      limpiarSalida();
    }
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
        campo.dispatchEvent(new Event("input")); // setRangeText no dispara "input"
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
      campo.dispatchEvent(new Event("input")); // setRangeText no dispara "input"
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

  // Se registra después del filtro, así que siempre trabaja con el valor ya filtrado.
  ui.entrada.addEventListener("input", convertirEnTiempoReal);

  // Convertir con el botón o con Enter dentro del campo, sin recargar la página.
  // El "submit" se dispara una sola vez por clic o por Enter, así que cada confirmación registra una fila.
  ui.form.addEventListener("submit", evento => {
    evento.preventDefault();
    confirmarConversion();
  });

  // Invertir cambia el sentido y conserva el valor escrito: si es válido se recalcula al instante
  // (como en tiempo real, sin registrar historial); si no, solo se vacía el resultado.
  ui.invertir.addEventListener("click", () => {
    sentido = sentido === "c-f" ? "f-c" : "c-f";
    mostrarSentido();
    convertirEnTiempoReal();
    ui.entrada.focus();
  });

  // Conversión rápida: coloca el valor de referencia en la unidad actual y lo confirma.
  ui.rapidas.addEventListener("click", evento => {
    const chip = evento.target.closest(".conv-chip[data-celsius]");
    if (!chip) return;
    ui.entrada.value = formatearResultado(valorRapido(chip));
    ui.entrada.dispatchEvent(new Event("input")); // sincroniza el filtro y la vista en tiempo real
    confirmarConversion();
    ui.entrada.focus();
  });

  ui.borrarHistorial.addEventListener("click", () => {
    historial = [];
    mostrarHistorial();
    ui.entrada.focus();
  });

  // Limpiar: el navegador vacía el campo; aquí se reinician salida, resultado, indicador y error.
  // El historial se conserva (tiene su propio botón para borrarlo).
  ui.form.addEventListener("reset", () => {
    ultimoValorValido = "";
    limpiarError();
    limpiarSalida();
    ui.entrada.focus();
  });

  mostrarSentido();
  mostrarHistorial();
  console.log("Módulo 06 - Conversor: listo.");
});
