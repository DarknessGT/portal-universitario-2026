// MÓDULO 21: Validación
// Actividad: Validar datos de un formulario de inscripción.

const CARRERAS_21 = ["sistemas", "industrial", "administracion", "derecho"];

// Lógica pura: recibe los datos y devuelve { valido, errores }.
// No toca el DOM, así se puede probar sola.
function validarInscripcion(datos, hoy = new Date()) {
  const errores = {};
  const nombre = (datos.nombre || "").trim();
  const carne = (datos.carne || "").trim();
  const correo = (datos.correo || "").trim();
  const telefono = (datos.telefono || "").trim();
  const nacimiento = (datos.nacimiento || "").trim();
  const carrera = (datos.carrera || "").trim();
  const semestre = String(datos.semestre ?? "").trim();

  if (!nombre) errores.nombre = "El nombre es obligatorio.";
  else if (nombre.length < 2 || nombre.length > 80) errores.nombre = "Debe tener entre 2 y 80 caracteres.";
  else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(nombre))
    errores.nombre = "Ingrese un nombre válido, solo letras.";

  const digitosCarne = carne.replace(/-/g, "").length;
  if (!carne) errores.carne = "El carné es obligatorio.";
  else if (!/^\d+(-\d+)*$/.test(carne) || digitosCarne < 9 || digitosCarne > 12)
    errores.carne = "El carné debe tener entre 9 y 12 dígitos (se permiten guiones).";

  if (!correo) errores.correo = "El correo es obligatorio.";
  else if (correo.length > 100 || !/^[^\s@<>]+@[^\s@<>]+\.[a-zA-Z]{2,}$/.test(correo))
    errores.correo = "Formato de correo no válido.";

  if (!telefono) errores.telefono = "El teléfono es obligatorio.";
  else if (!/^\d{8}$/.test(telefono)) errores.telefono = "Debe tener exactamente 8 dígitos.";

  if (!nacimiento) errores.nacimiento = "La fecha de nacimiento es obligatoria.";
  else {
    const f = new Date(nacimiento + "T00:00:00");
    if (isNaN(f.getTime())) errores.nacimiento = "Fecha no válida.";
    else if (f > hoy) errores.nacimiento = "La fecha no puede ser futura.";
    else {
      let edad = hoy.getFullYear() - f.getFullYear();
      const m = hoy.getMonth() - f.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) edad--;
      if (edad < 16) errores.nacimiento = "Debe tener al menos 16 años.";
      else if (edad > 100) errores.nacimiento = "Revise la fecha ingresada.";
    }
  }

  if (!CARRERAS_21.includes(carrera)) errores.carrera = "Seleccione una carrera válida.";

  if (!/^\d+$/.test(semestre) || Number(semestre) < 1 || Number(semestre) > 10)
    errores.semestre = "El semestre debe ser un número entre 1 y 10.";

  if (datos.terminos !== true) errores.terminos = "Debe aceptar los términos.";

  return { valido: Object.keys(errores).length === 0, errores };
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-21");
  const resultado = document.getElementById("resultado-21");
  if (!form) return;

  // Teléfono: solo dígitos. Carné: solo dígitos y guiones.
  form.telefono.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
  form.carne.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^\d-]/g, "");
  });

  const campos = ["nombre", "carne", "correo", "telefono", "nacimiento", "carrera", "semestre", "terminos"];

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const datos = {
      nombre: form.nombre.value,
      carne: form.carne.value,
      correo: form.correo.value,
      telefono: form.telefono.value,
      nacimiento: form.nacimiento.value,
      carrera: form.carrera.value,
      semestre: form.semestre.value,
      terminos: form.terminos.checked
    };

    const { valido, errores } = validarInscripcion(datos);

    campos.forEach((c) => {
      const input = document.getElementById(`${c}-21`);
      const span = document.getElementById(`error-${c}-21`);
      // textContent (no innerHTML) para evitar inyección de HTML
      span.textContent = errores[c] || "";
      input.classList.toggle("invalido", Boolean(errores[c]));
    });

    if (valido) {
      resultado.className = "result ok";
      resultado.textContent = `Inscripción válida: ${datos.nombre.trim()} (${datos.carne.trim()}).`;
      form.reset();
    } else {
      resultado.className = "result fallo";
      resultado.textContent = `Hay ${Object.keys(errores).length} campo(s) con errores.`;
    }
  });
});

// Permite importar la función desde Node para pruebas unitarias
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validarInscripcion };
}