/* global React */
// Prototype-only app: a thin adaptation of HubApp that exposes an imperative
// command bus so the command palette / shortcut chips can drive navigation
// without prop-drilling through every page.
const { useState: usePA, useEffect: useEffectPA, useMemo: useMemoPA, useRef: useRefPA } = React;

function PrototypeHub({ commandRef, onLevelChange, settings, onSettingsChange }) {
  const meta = useRes("data/meta.json");
  const topicsRaw = useDatasetRes("topics");
  const megatopicsRaw = useDatasetRes("megatopics");
  const articlesRaw = useDatasetRes("articles");

  const data = useMemoPA(() => {
    if (!topicsRaw || !megatopicsRaw || !articlesRaw) return null;
    const arts = normalizeArticles(articlesRaw);
    const enriched = enrichData(topicsRaw, megatopicsRaw, arts);
    return { articles: arts, ...enriched };
  }, [topicsRaw, megatopicsRaw, articlesRaw]);

  const [level, setLevel] = usePA("home");
  const [filters, setFilters] = usePA({ yearMin: 2011, yearMax: 2025, country: "", flow: "", geoMode: "context" });
  const [selectedMega, setSelectedMega] = usePA(null);
  const [selectedTopic, setSelectedTopic] = usePA(null);
  const [compareTopic, setCompareTopic] = usePA(null);
  const [sidebarOpen, setSidebarOpen] = usePA({ levels: true, apparatus: true, filters: true });

  // Notify parent of level changes (for breadcrumb chip in chrome)
  useEffectPA(() => { onLevelChange && onLevelChange(level); }, [level]);

  // Wire the imperative command bus
  useEffectPA(() => {
    if (!commandRef) return;
    commandRef.current = (cmd) => {
      if (cmd.type === "level") setLevel(cmd.level);
      else if (cmd.type === "filter") setFilters((f) => ({ ...f, ...cmd.patch }));
      else if (cmd.type === "reset") {
        setSelectedMega(null); setSelectedTopic(null); setCompareTopic(null);
        setFilters({ yearMin: 2011, yearMax: 2025, country: "", flow: "", geoMode: "context" });
        setLevel("home");
      }
      else if (cmd.type === "drill-mega") { setSelectedMega(cmd.mega); setLevel("meso"); }
      else if (cmd.type === "drill-topic") {
        const mega = (data?.megatopics || []).find((m) => m.megatopic_id === cmd.topic.megatopic_id);
        if (mega) setSelectedMega(mega);
        setSelectedTopic(cmd.topic);
        setLevel("meso");
      }
    };
  }, [commandRef, data]);

  const filtered = useMemoPA(() => {
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
  const countryOptions = Array.from(new Set(data.articles.map((a) => a.study_country))).sort();
  const handlePresetRange = () => setFilters((f) => ({ ...f, yearMin: 2021, yearMax: 2025 }));
  const handleFocusProduction = () => { setFilters((f) => ({ ...f, geoMode: "production" })); setLevel("micro"); };
  const handleCompareTopics = () => { setLevel("meso"); setSelectedTopic(null); setCompareTopic(null); };
  const handleExportCsv = () => {
    if (typeof downloadFilteredCsv === "function") downloadFilteredCsv(filtered);
  };

  return (
    <div className="shell shell--no-inspector" data-variant="editorial">
      <Masthead meta={meta} settings={settings} onSettingsChange={onSettingsChange} />
      <aside className="sidebar">
        <SidebarSection
          title="Níveis"
          count={counts.articles + " · " + counts.topics + " · " + counts.megatopics}
          isOpen={sidebarOpen.levels}
          onToggle={() => setSidebarOpen((s) => ({ ...s, levels: !s.levels }))}
        >
          <LevelNav level={level} setLevel={setLevel} counts={counts}
                    selectedTopic={selectedTopic} selectedMega={selectedMega}
                    clearDrill={() => { setSelectedMega(null); setSelectedTopic(null); setCompareTopic(null); }} />
        </SidebarSection>
        <SidebarSection
          title="Apparatus"
          isOpen={sidebarOpen.apparatus}
          onToggle={() => setSidebarOpen((s) => ({ ...s, apparatus: !s.apparatus }))}
        >
          <SidebarApparatus
            onPresetRange={handlePresetRange}
            onFocusProduction={handleFocusProduction}
            onCompareTopics={handleCompareTopics}
            onExportCsv={handleExportCsv}
          />
        </SidebarSection>
        <SidebarSection
          title="Filtros"
          count={filters.yearMin + "–" + filters.yearMax}
          isOpen={sidebarOpen.filters}
          onToggle={() => setSidebarOpen((s) => ({ ...s, filters: !s.filters }))}
        >
          <Filters filters={filters} setFilters={setFilters} options={{ countries: countryOptions }} />
        </SidebarSection>
        <div className="sidebar-section" style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
          <div className="sidebar-label">Atalhos</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 20 }}>
            <KeyboardRow k="⌘ K" v="Paleta de comandos" />
            <KeyboardRow k="1 · 2 · 3 · 4" v="Navegar níveis" />
            <KeyboardRow k="R" v="Resetar recorte" />
            <KeyboardRow k="C" v="Modo Contexto/Produção" />
          </div>
        </div>
      </aside>

      <main className="main">
        <Breadcrumb level={level} setLevel={setLevel} mega={selectedMega} topic={selectedTopic}
                    onClearMega={() => setSelectedMega(null)} onClearTopic={() => setSelectedTopic(null)} />
        {level === "home" && <HomePage meta={meta} megatopics={data.megatopics} topics={data.topics} articles={data.articles} filtered={filtered} setLevel={setLevel} />}
        {level === "search" && <SearchPage filtered={filtered} />}
        {level === "macro" && <MacroPage megatopics={data.megatopics} filtered={filtered} onSelectMega={(m) => { setSelectedMega(m); setLevel("meso"); }} selectedMega={selectedMega} />}
        {level === "meso" && <MesoPage topics={data.topics} megatopics={data.megatopics} filtered={filtered}
                                       selectedMega={selectedMega}
                                       onSelectTopic={(t) => setSelectedTopic(t)}
                                       selectedTopic={selectedTopic}
                                       compareTopic={compareTopic} setCompareTopic={setCompareTopic} />}
        {level === "micro" && <MicroPage filtered={filtered} topics={data.topics} megatopics={data.megatopics} dark={false} />}
      </main>

    </div>
  );
}

function KeyboardRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.04em" }}>{v}</span>
      <kbd style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 5px", border: "1px solid var(--rule-strong)", color: "var(--ink-2)", background: "var(--paper-2)" }}>{k}</kbd>
    </div>
  );
}

window.PrototypeHub = PrototypeHub;
