// MÓDULO 08: Biblioteca
// Actividad: Buscar libros dentro de una lista.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// El catálogo incluido contiene títulos de demostración, no datos institucionales.

const librosDemostracion = Object.freeze([
  "Introducción a la programación",
  "Matemática Discreta",
  "Cálculo diferencial e integral",
  "Fundamentos de biología",
  "Historia universal",
  "Principios de física",
  "Auditoría y Seguridad De La Información",
  "Ingeniería de software",
]);

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

function buscarLibros(libros, consulta) {
  const termino = normalizarTexto(consulta);
  if (!termino) return [];

  return libros.filter(titulo => normalizarTexto(titulo).includes(termino));
}

// Exportación compatible con node:test; en el navegador se ejecuta como un script normal.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { buscarLibros, librosDemostracion, normalizarTexto };
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("busqueda-libros");
    const entrada = document.getElementById("termino-busqueda");
    const botonLimpiar = document.getElementById("limpiar-busqueda");
    const lista = document.getElementById("resultados-libros");
    const conteo = document.getElementById("conteo-libros");
    const resultado = document.getElementById("resultado-08");

    if (!formulario || !entrada || !botonLimpiar || !lista || !conteo || !resultado) return;

    function mostrarLibros(libros) {
      lista.replaceChildren();
      libros.forEach(titulo => {
        const elemento = document.createElement("li");
        elemento.textContent = titulo;
        lista.append(elemento);
      });
      conteo.textContent = `${libros.length} de ${librosDemostracion.length} títulos`;
    }

    mostrarLibros(librosDemostracion);
    resultado.textContent = "Se muestra el catálogo de demostración.";

    function actualizarResultados() {
      const consulta = entrada.value.trim();
      entrada.removeAttribute("aria-invalid");

      if (!consulta) {
        mostrarLibros(librosDemostracion);
        resultado.dataset.estado = "inicial";
        resultado.textContent = "Se muestra el catálogo de demostración.";
        return;
      }

      const coincidencias = buscarLibros(librosDemostracion, consulta);
      mostrarLibros(coincidencias);

      if (coincidencias.length === 0) {
        resultado.dataset.estado = "vacio";
        resultado.textContent = `No se encontraron libros para “${consulta}”.`;
        return;
      }

      resultado.dataset.estado = "exito";
      const etiqueta = coincidencias.length === 1 ? "libro" : "libros";
      resultado.textContent = `Se encontraron ${coincidencias.length} ${etiqueta} para “${consulta}”.`;
    }

    entrada.addEventListener("input", actualizarResultados);

    formulario.addEventListener("submit", evento => {
      evento.preventDefault();
      actualizarResultados();
    });

    botonLimpiar.addEventListener("click", () => {
      entrada.value = "";
      actualizarResultados();
      entrada.focus();
    });
  });
}
