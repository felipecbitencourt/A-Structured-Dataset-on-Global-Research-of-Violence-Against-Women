async function loadMeta() {
  const response = await fetch("./data/meta.json");
  if (!response.ok) {
    throw new Error(`Falha ao ler o arquivo meta.json (${response.status})`);
  }
  return response.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "-";
}

function hashPreview(sourceHash) {
  if (!sourceHash) return "-";
  const first = Object.values(sourceHash)[0];
  if (!first) return "-";
  const str = String(first);
  return `${str.slice(0, 8)}...${str.slice(-8)}`;
}

async function boot() {
  const meta = await loadMeta();
  setText("kpiArticles", meta.n_articles ?? meta.articles_rows);
  setText("kpiTopics", meta.n_topics ?? meta.topics_rows);
  setText("kpiMegatopics", meta.n_megatopics ?? meta.megatopics_rows);
  setText("kpiVersion", meta.version);
  setText("releaseDate", meta.date);
  setText("hashPreview", hashPreview(meta.source_hash));
}

boot().catch((err) => {
  console.error(err);
  setText("releaseDate", "indisponivel");
});
