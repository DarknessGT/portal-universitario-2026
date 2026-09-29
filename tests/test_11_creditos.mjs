import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

// modulo.js conserva compatibilidad con el navegador y expone solo la lógica para Node.
const require = createRequire(import.meta.url);
const {
  normalizarNombre,
  validarCurso,
  calcularTotalCreditos
} = require("../modules/11-creditos/modulo.js");

test("CP-11-01: acepta un curso y créditos válidos", () => {
  const resultado = validarCurso("Programación I", "4", []);

  assert.deepEqual(resultado, {
    curso: { nombre: "Programación I", creditos: 4 }
  });
});

test("CP-11-02: calcula la suma de varios cursos", () => {
  const cursos = [
    { nombre: "Programación I", creditos: 4 },
    { nombre: "Matemática I", creditos: 5 }
  ];

  assert.equal(calcularTotalCreditos(cursos), 9);
});

test("CP-11-03: rechaza un nombre vacío", () => {
  const resultado = validarCurso("   ", "4", []);

  assert.equal(resultado.error, "Ingrese el nombre del curso.");
});

test("CP-11-04: rechaza créditos decimales", () => {
  const resultado = validarCurso("Física I", "2.5", []);

  assert.equal(resultado.error, "Los créditos deben ser un número entero.");
});

test("CP-11-05: rechaza nombres duplicados sin distinguir mayúsculas o espacios", () => {
  const cursos = [{ nombre: "Programación I", creditos: 4 }];
  const resultado = validarCurso("  programación   i ", "4", cursos);

  assert.equal(resultado.error, "Este curso ya fue registrado.");
});

test("aplica los límites permitidos para créditos", () => {
  assert.match(validarCurso("Curso A", "0", []).error, /entre 1 y 20/);
  assert.match(validarCurso("Curso B", "21", []).error, /entre 1 y 20/);
  assert.deepEqual(validarCurso("Curso C", "20", []).curso, {
    nombre: "Curso C",
    creditos: 20
  });
});

test("rechaza texto y notación científica como créditos", () => {
  assert.match(validarCurso("Curso A", "cuatro", []).error, /número entero/);
  assert.match(validarCurso("Curso B", "1e1", []).error, /número entero/);
});

test("normaliza espacios sin alterar el contenido del nombre", () => {
  assert.equal(normalizarNombre("  Seguridad   Informática  "), "Seguridad Informática");
  assert.equal(normalizarNombre("<script>alert(1)</script>"), "<script>alert(1)</script>");
});

test("un registro vacío tiene cero créditos", () => {
  assert.equal(calcularTotalCreditos([]), 0);
});
