// MÓDULO 02: Notas
// Actividad: Ingresar 3 notas y calcular promedio.
// Trabaje solamente en este archivo y en index.html de este módulo cuando sea necesario.
// Evite modificar módulos asignados a otros compañeros.

document.addEventListener("DOMContentLoaded", () => {
  console.log("Módulo 02 - Notas: listo para desarrollar.");

  // TODO ESTUDIANTE 02:
  // 1. Implemente la lógica de la funcionalidad.
  // 2. Valide entradas.
  // 3. Muestre resultados claros.
  // 4. Prepare al menos 5 casos de prueba.
  // 5. Automatice al menos 1 caso de prueba.

  const form = document.getElementById("form-02");
  const resultado = document.getElementById("resultado-02");

  // Calcula el promedio
  function calcularPromedio(n1, n2, n3) {
    return (n1 + n2 + n3) / 3;
  }

  // Nota válida: número entre 0 y 100
  function notaValida(texto) {
    const nota = Number(texto);
    return texto.trim() !== "" && !isNaN(nota) && nota >= 0 && nota <= 100;
  }

  // Pruebas automáticas (solo avisan en consola si algo falla)
  console.assert(calcularPromedio(80, 90, 100) === 90, "Caso 1 falló");
  console.assert(calcularPromedio(0, 0, 0) === 0, "Caso 2 falló");
  console.assert(notaValida("101") === false, "Caso 3 falló");
  console.assert(notaValida("") === false, "Caso 4 falló");
  console.assert(notaValida("abc") === false, "Caso 5 falló");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const n1 = document.getElementById("nota1-02").value;
    const n2 = document.getElementById("nota2-02").value;
    const n3 = document.getElementById("nota3-02").value;

    // Validar las 3 notas
    if (!notaValida(n1) || !notaValida(n2) || !notaValida(n3)) {
      resultado.style.color = "#b00020";
      resultado.textContent = "Ingrese 3 notas entre 0 y 100.";
      return;
    }

    // Mostrar el promedio
    const promedio = calcularPromedio(Number(n1), Number(n2), Number(n3));
    resultado.style.color = "#1b5e20";
    resultado.textContent = "Promedio: " + promedio.toFixed(2);
  });
});