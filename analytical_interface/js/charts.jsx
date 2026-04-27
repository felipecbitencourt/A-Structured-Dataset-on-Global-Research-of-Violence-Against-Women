/* global React, Plotly */
const { useState, useEffect, useMemo, useRef } = React;

// --- D3-like helpers (no lib) ---
function niceScale(min, max, ticks = 5) {
  const range = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(range / ticks)));
  const err = (ticks / range) * step;
  let m = 1;
  if (err <= 0.15) m = 10;
  else if (err <= 0.35) m = 5;
  else if (err <= 0.75) m = 2;
  return { step: m * step, min: Math.floor(min / (m * step)) * (m * step), max: Math.ceil(max / (m * step)) * (m * step) };
}

// SVG line chart — articles over years
function YearSeries({ data, width = 600, height = 200, onYearClick }) {
  const pad = { t: 16, r: 12, b: 24, l: 36 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  if (!data.length) return <div style={{ height, color: "var(--ink-4)" }}>Sem dados</div>;
  const max = Math.max(...data.map((d) => d.count));
  const years = data.map((d) => d.year);
  const minY = Math.min(...years), maxY = Math.max(...years);
  const x = (y) => ((y - minY) / (maxY - minY || 1)) * w + pad.l;
  const yScale = (v) => pad.t + h - (v / max) * h;
  const path = data.map((d, i) => (i === 0 ? "M" : "L") + x(d.year) + "," + yScale(d.count)).join(" ");
  const area = path + ` L${x(maxY)},${pad.t + h} L${x(minY)},${pad.t + h} Z`;
  const ticks = [0, Math.round(max / 2), max];
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={pad.l + w} y1={yScale(t)} y2={yScale(t)} stroke="var(--rule)" strokeDasharray={t === 0 ? "0" : "2 3"} />
          <text x={pad.l - 6} y={yScale(t) + 4} fontSize="10" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--mono)">{t}</text>
        </g>
      ))}
      <path d={area} fill="var(--accent)" opacity="0.12" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
      {data.map((d) => (
        <g key={d.year} onClick={() => onYearClick && onYearClick(d.year)} style={{ cursor: onYearClick ? "pointer" : "default" }}>
          <circle cx={x(d.year)} cy={yScale(d.count)} r="3" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
          <text x={x(d.year)} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)">{d.year % 2 === 1 ? d.year : ""}</text>
        </g>
      ))}
    </svg>
  );
}

// SVG horizontal bar list
function BarList({ items, colorFn, onClick, max, unit = "" }) {
  const m = max || Math.max(...items.map((x) => x.value), 1);
  return (
    <div className="barlist">
      {items.map((it, i) => (
        <div key={i} className="barlist-row" onClick={() => onClick && onClick(it)}>
          <div className="lbl" title={it.label}>{it.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: (it.value / m * 100) + "%", background: colorFn ? colorFn(it) : "var(--accent)" }}></div>
          </div>
          <div className="val">{fmtInt(it.value)}{unit}</div>
        </div>
      ))}
    </div>
  );
}

// Stacked horizontal bar for flow distribution
function FlowStack({ dist }) {
  const total = dist.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div>
      <div style={{ display: "flex", height: 36, border: "1px solid var(--rule-strong)" }}>
        {dist.map((d) => (
          <div key={d.label} title={d.label + ": " + d.value}
               style={{ flex: d.value, background: FLOW_COLORS[d.label] || "var(--ink-3)", position: "relative" }}>
            {d.value / total > 0.08 && (
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                             color: "white", fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.04em" }}>
                {fmtPct(d.value / total, 0)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {dist.map((d) => (
          <span key={d.label} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
            <span className="legend-swatch" style={{ background: FLOW_COLORS[d.label] }}></span>{d.label} · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

// World map with Plotly
function WorldMap({ points, mode, onCountryClick, dark }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Plotly) return;
    // Aggregate by country code (ISO-3) and keep label.
    const byCountry = {};
    points.forEach((p) => {
      const code = mode === "context" ? p.study_country : p.researcher_country;
      const name = mode === "context" ? p.study_country_name : p.researcher_country_name;
      if (!code) return;
      if (!byCountry[code]) byCountry[code] = { count: 0, name: name || code };
      byCountry[code].count += 1;
    });
    const codes = Object.keys(byCountry);
    const counts = codes.map((c) => byCountry[c].count);
    const labels = codes.map((c) => byCountry[c].name || c);
    const trace = {
      type: "choropleth",
      locationmode: "ISO-3",
      locations: codes,
      z: counts,
      customdata: labels.map((name, i) => [name, codes[i]]),
      colorscale: mode === "context"
        ? [[0, dark ? "#1a2530" : "#EDF3F5"], [1, "oklch(0.48 0.08 210)"]]
        : [[0, dark ? "#2a1e15" : "#F5EFE6"], [1, "oklch(0.58 0.09 70)"]],
      marker: { line: { color: dark ? "#0E1114" : "#FAF8F4", width: 0.5 } },
      showscale: false,
      hovertemplate: "<b>%{customdata[0]}</b><br>%{z} artigos<extra>%{customdata[1]}</extra>",
    };
    const layout = {
      geo: {
        showframe: false, showcoastlines: false,
        projection: { type: "natural earth" },
        bgcolor: "rgba(0,0,0,0)",
        landcolor: dark ? "#14181D" : "#F3EFE7",
        showland: true,
        showcountries: true, countrycolor: dark ? "#2a2f36" : "#E0DDD3",
        lataxis: { range: [-55, 75] },
      },
      margin: { l: 0, r: 0, t: 0, b: 0 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      dragmode: false,
    };
    Plotly.newPlot(ref.current, [trace], layout, { displayModeBar: false, responsive: true });
    const el = ref.current;
    el.on && el.on("plotly_click", (e) => {
      if (onCountryClick && e.points && e.points[0]) onCountryClick(e.points[0].location);
    });
    return () => { try { Plotly.purge(ref.current); } catch (e) {} };
  }, [points, mode, dark]);
  return <div ref={ref} style={{ width: "100%", height: 320 }}></div>;
}

// Radar / spider — per topic quality metrics
function Radar({ metrics, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 20;
  const n = metrics.length;
  const angle = (i) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const pt = (i, v) => [cx + Math.cos(angle(i)) * r * v, cy + Math.sin(angle(i)) * r * v];
  const poly = metrics.map((m, i) => pt(i, m.value).join(",")).join(" ");
  return (
    <svg width={size} height={size}>
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon key={g} points={metrics.map((_, i) => pt(i, g).join(",")).join(" ")} fill="none" stroke="var(--rule)" />
      ))}
      {metrics.map((m, i) => {
        const [x, y] = pt(i, 1);
        return (
          <g key={m.label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--rule)" />
            <text x={cx + Math.cos(angle(i)) * (r + 10)} y={cy + Math.sin(angle(i)) * (r + 10)} fontSize="9" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--mono)" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</text>
          </g>
        );
      })}
      <polygon points={poly} fill="var(--accent)" fillOpacity="0.18" stroke="var(--accent)" strokeWidth="1.5" />
      {metrics.map((m, i) => {
        const [x, y] = pt(i, m.value);
        return <circle key={m.label} cx={x} cy={y} r="3" fill="var(--accent)" />;
      })}
    </svg>
  );
}

// Sparkline
function Sparkline({ values, height = 36, stroke = "var(--accent)" }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 120;
  const path = values.map((v, i) => (i === 0 ? "M" : "L") + (i / (values.length - 1 || 1)) * w + "," + (height - (v / max) * (height - 4) - 2)).join(" ");
  return (
    <svg width={w} height={height} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

Object.assign(window, { YearSeries, BarList, FlowStack, WorldMap, Radar, Sparkline });
