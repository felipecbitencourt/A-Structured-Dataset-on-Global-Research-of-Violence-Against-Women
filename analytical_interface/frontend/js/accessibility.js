(function () {
  const STORAGE_KEYS = {
    theme: "hub_theme",
    dyslexia: "hub_dyslexia",
    language: "hub_language",
  };

  const I18N = {
    pt: {
      skipToContent: "Ir para o conteúdo principal",
      navHome: "Início",
      navAriaLabel: "Navegação principal do hub",
      a11yToggleLabel: "Acessibilidade",
      a11yToggleAria: "Abrir ou fechar opções de acessibilidade",
      a11yTitle: "Acessibilidade",
      toggleTheme: "Modo escuro",
      toggleDyslexia: "Fonte para dislexia",
      langLabel: "Idioma",
      homeTitle: "Hub de Análise Científica",
      homeIntro:
        "Interface estática para exploração reprodutível em três níveis: micro (artigos), meso (tópicos) e macro (megatópicos).",
      homeGuide:
        "Use os caminhos abaixo para iniciar pela pergunta de pesquisa, e não apenas pelo nível de análise.",
      homeStart: "Começar na exploração guiada",
      homeGoTopics: "Ir direto para comparação de tópicos",
      homeByGoal: "Escolha por objetivo",
      homeMicroWhenUse: "Quando usar: rastrear evidências detalhadas por país, ano e fluxo.",
      homeMicroQ1: "Quais países concentram estudos no período recente?",
      homeMicroQ2: "Como o fluxo cross-continental evolui ao longo do tempo?",
      homeOpenMicro: "Abrir micro",
      homeMesoWhenUse: "Quando usar: comparar tópicos por volume, coerência e crescimento.",
      homeMesoQ1: "Quais tópicos crescem mais rápido?",
      homeMesoQ2: "Como dois tópicos se diferenciam no mesmo recorte?",
      homeOpenMeso: "Abrir meso",
      homeMacroWhenUse: "Quando usar: sintetizar blocos temáticos e tendências gerais.",
      homeMacroQ1: "Qual megatópico domina o corpus filtrado?",
      homeMacroQ2: "Como varia a coerência média entre megatópicos?",
      homeOpenMacro: "Abrir macro",
      homeResearchQuestions: "Entradas por pergunta de pesquisa",
      homeRecentTemporal: "Evolução temporal recente (2021-2025)",
      homeCompareTopics: "Comparar tópicos (modo A/B)",
      homeProductionMap: "Foco em produção científica (mapa)",
      homeSnapshot: "Snapshot do release",
      kpiArticles: "Artigos",
      kpiTopics: "Tópicos",
      kpiMegatopics: "Megatópicos",
      kpiVersion: "Versão",
      releaseLabel: "Release:",
      hashLabel: "Hash de origem:",
      homeRepro: "Reprodutibilidade e suporte",
      homeMeta: "Ver metadados de release",
      homeQuickGuide: "Guia rápido",
      homeDevGuide: "Guia interno",
      homeNotePrefix: "Nota:",
      homeNoteText:
        "Este hub é um material complementar estático para exploração multinível do conjunto de dados.",
      navMicro: "Articles (Micro)",
      navMeso: "Topics (Meso)",
      navMacro: "Megatopics (Macro)",
      applyFilters: "Aplicar",
      exportCsv: "Exportar CSV filtrado",
      exportJson: "Exportar JSON filtrado",
      exportFilters: "Exportar filtros",
      placeholderYearMin: "Ano mín.",
      placeholderYearMax: "Ano máx.",
      optionCountryAll: "País (todos)",
      optionTopicAll: "Tópico (todos)",
      optionMegatopicAll: "Megatópico (todos)",
      optionFlowAll: "Research flow (todos)",
      optionGeoContext: "Mapa: contexto",
      optionGeoProduction: "Mapa: produção",
      selectOption: "Selecione",
      compareOutOfSlice: "Os tópicos selecionados não estão no recorte atual.",
      selectedArticles: "artigos selecionados",
      noResults: "Nenhum resultado para os filtros atuais.",
      microKpiCountries: "Países",
      microKpiJournals: "Periódicos",
      microKpiCross: "Cross-continental",
      microChartYear: "Publicações por ano",
      microChartFlow: "Fluxo de pesquisa",
      microChartCountries: "Principais países",
      microChartMap: "Mapa de estudos/produção",
      microTableTitle: "Tabela de artigos (recorte)",
      colArticle: "Artigo",
      colYear: "Ano",
      colCountry: "País",
      colTopic: "Tópico",
      colMegatopic: "Megatópico",
      colFlow: "Fluxo",
      mesoCompareLabel: "Comparador A/B:",
      mesoTopicA: "Tópico A",
      mesoTopicB: "Tópico B",
      mesoChartCount: "Artigos filtrados por tópico",
      mesoChartCoherence: "Coerência por tópico (Cv)",
      mesoChartGrowth: "Crescimento em 5 anos",
      mesoChartGrowthNorm: "Crescimento normalizado",
      mesoChartTemporal: "Série temporal (tópicos selecionados)",
      mesoTableTitle: "Comparação de tópicos",
      colDescription: "Descrição",
      colFilteredArticles: "Artigos filtrados",
      colGrowth: "Crescimento",
      colGoMicro: "Ir para micro",
      macroChartCount: "Artigos filtrados por megatópico",
      macroChartShare: "Participação de artigos (%)",
      macroChartCoherence: "Coerência média (Cv)",
      macroChartCoherenceNorm: "Coerência normalizada",
      macroChartFlow: "Research flow (%)",
      macroTableTitle: "Síntese agregada de megatópicos",
      colGoMeso: "Ir para meso",
    },
    en: {
      skipToContent: "Skip to main content",
      navHome: "Home",
      navAriaLabel: "Main hub navigation",
      a11yToggleLabel: "Accessibility",
      a11yToggleAria: "Open or close accessibility options",
      a11yTitle: "Accessibility",
      toggleTheme: "Dark mode",
      toggleDyslexia: "Dyslexia font",
      langLabel: "Language",
      homeTitle: "Scientific Analysis Hub",
      homeIntro:
        "Static interface for reproducible exploration across three levels: micro (articles), meso (topics), and macro (megatopics).",
      homeGuide: "Use the paths below to start from a research question, not only from an analysis level.",
      homeStart: "Start guided exploration",
      homeGoTopics: "Go directly to topic comparison",
      homeByGoal: "Choose by objective",
      homeMicroWhenUse: "When to use: trace detailed evidence by country, year, and flow.",
      homeMicroQ1: "Which countries concentrate recent studies?",
      homeMicroQ2: "How does cross-continental flow evolve over time?",
      homeOpenMicro: "Open micro",
      homeMesoWhenUse: "When to use: compare topics by volume, coherence, and growth.",
      homeMesoQ1: "Which topics are growing faster?",
      homeMesoQ2: "How do two topics differ within the same slice?",
      homeOpenMeso: "Open meso",
      homeMacroWhenUse: "When to use: synthesize thematic blocks and overall trends.",
      homeMacroQ1: "Which megatopic dominates the filtered corpus?",
      homeMacroQ2: "How does average coherence vary across megatopics?",
      homeOpenMacro: "Open macro",
      homeResearchQuestions: "Research-question entry points",
      homeRecentTemporal: "Recent temporal evolution (2021-2025)",
      homeCompareTopics: "Compare topics (A/B mode)",
      homeProductionMap: "Focus on scientific production (map)",
      homeSnapshot: "Release snapshot",
      kpiArticles: "Articles",
      kpiTopics: "Topics",
      kpiMegatopics: "Megatopics",
      kpiVersion: "Version",
      releaseLabel: "Release:",
      hashLabel: "Source hash:",
      homeRepro: "Reproducibility and support",
      homeMeta: "View release metadata",
      homeQuickGuide: "Quick guide",
      homeDevGuide: "Development guide",
      homeNotePrefix: "Note:",
      homeNoteText: "this hub is a static supplementary material for multi-level dataset exploration.",
      navMicro: "Articles (Micro)",
      navMeso: "Topics (Meso)",
      navMacro: "Megatopics (Macro)",
      applyFilters: "Apply",
      exportCsv: "Export filtered CSV",
      exportJson: "Export filtered JSON",
      exportFilters: "Export filters",
      placeholderYearMin: "Min year",
      placeholderYearMax: "Max year",
      optionCountryAll: "Country (all)",
      optionTopicAll: "Topic (all)",
      optionMegatopicAll: "Megatopic (all)",
      optionFlowAll: "Research flow (all)",
      optionGeoContext: "Map: Context",
      optionGeoProduction: "Map: Production",
      selectOption: "Select",
      compareOutOfSlice: "Selected topics are not in the current slice.",
      selectedArticles: "selected articles",
      noResults: "No results for current filters.",
      microKpiCountries: "Countries",
      microKpiJournals: "Journals",
      microKpiCross: "Cross-continental",
      microChartYear: "Publications by year",
      microChartFlow: "Research flow",
      microChartCountries: "Top countries",
      microChartMap: "Study/production map",
      microTableTitle: "Articles table (slice)",
      colArticle: "Article",
      colYear: "Year",
      colCountry: "Country",
      colTopic: "Topic",
      colMegatopic: "Megatopic",
      colFlow: "Flow",
      mesoCompareLabel: "A/B comparator:",
      mesoTopicA: "Topic A",
      mesoTopicB: "Topic B",
      mesoChartCount: "Filtered articles by topic",
      mesoChartCoherence: "Topic coherence (Cv)",
      mesoChartGrowth: "5-year growth",
      mesoChartGrowthNorm: "Normalized growth",
      mesoChartTemporal: "Temporal series (selected topics)",
      mesoTableTitle: "Topic comparison",
      colDescription: "Description",
      colFilteredArticles: "Filtered articles",
      colGrowth: "Growth",
      colGoMicro: "Go to micro",
      macroChartCount: "Filtered articles by megatopic",
      macroChartShare: "Article share (%)",
      macroChartCoherence: "Average coherence (Cv)",
      macroChartCoherenceNorm: "Normalized coherence",
      macroChartFlow: "Research flow (%)",
      macroTableTitle: "Aggregated megatopic synthesis",
      colGoMeso: "Go to meso",
    },
    es: {
      skipToContent: "Ir al contenido principal",
      navHome: "Inicio",
      navAriaLabel: "Navegación principal del hub",
      a11yToggleLabel: "Accesibilidad",
      a11yToggleAria: "Abrir o cerrar opciones de accesibilidad",
      a11yTitle: "Accesibilidad",
      toggleTheme: "Modo oscuro",
      toggleDyslexia: "Fuente dislexia",
      langLabel: "Idioma",
      homeTitle: "Hub de Análisis Científico",
      homeIntro:
        "Interfaz estática para exploración reproducible en tres niveles: micro (artículos), meso (tópicos) y macro (megatópicos).",
      homeGuide: "Use las rutas abajo para empezar por pregunta de investigación y no solo por nivel.",
      homeStart: "Iniciar exploración guiada",
      homeGoTopics: "Ir directo a comparación de tópicos",
      homeByGoal: "Elegir por objetivo",
      homeMicroWhenUse: "Cuándo usar: rastrear evidencias detalladas por país, año y flujo.",
      homeMicroQ1: "¿Qué países concentran estudios recientes?",
      homeMicroQ2: "¿Cómo evoluciona el flujo transcontinental?",
      homeOpenMicro: "Abrir micro",
      homeMesoWhenUse: "Cuándo usar: comparar tópicos por volumen, coherencia y crecimiento.",
      homeMesoQ1: "¿Qué tópicos crecen más rápido?",
      homeMesoQ2: "¿Cómo difieren dos tópicos en el mismo recorte?",
      homeOpenMeso: "Abrir meso",
      homeMacroWhenUse: "Cuándo usar: sintetizar bloques temáticos y tendencias generales.",
      homeMacroQ1: "¿Qué megatópico domina el corpus filtrado?",
      homeMacroQ2: "¿Cómo varía la coherencia media entre megatópicos?",
      homeOpenMacro: "Abrir macro",
      homeResearchQuestions: "Entradas por pregunta de investigación",
      homeRecentTemporal: "Evolución temporal reciente (2021-2025)",
      homeCompareTopics: "Comparar tópicos (modo A/B)",
      homeProductionMap: "Enfoque en producción científica (mapa)",
      homeSnapshot: "Snapshot de release",
      kpiArticles: "Artículos",
      kpiTopics: "Tópicos",
      kpiMegatopics: "Megatópicos",
      kpiVersion: "Versión",
      releaseLabel: "Release:",
      hashLabel: "Hash origen:",
      homeRepro: "Reproducibilidad y soporte",
      homeMeta: "Ver metadatos de release",
      homeQuickGuide: "Guía rápida",
      homeDevGuide: "Guía interna",
      homeNotePrefix: "Nota:",
      homeNoteText:
        "este hub es un material complementario estático para exploración multinivel del dataset.",
      navMicro: "Artículos (Micro)",
      navMeso: "Tópicos (Meso)",
      navMacro: "Megatópicos (Macro)",
      applyFilters: "Aplicar",
      exportCsv: "Exportar CSV filtrado",
      exportJson: "Exportar JSON filtrado",
      exportFilters: "Exportar filtros",
      placeholderYearMin: "Año mín",
      placeholderYearMax: "Año máx",
      optionCountryAll: "País (todos)",
      optionTopicAll: "Tópico (todos)",
      optionMegatopicAll: "Megatópico (todos)",
      optionFlowAll: "Research flow (todos)",
      optionGeoContext: "Mapa: Contexto",
      optionGeoProduction: "Mapa: Producción",
      selectOption: "Seleccione",
      compareOutOfSlice: "Los tópicos seleccionados no están en el recorte actual.",
      selectedArticles: "artículos seleccionados",
      noResults: "Sin resultados para los filtros actuales.",
      microKpiCountries: "Países",
      microKpiJournals: "Revistas",
      microKpiCross: "Transcontinental",
      microChartYear: "Publicaciones por año",
      microChartFlow: "Flujo de investigación",
      microChartCountries: "Países principales",
      microChartMap: "Mapa de estudio/producción",
      microTableTitle: "Tabla de artículos (recorte)",
      colArticle: "Artículo",
      colYear: "Año",
      colCountry: "País",
      colTopic: "Tópico",
      colMegatopic: "Megatópico",
      colFlow: "Flujo",
      mesoCompareLabel: "Comparador A/B:",
      mesoTopicA: "Tópico A",
      mesoTopicB: "Tópico B",
      mesoChartCount: "Artículos filtrados por tópico",
      mesoChartCoherence: "Coherencia por tópico (Cv)",
      mesoChartGrowth: "Crecimiento 5 años",
      mesoChartGrowthNorm: "Crecimiento normalizado",
      mesoChartTemporal: "Serie temporal (tópicos seleccionados)",
      mesoTableTitle: "Comparación de tópicos",
      colDescription: "Descripción",
      colFilteredArticles: "Artículos filtrados",
      colGrowth: "Crecimiento",
      colGoMicro: "Ir a micro",
      macroChartCount: "Artículos filtrados por megatópico",
      macroChartShare: "Participación de artículos (%)",
      macroChartCoherence: "Coherencia media (Cv)",
      macroChartCoherenceNorm: "Coherencia normalizada",
      macroChartFlow: "Research flow (%)",
      macroTableTitle: "Síntesis agregada de megatópicos",
      colGoMeso: "Ir a meso",
    },
  };

  function injectBaseStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: "OpenDyslexic";
        src: url("https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Regular.woff") format("woff");
        font-display: swap;
      }
      .a11y-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: max(8px, env(safe-area-inset-right, 0px));
        left: auto;
        bottom: auto;
        z-index: 9600;
        display: none;
        background: #ffffff;
        border: 1px solid #cfd5df;
        border-radius: 8px;
        padding: 10px;
        width: min(220px, calc(100vw - 32px));
        max-height: min(70vh, 360px);
        overflow: auto;
        overscroll-behavior: contain;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        font-size: 12px;
      }
      .a11y-panel.is-open {
        display: block;
      }
      .a11y-panel.a11y-panel--floating {
        position: fixed;
        top: auto;
        right: auto;
        left: max(12px, env(safe-area-inset-left, 0px));
        bottom: max(12px, env(safe-area-inset-bottom, 0px));
      }
      .a11y-panel h4 { margin: 0 0 8px 0; font-size: 13px; }
      .a11y-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 8px; }
      .a11y-row button, .a11y-row select { width: 100%; padding: 6px; border: 1px solid #bcc4d1; border-radius: 6px; background: #f8faff; cursor: pointer; }
      html.theme-dark body { background: #121418 !important; color: #e8e8e8 !important; }
      html.theme-dark .panel, html.theme-dark .card, html.theme-dark .a11y-panel {
        background: #1d222b !important;
        border-color: #37404f !important;
        color: #e8e8e8 !important;
      }
      html.theme-dark .muted, html.theme-dark .label { color: #b7c0d0 !important; }
      html.theme-dark a { color: #9fc2ff !important; }
      html.theme-dark a.btn { border-color: #5879ad !important; background: #232d3d !important; color: #d3e4ff !important; }
      html.theme-dark input, html.theme-dark select, html.theme-dark button, html.theme-dark table, html.theme-dark th, html.theme-dark td {
        background: #1d222b !important;
        color: #e8e8e8 !important;
        border-color: #465164 !important;
      }
      html.font-dyslexia body, html.font-dyslexia button, html.font-dyslexia input, html.font-dyslexia select, html.font-dyslexia table {
        font-family: "OpenDyslexic", Arial, sans-serif !important;
      }
      .skip-link {
        position: absolute;
        left: -9999px;
        top: auto;
      }
      .skip-link:focus {
        left: 10px;
        top: 10px;
        z-index: 10000;
        background: #fff;
        border: 1px solid #333;
        padding: 8px 10px;
      }
      .hub-site-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 20px;
        padding: 12px 16px;
        margin-bottom: 14px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 10px;
        position: sticky;
        top: 0;
        z-index: 9000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        overflow: visible;
      }
      .hub-brand {
        font-weight: bold;
        color: #1a1a1a;
        text-decoration: none;
        margin-right: auto;
        max-width: 280px;
        font-size: 15px;
        line-height: 1.25;
      }
      .hub-site-nav {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
      }
      .hub-nav-link {
        text-decoration: none;
        color: #1f4b99;
        font-weight: 600;
        font-size: 13px;
        padding: 6px 10px;
        border-radius: 6px;
      }
      .hub-nav-link:hover { background: #eef4ff; }
      .hub-nav-link.is-active {
        color: #0d2d5c;
        background: #e4ecfb;
      }
      .hub-a11y-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #1f4b99;
        background: #f5f9ff;
        color: #1f4b99;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
        white-space: nowrap;
      }
      .hub-a11y-toggle__caret {
        font-size: 9px;
        line-height: 1;
        opacity: 0.85;
        transition: transform 0.15s ease;
      }
      .hub-a11y-toggle[aria-expanded="true"] .hub-a11y-toggle__caret {
        transform: rotate(180deg);
      }
      html.theme-dark .hub-site-header {
        background: #1d222b !important;
        border-color: #37404f !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35) !important;
      }
      html.theme-dark .hub-brand { color: #e8e8e8 !important; }
      html.theme-dark .hub-nav-link:hover { background: #2a3445 !important; }
      html.theme-dark .hub-nav-link.is-active {
        background: #2a3445 !important;
        color: #d3e4ff !important;
      }
      html.theme-dark .hub-a11y-toggle {
        background: #232d3d !important;
        border-color: #5879ad !important;
        color: #d3e4ff !important;
      }
    `;
    document.head.appendChild(style);
  }

  function addSkipLink() {
    const link = document.createElement("a");
    link.className = "skip-link";
    link.href = "#main-content";
    link.setAttribute("data-i18n", "skipToContent");
    link.textContent = "Ir para o conteúdo principal";
    document.body.insertBefore(link, document.body.firstChild);
    if (document.getElementById("main-content")) return;
    const main = document.querySelector("main#main-content, main");
    if (main) {
      main.id = "main-content";
      return;
    }
    const el = document.querySelector(".container") || document.querySelector("h1, .panel");
    if (el) el.id = "main-content";
  }

  function applyTheme(isDark) {
    document.documentElement.classList.toggle("theme-dark", isDark);
    localStorage.setItem(STORAGE_KEYS.theme, isDark ? "dark" : "light");
  }

  function applyDyslexiaFont(enabled) {
    document.documentElement.classList.toggle("font-dyslexia", enabled);
    localStorage.setItem(STORAGE_KEYS.dyslexia, enabled ? "1" : "0");
  }

  function applyLanguage(lang) {
    const dict = I18N[lang] || I18N.pt;
    document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.setAttribute("placeholder", dict[key]);
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      if (dict[key]) el.setAttribute("aria-label", dict[key]);
    });
    const a11yPanel = document.getElementById("hub-a11y-panel");
    if (a11yPanel && dict.a11yTitle) a11yPanel.setAttribute("aria-label", dict.a11yTitle);
    localStorage.setItem(STORAGE_KEYS.language, lang);
    document.dispatchEvent(new CustomEvent("hub:langchanged", { detail: { lang } }));
  }

  function t(key, fallback = "") {
    const lang = localStorage.getItem(STORAGE_KEYS.language) || "pt";
    const dict = I18N[lang] || I18N.pt;
    return dict[key] || fallback || key;
  }

  function mountPanel() {
    const savedLang = localStorage.getItem(STORAGE_KEYS.language) || "pt";
    const dict = I18N[savedLang] || I18N.pt;
    const panel = document.createElement("div");
    panel.id = "hub-a11y-panel";
    panel.className = "a11y-panel";
    panel.setAttribute("tabindex", "-1");
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = `
      <h4 data-i18n="a11yTitle">${dict.a11yTitle}</h4>
      <div class="a11y-row"><button type="button" id="a11yThemeBtn" data-i18n="toggleTheme">${dict.toggleTheme}</button></div>
      <div class="a11y-row"><button type="button" id="a11yDyslexiaBtn" data-i18n="toggleDyslexia">${dict.toggleDyslexia}</button></div>
      <div class="a11y-row">
        <label for="a11yLang" style="min-width:48px;" data-i18n="langLabel">${dict.langLabel}</label>
        <select id="a11yLang">
          <option value="pt">PT</option>
          <option value="en">EN</option>
          <option value="es">ES</option>
        </select>
      </div>
    `;
    panel.setAttribute("role", "region");
    const header = document.querySelector(".hub-site-header");
    if (header) {
      header.appendChild(panel);
    } else {
      panel.classList.add("a11y-panel--floating");
      document.body.appendChild(panel);
    }

    const toggle = document.getElementById("hub-a11y-toggle");

    function setA11yOpen(open) {
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    setA11yOpen(false);

    function focusPanelPrimary() {
      const first = panel.querySelector("button, select");
      window.requestAnimationFrame(() => {
        (first || panel).focus({ preventScroll: true });
      });
    }

    if (toggle) {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !panel.classList.contains("is-open");
        setA11yOpen(next);
        if (next) focusPanelPrimary();
      });
    }

    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("is-open")) return;
      if (toggle && toggle.contains(e.target)) return;
      if (panel.contains(e.target)) return;
      setA11yOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!panel.classList.contains("is-open")) return;
      setA11yOpen(false);
      toggle?.focus();
    });

    window.hubOpenA11yPanel = () => {
      setA11yOpen(true);
      focusPanelPrimary();
    };
    window.hubCloseA11yPanel = () => setA11yOpen(false);

    const themeBtn = document.getElementById("a11yThemeBtn");
    const dyslexiaBtn = document.getElementById("a11yDyslexiaBtn");
    const langSelect = document.getElementById("a11yLang");

    const currentTheme = localStorage.getItem(STORAGE_KEYS.theme) === "dark";
    const currentDyslexia = localStorage.getItem(STORAGE_KEYS.dyslexia) === "1";
    langSelect.value = savedLang;
    applyTheme(currentTheme);
    applyDyslexiaFont(currentDyslexia);
    applyLanguage(savedLang);

    themeBtn.addEventListener("click", () => {
      applyTheme(!document.documentElement.classList.contains("theme-dark"));
    });
    dyslexiaBtn.addEventListener("click", () => {
      applyDyslexiaFont(!document.documentElement.classList.contains("font-dyslexia"));
    });
    langSelect.addEventListener("change", (e) => {
      applyLanguage(e.target.value);
    });
  }

  function mountVLibras() {
    if (document.querySelector("[vw]")) return;
    const wrapper = document.createElement("div");
    wrapper.setAttribute("vw", "");
    wrapper.className = "enabled";
    wrapper.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    `;
    document.body.appendChild(wrapper);

    const script = document.createElement("script");
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.onload = function () {
      if (window.VLibras) {
        new window.VLibras.Widget("https://vlibras.gov.br/app");
      }
    };
    document.body.appendChild(script);
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.hubI18n = { t };
    injectBaseStyles();
    addSkipLink();
    mountPanel();
    mountVLibras();
  });
})();
