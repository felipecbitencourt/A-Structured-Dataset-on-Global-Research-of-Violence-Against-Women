// Synthetic article sample generator that matches meta.json distributions
window.SAMPLE_DATA = (function () {
  const countries = [
    { code: "USA", name: "United States", lat: 39.78, lon: -100.44, cont: "América" },
    { code: "BRA", name: "Brasil", lat: -14.2, lon: -51.9, cont: "América" },
    { code: "CAN", name: "Canadá", lat: 61.07, lon: -107.99, cont: "América" },
    { code: "MEX", name: "México", lat: 23.65, lon: -102.0, cont: "América" },
    { code: "GBR", name: "Reino Unido", lat: 51.5, lon: -0.12, cont: "Europa" },
    { code: "FRA", name: "França", lat: 46.22, lon: 2.21, cont: "Europa" },
    { code: "DEU", name: "Alemanha", lat: 51.16, lon: 10.45, cont: "Europa" },
    { code: "ESP", name: "Espanha", lat: 40.46, lon: -3.74, cont: "Europa" },
    { code: "ITA", name: "Itália", lat: 41.87, lon: 12.56, cont: "Europa" },
    { code: "SWE", name: "Suécia", lat: 60.12, lon: 18.64, cont: "Europa" },
    { code: "IND", name: "Índia", lat: 20.59, lon: 78.96, cont: "Ásia" },
    { code: "CHN", name: "China", lat: 35.86, lon: 104.19, cont: "Ásia" },
    { code: "TUR", name: "Turquia", lat: 38.96, lon: 35.24, cont: "Ásia" },
    { code: "JPN", name: "Japão", lat: 36.2, lon: 138.25, cont: "Ásia" },
    { code: "PAK", name: "Paquistão", lat: 30.38, lon: 69.35, cont: "Ásia" },
    { code: "KOR", name: "Coreia do Sul", lat: 35.9, lon: 127.77, cont: "Ásia" },
    { code: "NPL", name: "Nepal", lat: 28.39, lon: 84.12, cont: "Ásia" },
    { code: "ETH", name: "Etiópia", lat: 9.14, lon: 40.49, cont: "África" },
    { code: "KEN", name: "Quênia", lat: -0.02, lon: 37.9, cont: "África" },
    { code: "NGA", name: "Nigéria", lat: 9.08, lon: 8.67, cont: "África" },
    { code: "ZAF", name: "África do Sul", lat: -30.56, lon: 22.94, cont: "África" },
    { code: "UGA", name: "Uganda", lat: 1.37, lon: 32.29, cont: "África" },
    { code: "GHA", name: "Gana", lat: 7.95, lon: -1.03, cont: "África" },
    { code: "TZA", name: "Tanzânia", lat: -6.37, lon: 34.89, cont: "África" },
    { code: "MWI", name: "Malawi", lat: -13.25, lon: 34.3, cont: "África" },
    { code: "LBN", name: "Líbano", lat: 33.85, lon: 35.86, cont: "Ásia" },
    { code: "AUS", name: "Austrália", lat: -25.27, lon: 133.77, cont: "Oceania" },
    { code: "ECU", name: "Equador", lat: -1.83, lon: -78.18, cont: "América" },
    { code: "COL", name: "Colômbia", lat: 4.57, lon: -74.3, cont: "América" },
    { code: "PER", name: "Peru", lat: -9.19, lon: -75.02, cont: "América" },
  ];

  const flows = ["Domestic", "Cross-continental", "Multi-national", "Intra-continental"];
  const flowWeights = [0.48, 0.18, 0.22, 0.12];

  function weighted(items, weights) {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < items.length; i++) { acc += weights[i]; if (r < acc) return items[i]; }
    return items[items.length - 1];
  }

  // Seeded rng for stable data
  let seed = 17;
  function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }

  function buildArticles(topics, megatopics) {
    const arts = [];
    // Distribute 580 per topic.article_count, fallback proportional
    const totalByTopic = topics.reduce((s, t) => s + t.article_count, 0);
    const target = 580;
    topics.forEach((t) => {
      const n = Math.max(1, Math.round((t.article_count / totalByTopic) * target));
      for (let i = 0; i < n; i++) {
        const year = Math.round(t.mean_year + (rng() - 0.5) * 2 * (t.year_std || 2));
        const yr = Math.max(2011, Math.min(2025, year));
        const cIdx = Math.floor(rng() * countries.length);
        const c = countries[cIdx];
        // researcher country: sometimes same as study
        const sameRes = rng() < 0.55;
        const r = sameRes ? c : countries[Math.floor(rng() * countries.length)];
        const flowIdx = (() => {
          const v = rng();
          let acc = 0;
          for (let j = 0; j < flows.length; j++) { acc += flowWeights[j]; if (v < acc) return j; }
          return 0;
        })();
        let flow = flows[flowIdx];
        // override flow to match study/researcher continent
        if (c.cont === r.cont && c.code === r.code) flow = "Domestic";
        else if (c.cont !== r.cont) flow = rng() < 0.6 ? "Cross-continental" : "Multi-national";
        arts.push({
          article_id: arts.length + 1,
          year: yr,
          study_country: c.code,
          study_country_name: c.name,
          study_continent: c.cont,
          researcher_country: r.code,
          researcher_country_name: r.name,
          researcher_continent: r.cont,
          topic_id: t.topic_id,
          topic_description: t.topic_description,
          megatopic_id: t.megatopic_id,
          megatopic_description: t.megatopic_description,
          journal: ["PLOS ONE", "BMC Public Health", "The Lancet Glob Health", "Violence Against Women", "J Interpers Violence"][Math.floor(rng() * 5)],
          research_flow: flow,
          latitude: c.lat + (rng() - 0.5) * 4,
          longitude: c.lon + (rng() - 0.5) * 4,
          is_multi_country: flow === "Multi-national" ? 1 : 0,
        });
      }
    });
    return arts.slice(0, target);
  }

  return { countries, flows, buildArticles };
})();
