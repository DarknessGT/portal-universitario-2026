const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  buscarLibros,
  librosDemostracion
} = require("../modules/08-biblioteca/modulo.js");

describe("Módulo 08 - Biblioteca", () => {
  it("encuentra un título completo", () => {
    assert.deepEqual(buscarLibros(librosDemostracion, "Historia universal"), [
      "Historia universal"
    ]);
  });

  it("acepta coincidencias parciales sin distinguir mayúsculas ni espacios externos", () => {
    assert.deepEqual(buscarLibros(librosDemostracion, "  PROGRAMACIÓN  "), [
      "Introducción a la programación"
    ]);
  });

  it("encuentra títulos aunque la consulta no incluya tildes", () => {
    assert.deepEqual(buscarLibros(librosDemostracion, "matematica"), [
      "Matemática para principiantes"
    ]);
  });

  it("devuelve una lista vacía cuando no hay coincidencias", () => {
    assert.deepEqual(buscarLibros(librosDemostracion, "astronomía"), []);
  });

  it("devuelve una lista vacía para una consulta vacía o con solo espacios", () => {
    assert.deepEqual(buscarLibros(librosDemostracion, ""), []);
    assert.deepEqual(buscarLibros(librosDemostracion, "   "), []);
  });
});
