"""
Supervised screening pipeline aligned with the final notebook workflow.

Final configuration extracted from notebook:
- model: Logistic Regression (solver=liblinear, C=50, random_state=42)
- vectorization: TF-IDF with ngrams (1, 2)
- incremental loop: confidence-based pseudo-labeling with threshold 0.7
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable

import nltk
import numpy as np
import pandas as pd
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize
from PyPDF2 import PdfReader
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer


def ensure_nltk_resources() -> None:
    """Ensure NLTK resources required by the final notebook are available."""
    for resource, path in [
        ("punkt", "tokenizers/punkt"),
        ("stopwords", "corpora/stopwords"),
        ("wordnet", "corpora/wordnet"),
    ]:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(resource, quiet=True)


def extract_text_from_pdf(pdf_path: Path) -> str | None:
    """Extract raw text from a PDF file."""
    try:
        with pdf_path.open("rb") as f:
            reader = PdfReader(f)
            content = []
            for page in reader.pages:
                content.append(page.extract_text() or "")
        text = "\n".join(content).strip()
        return text or None
    except Exception as exc:  # pragma: no cover
        print(f"Warning: failed to parse {pdf_path}: {exc}")
        return None


def iter_pdf_paths(folder: Path) -> Iterable[Path]:
    """Iterate PDF files sorted by name."""
    if not folder.exists():
        raise FileNotFoundError(f"Folder not found: {folder}")
    for item in sorted(folder.iterdir()):
        if item.is_file() and item.suffix.lower() == ".pdf":
            yield item


def preprocess_text(text: str) -> str:
    """Notebook-compatible preprocessing: lowercase, clean, tokenize, stop words, lemmatize."""
    clean = text.lower()
    clean = re.sub(r"[^a-z\s]", "", clean)
    tokens = word_tokenize(clean)
    stop_words = set(stopwords.words("english"))
    filtered = [word for word in tokens if word not in stop_words]
    lemmatizer = WordNetLemmatizer()
    lemmas = [lemmatizer.lemmatize(word) for word in filtered]
    return " ".join(lemmas)


def load_labeled_from_pdfs(approved_dir: Path, rejected_dir: Path) -> tuple[pd.Series, pd.Series]:
    """Load and preprocess PDFs from approved/rejected folders."""
    records: list[dict[str, str]] = []

    for pdf_path in iter_pdf_paths(approved_dir):
        text = extract_text_from_pdf(pdf_path)
        if text:
            records.append({"texto_processado": preprocess_text(text), "label": "Aprovado"})

    for pdf_path in iter_pdf_paths(rejected_dir):
        text = extract_text_from_pdf(pdf_path)
        if text:
            records.append({"texto_processado": preprocess_text(text), "label": "Recusado"})

    if not records:
        raise RuntimeError("No labeled documents were loaded from PDF folders.")

    df = pd.DataFrame(records)
    return df["texto_processado"], df["label"]


def build_final_pipeline() -> Pipeline:
    """Build the final LR pipeline from the notebook best parameters."""
    return Pipeline(
        [
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("lr", LogisticRegression(C=50, random_state=42, solver="liblinear")),
        ]
    )


def run_incremental_self_training(
    pipeline: Pipeline,
    x_train: pd.Series,
    y_train: pd.Series,
    x_test: pd.Series,
    y_test: pd.Series,
    df_unlabeled: pd.DataFrame,
    confidence_threshold: float,
    max_iterations: int,
) -> tuple[pd.DataFrame, list[dict[str, int]]]:
    """
    Run the same confidence-based incremental loop used in the notebook.

    At each iteration:
    1) fit current model on the expanded train set,
    2) predict probabilities on unlabeled pool,
    3) keep only high-confidence samples,
    4) append pseudo-labeled samples to train data.
    """
    x_train_incremental = x_train.copy()
    y_train_incremental = y_train.copy()
    unlabeled = df_unlabeled.copy()
    history: list[dict[str, int]] = []

    iteration = 0
    while not unlabeled.empty and iteration < max_iterations:
        iteration += 1
        print(f"\n--- Iteration {iteration}: {len(unlabeled)} articles remaining ---")

        pipeline.fit(x_train_incremental, y_train_incremental)
        probabilities = pipeline.predict_proba(unlabeled["texto_processado"])
        unlabeled["prob_max"] = np.max(probabilities, axis=1)
        unlabeled["pred_classe"] = pipeline.predict(unlabeled["texto_processado"])

        high_conf = unlabeled[unlabeled["prob_max"] >= confidence_threshold]
        if high_conf.empty:
            print("No high-confidence samples found. Incremental loop finished.")
            break

        x_train_incremental = pd.concat([x_train_incremental, high_conf["texto_processado"]], ignore_index=True)
        y_train_incremental = pd.concat([y_train_incremental, high_conf["pred_classe"]], ignore_index=True)

        print(f"Added {len(high_conf)} high-confidence pseudo-labeled samples.")
        y_pred_test = pipeline.predict(x_test)
        print("Classification report on test set:")
        print(classification_report(y_test, y_pred_test))

        history.append({"iteration": iteration, "added": int(len(high_conf)), "remaining": int(len(unlabeled) - len(high_conf))})
        unlabeled = unlabeled.drop(high_conf.index)

    return unlabeled, history


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Final LR + incremental self-training pipeline.")
    parser.add_argument("--approved-dir", type=Path, required=True, help="Folder with approved PDFs.")
    parser.add_argument("--rejected-dir", type=Path, required=True, help="Folder with rejected PDFs.")
    parser.add_argument(
        "--review-csv",
        type=Path,
        default=None,
        help="CSV with unlabeled/review pool. Must contain 'texto_processado'.",
    )
    parser.add_argument("--test-size", type=float, default=0.2, help="Holdout test fraction.")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed.")
    parser.add_argument(
        "--self-training-threshold",
        type=float,
        default=0.7,
        help="Confidence threshold used in incremental loop.",
    )
    parser.add_argument("--max-iterations", type=int, default=50, help="Maximum incremental iterations.")
    parser.add_argument(
        "--conflicts-output",
        type=Path,
        default=None,
        help="Optional path to save final unresolved review samples.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    ensure_nltk_resources()

    x, y = load_labeled_from_pdfs(args.approved_dir, args.rejected_dir)
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=args.test_size, random_state=args.random_state, stratify=y
    )

    pipeline = build_final_pipeline()
    pipeline.fit(x_train, y_train)
    print("Baseline Logistic Regression report:")
    print(classification_report(y_test, pipeline.predict(x_test)))

    if args.review_csv is None:
        print("No review CSV provided. Incremental self-training skipped.")
        return

    df_review = pd.read_csv(args.review_csv)
    if "texto_processado" not in df_review.columns:
        raise ValueError("The review CSV must include a 'texto_processado' column.")

    remaining, history = run_incremental_self_training(
        pipeline=pipeline,
        x_train=x_train,
        y_train=y_train,
        x_test=x_test,
        y_test=y_test,
        df_unlabeled=df_review,
        confidence_threshold=args.self_training_threshold,
        max_iterations=args.max_iterations,
    )

    print("\nIncremental history:")
    for row in history:
        print(row)

    if args.conflicts_output is not None:
        remaining.to_csv(args.conflicts_output, index=False)
        print(f"Remaining unresolved samples saved to: {args.conflicts_output}")


if __name__ == "__main__":
    main()
