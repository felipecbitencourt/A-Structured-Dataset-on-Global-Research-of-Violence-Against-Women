import { loadData } from "./dataStore.js";

const DEV_MODE = true;

function isValid(value) {
  return value !== null && value !== undefined && value !== "" && value !== "nan";
}

function toNumber(value) {
  if (!isValid(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function label(value) {
  return isValid(value) ? value : "Sem dados";
}

function assertTypeNumber(value, fieldName) {
  if (value === null || value === undefined) return;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Campo ${fieldName} esperado como numero, recebido: ${value}`);
  }
}

function groupCount(rows, selector, keyName) {
  const map = new Map();
  rows.forEach((row) => {
    const key = label(selector(row));
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([key, article_count]) => ({ [keyName]: key, article_count }));
}

function normalizeMinMax(rows, field, targetField) {
  const values = rows.map((x) => x[field]).filter((x) => typeof x === "number" && Number.isFinite(x));
  if (values.length === 0) {
    rows.forEach((x) => {
      x[targetField] = null;
    });
    return rows;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  rows.forEach((x) => {
    const v = x[field];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      x[targetField] = null;
    } else if (span === 0) {
      x[targetField] = 0.5;
    } else {
      x[targetField] = (v - min) / span;
    }
  });
  return rows;
}

function applyFilters(rows, filters = {}) {
  return rows.filter((row) => {
    const year = toNumber(row.year);
    const topicId = toNumber(row.topic_id);
    const megatopicId = toNumber(row.megatopic_id);
    if (filters.year_min !== undefined && year !== null && year < filters.year_min) return false;
    if (filters.year_max !== undefined && year !== null && year > filters.year_max) return false;
    if (filters.study_country && row.study_country !== filters.study_country) return false;
    if (filters.topic_id !== undefined && topicId !== filters.topic_id) return false;
    if (filters.megatopic_id !== undefined && megatopicId !== filters.megatopic_id) return false;
    if (filters.research_flow && row.research_flow !== filters.research_flow) return false;
    return true;
  });
}

function deriveMetrics(rows) {
  return {
    articles_per_year: groupCount(rows, (r) => toNumber(r.year), "year")
      .filter((x) => x.year !== "Sem dados")
      .sort((a, b) => Number(a.year) - Number(b.year)),
    country_share: groupCount(rows, (r) => r.study_country, "label")
      .sort((a, b) => b.article_count - a.article_count)
      .slice(0, 10),
  };
}

function consistencyContracts(rows, topicSeries, megatopicSeries) {
  const total = rows.length;
  const sumTopics = topicSeries.reduce((acc, x) => acc + x.article_count_filtered, 0);
  const sumMegas = megatopicSeries.reduce((acc, x) => acc + x.article_count_filtered, 0);
  if (DEV_MODE && sumTopics !== total) {
    console.warn(`[consistency] soma de tópicos (${sumTopics}) != total de artigos (${total})`);
  }
  if (DEV_MODE && sumMegas !== total) {
    console.warn(`[consistency] soma de megatópicos (${sumMegas}) != total de artigos (${total})`);
  }
}

export async function getFilterDimensions() {
  const data = await loadData();
  const years = [...new Set(data.articles.map((x) => toNumber(x.year)).filter((x) => x !== null))].sort(
    (a, b) => a - b
  );
  const countries = [...new Set(data.articles.map((x) => x.study_country).filter(isValid))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
  const flows = [...new Set(data.articles.map((x) => x.research_flow).filter(isValid))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
  const topics = data.topics
    .map((t) => ({ id: toNumber(t.topic_id), name: t.topic_description }))
    .filter((t) => t.id !== null)
    .sort((a, b) => a.id - b.id);
  const megatopics = data.megatopics
    .map((m) => ({ id: toNumber(m.megatopic_id), name: m.megatopic_description }))
    .filter((m) => m.id !== null)
    .sort((a, b) => a.id - b.id);
  return { years, countries, flows, topics, megatopics };
}

export async function filterArticles(filters = {}) {
  const data = await loadData();
  return applyFilters(data.articles, filters);
}

export async function computeArticlePageMetrics(filters = {}) {
  const rows = await filterArticles(filters);
  rows.forEach((r) => {
    assertTypeNumber(toNumber(r.year), "year");
    assertTypeNumber(toNumber(r.topic_id), "topic_id");
    assertTypeNumber(toNumber(r.megatopic_id), "megatopic_id");
  });
  const derived = deriveMetrics(rows);
  const kpis = {
    total_articles: rows.length,
    unique_study_countries: new Set(rows.map((r) => r.study_country).filter(isValid)).size,
    unique_journals: new Set(rows.map((r) => r.journal).filter(isValid)).size,
    cross_continental_articles: rows.filter((r) => r.research_flow === "Cross-continental").length,
  };
  const yearDist = derived.articles_per_year;
  const flowDist = groupCount(rows, (r) => r.research_flow, "category").sort(
    (a, b) => b.article_count - a.article_count
  );
  const countryDist = derived.country_share;
  const productionCountryDist = groupCount(rows, (r) => r.researcher_country, "label")
    .sort((a, b) => b.article_count - a.article_count)
    .slice(0, 10);
  const geoMap = new Map();
  const geoMapProduction = new Map();
  rows.forEach((row) => {
    const lat = toNumber(row.latitude);
    const lon = toNumber(row.longitude);
    if (lat === null || lon === null) return;
    const contextCountry = label(row.study_country);
    const productionCountry = label(row.researcher_country);
    const key = `${contextCountry}|${lat}|${lon}`;
    const keyProduction = `${productionCountry}|${lat}|${lon}`;
    geoMap.set(key, (geoMap.get(key) || 0) + 1);
    geoMapProduction.set(keyProduction, (geoMapProduction.get(keyProduction) || 0) + 1);
  });
  const geoPoints = [...geoMap.entries()].map(([key, article_count]) => {
    const [study_country, latitude, longitude] = key.split("|");
    return { study_country, latitude: Number(latitude), longitude: Number(longitude), article_count };
  });
  const geoPointsProduction = [...geoMapProduction.entries()].map(([key, article_count]) => {
    const [researcher_country, latitude, longitude] = key.split("|");
    return { researcher_country, latitude: Number(latitude), longitude: Number(longitude), article_count };
  });
  return { rows, kpis, yearDist, flowDist, countryDist, productionCountryDist, geoPoints, geoPointsProduction };
}

export async function computeTopicPageMetrics(filters = {}) {
  const data = await loadData();
  const rows = await filterArticles(filters);
  const counts = groupCount(rows, (r) => toNumber(r.topic_id), "topic_id").filter((x) => x.topic_id !== "Sem dados");
  const topicMeta = new Map(data.topics.map((t) => [toNumber(t.topic_id), t]));
  let topicSeries = counts
    .map((item) => {
      const id = Number(item.topic_id);
      const meta = topicMeta.get(id) || {};
      return {
        topic_id: id,
        topic_description: meta.topic_description || "Sem dados",
        article_count_filtered: item.article_count,
        coherence_cv: toNumber(meta.coherence_cv),
        growth_rate_5yr: toNumber(meta.growth_rate_5yr),
        research_flow_diversity: toNumber(meta.research_flow_diversity),
      };
    })
    .sort((a, b) => b.article_count_filtered - a.article_count_filtered);
  topicSeries = normalizeMinMax(topicSeries, "growth_rate_5yr", "normalized_growth_rate");
  topicSeries = normalizeMinMax(topicSeries, "coherence_cv", "normalized_coherence");

  const byYearTopic = new Map();
  rows.forEach((r) => {
    const year = toNumber(r.year);
    const topic = toNumber(r.topic_id);
    if (year === null || topic === null) return;
    const key = `${topic}|${year}`;
    byYearTopic.set(key, (byYearTopic.get(key) || 0) + 1);
  });
  const temporal = [...byYearTopic.entries()].map(([key, article_count]) => {
    const [topic_id, year] = key.split("|");
    return { topic_id: Number(topic_id), year: Number(year), article_count };
  });
  return { topicSeries, temporal, total_articles_filtered: rows.length };
}

export async function computeMegatopicPageMetrics(filters = {}) {
  const data = await loadData();
  const rows = await filterArticles(filters);
  const counts = groupCount(rows, (r) => toNumber(r.megatopic_id), "megatopic_id").filter(
    (x) => x.megatopic_id !== "Sem dados"
  );
  const megaMeta = new Map(data.megatopics.map((m) => [toNumber(m.megatopic_id), m]));
  let megatopicSeries = counts
    .map((item) => {
      const id = Number(item.megatopic_id);
      const meta = megaMeta.get(id) || {};
      return {
        megatopic_id: id,
        megatopic_description: meta.megatopic_description || "Sem dados",
        article_count_filtered: item.article_count,
        article_share: toNumber(meta.article_share),
        coherence_cv_mean: toNumber(meta.coherence_cv_mean),
        growth_rate_5yr: toNumber(meta.growth_rate_5yr),
        research_flow_pct: toNumber(meta.research_flow_pct),
      };
    })
    .sort((a, b) => b.article_count_filtered - a.article_count_filtered);
  megatopicSeries = normalizeMinMax(megatopicSeries, "growth_rate_5yr", "normalized_growth_rate");
  megatopicSeries = normalizeMinMax(megatopicSeries, "coherence_cv_mean", "normalized_coherence");
  return { megatopicSeries, total_articles_filtered: rows.length };
}

export function runCrossLevelConsistency(rows, topicSeries, megatopicSeries) {
  consistencyContracts(rows, topicSeries, megatopicSeries);
}

export function exportRowsToCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const line = headers
      .map((h) => {
        const v = row[h] ?? "";
        const s = String(v).replaceAll('"', '""');
        return `"${s}"`;
      })
      .join(",");
    lines.push(line);
  });
  return lines.join("\n");
}
