/* global React */
// Prototype-only enhancements: command palette, toasts, year-click hookups, etc.
const { useState: usePX, useEffect: useEffectPX, useRef: useRefPX } = React;

// ---------------- Command palette (⌘K) ----------------
function CommandPalette({ open, onClose, onAction, megatopics, topics }) {
  const [q, setQ] = usePX("");
  const inputRef = useRefPX(null);

  useEffectPX(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 60);
      setQ("");
    }
  }, [open]);

  if (!open) return null;

  const actions = [
    { id: "go-home", label: "Ir para Visão Geral", kind: "Navegação", run: () => onAction({ type: "level", level: "home" }) },
    { id: "go-macro", label: "Ir para Macro · Megatópicos", kind: "Navegação", run: () => onAction({ type: "level", level: "macro" }) },
    { id: "go-meso", label: "Ir para Meso · Tópicos", kind: "Navegação", run: () => onAction({ type: "level", level: "meso" }) },
    { id: "go-micro", label: "Ir para Micro · Artigos", kind: "Navegação", run: () => onAction({ type: "level", level: "micro" }) },
    { id: "year-recent", label: "Recorte: 2021–2025", kind: "Recorte", run: () => onAction({ type: "filter", patch: { yearMin: 2021, yearMax: 2025 } }) },
    { id: "year-all", label: "Recorte: 2011–2025 (tudo)", kind: "Recorte", run: () => onAction({ type: "filter", patch: { yearMin: 2011, yearMax: 2025 } }) },
    { id: "flow-cross", label: "Filtrar fluxo: Cross-continental", kind: "Filtro", run: () => onAction({ type: "filter", patch: { flow: "Cross-continental" } }) },
    { id: "flow-domestic", label: "Filtrar fluxo: Domestic", kind: "Filtro", run: () => onAction({ type: "filter", patch: { flow: "Domestic" } }) },
    { id: "geo-prod", label: "Mapa: modo produção", kind: "Mapa", run: () => onAction({ type: "filter", patch: { geoMode: "production" } }) },
    { id: "geo-ctx", label: "Mapa: modo contexto", kind: "Mapa", run: () => onAction({ type: "filter", patch: { geoMode: "context" } }) },
    { id: "clear", label: "Limpar drill-down e filtros", kind: "Sistema", run: () => onAction({ type: "reset" }) },
    { id: "export", label: "Exportar CSV filtrado…", kind: "Sistema", run: () => onAction({ type: "toast", msg: "Export iniciado · 580 → arquivo CSV" }) },
  ];

  (megatopics || []).forEach((m) => {
    actions.push({ id: "mega-" + m.megatopic_id, label: "Abrir megatópico · " + m.megatopic_description, kind: "Megatópico", run: () => onAction({ type: "drill-mega", mega: m }) });
  });
  (topics || []).slice(0, 32).forEach((t) => {
    actions.push({ id: "topic-" + t.topic_id, label: "Abrir tópico · " + t.topic_description, kind: "Tópico", run: () => onAction({ type: "drill-topic", topic: t }) });
  });

  const filtered = q.trim()
    ? actions.filter((a) => (a.label + " " + a.kind).toLowerCase().includes(q.toLowerCase())).slice(0, 14)
    : actions.slice(0, 12);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(10, 14, 18, 0.45)",
      display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "12vh", zIndex: 1000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 600, background: "var(--paper)", border: "1px solid var(--ink)",
        boxShadow: "0 20px 80px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--rule)", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.14em", textTransform: "uppercase" }}>⌘K</span>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Buscar comando, tópico, megatópico…"
                 style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)" }}
                 onKeyDown={(e) => {
                   if (e.key === "Escape") onClose();
                   if (e.key === "Enter" && filtered[0]) { filtered[0].run(); onClose(); }
                 }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)" }}>esc</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding: 20, fontStyle: "italic", color: "var(--ink-4)", fontFamily: "var(--serif)" }}>nenhum comando encontrado</div>
          )}
          {filtered.map((a) => (
            <div key={a.id} onClick={() => { a.run(); onClose(); }}
                 style={{ padding: "10px 14px", borderBottom: "1px solid var(--rule)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}
                 onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
                 onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontFamily: "var(--sans)", fontSize: 13, color: "var(--ink)" }}>{a.label}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{a.kind}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 14px", borderTop: "1px solid var(--rule)", fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-4)", display: "flex", justifyContent: "space-between" }}>
          <span>↵ executar · esc fechar</span>
          <span>{filtered.length} comandos</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Toast ----------------
function Toast({ msg, onDone }) {
  useEffectPX(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "var(--ink)", color: "var(--paper)", padding: "10px 18px",
      fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.04em",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)", zIndex: 1100,
    }}>{msg}</div>
  );
}

// ---------------- Hint chip (top-right launch hint) ----------------
function KeyHint({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
      background: "transparent", border: "1px solid var(--rule-strong)", color: "var(--ink-3)",
      padding: "4px 8px", cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; e.currentTarget.style.color = "var(--ink)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--rule-strong)"; e.currentTarget.style.color = "var(--ink-3)"; }}>
      <span>⌘K</span>
      <span style={{ opacity: 0.6 }}>{label}</span>
    </button>
  );
}

Object.assign(window, { CommandPalette, Toast, KeyHint });
