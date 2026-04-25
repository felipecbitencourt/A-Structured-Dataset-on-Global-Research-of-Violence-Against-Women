const DEFAULT_FILTERS = {
  year_min: "",
  year_max: "",
  study_country: "",
  topic_id: "",
  megatopic_id: "",
  research_flow: "",
  geoMode: "context",
};

export function parseFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    year_min: params.get("year_min") || "",
    year_max: params.get("year_max") || "",
    study_country: params.get("study_country") || "",
    topic_id: params.get("topic_id") || "",
    megatopic_id: params.get("megatopic_id") || "",
    research_flow: params.get("research_flow") || "",
    geoMode: params.get("geoMode") || "context",
  };
}

export function normalizeFilters(raw) {
  return {
    year_min: raw.year_min ? Number(raw.year_min) : undefined,
    year_max: raw.year_max ? Number(raw.year_max) : undefined,
    study_country: raw.study_country || undefined,
    topic_id: raw.topic_id ? Number(raw.topic_id) : undefined,
    megatopic_id: raw.megatopic_id ? Number(raw.megatopic_id) : undefined,
    research_flow: raw.research_flow || undefined,
    geoMode: raw.geoMode || "context",
  };
}

export function writeFiltersToUrl(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", next);
}

export function collectFiltersFromInputs() {
  return {
    year_min: document.getElementById("yearMin")?.value || "",
    year_max: document.getElementById("yearMax")?.value || "",
    study_country: document.getElementById("country")?.value || "",
    topic_id: document.getElementById("topic")?.value || "",
    megatopic_id: document.getElementById("megatopic")?.value || "",
    research_flow: document.getElementById("researchFlow")?.value || "",
    geoMode: document.getElementById("geoMode")?.value || "context",
  };
}

export function applyFiltersToInputs(filters) {
  const merged = { ...DEFAULT_FILTERS, ...filters };
  const mappings = [
    ["yearMin", merged.year_min],
    ["yearMax", merged.year_max],
    ["country", merged.study_country],
    ["topic", merged.topic_id],
    ["megatopic", merged.megatopic_id],
    ["researchFlow", merged.research_flow],
    ["geoMode", merged.geoMode],
  ];
  mappings.forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? "";
  });
}

export function buildForwardLink(pageName, filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return `${pageName}${query ? `?${query}` : ""}`;
}
