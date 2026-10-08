"""Pruebas del formulario del módulo 24 con Selenium.

Instalación: python -m pip install selenium
Ejecución:   python -m unittest discover -s modules/24-reporte -p "test_*.py" -v
Requiere Google Chrome y acceso al controlador compatible de Selenium.
"""

import os
import tempfile
import unittest
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select


PAGINA = Path(__file__).with_name("index.html").resolve().as_uri()
os.environ.setdefault("SE_CACHE_PATH", str(Path(tempfile.gettempdir()) / "portal-24-selenium"))


class ReporteSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        opciones = Options()
        opciones.add_argument("--headless=new")
        opciones.add_argument("--no-sandbox")
        opciones.add_argument("--disable-dev-shm-usage")
        opciones.add_argument("--disable-gpu")
        opciones.add_argument("--window-size=1200,900")
        cls.navegador = webdriver.Chrome(options=opciones)

    @classmethod
    def tearDownClass(cls):
        cls.navegador.quit()

    def setUp(self):
        self.navegador.get(PAGINA)

    def escribir(self, identificador, texto):
        campo = self.navegador.find_element(By.ID, identificador)
        campo.clear()
        campo.send_keys(texto)

    def seleccionar(self, identificador, valor):
        Select(self.navegador.find_element(By.ID, identificador)).select_by_value(valor)

    def llenar_datos_validos(self):
        self.escribir("funcionalidad-24", "Generar reporte de mi entrega")
        for numero, commit in enumerate(("a123456", "b123456", "c123456"), start=1):
            self.escribir(f"commit-{numero}", commit)
        for numero in range(1, 6):
            self.escribir(f"prueba-{numero}", f"Caso documentado {numero}")
            self.seleccionar(f"estado-prueba-{numero}", "aprobada")
        self.seleccionar("automatizada-24", "aprobada")
        self.seleccionar("pipeline-24", "aprobada")
        self.escribir("pipeline-url-24", "https://github.com/ejemplo/acciones/123")
        self.escribir("revisor-24", "Compañero revisor")
        self.seleccionar("revision-24", "aprobada")

    def generar(self):
        boton = self.navegador.find_element(By.CSS_SELECTOR, "#reporte-form button[type=submit]")
        self.navegador.execute_script(
            "document.documentElement.style.scrollBehavior = 'auto';"
            "arguments[0].scrollIntoView({block: 'center'});",
            boton,
        )
        boton.click()

    def error(self):
        return self.navegador.find_element(By.ID, "errores-24").text

    def reporte(self):
        return self.navegador.find_element(By.ID, "resultado-24").text

    def test_01_datos_completos_generan_resumen(self):
        self.llenar_datos_validos()
        self.generar()
        self.assertIn("Resumen de mi entrega", self.reporte())
        self.assertIn("5 aprobados, 0 fallidos, 0 pendientes", self.reporte())
        self.assertIn("Estado: requisitos registrados como completos.", self.reporte())
        self.assertEqual("", self.error())

    def test_02_nombre_vacio_muestra_error(self):
        self.llenar_datos_validos()
        self.escribir("funcionalidad-24", "")
        self.generar()
        self.assertIn("Escribe el nombre de la funcionalidad.", self.error())
        self.assertEqual("", self.reporte())

    def test_03_falta_un_commit(self):
        self.llenar_datos_validos()
        self.escribir("commit-3", "")
        self.generar()
        self.assertIn("Falta el commit 3.", self.error())
        self.assertEqual("", self.reporte())

    def test_04_commit_invalido(self):
        self.llenar_datos_validos()
        self.escribir("commit-3", "no-es-hex")
        self.generar()
        self.assertIn("El commit 3 debe tener entre 7 y 40 caracteres hexadecimales.", self.error())
        self.assertEqual("", self.reporte())

    def test_05_caso_sin_nombre_ni_resultado(self):
        self.llenar_datos_validos()
        self.escribir("prueba-5", "")
        self.seleccionar("estado-prueba-5", "")
        self.generar()
        self.assertIn("Escribe el nombre del caso 5.", self.error())
        self.assertIn("Selecciona el resultado del caso 5.", self.error())
        self.assertEqual("", self.reporte())


if __name__ == "__main__":
    unittest.main()
