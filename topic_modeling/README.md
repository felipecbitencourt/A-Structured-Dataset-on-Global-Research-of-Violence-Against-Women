# Topic Modeling (NMF)

This module contains the topic modeling pipeline based on
Non-Negative Matrix Factorization (NMF).

## Scope

- text preprocessing for topic modeling;
- TF-IDF vectorization;
- NMF training and topic extraction;
- coherence search across candidate values of `k`;
- final topic-level exports for analysis.

## Structure

- `code/nmf.py`: main end-to-end NMF pipeline;
- `requirements.txt`: module dependencies;
- `docs/README.md`: methodological documentation.

## Final implementation used in this repository

Main script:

- `code/nmf.py`

Core stages implemented:

- text cleanup and token preparation;
- TF-IDF vectorization with:
  - `max_df=0.9`
  - `min_df=12`
  - `max_features=5000`
  - `ngram_range=(1, 2)`
  - English stop words;
- coherence search over a configurable range (`--k-min`, `--k-max`);
- final NMF model with:
  - `init='nndsvda'`
  - `solver='mu'`
  - `beta_loss='frobenius'`
  - `max_iter=500`
  - `random_state=42`.

## Execution example

```powershell
pip install -r topic_modeling/requirements.txt
python topic_modeling/code/nmf.py `
  --input-csv "C:\path\matched2_articles_info_com_texto_limpo.csv" `
  --text-column "cleaned" `
  --output-dir "C:\path\topic_modeling_outputs" `
  --k-min 30 `
  --k-max 40 `
  --final-k 32
```
