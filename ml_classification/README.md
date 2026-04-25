# Machine Learning-Assisted Classification

This module contains the supervised article-screening pipeline.

## Scope

- Text preprocessing for screening.
- Vectorization for supervised classification.
- Logistic Regression training.
- Incremental learning (self-training).

## Structure

- `code/`: pipeline scripts and configurations.
- `docs/`: methodological notes and reproducibility support.
- `requirements.txt`: module dependencies.

## Implementation extracted from notebook

Main script:

- `code/supervised_screening_pipeline.py`

Implemented stages:

- text extraction from approved/rejected PDFs;
- text preprocessing (tokenization, stop words, and lemmatization);
- TF-IDF vectorization with n-grams `(1, 2)`;
- Logistic Regression training and evaluation (`C=50`, `solver=liblinear`);
- optional incremental self-training with confidence threshold (`0.7` by default).

Execution example:

```powershell
pip install -r ml_classification/requirements.txt
python ml_classification/code/supervised_screening_pipeline.py `
  --approved-dir "C:\path\approved_articles" `
  --rejected-dir "C:\path\rejected_articles" `
  --review-csv "C:\path\articles_for_review.csv" `
  --conflicts-output "C:\path\final_incremental_conflicts_table.csv"
```
