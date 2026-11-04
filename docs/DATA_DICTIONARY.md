# Data dictionary

`articles_dataset.csv`, version 2.0.0: 580 records, 54 fields. Coverage is the number of records with a value.

## Identification and bibliographic reference

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `article_id` | 580 | Record identifier. Not sequential: identifiers of removed records are not reused. |
| `title` | 580 | Article title. |
| `doi` | 566 | DOI. Do not deduplicate on this field: nine pairs of different articles share a DOI through colliding source metadata. |
| `year` | 580 | Publication year. |
| `authors` | 580 | Author list as found in the sources, in several incompatible formats. It does not support a reliable author count. |
| `journal` | 579 | Journal name, standardised through Crossref where the DOI resolved. |
| `keywords` | 369 | Author keywords only, from the Europe PMC keywordList, separated by ';'. Empty when no author keywords are available. |

## Geography of the study

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `study_country` | 580 | ISO3 code of each country where the study was conducted (origin of the data or participants), separated by ';'. Key for the aligned country indicators. |
| `study_continent` | 580 | Distinct continents of study_country, separated by ' / '. |
| `study_subregion` | 580 | Distinct UN M49 subregions of study_country, separated by ' / '. |
| `is_multi_country` | 580 | 1 when study_country has more than one country. |
| `is_multi_continent` | 580 | 1 when the study covers more than one continent. |

## Geography of the authors

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `researcher_country` | 580 | ISO3 codes of all countries in the author affiliations, separated by ';'. In v1.1.1 this field held the first author's country only. |
| `researcher_continent` | 580 | Distinct continents of researcher_country. |
| `researcher_subregion` | 580 | Distinct subregions of researcher_country. |
| `researcher_country_primeiro` | 540 | Country of the first listed affiliation (the v1.1.1 definition of researcher_country). |
| `author_affiliation` | 579 | Affiliation text, the evidence for the fields above. |

## Coordinates

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `latitude` | 567 | Latitude of the authors' institution, not of the country studied. Some values are country centroids. |
| `longitude` | 567 | Longitude of the authors' institution. |
| `coordenada_endereco` | 481 | Address resolved by the geocoder. Empty when the coordinate was not geocoded from an address. |

## Research flow

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `research_flow` | 580 | Relation between author and study countries: Domestic (every author country is among those studied), Partially domestic (partial overlap), Intra-continental (no overlap, same continent), Cross-continental (no overlap, different continents). |

## Topics

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `topic_id` | 580 | Topic from the 32-topic NMF model after expert review; see topics_dataset.csv. |
| `megatopic_id` | 580 | Megatopic of the topic; see megatopics_dataset.csv. |

## Country indicators, one value per country of study_country, in the same order

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `income_group` | 580 | World Bank income group in the publication year, or the latest earlier year. |
| `income_group_source` | 580 | Source of income_group (World Bank OGHIST historical classification). |
| `income_group_obs_year` | 580 | Year of income_group. |
| `hdi` | 579 | Human Development Index. |
| `hdi_source` | 579 | Source: 'PNUD, Relatorio de Desenvolvimento Humano 2021/22' is the UNDP Human Development Report 2021/22; 'conjunto publicado, origem nao declarada' means carried over from v1.1.1 with no declared origin. |
| `hdi_obs_year` | 577 | Year of hdi. |
| `gender_inequality_index` | 579 | Gender Inequality Index. Carried over from v1.1.1; part of the values could not be traced to a source. |
| `gender_inequality_index_source` | 579 | Source, with the same values as hdi_source. |
| `gender_inequality_index_obs_year` | 406 | Year of gender_inequality_index. Empty when no source was identified. |
| `population_total` | 580 | Total population. |
| `gdp_per_capita` | 578 | GDP per capita, current US$. |
| `gini_index` | 579 | Gini index, 0 to 100. |
| `gini_index_source` | 579 | Source (WDI, SWIID). |
| `gini_index_obs_year` | 579 | Year of gini_index. |
| `women_parliament` | 576 | Seats held by women in national parliament, %. |
| `women_parliament_source` | 576 | Source (WDI). |
| `women_parliament_obs_year` | 576 | Year of women_parliament. |
| `female_labor_force` | 580 | Female labour force participation, %. |
| `female_labor_force_source` | 580 | Source (WDI, ILOSTAT). |
| `female_labor_force_obs_year` | 580 | Year of female_labor_force. |
| `female_homicide_rate` | 468 | Female homicide rate per 100 000 women. |
| `female_homicide_rate_source` | 468 | Source (WDI, OWID). |
| `female_homicide_rate_obs_year` | 468 | Year of female_homicide_rate. |
| `maternal_mortality` | 577 | Maternal deaths per 100 000 live births. |

## Bibliometrics, from Crossref and Unpaywall

| Field | Coverage | Description |
| :--- | ---: | :--- |
| `citations` | 562 | Citation count (is-referenced-by-count). Valid only for citations_obs_date. |
| `citations_obs_date` | 562 | Date of the citation query. |
| `publisher` | 562 | Publisher registered for the DOI. |
| `journal_issn` | 559 | Journal ISSN. |
| `article_type` | 562 | Type declared in the DOI record. |
| `open_access` | 562 | Whether an open version was located. |
| `oa_status` | 562 | Open access route: gold, green, hybrid, bronze or closed. |

## `topics_dataset.csv`

| Field | Description |
| :--- | :--- |
| `topic_id` | Topic identifier, 1 to 32. |
| `topic_description` | Topic label. |
| `megatopic_id` | Megatopic identifier, 1 to 7. |
| `megatopic_description` | Megatopic label. |
| `coherence_cv` | Topic coherence (Cv). |
| `top_keywords` | Highest-weighted terms of the topic. |

## `megatopics_dataset.csv`

| Field | Description |
| :--- | :--- |
| `megatopic_id` | Megatopic identifier. |
| `megatopic_description` | Megatopic label. |
| `topic_ids` | Topics of the megatopic, separated by ';'. |

## Known limitations

- List fields use `;`, and absence inside an aligned list is written `NA` in its position, so that lists stay aligned with `study_country`.
- Country indicators describe the countries studied, using the publication year or the latest earlier year. `hdi` has 2021 as reference year.
- `topic_id` cannot be recomputed: the input table of the original NMF run is no longer available, and full texts cannot be redistributed. Records 581 and 582 were assigned to a topic manually, by reading the text against the topic's terms and articles.
- In six records (388, 552, 415, 239, 347, 470) the text used for topic assignment belonged to another article, so the topic may not describe the article listed.
- Eight records (3, 20, 114, 123, 275, 304, 487, 546) have a confirmed number of countries, but the country names could not be fully verified. Record 546 states 22 countries in its text and lists 32 here.
- Nine DOIs resolve to a preprint while `journal` names the journal of publication; there, `citations` refers to the preprint.
- `article_type` and `open_access` keep the values of their sources, with minor variation in spelling (`journal article`, `journal-article`; `True`, `1`).
