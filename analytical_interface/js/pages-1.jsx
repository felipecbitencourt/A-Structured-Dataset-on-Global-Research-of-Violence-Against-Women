/* global React, t */
const { useState, useMemo } = React;

function SectionHead({ num, title, aside }) {
  return (
    <div className="section-head">
      <div className="section-num">§ {num}</div>
      <h2>{title}</h2>
      {aside !== undefined && <div className="section-aside">{aside}</div>}
    </div>
  );
}

// ============ HOME ============
function HomePage({ meta, megatopics, topics, articles, setLevel }) {
  const caps = [
    { title: t("home.cap1t"), body: t("home.cap1b", { m: meta.n_megatopics, t: meta.n_topics, a: fmtInt(meta.n_articles) }) },
    { title: t("home.cap2t"), body: t("home.cap2b") },
    { title: t("home.cap3t"), body: t("home.cap3b") },
    { title: t("home.cap4t"), body: t("home.cap4b") },
    { title: t("home.cap5t"), body: t("home.cap5b") },
    { title: t("home.cap6t"), body: t("home.cap6b") },
  ];
  const yearCounts = {};
  articles.forEach((a) => { yearCounts[a.year] = (yearCounts[a.year] || 0) + 1; });
  const yearData = Object.keys(yearCounts).map((y) => ({ year: +y, count: yearCounts[y] })).sort((a, b) => a.year - b.year);
  const paths = [
    { id: "micro", n: "01", count: fmtInt(meta.n_articles), sub: t("level.microSub"), note: t("home.microNote"), when: t("home.microWhen"),
      side: (
        <div style={{ background: "var(--paper-2)", padding: 14, border: "1px solid var(--rule)" }}>
          <div className="mini-label">{t("home.series")}</div>
          <YearSeries data={yearData} width={300} height={140} label={t("home.series")} />
        </div>
      ) },
    { id: "meso", n: "02", count: meta.n_topics, sub: t("level.mesoSub"), note: t("home.mesoNote"), when: t("home.mesoWhen"),
      side: <MiniTopicStar topics={topics} /> },
    { id: "macro", n: "03", count: meta.n_megatopics, sub: t("level.macroSub"), note: t("home.macroNote"), when: t("home.macroWhen"),
      side: (
        <BarList
          items={megatopics.map((m) => ({ id: m.megatopic_id, label: m.megatopic_description, value: m.article_count }))}
          max={Math.max(...megatopics.map((m) => m.article_count))}
          onClick={() => setLevel("macro")}
        />
      ) },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ maxWidth: 720 }}>{t("home.title")}</h1>
          <p className="page-dek">{t("home.dek")}</p>
        </div>
        <div className="page-stamp">
          <strong>{t("home.source")}</strong><br/>
          {meta.version} · {meta.date}<br/>
          articles · topics · megatopics
        </div>
      </div>

      <SectionHead num="01" title={t("home.capsTitle")} />
      <div className="cap-grid">
        {caps.map((c, i) => (
          <div key={i} className="cap">
            <div className="cap-num">{String(i + 1).padStart(2, "0")} / {String(caps.length).padStart(2, "0")}</div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>

      <SectionHead num="02" title={t("home.pathsTitle")} aside="Micro → Meso → Macro" />
      <div className="path-stack">
        {paths.map((p) => (
          <div key={p.id} className="module path-module">
            <div className="path-main">
              <div className="module-head">
                <div className="module-title">{p.n} · {t("level." + p.id)} · {p.count}</div>
                <div className="module-sub">{p.sub}</div>
              </div>
              <div className="module-note">{p.note}</div>
              <div className="path-note"><strong>{t("home.when")}</strong> {p.when}</div>
              <button type="button" className="btn-ed" style={{ marginTop: 14 }} onClick={() => setLevel(p.id)}>
                {t("home.open", { level: t("level." + p.id) })}
              </button>
            </div>
            <div className="path-side">{p.side}</div>
          </div>
        ))}
      </div>

      <div className="footnote">{t("home.footnote")}</div>
    </div>
  );
}

function MiniTopicStar({ topics }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const rMin = 52;
  const rMax = 142;
  const maxCount = Math.max(1, ...topics.map((tp) => tp.article_count || 0));
  const points = topics.map((tp, i) => {
    const angle = (-Math.PI / 2) + (i / Math.max(1, topics.length)) * Math.PI * 2;
    const intensity = (tp.article_count || 0) / maxCount;
    const radius = rMin + intensity * (rMax - rMin);
    return { ...tp, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, dot: 2.5 + intensity * 5.5 };
  });

  return (
    <div className="topic-star-mini-wrap">
      <svg className="topic-star-mini" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={t("home.starLabel")}>
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={rMin + (rMax - rMin) * k} fill="none" stroke="var(--rule)" strokeDasharray="2 4" />
        ))}
        {points.map((p) => (
          <line key={`ray-${p.topic_id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--rule)" strokeOpacity="0.6" />
        ))}
        {points.map((p) => (
          <circle key={p.topic_id} cx={p.x} cy={p.y} r={p.dot} fill="var(--accent)" fillOpacity="0.75" stroke="var(--paper)" strokeWidth="1">
            <title>{`T${p.topic_id} · ${p.topic_description}: ${p.article_count}`}</title>
          </circle>
        ))}
        <circle cx={cx} cy={cy} r="26" fill="var(--paper-2)" stroke="var(--rule-strong)" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-4)" style={{ letterSpacing: "0.08em" }}>MESO</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill="var(--ink-3)">{t("home.topics", { n: topics.length })}</text>
      </svg>
    </div>
  );
}

// ============ MACRO ============
function MacroPage({ megatopics, filtered, corpusSize, onSelectMega, selectedMega }) {
  const byMega = groupStats(filtered, "megatopic_id");
  const rows = megatopics
    .map((m) => {
      const g = byMega[m.megatopic_id] || { n: 0, n_countries: 0, top_countries: [] };
      return { ...m, filtered_count: g.n, n_countries: g.n_countries, top_countries: g.top_countries };
    })
    .sort((a, b) => b.filtered_count - a.filtered_count);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-kicker">{t("macro.kicker")}</div>
          <h1>{t("macro.title")}</h1>
          <p className="page-dek">{t("macro.dek")}</p>
        </div>
        <div className="page-stamp">
          <strong>{t("macro.inSelection")}</strong><br/>
          {t("unit.articles", { n: fmtInt(filtered.length) })}<br/>
          {t("unit.megatopics", { n: megatopics.length })}<br/>
          <br/>
          <strong>{t("macro.sort")}</strong><br/>
          {t("macro.sortValue")}
        </div>
      </div>
      <KpiStrip articles={filtered} corpusSize={corpusSize} />

      <SectionHead num="01" title={t("macro.volume")} aside={t("unit.articles", { n: fmtInt(filtered.length) })} />

      <div className="col-12">
        <div className="col-span-7">
          <BarList
            items={rows.map((r) => ({ label: r.megatopic_description, value: r.filtered_count, id: r.megatopic_id }))}
            max={Math.max(...rows.map((r) => r.filtered_count), 1)}
            onClick={(it) => onSelectMega(rows.find((r) => r.megatopic_id === it.id))}
          />
        </div>
        <div className="col-span-5">
          <div className="module-note" style={{ marginTop: 0 }}>{t("macro.scatterNote")}</div>
          <CoherenceScatter rows={rows} onSelect={onSelectMega} selected={selectedMega} />
        </div>
      </div>

      <SectionHead num="02" title={t("macro.table")} aside={t("macro.clickHint")} />

      <div className="table-wrap">
        <table className="ed">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t("macro.colMega")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.articles")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.topics")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.cvMean")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.growth")}</th>
              <th scope="col" style={{ textAlign: "right" }}>{t("col.countries")}</th>
              <th scope="col">{t("macro.colTop")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.megatopic_id} className={selectedMega?.megatopic_id === r.megatopic_id ? "selected" : ""}>
                <td className="num">{String(i + 1).padStart(2, "0")}</td>
                <td className="title"><button type="button" className="link-btn" onClick={() => onSelectMega(r)}>{r.megatopic_description}</button></td>
                <td className="num" style={{ textAlign: "right" }}>{fmtInt(r.filtered_count)}</td>
                <td className="num" style={{ textAlign: "right" }}>{r.n_topics}</td>
                <td className="num" style={{ textAlign: "right" }}>{fmtDec(r.coherence_cv_mean)}</td>
                <td className="num" title={growthTip(r.growth_prev, r.growth_last)}
                    style={{ textAlign: "right", color: r.growth_rate_5yr > 0 ? "var(--positive)" : r.growth_rate_5yr < 0 ? "var(--crimson)" : "var(--ink-3)" }}>
                  {fmtGrowth(r.growth_rate_5yr, r.growth_prev, r.growth_last)}
                </td>
                <td className="num" style={{ textAlign: "right" }}>{r.n_countries}</td>
                <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-3)" }}>{r.top_countries.slice(0, 3).join(" · ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Axes show the real values (mean Cv and 5-year growth), with ticks.
function CoherenceScatter({ rows, onSelect, selected }) {
  const w = 360, h = 270, pad = { t: 14, r: 20, b: 40, l: 52 };
  const valid = rows.filter((r) => Number.isFinite(r.coherence_cv_mean) && Number.isFinite(r.growth_rate_5yr));
  if (!valid.length) return <div className="chart-empty" style={{ height: h }}>{t("chart.noData")}</div>;
  const xs = valid.map((r) => r.coherence_cv_mean);
  const ys = valid.map((r) => r.growth_rate_5yr);
  const xMin = Math.floor(Math.min(...xs) * 20) / 20, xMax = Math.ceil(Math.max(...xs) * 20) / 20;
  const yMin = Math.min(0, Math.floor(Math.min(...ys) * 2) / 2), yMax = Math.ceil(Math.max(...ys) * 2) / 2;
  const ix = (v) => pad.l + ((v - xMin) / (xMax - xMin || 1)) * (w - pad.l - pad.r);
  const iy = (v) => h - pad.b - ((v - yMin) / (yMax - yMin || 1)) * (h - pad.t - pad.b);
  const xTicks = [0, 0.5, 1].map((k) => xMin + k * (xMax - xMin));
  const yTicks = [0, 0.5, 1].map((k) => yMin + k * (yMax - yMin));
  const maxFiltered = Math.max(...valid.map((x) => x.filtered_count), 1);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", border: "1px solid var(--rule)", background: "var(--paper)" }}
         role="img" aria-label={t("macro.scatterNote")}>
      {xTicks.map((v) => (
        <g key={"x" + v}>
          <line x1={ix(v)} x2={ix(v)} y1={pad.t} y2={h - pad.b} stroke="var(--rule)" strokeDasharray="2 3" />
          <text x={ix(v)} y={h - pad.b + 14} fontSize="9" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)">{fmtDec(v, 2)}</text>
        </g>
      ))}
      {yTicks.map((v) => (
        <g key={"y" + v}>
          <line x1={pad.l} x2={w - pad.r} y1={iy(v)} y2={iy(v)} stroke="var(--rule)" strokeDasharray="2 3" />
          <text x={pad.l - 6} y={iy(v) + 3} fontSize="9" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--mono)">{fmtGrowth(v)}</text>
        </g>
      ))}
      {yMin < 0 && <line x1={pad.l} x2={w - pad.r} y1={iy(0)} y2={iy(0)} stroke="var(--rule-strong)" />}
      <text x={(pad.l + w - pad.r) / 2} y={h - 6} fontSize="10" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--mono)">{t("axis.coherence")} →</text>
      <text transform={`translate(12, ${(pad.t + h - pad.b) / 2}) rotate(-90)`} fontSize="10" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--mono)">{t("axis.growth")} →</text>
      {valid.map((r) => {
        const size = 4 + (r.filtered_count / maxFiltered) * 18;
        const isSel = selected?.megatopic_id === r.megatopic_id;
        return (
          <g key={r.megatopic_id} onClick={() => onSelect(r)} style={{ cursor: "pointer" }}>
            <title>{`M${r.megatopic_id} · ${r.megatopic_description}`}</title>
            <circle cx={ix(r.coherence_cv_mean)} cy={iy(r.growth_rate_5yr)} r={size}
                    fill="var(--accent)" fillOpacity={isSel ? 0.8 : 0.35} stroke="var(--accent)" strokeWidth="1" />
            <text x={ix(r.coherence_cv_mean)} y={iy(r.growth_rate_5yr) - size - 3} fontSize="9" textAnchor="middle" fill="var(--ink-2)" fontFamily="var(--sans)">
              M{r.megatopic_id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { HomePage, MacroPage, SectionHead });
