// MÓDULO 01: Perfil
// Actividad: Registrar nombre, carné, carrera y semestre.

(() => {
  "use strict";

  // Debe coincidir con las opciones de #carrera-01 en index.html
  const CARRERAS = [
    "Ingeniería en Sistemas",
    "Ingeniería Civil",
    "Ingeniería Industrial",
    "Administración de Empresas",
    "Contaduría Pública",
    "Derecho"
  ];

  const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
  const PATRON_SOLO_LETRAS = new RegExp(`^[${LETRAS} ]+$`);
  const PATRON_CARNE = /^\d{4}-\d{2}-\d{3,6}$/;
  const PATRON_SEMESTRE = /^(?:[1-9]|10)$/;

  const CAMPOS = ["nombre", "carne", "carrera", "semestre"];

  // Partículas que van en minúscula, salvo cuando son la primera palabra
  const PARTICULAS = ["de", "del", "la", "las", "los", "y"];

  function normalizar(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).trim().replace(/\s+/g, " ");
  }

  // Recibe un texto ya normalizado: "MARÍA DE LA CRUZ" → "María de la Cruz"
  function formatearNombrePropio(nombre) {
    if (nombre === "") return "";
    return nombre
      .split(" ")
      .map((palabra, indice) => {
        const minuscula = palabra.toLocaleLowerCase("es");
        if (indice > 0 && PARTICULAS.includes(minuscula)) return minuscula;
        const [primera, ...resto] = minuscula;
        return primera.toLocaleUpperCase("es") + resto.join("");
      })
      .join(" ");
  }

  function validarNombre(nombre) {
    if (nombre === "") return "El nombre es obligatorio.";
    if (nombre.length < 3 || nombre.length > 60) return "El nombre debe tener entre 3 y 60 caracteres.";
    if (!PATRON_SOLO_LETRAS.test(nombre)) return "El nombre solo puede contener letras y espacios.";
    if (nombre.split(" ").length < 2) return "Ingrese al menos un nombre y un apellido.";
    return "";
  }

  function validarCarne(carne) {
    if (carne === "") return "El carné es obligatorio.";
    if (!PATRON_CARNE.test(carne)) return "El carné debe tener el formato 0000-00-000 (último bloque de 3 a 6 dígitos).";
    return "";
  }

  function validarCarrera(carrera) {
    if (carrera === "") return "Seleccione una carrera.";
    if (!CARRERAS.includes(carrera)) return "Seleccione una carrera válida de la lista.";
    return "";
  }

  function validarSemestre(semestre) {
    if (semestre === "") return "Seleccione un semestre.";
    if (!PATRON_SEMESTRE.test(semestre)) return "El semestre debe ser un número entero entre 1 y 10.";
    return "";
  }

  // Función pura: no usa el DOM. Recibe { nombre, carne, carrera, semestre }.
  function validarPerfil(datos) {
    const entrada = datos && typeof datos === "object" ? datos : {};
    const normalizados = {
      nombre: formatearNombrePropio(normalizar(entrada.nombre)),
      carne: normalizar(entrada.carne),
      carrera: normalizar(entrada.carrera),
      semestre: normalizar(entrada.semestre)
    };

    const errores = {
      nombre: validarNombre(normalizados.nombre),
      carne: validarCarne(normalizados.carne),
      carrera: validarCarrera(normalizados.carrera),
      semestre: validarSemestre(normalizados.semestre)
    };

    const valido = CAMPOS.every(campo => errores[campo] === "");
    return { valido, errores, datos: normalizados };
  }

  window.Perfil01 = Object.freeze({ validarPerfil });

  document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-perfil-01");
    const tarjeta = document.getElementById("tarjeta-01");
    const resultado = document.getElementById("resultado-01");
    const botonLimpiar = document.getElementById("limpiar-01");
    const botonEditar = document.getElementById("editar-01");

    const entradas = {};
    const mensajesError = {};
    const salidas = {};
    CAMPOS.forEach(campo => {
      entradas[campo] = document.getElementById(`${campo}-01`);
      mensajesError[campo] = document.getElementById(`error-${campo}-01`);
      salidas[campo] = document.getElementById(`perfil-${campo}-01`);
    });

    let perfilActual = null;

    function leerFormulario() {
      const datos = {};
      CAMPOS.forEach(campo => { datos[campo] = entradas[campo].value; });
      return datos;
    }

    function escribirFormulario(datos) {
      CAMPOS.forEach(campo => { entradas[campo].value = datos[campo]; });
    }

    function limpiarErrorCampo(campo) {
      mensajesError[campo].textContent = "";
      entradas[campo].removeAttribute("aria-invalid");
    }

    function limpiarErrores() {
      CAMPOS.forEach(limpiarErrorCampo);
    }

    function mostrarResultado(mensaje, tipo) {
      resultado.classList.remove("resultado--exito", "resultado--error");
      resultado.classList.add(`resultado--${tipo}`);
      resultado.textContent = mensaje;
    }

    function limpiarResultado() {
      resultado.classList.remove("resultado--exito", "resultado--error");
      resultado.textContent = "";
    }

    function mostrarErrores(errores) {
      let primerInvalido = null;
      CAMPOS.forEach(campo => {
        if (errores[campo] === "") return;
        mensajesError[campo].textContent = errores[campo];
        entradas[campo].setAttribute("aria-invalid", "true");
        if (!primerInvalido) primerInvalido = entradas[campo];
      });
      if (primerInvalido) primerInvalido.focus();
    }

    function mostrarTarjeta(datos) {
      CAMPOS.forEach(campo => { salidas[campo].textContent = datos[campo]; });
      formulario.hidden = true;
      tarjeta.hidden = false;
    }

    formulario.addEventListener("submit", evento => {
      evento.preventDefault();
      limpiarErrores();

      const { valido, errores, datos } = validarPerfil(leerFormulario());

      if (!valido) {
        mostrarResultado("No se pudo guardar el perfil. Corrija los campos marcados.", "error");
        mostrarErrores(errores);
        return;
      }

      perfilActual = datos;
      escribirFormulario(datos);
      mostrarTarjeta(datos);
      mostrarResultado("Perfil guardado correctamente.", "exito");
      botonEditar.focus();
    });

    CAMPOS.forEach(campo => {
      const limpiar = () => limpiarErrorCampo(campo);
      entradas[campo].addEventListener("input", limpiar);
      entradas[campo].addEventListener("change", limpiar);
    });

    botonEditar.addEventListener("click", () => {
      if (perfilActual) escribirFormulario(perfilActual);
      limpiarErrores();
      limpiarResultado();
      tarjeta.hidden = true;
      formulario.hidden = false;
      entradas.nombre.focus();
    });

    botonLimpiar.addEventListener("click", () => {
      formulario.reset();
      limpiarErrores();
      limpiarResultado();
      entradas.nombre.focus();
    });
  });
})();
