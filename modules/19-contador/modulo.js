// Módulo 19. Solo esta clave pertenece al contador; no borrar datos del portal.
document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const CLAVE = "portal-universitario-2026:19:visitas";
  const LIMITE_HISTORIAL = 10;
  const resultado = document.getElementById("resultado-19");
  const total = document.getElementById("contador-visitas-19");
  const inicio = document.getElementById("fecha-inicio-19");
  const anterior = document.getElementById("visita-anterior-19");
  const historial = document.getElementById("historial-visitas-19");
  const formatoFecha = new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "medium"
  });

  function esFechaISO(valor) {
    if (typeof valor !== "string") return false;
    const fecha = new Date(valor);
    return Number.isFinite(fecha.getTime()) && fecha.toISOString() === valor;
  }

  function esRegistroValido(registro) {
    if (!registro || typeof registro !== "object" || registro.version !== 1 ||
        !Number.isSafeInteger(registro.total) || registro.total < 0 ||
        !Array.isArray(registro.historial)) return false;

    if (registro.total === 0) {
      return registro.fechaInicio === null && registro.ultimaVisita === null &&
        registro.historial.length === 0;
    }

    return esFechaISO(registro.fechaInicio) && esFechaISO(registro.ultimaVisita) &&
      registro.historial.length === Math.min(registro.total, LIMITE_HISTORIAL) &&
      registro.historial.every(esFechaISO) &&
      registro.historial[0] === registro.ultimaVisita &&
      (registro.total > LIMITE_HISTORIAL ||
        registro.historial[registro.historial.length - 1] === registro.fechaInicio);
  }

  function mostrar(registro, visitaAnterior) {
    total.textContent = String(registro.total);
    inicio.textContent = registro.fechaInicio
      ? formatoFecha.format(new Date(registro.fechaInicio)) : "Sin visitas registradas";
    anterior.textContent = visitaAnterior
      ? formatoFecha.format(new Date(visitaAnterior)) : "Esta es tu primera visita";
    historial.replaceChildren();
    registro.historial.forEach(fecha => {
      const elemento = document.createElement("li");
      const tiempo = document.createElement("time");
      tiempo.dateTime = fecha;
      tiempo.textContent = formatoFecha.format(new Date(fecha));
      elemento.append(tiempo);
      historial.append(elemento);
    });
  }

  let guardado;
  try {
    guardado = localStorage.getItem(CLAVE);
  } catch {
    resultado.textContent = "No se pudo leer el contador en este navegador. La visita no se registró. Revisa los permisos de almacenamiento del sitio.";
    return;
  }

  let previo = null;
  let recuperado = false;
  if (guardado !== null) {
    try {
      previo = JSON.parse(guardado);
      if (!esRegistroValido(previo)) throw new Error("Registro inválido");
    } catch {
      previo = null;
      recuperado = true;
    }
  }

  if (previo && previo.total === Number.MAX_SAFE_INTEGER) {
    mostrar(previo, previo.ultimaVisita);
    resultado.textContent = "Se alcanzó el límite del contador. Se conservó el registro existente; esta visita no se sumó.";
    return;
  }

  const ahora = new Date().toISOString();
  const nuevo = {
    version: 1,
    total: (previo?.total ?? 0) + 1,
    fechaInicio: previo?.fechaInicio ?? ahora,
    ultimaVisita: ahora,
    // El orden refleja las aperturas, incluso si cambia el reloj del dispositivo.
    historial: [ahora, ...(previo?.historial ?? [])].slice(0, LIMITE_HISTORIAL)
  };

  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    if (previo) mostrar(previo, previo.ultimaVisita);
    resultado.textContent = "No se pudo guardar el contador en este navegador. Esta visita no se sumó; se muestra únicamente el registro guardado disponible.";
    return;
  }

  mostrar(nuevo, previo?.ultimaVisita);
  resultado.textContent = recuperado
    ? "El registro anterior estaba dañado. Se inició un nuevo conteo con esta visita."
    : "Visita registrada en este navegador.";
}, { once: true });
