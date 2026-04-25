export const SEMANTIC_CONFIG = {
  dimensions: {
    year: { label: "Ano", type: "continuous" },
    study_country: { label: "Contexto (país de estudo)", type: "categorical" },
    researcher_country: { label: "Produção (país do pesquisador)", type: "categorical" },
    topic_id: { label: "Tópico", type: "categorical" },
    megatopic_id: { label: "Megatópico", type: "categorical" },
    research_flow: { label: "Fluxo de pesquisa", type: "categorical" },
  },
  metrics: {
    coherence_cv: {
      label: "Coherence Cv",
      type: "continuous",
      note: "Maior valor indica maior coerência semântica do tópico.",
    },
    growth_rate_5yr: {
      label: "Crescimento em 5 anos",
      type: "continuous",
      note: "Comparação entre períodos recentes e anteriores.",
    },
    research_flow_pct: {
      label: "Percentual de fluxo",
      type: "continuous",
      note: "Proporção de artigos por configuração de fluxo.",
    },
  },
  geoModes: {
    context: {
      label: "Contexto empírico",
      latField: "latitude",
      lonField: "longitude",
      countryField: "study_country",
      note: "Onde o fenômeno estudado ocorre.",
    },
    production: {
      label: "Produção científica",
      latField: "latitude",
      lonField: "longitude",
      countryField: "researcher_country",
      note: "Onde o conhecimento é produzido (afiliação de pesquisa).",
    },
  },
};
