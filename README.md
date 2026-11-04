# A Structured Dataset on Global Research of Violence Against Women

Data and code of a scoping review of the global empirical literature on violence against women: 580 studies published between 2012 and 2025 (search window 2011 to 2025), with territories studied, author affiliations and 32 topics in seven megatopics.

- Interactive platform: https://vcm.cienciaberta.com
- Archived dataset: [Zenodo DOI of version 2.0.0, to be added after deposit]

## Contents

| Folder | Content |
| :--- | :--- |
| `analytical_interface/` | Interactive platform and the data files it serves (`data/`) |
| `docs/DATA_DICTIONARY.md` | Definition of every field |
| `ml_classification/` | Supervised screening: final pipeline and the classifier comparison notebook |
| `topic_modeling/` | NMF pipeline and the LDA and NMF comparison |
| `analysis/` | Statistics reported in the manuscript, and the semantic map and figures notebook |

## Reproducing the results

The statistics run on the public dataset alone:

```bash
pip install -r analysis/requirements.txt
python analysis/manuscript_statistics.py analytical_interface/data/articles_dataset.csv
```

`analysis/expected_output.txt` holds the output of this command.

## What cannot be rerun from this repository

Screening, topic modelling and the semantic map need the full text of the articles, which is under publishers' copyright and is not redistributed. The scripts and notebooks that depend on it are provided to document the configuration used, and they point to the authors' working files. `topic_id` cannot be recomputed, because the input table of the original NMF run is no longer available; see the limitations in the data dictionary.

## Running the platform locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000/.

## Licence

Code: MIT (`LICENSE`). Data: Creative Commons Attribution 4.0.
