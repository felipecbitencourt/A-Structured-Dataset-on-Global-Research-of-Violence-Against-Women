/* global React */
const { useState: useState2, useMemo: useMemo2 } = React;

// ============ MESO ============
function MesoPage({ topics, megatopics, filtered, selectedMega, onSelectTopic, selectedTopic, compareTopic, setCompareTopic }) {
  const byTopic = {};
  filtered.forEach((a) => { byTopic[a.topic_id] = (byTopic[a.topic_id] || 0) + 1; });
  let rows = topics.map((t) => ({
    ...t,
    filtered_count: byTopic[t.topic_id] || 0,
  }));
  if (selectedMega) rows = rows.filter((r) => r.megatopic_id === selectedMega.megatopic_id);
  rows = rows.sort((a, b) => b.filtered_count - a.filtered_count);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">Nível Meso · 32 tópicos {selectedMega ? `· filtro em “${selectedMega.megatopic_description}”` : ""}</div>
          <h1>Tópicos, lado a lado.</h1>
          <p className="page-dek">Selecione um tópico para abrir sua ficha. Selecione um segundo para comparar — volume, coerência (Cv), crescimento e distribuição de fluxos aparecem em paralelo.</p>
        </div>
        <div className="page-stamp">
          <strong>NA SELEÇÃO</strong><br/>
          {rows.length} tópicos<br/>
          {fmtInt(rows.reduce((s, r) => s + r.filtered_count, 0))} artigos<br/>
          <br/>
          <strong>COMPARAR</strong><br/>
          {selectedTopic ? "A: T" + selectedTopic.topic_id : "—"}<br/>
          {compareTopic ? "B: T" + compareTopic.topic_id : "—"}
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2>Constelação dos tópicos</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{rows.length} tópicos</div>
      </div>
      <div className="module">
        <div className="module-note" style={{ marginTop: 0 }}>
          Cada ponto representa um tópico. Quanto maior o ponto, maior o volume de artigos no recorte; a distância ao centro representa predominância relativa. Clique em um ponto para abrir a ficha do tópico.
        </div>
        <TopicStarChart rows={rows} selectedTopic={selectedTopic} compareTopic={compareTopic} onSelectTopic={onSelectTopic} />
      </div>

      <div className="section-head">
        <div className="section-num">§ 02</div>
        <h2>Ranking sinóptico</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>tabela de apoio</div>
      </div>
      <table className="ed">
        <thead>
          <tr>
            <th>#</th>
            <th>Tópico</th>
            <th>Megatópico</th>
            <th style={{ textAlign: "right" }}>Artigos ⌀</th>
            <th style={{ textAlign: "right" }}>Cv</th>
            <th style={{ textAlign: "right" }}>Cresc. 5a</th>
            <th style={{ textAlign: "right" }}>Países</th>
            <th>Série</th>
            <th style={{ width: 80 }}>Comparar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isA = selectedTopic?.topic_id === r.topic_id;
            const isB = compareTopic?.topic_id === r.topic_id;
            return (
              <tr key={r.topic_id} className={isA || isB ? "selected" : ""} onClick={() => onSelectTopic(r)}>
                <td className="num">{String(i + 1).padStart(2, "0")}</td>
                <td className="title">{r.topic_description}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>M{r.megatopic_id}</td>
                <td className="num" style={{ textAlign: "right" }}>{fmtInt(r.filtered_count)}</td>
                <td className="num" style={{ textAlign: "right" }}>{r.coherence_cv.toFixed(3)}</td>
                <td className="num" style={{ textAlign: "right", color: r.growth_rate_5yr > 0 ? "var(--positive)" : "var(--crimson)" }}>
                  {(r.growth_rate_5yr * 100).toFixed(0)}%
                </td>
                <td className="num" style={{ textAlign: "right" }}>{r.n_countries}</td>
                <td><Sparkline values={r.yearly_series || []} /></td>
                <td onClick={(e) => { e.stopPropagation(); setCompareTopic(isB ? null : r); }}>
                  <button className="btn-ed" style={{ fontSize: 10 }}>{isA ? "A" : isB ? "B ✕" : "+ B"}</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedTopic && (
        <div>
          <div className="section-head">
            <div className="section-num">§ 03</div>
            <h2>{compareTopic ? "Comparação A / B" : "Ficha do tópico"}</h2>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {compareTopic ? "T" + selectedTopic.topic_id + " × T" + compareTopic.topic_id : "T" + selectedTopic.topic_id}
            </div>
          </div>
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
        </div>
      )}
    </div>
  );
}

function TopicCard({ t, label }) {
  const yearData = (t.yearly_series || []).map((v, i) => ({ year: 2000 + i, count: v }));
  return (
    <div>
      <div className="module-head">
        <div>
          <div className="module-title">{label} · T{t.topic_id}</div>
          <div className="module-sub">{t.topic_description}</div>
        </div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>M{t.megatopic_id}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--rule)" }}>
        <Metric label="Artigos" value={fmtInt(t.article_count)} />
        <Metric label="Cv" value={t.coherence_cv.toFixed(3)} />
        <Metric label="Cresc. 5a" value={(t.growth_rate_5yr * 100).toFixed(0) + "%"} pos={t.growth_rate_5yr > 0} />
        <Metric label="Países" value={t.n_countries} />
      </div>
      <div style={{ padding: "12px 0" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Série 2000–2024</div>
        <YearSeries data={yearData} width={360} height={140} />
      </div>
      <div style={{ padding: "12px 0", borderTop: "1px solid var(--rule)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Distribuição de fluxos</div>
        <FlowStack dist={t.flow_distribution || []} />
      </div>
    </div>
  );
}

function Metric({ label, value, pos }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 400, color: pos === undefined ? "var(--ink-1)" : pos ? "var(--positive)" : "var(--crimson)", lineHeight: 1 }}>{value}</div>
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
    return {
      ...r,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      angle,
      dot: 4 + intensity * 10,
      intensity,
    };
  });

  return (
    <div className="topic-star-wrap">
      <svg className="topic-star-chart" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico estrela dos tópicos">
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
        <text x={cx} y={cy - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-4)" style={{ letterSpacing: "0.08em" }}>
          MESO
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill="var(--ink-3)">
          {rows.length} tópicos
        </text>
      </svg>
    </div>
  );
}

// ============ MICRO ============
function MicroPage({ filtered, topics, megatopics, dark }) {
  const [mapMode, setMapMode] = useState2("context");
  const [yearRange, setYearRange] = useState2(null);
  const [sortKey, setSortKey] = useState2("year");
  const yearCounts = {};
  filtered.forEach((a) => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });
  const yearData = Object.keys(yearCounts).map((y) => ({ year: +y, count: yearCounts[y] })).sort((a, b) => a.year - b.year);

  const flowDist = {};
  filtered.forEach((a) => { flowDist[a.flow] = (flowDist[a.flow] || 0) + 1; });
  const flowArr = Object.keys(flowDist).map((k) => ({ label: k, value: flowDist[k] })).sort((a, b) => b.value - a.value);

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "year") return b.year - a.year;
    if (sortKey === "country") return (a.study_country || "").localeCompare(b.study_country || "");
    return 0;
  });

  const openDoi = (doiRaw) => {
    const doi = String(doiRaw || "").trim();
    if (!doi) return;
    const normalized = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
    if (!normalized) return;
    window.open(`https://doi.org/${encodeURIComponent(normalized)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">Nível Micro · {fmtInt(filtered.length)} artigos no recorte</div>
          <h1>Evidências, uma por uma.</h1>
          <p className="page-dek">Mapas, série temporal e distribuição de fluxos se coordenam com a tabela abaixo. Todo clique aqui é também um filtro — selecione um país, um ano ou um fluxo para restringir o recorte.</p>
        </div>
        <div className="page-stamp">
          <strong>RECORTE</strong><br/>
          {fmtInt(filtered.length)} artigos<br/>
          {new Set(filtered.map(a => a.topic_id)).size} tópicos<br/>
          {new Set(filtered.map(a => a.study_country)).size} países<br/>
          {filtered.length ? (Math.min(...filtered.map(a => a.year)) + "–" + Math.max(...filtered.map(a => a.year))) : "—"}
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2>Cartografia dupla</h2>
        <div style={{ display: "flex", gap: 0, border: "1px solid var(--rule-strong)" }}>
          <button className="btn-ed" onClick={() => setMapMode("context")}
                  style={{ border: "none", background: mapMode === "context" ? "var(--ink-1)" : "transparent", color: mapMode === "context" ? "var(--paper)" : "var(--ink-2)" }}>
            Contexto empírico
          </button>
          <button className="btn-ed" onClick={() => setMapMode("production")}
                  style={{ border: "none", borderLeft: "1px solid var(--rule-strong)", background: mapMode === "production" ? "var(--ink-1)" : "transparent", color: mapMode === "production" ? "var(--paper)" : "var(--ink-2)" }}>
            Produção científica
          </button>
        </div>
      </div>

      <div className="col-12">
        <div className="col-span-8 module" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--rule)" }}>
            <div className="module-title">{mapMode === "context" ? "Onde o fenômeno é estudado" : "Onde o conhecimento é produzido"}</div>
            <div className="module-sub">{mapMode === "context" ? "país do estudo empírico" : "país da filiação institucional dos autores"}</div>
          </div>
          <WorldMap points={filtered} mode={mapMode} dark={dark} />
        </div>
        <div className="col-span-4">
          <div className="module">
            <div className="module-head"><div><div className="module-title">Série temporal</div><div className="module-sub">artigos por ano</div></div></div>
            <YearSeries data={yearData} width={320} height={160} />
          </div>
          <div className="module" style={{ marginTop: 16 }}>
            <div className="module-head"><div><div className="module-title">Fluxo editorial</div><div className="module-sub">distribuição no recorte</div></div></div>
            <FlowStack dist={flowArr} />
          </div>
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 02</div>
        <h2>Artigos · {fmtInt(sorted.length)}</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          ordenar:&nbsp;
          <button className="btn-ed" style={{ fontSize: 10, marginRight: 4 }} onClick={() => setSortKey("year")}>{sortKey === "year" ? "●" : "○"} ano</button>
          <button className="btn-ed" style={{ fontSize: 10 }} onClick={() => setSortKey("country")}>{sortKey === "country" ? "●" : "○"} país</button>
        </div>
      </div>

      <table className="ed">
        <thead>
          <tr>
            <th>Ano</th>
            <th>Título</th>
            <th>Periódico</th>
            <th>Contexto</th>
            <th>Produção</th>
            <th>Fluxo</th>
            <th>Tópico</th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 80).map((a) => (
            <tr
              key={a.id}
              onClick={() => openDoi(a.doi)}
              style={{ cursor: a.doi ? "pointer" : "default" }}
              title={a.doi ? `Abrir DOI: ${a.doi}` : "DOI indisponível"}
            >
              <td className="num">{a.year}</td>
              <td className="title">{a.title}</td>
              <td style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 12 }}>{a.journal}</td>
              <td className="num">{a.study_country}</td>
              <td className="num">{a.researcher_country}</td>
              <td><span className="chip" style={{ background: FLOW_COLORS[a.flow] + "22", borderColor: FLOW_COLORS[a.flow] + "88" }}>{a.flow}</span></td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>T{a.topic_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length > 80 && (
        <div className="footnote">exibindo 80 de {fmtInt(sorted.length)} · refine com filtros acima</div>
      )}
    </div>
  );
}

Object.assign(window, { MesoPage, MicroPage });
