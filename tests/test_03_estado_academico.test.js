// Pruebas automatizadas del módulo 03 - Estado académico
// Ejecutar desde la raíz del proyecto: node --test
const test = require('node:test');
const assert = require('node:assert');
const { evaluarEstado } = require('../modules/03-estado-academico/modulo.js');

test('CP-03-01: promedio 85 devuelve Aprobado', () => {
  const r = evaluarEstado('85');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.estado, 'Aprobado');
});

test('CP-03-02: promedio 40 devuelve Reprobado', () => {
  const r = evaluarEstado('40');
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.estado, 'Reprobado');
});

test('CP-03-03: límites 61 aprueba y 60.99 reprueba', () => {
  assert.strictEqual(evaluarEstado('61').estado, 'Aprobado');
  assert.strictEqual(evaluarEstado('60.99').estado, 'Reprobado');
});

test('CP-03-04: campo vacío muestra error', () => {
  const r = evaluarEstado('   ');
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.error, 'Ingrese un promedio.');
});

test('CP-03-05: valores fuera de rango o no numéricos muestran error', () => {
  assert.strictEqual(evaluarEstado('150').ok, false);
  assert.strictEqual(evaluarEstado('-5').ok, false);
  assert.strictEqual(evaluarEstado('abc').ok, false);
});