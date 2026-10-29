/* global React, t */
// Command palette (Ctrl/⌘ K) and toast notifications.
const { useState: usePX, useEffect: useEffectPX, useRef: useRefPX } = React;

function CommandPalette({ open, onClose, onAction, megatopics, topics }) {
  const [q, setQ] = usePX("");
  const [active, setActive] = usePX(0);
  const inputRef = useRefPX(null);

  useEffectPX(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    }
  }, [open]);

  if (!open) return null;

  const level = (id) => ({ id: "go-" + id, label: t("palette.go", { level: t("level." + id) }), kind: t("palette.kind.nav"), cmd: { type: "level", level: id } });
  const actions = [
    level("home"), level("macro"), level("meso"), level("micro"), level("search"),
    { id: "year-recent", label: t("palette.rangeRecent"), kind: t("palette.kind.range"), cmd: { type: "filter", patch: { yearMin: 2021, yearMax: YEAR_MAX } } },
    { id: "year-all", label: t("palette.rangeAll", { a: YEAR_MIN, b: YEAR_MAX }), kind: t("palette.kind.range"), cmd: { type: "filter", patch: { yearMin: YEAR_MIN, yearMax: YEAR_MAX } } },
    ...FLOWS.map((f) => ({ id: "flow-" + f, label: t("palette.flow", { flow: flowLabel(f) }), kind: t("palette.kind.filter"), cmd: { type: "filter", patch: { flow: f } } })),
    { id: "geo-prod", label: t("palette.mapProduction"), kind: t("palette.kind.map"), cmd: { type: "filter", patch: { geoMode: "production" } } },
    { id: "geo-ctx", label: t("palette.mapContext"), kind: t("palette.kind.map"), cmd: { type: "filter", patch: { geoMode: "context" } } },
    { id: "export-csv", label: t("guide.exportCsv"), kind: t("palette.kind.data"), cmd: { type: "export-csv" } },
    { id: "export-json", label: t("guide.exportJson"), kind: t("palette.kind.data"), cmd: { type: "export-json" } },
    { id: "copy-link", label: t("guide.copyLink"), kind: t("palette.kind.data"), cmd: { type: "copy-link" } },
    { id: "clear", label: t("palette.reset"), kind: t("palette.kind.system"), cmd: { type: "reset" } },
  ];
  (megatopics || []).forEach((m) => {
    actions.push({ id: "mega-" + m.megatopic_id, label: t("palette.openMega", { name: m.megatopic_description }), kind: t("palette.kind.mega"), cmd: { type: "drill-mega", mega: m } });
  });
  (topics || []).forEach((tp) => {
    actions.push({ id: "topic-" + tp.topic_id, label: t("palette.openTopic", { name: tp.topic_description }), kind: t("palette.kind.topic"), cmd: { type: "drill-topic", topic: tp } });
  });

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? actions.filter((a) => (a.label + " " + a.kind).toLowerCase().includes(needle)).slice(0, 14)
    : actions.slice(0, 12);
  const current = Math.min(active, Math.max(0, filtered.length - 1));
  const run = (a) => { onAction(a.cmd); onClose(); };

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label={t("keys.palette")} onClick={(e) => e.stopPropagation()}>
        <div className="palette-head">
          <span className="palette-key" aria-hidden="true">Ctrl/⌘ K</span>
          <input ref={inputRef} value={q}
                 role="combobox" aria-expanded="true" aria-controls="palette-list"
                 aria-activedescendant={filtered[current] ? "pal-" + filtered[current].id : undefined}
                 aria-label={t("palette.placeholder")}
                 onChange={(e) => { setQ(e.target.value); setActive(0); }}
                 placeholder={t("palette.placeholder")}
                 onKeyDown={(e) => {
                   if (e.key === "Escape") onClose();
                   else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
                   else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
                   else if (e.key === "Enter" && filtered[current]) run(filtered[current]);
                 }} />
          <span className="palette-key" aria-hidden="true">esc</span>
        </div>
        <ul id="palette-list" className="palette-list" role="listbox">
          {filtered.length === 0 && <li className="palette-empty">{t("palette.none")}</li>}
          {filtered.map((a, i) => (
            <li key={a.id} id={"pal-" + a.id} role="option" aria-selected={i === current}
                className={"palette-item" + (i === current ? " is-active" : "")}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(a)}>
              <span className="palette-label">{a.label}</span>
              <span className="palette-kind">{a.kind}</span>
            </li>
          ))}
        </ul>
        <div className="palette-foot">
          <span>{t("palette.footer")}</span>
          <span>{t("palette.count", { n: filtered.length })}</span>
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onDone }) {
  useEffectPX(() => {
    if (!msg) return undefined;
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [msg, onDone]);
  return <div className={"toast" + (msg ? " is-on" : "")} role="status" aria-live="polite">{msg}</div>;
}

Object.assign(window, { CommandPalette, Toast });
