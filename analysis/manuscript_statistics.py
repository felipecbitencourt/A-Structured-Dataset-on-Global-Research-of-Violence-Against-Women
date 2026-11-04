"""Reproduce the statistics reported in the manuscript from articles_dataset.csv.

Everything here runs on the public dataset alone; no full text is needed.

    python analysis/manuscript_statistics.py analytical_interface/data/articles_dataset.csv
"""
from __future__ import annotations

import argparse
from itertools import product

import numpy as np
import pandas as pd
from scipy.stats import chi2, chi2_contingency

CONTINENTS = ["Americas", "Europe", "Oceania", "Africa", "Asia"]


def split(value: object) -> list[str]:
    """Split a multi-valued field, which uses ';' or ' / ' as separator."""
    if pd.isna(value):
        return []
    parts = str(value).replace(" / ", ";").replace("/", ";").split(";")
    return sorted({p.strip() for p in parts if p.strip() and p.strip() != "NA"})


def residuals(observed: np.ndarray, expected: np.ndarray) -> np.ndarray:
    """Standardized Pearson residuals; structural zeros stay NaN."""
    with np.errstate(divide="ignore", invalid="ignore"):
        return (observed - expected) / np.sqrt(expected)


def cramers_v(stat: float, table: np.ndarray) -> float:
    return float(np.sqrt(stat / (table.sum() * (min(table.shape) - 1))))


def show_flows(z: np.ndarray, limit: float = 1.96) -> None:
    for i, j in product(range(5), range(5)):
        if i != j and not np.isnan(z[i, j]) and abs(z[i, j]) >= limit:
            print(f"    {CONTINENTS[i]} -> {CONTINENTS[j]}: z = {z[i, j]:+.2f}")


def quasi_independence(table: np.ndarray, iterations: int = 5000) -> np.ndarray:
    """Fit quasi-independence by iterative proportional fitting, diagonal excluded."""
    fitted = np.ones_like(table, dtype=float)
    np.fill_diagonal(fitted, 0)
    for _ in range(iterations):
        fitted *= (table.sum(1) / fitted.sum(1))[:, None]
        fitted *= (table.sum(0) / fitted.sum(0))[None, :]
    return fitted


def corpus(df: pd.DataFrame) -> None:
    studied = df.study_country.map(split)
    affiliated = df.researcher_country.map(split)
    s, a = set().union(*studied), set().union(*affiliated)
    print("Corpus")
    print(f"  articles: {len(df)}; years: {df.year.min()}-{df.year.max()}")
    print(f"  countries studied: {len(s)}; affiliated: {len(a)}; both: {len(s & a)}; "
          f"studied only: {len(s - a)}; affiliated only: {len(a - s)}")
    single = (studied.map(len) == 1).mean()
    multi_continent = (df.study_continent.map(split).map(len) > 1).mean()
    print(f"  single country: {single:.1%}; two or more: {1 - single:.1%}; "
          f"multi-continental: {multi_continent:.1%}")


def local_authorship(df: pd.DataFrame, countries=("USA", "KEN", "RWA")) -> None:
    print("\nLocal authorship (a study of the country with an author affiliated there)")
    studied = df.study_country.map(split)
    affiliated = df.researcher_country.map(split)
    for country in countries:
        mask = studied.map(lambda c: country in c)
        local = affiliated[mask].map(lambda c: country in c).sum()
        print(f"  {country}: {local} of {mask.sum()} ({local / mask.sum():.0%})")


def flows(df: pd.DataFrame) -> None:
    table = np.zeros((5, 5))
    for _, row in df.iterrows():
        for origin, destination in product(split(row.researcher_continent), split(row.study_continent)):
            if origin in CONTINENTS and destination in CONTINENTS:
                table[CONTINENTS.index(origin), CONTINENTS.index(destination)] += 1

    stat, p, dof, expected = chi2_contingency(table, correction=False)
    z = residuals(table, expected)
    print("\nAffiliation continent x studied continent")
    print(f"  pairs: {table.sum():.0f}; chi2 = {stat:.2f}, df = {dof}, p = {p:.3g}, "
          f"V = {cramers_v(stat, table):.2f}")
    print(f"  diagonal residuals: {np.diag(z).min():+.1f} to {np.diag(z).max():+.1f}")

    off = table.copy()
    np.fill_diagonal(off, 0)
    expected = np.outer(off.sum(1), off.sum(0)) / off.sum()
    np.fill_diagonal(expected, np.nan)
    z = residuals(off, expected)
    stat = np.nansum(z ** 2)
    print(f"\nIntercontinental flows only (diagonal removed)\n  pairs: {off.sum():.0f}; chi2 = {stat:.2f}")
    show_flows(z, 1.7)

    fitted = quasi_independence(off)
    mask = ~np.eye(5, dtype=bool)
    z = np.full((5, 5), np.nan)
    z[mask] = residuals(off[mask], fitted[mask])
    stat, dof = np.nansum(z ** 2), (5 - 1) ** 2 - 5
    print(f"\nQuasi-independence\n  chi2 = {stat:.2f}, df = {dof}, p = {chi2.sf(stat, dof):.3f}")
    top = np.unravel_index(np.nanargmax(z), z.shape)
    europe_americas = z[CONTINENTS.index("Europe"), CONTINENTS.index("Americas")]
    print(f"  Europe -> Americas: z = {europe_americas:+.2f}; largest: "
          f"{CONTINENTS[top[0]]} -> {CONTINENTS[top[1]]}, z = {z[top]:+.2f}")


def continent_by_megatopic(df: pd.DataFrame) -> None:
    pairs = [(c, m) for cs, m in zip(df.study_continent.map(split), df.megatopic_id) for c in cs
             if c in CONTINENTS]
    table = pd.crosstab(*zip(*pairs))
    stat, p, dof, expected = chi2_contingency(table.values, correction=False)
    z = pd.DataFrame(residuals(table.values, expected), index=table.index, columns=table.columns)
    print("\nStudied continent x megatopic")
    print(f"  pairs: {table.values.sum()}; chi2 = {stat:.2f}, df = {dof}, p = {p:.3g}, "
          f"V = {cramers_v(stat, table.values):.3f}")
    for continent, megatopic in zip(*np.where(z.abs().values >= 1.96)):
        print(f"    {z.index[continent]}, M{z.columns[megatopic]}: "
              f"n = {table.iat[continent, megatopic]}, z = {z.iat[continent, megatopic]:+.2f}")


def trends(df: pd.DataFrame) -> None:
    from scipy.stats import linregress

    print("\nAnnual growth by megatopic (OLS of yearly article counts on year)")
    years = np.arange(df.year.min(), df.year.max() + 1)
    for megatopic in sorted(df.megatopic_id.unique()):
        counts = df[df.megatopic_id == megatopic].groupby("year").size().reindex(years, fill_value=0)
        fit = linregress(years, counts.values)
        print(f"  M{megatopic}: beta = {fit.slope:.2f}, p = {fit.pvalue:.3g}, R2 = {fit.rvalue ** 2:.2f}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("articles", help="Path to articles_dataset.csv")
    df = pd.read_csv(parser.parse_args().articles, encoding="utf-8-sig", low_memory=False)
    corpus(df)
    local_authorship(df)
    flows(df)
    continent_by_megatopic(df)
    trends(df)


if __name__ == "__main__":
    main()
