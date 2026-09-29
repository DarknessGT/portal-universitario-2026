# Módulo 19 — Contador de visitas

## Funcionalidad

Cada apertura o recarga de la página del módulo registra una visita en el navegador.
Se muestran el total, la fecha inicial, la visita anterior y las últimas 10 visitas
(incluida la actual), en orden de registro descendente. No existe botón de reinicio.

Se conservan los estilos del portal y los archivos comunes. Solo se modifican
los dos archivos de aplicación del módulo 19; las pruebas y evidencias llevan
el número 19 para evitar conflictos con otros estudiantes.

El registro pertenece al mismo origen y perfil del navegador. Un servidor local,
GitHub Pages y otro navegador mantienen conteos independientes. Borrar los datos
del sitio elimina el registro. No es un contador global, de visitantes únicos
ni una herramienta de analítica. Las aperturas simultáneas en distintas pestañas
no tienen garantía de incremento atómico con localStorage.

## Probar manualmente

Desde la raíz del repositorio, con Python 3 instalado:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abrir http://127.0.0.1:8765/modules/19-contador/index.html y recargar.
Usar siempre el mismo origen y puerto para verificar persistencia.
Detener el servidor con Ctrl+C. Se recomienda HTTP local para que el comportamiento
del almacenamiento sea equivalente al del sitio publicado.

## Contrato de almacenamiento

Clave exclusiva: `portal-universitario-2026:19:visitas`.

```json
{
  "version": 1,
  "total": 1,
  "fechaInicio": "2026-01-01T12:00:00.000Z",
  "ultimaVisita": "2026-01-01T12:00:00.000Z",
  "historial": ["2026-01-01T12:00:00.000Z"]
}
```

- Las fechas se guardan en ISO UTC y se muestran con `es-GT` en la zona horaria del navegador.
- `fechaInicio` permanece fija; `ultimaVisita` y el primer elemento del historial corresponden a la carga guardada más reciente.
- La interfaz calcula la visita anterior a partir del registro leído antes de sumar la visita actual.
- El historial tiene exactamente `min(total, 10)` entradas. Hasta 10 visitas, su último elemento coincide con la fecha inicial.
- El total debe ser un entero seguro no negativo. Un registro vacío válido tiene total 0, ambas fechas nulas e historial vacío.
- Se validan la versión, tipos, fechas ISO y coherencia del historial. Un registro corrupto se sustituye por la primera visita y se informa al usuario.
- Al alcanzar `Number.MAX_SAFE_INTEGER`, se conserva el registro y se informa que la nueva visita no se sumó.
- Los errores de almacenamiento no se muestran como guardados exitosos. Si falla la escritura, se conserva visualmente el registro anterior disponible.
- La secuencia de aperturas determina el orden del historial, incluso si cambia el reloj del dispositivo.
- No se usan variables globales ni se borran claves de otros módulos. Otro módulo puede leer este contrato, pero debe coordinarse cualquier escritura.

## Pruebas automatizadas

Requiere Python 3.10 o superior y Chrome. Selenium administra el controlador;
la primera ejecución puede necesitar Internet. También se admite Edge.

```powershell
python -m pip install -r tests/requirements_19.txt
python -B tests/test_19_contador.py
```

Para usar Edge:

```powershell
$env:CONTADOR_BROWSER = "edge"
python -B tests/test_19_contador.py
```

Opciones: `CHROME_BINARY` para un Chrome en una ruta alternativa,
`CHROMEDRIVER` o `EDGEDRIVER` para un controlador compatible instalado,
y `SCREENSHOT_DIR` para guardar las capturas de escritorio y móvil.
Las pruebas levantan su propio servidor en un puerto libre y usan un perfil temporal
que eliminan al terminar. No utilizan el perfil personal ni el conteo de la prueba manual.
No agregan dependencias al código de aplicación.

## Casos documentados

Precondición común: servidor HTTP activo, JavaScript habilitado y perfil de pruebas aislado.

| Caso | Preparación y pasos | Resultado esperado |
| --- | --- | --- |
| 01. Primera visita | Eliminar solo la clave del contador y abrir el módulo. | Total 1; fechas coherentes; una entrada; mensaje de primera visita; sin botón de reinicio. |
| 02. Recarga y fechas | Preparar un registro conocido; abrir y recargar. | Total 2 y luego 3; fecha inicial constante; visita anterior corresponde a la carga previa. |
| 03. Regreso al portal | Abrir, pulsar Volver al portal y entrar por la tarjeta 19. | La portada no incrementa; al volver al módulo, total 2. |
| 04. Historial | Abrir y recargar 11 veces. | Total 12; solo 10 entradas, coincidentes con el almacenamiento y en orden de registro. |
| 05. Datos corruptos | Probar JSON roto, versión/tipos incorrectos, negativos, decimales, desbordamiento y fechas/historial inválidos. | Nuevo total 1 y aviso de recuperación; página funcional. |
| 06. Lectura bloqueada | Simular un SecurityError al acceder al almacenamiento. | Aviso; sin conteo ficticio; enlace de regreso operativo. |
| 07. Escritura bloqueada | Con total 2, simular QuotaExceededError al escribir. | Total previo 2 intacto; aviso de visita no guardada. |
| 08. Escritura bloqueada sin datos | Bloquear escritura en un perfil sin conteo. | No se presenta 1 como guardado; clave ausente y aviso. |
| 09. Aislamiento | Crear una clave ajena en el perfil temporal y recuperar un contador corrupto. | La clave ajena conserva su valor. |
| 10. Límite seguro | Preparar el máximo entero seguro con historial válido. | Registro sin cambios y aviso de límite. |
| 11. Reapertura | Abrir, cerrar el navegador y reabrir con el mismo perfil. | Total 2; fecha inicial e historial conservados. |
| 12. Móvil y consola | Emular una vista de 390 px y abrir el módulo. | Total visible, sin desbordamiento horizontal ni errores JavaScript de consola. |

Resultados de la ejecución local: ver [evidencias](evidencias_19/resultado.md).

## Integración pendiente

Los cambios se preparan en una rama local provisional `est19-contador`.
Cuando se asigne la rama oficial, trasladar los commits según el flujo del equipo.
Antes del PR, actualizar la base y ejecutar las pruebas nuevamente si hay cambios relevantes.

La revisión de un compañero, el push, el PR y la evidencia del pipeline quedan
pendientes de la coordinación del equipo. Esta suite local no sustituye la evidencia de CI.
El pipeline futuro puede instalar `requirements_19.txt` y ejecutar el mismo comando;
no se modifican workflows compartidos por anticipado.
