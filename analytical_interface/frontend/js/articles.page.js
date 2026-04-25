import { buildForwardLink, collectFiltersFromInputs, normalizeFilters, parseFiltersFromUrl, writeFiltersToUrl, applyFiltersToInputs } from "./state.js";
import { computeArticlePageMetrics, computeMegatopicPageMetrics, computeTopicPageMetrics, exportRowsToCsv, getFilterDimensions, runCrossLevelConsistency } from "./queryEngine.js";

function option(selectId, value, text) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const el = document.createElement("option");
  el.value = String(value);
  el.textContent = text;
  select.appendChild(el);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

function t(key, fallback) {
  return window.hubI18n?.t?.(key, fallback) ?? fallback;
}

function saveFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function syncNav(filters) {
  document.getElementById("linkTopics").href = buildForwardLink("./topics.html", filters);
  document.getElementById("linkMegatopics").href = buildForwardLink("./megatopics.html", filters);
}

function renderTable(rows) {
  const body = document.getElementById("articleBody");
  body.innerHTML = "";
  rows.slice(0, 20).forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.article_id ?? ""}</td><td>${r.year ?? ""}</td><td>${r.study_country ?? "Sem dados"}</td><td>${r.topic_id ?? ""}</td><td>${r.megatopic_id ?? ""}</td><td>${r.research_flow ?? "Sem dados"}</td>`;
    body.appendChild(tr);
  });
}

async function populateFilters() {
  const dimensions = await getFilterDimensions();
  dimensions.countries.forEach((c) => option("country", c, c));
  dimensions.topics.forEach((t) => option("topic", t.id, `${t.id} - ${t.name}`));
  dimensions.megatopics.forEach((m) => option("megatopic", m.id, `${m.id} - ${m.name}`));
  dimensions.flows.forEach((f) => option("researchFlow", f, f));
}

async function render() {
  const raw = collectFiltersFromInputs();
  writeFiltersToUrl(raw);
  syncNav(raw);
  const normalized = normalizeFilters(raw);
  const [metrics, topicMetrics, megaMetrics] = await Promise.all([
    computeArticlePageMetrics(normalized),
    computeTopicPageMetrics(normalized),
    computeMegatopicPageMetrics(normalized),
  ]);
  runCrossLevelConsistency(metrics.rows, topicMetrics.topicSeries, megaMetrics.megatopicSeries);
  setText("kpiTotal", metrics.kpis.total_articles);
  setText("kpiCountries", metrics.kpis.unique_study_countries);
  setText("kpiJournals", metrics.kpis.unique_journals);
  setText("kpiCross", metrics.kpis.cross_continental_articles);

  Plotly.newPlot("chartYear", [{ x: metrics.yearDist.map((x) => x.year), y: metrics.yearDist.map((x) => x.article_count), type: "scatter" }]);
  Plotly.newPlot("chartFlow", [{ x: metrics.flowDist.map((x) => x.category), y: metrics.flowDist.map((x) => x.article_count), type: "bar" }]);
  Plotly.newPlot("chartCountries", [{ x: metrics.countryDist.map((x) => x.label), y: metrics.countryDist.map((x) => x.article_count), type: "bar" }]);
  const geoMode = raw.geoMode || "context";
  const mapPoints = geoMode === "production" ? metrics.geoPointsProduction : metrics.geoPoints;
  const legend = geoMode === "production" ? t("optionGeoProduction", "Mapa: produção") : t("optionGeoContext", "Mapa: contexto");
  setText("mapLegend", legend);
  Plotly.newPlot("chartMap", [{
    type: "scattergeo",
    mode: "markers",
    lon: mapPoints.map((d) => d.longitude),
    lat: mapPoints.map((d) => d.latitude),
    text: mapPoints.map((d) => `${d.study_country || d.researcher_country} (${d.article_count})`),
    marker: { size: mapPoints.map((d) => Math.max(6, d.article_count)), opacity: 0.7 },
  }], { geo: { projection: { type: "natural earth" } } });

  renderTable(metrics.rows);
  setText("selectedCounter", `${metrics.rows.length} ${t("selectedArticles", "artigos selecionados")}`);
  const prev = Number(document.body.dataset.prevCount || metrics.rows.length);
  const delta = metrics.rows.length - prev;
  setText("deltaCounter", `Δ ${delta >= 0 ? "+" : ""}${delta}`);
  document.body.dataset.prevCount = String(metrics.rows.length);
  document.getElementById("emptyState").style.display = metrics.rows.length === 0 ? "block" : "none";

  document.getElementById("exportCsvBtn").onclick = () => {
    saveFile("articles_filtered.csv", exportRowsToCsv(metrics.rows), "text/csv;charset=utf-8");
  };
  document.getElementById("exportJsonBtn").onclick = () => {
    saveFile("articles_filtered.json", JSON.stringify(metrics.rows, null, 2), "application/json;charset=utf-8");
  };
  document.getElementById("exportFiltersBtn").onclick = () => {
    saveFile("filters.json", JSON.stringify(raw, null, 2), "application/json;charset=utf-8");
  };
}

async function boot() {
  await populateFilters();
  const fromUrl = parseFiltersFromUrl();
  applyFiltersToInputs(fromUrl);
  await render();
  document.getElementById("applyFilters").addEventListener("click", render);
}

boot().catch((err) => {
  console.error(err);
  alert("Falha ao carregar a página micro.");
});

document.addEventListener("hub:langchanged", () => {
  render().catch((err) => console.error(err));
});
