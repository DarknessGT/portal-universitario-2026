# Casos de Prueba — Módulo 17: FAQ (Preguntas Frecuentes Desplegables)

**Proyecto:** Portal de Servicios Universitarios  
**Curso:** Aseguramiento de la Calidad de Software  
**Estudiante:** Marcos Molina (Estudiante 17)  
**Módulo:** 17 — FAQ  
**Fecha:** 28 de Septiembre de 2026  

---

## 1. Resumen Ejecutivo de Pruebas

El objetivo de este plan de pruebas es validar exhaustivamente el comportamiento funcional, la accesibilidad, las validaciones de entrada de datos y los controles de seguridad (DevSecOps) del **Módulo 17 - FAQ** correspondiente al Portal de Servicios Universitarios.

Se han diseñado **5 casos de prueba formalmente estructurados** aplicando técnicas estándar de la industria (Partición de Clases de Equivalencia, Análisis de Valores Límite y Pruebas de Inyección de Seguridad).

---

## 2. Matriz de Casos de Prueba

| ID | Nombre del Caso de Prueba | Tipo de Prueba | Técnica Aplicada | Resultado Esperado |
|---|---|---|---|---|
| **CP-17-01** | Despliegue y contracción interactiva del acordeón | Funcional / Accesibilidad | Partición de Equivalencia | El panel de respuesta alterna su visibilidad (`hidden` / `aria-expanded`). |
| **CP-17-02** | Búsqueda dinámica en tiempo real y filtro por categorías | Funcional / Búsqueda | Clases de Equivalencia | Filtra preguntas por coincidencia de texto y categoría sin recarga. |
| **CP-17-03** | Registro exitoso de nueva consulta válida | Funcional / Positiva | Valor Normal / Clases Válidas | Registra la nueva FAQ, la inserta desplegada al inicio y da feedback de éxito. |
| **CP-17-04** | Validación de campos obligatorios y formatos incorrectos | Negativa / Validación | Valores Límite / Clases Inválidas | Bloquea el envío y muestra mensajes de error descriptivos por campo. |
| **CP-17-05** | Sanitización y prevención contra inyección XSS | Seguridad (DevSecOps) | Prueba de Seguridad / Inyección | Escapa etiquetas HTML y scripts, mostrándolos como texto plano sin ejecución. |

---

## 3. Especificación Detallada de los Casos de Prueba

### Caso de Prueba CP-17-01: Despliegue y contracción interactiva del acordeón
- **Objetivo:** Verificar que el estudiante pueda expandir una pregunta para leer su respuesta y colapsarla nuevamente mediante eventos de clic y soporte de teclado.
- **Precondiciones:** La página `modules/17-faq/index.html` debe estar cargada en el navegador.
- **Datos de Entrada:** Clic sobre el botón `#faq-btn-1`.
- **Procedimiento de Ejecución:**
  1. Localizar el primer elemento del acordeón `#faq-item-1`.
  2. Verificar que inicialmente el panel `#faq-ans-1` tiene el atributo `hidden` y `#faq-btn-1` tiene `aria-expanded="false"`.
  3. Ejecutar un clic sobre `#faq-btn-1`.
  4. Verificar que se remueve el atributo `hidden`, se agrega la clase `active` y `aria-expanded` pasa a `"true"`.
  5. Realizar un segundo clic sobre `#faq-btn-1`.
  6. Comprobar que vuelve a tener `hidden` y `aria-expanded="false"`.
- **Resultado Esperado:** Transición fluida, cambio visual del icono (`+` a `×`), y actualización del anuncio de accesibilidad en `#resultado-17`.

---

### Caso de Prueba CP-17-02: Búsqueda dinámica en tiempo real y filtro por categorías
- **Objetivo:** Validar que el buscador filtre instantáneamente las preguntas según los términos ingresados y que los chips de categoría segmenten adecuadamente la información.
- **Precondiciones:** Lista de preguntas cargada con sus 6 preguntas predeterminadas.
- **Datos de Entrada:**
  - Búsqueda 1: `"asignacion"`
  - Acción: Botón `#btnClearSearch` (Limpiar)
  - Filtro 2: Clic en Chip `"Campus Virtual"` (`data-category="tecnico"`)
- **Procedimiento de Ejecución:**
  1. Escribir `"asignacion"` en el campo `#faqSearchInput`.
  2. Comprobar que solo se muestre 1 elemento en la lista y el contador reporte: *"Mostrando 1 de 6 preguntas frecuentes filtradas"*.
  3. Hacer clic en `#btnClearSearch`.
  4. Comprobar que el campo se limpie y se restablezca la visualización de las 6 preguntas.
  5. Hacer clic sobre el botón de categoría `Campus Virtual`.
  6. Verificar que únicamente las preguntas pertenecientes a la categoría técnica permanezcan visibles.
- **Resultado Esperado:** Filtrado instantáneo insensible a mayúsculas y acentos, sin recargas de página.

---

### Caso de Prueba CP-17-03: Registro exitoso de nueva consulta válida
- **Objetivo:** Asegurar que los estudiantes puedan enviar una nueva pregunta frecuente completando adecuadamente todos los campos del formulario.
- **Precondiciones:** Formulario `#faqForm` visible y limpio.
- **Datos de Entrada:**
  - Categoría: `academico` (*Académico*)
  - Correo Institucional: `marcosmolina@miumg.edu.gt`
  - Pregunta: `¿Cuándo inician las evaluaciones del segundo parcial?` (56 caracteres)
  - Detalle: `Necesito conocer el calendario oficial de exámenes parciales del décimo semestre.` (80 caracteres)
- **Procedimiento de Ejecución:**
  1. Seleccionar la categoría `academico` en `#faqCategorySelect`.
  2. Escribir el correo en `#faqUserEmail`.
  3. Escribir la pregunta en `#faqUserQuestion`.
  4. Escribir el detalle en `#faqUserAnswer`.
  5. Hacer clic en el botón `#btnSubmitQuestion`.
- **Resultado Esperado:**
  - El formulario se envía y se limpia automáticamente.
  - La caja `#faqFormFeedback` muestra alerta verde con mensaje: *"Pregunta frecuente registrada con éxito..."*.
  - La nueva pregunta se inserta en el acordeón en la primera posición y desplegada para su lectura inmediata.
  - El elemento `#resultado-17` refleja el éxito de la operación.

---

### Caso de Prueba CP-17-04: Validación de campos obligatorios y formatos incorrectos (Negativa)
- **Objetivo:** Comprobar la robustez de las validaciones de entrada impidiendo el envío de datos incompletos o con formato erróneo.
- **Precondiciones:** Formulario `#faqForm` listo para recibir entradas.
- **Datos de Entrada:**
  - Categoría: `""` (vacía, no seleccionada)
  - Correo: `correo-sin-formato-arroba`
  - Pregunta: `Duda` (4 caracteres, inferior al umbral mínimo de 10)
  - Detalle: `Ayuda` (5 caracteres, inferior al umbral mínimo de 15)
- **Procedimiento de Ejecución:**
  1. Llenar los campos con los valores inválidos indicados.
  2. Hacer clic en `#btnSubmitQuestion`.
  3. Verificar que no se inserte ningún nuevo elemento al acordeón.
  4. Verificar que se desplieguen mensajes de error individuales:
     - `#err-category`: *"Debe seleccionar una categoría válida."*
     - `#err-email`: *"Ingrese un formato de correo electrónico válido..."*
     - `#err-question`: *"La pregunta debe tener al menos 10 caracteres."*
     - `#err-answer`: *"El detalle debe tener al menos 15 caracteres."*
  5. Verificar que `#faqFormFeedback` muestre advertencia roja.
- **Resultado Esperado:** Bloqueo preventivo de la transacción y retroalimentación clara para corregir cada error.

---

### Caso de Prueba CP-17-05: Sanitización y prevención contra inyección XSS (DevSecOps)
- **Objetivo:** Verificar la resiliencia del software ante intentos de inyección de código malicioso mediante etiquetas script o elementos HTML no autorizados.
- **Precondiciones:** Formulario `#faqForm` operativo.
- **Datos de Entrada:**
  - Categoría: `tecnico`
  - Correo: `seguridad@miumg.edu.gt`
  - Pregunta: `<script>alert('XSS-ATTACK')</script> ¿Es seguro el portal?`
  - Detalle: `<img src="invalido" onerror="alert('XSS-IMAGE')"> Prueba de escape seguro de caracteres.`
- **Procedimiento de Ejecución:**
  1. Ingresar las cargas maliciosas en el formulario de registro.
  2. Enviar el formulario haciendo clic en `#btnSubmitQuestion`.
  3. Observar si se dispara alguna alerta en el navegador.
  4. Inspeccionar el código HTML generado en el DOM para la nueva pregunta y respuesta.
- **Resultado Esperado:** No se dispara ninguna ventana emergente de alerta. El código de escape transforma los caracteres `<` y `>` en entidades HTML seguras (`&lt;` y `&gt;`), mostrándose como texto plano inofensivo.
