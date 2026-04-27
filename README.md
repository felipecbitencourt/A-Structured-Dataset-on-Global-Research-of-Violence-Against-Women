# A Structured Dataset on Global Research of Violence Against Women

This repository is organized into three production modules:

- `topic_modeling`: NMF-based topic modeling pipeline with text preprocessing, TF-IDF vectorization, coherence search, and topic exports.
- `ml_classification`: supervised article-screening pipeline with text preprocessing, vectorization, Logistic Regression, and incremental self-training.
- `analytical_interface`: static HTML/JavaScript app for interactive exploration at micro, meso, and macro levels, including filtering, aggregation, and visualization.

## Repository structure

```text
.
|- index.html
|- README.md
|- .gitignore
|- topic_modeling/
|  |- README.md
|  |- requirements.txt
|  |- code/
|  |  \- nmf.py
|  \- docs/
|- ml_classification/
|  |- README.md
|  |- requirements.txt
|  |- code/
|  |  \- supervised_screening_pipeline.py
|  \- docs/
\- analytical_interface/
   |- index.html
   |- styles.css
   |- data/
   \- js/
```

## GitHub Pages

- Landing page entrypoint: `index.html` (repository root).
- Interactive interface entrypoint: `index.html` (root, loading assets from `analytical_interface/`).

## Quick local usage

Serve the repository root with a local static server:

```powershell
python -m http.server 8000
```

Then access:

- `http://localhost:8000/` (project landing page)
- `http://localhost:8000/` (interactive interface)

## Module entrypoints

- Topic modeling docs: `topic_modeling/README.md`
- Topic modeling script: `topic_modeling/code/nmf.py`
- ML classification docs: `ml_classification/README.md`
- ML classification script: `ml_classification/code/supervised_screening_pipeline.py`
- Analytical interface entrypoint: `index.html`
