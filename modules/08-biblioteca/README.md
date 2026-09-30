# Biblioteca: casos de prueba

La lista de títulos de la página es de demostración; no representa el inventario de una institución.

## Casos documentados

1. Buscar un título completo, por ejemplo `Historia universal`: debe mostrarse una coincidencia.
2. Buscar una parte del título con mayúsculas y espacios al inicio o al final: debe encontrarse el mismo libro.
3. Buscar `matematica` sin tilde: debe encontrar `Matemática para principiantes`.
4. Buscar una palabra que no esté en la lista: debe mostrarse el mensaje de que no hay coincidencias y una lista vacía.
5. Enviar la búsqueda vacía o con solo espacios: debe solicitar un término, marcar el campo como inválido y conservar el catálogo; Limpiar debe restaurar todos los títulos.

## Prueba automatizada

Con Node.js instalado, ejecutar desde la raíz del repositorio:

```text
node --test tests/test_08_biblioteca.js
```

La prueba usa `node:test` y `node:assert` integrados en Node.js; no agrega dependencias al proyecto.
