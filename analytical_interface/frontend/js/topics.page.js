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
  document.getElementById("linkMegatopics").href = buildForwardLink("./megatopics.html", filters);
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
  const body = document.getElementById("topicBody");
  body.innerHTML = "";
  rows.slice(0, 20).forEach((row) => {
    const tr = document.createElement("tr");
    const link = buildForwardLink("./articles.html", { ...rawFilters, topic_id: row.topic_id });
    tr.innerHTML = `<td>${row.topic_id}</td><td>${row.topic_description}</td><td>${row.article_count_filtered}</td><td>${row.coherence_cv ?? "-"}</td><td>${row.growth_rate_5yr ?? "-"}</td><td><a class="link-button" href="${link}">${t("homeOpenMicro", "Abrir")}</a></td>`;
    body.appendChild(tr);
  });
}

function fillCompareSelectors(rows) {
  const a = document.getElementById("compareTopicA");
  const b = document.getElementById("compareTopicB");
  [a, b].forEach((select) => {
    select.innerHTML = `<option value="">${t("selectOption", "Selecione")}</option>`;
    rows.slice(0, 30).forEach((row) => option(select.id, row.topic_id, `${row.topic_id} - ${row.topic_description}`));
  });
}

function renderAB(rows) {
  const aId = Number(document.getElementById("compareTopicA").value);
  const bId = Number(document.getElementById("compareTopicB").value);
  const out = document.getElementById("compareOutput");
  if (!aId || !bId) {
    out.textContent = "";
    return;
  }
  const a = rows.find((x) => x.topic_id === aId);
  const b = rows.find((x) => x.topic_id === bId);
  if (!a || !b) {
    out.textContent = t("compareOutOfSlice", "Os tópicos selecionados não estão no recorte atual.");
    return;
  }
  const deltaVol = a.article_count_filtered - b.article_count_filtered;
  const deltaCv = (a.coherence_cv ?? 0) - (b.coherence_cv ?? 0);
  out.textContent = `A vs B -> Δ volume: ${deltaVol}, Δ coherence_cv: ${deltaCv.toFixed(3)}`;
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
  const [metrics, megaMetrics, rows] = await Promise.all([
    computeTopicPageMetrics(normalized),
    computeMegatopicPageMetrics(normalized),
    filterArticles(normalized),
  ]);
  runCrossLevelConsistency(rows, metrics.topicSeries, megaMetrics.megatopicSeries);
  const series = metrics.topicSeries;
  document.getElementById("selectedCounter").textContent = `${rows.length} ${t("selectedArticles", "artigos selecionados")}`;
  document.getElementById("consistencyHint").textContent = "Consistência micro/meso/macro validada no motor.";
  const prev = Number(document.body.dataset.prevCount || rows.length);
  const delta = rows.length - prev;
  document.getElementById("deltaCounter").textContent = `Δ ${delta >= 0 ? "+" : ""}${delta}`;
  document.body.dataset.prevCount = String(rows.length);
  document.getElementById("emptyState").style.display = rows.length === 0 ? "block" : "none";

  Plotly.newPlot("chartTopicCount", [{ x: series.map((x) => x.topic_id), y: series.map((x) => x.article_count_filtered), type: "bar" }]);
  Plotly.newPlot("chartTopicCoherence", [{ x: series.map((x) => x.topic_id), y: series.map((x) => x.coherence_cv), type: "bar" }]);
  Plotly.newPlot("chartTopicGrowth", [{ x: series.map((x) => x.topic_id), y: series.map((x) => x.growth_rate_5yr), type: "bar" }]);
  Plotly.newPlot("chartTopicGrowthNorm", [{ x: series.map((x) => x.topic_id), y: series.map((x) => x.normalized_growth_rate), type: "bar" }]);

  const topTopicIds = new Set(series.slice(0, 5).map((x) => x.topic_id));
  const temporal = metrics.temporal.filter((x) => topTopicIds.has(x.topic_id));
  const traces = [...topTopicIds].map((topicId) => {
    const points = temporal.filter((x) => x.topic_id === topicId).sort((a, b) => a.year - b.year);
    return { x: points.map((x) => x.year), y: points.map((x) => x.article_count), type: "scatter", name: `Topic ${topicId}` };
  });
  Plotly.newPlot("chartTopicTemporal", traces);

  fillTable(series, raw);
  fillCompareSelectors(series);
  renderAB(series);
  document.getElementById("compareTopicA").onchange = () => renderAB(series);
  document.getElementById("compareTopicB").onchange = () => renderAB(series);
  document.getElementById("exportCsvBtn").onclick = () => {
    saveFile("topics_filtered_articles.csv", exportRowsToCsv(rows), "text/csv;charset=utf-8");
  };
  document.getElementById("exportJsonBtn").onclick = () => {
    saveFile("topics_filtered_articles.json", JSON.stringify(rows, null, 2), "application/json;charset=utf-8");
  };
  document.getElementById("exportFiltersBtn").onclick = () => {
    saveFile("topics_filters.json", JSON.stringify(raw, null, 2), "application/json;charset=utf-8");
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
  alert("Falha ao carregar a página meso.");
});

document.addEventListener("hub:langchanged", () => {
  render().catch((err) => console.error(err));
});
