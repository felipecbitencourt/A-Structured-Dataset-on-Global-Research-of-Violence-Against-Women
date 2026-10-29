"""Build the files served by the analytical interface.

    python build_data.py <articles_dataset.csv> <topics_reference.csv> [--version v2.0.0] [--date YYYY-MM-DD]

- articles_dataset.csv is copied byte for byte (its MD5 goes into meta.json).
- topics/megatopics keep only what the topic model defines (ids, names, coherence,
  keywords). Counts, countries, flows and growth are computed in the browser from the
  articles, so they can never drift from the article table.
"""
import argparse
import hashlib
import json
import shutil
from datetime import date
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
TOPIC_COLS = ["topic_id", "topic_description", "megatopic_id", "megatopic_description", "coherence_cv", "top_keywords"]


def md5(path):
    return hashlib.md5(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("articles")
    ap.add_argument("topics_reference")
    ap.add_argument("--version", default="v2.0.0")
    ap.add_argument("--date", default=date.today().isoformat())
    args = ap.parse_args()

    src = Path(args.articles)
    arts = pd.read_csv(src, encoding="utf-8-sig")
    ref = pd.read_csv(args.topics_reference, sep=None, engine="python", encoding="utf-8-sig")

    # Every article topic must exist in the reference, with the same megatopic.
    mega_of = dict(zip(ref.topic_id, ref.megatopic_id))
    missing = set(arts.topic_id) - set(mega_of)
    assert not missing, f"topics missing from the reference: {sorted(missing)}"
    wrong = arts[arts.topic_id.map(mega_of) != arts.megatopic_id]
    assert wrong.empty, f"megatopic_id disagrees with the topic table: {wrong.article_id.tolist()}"
    assert arts.article_id.is_unique, "duplicate article_id"

    out_articles = HERE / "articles_dataset.csv"
    shutil.copyfile(src, out_articles)

    topics = ref[TOPIC_COLS].sort_values("topic_id")
    topics.to_csv(HERE / "topics_dataset.csv", index=False, encoding="utf-8")

    megas = (topics.groupby(["megatopic_id", "megatopic_description"])["topic_id"]
             .apply(lambda s: ";".join(str(t) for t in sorted(s)))
             .reset_index(name="topic_ids")
             .sort_values("megatopic_id"))
    megas.to_csv(HERE / "megatopics_dataset.csv", index=False, encoding="utf-8")

    meta = {
        "version": args.version,
        "date": args.date,
        "source_hash": {
            "articles_dataset_csv_md5": md5(out_articles),
            "topics_dataset_csv_md5": md5(HERE / "topics_dataset.csv"),
            "megatopics_dataset_csv_md5": md5(HERE / "megatopics_dataset.csv"),
        },
        "n_articles": int(len(arts)),
        "n_columns": int(arts.shape[1]),
        "n_topics": int(len(topics)),
        "n_megatopics": int(len(megas)),
        "year_min": int(arts.year.min()),
        "year_max": int(arts.year.max()),
    }
    (HERE / "meta.json").write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
