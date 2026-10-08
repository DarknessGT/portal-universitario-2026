# Casos de prueba — módulo 24

El módulo genera un resumen a partir de datos **introducidos manualmente**. Los identificadores de commit, el enlace del pipeline y el nombre del revisor usados abajo son datos de prueba; no representan evidencia real del proyecto.

## Preparación

1. Abrir `modules/24-reporte/index.html` en Chrome.
2. Salvo la modificación indicada en cada caso, usar estos datos de prueba:
   - Funcionalidad: «Generar reporte de mi entrega».
   - Commits: `a123456`, `b123456`, `c123456`.
   - Casos 1 a 5: «Caso documentado 1» a «Caso documentado 5», todos «Aprobada».
   - Prueba automatizada: «Aprobada».
   - Pipeline: «Exitoso»; enlace: `https://github.com/ejemplo/acciones/123`.
   - Revisión: «Aprobada»; revisor: «Compañero revisor».

| Caso | Entrada y pasos | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| 1. Datos completos | Introducir todos los datos de preparación y pulsar «Generar reporte». | Aparece el resumen con 5 pruebas aprobadas y estado de requisitos registrados como completos; no hay errores. | **Aprobado:** el resumen, el conteo y el estado aparecen; no hay errores. |
| 2. Nombre vacío | Introducir los datos de preparación, borrar el nombre de la funcionalidad y generar. | Se indica que falta el nombre y no aparece un reporte. | **Aprobado:** aparece el mensaje de nombre obligatorio y el reporte queda vacío. |
| 3. Menos de tres commits | Introducir los datos de preparación, borrar el commit 3 y generar. | Se indica que falta el commit 3 y no aparece un reporte. | **Aprobado:** aparece el mensaje del commit faltante y el reporte queda vacío. |
| 4. Commit inválido | Introducir los datos de preparación, sustituir el commit 3 por `no-es-hex` y generar. | Se indica que el identificador debe tener de 7 a 40 caracteres hexadecimales; no aparece un reporte. | **Aprobado:** aparece el mensaje de formato y el reporte queda vacío. |
| 5. Caso sin datos | Introducir los datos de preparación, borrar el nombre del caso 5 y dejar su resultado en «Selecciona»; generar. | Se solicitan el nombre y el resultado del caso 5; no aparece un reporte. | **Aprobado:** aparecen ambos mensajes y el reporte queda vacío. |

## Ejecución automatizada

Estos cinco casos están automatizados en `test_reporte.py` con Selenium y Chrome. Desde la raíz del repositorio:

```bash
python -m pip install selenium
python -m unittest discover -s modules/24-reporte -p "test_*.py" -v
```

Resultado local observado: **5 pruebas ejecutadas, 5 aprobadas**. La prueba automatizada comprueba el comportamiento del navegador; no sustituye la evidencia de una ejecución de CI.

## Evidencia pendiente de la entrega

Cuando existan commits reales, una ejecución del pipeline y la aprobación de un compañero, registrar sus referencias en el formulario y adjuntarlas al pull request. Si el repositorio todavía no tiene un pipeline común, coordinar su configuración con el docente o responsable del proyecto sin modificar archivos fuera de este módulo.
