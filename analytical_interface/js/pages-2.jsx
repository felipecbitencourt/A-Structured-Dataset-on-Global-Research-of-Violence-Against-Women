/* global React, t */
const { useState: useState2, useMemo: useMemo2, useCallback: useCallback2 } = React;

function doiUrl(doiRaw) {
  const doi = String(doiRaw || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "").trim();
  return doi ? `https://doi.org/${doi}` : "";
}

function ArticleTitle({ a }) {
  const href = doiUrl(a.doi);
  if (!href) return <span title={t("micro.noDoi")}>{a.title}</span>;
  return <a className="title-link" href={href} target="_blank" rel="noopener noreferrer" title={t("micro.openDoi") + ": " + a.doi}>{a.title}</a>;
}

function FlowChip({ flow }) {
  const color = FLOW_COLORS[flow] || FLOW_COLORS[""];
  return <span className="chip chip-static" style={{ background: color + "26", borderColor: color }}>{flowLabel(flow)}</span>;
}

function countryList(codes, max = 3) {
  const list = codes || [];
  if (list.length <= max) return list.join(" · ");
  return list.slice(0, max).join(" · ") + ` +${list.length - max}`;
}

// ============ MESO ============
// `filtered` here does NOT include the selected topic: choosing topic A must not hide the other topics.
function MesoPage({ topics, filtered, corpusSize, selectedMega, onSelectTopic, selectedTopic, compareTopic, setCompareTopic, onOpenMicro }) {
  const byTopic = groupStats(filtered, "topic_id");
  let rows = topics.map((tp) => {
    const g = byTopic[tp.topic_id] || { n: 0, n_countries: 0 };
    return { ...tp, filtered_count: g.n, n_countries_selection: g.n_countries };
  });
  if (selectedMega) rows = rows.filter((r) => r.megatopic_id === selectedMega.megatopic_id);
  rows = rows.sort((a, b) => b.filtered_count - a.filtered_count);
  const pick = (r) => onSelectTopic(selectedTopic?.topic_id === r.topic_id ? null : r);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">{t("meso.kicker", { n: rows.length })}{selectedMega ? t("meso.kickerMega", { mega: selectedMega.megatopic_description }) : ""}</div>
          <h1>{t("meso.title")}</h1>
          <p className="page-dek">{t("meso.dek")}</p>
        </div>
        <div className="page-stamp">
          <strong>{t("macro.inSelection")}</strong><br/>
          {t("home.topics", { n: rows.length })}<br/>
          {t("unit.articles", { n: fmtInt(rows.reduce((s, r) => s + r.filtered_count, 0)) })}<br/>
          <br/>
          <strong>{t("meso.compare")}</strong><br/>
          {selectedTopic ? "A: T" + selectedTopic.topic_id : "—"}<br/>
          {compareTopic ? "B: T" + compareTopic.topic_id : "—"}
        </div>
      </div>
      <KpiStrip articles={filtered} corpusSize={corpusSize} />

      <SectionHead num="01" title={t("meso.star")} aside={t("home.topics", { n: rows.length })} />
      <div className="module">
        <div className="module-note" style={{ marginTop: 0 }}>{t("meso.starNote")}</div>
        <TopicStarChart rows={rows} selectedTopic={selectedTopic} compareTopic={compareTopic} onSelectTopic={pick} />
      </div>

      <SectionHead num="02" title={t("meso.ranking")} aside={t("meso.rankingHint")} />
      <div className="table-wrap">
        <table className="ed">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t("col.topic")}</th>
              <th scope="col">{t("macro.colMega")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.articles")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.cv")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.growth")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.countries")}</th>
              <th scope="col">{t("col.series")} {YEAR_MIN}–{YEAR_MAX}</th>
              <th scope="col" style={{ width: 80 }}>{t("col.compare")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isA = selectedTopic?.topic_id === r.topic_id;
              const isB = compareTopic?.topic_id === r.topic_id;
              return (
                <tr key={r.topic_id} className={isA || isB ? "selected" : ""}>
                  <td className="num">{String(i + 1).padStart(2, "0")}</td>
                  <td className="title"><button type="button" className="link-btn" aria-pressed={isA} onClick={() => pick(r)}>{r.topic_description}</button></td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>M{r.megatopic_id}</td>
                  <td className="num" style={{ textAlign: "right" }}>{fmtInt(r.filtered_count)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{fmtDec(r.coherence_cv)}</td>
                  <td className="num" title={growthTip(r.growth_prev, r.growth_last)}
                      style={{ textAlign: "right", color: r.growth_rate_5yr > 0 ? "var(--positive)" : r.growth_rate_5yr < 0 ? "var(--crimson)" : "var(--ink-3)" }}>
                    {fmtGrowth(r.growth_rate_5yr, r.growth_prev, r.growth_last)}
                  </td>
                  <td className="num" style={{ textAlign: "right" }}>{r.n_countries_selection}</td>
                  <td><Sparkline values={r.yearly_series || []} /></td>
                  <td>
                    {isA
                      ? <span className="btn-ed" style={{ fontSize: 10 }}>A</span>
                      : <button type="button" className="btn-ed" style={{ fontSize: 10 }} aria-pressed={isB}
                                onClick={() => setCompareTopic(isB ? null : r)}>{isB ? "B ✕" : "+ B"}</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTopic && (
        <div>
          <SectionHead num="03" title={compareTopic ? t("meso.ab") : t("meso.card")}
                       aside={compareTopic ? "T" + selectedTopic.topic_id + " × T" + compareTopic.topic_id : "T" + selectedTopic.topic_id} />
          <div className="col-12">
            <div className={compareTopic ? "col-span-6 module" : "col-span-12 module"}>
              <TopicCard t={selectedTopic} label="A" />
            </div>
            {compareTopic && (
              <div className="col-span-6 module">
                <TopicCard t={compareTopic} label="B" />
              </div>
            )}
          </div>
          <button type="button" className="btn-ed primary" style={{ marginTop: 16 }} onClick={onOpenMicro}>{t("meso.toMicro")}</button>
        </div>
      )}
    </div>
  );
}

function TopicCard({ t: tp, label }) {
  const yearData = (tp.yearly_series || []).map((v, i) => ({ year: YEAR_MIN + i, count: v }));
  return (
    <div>
      <div className="module-head">
        <div>
          <div className="module-title">{label} · T{tp.topic_id}</div>
          <div className="module-sub">{tp.topic_description}</div>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>M{tp.megatopic_id}</div>
      </div>
      <div className="metric-grid">
        <Metric label={t("col.articles")} value={fmtInt(tp.article_count)} />
        <Metric label={t("col.cv")} value={fmtDec(tp.coherence_cv)} />
        <Metric label={t("col.growth")} value={fmtGrowth(tp.growth_rate_5yr, tp.growth_prev, tp.growth_last)}
                pos={Number.isFinite(tp.growth_rate_5yr) ? tp.growth_rate_5yr > 0 : undefined}
                note={growthTip(tp.growth_prev, tp.growth_last)} />
        <Metric label={t("col.countries")} value={tp.n_countries} />
      </div>
      <div style={{ padding: "12px 0" }}>
        <div className="mini-label">{t("meso.series", { a: YEAR_MIN, b: YEAR_MAX })}</div>
        <YearSeries data={yearData} width={360} height={140} label={t("meso.series", { a: YEAR_MIN, b: YEAR_MAX })} />
      </div>
      <div style={{ padding: "12px 0", borderTop: "1px solid var(--rule)" }}>
        <div className="mini-label">{t("meso.flows")}</div>
        <FlowStack dist={tp.flow_distribution || []} />
      </div>
    </div>
  );
}

function Metric({ label, value, pos, note }) {
  return (
    <div title={note || undefined}>
      <div className="mini-label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, color: pos === undefined ? "var(--ink)" : pos ? "var(--positive)" : "var(--crimson)", lineHeight: 1 }}>{value}</div>
      {note && <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", marginTop: 4 }}>{note}</div>}
    </div>
  );
}

function TopicStarChart({ rows, selectedTopic, compareTopic, onSelectTopic }) {
  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const rMin = 90;
  const rMax = 240;
  const maxCount = Math.max(1, ...rows.map((r) => r.filtered_count));

  const points = rows.map((r, i) => {
    const angle = (-Math.PI / 2) + (i / Math.max(1, rows.length)) * Math.PI * 2;
    const intensity = r.filtered_count / maxCount;
    const radius = rMin + intensity * (rMax - rMin);
    return { ...r, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, dot: 4 + intensity * 10 };
  });

  return (
    <div className="topic-star-wrap">
      <svg className="topic-star-chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t("meso.starNote")}>
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={rMin + (rMax - rMin) * k} fill="none" stroke="var(--rule)" strokeDasharray="3 5" />
        ))}
        {points.map((p) => (
          <line key={`ray-${p.topic_id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--rule)" strokeOpacity="0.65" />
        ))}

        {points.map((p) => {
          const isA = selectedTopic?.topic_id === p.topic_id;
          const isB = compareTopic?.topic_id === p.topic_id;
          return (
            <g key={p.topic_id} onClick={() => onSelectTopic(p)} style={{ cursor: "pointer" }}>
              <title>{`T${p.topic_id} · ${p.topic_description}: ${p.filtered_count}`}</title>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.dot + (isA || isB ? 3 : 0)}
                fill={isA ? "var(--ink)" : isB ? "var(--amber)" : "var(--accent)"}
                fillOpacity={isA || isB ? 0.92 : 0.65}
                stroke="var(--paper)"
                strokeWidth="1.5"
              />
              {(isA || isB) && (
                <text x={p.x + 10} y={p.y - 8} fontFamily="var(--mono)" fontSize="10" fill="var(--ink-2)">
                  {isA ? "A" : "B"} · T{p.topic_id}
                </text>
              )}
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="38" fill="var(--paper-2)" stroke="var(--rule-strong)" />
        <text x={cx} y={cy - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-4)" style={{ letterSpacing: "0.08em" }}>MESO</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-3)">{t("home.topics", { n: rows.length })}</text>
      </svg>
    </div>
  );
}

// ============ MICRO ============
const MICRO_PAGE = 80;

function MicroPage({ filtered, corpusSize, filters, setFilters, dark, lang }) {
  const [sortKey, setSortKey] = useState2("year");
  const [shown, setShown] = useState2(MICRO_PAGE);
  const mapMode = filters.geoMode;
  const yearCounts = {};
  filtered.forEach((a) => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });
  const yearData = Object.keys(yearCounts).map((y) => ({ year: +y, count: yearCounts[y] })).sort((a, b) => a.year - b.year);

  const flowDist = {};
  filtered.forEach((a) => { flowDist[a.flow] = (flowDist[a.flow] || 0) + 1; });
  const flowArr = Object.keys(flowDist).map((k) => ({ label: k, value: flowDist[k] })).sort((a, b) => b.value - a.value);

  const sorted = useMemo2(() => [...filtered].sort((a, b) => {
    if (sortKey === "country") return (a.study_countries[0] || "").localeCompare(b.study_countries[0] || "") || b.year - a.year;
    return b.year - a.year || a.id - b.id;
  }), [filtered, sortKey]);

  const onCountryClick = useCallback2((code) => {
    if (mapMode === "context") setFilters((f) => ({ ...f, country: f.country === code ? "" : code }));
  }, [mapMode, setFilters]);
  const setMapMode = (mode) => setFilters((f) => ({ ...f, geoMode: mode }));
  const years = filtered.map((a) => a.year);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">{t("micro.kicker", { n: fmtInt(filtered.length) })}</div>
          <h1>{t("micro.title")}</h1>
          <p className="page-dek">{t("micro.dek")}</p>
        </div>
        <div className="page-stamp">
          <strong>{t("micro.stamp")}</strong><br/>
          {t("unit.articles", { n: fmtInt(filtered.length) })}<br/>
          {t("micro.stampTopics", { n: new Set(filtered.map((a) => a.topic_id)).size })}<br/>
          {t("micro.stampCountries", { n: uniqueCount(filtered, "study_countries") })}<br/>
          {years.length ? (Math.min(...years) + "–" + Math.max(...years)) : "—"}
        </div>
      </div>
      <KpiStrip articles={filtered} corpusSize={corpusSize} />

      {filtered.length === 0 && <div className="empty-state" role="status">{t("micro.empty")}</div>}

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2>{t("micro.maps")}</h2>
        <div className="segmented" role="group" aria-label={t("filters.geoMode")}>
          <button type="button" className={"btn-ed" + (mapMode === "context" ? " is-on" : "")} aria-pressed={mapMode === "context"} onClick={() => setMapMode("context")}>
            {t("micro.mapContext")}
          </button>
          <button type="button" className={"btn-ed" + (mapMode === "production" ? " is-on" : "")} aria-pressed={mapMode === "production"} onClick={() => setMapMode("production")}>
            {t("micro.mapProduction")}
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="col-span-8 module" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--rule)" }}>
            <div className="module-title">{mapMode === "context" ? t("micro.mapContextTitle") : t("micro.mapProductionTitle")}</div>
            <div className="module-sub">{mapMode === "context" ? t("micro.mapContextSub") : t("micro.mapProductionSub")}</div>
          </div>
          <WorldMap points={filtered} mode={mapMode} dark={dark} lang={lang} onCountryClick={onCountryClick} />
        </div>
        <div className="col-span-4">
          <div className="module">
            <div className="module-head"><div><div className="module-title">{t("micro.series")}</div><div className="module-sub">{t("micro.seriesSub")}</div></div></div>
            <YearSeries data={yearData} width={320} height={160} label={t("micro.seriesSub")}
                        onYearClick={(y) => setFilters((f) => ({ ...f, yearMin: y, yearMax: y }))} />
          </div>
          <div className="module" style={{ marginTop: 16 }}>
            <div className="module-head"><div><div className="module-title">{t("micro.flow")}</div><div className="module-sub">{t("micro.flowSub")}</div></div></div>
            <FlowStack dist={flowArr} onFlowClick={(fl) => setFilters((f) => ({ ...f, flow: f.flow === fl ? "" : fl }))} />
          </div>
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 02</div>
        <h2>{t("micro.articles", { n: fmtInt(sorted.length) })}</h2>
        <div className="section-aside">
          {t("micro.sort")}&nbsp;
          <button type="button" className="btn-ed" style={{ fontSize: 10, marginRight: 4 }} aria-pressed={sortKey === "year"} onClick={() => setSortKey("year")}>{sortKey === "year" ? "●" : "○"} {t("micro.sortYear")}</button>
          <button type="button" className="btn-ed" style={{ fontSize: 10 }} aria-pressed={sortKey === "country"} onClick={() => setSortKey("country")}>{sortKey === "country" ? "●" : "○"} {t("micro.sortCountry")}</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="ed">
          <thead>
            <tr>
              <th scope="col">{t("col.year")}</th>
              <th scope="col">{t("col.title")}</th>
              <th scope="col">{t("col.journal")}</th>
              <th scope="col">{t("col.context")}</th>
              <th scope="col">{t("col.production")}</th>
              <th scope="col">{t("col.flow")}</th>
              <th scope="col">{t("col.topic")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, shown).map((a) => (
              <tr key={a.id}>
                <td className="num">{a.year}</td>
                <td className="title"><ArticleTitle a={a} /></td>
                <td style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 12 }}>{a.journal}</td>
                <td className="num" title={a.study_countries.join(", ")}>{countryList(a.study_countries)}</td>
                <td className="num" title={a.researcher_countries.join(", ")}>{countryList(a.researcher_countries)}</td>
                <td><FlowChip flow={a.flow} /></td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>T{a.topic_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length > shown && (
        <div className="footnote" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>{t("micro.showing", { shown: fmtInt(shown), n: fmtInt(sorted.length) })}</span>
          <button type="button" className="btn-ed" onClick={() => setShown((s) => s + MICRO_PAGE)}>+ {MICRO_PAGE}</button>
        </div>
      )}
    </div>
  );
}

function SearchPage({ filtered }) {
  const [query, setQuery] = useState2("");
  const q = (query || "").trim().toLowerCase();

  const matches = useMemo2(() => {
    if (!q) return [];
    return filtered.filter((a) => {
      const blob = [
        a.title,
        a.keywords,
        a.authors,
        a.journal,
        a.doi,
        a.study_countries.join(" "),
        a.researcher_countries.join(" "),
        a.flow,
        flowLabel(a.flow),
      ].join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [filtered, q]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">{t("search.kicker")}</div>
          <h1>{t("search.title")}</h1>
          <p className="page-dek">{t("search.dek")}</p>
        </div>
        <div className="page-stamp">
          <strong>{t("search.base")}</strong><br/>
          {t("unit.articles", { n: fmtInt(filtered.length) })}<br/>
          {t("search.baseNote")}
        </div>
      </div>

      <div className="module" style={{ paddingTop: 16 }}>
        <div className="filter-row">
          <label htmlFor="search-input">{t("search.label")}</label>
          <input
            id="search-input"
            type="search"
            placeholder={t("search.placeholder")}
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2 aria-live="polite">{t("search.results", { n: fmtInt(matches.length) })}</h2>
        <div className="section-aside">{q ? t("search.term", { q }) : t("search.typeToStart")}</div>
      </div>

      {q ? (
        <div className="table-wrap">
          <table className="ed">
            <thead>
              <tr>
                <th scope="col">{t("col.year")}</th>
                <th scope="col">{t("col.title")}</th>
                <th scope="col">{t("col.journal")}</th>
                <th scope="col">{t("col.keywords")}</th>
                <th scope="col">{t("col.context")}</th>
                <th scope="col">{t("col.flow")}</th>
              </tr>
            </thead>
            <tbody>
              {matches.slice(0, 120).map((a) => (
                <tr key={a.id}>
                  <td className="num">{a.year}</td>
                  <td className="title"><ArticleTitle a={a} /></td>
                  <td style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 12 }}>{a.journal}</td>
                  <td style={{ fontSize: 12, color: "var(--ink-3)" }}>{(a.keywords || "-").slice(0, 140)}</td>
                  <td className="num" title={a.study_countries.join(", ")}>{countryList(a.study_countries)}</td>
                  <td><FlowChip flow={a.flow} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="footnote">{t("search.empty")}</div>
      )}
      {q && matches.length > 120 && (
        <div className="footnote">{t("search.showing", { shown: 120, n: fmtInt(matches.length) })}</div>
      )}
    </div>
  );
}

Object.assign(window, { MesoPage, MicroPage, SearchPage });
