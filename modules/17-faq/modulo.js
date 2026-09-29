// MÓDULO 17: FAQ — Preguntas Frecuentes Desplegables
// Proyecto: Portal de Servicios Universitarios
// Autor: Marcos Molina (Estudiante 17) - Rama: est17-faq

document.addEventListener("DOMContentLoaded", () => {
  console.log("Módulo 17 - FAQ: inicializado correctamente.");

  // 1. Datos iniciales de preguntas frecuentes
  const DEFAULT_FAQS = [
    {
      id: 1,
      categoria: "academico",
      categoriaLabel: "Académico",
      pregunta: "¿Cómo realizo la asignación de cursos para el semestre?",
      respuesta: "La asignación se realiza en línea a través del portal estudiantil durante las primeras dos semanas de cada semestre. Debes ingresar con tu carné y contraseña, verificar que no tengas prerrequisitos pendientes y seleccionar las secciones oficiales.",
      abierto: false
    },
    {
      id: 2,
      categoria: "financiero",
      categoriaLabel: "Inscripciones y Pagos",
      pregunta: "¿Cuáles son las fechas límite y modalidades de pago de colegiatura?",
      respuesta: "Las mensualidades se cancelan del 1 al 10 de cada mes sin recargo mediante banca en línea o en ventanillas bancarias autorizadas utilizando tu número de carné institucional.",
      abierto: false
    },
    {
      id: 3,
      categoria: "tecnico",
      categoriaLabel: "Campus Virtual",
      pregunta: "¿Cómo restablezco el acceso a mi cuenta del campus virtual?",
      respuesta: "Para restablecer tu contraseña, selecciona la opción '¿Olvidó su contraseña?' en la pantalla de inicio del campus e introduce tu correo institucional (@miumg.edu.gt), o envía un ticket a soporte técnico.",
      abierto: false
    },
    {
      id: 4,
      categoria: "academico",
      categoriaLabel: "Académico",
      pregunta: "¿Cuál es la nota mínima para aprobar y el derecho a recuperación?",
      respuesta: "La nota mínima de aprobación es de 61 puntos sobre 100. Tienen derecho a examen de recuperación los estudiantes que alcancen una zona mínima acumulada de acuerdo con el reglamento de evaluación vigente.",
      abierto: false
    },
    {
      id: 5,
      categoria: "servicios",
      categoriaLabel: "Servicios Estudiantiles",
      pregunta: "¿Cómo solicitar una certificación de cursos o constancia de estudios?",
      respuesta: "Las certificaciones se tramitan en el módulo de Secretaría Virtual. El documento oficial en formato digital PDF con código QR de verificación se genera en un plazo estimado de 48 a 72 horas hábiles tras registrar la solicitud.",
      abierto: false
    },
    {
      id: 6,
      categoria: "tecnico",
      categoriaLabel: "Campus Virtual",
      pregunta: "¿Qué navegadores son compatibles con los cuestionarios en línea?",
      respuesta: "Se recomienda utilizar Google Chrome, Mozilla Firefox o Microsoft Edge en sus versiones más recientes, asegurándose de no tener bloqueadores de ventanas emergentes activados durante el examen.",
      abierto: false
    }
  ];

  // Estado local del módulo
  let faqs = [...DEFAULT_FAQS];
  let filtroCategoria = "todos";
  let terminoBusqueda = "";

  // Referencias a elementos del DOM
  const faqListEl = document.getElementById("faqList");
  const faqStatsEl = document.getElementById("faqStats");
  const searchInput = document.getElementById("faqSearchInput");
  const btnClearSearch = document.getElementById("btnClearSearch");
  const btnExpandAll = document.getElementById("btnExpandAll");
  const btnCollapseAll = document.getElementById("btnCollapseAll");
  const categoryChips = document.querySelectorAll(".faq-chip");

  // Elementos del formulario
  const faqForm = document.getElementById("faqForm");
  const categorySelect = document.getElementById("faqCategorySelect");
  const emailInput = document.getElementById("faqUserEmail");
  const questionInput = document.getElementById("faqUserQuestion");
  const answerTextarea = document.getElementById("faqUserAnswer");
  const formFeedback = document.getElementById("faqFormFeedback");
  const globalResult = document.getElementById("resultado-17");

  // Errores específicos de campos
  const errCategory = document.getElementById("err-category");
  const errEmail = document.getElementById("err-email");
  const errQuestion = document.getElementById("err-question");
  const errAnswer = document.getElementById("err-answer");

  // ----------------------------------------------------
  // Utilidades y Sanitización (Seguridad DevSecOps)
  // ----------------------------------------------------
  function escapeHTML(str) {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizarTexto(texto) {
    return (texto || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  // ----------------------------------------------------
  // Renderizado del Acordeón FAQ
  // ----------------------------------------------------
  function renderFaqs() {
    const term = normalizarTexto(terminoBusqueda);
    const filtradas = faqs.filter(item => {
      const coincideCat = filtroCategoria === "todos" || item.categoria === filtroCategoria;
      const textoCompleto = normalizarTexto(`${item.pregunta} ${item.respuesta} ${item.categoriaLabel}`);
      const coincideBusqueda = term === "" || textoCompleto.includes(term);
      return coincideCat && coincideBusqueda;
    });

    // Actualizar estadística
    if (faqStatsEl) {
      const total = faqs.length;
      const visibles = filtradas.length;
      if (term || filtroCategoria !== "todos") {
        faqStatsEl.textContent = `Mostrando ${visibles} de ${total} preguntas frecuentes filtradas`;
      } else {
        faqStatsEl.textContent = `Total disponible: ${total} preguntas frecuentes`;
      }
    }

    if (filtradas.length === 0) {
      faqListEl.innerHTML = `
        <div class="faq-empty-state" id="faqEmptyState">
          <p><strong>No se encontraron preguntas frecuentes</strong></p>
          <p>No hay coincidencias para el criterio "${escapeHTML(terminoBusqueda)}".</p>
          <button type="button" id="btnResetFilters" class="btn-action btn-secondary" style="margin-top:10px;">Restablecer filtros</button>
        </div>
      `;
      const btnReset = document.getElementById("btnResetFilters");
      if (btnReset) {
        btnReset.addEventListener("click", () => {
          resetFilters();
        });
      }
      return;
    }

    // Generar acordeón accesible
    faqListEl.innerHTML = filtradas.map(item => {
      const isExpanded = !!item.abierto;
      const activeClass = isExpanded ? "active" : "";
      const hiddenAttr = isExpanded ? "" : "hidden";
      const iconSymbol = isExpanded ? "×" : "+";

      return `
        <div class="faq-item ${activeClass}" id="faq-item-${item.id}" data-category="${escapeHTML(item.categoria)}">
          <button 
            type="button"
            class="faq-question" 
            id="faq-btn-${item.id}"
            aria-expanded="${isExpanded}" 
            aria-controls="faq-ans-${item.id}"
            data-id="${item.id}"
          >
            <div class="faq-question-text">
              <span class="faq-cat-badge">${escapeHTML(item.categoriaLabel)}</span>
              <span class="faq-title">${escapeHTML(item.pregunta)}</span>
            </div>
            <span class="faq-icon" id="faq-icon-${item.id}" aria-hidden="true">${iconSymbol}</span>
          </button>
          <div 
            class="faq-answer" 
            id="faq-ans-${item.id}" 
            role="region" 
            aria-labelledby="faq-btn-${item.id}" 
            ${hiddenAttr}
          >
            <p>${escapeHTML(item.respuesta)}</p>
          </div>
        </div>
      `;
    }).join("");

    // Asignar listeners a los botones del acordeón
    faqListEl.querySelectorAll(".faq-question").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"), 10);
        toggleFaq(id);
      });
    });
  }

  // ----------------------------------------------------
  // Operaciones del Acordeón (Desplegar / Colapsar)
  // ----------------------------------------------------
  function toggleFaq(id) {
    const item = faqs.find(f => f.id === id);
    if (!item) return;

    item.abierto = !item.abierto;
    renderFaqs();

    // Notificar estado a tecnologías de asistencia
    if (globalResult) {
      globalResult.textContent = item.abierto 
        ? `Pregunta "${item.pregunta}" desplegada.` 
        : `Pregunta "${item.pregunta}" contraída.`;
    }
  }

  function expandAll() {
    faqs.forEach(f => { f.abierto = true; });
    renderFaqs();
    if (globalResult) {
      globalResult.textContent = "Todas las preguntas frecuentes han sido desplegadas.";
    }
  }

  function collapseAll() {
    faqs.forEach(f => { f.abierto = false; });
    renderFaqs();
    if (globalResult) {
      globalResult.textContent = "Todas las preguntas frecuentes han sido colapsadas.";
    }
  }

  function resetFilters() {
    terminoBusqueda = "";
    filtroCategoria = "todos";
    if (searchInput) searchInput.value = "";
    categoryChips.forEach(c => {
      c.classList.toggle("active", c.getAttribute("data-category") === "todos");
    });
    renderFaqs();
    if (globalResult) {
      globalResult.textContent = "Filtros de búsqueda restablecidos.";
    }
  }

  // ----------------------------------------------------
  // Eventos de Búsqueda y Filtros
  // ----------------------------------------------------
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      terminoBusqueda = e.target.value.trim();
      renderFaqs();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      terminoBusqueda = "";
      renderFaqs();
      if (globalResult) {
        globalResult.textContent = "Búsqueda limpiada.";
      }
    });
  }

  if (btnExpandAll) {
    btnExpandAll.addEventListener("click", expandAll);
  }

  if (btnCollapseAll) {
    btnCollapseAll.addEventListener("click", collapseAll);
  }

  categoryChips.forEach(chip => {
    chip.addEventListener("click", () => {
      categoryChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      filtroCategoria = chip.getAttribute("data-category");
      renderFaqs();
    });
  });

  // ----------------------------------------------------
  // Validaciones del Formulario de Preguntas
  // ----------------------------------------------------
  const VALID_CATEGORIES = {
    academico: "Académico",
    financiero: "Inscripciones y Pagos",
    tecnico: "Campus Virtual",
    servicios: "Servicios Estudiantiles"
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  function limpiarErrores() {
    if (errCategory) errCategory.textContent = "";
    if (errEmail) errEmail.textContent = "";
    if (errQuestion) errQuestion.textContent = "";
    if (errAnswer) errAnswer.textContent = "";
    if (formFeedback) {
      formFeedback.className = "feedback-box";
      formFeedback.textContent = "";
      formFeedback.style.display = "none";
    }
  }

  function validarCampos({ categoria, email, pregunta, respuesta }) {
    const errores = {};

    // 1. Categoría
    if (!categoria || !VALID_CATEGORIES[categoria]) {
      errores.categoria = "Debe seleccionar una categoría válida.";
    }

    // 2. Correo electrónico
    const emailLimpio = (email || "").trim();
    if (!emailLimpio) {
      errores.email = "El correo electrónico institucional es requerido.";
    } else if (emailLimpio.length > 80) {
      errores.email = "El correo no puede exceder 80 caracteres.";
    } else if (!EMAIL_REGEX.test(emailLimpio)) {
      errores.email = "Ingrese un formato de correo electrónico válido (ej: usuario@miumg.edu.gt).";
    }

    // 3. Pregunta / Asunto
    const preguntaLimpia = (pregunta || "").trim();
    if (!preguntaLimpia) {
      errores.pregunta = "La pregunta es requerida.";
    } else if (preguntaLimpia.length < 10) {
      errores.pregunta = "La pregunta debe tener al menos 10 caracteres.";
    } else if (preguntaLimpia.length > 120) {
      errores.pregunta = "La pregunta no puede exceder 120 caracteres.";
    }

    // 4. Detalle / Contexto
    const respuestaLimpia = (respuesta || "").trim();
    if (!respuestaLimpia) {
      errores.respuesta = "El detalle o contexto es requerido.";
    } else if (respuestaLimpia.length < 15) {
      errores.respuesta = "El detalle debe tener al menos 15 caracteres.";
    } else if (respuestaLimpia.length > 300) {
      errores.respuesta = "El detalle no puede exceder 300 caracteres.";
    }

    return {
      esValido: Object.keys(errores).length === 0,
      errores,
      valoresLimpios: {
        categoria,
        email: emailLimpio,
        pregunta: preguntaLimpia,
        respuesta: respuestaLimpia
      }
    };
  }

  // Validación en tiempo real para mejorar UX
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      if (errEmail.textContent) {
        const val = emailInput.value.trim();
        if (EMAIL_REGEX.test(val)) errEmail.textContent = "";
      }
    });
  }

  if (questionInput) {
    questionInput.addEventListener("input", () => {
      if (errQuestion.textContent && questionInput.value.trim().length >= 10) {
        errQuestion.textContent = "";
      }
    });
  }

  if (answerTextarea) {
    answerTextarea.addEventListener("input", () => {
      if (errAnswer.textContent && answerTextarea.value.trim().length >= 15) {
        errAnswer.textContent = "";
      }
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      if (categorySelect.value) errCategory.textContent = "";
    });
  }

  // Manejo del evento Submit del formulario
  if (faqForm) {
    faqForm.addEventListener("submit", (e) => {
      e.preventDefault();
      limpiarErrores();

      const resultadoValidacion = validarCampos({
        categoria: categorySelect.value,
        email: emailInput.value,
        pregunta: questionInput.value,
        respuesta: answerTextarea.value
      });

      if (!resultadoValidacion.esValido) {
        // Mostrar errores en campos
        const errs = resultadoValidacion.errores;
        if (errs.categoria && errCategory) errCategory.textContent = errs.categoria;
        if (errs.email && errEmail) errEmail.textContent = errs.email;
        if (errs.pregunta && errQuestion) errQuestion.textContent = errs.pregunta;
        if (errs.respuesta && errAnswer) errAnswer.textContent = errs.respuesta;

        if (formFeedback) {
          formFeedback.className = "feedback-box error";
          formFeedback.textContent = "Por favor corrija los campos marcados antes de enviar.";
          formFeedback.style.display = "block";
        }

        if (globalResult) {
          globalResult.textContent = "Error: El formulario contiene datos inválidos.";
        }
        return;
      }

      // Registro exitoso
      const datos = resultadoValidacion.valoresLimpios;
      const nuevoId = faqs.length > 0 ? Math.max(...faqs.map(f => f.id)) + 1 : 1;

      const nuevaFaq = {
        id: nuevoId,
        categoria: datos.categoria,
        categoriaLabel: VALID_CATEGORIES[datos.categoria],
        pregunta: datos.pregunta,
        respuesta: datos.respuesta,
        abierto: true // Desplegada para visualización inmediata
      };

      faqs.unshift(nuevaFaq); // Agregar al inicio para fácil visibilidad

      // Restablecer filtros si estuvieran bloqueando la nueva FAQ
      filtroCategoria = "todos";
      terminoBusqueda = "";
      if (searchInput) searchInput.value = "";
      categoryChips.forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-category") === "todos");
      });

      renderFaqs();

      // Limpiar campos del formulario
      faqForm.reset();

      // Feedback de confirmación
      const mensajeExito = `Pregunta frecuente registrada con éxito: "${datos.pregunta}" en la categoría ${VALID_CATEGORIES[datos.categoria]}.`;
      if (formFeedback) {
        formFeedback.className = "feedback-box success";
        formFeedback.textContent = mensajeExito;
        formFeedback.style.display = "block";
      }

      if (globalResult) {
        globalResult.textContent = `Éxito: ${mensajeExito}`;
      }

      // Desplazamiento suave al elemento recién insertado
      const nuevoElemento = document.getElementById(`faq-item-${nuevoId}`);
      if (nuevoElemento) {
        nuevoElemento.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Inicialización inicial
  renderFaqs();

  // Exposición para propósitos de testing y verificación automatizada
  window.ModuloFAQ = {
    getFaqs: () => faqs,
    toggleFaq,
    expandAll,
    collapseAll,
    validarCampos,
    resetFilters
  };
});
