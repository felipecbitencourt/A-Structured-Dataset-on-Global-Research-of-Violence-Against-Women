/* global React, t */
const { useState: useStateApp, useEffect: useEffectApp, useMemo: useMemoApp, useCallback: useCallbackApp } = React;

const FLOW_SET = new Set(FLOWS);
const DEFAULT_FILTERS = { yearMin: YEAR_MIN, yearMax: YEAR_MAX, country: "", flow: "", geoMode: "context" };

// "BRA; USA" -> ["BRA", "USA"]; drops empty and "NA" entries.
function splitList(value) {
  return String(value ?? "").split(";").map((s) => s.trim()).filter((s) => s && s.toUpperCase() !== "NA");
}

// ---------- articles ----------
function normalizeArticles(rawArticles, topicsRaw) {
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

  // The topic table is the reference for topic -> megatopic.
  const megaOfTopic = {};
  (topicsRaw || []).forEach((tp) => { megaOfTopic[Number(tp.topic_id)] = Number(tp.megatopic_id); });

  return (rawArticles || []).map((a, idx) => {
    const flowRaw = String(a.research_flow || "").trim();
    const topicId = Number(a.topic_id) || 0;
    const declaredMega = Number(a.megatopic_id) || 0;
    const megatopicId = megaOfTopic[topicId] || declaredMega;
    if (megaOfTopic[topicId] && declaredMega && declaredMega !== megaOfTopic[topicId]) {
      console.warn(`article ${a.article_id}: megatopic_id ${declaredMega} does not match topic ${topicId} (M${megaOfTopic[topicId]}); using the topic table`);
    }
    const studyCountries = splitList(a.study_country);
    const researcherCountries = splitList(a.researcher_country);

    return {
      id: Number(a.article_id) || idx + 1,
      doi: String(a.doi || "").trim(),
      year: Number(a.year) || 0,
      study_countries: studyCountries,
      researcher_countries: researcherCountries,
      topic_id: topicId,
      megatopic_id: megatopicId,
      title: a.title || "Untitled",
      keywords: String(a.keywords || "").trim(),
      authors: String(a.authors || "").trim(),
      journal: sanitizeJournal(a.journal),
      flow: FLOW_SET.has(flowRaw) ? flowRaw : "",
      raw: a,
    };
  }).filter((a) => a.year > 0 && a.topic_id > 0 && a.megatopic_id > 0);
}

// ---------- topics & megatopics: everything except the model metrics is derived from the articles ----------
function numOrNull(v) { return v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v); }
function growthRate(prev, last) {
  if (prev > 0) return (last - prev) / prev;
  return last > 0 ? null : 0;
}
function mean(values) {
  const ok = values.filter((v) => v !== null);
  return ok.length ? ok.reduce((s, v) => s + v, 0) / ok.length : null;
}

function enrichData(topicsRaw, megatopicsRaw, articles) {
  const groupBy = (key) => {
    const out = {};
    articles.forEach((a) => {
      const g = out[a[key]] || (out[a[key]] = { n: 0, years: {}, countries: {}, flows: {}, prev: 0, last: 0 });
      g.n += 1;
      g.years[a.year] = (g.years[a.year] || 0) + 1;
      a.study_countries.forEach((c) => { g.countries[c] = (g.countries[c] || 0) + 1; });
      g.flows[a.flow] = (g.flows[a.flow] || 0) + 1;
      if (a.year >= 2016 && a.year <= 2020) g.prev += 1;
      if (a.year >= 2021 && a.year <= 2025) g.last += 1;
    });
    return out;
  };
  const byTopic = groupBy("topic_id");
  const byMega = groupBy("megatopic_id");
  const empty = { n: 0, years: {}, countries: {}, flows: {}, prev: 0, last: 0 };

  const topics = topicsRaw.map((tp) => {
    const g = byTopic[tp.topic_id] || empty;
    const series = [];
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) series.push(g.years[y] || 0);
    return {
      ...tp,
      article_count: g.n,
      n_countries: Object.keys(g.countries).length,
      yearly_series: series,
      flow_distribution: Object.keys(g.flows).map((k) => ({ label: k, value: g.flows[k] })).sort((a, b) => b.value - a.value),
      coherence_cv: numOrNull(tp.coherence_cv),
      growth_rate_5yr: growthRate(g.prev, g.last),
      growth_prev: g.prev,
      growth_last: g.last,
    };
  }).sort((a, b) => b.article_count - a.article_count);

  const megatopics = megatopicsRaw.map((m) => {
    const g = byMega[m.megatopic_id] || empty;
    const topTopics = topics.filter((tp) => tp.megatopic_id === m.megatopic_id);
    return {
      ...m,
      article_count: g.n,
      n_topics: topTopics.length || m.n_topics || 0,
      n_countries: Object.keys(g.countries).length,
      coherence_cv_mean: mean(topTopics.map((tp) => tp.coherence_cv)),
      growth_rate_5yr: growthRate(g.prev, g.last),
      growth_prev: g.prev,
      growth_last: g.last,
      top_countries: Object.entries(g.countries).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c),
      top_topics: topTopics.slice(0, 5),
    };
  }).sort((a, b) => b.article_count - a.article_count);

  return { topics, megatopics };
}

// ---------- shareable state in the URL hash ----------
function readHashState() {
  const p = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const num = (k) => (p.has(k) && Number.isFinite(Number(p.get(k))) ? Number(p.get(k)) : null);
  const level = p.get("v");
  const yearMin = num("y0") !== null ? clampYear(num("y0")) : YEAR_MIN;
  const yearMax = num("y1") !== null ? clampYear(num("y1")) : YEAR_MAX;
  return {
    level: ["home", "search", "macro", "meso", "micro"].includes(level) ? level : "home",
    filters: {
      yearMin: Math.min(yearMin, yearMax),
      yearMax: Math.max(yearMin, yearMax),
      country: (p.get("c") || "").toUpperCase(),
      flow: FLOW_SET.has(p.get("f")) ? p.get("f") : "",
      geoMode: p.get("map") === "production" ? "production" : "context",
    },
    mega: num("m"),
    topic: num("t"),
    compare: num("b"),
  };
}

function writeHashState({ level, filters, mega, topic, compare }) {
  const p = new URLSearchParams();
  if (level !== "home") p.set("v", level);
  if (filters.yearMin !== YEAR_MIN) p.set("y0", filters.yearMin);
  if (filters.yearMax !== YEAR_MAX) p.set("y1", filters.yearMax);
  if (filters.country) p.set("c", filters.country);
  if (filters.flow) p.set("f", filters.flow);
  if (filters.geoMode !== "context") p.set("map", filters.geoMode);
  if (mega) p.set("m", mega);
  if (topic) p.set("t", topic);
  if (compare) p.set("b", compare);
  const hash = p.toString();
  const url = window.location.pathname + window.location.search + (hash ? "#" + hash : "");
  if (url !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(null, "", url);
  }
}

// ---------- downloads ----------
function selectionSummary(state) {
  const f = state.filters;
  return {
    years: [f.yearMin, f.yearMax],
    study_country: f.country || null,
    research_flow: f.flow || null,
    megatopic_id: state.mega || null,
    topic_id: state.topic || null,
  };
}

function saveFile(name, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function fileStamp(meta) {
  return `vaw-articles_${meta?.version || "data"}_${new Date().toISOString().slice(0, 10)}`;
}

// CSV keeps every published column, unchanged, for the selected articles.
function downloadCsv(rows, meta) {
  const columns = rows.length ? Object.keys(rows[0].raw) : [];
  const esc = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  const csv = [columns.join(",")]
    .concat(rows.map((row) => columns.map((col) => esc(row.raw[col])).join(",")))
    .join("\n");
  saveFile(fileStamp(meta) + ".csv", "﻿" + csv, "text/csv;charset=utf-8;");
}

// JSON carries the provenance: dataset version, checksum, the selection used and the link that reproduces it.
function downloadJson(rows, meta, state) {
  const payload = {
    dataset: "A Structured Dataset on Global Research of Violence Against Women",
    version: meta?.version || null,
    release_date: meta?.date || null,
    source_md5: meta?.source_hash || null,
    exported_at: new Date().toISOString(),
    view_url: window.location.href,
    selection: selectionSummary(state),
    n_articles: rows.length,
    articles: rows.map((r) => r.raw),
  };
  saveFile(fileStamp(meta) + ".json", JSON.stringify(payload, null, 2), "application/json");
}

function copyViewLink(notify) {
  const done = () => notify && notify(t("toast.linkCopied"));
  const fail = () => notify && notify(t("toast.linkFailed"));
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(window.location.href).then(done, fail);
  } else {
    fail();
  }
}

function SidebarSection({ title, count, isOpen, onToggle, children }) {
  return (
    <section className={"sidebar-section " + (isOpen ? "is-open" : "is-collapsed")}>
      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="sidebar-label">
          <span>{title}</span>
          {count ? <span className="count">{count}</span> : null}
        </span>
        <span className="sidebar-caret" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen ? <div className="sidebar-body">{children}</div> : null}
    </section>
  );
}

function SidebarGuide({ actions }) {
  return (
    <div className="sidebar-apparatus">
      <h3 className="sidebar-apparatus-title">{t("guide.title")}</h3>
      <p className="sidebar-apparatus-text">{t("guide.body")}</p>
      <div className="sidebar-subhead"><span>{t("guide.actions")}</span></div>
      <div className="sidebar-shortcuts">
        {actions.map((a) => (
          <button key={a.id} type="button" className="sidebar-action-btn" onClick={a.run}>{a.label} <span aria-hidden="true">›</span></button>
        ))}
      </div>
    </div>
  );
}

function KeyboardRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.04em" }}>{v}</span>
      <kbd style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 5px", border: "1px solid var(--rule-strong)", color: "var(--ink-2)", background: "var(--paper-2)" }}>{k}</kbd>
    </div>
  );
}

// ---------- App ----------
// `commandRef` lets the command palette and keyboard shortcuts drive the hub.
function HubApp({ commandRef, settings, onSettingsChange, onShowTour, notify, lang }) {
  const meta = useRes("data/meta.json");
  const topicsRaw = useDatasetRes("topics");
  const megatopicsRaw = useDatasetRes("megatopics");
  const articlesRaw = useDatasetRes("articles");

  const data = useMemoApp(() => {
    if (!topicsRaw.data || !megatopicsRaw.data || !articlesRaw.data) return null;
    const arts = normalizeArticles(articlesRaw.data, topicsRaw.data);
    const enriched = enrichData(topicsRaw.data, megatopicsRaw.data, arts);
    return { articles: arts, ...enriched };
  }, [topicsRaw.data, megatopicsRaw.data, articlesRaw.data]);

  const initial = useMemoApp(() => readHashState(), []);
  const [level, setLevel] = useStateApp(initial.level);
  const [filters, setFilters] = useStateApp(initial.filters);
  const [selectedMega, setSelectedMega] = useStateApp(null);
  const [selectedTopic, setSelectedTopic] = useStateApp(null);
  const [compareTopic, setCompareTopic] = useStateApp(null);
  const [sidebarOpen, setSidebarOpen] = useStateApp(() => ({ levels: true, filters: !window.matchMedia("(max-width: 900px)").matches }));
  const dark = settings.theme === "dark";

  // Restore the selection from the link once the tables are loaded.
  useEffectApp(() => {
    if (!data) return;
    const findTopic = (id) => data.topics.find((tp) => tp.topic_id === id) || null;
    if (initial.mega) setSelectedMega(data.megatopics.find((m) => m.megatopic_id === initial.mega) || null);
    if (initial.topic) setSelectedTopic(findTopic(initial.topic));
    if (initial.compare) setCompareTopic(findTopic(initial.compare));
  }, [data]);

  useEffectApp(() => {
    if (!data) return;
    writeHashState({ level, filters, mega: selectedMega?.megatopic_id, topic: selectedTopic?.topic_id, compare: compareTopic?.topic_id });
  }, [data, level, filters, selectedMega, selectedTopic, compareTopic]);

  useEffectApp(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [level]);

  const clearDrill = () => { setSelectedMega(null); setSelectedTopic(null); setCompareTopic(null); };
  const state = { filters, mega: selectedMega?.megatopic_id, topic: selectedTopic?.topic_id };

  // Three nested selections: macro ignores the drill-down, meso ignores the topic, micro and search use everything.
  const base = useMemoApp(() => {
    if (!data) return [];
    return data.articles.filter((a) => {
      if (a.year < filters.yearMin || a.year > filters.yearMax) return false;
      if (filters.country && !a.study_countries.includes(filters.country)) return false;
      if (filters.flow && a.flow !== filters.flow) return false;
      return true;
    });
  }, [data, filters]);
  const inMega = useMemoApp(() => (selectedMega ? base.filter((a) => a.megatopic_id === selectedMega.megatopic_id) : base), [base, selectedMega]);
  const filtered = useMemoApp(() => (selectedTopic ? inMega.filter((a) => a.topic_id === selectedTopic.topic_id) : inMega), [inMega, selectedTopic]);

  const exportCsv = () => { downloadCsv(filtered, meta.data); notify(t("toast.exported", { n: fmtInt(filtered.length) })); };
  const exportJson = () => { downloadJson(filtered, meta.data, state); notify(t("toast.exported", { n: fmtInt(filtered.length) })); };

  useEffectApp(() => {
    if (!commandRef) return;
    commandRef.current = (cmd) => {
      if (cmd.type === "level") setLevel(cmd.level);
      else if (cmd.type === "filter") setFilters((f) => ({ ...f, ...cmd.patch }));
      else if (cmd.type === "toggle-geo") {
        const geoMode = filters.geoMode === "context" ? "production" : "context";
        setFilters((f) => ({ ...f, geoMode }));
        notify(geoMode === "context" ? t("toast.geoContext") : t("toast.geoProduction"));
      }
      else if (cmd.type === "reset") {
        clearDrill();
        setFilters(DEFAULT_FILTERS);
        setLevel("home");
      }
      else if (cmd.type === "drill-mega" && data) {
        setSelectedMega(data.megatopics.find((m) => m.megatopic_id === cmd.mega.megatopic_id) || null);
        setSelectedTopic(null); setCompareTopic(null); setLevel("meso");
      }
      else if (cmd.type === "drill-topic" && data) {
        const topic = data.topics.find((tp) => tp.topic_id === cmd.topic.topic_id) || null;
        setSelectedMega(topic ? data.megatopics.find((m) => m.megatopic_id === topic.megatopic_id) || null : null);
        setSelectedTopic(topic); setCompareTopic(null); setLevel("meso");
      }
      else if (cmd.type === "export-csv") exportCsv();
      else if (cmd.type === "export-json") exportJson();
      else if (cmd.type === "copy-link") copyViewLink(notify);
    };
  });

  if (meta.error || topicsRaw.error || megatopicsRaw.error || articlesRaw.error) {
    return <div className="app-status" role="alert">{t("app.loadError")}</div>;
  }
  if (!data || !meta.data) {
    return <div className="app-status" role="status">{t("app.loading")}</div>;
  }

  const corpusSize = data.articles.length;
  const counts = { articles: fmtInt(corpusSize), topics: data.topics.length, megatopics: data.megatopics.length };
  const countryOptions = Array.from(new Set(data.articles.flatMap((a) => a.study_countries))).sort();
  const guideActions = [
    { id: "recent", label: t("guide.recent"), run: () => setFilters((f) => ({ ...f, yearMin: 2021, yearMax: YEAR_MAX })) },
    { id: "production", label: t("guide.production"), run: () => { setFilters((f) => ({ ...f, geoMode: "production" })); setLevel("micro"); } },
    { id: "compare", label: t("guide.compare"), run: () => { setLevel("meso"); setSelectedTopic(null); setCompareTopic(null); } },
    { id: "csv", label: t("guide.exportCsv"), run: exportCsv },
    { id: "json", label: t("guide.exportJson"), run: exportJson },
    { id: "link", label: t("guide.copyLink"), run: () => copyViewLink(notify) },
  ];

  return (
    <div className="shell shell--no-inspector">
      <a className="skip-link" href="#main-content">{t("app.skip")}</a>
      <Masthead meta={meta.data} settings={settings} onSettingsChange={onSettingsChange} onShowTour={onShowTour} />
      <aside className="sidebar">
        <SidebarSection
          title={t("sidebar.levels")}
          isOpen={sidebarOpen.levels}
          onToggle={() => setSidebarOpen((s) => ({ ...s, levels: !s.levels }))}
        >
          <LevelNav level={level} setLevel={setLevel} counts={counts}
                    selectedTopic={selectedTopic} selectedMega={selectedMega} clearDrill={clearDrill} />
        </SidebarSection>
        <SidebarSection
          title={t("sidebar.filters")}
          count={[filters.yearMin !== YEAR_MIN || filters.yearMax !== YEAR_MAX, !!filters.country, !!filters.flow].filter(Boolean).length || ""}
          isOpen={sidebarOpen.filters}
          onToggle={() => setSidebarOpen((s) => ({ ...s, filters: !s.filters }))}
        >
          <Filters filters={filters} setFilters={setFilters} options={{ countries: countryOptions }} />
          <div className="sidebar-downloads">
            <div className="sidebar-label">{t("sidebar.download")}</div>
            <div className="sidebar-download-row">
              <button type="button" className="chip" onClick={exportCsv}>CSV</button>
              <button type="button" className="chip" onClick={exportJson}>JSON</button>
              <button type="button" className="chip" onClick={() => copyViewLink(notify)}>{t("sidebar.copyLink")}</button>
            </div>
          </div>
        </SidebarSection>
      </aside>

      <main className="main" id="main-content" tabIndex={-1}>
        {level !== "home" && <Breadcrumb level={level} setLevel={setLevel} mega={selectedMega} topic={selectedTopic} counts={counts} />}
        {level === "home" && <HomePage meta={meta.data} megatopics={data.megatopics} topics={data.topics} articles={data.articles} setLevel={setLevel} />}
        {level === "search" && <SearchPage filtered={filtered} />}
        {level === "macro" && <MacroPage megatopics={data.megatopics} filtered={base} corpusSize={corpusSize}
                                         onSelectMega={(m) => { setSelectedMega(m); setSelectedTopic(null); setCompareTopic(null); setLevel("meso"); }}
                                         selectedMega={selectedMega} />}
        {level === "meso" && <MesoPage topics={data.topics} filtered={inMega} corpusSize={corpusSize}
                                       selectedMega={selectedMega}
                                       onSelectTopic={(tp) => { setSelectedTopic(tp); if (!tp) setCompareTopic(null); }}
                                       selectedTopic={selectedTopic}
                                       compareTopic={compareTopic} setCompareTopic={setCompareTopic}
                                       onOpenMicro={() => setLevel("micro")} />}
        {level === "micro" && <MicroPage filtered={filtered} corpusSize={corpusSize} filters={filters} setFilters={setFilters} dark={dark} lang={lang} />}
      </main>
    </div>
  );
}

window.HubApp = HubApp;
