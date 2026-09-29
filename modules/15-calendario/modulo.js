// Calendario general UMG 2026: https://umg.edu.gt/calendario
// Fechas consultadas el 28 de septiembre de 2026. Los intervalos incluyen ambos extremos.
// No aplica a los calendarios especiales de facultades, idiomas o posgrados.
const FECHAS_ACADEMICAS_2026 = [
  { inicio: "2026-01-02", fin: "2026-01-02", titulo: "Inicio de actividades administrativas", categoria: "actividades" },
  { inicio: "2026-01-23", fin: "2026-01-23", titulo: "Acto inaugural", categoria: "actividades" },
  { inicio: "2026-02-01", fin: "2026-02-06", titulo: "Inicio de clases e inducción a alumnos nuevos", categoria: "actividades" },
  { inicio: "2026-02-16", fin: "2026-02-22", titulo: "Inscripciones y asignaciones extraordinarias", categoria: "inscripciones" },
  { inicio: "2026-02-23", fin: "2026-02-28", titulo: "Inscripciones y asignaciones extemporáneas", categoria: "inscripciones" },
  { inicio: "2026-03-01", fin: "2026-03-14", titulo: "Evaluaciones ordinarias del primer parcial", categoria: "evaluaciones" },
  { inicio: "2026-03-16", fin: "2026-03-22", titulo: "Evaluaciones extraordinarias del primer parcial", categoria: "evaluaciones" },
  { inicio: "2026-03-30", fin: "2026-04-05", titulo: "Asueto de Semana Santa", categoria: "asuetos" },
  { inicio: "2026-04-25", fin: "2026-05-10", titulo: "Evaluaciones ordinarias del segundo parcial", categoria: "evaluaciones" },
  { inicio: "2026-05-01", fin: "2026-05-01", titulo: "Asueto del Día del Trabajo", categoria: "asuetos" },
  { inicio: "2026-05-11", fin: "2026-05-17", titulo: "Evaluaciones extraordinarias del segundo parcial", categoria: "evaluaciones" },
  { inicio: "2026-06-01", fin: "2026-06-14", titulo: "Evaluaciones finales del primer semestre", categoria: "evaluaciones" },
  { inicio: "2026-06-15", fin: "2026-06-21", titulo: "Evaluaciones de recuperación del primer semestre", categoria: "evaluaciones" },
  { inicio: "2026-06-22", fin: "2026-07-12", titulo: "Inscripciones y asignaciones ordinarias", categoria: "inscripciones" },
  { inicio: "2026-06-30", fin: "2026-06-30", titulo: "Asueto del Día del Ejército", categoria: "asuetos" },
  { inicio: "2026-07-12", fin: "2026-07-12", titulo: "Inicio de clases", categoria: "actividades" },
  { inicio: "2026-07-20", fin: "2026-07-31", titulo: "Inscripciones y asignaciones extraordinarias", categoria: "inscripciones" },
  { inicio: "2026-08-01", fin: "2026-08-07", titulo: "Inscripciones y asignaciones extemporáneas", categoria: "inscripciones" },
  { inicio: "2026-08-08", fin: "2026-08-22", titulo: "Evaluaciones ordinarias del primer parcial", categoria: "evaluaciones" },
  { inicio: "2026-08-15", fin: "2026-08-15", titulo: "Asueto en la capital por el Día de la Asunción", categoria: "asuetos" },
  { inicio: "2026-08-23", fin: "2026-08-29", titulo: "Evaluaciones extraordinarias del primer parcial", categoria: "evaluaciones" },
  { inicio: "2026-09-15", fin: "2026-09-15", titulo: "Asueto por el Día de la Independencia Nacional", categoria: "asuetos" },
  { inicio: "2026-09-16", fin: "2026-09-27", titulo: "Evaluaciones ordinarias del segundo parcial", categoria: "evaluaciones" },
  { inicio: "2026-10-03", fin: "2026-10-09", titulo: "Evaluaciones extraordinarias del segundo parcial", categoria: "evaluaciones" },
  { inicio: "2026-10-20", fin: "2026-10-20", titulo: "Asueto por el Día de la Revolución", categoria: "asuetos" },
  { inicio: "2026-11-01", fin: "2026-11-01", titulo: "Asueto", categoria: "asuetos" },
  { inicio: "2026-11-02", fin: "2026-11-15", titulo: "Evaluaciones finales del segundo semestre", categoria: "evaluaciones" },
  { inicio: "2026-11-16", fin: "2026-11-22", titulo: "Evaluaciones de recuperación del segundo semestre", categoria: "evaluaciones" },
  { inicio: "2026-12-01", fin: "2026-12-10", titulo: "Inscripciones y asignaciones ordinarias del primer semestre 2027", categoria: "inscripciones" }
];

document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date();
  let mes = hoy.getFullYear() === 2026 ? hoy.getMonth() : 0;
  let diaSeleccionado = null;

  const tituloMes = document.getElementById("mes-15");
  const dias = document.getElementById("dias-15");
  const eventos = document.getElementById("eventos-15");
  const vacio = document.getElementById("sin-eventos-15");
  const total = document.getElementById("total-15");
  const estado = document.getElementById("resultado-15");
  const anterior = document.getElementById("anterior-15");
  const siguiente = document.getElementById("siguiente-15");
  const botonHoy = document.getElementById("hoy-15");
  const limpiar = document.getElementById("limpiar-15");
  const filtro = document.getElementById("filtro-15");
  const formatoFecha = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const formatoMes = new Intl.DateTimeFormat("es-GT", { month: "long", year: "numeric" });

  const clave = (mesNumero, dia) => `2026-${String(mesNumero + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const fechaLocal = (texto) => {
    const [anio, mesNumero, dia] = texto.split("-").map(Number);
    return new Date(anio, mesNumero - 1, dia, 12);
  };
  const fechaLarga = (texto) => formatoFecha.format(fechaLocal(texto));
  const nombreMes = (numero) => formatoMes.format(new Date(2026, numero, 1, 12));

  function rango(evento) {
    if (evento.inicio === evento.fin) return fechaLarga(evento.inicio);
    return `Del ${fechaLarga(evento.inicio)} al ${fechaLarga(evento.fin)}`;
  }

  function pintar() {
    const primerDia = clave(mes, 1);
    const ultimoDia = clave(mes, new Date(2026, mes + 1, 0).getDate());
    const delMes = FECHAS_ACADEMICAS_2026.filter(evento => evento.inicio <= ultimoDia && evento.fin >= primerDia);
    const visibles = delMes.filter(evento =>
      (filtro.value === "todas" || evento.categoria === filtro.value) &&
      (!diaSeleccionado || (evento.inicio <= diaSeleccionado && evento.fin >= diaSeleccionado))
    );

    tituloMes.textContent = nombreMes(mes);
    anterior.disabled = mes === 0;
    siguiente.disabled = mes === 11;
    botonHoy.disabled = hoy.getFullYear() !== 2026;
    limpiar.hidden = !diaSeleccionado;

    dias.replaceChildren();
    // La semana comienza el lunes; getDay() usa el domingo como primer día.
    const espacios = (new Date(2026, mes, 1, 12).getDay() + 6) % 7;
    for (let i = 0; i < espacios; i++) {
      const hueco = document.createElement("span");
      hueco.setAttribute("aria-hidden", "true");
      dias.append(hueco);
    }

    const cantidadDias = new Date(2026, mes + 1, 0).getDate();
    for (let dia = 1; dia <= cantidadDias; dia++) {
      const fecha = clave(mes, dia);
      const cantidad = delMes.filter(evento => evento.inicio <= fecha && evento.fin >= fecha).length;
      const elemento = document.createElement(cantidad ? "button" : "span");
      elemento.className = `calendar-day${cantidad ? " calendar-day--event" : ""}`;
      elemento.textContent = dia;

      if (fecha === clave(hoy.getMonth(), hoy.getDate()) && hoy.getFullYear() === 2026) {
        elemento.classList.add("calendar-day--today");
        elemento.setAttribute("aria-current", "date");
      }
      if (cantidad) {
        elemento.type = "button";
        elemento.dataset.fecha = fecha;
        elemento.setAttribute("aria-label", `${fechaLarga(fecha)}: ${cantidad} ${cantidad === 1 ? "actividad" : "actividades"}`);
        elemento.setAttribute("aria-pressed", String(diaSeleccionado === fecha));
        elemento.addEventListener("click", () => {
          diaSeleccionado = diaSeleccionado === fecha ? null : fecha;
          pintar();
          dias.querySelector(`[data-fecha="${fecha}"]`).focus();
        });
      }
      dias.append(elemento);
    }

    eventos.replaceChildren();
    visibles.forEach(evento => {
      const item = document.createElement("li");
      item.className = `calendar-event calendar-event--${evento.categoria}`;
      const fecha = document.createElement("time");
      fecha.dateTime = evento.inicio;
      fecha.textContent = rango(evento);
      const nombre = document.createElement("h3");
      nombre.textContent = evento.titulo;
      item.append(fecha, nombre);
      eventos.append(item);
    });
    total.textContent = `${visibles.length} ${visibles.length === 1 ? "fecha" : "fechas"}`;
    vacio.hidden = visibles.length !== 0;
    estado.textContent = `${nombreMes(mes)}: ${visibles.length} ${visibles.length === 1 ? "fecha" : "fechas"}${diaSeleccionado ? ` para el ${fechaLarga(diaSeleccionado)}` : ""}.`;
  }

  anterior.addEventListener("click", () => { mes--; diaSeleccionado = null; pintar(); });
  siguiente.addEventListener("click", () => { mes++; diaSeleccionado = null; pintar(); });
  botonHoy.addEventListener("click", () => { mes = hoy.getMonth(); diaSeleccionado = null; pintar(); });
  limpiar.addEventListener("click", () => { diaSeleccionado = null; pintar(); filtro.focus(); });
  filtro.addEventListener("change", () => { pintar(); });
  pintar();
});
