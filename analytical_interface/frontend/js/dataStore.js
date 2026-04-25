const DATA_BASE = "./data";
let cache = null;

async function readJson(filename) {
  const response = await fetch(`${DATA_BASE}/${filename}`);
  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao carregar ${filename}`);
  }
  return response.json();
}

export async function loadData() {
  if (cache) return cache;
  const [articles, topics, megatopics, meta] = await Promise.all([
    readJson("articles.json"),
    readJson("topics.json"),
    readJson("megatopics.json"),
    readJson("meta.json"),
  ]);
  cache = { articles, topics, megatopics, meta };
  return cache;
}

export function resetCache() {
  cache = null;
}
