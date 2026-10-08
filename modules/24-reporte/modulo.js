// Módulo 24: los datos del reporte son declarados por el estudiante.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reporte-form");
  const errores = document.getElementById("errores-24");
  const resultado = document.getElementById("resultado-24");
  const commitPattern = /^[0-9a-f]{7,40}$/i;

  const campo = id => document.getElementById(id);
  const valor = id => campo(id).value.trim();

  function agregarTexto(contenedor, etiqueta, texto, clase) {
    const elemento = document.createElement(etiqueta);
    elemento.textContent = texto;
    if (clase) elemento.className = clase;
    contenedor.appendChild(elemento);
    return elemento;
  }

  function agregarLista(contenedor, elementos) {
    const lista = document.createElement("ul");
    elementos.forEach(texto => agregarTexto(lista, "li", texto));
    contenedor.appendChild(lista);
  }

  function enlaceValido(enlace) {
    try {
      const url = new URL(enlace);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }

  function leerYValidar() {
    const mensajes = [];
    const invalidos = [];
    const rechazar = (id, mensaje) => {
      mensajes.push(mensaje);
      invalidos.push(campo(id));
      campo(id).setAttribute("aria-invalid", "true");
    };

    form.querySelectorAll("[aria-invalid]").forEach(elemento => elemento.removeAttribute("aria-invalid"));

    const funcionalidad = valor("funcionalidad-24");
    if (!funcionalidad) rechazar("funcionalidad-24", "Escribe el nombre de la funcionalidad.");

    const commits = [1, 2, 3].map(numero => valor(`commit-${numero}`));
    commits.forEach((commit, indice) => {
      if (!commit) rechazar(`commit-${indice + 1}`, `Falta el commit ${indice + 1}.`);
      else if (!commitPattern.test(commit)) rechazar(`commit-${indice + 1}`, `El commit ${indice + 1} debe tener entre 7 y 40 caracteres hexadecimales.`);
    });
    if (commits.every(commit => commitPattern.test(commit)) && new Set(commits.map(commit => commit.toLowerCase())).size !== 3) {
      rechazar("commit-3", "Los tres commits deben ser distintos.");
    }

    const pruebas = [1, 2, 3, 4, 5].map(numero => ({
      nombre: valor(`prueba-${numero}`),
      estado: valor(`estado-prueba-${numero}`)
    }));
    pruebas.forEach((prueba, indice) => {
      const numero = indice + 1;
      if (!prueba.nombre) rechazar(`prueba-${numero}`, `Escribe el nombre del caso ${numero}.`);
      if (!["aprobada", "fallida", "pendiente"].includes(prueba.estado)) {
        rechazar(`estado-prueba-${numero}`, `Selecciona el resultado del caso ${numero}.`);
      }
    });

    const automatizada = valor("automatizada-24");
    const pipeline = valor("pipeline-24");
    const pipelineUrl = valor("pipeline-url-24");
    const revisor = valor("revisor-24");
    const revision = valor("revision-24");

    if (!["aprobada", "fallida", "pendiente"].includes(automatizada)) rechazar("automatizada-24", "Selecciona el estado de la prueba automatizada.");
    if (!["aprobada", "fallida", "pendiente"].includes(pipeline)) rechazar("pipeline-24", "Selecciona el estado del pipeline.");
    if (pipelineUrl && !enlaceValido(pipelineUrl)) rechazar("pipeline-url-24", "El enlace del pipeline debe comenzar con http:// o https://.");
    if (pipeline === "aprobada" && !pipelineUrl) rechazar("pipeline-url-24", "Agrega el enlace de la ejecución exitosa del pipeline.");
    if (!["aprobada", "cambios", "pendiente"].includes(revision)) rechazar("revision-24", "Selecciona el estado de revisión.");
    if (revision === "aprobada" && !revisor) rechazar("revisor-24", "Escribe el nombre del compañero que aprobó la revisión.");

    return {
      datos: { funcionalidad, commits, pruebas, automatizada, pipeline, pipelineUrl, revisor, revision },
      mensajes,
      primerInvalido: invalidos[0]
    };
  }

  function mostrarErrores(mensajes, primerInvalido) {
    errores.replaceChildren();
    resultado.replaceChildren();
    agregarTexto(errores, "p", "Corrige estos datos para generar el reporte:");
    agregarLista(errores, mensajes);
    primerInvalido.focus();
  }

  function generarReporte(datos) {
    errores.replaceChildren();
    resultado.replaceChildren();

    const aprobadas = datos.pruebas.filter(prueba => prueba.estado === "aprobada").length;
    const fallidas = datos.pruebas.filter(prueba => prueba.estado === "fallida").length;
    const pendientesPrueba = datos.pruebas.length - aprobadas - fallidas;
    const pendientes = [];
    if (fallidas || pendientesPrueba) pendientes.push("Resolver los casos de prueba fallidos o pendientes.");
    if (datos.automatizada !== "aprobada") pendientes.push("Ejecutar y aprobar al menos una prueba automatizada.");
    if (datos.pipeline !== "aprobada") pendientes.push("Obtener una ejecución exitosa del pipeline y registrar su enlace.");
    if (datos.revision !== "aprobada") pendientes.push("Conseguir la aprobación de un compañero antes del merge.");

    agregarTexto(resultado, "h2", "Resumen de mi entrega");
    agregarTexto(resultado, "p", `Funcionalidad: ${datos.funcionalidad}`);
    agregarTexto(resultado, "h3", "Commits registrados");
    agregarLista(resultado, datos.commits);
    agregarTexto(resultado, "h3", `Casos de prueba: ${aprobadas} aprobados, ${fallidas} fallidos, ${pendientesPrueba} pendientes`);
    agregarLista(resultado, datos.pruebas.map((prueba, indice) => `Caso ${indice + 1}: ${prueba.nombre} — ${prueba.estado}`));
    agregarTexto(resultado, "p", `Prueba automatizada: ${datos.automatizada}.`);
    agregarTexto(resultado, "p", `Pipeline: ${datos.pipeline}.`);
    if (datos.pipelineUrl) agregarTexto(resultado, "p", `Enlace del pipeline: ${datos.pipelineUrl}`);
    agregarTexto(resultado, "p", `Revisión: ${datos.revision}${datos.revisor ? ` por ${datos.revisor}` : ""}.`);
    agregarTexto(resultado, "p", pendientes.length ? "Estado: requisitos pendientes." : "Estado: requisitos registrados como completos.", "reporte-estado");
    if (pendientes.length) {
      agregarTexto(resultado, "h3", "Qué falta");
      agregarLista(resultado, pendientes);
    }
    agregarTexto(resultado, "p", "Este resumen utiliza únicamente la información introducida en el formulario; verifica las evidencias originales antes de entregarlo.");
  }

  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const { datos, mensajes, primerInvalido } = leerYValidar();
    if (mensajes.length) mostrarErrores(mensajes, primerInvalido);
    else generarReporte(datos);
  });
});
