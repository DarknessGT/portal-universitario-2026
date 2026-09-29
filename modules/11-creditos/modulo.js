// MÓDULO 11: Créditos
// Actividad: registrar cursos aprobados y calcular los créditos acumulados.
// Este módulo es autónomo y no modifica información de otros estudiantes.

const CREDITOS_MINIMOS = 1;
const CREDITOS_MAXIMOS = 20;
const LONGITUD_MAXIMA_CURSO = 80;

/**
 * Normaliza espacios para almacenar y comparar nombres de forma consistente.
 * La interfaz siempre inserta este valor con textContent, nunca con innerHTML.
 */
function normalizarNombre(nombre) {
  return String(nombre).trim().replace(/\s+/g, " ");
}

/**
 * Valida los datos antes de agregarlos al estado del módulo.
 * Devuelve un mensaje de error o los datos ya normalizados.
 */
function validarCurso(nombreIngresado, creditosIngresados, cursosRegistrados = []) {
  const nombre = normalizarNombre(nombreIngresado);
  const textoCreditos = String(creditosIngresados).trim();

  if (!nombre) {
    return { error: "Ingrese el nombre del curso." };
  }

  if (nombre.length > LONGITUD_MAXIMA_CURSO) {
    return { error: `El nombre no puede superar ${LONGITUD_MAXIMA_CURSO} caracteres.` };
  }

  // Solo se admiten dígitos para evitar decimales, notación científica y texto.
  if (!/^\d+$/.test(textoCreditos)) {
    return { error: "Los créditos deben ser un número entero." };
  }

  const creditos = Number(textoCreditos);
  if (creditos < CREDITOS_MINIMOS || creditos > CREDITOS_MAXIMOS) {
    return { error: `Los créditos deben estar entre ${CREDITOS_MINIMOS} y ${CREDITOS_MAXIMOS}.` };
  }

  const nombreComparable = nombre.toLocaleLowerCase("es");
  const estaDuplicado = cursosRegistrados.some(
    curso => normalizarNombre(curso.nombre).toLocaleLowerCase("es") === nombreComparable
  );

  if (estaDuplicado) {
    return { error: "Este curso ya fue registrado." };
  }

  return { curso: { nombre, creditos } };
}

/** Calcula el total desde el estado actual, sin depender de lo mostrado en pantalla. */
function calcularTotalCreditos(cursosRegistrados) {
  return cursosRegistrados.reduce((total, curso) => total + curso.creditos, 0);
}

// El guard permite ejecutar pruebas de la lógica con Node sin simular un navegador.
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-creditos-11");
    const entradaCurso = document.getElementById("curso-11");
    const entradaCreditos = document.getElementById("creditos-11");
    const totalCreditos = document.getElementById("total-creditos-11");
    const listaCursos = document.getElementById("lista-creditos-11");
    const mensajeListaVacia = document.getElementById("lista-vacia-11");
    const botonReiniciar = document.getElementById("reiniciar-creditos-11");
    const resultado = document.getElementById("resultado-11");

    // Si cambia la estructura HTML, salir de forma segura en vez de lanzar errores.
    if (
      !formulario || !entradaCurso || !entradaCreditos || !totalCreditos ||
      !listaCursos || !mensajeListaVacia || !botonReiniciar || !resultado
    ) return;

    const cursos = [];
    let siguienteId = 1;

    function mostrarMensaje(mensaje, tipo = "success") {
      resultado.textContent = mensaje;
      resultado.dataset.type = tipo;
    }

    function crearElementoCurso(curso) {
      const elemento = document.createElement("li");
      elemento.className = "course-item";
      elemento.dataset.courseId = String(curso.id);

      const datos = document.createElement("div");
      datos.className = "course-data";

      const nombre = document.createElement("strong");
      nombre.className = "course-name";
      nombre.textContent = curso.nombre;

      const creditos = document.createElement("span");
      creditos.className = "course-credits";
      creditos.textContent = `${curso.creditos} ${curso.creditos === 1 ? "crédito" : "créditos"}`;

      const eliminar = document.createElement("button");
      eliminar.className = "remove-course";
      eliminar.type = "button";
      eliminar.dataset.action = "remove";
      eliminar.dataset.courseId = String(curso.id);
      eliminar.textContent = "Eliminar";
      eliminar.setAttribute("aria-label", `Eliminar ${curso.nombre}`);

      datos.append(nombre, creditos);
      elemento.append(datos, eliminar);
      return elemento;
    }

    /** Actualiza toda la salida visual a partir del arreglo cursos. */
    function renderizar() {
      listaCursos.replaceChildren(...cursos.map(crearElementoCurso));
      totalCreditos.textContent = String(calcularTotalCreditos(cursos));

      const hayCursos = cursos.length > 0;
      mensajeListaVacia.hidden = hayCursos;
      botonReiniciar.disabled = !hayCursos;
    }

    formulario.addEventListener("submit", evento => {
      evento.preventDefault();

      const validacion = validarCurso(entradaCurso.value, entradaCreditos.value, cursos);
      if (validacion.error) {
        mostrarMensaje(validacion.error, "error");
        return;
      }

      const curso = { id: siguienteId, ...validacion.curso };
      siguienteId += 1;
      cursos.push(curso);
      renderizar();
      mostrarMensaje(`${curso.nombre} fue agregado correctamente.`);

      formulario.reset();
      entradaCurso.focus();
    });

    // Delegación de eventos: un solo listener maneja todos los botones de eliminar.
    listaCursos.addEventListener("click", evento => {
      const boton = evento.target.closest('button[data-action="remove"]');
      if (!boton || !listaCursos.contains(boton)) return;

      const id = Number(boton.dataset.courseId);
      const indice = cursos.findIndex(curso => curso.id === id);
      if (indice === -1) return;

      const [cursoEliminado] = cursos.splice(indice, 1);
      renderizar();
      mostrarMensaje(`${cursoEliminado.nombre} fue eliminado del total.`);
    });

    botonReiniciar.addEventListener("click", () => {
      cursos.splice(0, cursos.length);
      renderizar();
      mostrarMensaje("El registro de créditos fue reiniciado.");
      entradaCurso.focus();
    });

    renderizar();
  });
}

// Exportación exclusiva para las pruebas automatizadas ejecutadas con Node.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { normalizarNombre, validarCurso, calcularTotalCreditos };
}
