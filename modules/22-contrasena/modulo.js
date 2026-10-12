// MÓDULO 22: Contraseña
// Actividad: Evaluar requisitos básicos de una contraseña.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// Evite modificar módulos asignados a otros compañeros.

document.addEventListener("DOMContentLoaded", () => {
  console.log("Módulo 22 - Contraseña: listo para desarrollar.");

  // TODO ESTUDIANTE 22:
  // 1. Implemente la lógica de la funcionalidad.
  // 2. Valide entradas.
  // 3. Muestre resultados claros.
  // 4. Prepare al menos 5 casos de prueba.
  // 5. Automatice al menos 1 caso de prueba.
});

// Módulo 22 - Validador de contraseñas
(function () {
  'use strict';

  const COMUNES = [
    '123456', '12345678', '123456789', 'password', 'contraseña', 'contrasena',
    'qwerty', 'qwerty123', 'abc123', '111111', '000000', 'admin', 'admin123',
    'letmein', 'iloveyou', 'welcome', 'monkey', 'dragon', 'football',
    'password1', 'p@ssw0rd', 'passw0rd', '1234', '12345', '123123', 'guatemala'
  ];

  const REQUISITOS = {
    longitud:  (p) => p.length >= 8,
    mayuscula: (p) => /[A-ZÁÉÍÓÚÑÜ]/.test(p),
    minuscula: (p) => /[a-záéíóúñü]/.test(p),
    numero:    (p) => /\d/.test(p),
    simbolo:   (p) => /[^A-Za-z0-9ÁÉÍÓÚÑÜáéíóúñü\s]/.test(p),
    espacios:  (p) => p.length > 0 && p === p.trim(),
    comun:     (p) => p.length > 0 && !COMUNES.includes(p.toLowerCase())
  };

  const NIVELES = [
    { min: 0, texto: 'Muy débil', clase: 'bg-danger',  ancho: 20 },
    { min: 3, texto: 'Débil',     clase: 'bg-warning', ancho: 40 },
    { min: 5, texto: 'Media',     clase: 'bg-info',    ancho: 60 },
    { min: 7, texto: 'Fuerte',    clase: 'bg-success', ancho: 80 },
    { min: 9, texto: 'Muy fuerte', clase: 'bg-success', ancho: 100 }
  ];

  const input    = document.getElementById('password-22');
  const toggle   = document.getElementById('toggle-22');
  const barra    = document.getElementById('barra-22');
  const progress = document.getElementById('progress-22');
  const nivelTxt = document.getElementById('nivel-22');
  const lista    = document.getElementById('requisitos-22');
  const btn      = document.getElementById('validar-22');
  const resultado = document.getElementById('resultado-22');

  if (!input || !btn) return;

  // Evalúa la contraseña y devuelve cumplimiento, puntaje y nivel
  function evaluar(p) {
    const cumple = {};
    let puntos = 0;

    Object.keys(REQUISITOS).forEach((clave) => {
      cumple[clave] = REQUISITOS[clave](p);
      if (cumple[clave]) puntos += 1;
    });

    // Puntos extra por longitud
    if (p.length >= 12) puntos += 1;
    if (p.length >= 16) puntos += 1;

    // Penaliza repeticiones (aaaa) y secuencias (1234, abcd)
    if (/(.)\1{2,}/.test(p)) puntos -= 1;
    if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|qwer|asdf)/i.test(p)) puntos -= 1;

    // Una contraseña vacía o común nunca pasa de "Muy débil"/"Débil"
    if (!p) puntos = 0;
    if (p && !cumple.comun) puntos = Math.min(puntos, 2);

    puntos = Math.max(0, Math.min(puntos, 9));

    let nivel = NIVELES[0];
    NIVELES.forEach((n) => { if (puntos >= n.min) nivel = n; });

    const basicos = ['longitud', 'mayuscula', 'minuscula', 'numero', 'simbolo', 'espacios', 'comun'];
    const aprobada = basicos.every((k) => cumple[k]);

    return { cumple, puntos, nivel, aprobada };
  }

  // Actualiza checklist, barra y texto de nivel
  function pintar(p) {
    const r = evaluar(p);

    lista.querySelectorAll('li').forEach((li) => {
      const ok = r.cumple[li.dataset.req];
      li.classList.toggle('text-success', ok);
      li.classList.toggle('text-body-secondary', !ok);
      li.querySelector('.icono').textContent = ok ? '✓' : '✗';
    });

    barra.className = 'progress-bar ' + (p ? r.nivel.clase : '');
    barra.style.width = p ? r.nivel.ancho + '%' : '0%';
    progress.setAttribute('aria-valuenow', p ? r.nivel.ancho : 0);
    nivelTxt.textContent = p ? 'Fortaleza: ' + r.nivel.texto : 'Escribe para evaluar';

    return r;
  }

  // Mensaje final con lo que falta
  function mostrarResultado(p) {
    const r = pintar(p);

    if (!p) {
      resultado.textContent = 'Escribe una contraseña para validarla.';
      resultado.className = 'result text-danger';
      return r;
    }

    if (r.aprobada) {
      const extra = p.length < 12 ? ' Para mayor seguridad, usa 12 caracteres o más.' : '';
      resultado.textContent = 'Contraseña válida. Nivel: ' + r.nivel.texto + '.' + extra;
      resultado.className = 'result text-success';
    } else {
      const nombres = {
        longitud: 'al menos 8 caracteres',
        mayuscula: 'una mayúscula',
        minuscula: 'una minúscula',
        numero: 'un número',
        simbolo: 'un símbolo',
        espacios: 'quitar los espacios al inicio o al final',
        comun: 'evitar contraseñas comunes'
      };
      const faltan = Object.keys(nombres).filter((k) => !r.cumple[k]).map((k) => nombres[k]);
      resultado.textContent = 'Contraseña no válida. Falta: ' + faltan.join(', ') + '.';
      resultado.className = 'result text-danger';
    }
    return r;
  }

  // Eventos
  input.addEventListener('input', () => pintar(input.value));
  btn.addEventListener('click', () => mostrarResultado(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') mostrarResultado(input.value);
  });

  toggle.addEventListener('click', () => {
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Mostrar' : 'Ocultar';
    toggle.setAttribute('aria-pressed', String(!visible));
  });

  // Estado inicial
  pintar('');

  // Función global para facilitar pruebas automatizadas
  window.validarContrasena22 = function (p) {
    return evaluar(String(p || ''));
  };
})();