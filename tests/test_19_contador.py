"""Pruebas del módulo 19: servidor local y perfil de Chrome temporal."""
import functools
import json
import os
from pathlib import Path
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import unittest

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

ROOT = Path(__file__).resolve().parents[1]
KEY = "portal-universitario-2026:19:visitas"
DATE = "2026-01-01T12:00:00.000Z"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class Contador19Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.profile = tempfile.TemporaryDirectory(prefix="contador19-")
        cls.addClassCleanup(cls.profile.cleanup)
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        cls.addClassCleanup(cls.server.server_close)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.addClassCleanup(cls.server.shutdown)
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"
        cls.url = cls.base + "/modules/19-contador/index.html"
        cls.driver = cls.new_browser()
        cls.addClassCleanup(lambda: cls.driver.quit())

    @classmethod
    def new_browser(cls):
        use_edge = os.environ.get("CONTADOR_BROWSER", "chrome").lower() == "edge"
        options = webdriver.EdgeOptions() if use_edge else webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1280,1100")
        options.add_argument("--no-first-run")
        options.add_argument("--no-default-browser-check")
        options.add_argument(f"--user-data-dir={cls.profile.name}")
        options.set_capability("ms:loggingPrefs" if use_edge else "goog:loggingPrefs", {"browser": "ALL"})
        if use_edge:
            driver_path = os.environ.get("EDGEDRIVER")
            return webdriver.Edge(
                service=EdgeService(executable_path=driver_path) if driver_path else EdgeService(),
                options=options,
            )
        if os.environ.get("CHROME_BINARY"):
            options.binary_location = os.environ["CHROME_BINARY"]
        driver_path = os.environ.get("CHROMEDRIVER")
        return webdriver.Chrome(
            service=Service(executable_path=driver_path) if driver_path else Service(),
            options=options,
        )

    def setUp(self):
        self.driver.get(self.base + "/index.html")
        self.driver.execute_script("localStorage.removeItem(arguments[0])", KEY)
        self.injections = []
        self.driver.get_log("browser")

    def tearDown(self):
        for identifier in self.injections:
            self.driver.execute_cdp_cmd(
                "Page.removeScriptToEvaluateOnNewDocument", {"identifier": identifier}
            )

    def open_module(self):
        self.driver.get(self.url)
        WebDriverWait(self.driver, 10).until(
            lambda driver: driver.find_element(By.ID, "resultado-19").text
        )

    def text(self, identifier):
        return self.driver.find_element(By.ID, identifier).text

    def state(self):
        return self.driver.execute_script(
            "return JSON.parse(localStorage.getItem(arguments[0]))", KEY
        )

    def seed(self, state):
        self.driver.execute_script(
            "localStorage.setItem(arguments[0], arguments[1])", KEY, json.dumps(state)
        )

    def valid_state(self, total=1):
        return {
            "version": 1, "total": total, "fechaInicio": DATE,
            "ultimaVisita": DATE, "historial": [DATE] * min(total, 10),
        }

    def inject(self, source):
        response = self.driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument", {"source": source}
        )
        self.injections.append(response["identifier"])

    def screenshot(self, name):
        if os.environ.get("SCREENSHOT_DIR"):
            folder = Path(os.environ["SCREENSHOT_DIR"])
            folder.mkdir(parents=True, exist_ok=True)
            self.driver.save_screenshot(str(folder / name))

    def test_01_primera_visita(self):
        self.open_module()
        state = self.state()
        self.assertEqual(state["total"], 1)
        self.assertEqual(state["fechaInicio"], state["ultimaVisita"])
        self.assertEqual(state["historial"], [state["ultimaVisita"]])
        self.assertEqual(self.text("contador-visitas-19"), "1")
        self.assertEqual(self.text("visita-anterior-19"), "Esta es tu primera visita")
        self.assertFalse(self.driver.find_elements(By.CSS_SELECTOR, "#app-19 button"))

    def test_02_recarga_y_visita_anterior(self):
        self.seed(self.valid_state())
        self.open_module()
        state = self.state()
        expected = self.driver.execute_script(
            "return new Intl.DateTimeFormat('es-GT', {dateStyle:'medium', timeStyle:'medium'}).format(new Date(arguments[0]))",
            DATE,
        )
        self.assertEqual(state["total"], 2)
        self.assertEqual(state["fechaInicio"], DATE)
        self.assertEqual(self.text("visita-anterior-19"), expected)
        previous = state["ultimaVisita"]
        self.driver.refresh()
        self.assertEqual(self.state()["total"], 3)
        self.assertEqual(self.state()["historial"][1], previous)
        self.assertEqual(self.state()["fechaInicio"], DATE)

    def test_03_regreso_desde_portal(self):
        self.open_module()
        self.driver.find_element(By.CSS_SELECTOR, ".back-link").click()
        self.assertTrue(self.driver.current_url.endswith("/index.html"))
        self.assertEqual(self.state()["total"], 1)
        card = self.driver.find_element(By.CSS_SELECTOR, '[data-module="19"]')
        # Evitar que el scroll suave del portal deje la tarjeta fuera de vista al hacer clic.
        self.driver.execute_script(
            "arguments[0].scrollIntoView({behavior: 'instant', block: 'center'})", card
        )
        card.click()
        self.assertEqual(self.state()["total"], 2)

    def test_04_historial_limitado(self):
        self.open_module()
        first = self.state()["fechaInicio"]
        for _ in range(11):
            self.driver.refresh()
        state = self.state()
        self.assertEqual(state["total"], 12)
        self.assertEqual(state["fechaInicio"], first)
        self.assertEqual(len(state["historial"]), 10)
        displayed = [
            element.get_attribute("datetime")
            for element in self.driver.find_elements(By.CSS_SELECTOR, "#historial-visitas-19 time")
        ]
        self.assertEqual(displayed, state["historial"])
        self.assertEqual(state["historial"][0], state["ultimaVisita"])
        self.screenshot("contador-escritorio.png")

    def test_05_registros_corruptos(self):
        cases = [None, [], {}, {"version": 2}, self.valid_state(-1)]
        for field, value in [
            ("total", 1.5), ("total", 9007199254740992),
            ("fechaInicio", "no-es-fecha"), ("historial", []),
            ("ultimaVisita", "2026-01-02T12:00:00.000Z"),
            ("historial", ["2026-01-01"]),
        ]:
            state = self.valid_state()
            state[field] = value
            cases.append(state)
        for state in cases:
            with self.subTest(state=state):
                self.seed(state)
                self.open_module()
                self.assertEqual(self.state()["total"], 1)
                self.assertIn("dañado", self.text("resultado-19"))
        self.driver.execute_script("localStorage.setItem(arguments[0], '{malformed')", KEY)
        self.open_module()
        self.assertEqual(self.state()["total"], 1)
        self.assertIn("dañado", self.text("resultado-19"))

    def test_06_lectura_bloqueada(self):
        self.inject("Object.defineProperty(window, 'localStorage', {get() {throw new DOMException('Blocked', 'SecurityError');}});")
        self.open_module()
        self.assertIn("No se pudo leer", self.text("resultado-19"))
        self.assertEqual(self.text("contador-visitas-19"), "—")
        self.driver.find_element(By.CSS_SELECTOR, ".back-link").click()
        self.assertIn("/index.html", self.driver.current_url)

    def test_07_escritura_bloqueada_con_registro(self):
        original = self.valid_state(2)
        self.seed(original)
        self.inject("Storage.prototype.setItem = function() {throw new DOMException('Full', 'QuotaExceededError');};")
        self.open_module()
        self.assertIn("No se pudo guardar", self.text("resultado-19"))
        self.assertEqual(self.text("contador-visitas-19"), "2")
        self.assertEqual(self.state(), original)

    def test_08_escritura_bloqueada_sin_registro(self):
        self.inject("Storage.prototype.setItem = function() {throw new DOMException('Full', 'QuotaExceededError');};")
        self.open_module()
        self.assertIn("No se pudo guardar", self.text("resultado-19"))
        self.assertEqual(self.text("contador-visitas-19"), "—")
        self.assertIsNone(self.state())

    def test_09_otros_datos_intactos(self):
        # Se usa solo el perfil temporal de pruebas, nunca el perfil del usuario.
        sentinel = "portal-universitario-2026:prueba-19:ajeno"
        self.driver.execute_script("localStorage.setItem(arguments[0], 'conservar')", sentinel)
        try:
            self.seed({"invalido": True})
            self.open_module()
            self.assertEqual(self.driver.execute_script(
                "return localStorage.getItem(arguments[0])", sentinel
            ), "conservar")
        finally:
            self.driver.execute_script("localStorage.removeItem(arguments[0])", sentinel)

    def test_10_limite_seguro(self):
        original = self.valid_state(9007199254740991)
        self.seed(original)
        self.open_module()
        self.assertEqual(self.state(), original)
        self.assertIn("límite", self.text("resultado-19"))

    def test_11_persistencia_tras_cerrar_navegador(self):
        self.open_module()
        previous = self.state()
        self.driver.quit()
        type(self).driver = self.new_browser()
        self.open_module()
        self.assertEqual(self.state()["total"], 2)
        self.assertEqual(self.state()["fechaInicio"], previous["fechaInicio"])
        self.assertEqual(self.state()["historial"][1], previous["ultimaVisita"])

    def test_12_vista_movil_y_consola(self):
        self.driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride", {
            "width": 390, "height": 1000, "deviceScaleFactor": 1, "mobile": True,
        })
        try:
            self.open_module()
            self.assertEqual(self.driver.execute_script("return window.innerWidth"), 390)
            self.assertTrue(self.driver.execute_script(
                "return document.documentElement.scrollWidth <= window.innerWidth"
            ))
            self.assertTrue(self.driver.find_element(By.ID, "contador-visitas-19").is_displayed())
            errors = [entry for entry in self.driver.get_log("browser")
                      if entry["level"] == "SEVERE" and entry.get("source") == "javascript"]
            self.assertEqual(errors, [])
            self.screenshot("contador-movil.png")
        finally:
            self.driver.execute_cdp_cmd("Emulation.clearDeviceMetricsOverride", {})


if __name__ == "__main__":
    unittest.main(verbosity=2)
