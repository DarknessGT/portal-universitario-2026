# Casos de prueba — Módulo 11: Créditos

## Preparación

1. Abra `modules/11-creditos/index.html` en un navegador.
2. Presione **Reiniciar registro** si existen cursos agregados.

## Casos diseñados

| ID | Escenario | Datos de entrada | Resultado esperado |
|---|---|---|---|
| CP-11-01 | Registrar un curso válido | Curso: `Programación I`; créditos: `4` | El curso aparece en la lista y el total cambia a `4`. |
| CP-11-02 | Acumular varios cursos | Agregar `Programación I` con `4` y `Matemática I` con `5` | Se muestran ambos cursos y el total cambia a `9`. |
| CP-11-03 | Rechazar nombre vacío | Curso vacío; créditos: `4` | Se muestra `Ingrese el nombre del curso.` y el total no cambia. |
| CP-11-04 | Rechazar créditos inválidos | Curso: `Física I`; créditos: `2.5` | Se indica que los créditos deben ser enteros y el curso no se agrega. |
| CP-11-05 | Evitar cursos duplicados | Agregar dos veces `Programación I`, aunque cambien mayúsculas o espacios | El segundo registro se rechaza y el total conserva únicamente el primero. |

## Prueba automatizada

Desde la raíz del repositorio ejecute:

```powershell
node --test tests/test_11_creditos.mjs
```

La prueba automatizada comprueba los casos anteriores y controles adicionales de límites, normalización y cálculo del total.
