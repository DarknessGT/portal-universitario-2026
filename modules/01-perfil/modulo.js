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

  const CLAVE_ALMACEN = "portal2026.perfil01";

  // Solo texto o número; cualquier otro tipo (null, arreglos, objetos) se trata como vacío
  function normalizar(valor) {
    if (typeof valor !== "string" && typeof valor !== "number") return "";
    return String(valor).normalize("NFC").trim().replace(/\s+/g, " ");
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

  // Devuelve "dd/mm/aaaa hh:mm" (es-GT) o "" si la fecha no es una fecha ISO válida
  function formatearFechaActualizacion(fechaIso) {
    if (typeof fechaIso !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fechaIso)) return "";
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return "";

    const partes = {};
    new Intl.DateTimeFormat("es-GT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(fecha).forEach(parte => { partes[parte.type] = parte.value; });

    return `${partes.day}/${partes.month}/${partes.year} ${partes.hour}:${partes.minute}`;
  }

  // Acceso a localStorage: cualquier fallo (modo privado, cuota, permisos) se reporta sin lanzar
  function leerAlmacen() {
    try {
      return { disponible: true, texto: window.localStorage.getItem(CLAVE_ALMACEN) };
    } catch (error) {
      return { disponible: false, texto: null };
    }
  }

  function escribirAlmacen(registro) {
    try {
      window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(registro));
      return true;
    } catch (error) {
      return false;
    }
  }

  function borrarAlmacen() {
    try {
      window.localStorage.removeItem(CLAVE_ALMACEN);
      return true;
    } catch (error) {
      return false;
    }
  }

  function interpretarJson(texto) {
    try {
      return JSON.parse(texto);
    } catch (error) {
      return null;
    }
  }

  const AVISO_SIN_ALMACEN = "Aviso: el navegador no permite guardar datos. El perfil se conservará solo mientras esta página esté abierta.";

  document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-perfil-01");
    const tarjeta = document.getElementById("tarjeta-01");
    const resultado = document.getElementById("resultado-01");
    const botonLimpiar = document.getElementById("limpiar-01");
    const botonEditar = document.getElementById("editar-01");
    const botonEliminar = document.getElementById("eliminar-01");
    const salidaActualizado = document.getElementById("perfil-actualizado-01");

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
      resultado.classList.remove("resultado--exito", "resultado--error", "resultado--aviso");
      resultado.classList.add(`resultado--${tipo}`);
      resultado.textContent = mensaje;
    }

    function limpiarResultado() {
      resultado.classList.remove("resultado--exito", "resultado--error", "resultado--aviso");
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

    function mostrarTarjeta(datos, fechaIso) {
      CAMPOS.forEach(campo => { salidas[campo].textContent = datos[campo]; });
      const fecha = formatearFechaActualizacion(fechaIso);
      salidaActualizado.textContent = fecha ? `Actualizado: ${fecha}` : "";
      salidaActualizado.hidden = !fecha;
      formulario.hidden = true;
      tarjeta.hidden = false;
    }

    function ocultarTarjeta() {
      CAMPOS.forEach(campo => { salidas[campo].textContent = ""; });
      salidaActualizado.textContent = "";
      salidaActualizado.hidden = true;
      tarjeta.hidden = true;
      formulario.hidden = false;
    }

    // Un registro corrupto o inválido se descarta sin mostrar errores al usuario
    function cargarPerfilGuardado() {
      const { disponible, texto } = leerAlmacen();
      if (!disponible) {
        mostrarResultado(AVISO_SIN_ALMACEN, "aviso");
        return;
      }
      if (texto === null) return;

      const registro = interpretarJson(texto);
      const { valido, datos } = validarPerfil(registro);
      if (!valido) {
        if (!borrarAlmacen()) mostrarResultado(AVISO_SIN_ALMACEN, "aviso");
        return;
      }

      perfilActual = datos;
      escribirFormulario(datos);
      mostrarTarjeta(datos, registro.actualizado);
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

      const actualizado = new Date().toISOString();
      perfilActual = datos;
      escribirFormulario(datos);
      mostrarTarjeta(datos, actualizado);

      if (escribirAlmacen({ ...datos, actualizado })) {
        mostrarResultado("Perfil guardado correctamente.", "exito");
      } else {
        mostrarResultado("Perfil guardado solo en esta sesión: el navegador no permitió almacenarlo.", "aviso");
      }
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

    botonEliminar.addEventListener("click", () => {
      const borrado = borrarAlmacen();
      perfilActual = null;
      formulario.reset();
      limpiarErrores();
      ocultarTarjeta();

      if (borrado) {
        mostrarResultado("Perfil eliminado.", "exito");
      } else {
        mostrarResultado("Perfil eliminado de esta sesión, pero el navegador no permitió borrarlo del almacenamiento.", "aviso");
      }
      entradas.nombre.focus();
    });

    cargarPerfilGuardado();
  });
})();
