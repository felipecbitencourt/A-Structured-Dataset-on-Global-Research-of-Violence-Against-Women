/* global React, ReactDOM */
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp } = React;

// ---------- Build sample articles from topics.json + sample-data.js helpers ----------
function buildSampleArticles(topics, megatopics) {
  const COUNTRIES = [
    ["USA", "United States", 39.78, -100.44, "América"],
    ["BRA", "Brasil", -14.2, -51.9, "América"],
    ["MEX", "México", 23.65, -102.0, "América"],
    ["CAN", "Canadá", 61.07, -107.99, "América"],
    ["GBR", "Reino Unido", 51.5, -0.12, "Europa"],
    ["FRA", "França", 46.22, 2.21, "Europa"],
    ["DEU", "Alemanha", 51.16, 10.45, "Europa"],
    ["ESP", "Espanha", 40.46, -3.74, "Europa"],
    ["ITA", "Itália", 41.87, 12.56, "Europa"],
    ["SWE", "Suécia", 60.12, 18.64, "Europa"],
    ["IND", "Índia", 20.59, 78.96, "Ásia"],
    ["CHN", "China", 35.86, 104.19, "Ásia"],
    ["TUR", "Turquia", 38.96, 35.24, "Ásia"],
    ["JPN", "Japão", 36.2, 138.25, "Ásia"],
    ["PAK", "Paquistão", 30.38, 69.35, "Ásia"],
    ["NPL", "Nepal", 28.39, 84.12, "Ásia"],
    ["LBN", "Líbano", 33.85, 35.86, "Ásia"],
    ["ETH", "Etiópia", 9.14, 40.49, "África"],
    ["KEN", "Quênia", -0.02, 37.9, "África"],
    ["NGA", "Nigéria", 9.08, 8.67, "África"],
    ["ZAF", "África do Sul", -30.56, 22.94, "África"],
    ["UGA", "Uganda", 1.37, 32.29, "África"],
    ["GHA", "Gana", 7.95, -1.03, "África"],
    ["TZA", "Tanzânia", -6.37, 34.89, "África"],
    ["AUS", "Austrália", -25.27, 133.77, "Oceania"],
    ["COL", "Colômbia", 4.57, -74.3, "América"],
  ];
  const FLOWS = ["Domestic", "Cross-continental", "Multi-national", "Intra-continental"];
  const FLOW_W = [0.48, 0.18, 0.22, 0.12];
  const JOURNALS = ["PLOS ONE", "BMC Public Health", "The Lancet Glob Health", "Violence Against Women", "J Interpers Violence", "Soc Sci Med", "Global Health Action"];
  const TITLE_FRAGS = [
    "Determinants of {topic} in {country}: a population-based study",
    "Patterns and predictors of {topic} among women in {country}",
    "A multilevel analysis of {topic} in {country}",
    "Longitudinal trajectories of {topic}: evidence from {country}",
    "{topic} and its association with mental health outcomes in {country}",
    "Beyond prevalence: rethinking {topic} in {country}",
    "Spatial heterogeneity of {topic} across regions of {country}",
    "Intersectional approaches to {topic}: a case study in {country}",
  ];

  let seed = 17;
  const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pickW = (items, ws) => { const r = rng(); let acc = 0; for (let i = 0; i < items.length; i++) { acc += ws[i]; if (r < acc) return items[i]; } return items[items.length - 1]; };

  const arts = [];
  const totalCount = topics.reduce((s, t) => s + (t.article_count || 1), 0);
  const target = 580;
  topics.forEach((t) => {
    const n = Math.max(1, Math.round((t.article_count || 1) / totalCount * target));
    for (let i = 0; i < n; i++) {
      const yr = Math.max(2011, Math.min(2025, Math.round((t.mean_year || 2018) + (rng() - 0.5) * 2 * (t.year_std || 3))));
      const c = COUNTRIES[Math.floor(rng() * COUNTRIES.length)];
      const sameRes = rng() < 0.55;
      const r = sameRes ? c : COUNTRIES[Math.floor(rng() * COUNTRIES.length)];
      let flow = pickW(FLOWS, FLOW_W);
      if (c[0] === r[0]) flow = "Domestic";
      else if (c[4] !== r[4]) flow = rng() < 0.65 ? "Cross-continental" : "Multi-national";
      const tplate = TITLE_FRAGS[Math.floor(rng() * TITLE_FRAGS.length)];
      const title = tplate.replace("{topic}", (t.topic_description || "the phenomenon").toLowerCase()).replace("{country}", c[1]);
      arts.push({
        id: arts.length + 1,
        year: yr,
        study_country: c[0], study_country_name: c[1], study_continent: c[4],
        researcher_country: r[0], researcher_country_name: r[1], researcher_continent: r[4],
        topic_id: t.topic_id, topic_description: t.topic_description,
        megatopic_id: t.megatopic_id,
        title, journal: JOURNALS[Math.floor(rng() * JOURNALS.length)],
        flow,
        latitude: c[2] + (rng() - 0.5) * 4, longitude: c[3] + (rng() - 0.5) * 4,
      });
    }
  });
  return arts.slice(0, target);
}

// ---------- enrich topics & megatopics with derived fields ----------
function enrichData(topicsRaw, megatopicsRaw, articles) {
  const topicArticleCount = {}, topicYearSeries = {}, topicCountries = {}, topicFlow = {};
  articles.forEach((a) => {
    topicArticleCount[a.topic_id] = (topicArticleCount[a.topic_id] || 0) + 1;
    if (!topicYearSeries[a.topic_id]) topicYearSeries[a.topic_id] = {};
    topicYearSeries[a.topic_id][a.year] = (topicYearSeries[a.topic_id][a.year] || 0) + 1;
    if (!topicCountries[a.topic_id]) topicCountries[a.topic_id] = new Set();
    topicCountries[a.topic_id].add(a.study_country);
    if (!topicFlow[a.topic_id]) topicFlow[a.topic_id] = {};
    topicFlow[a.topic_id][a.flow] = (topicFlow[a.topic_id][a.flow] || 0) + 1;
  });
  const topics = topicsRaw.map((t) => {
    const series = [];
    for (let y = 2011; y <= 2025; y++) series.push(topicYearSeries[t.topic_id]?.[y] || 0);
    const flowDist = Object.keys(topicFlow[t.topic_id] || {}).map((k) => ({ label: k, value: topicFlow[t.topic_id][k] }));
    return {
      ...t,
      article_count: topicArticleCount[t.topic_id] || t.article_count || 0,
      n_countries: (topicCountries[t.topic_id] || new Set()).size,
      yearly_series: series,
      flow_distribution: flowDist,
      coherence_cv: t.coherence_cv ?? (0.5 + Math.random() * 0.4),
      growth_rate_5yr: t.growth_rate_5yr ?? ((Math.random() - 0.3) * 2),
    };
  }).sort((a, b) => b.article_count - a.article_count);

  const megaCount = {}, megaCountries = {}, megaTopicCount = {};
  articles.forEach((a) => { megaCount[a.megatopic_id] = (megaCount[a.megatopic_id] || 0) + 1; if (!megaCountries[a.megatopic_id]) megaCountries[a.megatopic_id] = new Set(); megaCountries[a.megatopic_id].add(a.study_country); });
  topics.forEach((t) => { megaTopicCount[t.megatopic_id] = (megaTopicCount[t.megatopic_id] || 0) + 1; });
  const megatopics = megatopicsRaw.map((m) => {
    const topTopics = topics.filter(t => t.megatopic_id === m.megatopic_id).sort((a, b) => b.article_count - a.article_count);
    const topCountries = {};
    articles.filter(a => a.megatopic_id === m.megatopic_id).forEach((a) => { topCountries[a.study_country] = (topCountries[a.study_country] || 0) + 1; });
    const topCountriesArr = Object.entries(topCountries).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
    return {
      ...m,
      article_count: megaCount[m.megatopic_id] || 0,
      n_topics: megaTopicCount[m.megatopic_id] || m.n_topics || 0,
      n_countries: (megaCountries[m.megatopic_id] || new Set()).size,
      coherence_cv_mean: m.coherence_cv_mean ?? topTopics.reduce((s, t) => s + t.coherence_cv, 0) / Math.max(1, topTopics.length),
      growth_rate_5yr: m.growth_rate_5yr ?? topTopics.reduce((s, t) => s + t.growth_rate_5yr, 0) / Math.max(1, topTopics.length),
      top_countries: topCountriesArr.join(";"),
      top_topics: topTopics.slice(0, 5),
    };
  }).sort((a, b) => b.article_count - a.article_count);

  return { topics, megatopics };
}

function normalizeArticles(rawArticles) {
  const sanitizeJournal = (rawJournal) => {
    let clean = String(rawJournal || "").replace(/\s+/g, " ").trim();
    if (!clean) return "-";

    clean = clean.replace(/^"+|"+$/g, "");
    clean = clean.replace(/\s*doi:\s*.*$/i, "").replace(/\s*doi\s*.*$/i, "").trim();

    if (clean.includes(",")) {
      const head = clean.split(",")[0].trim();
      if (head && head.length <= 80 && head.split(" ").length >= 2) clean = head;
    }

    const looksLikeAbstract = /(in this study|we examined|a total of|compared to women|there is a need to|multivariable|prevalence of)/i.test(clean);
    if (looksLikeAbstract || clean.length > 120) return "-";

    return clean || "-";
  };

  return (rawArticles || []).map((a, idx) => {
    const flowRaw = (a.research_flow || "").trim();
    const flow = flowRaw === "Domestic" || flowRaw === "Cross-continental" || flowRaw === "Multi-national" || flowRaw === "Intra-continental"
      ? flowRaw
      : "Domestic";

    const studyCountry = String(a.study_country || "").split(";")[0].trim();
    const researcherCountry = String(a.researcher_country || "").split(";")[0].trim();

    return {
      id: a.article_id || idx + 1,
      year: Number(a.year) || 0,
      study_country: studyCountry,
      study_country_name: studyCountry,
      researcher_country: researcherCountry,
      researcher_country_name: researcherCountry,
      topic_id: Number(a.topic_id) || 0,
      megatopic_id: Number(a.megatopic_id) || 0,
      title: a.title || "Untitled",
      journal: sanitizeJournal(a.journal),
      flow,
      latitude: Number(a.latitude) || 0,
      longitude: Number(a.longitude) || 0,
    };
  }).filter((a) => a.year > 0 && a.topic_id > 0 && a.megatopic_id > 0);
}

// ---------- Inspector right panel ----------
function Inspector({ level, selectedTopic, selectedMega, articles, onClose, onDrillDown }) {
  if (level === "home") {
    return (
      <aside className="inspector">
        <div className="inspector-head"><span>Apparatus</span></div>
        <div>
          <h2>Como ler este hub</h2>
          <p style={{ fontFamily: "var(--serif)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6 }}>
            Comece pela <strong>pergunta de pesquisa</strong>, não pelo nível. As três escalas — micro, meso, macro — compartilham filtros via URL. Selecione um megatópico para descer ao meso; um tópico para descer ao micro; em qualquer ponto, edite o recorte temporal pela escala superior.
          </p>
        </div>
        <div>
          <div className="inspector-head" style={{ marginBottom: 8 }}><span>Atalhos editoriais</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button className="drill-btn">Recorte 2021–2025 <span>›</span></button>
            <button className="drill-btn">Foco em produção (mapa) <span>›</span></button>
            <button className="drill-btn">Comparar 2 tópicos (A/B) <span>›</span></button>
            <button className="drill-btn">Exportar CSV filtrado <span>›</span></button>
          </div>
        </div>
      </aside>
    );
  }

  if (level === "macro" && selectedMega) {
    return (
      <aside className="inspector">
        <div className="inspector-head"><span>Megatópico M{selectedMega.megatopic_id}</span><span className="close" onClick={onClose}>fechar ✕</span></div>
        <div>
          <h2>{selectedMega.megatopic_description}</h2>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
            {selectedMega.n_topics} tópicos · {fmtInt(selectedMega.article_count)} artigos · {selectedMega.n_countries} países
          </p>
        </div>
        <div className="meta-row">
          <span className="k">Cv médio</span><span className="num">{selectedMega.coherence_cv_mean.toFixed(3)}</span>
          <span className="k">Cresc. 5a</span><span className="num">{(selectedMega.growth_rate_5yr * 100).toFixed(0)}%</span>
          <span className="k">Tópicos</span><span className="num">{selectedMega.n_topics}</span>
          <span className="k">Países</span><span className="num">{selectedMega.n_countries}</span>
        </div>
        <div>
          <div className="inspector-head" style={{ marginBottom: 8 }}><span>Tópicos no megatópico</span></div>
          <div className="scrollbox">
            <BarList
              items={selectedMega.top_topics.map((t) => ({ label: t.topic_description, value: t.article_count, id: t.topic_id }))}
              max={Math.max(...selectedMega.top_topics.map(t => t.article_count), 1)}
              onClick={(it) => onDrillDown("meso")}
            />
          </div>
        </div>
        <div>
          <div className="inspector-head" style={{ marginBottom: 8 }}><span>Top países (contexto)</span></div>
          <div className="kw-cloud">
            {selectedMega.top_countries.split(";").filter(Boolean).map((c) => <span key={c} className="kw">{c}</span>)}
          </div>
        </div>
        <button className="drill-btn" onClick={() => onDrillDown("meso")}>Descer para Meso ▸ {selectedMega.megatopic_description.slice(0, 24)}…</button>
      </aside>
    );
  }

  if (level === "meso" && selectedTopic) {
    return (
      <aside className="inspector">
        <div className="inspector-head"><span>Tópico T{selectedTopic.topic_id}</span><span className="close" onClick={onClose}>fechar ✕</span></div>
        <div>
          <h2>{selectedTopic.topic_description}</h2>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
            Megatópico M{selectedTopic.megatopic_id} · {fmtInt(selectedTopic.article_count)} artigos no recorte
          </p>
        </div>
        <div className="meta-row">
          <span className="k">Cv</span><span className="num">{selectedTopic.coherence_cv.toFixed(3)}</span>
          <span className="k">Cresc. 5a</span><span className="num">{(selectedTopic.growth_rate_5yr * 100).toFixed(0)}%</span>
          <span className="k">Países</span><span className="num">{selectedTopic.n_countries}</span>
          <span className="k">Ano médio</span><span className="num">{Math.round(selectedTopic.mean_year || 2018)}</span>
        </div>
        <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 16 }}>
          <div className="inspector-head" style={{ marginBottom: 12 }}><span>Perfil do tópico</span></div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Radar metrics={[
              { label: "Volume", value: Math.min(1, selectedTopic.article_count / 60) },
              { label: "Coerência", value: Math.min(1, Math.max(0, (selectedTopic.coherence_cv - 0.4) / 0.5)) },
              { label: "Crescimento", value: Math.min(1, Math.max(0, selectedTopic.growth_rate_5yr / 2)) },
              { label: "Geografia", value: Math.min(1, selectedTopic.n_countries / 20) },
              { label: "Cross-flow", value: 0.5 + Math.random() * 0.4 },
            ]} />
          </div>
        </div>
        <button className="drill-btn" onClick={() => onDrillDown("micro")}>Ver artigos deste tópico ▸</button>
      </aside>
    );
  }

  return (
    <aside className="inspector">
      <div className="inspector-head"><span>Recorte ativo</span></div>
      <div>
        <h2 style={{ fontSize: 16 }}>{fmtInt(articles.length)} artigos no painel</h2>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--ink-3)", fontSize: 13 }}>
          Selecione um item da tabela para abrir sua ficha.
        </p>
      </div>
      <div>
        <div className="inspector-head" style={{ marginBottom: 8 }}><span>Ações</span></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="drill-btn">Exportar CSV filtrado <span>›</span></button>
          <button className="drill-btn">Exportar JSON filtrado <span>›</span></button>
          <button className="drill-btn">Copiar URL com filtros <span>›</span></button>
        </div>
      </div>
    </aside>
  );
}

// ---------- App ----------
function HubApp({ variant = "editorial" }) {
  const meta = useRes("data/meta.json");
  const topicsRaw = useDatasetRes("topics");
  const megatopicsRaw = useDatasetRes("megatopics");
  const articlesRaw = useDatasetRes("articles");

  const data = useMemoApp(() => {
    if (!topicsRaw || !megatopicsRaw || !articlesRaw) return null;
    const arts = normalizeArticles(articlesRaw);
    const enriched = enrichData(topicsRaw, megatopicsRaw, arts);
    return { articles: arts, ...enriched };
  }, [topicsRaw, megatopicsRaw, articlesRaw]);

  const [level, setLevel] = useStateApp("home");
  const [filters, setFilters] = useStateApp({ yearMin: 2011, yearMax: 2025, country: "", flow: "", geoMode: "context" });
  const [selectedMega, setSelectedMega] = useStateApp(null);
  const [selectedTopic, setSelectedTopic] = useStateApp(null);
  const [compareTopic, setCompareTopic] = useStateApp(null);

  useEffectApp(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [level]);

  const filtered = useMemoApp(() => {
    if (!data) return [];
    return data.articles.filter((a) => {
      if (a.year < filters.yearMin || a.year > filters.yearMax) return false;
      if (filters.country && a.study_country !== filters.country) return false;
      if (filters.flow && a.flow !== filters.flow) return false;
      if (selectedMega && a.megatopic_id !== selectedMega.megatopic_id) return false;
      if (selectedTopic && a.topic_id !== selectedTopic.topic_id) return false;
      return true;
    });
  }, [data, filters, selectedMega, selectedTopic]);

  if (!data || !meta) {
    return <div style={{ padding: 60, fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink-3)" }}>Carregando corpus…</div>;
  }

  const counts = { articles: fmtInt(meta.n_articles), topics: meta.n_topics, megatopics: meta.n_megatopics };
  const yearCounts = {};
  data.articles.forEach((a) => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });
  const totalCountries = new Set(filtered.map((a) => a.study_country)).size;
  const totalJournals = new Set(filtered.map((a) => a.journal)).size;
  const totalCross = filtered.filter((a) => a.flow === "Cross-continental" || a.flow === "Multi-national").length;
  const countryOptions = Array.from(new Set(data.articles.map((a) => a.study_country))).sort();

  const isDark = variant === "dark";

  return (
    <div className="shell" data-variant={variant}>
      <Masthead meta={meta} />
      <aside className="sidebar">
        <div className="sidebar-section">
          <div className="sidebar-label">Níveis<span className="count">{counts.articles + " · " + counts.topics + " · " + counts.megatopics}</span></div>
          <LevelNav level={level} setLevel={setLevel} counts={counts}
                    selectedTopic={selectedTopic} selectedMega={selectedMega}
                    clearDrill={() => { setSelectedMega(null); setSelectedTopic(null); setCompareTopic(null); }} />
        </div>
        <div className="sidebar-section">
          <div className="sidebar-label">Filtros<span className="count">{filters.yearMin}–{filters.yearMax}</span></div>
          <Filters filters={filters} setFilters={setFilters} options={{ countries: countryOptions }} />
        </div>
      </aside>

      <main className="main">
        <Breadcrumb level={level} setLevel={setLevel} mega={selectedMega} topic={selectedTopic}
                    onClearMega={() => setSelectedMega(null)} onClearTopic={() => setSelectedTopic(null)} />
        {level !== "home" && (
          <Scrubber filters={filters} setFilters={setFilters} yearCounts={yearCounts} />
        )}
        {level !== "home" && (
          <KpiStrip articles={filtered}
                    totalArticles={filtered.length}
                    totalCountries={totalCountries}
                    totalJournals={totalJournals}
                    totalCross={totalCross} />
        )}
        {level === "home" && <HomePage meta={meta} megatopics={data.megatopics} topics={data.topics} articles={data.articles} filtered={filtered} setLevel={setLevel} />}
        {level === "macro" && <MacroPage megatopics={data.megatopics} filtered={filtered} onSelectMega={(m) => { setSelectedMega(m); }} selectedMega={selectedMega} />}
        {level === "meso" && <MesoPage topics={data.topics} megatopics={data.megatopics} filtered={filtered}
                                       selectedMega={selectedMega}
                                       onSelectTopic={(t) => setSelectedTopic(t)}
                                       selectedTopic={selectedTopic}
                                       compareTopic={compareTopic} setCompareTopic={setCompareTopic} />}
        {level === "micro" && <MicroPage filtered={filtered} topics={data.topics} megatopics={data.megatopics} dark={isDark} />}
      </main>

      <Inspector level={level} selectedTopic={selectedTopic} selectedMega={selectedMega}
                 articles={filtered}
                 onClose={() => { setSelectedMega(null); setSelectedTopic(null); }}
                 onDrillDown={(target) => { setLevel(target); }} />
    </div>
  );
}

window.HubApp = HubApp;
window.Inspector = Inspector;
window.buildSampleArticles = buildSampleArticles;
window.enrichData = enrichData;
