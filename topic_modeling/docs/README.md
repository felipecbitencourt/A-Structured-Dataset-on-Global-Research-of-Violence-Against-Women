# Module documentation

This document records the methodological configuration used in the
`topic_modeling` module.

## Final pipeline configuration

### Text preprocessing

- lowercase normalization;
- regex cleanup (`[^a-z\\s]`);
- whitespace normalization;
- tokenization by whitespace split after cleanup.

### Vectorization

- `TfidfVectorizer`
- `max_df=0.9`
- `min_df=12`
- `max_features=5000`
- `ngram_range=(1, 2)`
- `stop_words='english'`

### NMF model

- `n_components=32` (final run, configurable via CLI);
- `init='nndsvda'`;
- `solver='mu'`;
- `beta_loss='frobenius'`;
- `max_iter=500`;
- `random_state=42`.

## Coherence search strategy

The script computes topic coherence (`c_v`) over a configurable
range of topic counts:

- default search range: `k in [30, 40)`;
- per-`k` run stores:
  - coherence score (`c_v`);
  - reconstruction error;
  - elapsed time;
  - extracted top words.

The best `k` in the scanned range is selected by maximum `c_v`.

## Inputs and outputs

### Required input

- CSV file with a cleaned text column (default: `cleaned`).

### Generated outputs

- `coherence_results_<timestamp>.csv`;
- `coherence_curve.png`;
- `nmf_topic_keywords.csv`;
- `nmf_topic_documents.csv`.
