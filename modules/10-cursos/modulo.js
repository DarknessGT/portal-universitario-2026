// MÓDULO 10: Cursos. La lógica permanece aislada para no afectar a los demás módulos.

document.addEventListener("DOMContentLoaded", () => {
  /** Clave exclusiva del módulo para evitar colisiones con el almacenamiento de otros estudiantes. */
  const CLAVE_ALMACENAMIENTO = "portal_universitario_cursos_est10";
  /** Límites equivalentes a los del formulario, aplicados otra vez al leer datos almacenados. */
  const LIMITES = { codigo: 20, nombre: 100, docente: 100, horario: 100 };

  const formulario = document.getElementById("curso-form");
  const campoCodigo = document.getElementById("curso-codigo");
  const campoNombre = document.getElementById("curso-nombre");
  const campoDocente = document.getElementById("curso-docente");
  const campoHorario = document.getElementById("curso-horario");
  const mensajeCursos = document.getElementById("mensaje-cursos");
  const contadorCursos = document.getElementById("contador-cursos");
  const estadoVacio = document.getElementById("estado-vacio-cursos");
  const tablaCursos = document.getElementById("lista-cursos");
  const cuerpoLista = document.getElementById("lista-cursos-cuerpo");

  /**
   * Presenta un mensaje accesible y aplica su estado visual.
   * @param {string} texto - Contenido que se comunicará al usuario.
   * @param {"error"|"exito"|"aviso"} tipo - Tipo semántico del mensaje.
   * @returns {void}
   */
  function mostrarMensaje(texto, tipo) {
    mensajeCursos.textContent = texto;
    mensajeCursos.dataset.tipo = tipo;
  }

  /**
   * Elimina espacios extremos y repetidos de un texto introducido por el usuario.
   * @param {unknown} valor - Valor por normalizar.
   * @returns {string} Texto seguro para validar o mostrar como texto plano.
   */
  function normalizarTexto(valor) {
    return typeof valor === "string" ? valor.trim().replace(/\s+/g, " ") : "";
  }

  /**
   * Construye la estructura uniforme de un curso y estandariza su código en mayúsculas.
   * @param {Object} datos - Valores extraídos del formulario o del almacenamiento.
   * @returns {{codigo: string, nombre: string, docente: string, horario: string}} Curso normalizado.
   */
  function normalizarCurso(datos) {
    return {
      codigo: normalizarTexto(datos.codigo).toUpperCase(),
      nombre: normalizarTexto(datos.nombre),
      docente: normalizarTexto(datos.docente),
      horario: normalizarTexto(datos.horario)
    };
  }

  /**
   * Verifica las reglas de negocio y los límites también del lado de JavaScript.
   * @param {{codigo: string, nombre: string, docente: string, horario: string}} curso - Curso ya normalizado.
   * @returns {string|null} Mensaje de error o null cuando los datos cumplen las reglas.
   */
  function validarCurso(curso) {
    if (!curso.codigo) {
      return "El código del curso es obligatorio.";
    }

    if (!curso.nombre) {
      return "El nombre del curso es obligatorio.";
    }

    for (const campo of Object.keys(LIMITES)) {
      if (curso[campo].length > LIMITES[campo]) {
        return `El campo ${campo} supera el máximo permitido.`;
      }
    }

    return null;
  }

  /**
   * Comprueba que un objeto de localStorage tenga un formato de curso válido antes de usarlo.
   * Descarta entradas corruptas para que datos manipulados no rompan el renderizado.
   * @param {unknown} posibleCurso - Elemento obtenido del JSON almacenado.
   * @returns {{codigo: string, nombre: string, docente: string, horario: string}|null} Curso válido o null.
   */
  function convertirCursoAlmacenado(posibleCurso) {
    if (!posibleCurso || typeof posibleCurso !== "object") {
      return null;
    }

    const curso = normalizarCurso(posibleCurso);
    return validarCurso(curso) ? null : curso;
  }

  /**
   * Recupera cursos persistidos y tolera JSON corrupto, tipos inesperados o almacenamiento no disponible.
   * @returns {Array<{codigo: string, nombre: string, docente: string, horario: string}>} Cursos válidos recuperados.
   */
  function cargarCursos() {
    try {
      const contenido = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      if (!contenido) {
        return [];
      }

      const datos = JSON.parse(contenido);
      if (!Array.isArray(datos)) {
        throw new Error("El contenido almacenado no es una lista.");
      }

      const cursosValidos = datos.map(convertirCursoAlmacenado).filter(Boolean);
      const codigos = new Set();
      const cursosSinDuplicados = cursosValidos.filter((curso) => {
        if (codigos.has(curso.codigo)) {
          return false;
        }
        codigos.add(curso.codigo);
        return true;
      });

      if (cursosSinDuplicados.length !== datos.length) {
        localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(cursosSinDuplicados));
        mostrarMensaje("Se descartaron datos de cursos no válidos almacenados anteriormente.", "aviso");
      }

      return cursosSinDuplicados;
    } catch (error) {
      console.warn("No fue posible recuperar los cursos almacenados.", error);
      mostrarMensaje("No se pudieron recuperar los cursos guardados; iniciaremos una lista nueva.", "error");
      return [];
    }
  }

  /**
   * Persiste la lista actual usando la clave propia del módulo.
   * @param {Array<{codigo: string, nombre: string, docente: string, horario: string}>} cursos - Lista a guardar.
   * @returns {boolean} True si el navegador confirmó el guardado; false cuando localStorage falla.
   */
  function guardarCursos(cursos) {
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(cursos));
      return true;
    } catch (error) {
      console.warn("No fue posible guardar los cursos.", error);
      mostrarMensaje("El curso se muestra en esta sesión, pero no se pudo guardar en el navegador.", "error");
      return false;
    }
  }

  /**
   * Limpia los campos después de un registro correcto y devuelve el foco al primer dato requerido.
   * @returns {void}
   */
  function limpiarFormulario() {
    formulario.reset();
    campoCodigo.focus();
  }

  /**
   * Inserta una celda con textContent para impedir que los valores del usuario se interpreten como HTML.
   * @param {HTMLTableRowElement} fila - Fila de tabla que recibirá la celda.
   * @param {string} valor - Valor a mostrar literalmente.
   * @returns {void}
   */
  function agregarCeldaTexto(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = valor || "—";
    fila.append(celda);
  }

  /**
   * Regenera el listado, contador y estado vacío a partir del arreglo en memoria.
   * Los datos se agregan con APIs del DOM, nunca con innerHTML, para evitar inyección de código.
   * @returns {void}
   */
  function renderizarCursos() {
    cuerpoLista.replaceChildren();
    contadorCursos.textContent = `Cursos asignados: ${cursos.length}`;
    const estaVacio = cursos.length === 0;
    estadoVacio.hidden = !estaVacio;
    tablaCursos.hidden = estaVacio;

    cursos.forEach((curso) => {
      const fila = document.createElement("tr");
      fila.dataset.codigo = curso.codigo;
      agregarCeldaTexto(fila, curso.codigo);
      agregarCeldaTexto(fila, curso.nombre);
      agregarCeldaTexto(fila, curso.docente);
      agregarCeldaTexto(fila, curso.horario);

      const celdaAcciones = document.createElement("td");
      const botonEliminar = document.createElement("button");
      botonEliminar.type = "button";
      botonEliminar.className = "btn-eliminar-curso";
      botonEliminar.dataset.accion = "eliminar";
      botonEliminar.dataset.codigo = curso.codigo;
      botonEliminar.setAttribute("aria-label", `Eliminar el curso ${curso.codigo}`);
      botonEliminar.textContent = "Eliminar";
      celdaAcciones.append(botonEliminar);
      fila.append(celdaAcciones);
      cuerpoLista.append(fila);
    });
  }

  /**
   * Registra un curso si satisface las reglas y su código no existe en la lista actual.
   * @param {{codigo: string, nombre: string, docente: string, horario: string}} curso - Datos ya normalizados.
   * @returns {boolean} True si se añadió el curso; false si se rechazó por validación o duplicado.
   */
  function registrarCurso(curso) {
    const errorValidacion = validarCurso(curso);
    if (errorValidacion) {
      mostrarMensaje(errorValidacion, "error");
      return false;
    }

    if (cursos.some((cursoExistente) => cursoExistente.codigo === curso.codigo)) {
      mostrarMensaje(`Ya existe un curso con el código ${curso.codigo}.`, "error");
      return false;
    }

    cursos.push(curso);
    const seGuardo = guardarCursos(cursos);
    renderizarCursos();
    if (seGuardo) {
      mostrarMensaje(`El curso ${curso.codigo} fue registrado correctamente.`, "exito");
    }
    limpiarFormulario();
    return true;
  }

  /**
   * Solicita confirmación y elimina por código, luego sincroniza la interfaz y localStorage.
   * @param {string} codigo - Código normalizado del curso que se desea retirar.
   * @returns {void}
   */
  function eliminarCurso(codigo) {
    const curso = cursos.find((cursoExistente) => cursoExistente.codigo === codigo);
    if (!curso) {
      mostrarMensaje("El curso que intenta eliminar ya no está disponible.", "error");
      return;
    }

    if (!window.confirm(`¿Desea eliminar el curso ${curso.codigo}?`)) {
      return;
    }

    cursos = cursos.filter((cursoExistente) => cursoExistente.codigo !== codigo);
    const seGuardo = guardarCursos(cursos);
    renderizarCursos();
    if (seGuardo) {
      mostrarMensaje(`El curso ${curso.codigo} fue eliminado.`, "exito");
    }
  }

  /**
   * Recopila los campos del formulario y delega el registro sin permitir el envío tradicional.
   * @param {SubmitEvent} evento - Evento de envío generado por el formulario.
   * @returns {void}
   */
  function manejarEnvioFormulario(evento) {
    evento.preventDefault();
    const curso = normalizarCurso({
      codigo: campoCodigo.value,
      nombre: campoNombre.value,
      docente: campoDocente.value,
      horario: campoHorario.value
    });
    registrarCurso(curso);
  }

  /**
   * Detecta de forma delegada los botones de eliminación del listado dinámico.
   * @param {MouseEvent} evento - Clic originado dentro del cuerpo de la tabla.
   * @returns {void}
   */
  function manejarClicLista(evento) {
    const boton = evento.target.closest('button[data-accion="eliminar"]');
    if (boton) {
      eliminarCurso(boton.dataset.codigo || "");
    }
  }

  // Estado en memoria cargado antes del primer renderizado para mantener la persistencia entre recargas.
  let cursos = cargarCursos();
  renderizarCursos();

  // Eventos aislados del módulo para registrar y eliminar sin listeners globales adicionales.
  formulario.addEventListener("submit", manejarEnvioFormulario);
  cuerpoLista.addEventListener("click", manejarClicLista);
});
