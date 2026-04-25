from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path

import pandas as pd


SCHEMA = {
    "articles": {
        "required_columns": {
            "article_id",
            "year",
            "study_country",
            "study_continent",
            "researcher_country",
            "researcher_continent",
            "topic_id",
            "megatopic_id",
            "journal",
            "is_multi_country",
            "research_flow",
            "latitude",
            "longitude",
        },
        "critical_not_null": {"article_id", "year", "topic_id", "megatopic_id"},
    },
    "topics": {
        "required_columns": {"topic_id", "megatopic_id", "topic_description"},
        "critical_not_null": {"topic_id", "megatopic_id"},
    },
    "megatopics": {
        "required_columns": {"megatopic_id", "megatopic_description"},
        "critical_not_null": {"megatopic_id"},
    },
}


def _sanitize_nan(value):
    if pd.isna(value):
        return None
    return value


def _md5(path: Path) -> str:
    hasher = hashlib.md5()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def _validate_schema(name: str, frame: pd.DataFrame) -> None:
    required = SCHEMA[name]["required_columns"]
    missing = sorted(required - set(frame.columns))
    if missing:
        raise ValueError(f"[{name}] colunas obrigatorias ausentes: {missing}")

    for col in SCHEMA[name]["critical_not_null"]:
        if frame[col].isna().any():
            count = int(frame[col].isna().sum())
            raise ValueError(f"[{name}] coluna critica '{col}' com {count} nulos")


def _validate_cross(articles: pd.DataFrame, topics: pd.DataFrame, megatopics: pd.DataFrame) -> None:
    topic_ids_articles = set(pd.to_numeric(articles["topic_id"], errors="coerce").dropna().astype(int))
    topic_ids_topics = set(pd.to_numeric(topics["topic_id"], errors="coerce").dropna().astype(int))
    if not topic_ids_articles.issubset(topic_ids_topics):
        diff = sorted(topic_ids_articles - topic_ids_topics)
        raise ValueError(f"topic_id de artigos ausente em topics: {diff[:10]}")

    mega_articles = set(pd.to_numeric(articles["megatopic_id"], errors="coerce").dropna().astype(int))
    mega_topics = set(pd.to_numeric(topics["megatopic_id"], errors="coerce").dropna().astype(int))
    mega_master = set(pd.to_numeric(megatopics["megatopic_id"], errors="coerce").dropna().astype(int))
    if not mega_articles.issubset(mega_master):
        diff = sorted(mega_articles - mega_master)
        raise ValueError(f"megatopic_id de artigos ausente em megatopics: {diff[:10]}")
    if not mega_topics.issubset(mega_master):
        diff = sorted(mega_topics - mega_master)
        raise ValueError(f"megatopic_id de topics ausente em megatopics: {diff[:10]}")


def _reconcile_article_megatopic_from_topic(articles: pd.DataFrame, topics: pd.DataFrame) -> pd.DataFrame:
    mapping = (
        topics[["topic_id", "megatopic_id"]]
        .dropna()
        .drop_duplicates(subset=["topic_id"])
        .set_index("topic_id")["megatopic_id"]
        .to_dict()
    )
    expected = set(pd.to_numeric(topics["megatopic_id"], errors="coerce").dropna().astype(int))
    frame = articles.copy()
    frame["topic_id"] = pd.to_numeric(frame["topic_id"], errors="coerce")
    frame["megatopic_id"] = pd.to_numeric(frame["megatopic_id"], errors="coerce")
    invalid_mask = ~frame["megatopic_id"].isin(expected)
    if invalid_mask.any():
        frame.loc[invalid_mask, "megatopic_id"] = frame.loc[invalid_mask, "topic_id"].map(mapping)
    return frame


def _country_income_group(country: str | None) -> str | None:
    if not country:
        return None
    high_income = {
        "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
        "Japan", "Netherlands", "Sweden", "Norway", "Denmark", "Switzerland",
    }
    upper_middle = {"Brazil", "China", "Mexico", "South Africa", "Turkey", "Argentina"}
    lower_middle = {"India", "Pakistan", "Nigeria", "Philippines", "Egypt", "Morocco"}
    c = str(country).strip()
    if c in high_income:
        return "High income"
    if c in upper_middle:
        return "Upper middle income"
    if c in lower_middle:
        return "Lower middle income"
    return "Unknown"


def _is_global_north(country: str | None) -> bool | None:
    if not country:
        return None
    north = {
        "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
        "Japan", "Netherlands", "Sweden", "Norway", "Denmark", "Switzerland",
        "Spain", "Italy", "Belgium", "Austria", "Finland", "Ireland", "Portugal",
    }
    c = str(country).strip()
    if c in north:
        return True
    return False


def main() -> None:
    """Le `dataset/*.csv`, grava JSON em `frontend/data/` e copia `meta.json` para `docs/`."""
    root = Path(__file__).resolve().parents[1]
    dataset_dir = root / "dataset"
    out_dir = root / "frontend" / "data"
    docs_dir = root / "docs"
    out_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    articles_path = dataset_dir / "articles_dataset.csv"
    topics_path = dataset_dir / "topics_dataset.csv"
    megatopics_path = dataset_dir / "megatopics_dataset.csv"

    articles = pd.read_csv(articles_path, sep=";", encoding="utf-8-sig")
    topics = pd.read_csv(topics_path, sep=";", encoding="utf-8-sig")
    megatopics = pd.read_csv(megatopics_path, sep=";", encoding="utf-8-sig")

    _validate_schema("articles", articles)
    _validate_schema("topics", topics)
    _validate_schema("megatopics", megatopics)
    articles = _reconcile_article_megatopic_from_topic(articles, topics)
    _validate_cross(articles, topics, megatopics)

    article_cols = [
        "article_id",
        "year",
        "study_country",
        "study_continent",
        "researcher_country",
        "researcher_continent",
        "topic_id",
        "megatopic_id",
        "journal",
        "is_multi_country",
        "research_flow",
        "latitude",
        "longitude",
    ]
    articles = articles[article_cols].copy()

    for col in ["article_id", "year", "topic_id", "megatopic_id", "is_multi_country"]:
        articles[col] = pd.to_numeric(articles[col], errors="coerce")

    for col in ["latitude", "longitude"]:
        articles[col] = pd.to_numeric(articles[col], errors="coerce")

    articles["study_income_group"] = articles["study_country"].map(_country_income_group)
    articles["study_global_north"] = articles["study_country"].map(_is_global_north)
    articles["researcher_income_group"] = articles["researcher_country"].map(_country_income_group)
    articles["researcher_global_north"] = articles["researcher_country"].map(_is_global_north)

    articles_records = []
    for record in articles.to_dict(orient="records"):
        clean = {key: _sanitize_nan(value) for key, value in record.items()}
        articles_records.append(clean)

    topics_records = []
    for record in topics.to_dict(orient="records"):
        clean = {key: _sanitize_nan(value) for key, value in record.items()}
        topics_records.append(clean)

    megatopics_records = []
    for record in megatopics.to_dict(orient="records"):
        clean = {key: _sanitize_nan(value) for key, value in record.items()}
        megatopics_records.append(clean)

    meta = {
        "version": "v1.1.0",
        "date": str(date.today()),
        "source_hash": {
            "articles_dataset_csv_md5": _md5(articles_path),
            "topics_dataset_csv_md5": _md5(topics_path),
            "megatopics_dataset_csv_md5": _md5(megatopics_path),
        },
        "articles_rows": len(articles_records),
        "topics_rows": len(topics_records),
        "megatopics_rows": len(megatopics_records),
        "n_articles": len(articles_records),
        "n_topics": len(topics_records),
        "n_megatopics": len(megatopics_records),
    }

    meta_text = json.dumps(meta, ensure_ascii=False)

    (out_dir / "articles.json").write_text(
        json.dumps(articles_records, ensure_ascii=False), encoding="utf-8"
    )
    (out_dir / "topics.json").write_text(
        json.dumps(topics_records, ensure_ascii=False), encoding="utf-8"
    )
    (out_dir / "megatopics.json").write_text(
        json.dumps(megatopics_records, ensure_ascii=False), encoding="utf-8"
    )
    (out_dir / "meta.json").write_text(meta_text, encoding="utf-8")
    (docs_dir / "meta.json").write_text(meta_text, encoding="utf-8")

    print(f"Arquivos exportados em: {out_dir}")
    print(f"meta.json tambem em: {docs_dir / 'meta.json'}")


if __name__ == "__main__":
    main()
