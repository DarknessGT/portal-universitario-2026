// MÓDULO 12: Encuesta
// Actividad: Registrar una respuesta y mostrar resultado.
// Tipos de pregunta: opción múltiple, opción única, escala 1-5 y texto libre.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// Evite modificar módulos asignados a otros compañeros.

document.addEventListener("DOMContentLoaded", () => {
  const area = document.getElementById("app-12");
  const form = document.getElementById("encuesta-form-12");
  const botonEnviar = document.getElementById("enviar-12");
  const botonNuevoVoto = document.getElementById("nuevo-voto-12");
  const botonReiniciar = document.getElementById("reiniciar-12");
  const resultados = document.getElementById("resultados-12");
  const mensaje = document.getElementById("resultado-12");
  const comentario = document.getElementById("comentario-12");
  const contador = document.getElementById("contador-12");
  const promedio = document.getElementById("promedio-12");
  const totalEscala = document.getElementById("escala-total-12");
  const listaComentarios = document.getElementById("lista-comentarios-12");
  const sinComentarios = document.getElementById("sin-comentarios-12");
  const contadorComentarios = document.getElementById("comentarios-12");

  if (!area || !form || !botonEnviar || !botonNuevoVoto || !botonReiniciar || !resultados || !mensaje
    || !comentario || !contador || !promedio || !totalEscala || !listaComentarios || !sinComentarios
    || !contadorComentarios) return;

  const MAX_COMENTARIO = 200;

  const Q1 = [
    { valor: "notas", etiqueta: "Notas" },
    { valor: "calendario", etiqueta: "Calendario" },
    { valor: "biblioteca", etiqueta: "Biblioteca" },
    { valor: "eventos", etiqueta: "Eventos" }
  ];
  const Q2 = [
    { valor: "portal", etiqueta: "Portal" },
    { valor: "correo", etiqueta: "Correo" },
    { valor: "sms", etiqueta: "SMS" }
  ];
  const Q3 = [
    { valor: "1", etiqueta: "1 · Muy insatisfecho" },
    { valor: "2", etiqueta: "2 · Insatisfecho" },
    { valor: "3", etiqueta: "3 · Neutral" },
    { valor: "4", etiqueta: "4 · Satisfecho" },
    { valor: "5", etiqueta: "5 · Muy satisfecho" }
  ];

  const ceros = (clave) => Object.fromEntries(clave.map((item) => [item.valor, 0]));

  const resumen = {
    registros: 0,
    q1: ceros(Q1),
    q2: ceros(Q2),
    q3: ceros(Q3),
    q3Suma: 0,
    q3Total: 0,
    textos: []
  };

  let respondida = false;

  const seleccionados = (nombre) => Array.from(form.querySelectorAll(`input[name="${nombre}"]:checked`));
  const primeraSeleccion = (nombre) => seleccionados(nombre)[0] || null;

  const bloquear = (bloqueado) => {
    form.querySelectorAll('input[name="q1-12"], input[name="q2-12"], input[name="q3-12"]').forEach((control) => {
      control.disabled = bloqueado;
    });
    comentario.disabled = bloqueado;
    botonEnviar.disabled = bloqueado;
    botonNuevoVoto.disabled = !bloqueado;
  };

  const pintarBarras = (pregunta, opciones, conteos, total) => {
    const bloque = resultados.querySelector(`[data-result="${pregunta}"]`);
    if (!bloque) return;

    opciones.forEach((opcion) => {
      const fila = bloque.querySelector(`[data-option="${opcion.valor}"]`);
      if (!fila) return;

      const cantidad = conteos[opcion.valor];
      const porcentaje = total === 0 ? 0 : Math.round((cantidad / total) * 100);
      const estadistica = fila.querySelector(".encuesta-result-stats");
      const barra = fila.querySelector(".encuesta-bar-fill");

      fila.dataset.votes = String(cantidad);
      fila.dataset.percent = String(porcentaje);
      if (estadistica) estadistica.textContent = `${cantidad} ${cantidad === 1 ? "voto" : "votos"} · ${porcentaje}%`;
      if (barra) barra.style.width = `${porcentaje}%`;
    });
  };

  const pintarTextos = () => {
    while (listaComentarios.firstChild) listaComentarios.removeChild(listaComentarios.firstChild);

    resumen.textos.forEach((texto) => {
      const item = document.createElement("li");
      item.className = "encuesta-answer";
      item.textContent = texto;
      listaComentarios.appendChild(item);
    });

    contadorComentarios.textContent = String(resumen.textos.length);
    contadorComentarios.dataset.answers = String(resumen.textos.length);
    sinComentarios.hidden = resumen.textos.length > 0;
  };

  const pintar = () => {
    resultados.dataset.records = String(resumen.registros);
    pintarBarras("q1", Q1, resumen.q1, resumen.registros);
    pintarBarras("q2", Q2, resumen.q2, resumen.registros);
    pintarBarras("q3", Q3, resumen.q3, resumen.q3Total);

    const valorPromedio = resumen.q3Total === 0
      ? ""
      : (Math.round((resumen.q3Suma / resumen.q3Total) * 10) / 10).toFixed(1);
    promedio.textContent = valorPromedio || "—";
    promedio.dataset.average = valorPromedio;
    totalEscala.textContent = String(resumen.q3Total);
    totalEscala.dataset.scaleRecords = String(resumen.q3Total);

    pintarTextos();
  };

  const actualizarContador = () => {
    contador.textContent = `${comentario.value.length}/${MAX_COMENTARIO}`;
  };

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (respondida) {
      mensaje.textContent = 'Tu respuesta ya fue registrada. Usa "Votar otra vez" para continuar.';
      return;
    }

    const opcionUnica = primeraSeleccion("q2-12");
    if (!Q2.some((opcion) => opcion.valor === opcionUnica?.value)) {
      mensaje.textContent = "Selecciona una opción en la pregunta de opción única.";
      return;
    }

    const escala = primeraSeleccion("q3-12");
    if (!Q3.some((opcion) => opcion.valor === escala?.value)) {
      mensaje.textContent = "Selecciona un valor en la escala de satisfacción.";
      return;
    }

    const multiples = seleccionados("q1-12").filter((control) => Q1.some((opcion) => opcion.valor === control.value));
    if (multiples.length === 0) {
      mensaje.textContent = "Selecciona al menos un servicio en la pregunta de opción múltiple.";
      return;
    }

    const texto = comentario.value.slice(0, MAX_COMENTARIO);

    resumen.registros += 1;
    multiples.forEach((control) => { resumen.q1[control.value] += 1; });
    resumen.q2[opcionUnica.value] += 1;
    resumen.q3[escala.value] += 1;
    resumen.q3Suma += Number(escala.value);
    resumen.q3Total += 1;
    if (texto.trim() !== "") resumen.textos.push(texto);

    respondida = true;
    bloquear(true);
    resultados.hidden = false;
    pintar();
    mensaje.textContent = `Respuesta registrada (${resumen.registros} ${resumen.registros === 1 ? "respuesta" : "respuestas"}).`;
  });

  botonNuevoVoto.addEventListener("click", () => {
    if (!respondida) return;
    respondida = false;
    form.reset();
    actualizarContador();
    bloquear(false);
    mensaje.textContent = "Selecciona tus respuestas para registrar otra participación.";
  });

  botonReiniciar.addEventListener("click", () => {
    resumen.registros = 0;
    resumen.q1 = ceros(Q1);
    resumen.q2 = ceros(Q2);
    resumen.q3 = ceros(Q3);
    resumen.q3Suma = 0;
    resumen.q3Total = 0;
    resumen.textos = [];
    respondida = false;
    form.reset();
    actualizarContador();
    bloquear(false);
    resultados.hidden = true;
    pintar();
    mensaje.textContent = "Encuesta reiniciada. Ya puedes registrar otra respuesta.";
  });

  comentario.addEventListener("input", () => {
    if (comentario.value.length > MAX_COMENTARIO) {
      comentario.value = comentario.value.slice(0, MAX_COMENTARIO);
    }
    actualizarContador();
  });

  actualizarContador();
  pintar();
});
