# Casos de prueba — Módulo 03: Estado académico

## Preparación

1. Abra `modules/03-estado-academico/index.html` en un navegador.
2. Verifique que el campo **Promedio del estudiante** esté vacío antes de cada caso.
3. Nota mínima para aprobar: **61** (constante `NOTA_MINIMA` en `modulo.js`).

## Casos diseñados

| Identificación | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| CP-03-01 | Promedio aprobatorio | Promedio: `85` | Se muestra `Promedio 85: Aprobado` en color verde. |
| CP-03-02 | Promedio reprobatorio | Promedio: `40` | Se muestra `Promedio 40: Reprobado` en color naranja. |
| CP-03-03 | Valores límite de la nota mínima | Promedio: `61` y luego `60.99` | Con `61` se muestra `Aprobado`; con `60.99` se muestra `Reprobado`. |
| CP-03-04 | Rechazar campo vacío | Promedio vacío o solo espacios | Se muestra `Ingrese un promedio.` en rojo y el campo queda marcado como inválido. |
| CP-03-05 | Rechazar valores fuera de rango o no numéricos | Promedio: `150`, `-5` y `abc` | Con `150` y `-5` se muestra `El promedio debe estar entre 0 y 100.`; con `abc` se muestra `El promedio debe ser un número, por ejemplo 75 o 75.5.` |

## Prueba automatizada

Los cinco casos están automatizados en `tests/test_03_estado_academico.test.js` y prueban la función `evaluarEstado` de `modulo.js`.

Para ejecutarlos, desde la raíz del proyecto:

```bash
node --test
```

Resultado esperado: `# pass 5` y `# fail 0`.

## Identificadores para Selenium

- Campo de promedio: `#promedio-03`
- Botón de evaluación: `#btn-evaluar-03`
- Resultado: `#resultado-03`
