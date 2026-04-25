"""
NMF topic modeling pipeline.

This script centralizes:
1) text preprocessing,
2) TF-IDF vectorization,
3) coherence search across k,
4) final NMF training and topic export.
"""

from __future__ import annotations

import argparse
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from gensim.corpora.dictionary import Dictionary
from gensim.models.coherencemodel import CoherenceModel
from joblib import Parallel, delayed
from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer


@dataclass
class NmfConfig:
    max_df: float = 0.9
    min_df: int = 12
    max_features: int = 5000
    ngram_range: tuple[int, int] = (1, 2)
    stop_words: str | list[str] = "english"
    max_iter: int = 500
    init: str = "nndsvda"
    solver: str = "mu"
    beta_loss: str = "frobenius"
    random_state: int = 42
    top_words_per_topic: int = 15


def preprocess_text(text: str) -> str:
    """Apply lightweight text cleanup before modeling."""
    clean = str(text).lower()
    clean = re.sub(r"[^a-z\s]", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean


def compute_coherence_for_k(
    n_topics: int,
    tfidf_matrix,
    feature_names: np.ndarray,
    tokenized_texts: list[list[str]],
    dictionary: Dictionary,
    cfg: NmfConfig,
) -> dict:
    start = time.time()
    try:
        nmf_model = NMF(
            n_components=n_topics,
            random_state=cfg.random_state,
            max_iter=cfg.max_iter,
            init=cfg.init,
            solver=cfg.solver,
            beta_loss=cfg.beta_loss,
        )
        _w = nmf_model.fit_transform(tfidf_matrix)

        topics: list[list[str]] = []
        for topic in nmf_model.components_:
            idx = topic.argsort()[: -cfg.top_words_per_topic - 1 : -1]
            topics.append([feature_names[i] for i in idx])

        coherence_model = CoherenceModel(
            topics=topics,
            texts=tokenized_texts,
            dictionary=dictionary,
            coherence="c_v",
            processes=1,
        )
        coherence = float(coherence_model.get_coherence())
        elapsed = time.time() - start
        print(f"k={n_topics:02d} | c_v={coherence:.4f} | time={elapsed:.1f}s")

        return {
            "n_topics": n_topics,
            "coherence": coherence,
            "topics": topics,
            "elapsed_time": elapsed,
            "reconstruction_error": float(nmf_model.reconstruction_err_),
            "status": "success",
        }
    except Exception as exc:
        return {
            "n_topics": n_topics,
            "coherence": 0.0,
            "topics": None,
            "elapsed_time": time.time() - start,
            "reconstruction_error": np.nan,
            "status": f"error: {exc}",
        }


def find_title_column(df: pd.DataFrame) -> str | None:
    for col in ("Title", "title_metadata", "title_file", "title"):
        if col in df.columns:
            return col
    return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run NMF topic modeling pipeline.")
    parser.add_argument("--input-csv", required=True, help="Path to input CSV.")
    parser.add_argument("--text-column", default="cleaned", help="Text column name.")
    parser.add_argument("--output-dir", default="topic_modeling_outputs", help="Output directory.")
    parser.add_argument("--k-min", type=int, default=30, help="Minimum k for coherence search (inclusive).")
    parser.add_argument("--k-max", type=int, default=40, help="Maximum k for coherence search (exclusive).")
    parser.add_argument("--final-k", type=int, default=32, help="Final number of topics for NMF.")
    parser.add_argument("--n-jobs", type=int, default=-1, help="Parallel workers.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = NmfConfig()
    os.makedirs(args.output_dir, exist_ok=True)

    print("=" * 72)
    print("Loading input data")
    print("=" * 72)

    df = pd.read_csv(args.input_csv)
    if args.text_column not in df.columns:
        raise ValueError(f"Column '{args.text_column}' not found in input CSV.")

    df = df.dropna(subset=[args.text_column]).copy()
    df[args.text_column] = df[args.text_column].astype(str).map(preprocess_text)
    df = df[df[args.text_column].str.len() > 0].copy()
    if df.empty:
        raise RuntimeError("No valid documents after preprocessing.")

    print(f"Documents: {len(df)}")
    print(f"Text column: {args.text_column}")

    tokenized_texts = [txt.split() for txt in df[args.text_column]]
    dictionary = Dictionary(tokenized_texts)
    dictionary.filter_extremes(no_below=3, no_above=0.9, keep_n=None)

    vectorizer = TfidfVectorizer(
        max_df=cfg.max_df,
        min_df=cfg.min_df,
        stop_words=cfg.stop_words,
        ngram_range=cfg.ngram_range,
        max_features=cfg.max_features,
    )
    tfidf_matrix = vectorizer.fit_transform(df[args.text_column])
    feature_names = vectorizer.get_feature_names_out()

    sparsity = (1 - tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1])) * 100
    print(f"TF-IDF shape: {tfidf_matrix.shape}")
    print(f"Vocabulary size: {len(feature_names)}")
    print(f"Sparsity: {sparsity:.2f}%")

    topic_range = list(range(args.k_min, args.k_max))
    print(f"\nCoherence search in range [{args.k_min}, {args.k_max})")

    try:
        results = Parallel(n_jobs=args.n_jobs, backend="threading", verbose=0)(
            delayed(compute_coherence_for_k)(k, tfidf_matrix, feature_names, tokenized_texts, dictionary, cfg)
            for k in topic_range
        )
    except Exception:
        results = [
            compute_coherence_for_k(k, tfidf_matrix, feature_names, tokenized_texts, dictionary, cfg)
            for k in topic_range
        ]

    results_df = pd.DataFrame(results)
    valid_df = results_df[results_df["status"] == "success"].copy()
    if valid_df.empty:
        raise RuntimeError("No successful coherence runs.")

    best_idx = valid_df["coherence"].idxmax()
    best_k = int(valid_df.loc[best_idx, "n_topics"])
    best_c_v = float(valid_df.loc[best_idx, "coherence"])

    print("\nCoherence summary")
    print(f"Min c_v: {valid_df['coherence'].min():.4f}")
    print(f"Max c_v: {valid_df['coherence'].max():.4f}")
    print(f"Mean c_v: {valid_df['coherence'].mean():.4f}")
    print(f"Best k in search range: {best_k} (c_v={best_c_v:.4f})")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    coherence_csv = os.path.join(args.output_dir, f"coherence_results_{timestamp}.csv")
    valid_df[["n_topics", "coherence", "reconstruction_error", "elapsed_time", "status"]].to_csv(
        coherence_csv, index=False
    )

    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(valid_df["n_topics"], valid_df["coherence"], marker="o", linewidth=2)
    ax.axvline(best_k, color="red", linestyle="--", alpha=0.8, label=f"best k={best_k}")
    ax.set_xlabel("Number of topics")
    ax.set_ylabel("Coherence (c_v)")
    ax.set_title("Coherence by number of topics")
    ax.legend()
    fig.tight_layout()
    coherence_png = os.path.join(args.output_dir, "coherence_curve.png")
    fig.savefig(coherence_png, dpi=300, bbox_inches="tight")
    plt.close(fig)

    print("\nTraining final NMF model")
    nmf_model = NMF(
        n_components=args.final_k,
        random_state=cfg.random_state,
        max_iter=cfg.max_iter,
        init=cfg.init,
        solver=cfg.solver,
        beta_loss=cfg.beta_loss,
    )
    w = nmf_model.fit_transform(tfidf_matrix)
    h = nmf_model.components_
    reconstruction_error = float(nmf_model.reconstruction_err_)
    print(f"Final k: {args.final_k}")
    print(f"Final reconstruction error: {reconstruction_error:.4f}")

    topic_rows: list[dict] = []
    for topic_id, topic in enumerate(h, start=1):
        idx = topic.argsort()[: -cfg.top_words_per_topic - 1 : -1]
        words = [feature_names[i] for i in idx]
        topic_rows.append({"topic": topic_id, "top_words": ", ".join(words)})
    keywords_csv = os.path.join(args.output_dir, "nmf_topic_keywords.csv")
    pd.DataFrame(topic_rows).to_csv(keywords_csv, index=False)

    dominant_topic = np.argmax(w, axis=1) + 1
    title_col = find_title_column(df)
    docs_df = pd.DataFrame(
        {
            "topic": dominant_topic,
            "title": df[title_col] if title_col else "",
            "text_preview": df[args.text_column].str.slice(0, 220),
        }
    )
    docs_csv = os.path.join(args.output_dir, "nmf_topic_documents.csv")
    docs_df.to_csv(docs_csv, index=False)

    print("\nGenerated files")
    print(f"- {coherence_csv}")
    print(f"- {coherence_png}")
    print(f"- {keywords_csv}")
    print(f"- {docs_csv}")


if __name__ == "__main__":
    main()
