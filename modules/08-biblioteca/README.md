# Biblioteca

Este módulo permite buscar títulos dentro de una lista pequeña de libros de demostración. Los títulos son ejemplos para probar la búsqueda; no son un catálogo oficial.

## Cómo usarlo

Al abrir la página se muestra la lista completa. Escribe una palabra o parte del título y los resultados se filtran mientras escribes. La búsqueda ignora mayúsculas, tildes y espacios al inicio o al final.

También puedes pulsar **Buscar** o enviar el formulario. Si borras el texto o dejas solo espacios, vuelve a aparecer la lista completa. **Limpiar** hace lo mismo y deja vacío el campo. Si no hay coincidencias, aparece un mensaje; los libros no se abren ni se seleccionan.

## Casos que probé

1. Buscar `Historia universal`: aparece ese título como única coincidencia.
2. Buscar `  PROGRAMACIÓN  `: encuentra `Introducción a la programación`, aunque haya mayúsculas y espacios al principio y al final.
3. Buscar `matematica` sin tilde: encuentra `Matemática para principiantes`.
4. Buscar `astronomía`: la búsqueda devuelve una lista vacía porque no hay ningún título que coincida.
5. Filtrar un título y luego borrar el texto, dejar solo espacios, enviar el formulario vacío o pulsar **Limpiar**: vuelven a aparecer los siete títulos.

Los primeros cuatro casos están cubiertos por las pruebas automatizadas. El quinto lo revisé con una simulación de los eventos del campo y el formulario; no lo presento como una prueba ejecutada en un navegador real.

Para ejecutar las pruebas automatizadas desde la raíz del repositorio, usa:

```text
node --test tests/test_08_biblioteca.js
```

## Seguridad básica

- El campo limita la entrada a 80 caracteres y la búsqueda recorta los espacios externos y normaliza el texto antes de comparar.
- Los títulos se agregan a la página creando elementos y usando `textContent`. No se interpreta el texto de búsqueda como HTML.
- La lista es local y de demostración. El módulo no guarda consultas, credenciales ni datos personales, ni envía información a servicios externos.
- Como no hay un servidor ni un catálogo institucional conectado, estas validaciones solo organizan la experiencia en el navegador; no protegen datos de un sistema real.
