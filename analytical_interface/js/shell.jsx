/* global React, ReactDOM, I18N, t */
const { useState, useEffect, useMemo, useRef } = React;

// ---------------- Shared helpers ----------------
const YEAR_MIN = 2012;
const YEAR_MAX = 2025;
// research_flow compares the sets of study and researcher countries (see the data dictionary).
const FLOWS = ["Domestic", "Partially domestic", "Intra-continental", "Cross-continental"];

// Okabe–Ito based palette: distinguishable under common colour-vision deficiencies.
// Hex (not oklch) because Plotly and alpha suffixes need it.
const FLOW_COLORS = {
  "Domestic": "#0072B2",
  "Partially domestic": "#56B4E9",
  "Intra-continental": "#009E73",
  "Cross-continental": "#E69F00",
  "": "#8A8F97",
};
const MAP_SCALES = {
  context: { light: ["#CFE3F0", "#0072B2"], dark: ["#1E4C6B", "#56B4E9"] },
  production: { light: ["#F6DFAE", "#B07400"], dark: ["#5A4210", "#E69F00"] },
};

function flowLabel(flow) { return FLOWS.includes(flow) ? t("flow." + flow) : t("flow.unknown"); }
function fmtInt(n) { return new Intl.NumberFormat(I18N.locale()).format(Math.round(n || 0)); }
function fmtPct(n, dec = 1) {
  return new Intl.NumberFormat(I18N.locale(), { style: "percent", minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n || 0);
}
function fmtDec(n, dec = 3) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "—";
  return new Intl.NumberFormat(I18N.locale(), { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
}
// 5-year growth: (2021–2025 − 2016–2020) / 2016–2020; undefined when 2016–2020 is empty.
function fmtGrowth(rate, prev, last) {
  if (rate === null || rate === undefined || rate === "" || !Number.isFinite(Number(rate))) {
    return prev === 0 && last > 0 ? t("growth.new") : "—";
  }
  const pct = new Intl.NumberFormat(I18N.locale(), { style: "percent", maximumFractionDigits: 0 }).format(rate);
  return (rate > 0 ? "+" : "") + pct;
}
function growthTip(prev, last) {
  return Number.isFinite(prev) && Number.isFinite(last) ? t("growth.tip", { prev, last }) : "";
}
function uniqueCount(list, key) {
  const seen = new Set();
  list.forEach((a) => (a[key] || []).forEach((c) => seen.add(c)));
  return seen.size;
}
// Per-group article count and study countries (whole counting) for the current selection.
function groupStats(articles, key) {
  const out = {};
  articles.forEach((a) => {
    const g = out[a[key]] || (out[a[key]] = { n: 0, countries: {} });
    g.n += 1;
    a.study_countries.forEach((c) => { g.countries[c] = (g.countries[c] || 0) + 1; });
  });
  Object.values(out).forEach((g) => {
    g.n_countries = Object.keys(g.countries).length;
    g.top_countries = Object.entries(g.countries).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  });
  return out;
}
function clampYear(y) { return Math.max(YEAR_MIN, Math.min(YEAR_MAX, Number(y) || YEAR_MIN)); }

function parseCsv(text) {
  const lines = (text || "").replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
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

// Each file is fetched once and shared by every component that asks for it.
const resourceCache = {};
function loadResource(path, kind) {
  if (!resourceCache[path]) {
    resourceCache[path] = fetch(path).then((r) => {
      if (!r.ok) throw new Error(path + " not found");
      return kind === "json" ? r.json() : r.text().then(parseCsv);
    });
  }
  return resourceCache[path];
}

function useResource(path, kind) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let cancelled = false;
    loadResource(path, kind)
      .then((data) => { if (!cancelled) setState({ data, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, error }); });
    return () => { cancelled = true; };
  }, [path, kind]);
  return state;
}
function useRes(path) { return useResource(path, "json"); }
function useDatasetRes(baseName) { return useResource(`data/${baseName}_dataset.csv`, "csv"); }

// ---------------- Masthead ----------------
function Masthead({ meta, settings, onSettingsChange, onShowTour }) {
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
      if (event.key === "Escape") { setOpen(false); buttonRef.current && buttonRef.current.focus(); }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const setSetting = (patch) => onSettingsChange && onSettingsChange(patch);
  const toggle = (key, on) => (
    <button
      type="button"
      aria-pressed={on}
      className={"btn-ed ghost " + (on ? "active" : "")}
      onClick={() => setSetting({ [key]: !on })}
    >
      {on ? t("settings.on") : t("settings.off")}
    </button>
  );

  return (
    <header className="masthead">
      <div>
        <div className="masthead-title">
          {t("app.name")} <span className="masthead-sub">{t("app.nameSub")}</span>
        </div>
      </div>
      <div className="masthead-center">
        {t("masthead.edition", { version: meta?.version || "—", n: fmtInt(meta?.n_articles || 0), date: meta?.date || "—" })}
      </div>
      <div className="masthead-settings-wrap">
        <button
          ref={buttonRef}
          type="button"
          className="btn-ed masthead-settings-trigger"
          aria-expanded={open}
          aria-controls="settings-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {t("settings.open")}
        </button>
        {open && (
          <div ref={menuRef} id="settings-menu" className="settings-menu" role="group" aria-label={t("settings.label")}>
            <div className="settings-item">
              <label htmlFor="language-select">{t("settings.language")}</label>
              <select
                id="language-select"
                value={settings.language || "auto"}
                onChange={(event) => setSetting({ language: event.target.value })}
              >
                <option value="auto">{t("settings.languageAuto")}</option>
                <option value="pt" lang="pt-BR">Português</option>
                <option value="en" lang="en">English</option>
                <option value="es" lang="es">Español</option>
              </select>
            </div>

            <div className="settings-item">
              <label htmlFor="font-scale-slider">{t("settings.fontSize")}</label>
              <input
                id="font-scale-slider"
                type="range"
                min="0.85"
                max="1.3"
                step="0.05"
                value={settings.fontScale || 1}
                onChange={(event) => setSetting({ fontScale: Number(event.target.value) })}
              />
              <span className="settings-value">{Math.round((settings.fontScale || 1) * 100)}%</span>
            </div>

            <div className="settings-item settings-toggle-row">
              <span>{t("settings.dyslexic")}</span>
              {toggle("dyslexicFontEnabled", !!settings.dyslexicFontEnabled)}
            </div>

            <div className="settings-item settings-toggle-row">
              <span>{t("settings.dark")}</span>
              <button
                type="button"
                aria-pressed={settings.theme === "dark"}
                className={"btn-ed ghost " + (settings.theme === "dark" ? "active" : "")}
                onClick={() => setSetting({ theme: settings.theme === "dark" ? "light" : "dark" })}
              >
                {settings.theme === "dark" ? t("settings.on") : t("settings.off")}
              </button>
            </div>

            <div className="settings-item settings-toggle-row">
              <span>{t("settings.vlibras")}</span>
              {toggle("vlibrasEnabled", !!settings.vlibrasEnabled)}
            </div>

            <button type="button" className="btn-ed ghost" onClick={() => { setOpen(false); onShowTour && onShowTour(); }}>
              {t("settings.tour")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// ---------------- Level nav ----------------
function LevelNav({ level, setLevel, counts, selectedTopic, selectedMega, clearDrill }) {
  const levels = [
    { id: "home", marker: "§", name: t("level.home"), count: "" },
    { id: "search", marker: "⌕", name: t("level.search"), count: "", sub: t("level.searchSub") },
    { id: "macro", marker: "III", name: t("level.macro"), count: counts.megatopics, sub: t("level.macroSub") },
    { id: "meso", marker: "II", name: t("level.meso"), count: counts.topics, sub: t("level.mesoSub") },
    { id: "micro", marker: "I", name: t("level.micro"), count: counts.articles, sub: t("level.microSub") },
  ];
  return (
    <nav className="level-nav" aria-label={t("sidebar.levels")}>
      {levels.map((l) => (
        <button
          type="button"
          key={l.id}
          className={"level-item " + (level === l.id ? "active" : "")}
          aria-current={level === l.id ? "page" : undefined}
          onClick={() => setLevel(l.id)}
        >
          <span className="level-marker" aria-hidden="true">{l.marker}</span>
          <span>
            <span className="level-name">{l.name}</span>
            {l.sub && <span className="level-sub">{l.sub}</span>}
          </span>
          <span className="level-count">{l.count || ""}</span>
        </button>
      ))}
      {(selectedTopic || selectedMega) && (
        <button type="button" className="btn-ed ghost" style={{ marginTop: 12 }} onClick={clearDrill}>{t("level.clearDrill")}</button>
      )}
    </nav>
  );
}

// ---------------- Filters ----------------
function Filters({ filters, setFilters, options }) {
  const setYear = (key, value) => {
    const y = clampYear(value);
    const next = { ...filters, [key]: y };
    if (key === "yearMin" && y > next.yearMax) next.yearMax = y;
    if (key === "yearMax" && y < next.yearMin) next.yearMin = y;
    setFilters(next);
  };
  return (
    <div className="filter-group">
      <div className="filter-row inline">
        <div>
          <label htmlFor="f-year-min">{t("filters.yearMin")}</label>
          <input id="f-year-min" type="number" value={filters.yearMin} min={YEAR_MIN} max={YEAR_MAX} onChange={(e) => setYear("yearMin", e.target.value)} />
        </div>
        <div>
          <label htmlFor="f-year-max">{t("filters.yearMax")}</label>
          <input id="f-year-max" type="number" value={filters.yearMax} min={YEAR_MIN} max={YEAR_MAX} onChange={(e) => setYear("yearMax", e.target.value)} />
        </div>
      </div>
      <div className="filter-row">
        <label htmlFor="f-country">{t("filters.country")}</label>
        <select id="f-country" value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value })}>
          <option value="">{t("filters.allCountries")}</option>
          {options.countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-row">
        <span className="filter-label" id="f-flow-label">{t("filters.flow")}</span>
        <div className="chip-row" role="group" aria-labelledby="f-flow-label">
          {FLOWS.map((f) => (
            <button type="button" key={f} aria-pressed={filters.flow === f}
                    className={"chip " + (filters.flow === f ? "active" : "")}
                    onClick={() => setFilters({ ...filters, flow: filters.flow === f ? "" : f })}>
              <span className="legend-swatch" style={{ background: FLOW_COLORS[f] }} aria-hidden="true"></span>{flowLabel(f)}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <span className="filter-label" id="f-geo-label">{t("filters.geoMode")}</span>
        <div className="chip-row" role="group" aria-labelledby="f-geo-label">
          <button type="button" aria-pressed={filters.geoMode === "context"} className={"chip " + (filters.geoMode === "context" ? "active" : "")} onClick={() => setFilters({ ...filters, geoMode: "context" })}>{t("filters.context")}</button>
          <button type="button" aria-pressed={filters.geoMode === "production"} className={"chip " + (filters.geoMode === "production" ? "active" : "")} onClick={() => setFilters({ ...filters, geoMode: "production" })}>{t("filters.production")}</button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Breadcrumb ----------------
function Breadcrumb({ level, setLevel, mega, topic, counts }) {
  if (level === "search") {
    return (
      <nav className="breadcrumb" aria-label="breadcrumb">
        <button type="button" className="crumb" onClick={() => setLevel("home")}>{t("crumb.hub")}</button>
        <span className="sep" aria-hidden="true">▸</span>
        <span className="crumb active" aria-current="page">{t("crumb.search")}</span>
      </nav>
    );
  }
  const crumbs = [
    { id: "home", name: t("crumb.hub") },
    { id: "macro", name: t("crumb.macro", { n: counts.megatopics }) },
    { id: "meso", name: mega ? `${t("level.meso")} · ${mega.megatopic_description}` : t("crumb.meso", { n: counts.topics }) },
    { id: "micro", name: topic ? `${t("level.micro")} · ${topic.topic_description}` : t("crumb.micro", { n: counts.articles }) },
  ];
  const curIdx = { home: 0, macro: 1, meso: 2, micro: 3 }[level];
  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      {crumbs.slice(0, curIdx + 1).map((c, i) => (
        <React.Fragment key={c.id}>
          {i === curIdx
            ? <span className="crumb active" aria-current="page">{c.name}</span>
            : <button type="button" className="crumb" onClick={() => setLevel(c.id)}>{c.name}</button>}
          {i < curIdx && <span className="sep" aria-hidden="true">▸</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ---------------- KPI strip ----------------
function KpiStrip({ articles, corpusSize }) {
  const total = articles.length;
  const countries = uniqueCount(articles, "study_countries");
  const journals = new Set(articles.map((a) => a.journal).filter((j) => j && j !== "-")).size;
  const cross = articles.filter((a) => a.flow === "Cross-continental").length;
  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="kpi-label">{t("kpi.articles")}</div>
        <div className="kpi-value">{fmtInt(total)}<span className="kpi-unit">{t("kpi.of", { n: fmtInt(corpusSize) })}</span></div>
        <div className="kpi-delta">{t("kpi.share", { pct: fmtPct(total / Math.max(1, corpusSize)) })}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">{t("kpi.countries")}</div>
        <div className="kpi-value">{fmtInt(countries)}<span className="kpi-unit">{t("kpi.unique")}</span></div>
        <div className="kpi-delta">{t("kpi.countriesNote")}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">{t("kpi.journals")}</div>
        <div className="kpi-value">{fmtInt(journals)}<span className="kpi-unit">{t("kpi.journalsUnit")}</span></div>
        <div className="kpi-delta">{t("kpi.journalsNote")}</div>
      </div>
      <div className="kpi">
        <div className="kpi-label">{t("kpi.cross")}</div>
        <div className="kpi-value">{fmtInt(cross)}<span className="kpi-unit">{fmtPct(cross / Math.max(1, total), 0)}</span></div>
        <div className="kpi-delta">{t("kpi.crossNote")}</div>
      </div>
    </div>
  );
}

// Export everything to window for cross-file use
Object.assign(window, {
  Masthead, LevelNav, Filters, Breadcrumb, KpiStrip,
  fmtInt, fmtPct, fmtDec, fmtGrowth, growthTip, flowLabel, uniqueCount, groupStats, clampYear,
  parseCsv, loadResource, useRes, useDatasetRes,
  FLOWS, FLOW_COLORS, MAP_SCALES, YEAR_MIN, YEAR_MAX,
});
