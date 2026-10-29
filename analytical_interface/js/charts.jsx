/* global React, Plotly, t */
const { useState, useEffect, useMemo, useRef } = React;

// SVG line chart — articles over years
function YearSeries({ data, width = 600, height = 200, onYearClick, label }) {
  const pad = { t: 16, r: 12, b: 24, l: 36 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  if (!data.length) return <div className="chart-empty" style={{ height }}>{t("chart.noData")}</div>;
  const max = Math.max(1, ...data.map((d) => d.count));
  const years = data.map((d) => d.year);
  const minY = Math.min(...years), maxY = Math.max(...years);
  const x = (y) => ((y - minY) / (maxY - minY || 1)) * w + pad.l;
  const yScale = (v) => pad.t + h - (v / max) * h;
  const path = data.map((d, i) => (i === 0 ? "M" : "L") + x(d.year) + "," + yScale(d.count)).join(" ");
  const area = path + ` L${x(maxY)},${pad.t + h} L${x(minY)},${pad.t + h} Z`;
  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));
  const summary = data.map((d) => `${d.year}: ${d.count}`).join(", ");
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", overflow: "visible" }}
         role="img" aria-label={(label ? label + ". " : "") + summary}>
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={pad.l} x2={pad.l + w} y1={yScale(tk)} y2={yScale(tk)} stroke="var(--rule)" strokeDasharray={tk === 0 ? "0" : "2 3"} />
          <text x={pad.l - 6} y={yScale(tk) + 4} fontSize="10" textAnchor="end" fill="var(--ink-4)" fontFamily="var(--mono)">{tk}</text>
        </g>
      ))}
      <path d={area} fill="var(--accent)" opacity="0.12" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.8" />
      {data.map((d) => (
        <g key={d.year} onClick={() => onYearClick && onYearClick(d.year)} style={{ cursor: onYearClick ? "pointer" : "default" }}>
          <title>{`${d.year}: ${d.count}`}</title>
          <circle cx={x(d.year)} cy={yScale(d.count)} r="3" fill="var(--paper)" stroke="var(--accent)" strokeWidth="1.5" />
          {onYearClick && <circle cx={x(d.year)} cy={yScale(d.count)} r="9" fill="transparent" />}
          <text x={x(d.year)} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--ink-4)" fontFamily="var(--mono)">{d.year % 2 === 1 ? d.year : ""}</text>
        </g>
      ))}
    </svg>
  );
}

// Horizontal bar list
function BarList({ items, colorFn, onClick, max, unit = "" }) {
  const m = max || Math.max(...items.map((x) => x.value), 1);
  const Row = onClick ? "button" : "div";
  return (
    <div className="barlist">
      {items.map((it, i) => (
        <Row key={it.id ?? i} type={onClick ? "button" : undefined} className="barlist-row" onClick={onClick ? () => onClick(it) : undefined}>
          <span className="lbl" title={it.label}>{it.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: (it.value / m * 100) + "%", background: colorFn ? colorFn(it) : "var(--accent)" }}></span>
          </span>
          <span className="val">{fmtInt(it.value)}{unit}</span>
        </Row>
      ))}
    </div>
  );
}

// Stacked horizontal bar for flow distribution
function FlowStack({ dist, onFlowClick }) {
  const total = dist.reduce((s, d) => s + d.value, 0) || 1;
  if (!dist.length) return <div className="chart-empty" style={{ height: 36 }}>{t("chart.noData")}</div>;
  return (
    <div>
      <div style={{ display: "flex", height: 36, border: "1px solid var(--rule-strong)" }} role="img"
           aria-label={dist.map((d) => `${flowLabel(d.label)}: ${d.value}`).join(", ")}>
        {dist.map((d) => (
          <div key={d.label} title={flowLabel(d.label) + ": " + d.value}
               onClick={onFlowClick && d.label ? () => onFlowClick(d.label) : undefined}
               style={{ flex: d.value, background: FLOW_COLORS[d.label] || FLOW_COLORS[""], position: "relative", cursor: onFlowClick ? "pointer" : "default" }}>
            {d.value / total > 0.08 && (
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                             color: "#14171B", fontSize: 10, fontFamily: "var(--mono)", letterSpacing: "0.04em", fontWeight: 600 }}>
                {fmtPct(d.value / total, 0)}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
        {dist.map((d) => (
          <span key={d.label} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.04em" }}>
            <span className="legend-swatch" style={{ background: FLOW_COLORS[d.label] || FLOW_COLORS[""] }}></span>{flowLabel(d.label)} · {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

// World map with Plotly. Multi-country studies count once in each country (whole counting).
function WorldMap({ points, mode, onCountryClick, dark, lang }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.Plotly) return undefined;
    const byCountry = {};
    points.forEach((p) => {
      const codes = mode === "context" ? p.study_countries : p.researcher_countries;
      (codes || []).forEach((code) => { byCountry[code] = (byCountry[code] || 0) + 1; });
    });
    const codes = Object.keys(byCountry);
    const counts = codes.map((c) => byCountry[c]);
    const [low, high] = MAP_SCALES[mode][dark ? "dark" : "light"];
    const ink = dark ? "#C9C6BE" : "#2A2F36";
    const trace = {
      type: "choropleth",
      locationmode: "ISO-3",
      locations: codes,
      z: counts,
      zmin: 0,
      colorscale: [[0, low], [1, high]],
      marker: { line: { color: dark ? "#0E1114" : "#FAF8F4", width: 0.5 } },
      showscale: true,
      colorbar: {
        thickness: 10, len: 0.6, x: 0.02, xanchor: "left", y: 0.08, yanchor: "bottom",
        outlinewidth: 0, tickfont: { family: "JetBrains Mono, monospace", size: 10, color: ink },
        title: { text: t("map.hover"), font: { family: "JetBrains Mono, monospace", size: 10, color: ink } },
      },
      hovertemplate: "<b>%{location}</b><br>%{z} " + t("map.hover") + "<extra></extra>",
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
    const el = ref.current;
    Plotly.react(el, [trace], layout, { displayModeBar: false, responsive: true });
    el.removeAllListeners && el.removeAllListeners("plotly_click");
    el.on && el.on("plotly_click", (e) => {
      if (onCountryClick && e.points && e.points[0]) onCountryClick(e.points[0].location);
    });
    return undefined;
  }, [points, mode, dark, lang, onCountryClick]);
  useEffect(() => () => { try { Plotly.purge(ref.current); } catch (e) { /* already gone */ } }, []);
  return <div ref={ref} style={{ width: "100%", height: 320 }}></div>;
}

// Sparkline
function Sparkline({ values, height = 36, stroke = "var(--accent)" }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 120;
  const path = values.map((v, i) => (i === 0 ? "M" : "L") + (i / (values.length - 1 || 1)) * w + "," + (height - (v / max) * (height - 4) - 2)).join(" ");
  return (
    <svg width={w} height={height} style={{ display: "block" }} aria-hidden="true">
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}

Object.assign(window, { YearSeries, BarList, FlowStack, WorldMap, Sparkline });
