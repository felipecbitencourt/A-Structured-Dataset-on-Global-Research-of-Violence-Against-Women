# Module documentation

This document records the final methodological configuration used in the
`ml_classification` pipeline.

## Final pipeline configuration

### Text preprocessing

- lowercase normalization;
- regex cleanup (`[^a-z\\s]`);
- tokenization with NLTK;
- English stop-word removal;
- lemmatization with `WordNetLemmatizer`.

### Vectorization

- `TfidfVectorizer`
- `ngram_range=(1, 2)`

### Logistic Regression

- `solver='liblinear'`
- `C=50`
- `random_state=42`

## Data split strategy

- holdout split with `test_size=0.2`;
- stratified split by class labels;
- `random_state=42`.

## Incremental self-training

The incremental loop follows a confidence-based pseudo-labeling strategy:

1. Train the pipeline on the current labeled set.
2. Predict class probabilities on the review/unlabeled pool.
3. Select samples with `prob_max >= threshold`.
4. Add selected samples and pseudo-labels to the training set.
5. Retrain and repeat until no high-confidence samples remain or the maximum number of iterations is reached.

Default values in script:

- confidence threshold: `0.7`
- max iterations: `50`

## Inputs and outputs

### Required inputs

- approved PDF folder;
- rejected PDF folder.

### Optional inputs

- review CSV with column `texto_processado`.

### Outputs

- console evaluation reports (`classification_report`);
- optional CSV with unresolved samples (`--conflicts-output`).