# Casos de prueba — Módulo 10: Cursos

## CP10-01 — Registrar curso correctamente

- **Objetivo:** confirmar que el sistema registra y muestra un curso con todos los datos válidos.
- **Precondiciones:** módulo 10 cargado, almacenamiento de cursos vacío y formulario vacío.
- **Datos:** código `PROG-101`; nombre `Programación I`; docente `Juan Pérez`; horario `Lunes 08:00 - 10:00`.
- **Pasos:**
  1. Ingresar los cuatro datos indicados.
  2. Presionar **Registrar curso**.
- **Resultado esperado:** se muestra un mensaje de éxito, aparece una fila con los cuatro datos y el contador indica `Cursos asignados: 1`.

## CP10-02 — Código obligatorio

- **Objetivo:** impedir que se registren cursos sin código.
- **Precondiciones:** módulo cargado, sin cursos registrados y formulario vacío.
- **Datos:** código vacío; nombre `Programación I`.
- **Pasos:**
  1. Dejar vacío el campo **Código del curso**.
  2. Ingresar `Programación I` en el nombre.
  3. Presionar **Registrar curso**.
- **Resultado esperado:** no se crea ningún registro y se comunica que el código del curso es obligatorio.

## CP10-03 — Nombre obligatorio

- **Objetivo:** impedir que se registren cursos sin nombre.
- **Precondiciones:** módulo cargado, sin cursos registrados y formulario vacío.
- **Datos:** código `PROG-101`; nombre vacío.
- **Pasos:**
  1. Ingresar `PROG-101` en el código.
  2. Dejar vacío el campo **Nombre del curso**.
  3. Presionar **Registrar curso**.
- **Resultado esperado:** no se crea ningún registro y se comunica que el nombre del curso es obligatorio.

## CP10-04 — Curso duplicado

- **Objetivo:** verificar que el código de un curso sea único, incluso si se escribe con minúsculas.
- **Precondiciones:** módulo cargado y curso `PROG-101` registrado previamente.
- **Datos:** código `prog-101`; nombre `Programación I - grupo B`.
- **Pasos:**
  1. Ingresar los datos del segundo curso usando el código `prog-101`.
  2. Presionar **Registrar curso**.
- **Resultado esperado:** el código se normaliza a `PROG-101`, el segundo registro se rechaza y se informa que ya existe un curso con ese código.

## CP10-05 — Persistencia entre recargas

- **Objetivo:** comprobar que la lista se recupera desde `localStorage` después de recargar.
- **Precondiciones:** módulo cargado, un curso válido registrado y almacenamiento local disponible.
- **Datos:** curso `PROG-101` registrado.
- **Pasos:**
  1. Registrar el curso `PROG-101`.
  2. Recargar la página del módulo.
- **Resultado esperado:** el curso continúa visible y el contador conserva la cantidad registrada.

## Ejecución de la prueba automatizada

La prueba `test_10_cursos.js` automatiza CP10-01 con Selenium. Desde la raíz del repositorio, con una instalación funcional de Node.js y npm:

1. Instalar la dependencia aislada de pruebas: `npm --prefix tests install`.
2. Servir el repositorio, por ejemplo: `python -m http.server 8000`.
3. En otra terminal ejecutar: `npm --prefix tests run test:cursos`.

La prueba usa `http://127.0.0.1:8000` por defecto. Para un servidor distinto, defina `PORTAL_URL`, por ejemplo en PowerShell: `$env:PORTAL_URL='http://127.0.0.1:8080'; npm --prefix tests run test:cursos`.
