/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

// ---------------- Shared helpers ----------------
const TEAL = "oklch(0.48 0.08 210)";
const TEAL_LIGHT = "oklch(0.7 0.09 210)";
const AMBER = "oklch(0.58 0.09 70)";
const CRIMSON = "oklch(0.52 0.13 25)";
const POSITIVE = "oklch(0.55 0.09 155)";

const FLOW_COLORS = {
  "Domestic": "oklch(0.48 0.08 210)",
  "Cross-continental": "oklch(0.58 0.09 70)",
  "Multi-national": "oklch(0.52 0.13 25)",
  "Intra-continental": "oklch(0.55 0.09 155)",
};

function fmtInt(n) { return new Intl.NumberFormat("pt-BR").format(Math.round(n)); }
function fmtPct(n, dec = 1) { return (n * 100).toFixed(dec) + "%"; }
function fmtSigned(n) { return (n >= 0 ? "+" : "") + n; }

function parseCsv(text) {
  const lines = (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (!lines.length) return [];
  const headerLine = lines[0] || "";
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const parseLine = (line) => {
    const cols = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "\"") {
        if (inQuotes && line[i + 1] === "\"") {
          cur += "\"";
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols.map((v) => v.trim());
  };

  const headers = parseLine(lines[0]);
  return lines.slice(1).filter((line) => line.trim().length > 0).map((line) => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((h, i) => {
      const raw = values[i] ?? "";
      const num = Number(raw);
      row[h] = raw !== "" && Number.isFinite(num) ? num : raw;
    });
    return row;
  });
}

function useRes(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(path).then((r) => r.json()).then(setData).catch(() => setData(null));
  }, [path]);
  return data;
}

function useDatasetRes(baseName) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const csvPath = `data/${baseName}_dataset.csv`;
    fetch(csvPath)
      .then((r) => {
        if (!r.ok) throw new Error("csv not found");
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setData(parseCsv(text));
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });

    return () => { cancelled = true; };
  }, [baseName]);
  return data;
}

// ---------------- Masthead ----------------
function Masthead({ meta, settings, onSettingsChange }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const safeSettings = settings || {
    fontScale: 1,
    dyslexicFontEnabled: false,
    theme: "light",
    vlibrasEnabled: false,
    language: "en",
  };
  const setSetting = (patch) => onSettingsChange && onSettingsChange(patch);

  return (
    <header className="masthead">
      <div>
        <div className="masthead-title">
          Hub de Análise <span className="masthead-sub">Científica</span>
        </div>
      </div>
      <div className="masthead-center">
        Vol. {meta?.version || "—"} · Corpus {fmtInt(meta?.n_articles || 580)} · {meta?.date || "—"}
      </div>
      <div className="masthead-settings-wrap">
        <button
          ref={buttonRef}
          type="button"
          className="btn-ed masthead-settings-trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls="settings-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Configurações
        </button>
        {open && (
          <div ref={menuRef} id="settings-menu" className="settings-menu" role="menu" aria-label="Menu de configurações">
            <div className="settings-item">
              <label htmlFor="font-scale-slider">Tamanho da fonte</label>
              <input
                id="font-scale-slider"
                type="range"
                min="0.85"
                max="1.3"
                step="0.05"
                value={safeSettings.fontScale}
                onChange={(event) => setSetting({ fontScale: Number(event.target.value) })}
              />
              <span className="settings-value">{Math.round((safeSettings.fontScale || 1) * 100)}%</span>
            </div>

            <div className="settings-item settings-toggle-row">
              <span>Fonte OpenDyslexic</span>
              <button
                type="button"
                className={"btn-ed ghost " + (safeSettings.dyslexicFontEnabled ? "active" : "")}
                onClick={() => setSetting({ dyslexicFontEnabled: !safeSettings.dyslexicFontEnabled })}
              >
                {safeSettings.dyslexicFontEnabled ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div className="settings-item settings-toggle-row">
              <span>Modo escuro</span>
              <button
                type="button"
                className={"btn-ed ghost " + (safeSettings.theme === "dark" ? "active" : "")}
                onClick={() => setSetting({ theme: safeSettings.theme === "dark" ? "light" : "dark" })}
              >
                {safeSettings.theme === "dark" ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div className="settings-item settings-toggle-row">
              <span>VLibras</span>
              <button
                type="button"
                className={"btn-ed ghost " + (safeSettings.vlibrasEnabled ? "active" : "")}
                onClick={() => setSetting({ vlibrasEnabled: !safeSettings.vlibrasEnabled })}
              >
                {safeSettings.vlibrasEnabled ? "Ativado" : "Desativado"}
              </button>
            </div>

            <div className="settings-item">
              <label htmlFor="language-select">Idioma</label>
              <select
                id="language-select"
                value={safeSettings.language}
                onChange={(event) => setSetting({ language: event.target.value })}
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ---------------- Level nav ----------------
function LevelNav({ level, setLevel, counts, selectedTopic, selectedMega, clearDrill }) {
  const levels = [
    { id: "home", marker: "§", name: "Visão geral", count: "" },
    { id: "search", marker: "IV", name: "Busca", count: "", sub: "Escrita livre" },
    { id: "macro", marker: "III", name: "Macro", count: counts.megatopics, sub: "Megatópicos" },
    { id: "meso", marker: "II", name: "Meso", count: counts.topics, sub: "Tópicos" },
    { id: "micro", marker: "I", name: "Micro", count: counts.articles, sub: "Artigos" },
  ];
  return (
    <div className="level-nav">
      {levels.map((l) => (
        <div key={l.id} className={"level-item " + (level === l.id ? "active" : "")} onClick={() => setLevel(l.id)}>
          <span className="level-marker">{l.marker}</span>
          <div>
            <div className="level-name">{l.name}</div>
            {l.sub && <div style={{ fontSize: 11, color: "var(--ink-4)", fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>{l.sub}</div>}
          </div>
          <span className="level-count">{l.count || ""}</span>
        </div>
      ))}
      {(selectedTopic || selectedMega) && (
        <button className="btn-ed ghost" style={{ marginTop: 12 }} onClick={clearDrill}>Limpar drill-down ✕</button>
      )}
    </div>
  );
}

// ---------------- Filters ----------------
function Filters({ filters, setFilters, options }) {
  return (
    <div className="filter-group">
      <div className="filter-row inline">
        <div>
          <label>Ano mín.</label>
          <input type="number" value={filters.yearMin} min="2011" max="2025" onChange={(e) => setFilters({ ...filters, yearMin: +e.target.value })} />
        </div>
        <div>
          <label>Ano máx.</label>
          <input type="number" value={filters.yearMax} min="2011" max="2025" onChange={(e) => setFilters({ ...filters, yearMax: +e.target.value })} />
        </div>
      </div>
      <div className="filter-row">
        <label>País (contexto)</label>
        <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
          <option value="">Todos</option>
          {options.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <label>Fluxo de pesquisa</label>
        <div className="chip-row">
          {["Domestic", "Cross-continental", "Multi-national", "Intra-continental"].map((f) => (
            <button key={f} className={"chip " + (filters.flow === f ? "active" : "")} onClick={() => setFilters({ ...filters, flow: filters.flow === f ? "" : f })}>{f}</button>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <label>Modo geoespacial</label>
        <div className="chip-row">
          <button className={"chip " + (filters.geoMode === "context" ? "active" : "")} onClick={() => setFilters({ ...filters, geoMode: "context" })}>Contexto</button>
          <button className={"chip " + (filters.geoMode === "production" ? "active" : "")} onClick={() => setFilters({ ...filters, geoMode: "production" })}>Produção</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Time scrubber ----------------
function Scrubber({ filters, setFilters, yearCounts }) {
  const years = [];
  for (let y = 2011; y <= 2025; y++) years.push(y);
  const max = Math.max(1, ...Object.values(yearCounts));
  return (
    <div className="scrubber-bar">
      <div className="scrubber-label">Recorte<br/>temporal</div>
      <div className="scrubber-track">
        <div className="scrubber-ticks">
          {years.map((y) => {
            const h = (yearCounts[y] || 0) / max;
            const inRange = y >= filters.yearMin && y <= filters.yearMax;
            return (
              <div key={y} className={"scrubber-tick " + (inRange ? "in-range" : "")} onClick={() => {
                // clicking narrows to that year
                setFilters({ ...filters, yearMin: y, yearMax: y });
              }}>
                <div className="bar" style={{ height: (h * 100) + "%", minHeight: 2 }}></div>
                {y % 2 === 1 && <div className="tick-label">'{String(y).slice(2)}</div>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="scrubber-readout">
        <span className="num">{filters.yearMin}</span> – <span className="num">{filters.yearMax}</span>
        <button className="btn-ed ghost" style={{ marginLeft: 12, fontSize: 10, padding: "3px 6px" }} onClick={() => setFilters({ ...filters, yearMin: 2011, yearMax: 2025 })}>Reset</button>
      </div>
    </div>
  );
}

// ---------------- Breadcrumb ----------------
function Breadcrumb({ level, setLevel, mega, topic, onClearTopic, onClearMega }) {
  if (level === "search") {
    return (
      <div className="breadcrumb">
        <span className="crumb" onClick={() => setLevel("home")}>Hub</span>
        <span className="sep">▸</span>
        <span className="crumb active">Busca · escrita livre</span>
      </div>
    );
  }
  const crumbs = [
    { id: "home", name: "Hub" },
    { id: "macro", name: "Macro · 7 megatópicos" },
    { id: "meso", name: mega ? `Meso · ${mega.megatopic_description}` : "Meso · 32 tópicos" },
    { id: "micro", name: topic ? `Micro · ${topic.topic_description}` : "Micro · 580 artigos" },
  ];
  const curIdx = { home: 0, macro: 1, meso: 2, micro: 3 }[level];
  return (
    <div className="breadcrumb">
      {crumbs.slice(0, curIdx + 1).map((c, i) => (
        <React.Fragment key={c.id}>
          <span className={"crumb " + (i === curIdx ? "active" : "")} onClick={() => setLevel(c.id)}>{c.name}</span>
          {i < curIdx && <span className="sep">▸</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---------------- KPI strip ----------------
function KpiStrip({ articles, totalArticles, totalCountries, totalJournals, totalCross }) {
  const pct = totalCross / Math.max(1, totalArticles);
  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="kpi-label">Artigos selecionados</div>
        <div className="kpi-value">{fmtInt(totalArticles)}<span className="kpi-unit">de 580</span></div>
        <div className="kpi-delta">{((totalArticles / 580) * 100).toFixed(1)}% do corpus</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Países (contexto)</div>
        <div className="kpi-value">{fmtInt(totalCountries)}<span className="kpi-unit">únicos</span></div>
        <div className="kpi-delta">contextos empíricos</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Periódicos</div>
        <div className="kpi-value">{fmtInt(totalJournals)}<span className="kpi-unit">veículos</span></div>
        <div className="kpi-delta">publicações distintas</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">Cross-continental</div>
        <div className="kpi-value">{fmtInt(totalCross)}<span className="kpi-unit">{fmtPct(pct, 0)}</span></div>
        <div className="kpi-delta">fluxo transnacional</div>
      </div>
    </div>
  );
}

// Export everything to window for cross-file use
Object.assign(window, { Masthead, LevelNav, Filters, Scrubber, Breadcrumb, KpiStrip, fmtInt, fmtPct, fmtSigned, useRes, useDatasetRes, FLOW_COLORS, TEAL, TEAL_LIGHT, AMBER, CRIMSON, POSITIVE });
