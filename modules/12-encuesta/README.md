# Módulo 12 — Encuesta

**Actividad:** Registrar una respuesta y mostrar resultado.

Encuesta con **4 tipos de pregunta**:

| # | Tipo de pregunta | Pregunta | Elemento |
|---|---|---|---|
| 1 | Opción múltiple | ¿Qué servicios del portal utilizas con más frecuencia? | `checkbox` `name="q1-12"` |
| 2 | Opción única | ¿Por qué canal prefieres recibir avisos? | `radio` `name="q2-12"` |
| 3 | Escala 1 a 5 | ¿Qué tan satisfecho estás con el portal? | `radio` `name="q3-12"` |
| 4 | De rellenar | ¿Qué mejorarías del portal? | `textarea#comentario-12` |

## Funcionalidad implementada

- **Registrar respuesta**: valida las 4 preguntas, acumula el voto en memoria y muestra los resultados por tipo.
- **Votar otra vez**: habilita una nueva participación conservando los acumulados.
- **Reiniciar encuesta**: pone todos los conteos en cero y vuelve al estado inicial.
- Los datos viven **en memoria** (se pierden al recargar la página).

## Resultados por tipo

1. **Opción múltiple**: conteo + porcentaje por opción en barras. El % se calcula sobre el **total de respuestas** (cuántas respuestas incluyen esa opción), por lo que la suma puede superar el 100%.
2. **Opción única**: conteo + porcentaje por canal en barras (la suma da 100%).
3. **Escala 1 a 5**: distribución en barras + **promedio** + total de respuestas de escala.
4. **Texto libre**: **contador** de respuestas + **lista** de sugerencias (render con `textContent`, nunca `innerHTML`).

## Identificadores

| Elemento | ID / selector |
|---|---|
| Área del módulo | `#app-12` |
| Formulario | `#encuesta-form-12` |
| Botones | `#enviar-12`, `#nuevo-voto-12`, `#reiniciar-12` |
| Contenedor de resultados | `#resultados-12` (`data-records`) |
| Bloques de resultado | `[data-result="q1\|q2\|q3\|q4"]` |
| Filas de resultado | `[data-option="..."]` con `data-votes` y `data-percent` |
| Promedio de escala | `#promedio-12` (`data-average`), `#escala-total-12` (`data-scale-records`) |
| Contador de textos | `#comentarios-12` (`data-answers`), lista `#lista-comentarios-12` |
| Texto libre | `#comentario-12` (máx. 200 car.), contador `#contador-12` |
| Mensaje de estado | `#resultado-12` |

## Validaciones y controles de seguridad

- Opción múltiple: al menos 1 opción seleccionada.
- Opción única: obligatoria y contra lista blanca (`portal`, `correo`, `sms`).
- Escala: obligatoria y valor dentro de 1–5.
- Texto: opcional, máximo 200 caracteres (clamp en `input` y en el envío), sin `innerHTML`.
- Un solo envío por ciclo: el formulario queda bloqueado tras registrar.
- Porcentajes y promedio calculados sin `NaN` ni `Infinity`.

## Casos de prueba

| ID | Caso | Entrada | Resultado esperado |
|---|---|---|---|
| CP-01 | Enviar incompleto | Solo marcar la opción múltiple, sin opción única ni escala | Mensaje de validación de la opción única y 0 registros |
| CP-02 | Respuesta válida completa | Múltiple: Notas + Calendario; Única: Correo; Escala: 4; Texto: "Excelente portal" | 1 registro, Notas y Calendario al 100%, Correo al 100%, promedio 4.0, 1 texto en la lista, formulario bloqueado |
| CP-03 | Acumular 3 respuestas | 3 respuestas con valores distintos usando "Votar otra vez" | 3 registros, promedio correcto, % acumulados y 2 textos libres (los vacíos no se cuentan) |
| CP-04 | Doble envío | Enviar y volver a enviar (clic + evento `submit`) | Solo 1 registro y mensaje de respuesta ya registrada |
| CP-05 | Reiniciar encuesta | Votar y pulsar "Reiniciar encuesta" | Conteos en 0, promedio vacío, lista de textos vacía, resultados ocultos y formulario habilitado |

## Prueba automatizada

Archivo: `tests/test_12_encuesta.mjs` (los 5 casos automatizados + verificación responsive).

Requisitos: Node.js 18+ y Google Chrome. No requiere `npm install`.

```bash
# desde la raíz del proyecto
node --test tests/test_12_encuesta.mjs
```

Si Chrome está en otra ruta, define la variable `CHROME_BIN`.

## Ejecución local

Abrir `modules/12-encuesta/index.html` en el navegador (Apache en XAMPP o doble clic).
