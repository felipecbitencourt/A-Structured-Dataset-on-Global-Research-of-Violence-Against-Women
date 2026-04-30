# Registro de Ajustes e Incongruencias da Tabela de Artigos

Data do levantamento: 2026-04-29  
Arquivo analisado: `analytical_interface/data/articles_dataset.csv`

## Resumo geral

- Total de registros analisados: **580**
- Registros com ao menos 1 alerta: **214**

## Pontuacoes por tipo de alerta

- `journal_sujo` (campo journal contem DOI/URL): **168**
- `encoding_titulo` (possivel problema de codificacao em title): **18**
- `geo_incompleto` (single-country sem latitude/longitude): **17**
- `doi_formato` (DOI fora do formato canonico): **10**
- `doi_vazio` (DOI ausente): **8**
- `titulo_igual_journal` (title igual ao nome do periodico): **2**

## Listas de maior prioridade

### DOI vazio

IDs:
- 10, 201, 236, 244, 245, 338, 353, 372

### DOI com formato inconsistente

- 9 -> `DOI 10.1186/s12889-017-4348-y`
- 12 -> `doi: 10.3389/fsoc.2021.623661`
- 51 -> `DOI: 10.1093/aje/kwt297`
- 68 -> `DOI: 10.1089/apc.2014.0278`
- 73 -> `DOI: 10.1177/0886260512471083`
- 86 -> `https://doi.org/10.1037/tra0001244`
- 88 -> `http://dx.doi.org/10.1097/JSM.0000000000000989`
- 103 -> `https://doi.org/10.1017/` (incompleto)
- 109 -> `https://doi.org/10.1037/tra0001457`
- 337 -> `doi:10.4137/PPRI.S39664.`

### Titulo igual ao periodico

IDs:
- 154, 572

### Geolocalizacao incompleta (single-country)

IDs:
- 73, 95, 156, 157, 315, 323, 368, 409, 415, 482, 490, 500, 506, 515, 542, 558, 567

## Observacoes de limpeza

- A categoria `journal_sujo` costuma indicar necessidade de padronizacao, nao necessariamente erro factual.
- As categorias com maior impacto para integridade de metadados sao:
  - `doi_vazio`
  - `doi_formato`
  - `titulo_igual_journal`
- Foram corrigidas manualmente entradas criticas recentes (ex.: 302, 482, 506, 571), com validacao por DOI quando possivel.

## Execucao do plano de DOI (2026-04-29)

### Correcoes aplicadas com validacao Crossref

- 9: `DOI 10.1186/s12889-017-4348-y` -> `10.1186/s12889-017-4348-y`
- 12: `doi: 10.3389/fsoc.2021.623661` -> `10.3389/fsoc.2021.623661`
- 68: `DOI: 10.1089/apc.2014.0278` -> `10.1089/apc.2014.0278`
- 73: `DOI: 10.1177/0886260512471083` -> `10.1177/0886260512471083`
- 86: `https://doi.org/10.1037/tra0001244` -> `10.1037/tra0001244`
- 88: `http://dx.doi.org/10.1097/JSM.0000000000000989` -> `10.1097/jsm.0000000000000989`
- 103: `https://doi.org/10.1017/` -> `10.1017/S2045796023000069` (DOI completo confirmado por title+journal+year)
- 109: `https://doi.org/10.1037/tra0001457` -> `10.1037/tra0001457`
- 337: `doi:10.4137/PPRI.S39664.` -> `10.4137/ppri.s39664`

Total corrigido nesta etapa: **9** registros.

### Pendencias (nao alteradas por falta de compatibilidade minima)

- 51: DOI `10.1093/aje/kwt297` existe no Crossref, porem metadados retornados nao sao compativeis com `title` e `journal` da linha atual.  
  Status: **pendente_revisao_manual**.

### DOI vazio (mantidos pendentes para busca dirigida)

IDs ainda sem DOI:
- 10, 201, 236, 244, 245, 338, 353, 372

Observacao: para esses casos, a busca automatica por `title` retornou candidatos sem compatibilidade de periodico (e em varios casos sem compatibilidade de ano), portanto nao houve atualizacao automatica.

### Revalidacao pos-correcao (foco em DOI)

- `doi_formato`: de **10** para **1** (restante: ID 51, pendente manual)
- `doi_vazio`: **8** (sem alteracao nesta rodada)

