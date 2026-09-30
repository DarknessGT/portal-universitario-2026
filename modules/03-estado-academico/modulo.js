/* Módulo 03 - Estado académico
 * Muestra "Aprobado" o "Reprobado" según el promedio ingresado.
 * La lógica (evaluarEstado) está separada de la interfaz para poder probarla.
 */
(function () {
  'use strict';

  const NOTA_MINIMA = 61;
  const NOTA_MAXIMA = 100;

  /**
   * Valida el promedio y devuelve el estado académico.
   * @param {string|number} entrada Promedio ingresado.
   * @returns {{ok: true, estado: string, promedio: number} | {ok: false, error: string}}
   */
  function evaluarEstado(entrada) {
    if (entrada === null || entrada === undefined) {
      return { ok: false, error: 'Ingrese un promedio.' };
    }
    const texto = String(entrada).trim().replace(',', '.');
    if (texto === '') {
      return { ok: false, error: 'Ingrese un promedio.' };
    }
    if (!/^-?\d+(\.\d+)?$/.test(texto)) {
      return { ok: false, error: 'El promedio debe ser un número, por ejemplo 75 o 75.5.' };
    }
    const promedio = Number(texto);
    if (promedio < 0 || promedio > NOTA_MAXIMA) {
      return { ok: false, error: 'El promedio debe estar entre 0 y 100.' };
    }
    const estado = promedio >= NOTA_MINIMA ? 'Aprobado' : 'Reprobado';
    return { ok: true, estado: estado, promedio: promedio };
  }

  function iniciarInterfaz() {
    const form = document.getElementById('form-03');
    const input = document.getElementById('promedio-03');
    const resultado = document.getElementById('resultado-03');
    if (!form || !input || !resultado) return;

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      const r = evaluarEstado(input.value);
      resultado.classList.remove('aprobado', 'reprobado', 'error');

      if (!r.ok) {
        input.setAttribute('aria-invalid', 'true');
        resultado.classList.add('error');
        resultado.textContent = r.error;
        input.focus();
        return;
      }

      input.removeAttribute('aria-invalid');
      resultado.classList.add(r.estado === 'Aprobado' ? 'aprobado' : 'reprobado');
      resultado.textContent = 'Promedio ' + r.promedio + ': ' + r.estado;
    });
  }

  // Exportación para pruebas en Node; en el navegador se inicia la interfaz.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluarEstado: evaluarEstado, NOTA_MINIMA: NOTA_MINIMA };
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', iniciarInterfaz);
    } else {
      iniciarInterfaz();
    }
  }
})();