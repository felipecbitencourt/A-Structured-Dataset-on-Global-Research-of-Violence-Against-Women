import { applyFiltersToInputs, buildForwardLink, collectFiltersFromInputs, normalizeFilters, parseFiltersFromUrl, writeFiltersToUrl } from "./state.js";
import { computeMegatopicPageMetrics, computeTopicPageMetrics, exportRowsToCsv, filterArticles, getFilterDimensions, runCrossLevelConsistency } from "./queryEngine.js";

function option(selectId, value, text) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const el = document.createElement("option");
  el.value = String(value);
  el.textContent = text;
  select.appendChild(el);
}

function syncNav(filters) {
  document.getElementById("linkArticles").href = buildForwardLink("./articles.html", filters);
  document.getElementById("linkTopics").href = buildForwardLink("./topics.html", filters);
}

function t(key, fallback) {
  return window.hubI18n?.t?.(key, fallback) ?? fallback;
}

async function populateFilters() {
  const dimensions = await getFilterDimensions();
  dimensions.countries.forEach((c) => option("country", c, c));
  dimensions.topics.forEach((t) => option("topic", t.id, `${t.id} - ${t.name}`));
  dimensions.megatopics.forEach((m) => option("megatopic", m.id, `${m.id} - ${m.name}`));
  dimensions.flows.forEach((f) => option("researchFlow", f, f));
}

function fillTable(rows, rawFilters) {
  const body = document.getElementById("megaBody");
  body.innerHTML = "";
  rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement("tr");
    const link = buildForwardLink("./topics.html", { ...rawFilters, megatopic_id: row.megatopic_id });
    tr.innerHTML = `<td>${row.megatopic_id}</td><td>${row.megatopic_description}</td><td>${row.article_count_filtered}</td><td>${row.coherence_cv_mean ?? "-"}</td><td>${row.growth_rate_5yr ?? "-"}</td><td><a class="link-button" href="${link}">${t("homeOpenMeso", "Abrir")}</a></td>`;
    body.appendChild(tr);
  });
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

async function render() {
  const raw = collectFiltersFromInputs();
  writeFiltersToUrl(raw);
  syncNav(raw);
  const normalized = normalizeFilters(raw);
  const [metrics, topicMetrics, rows] = await Promise.all([
    computeMegatopicPageMetrics(normalized),
    computeTopicPageMetrics(normalized),
    filterArticles(normalized),
  ]);
  runCrossLevelConsistency(rows, topicMetrics.topicSeries, metrics.megatopicSeries);
  const series = metrics.megatopicSeries;
  document.getElementById("selectedCounter").textContent = `${rows.length} ${t("selectedArticles", "artigos selecionados")}`;
  document.getElementById("consistencyHint").textContent = "Consistência micro/meso/macro validada no motor.";
  const prev = Number(document.body.dataset.prevCount || rows.length);
  const delta = rows.length - prev;
  document.getElementById("deltaCounter").textContent = `Δ ${delta >= 0 ? "+" : ""}${delta}`;
  document.body.dataset.prevCount = String(rows.length);
  document.getElementById("emptyState").style.display = rows.length === 0 ? "block" : "none";

  Plotly.newPlot("chartMegaCount", [{ x: series.map((x) => x.megatopic_id), y: series.map((x) => x.article_count_filtered), type: "bar" }]);
  Plotly.newPlot("chartMegaShare", [{ x: series.map((x) => x.megatopic_id), y: series.map((x) => x.article_share), type: "bar" }]);
  Plotly.newPlot("chartMegaCoherence", [{ x: series.map((x) => x.megatopic_id), y: series.map((x) => x.coherence_cv_mean), type: "bar" }]);
  Plotly.newPlot("chartMegaCoherenceNorm", [{ x: series.map((x) => x.megatopic_id), y: series.map((x) => x.normalized_coherence), type: "bar" }]);
  Plotly.newPlot("chartMegaFlow", [{ x: series.map((x) => x.megatopic_id), y: series.map((x) => x.research_flow_pct), type: "bar" }]);
  fillTable(series, raw);
  document.getElementById("exportCsvBtn").onclick = () => {
    saveFile("megatopics_filtered_articles.csv", exportRowsToCsv(rows), "text/csv;charset=utf-8");
  };
  document.getElementById("exportJsonBtn").onclick = () => {
    saveFile("megatopics_filtered_articles.json", JSON.stringify(rows, null, 2), "application/json;charset=utf-8");
  };
  document.getElementById("exportFiltersBtn").onclick = () => {
    saveFile("megatopics_filters.json", JSON.stringify(raw, null, 2), "application/json;charset=utf-8");
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
  alert("Falha ao carregar a página macro.");
});

document.addEventListener("hub:langchanged", () => {
  render().catch((err) => console.error(err));
});
