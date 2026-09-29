# Casos de prueba: módulo 15 — Calendario académico

Fuente de datos: [Calendario Académico General UMG](https://umg.edu.gt/calendario), consultado el 28 de septiembre de 2026. Las fechas de otras facultades y posgrados pueden diferir.

| Caso | Pasos | Resultado esperado |
| --- | --- | --- |
| 1. Vista inicial | Abrir `modules/15-calendario/index.html` | Aparece el mes actual si el año es 2026; fuera de 2026 aparece enero. Se ven las actividades del mes y la fuente oficial. |
| 2. Meses y límites | Navegar a enero, después a febrero y finalmente a diciembre | Enero muestra 2 fechas y desactiva «Mes anterior»; febrero tiene 28 días y muestra 3 fechas; diciembre muestra 1 y desactiva «Mes siguiente». |
| 3. Intervalo entre meses | Consultar marzo y abril | El asueto de Semana Santa, del 30 de marzo al 5 de abril, figura en ambos meses y marca los días correspondientes. |
| 4. Categorías sin coincidencias | En abril, seleccionar «Inscripciones» y luego «Evaluaciones» | Primero aparece el mensaje de ausencia de fechas; después aparece una evaluación. |
| 5. Actividades de un día | Ir al 12 de julio y seleccionar el día marcado; luego pulsar «Ver todo el mes» | Se muestran 2 fechas (inscripciones e inicio de clases). El botón anuncia el estado seleccionado y al limpiar vuelve la lista mensual. |
| 6. Diseño móvil y teclado | Abrir a 375 px de ancho, navegar con Tab y activar un día con Enter | El calendario queda en una columna, sin desplazamiento horizontal; los controles son accesibles con teclado y el foco se conserva al seleccionar una fecha. |

Los casos 2–5 y las comprobaciones de diseño móvil y tecla Enter del caso 6 están automatizados con Chrome y Node.js (22+), sin instalar paquetes. La navegación con Tab queda para revisión manual:

```sh
node --test tests/test_15_calendario.mjs
```

Si Chrome no se llama `google-chrome`, indicar su ruta mediante `CHROME_BIN`.
