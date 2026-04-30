/* global React */
const { useState, useMemo } = React;

// ============ HOME ============
function HomePage({ meta, megatopics, topics, articles, filtered, setLevel }) {
  const caps = [
    { n: "01", title: "Drill-down tri-nível", body: "Navegue de 7 megatópicos → 32 tópicos → 580 artigos preservando o recorte em cada salto." },
    { n: "02", title: "Filtros reprodutíveis", body: "Todo estado é serializado em URL. Recortes temporais, geográficos e temáticos são compartilháveis." },
    { n: "03", title: "Cartografia científica", body: "Alterne entre o mapa de contexto empírico e o de produção científica com um clique." },
    { n: "04", title: "Comparação A/B", body: "Dois tópicos lado a lado: volume, coerência (Cv), crescimento em 5 anos, diversidade de fluxos." },
    { n: "05", title: "Coerência semântica", body: "Métrica Cv normalizada permite ranquear tópicos por qualidade interna do agrupamento." },
    { n: "06", title: "Transparência metodológica", body: "Documentação clara do corpus e dos critérios de análise para auditoria ponta-a-ponta." },
  ];
  const yearCounts = {};
  articles.forEach((a) => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });
  const yearData = Object.keys(yearCounts).map((y) => ({ year: +y, count: yearCounts[y] })).sort((a, b) => a.year - b.year);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ maxWidth: 720 }}>Um hub editorial para análise multinível de evidências em violência contra a mulher.</h1>
          <p className="page-dek">
            Exploração reprodutível em três escalas — artigos, tópicos, megatópicos — com contexto compartilhado entre visões,
            mapas cruzando onde o fenômeno acontece e onde o conhecimento é produzido, e métricas que separam volume de coerência.
          </p>
        </div>
        <div className="page-stamp">
          <strong>FONTE</strong><br/>
          articles · topics · megatopics
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2>Capacidades da plataforma</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>6 de 6</div>
      </div>
      <div className="cap-grid">
        {caps.map((c) => (
          <div key={c.n} className="cap">
            <div className="cap-num">{c.n} / 06</div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>

      <div className="section-head">
        <div className="section-num">§ 02</div>
        <h2>Três caminhos de entrada</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Micro → Meso → Macro</div>
      </div>
      <div className="path-stack">
        <div className="module path-module">
          <div className="path-main">
            <div className="module-head">
              <div className="module-title">01 · Micro · {fmtInt(meta?.n_articles)}</div>
              <div className="module-sub">Artigos</div>
            </div>
            <div className="module-note">
              Comece no nível mais granular para rastrear evidências por país, ano, periódico e fluxo de pesquisa. Aqui você observa o comportamento real do corpus antes de qualquer agregação.
            </div>
            <div className="path-note">
              <strong>Quando usar:</strong> para perguntas específicas e validação de casos concretos.
            </div>
            <button className="btn-ed" style={{ marginTop: 14 }} onClick={() => setLevel("micro")}>Abrir Micro →</button>
          </div>
          <div className="path-side">
            <div style={{ background: "var(--paper-2)", padding: 14, border: "1px solid var(--rule)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Série temporal do corpus</div>
              <YearSeries data={yearData} width={300} height={140} />
            </div>
          </div>
        </div>

        <div className="module path-module">
          <div className="path-main">
            <div className="module-head">
              <div className="module-title">02 · Meso · {meta?.n_topics}</div>
              <div className="module-sub">Tópicos</div>
            </div>
            <div className="module-note">
              Suba para o nível temático para comparar padrões recorrentes: volume, coerência (Cv) e crescimento ao longo do tempo.
            </div>
            <div className="path-note">
              <strong>Quando usar:</strong> para identificar quais temas concentram produção e quais estão emergindo.
            </div>
            <button className="btn-ed" style={{ marginTop: 14 }} onClick={() => setLevel("meso")}>Abrir Meso →</button>
          </div>
          <div className="path-side">
            <MiniTopicStar topics={topics} />
          </div>
        </div>

        <div className="module path-module">
          <div className="path-main">
            <div className="module-head">
              <div className="module-title">03 · Macro · {meta?.n_megatopics}</div>
              <div className="module-sub">Megatópicos</div>
            </div>
            <div className="module-note">
              Finalize no nível de síntese para enxergar os grandes blocos temáticos e entender a arquitetura geral do conhecimento no corpus.
            </div>
            <div className="path-note">
              <strong>Quando usar:</strong> para comunicação executiva, visão estratégica e comparação entre eixos amplos.
            </div>
            <button className="btn-ed" style={{ marginTop: 14 }} onClick={() => setLevel("macro")}>Abrir Macro →</button>
          </div>
          <div className="path-side">
            <BarList
              items={megatopics.slice(0, 7).map((m) => ({ label: m.megatopic_description, value: m.article_count }))}
              max={Math.max(...megatopics.map(m => m.article_count))}
              onClick={() => setLevel("macro")}
            />
          </div>
        </div>
      </div>

      <div className="footnote">
        Este hub é um material complementar estático para exploração multinível do conjunto de dados de pesquisa sobre violência contra a mulher. Toda computação é feita no navegador a partir de JSONs versionados.
      </div>
    </div>
  );
}

function MiniTopicStar({ topics }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const rMin = 52;
  const rMax = 142;
  const maxCount = Math.max(1, ...topics.map((t) => t.article_count || 0));
  const rows = topics.slice(0, 32);
  const points = rows.map((t, i) => {
    const angle = (-Math.PI / 2) + (i / Math.max(1, rows.length)) * Math.PI * 2;
    const intensity = (t.article_count || 0) / maxCount;
    const radius = rMin + intensity * (rMax - rMin);
    return {
      ...t,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      dot: 2.5 + intensity * 5.5,
    };
  });

  return (
    <div className="topic-star-mini-wrap">
      <svg className="topic-star-mini" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Prévia em estrela dos 32 tópicos">
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={rMin + (rMax - rMin) * k} fill="none" stroke="var(--rule)" strokeDasharray="2 4" />
        ))}
        {points.map((p) => (
          <line key={`ray-${p.topic_id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--rule)" strokeOpacity="0.6" />
        ))}
        {points.map((p) => (
          <circle key={p.topic_id} cx={p.x} cy={p.y} r={p.dot} fill="var(--accent)" fillOpacity="0.75" stroke="var(--paper)" strokeWidth="1" />
        ))}
        <circle cx={cx} cy={cy} r="26" fill="var(--paper-2)" stroke="var(--rule-strong)" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-4)" style={{ letterSpacing: "0.08em" }}>
          MESO
        </text>
        <text x={cx} y={cy + 11} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)">
          32 tópicos
        </text>
      </svg>
    </div>
  );
}

// ============ MACRO ============
function MacroPage({ megatopics, filtered, onSelectMega, selectedMega }) {
  const byMega = {};
  filtered.forEach((a) => { byMega[a.megatopic_id] = (byMega[a.megatopic_id] || 0) + 1; });
  const totalCountries = new Set(filtered.map((a) => a.study_country)).size;
  const totalJournals = new Set(filtered.map((a) => a.journal)).size;
  const totalCross = filtered.filter((a) => a.flow === "Cross-continental" || a.flow === "Multi-national").length;
  const rows = megatopics.map((m) => ({
    ...m,
    filtered_count: byMega[m.megatopic_id] || 0,
    coherence_norm: Math.min(1, Math.max(0, (m.coherence_cv_mean - 0.5) / 0.4)),
    growth_norm: Math.min(1, Math.max(0, m.growth_rate_5yr / 3)),
  })).sort((a, b) => b.filtered_count - a.filtered_count);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">Nível Macro · Síntese por megatópico</div>
          <h1>Sete blocos temáticos que organizam o corpus.</h1>
          <p className="page-dek">Cada megatópico agrupa tópicos relacionados. As métricas abaixo cruzam volume filtrado, coerência semântica média e crescimento quinquenal — selecione um bloco para descer ao nível meso.</p>
        </div>
        <div className="page-stamp">
          <strong>NA SELEÇÃO</strong><br/>
          {fmtInt(filtered.length)} artigos<br/>
          {megatopics.length} megatópicos<br/>
          <br/>
          <strong>ORDENAÇÃO</strong><br/>
          artigos filtrados ↓
        </div>
      </div>
      <KpiStrip
        articles={filtered}
        totalArticles={filtered.length}
        totalCountries={totalCountries}
        totalJournals={totalJournals}
        totalCross={totalCross}
      />

      <div className="section-head">
        <div className="section-num">§ 01</div>
        <h2>Dominância por volume filtrado</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>{fmtInt(filtered.length)} artigos</div>
      </div>

      <div className="col-12">
        <div className="col-span-7">
          <BarList
            items={rows.map((r) => ({ label: r.megatopic_description, value: r.filtered_count, id: r.megatopic_id }))}
            max={Math.max(...rows.map(r => r.filtered_count), 1)}
            onClick={(it) => onSelectMega(rows.find(r => r.megatopic_id === it.id))}
          />
        </div>
        <div className="col-span-5">
          <div className="module-note" style={{ marginTop: 0 }}>
            <em>Coerência × crescimento.</em> Eixo horizontal: coerência média normalizada. Vertical: crescimento em 5 anos. Tamanho do círculo: artigos no recorte.
          </div>
          <CoherenceScatter rows={rows} onSelect={onSelectMega} selected={selectedMega} />
        </div>
      </div>

      <div className="section-head">
        <div className="section-num">§ 02</div>
        <h2>Tabela sinóptica</h2>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>clique para abrir</div>
      </div>

      <table className="ed">
        <thead>
          <tr>
            <th>#</th>
            <th>Megatópico</th>
            <th style={{ textAlign: "right" }}>Artigos ⌀</th>
            <th style={{ textAlign: "right" }}>Tópicos</th>
            <th style={{ textAlign: "right" }}>Cv médio</th>
            <th style={{ textAlign: "right" }}>Cresc. 5a</th>
            <th style={{ textAlign: "right" }}>Países</th>
            <th>Top 3 países</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.megatopic_id} className={selectedMega?.megatopic_id === r.megatopic_id ? "selected" : ""} onClick={() => onSelectMega(r)}>
              <td className="num">{String(i + 1).padStart(2, "0")}</td>
              <td className="title">{r.megatopic_description}</td>
              <td className="num" style={{ textAlign: "right" }}>{fmtInt(r.filtered_count)}</td>
              <td className="num" style={{ textAlign: "right" }}>{r.n_topics}</td>
              <td className="num" style={{ textAlign: "right" }}>{r.coherence_cv_mean.toFixed(3)}</td>
              <td className="num" style={{ textAlign: "right", color: r.growth_rate_5yr > 0 ? "var(--positive)" : "var(--crimson)" }}>
                {(r.growth_rate_5yr * 100).toFixed(0)}%
              </td>
              <td className="num" style={{ textAlign: "right" }}>{r.n_countries}</td>
              <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{r.top_countries.split(";").slice(0, 3).join(" ·")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoherenceScatter({ rows, onSelect, selected }) {
  const w = 340, h = 260, pad = { t: 12, r: 20, b: 30, l: 40 };
  const ix = (v) => pad.l + v * (w - pad.l - pad.r);
  const iy = (v) => h - pad.b - v * (h - pad.t - pad.b);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", border: "1px solid var(--rule)", background: "var(--paper)" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={ix(g)} x2={ix(g)} y1={pad.t} y2={h - pad.b} stroke="var(--rule)" strokeDasharray="2 3" />
          <line x1={pad.l} x2={w - pad.r} y1={iy(g)} y2={iy(g)} stroke="var(--rule)" strokeDasharray="2 3" />
        </g>
      ))}
      <text x={ix(0.5)} y={h - 6} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>Coerência ⟶</text>
      <text transform={`translate(12, ${iy(0.5)}) rotate(-90)`} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)" style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>Crescimento 5a ⟶</text>
      {rows.map((r) => {
        const maxFiltered = Math.max(...rows.map(x => x.filtered_count), 1);
        const size = 4 + (r.filtered_count / maxFiltered) * 18;
        return (
          <g key={r.megatopic_id} onClick={() => onSelect(r)} style={{ cursor: "pointer" }}>
            <circle cx={ix(r.coherence_norm)} cy={iy(r.growth_norm)} r={size}
                    fill={selected?.megatopic_id === r.megatopic_id ? "var(--accent)" : "var(--accent)"}
                    fillOpacity={selected?.megatopic_id === r.megatopic_id ? 0.8 : 0.35}
                    stroke="var(--accent)" strokeWidth="1" />
            <text x={ix(r.coherence_norm)} y={iy(r.growth_norm) - size - 3} fontSize="9" textAnchor="middle" fill="var(--ink-2)" fontFamily="var(--sans)">
              M{r.megatopic_id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { HomePage, MacroPage });
