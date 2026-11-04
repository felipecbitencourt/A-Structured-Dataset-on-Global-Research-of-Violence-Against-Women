
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF, LatentDirichletAllocation
from sklearn.preprocessing import normalize
from gensim.models.coherencemodel import CoherenceModel
from gensim.corpora.dictionary import Dictionary
import os
import re

# Função para calcular exclusividade
def calculate_exclusivity(topic_word_matrix, top_n=10):
    # topic_word_matrix: (n_topics, n_features)
    # Exclusividade de uma palavra w no tópico t: P(t|w) = P(w|t)P(t) / P(w)
    # Aqui, simplificado: quão focado o peso da palavra está neste tópico comparado aos outros
    
    # Normalizar por coluna (palavra)
    # Se uma palavra tem peso alto só no tópico 1 e 0 nos outros, exclusividade é alta
    
    exclusivity_scores = []
    
    # Normalize rows (topics) to sum to 1 (probability of word given topic)
    row_sums = topic_word_matrix.sum(axis=1)
    # Avoid division by zero
    row_sums[row_sums == 0] = 1
    prob_w_given_t = topic_word_matrix / row_sums[:, np.newaxis]
    
    # Normalize cols (words) to sum to 1 (probability of topic given word, assuming uniform prior P(t))
    col_sums = prob_w_given_t.sum(axis=0)
    col_sums[col_sums == 0] = 1
    prob_t_given_w = prob_w_given_t / col_sums
    
    n_topics = topic_word_matrix.shape[0]
    
    for t in range(n_topics):
        # Get top indices for this topic
        top_indices = np.argsort(topic_word_matrix[t, :])[::-1][:top_n]
        
        # Mean of P(t|w) for the top words
        exc = np.mean(prob_t_given_w[t, top_indices])
        exclusivity_scores.append(exc)
        
    return np.mean(exclusivity_scores)

def main():
    # Caminhos
    import sys
    from pathlib import Path

    _sys_code = Path(__file__).resolve().parents[1]
    if str(_sys_code) not in sys.path:
        sys.path.insert(0, str(_sys_code))
    from repo_paths import repo_root

    base_path = str(repo_root())
    input_file = os.path.join(base_path, 'tabelas', 'final_geo3.csv') # Usando final_geo3 pois deve ter o texto limpo
    
    print(f"Carregando dados de: {input_file}")
    print(f"Carregando dados de: {input_file}")
    try:
        # Tenta ler com separator sniffing (sep=None) e engine python
        try:
             df = pd.read_csv(input_file, sep=None, on_bad_lines='skip', engine='python')
        except:
             df = pd.read_csv(input_file, sep=None, error_bad_lines=False, engine='python')

        print("Colunas encontradas:", df.columns.tolist())
        
        # Fallback manual se sniffing falhar ou não achar cleaned
        if 'cleaned' not in df.columns:
            # Tentar separador ; explícito
             print("Tentando separador ';'")
             try:
                 df = pd.read_csv(input_file, sep=';', on_bad_lines='skip', engine='python')
             except:
                 df = pd.read_csv(input_file, sep=';', error_bad_lines=False, engine='python')
             print("Colunas com separador ';':", df.columns.tolist())

    except Exception as e:
        print(f"Erro ao ler CSV: {e}")
        return

    if 'cleaned' not in df.columns:
        print("Erro: Coluna 'cleaned' não encontrada no arquivo.")
        # Tentar tabela consolidada de artigos como fallback
        input_file_bkp = os.path.join(base_path, 'tabelas', 'articles_dataset.csv')
        print(f"Tentando ler: {input_file_bkp}")
        try:
             df = pd.read_csv(input_file_bkp, sep=';', engine='python')
        except:
             pass
        if 'cleaned' not in df.columns:
             print("Não foi possível encontrar coluna de texto.")
             return

    # Limpeza básica
    df = df.dropna(subset=['cleaned'])
    texts = [str(text).split() for text in df['cleaned']]
    
    print(f"Documentos processados: {len(df)}")
    
    # 1. Estatísticas do Corpus
    print("\n--- 1. Estatísticas do Corpus ---")
    vectorizer = TfidfVectorizer(max_df=0.9, min_df=12, max_features=5000, ngram_range=(1, 2), stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(df['cleaned'].astype(str))
    feature_names = vectorizer.get_feature_names_out()
    
    sparsity = 1.0 - (tfidf_matrix.nnz / (tfidf_matrix.shape[0] * tfidf_matrix.shape[1]))
    vocab_size = len(feature_names)
    doc_density = np.mean([len(t) for t in texts])
    
    print(f"Vocab Size: {vocab_size}")
    print(f"Sparsity: {sparsity:.4f}")
    print(f"Avg Doc Length (words): {doc_density:.2f}")

    # 2. Fit NMF (k=32)
    print("\n--- 2. Rodando NMF (k=32) para Validação ---")
    k = 32
    nmf = NMF(n_components=k, init='nndsvda', solver='mu', beta_loss='frobenius', random_state=42, max_iter=500)
    W = nmf.fit_transform(tfidf_matrix)
    H = nmf.components_
    
    reconstruction_error = nmf.reconstruction_err_
    print(f"Reconstruction Error: {reconstruction_error:.4f}")
    
    # Resíduos (Norma da diferença / Norma da original - aproximado pelo erro)
    # Frobenius norm of original matrix
    from scipy import sparse
    norm_V = sparse.linalg.norm(tfidf_matrix)
    residual_pct = (reconstruction_error / norm_V) * 100
    print(f"Residual %: {residual_pct:.2f}%")

    # 3. Qualidade dos Tópicos
    print("\n--- 3. Métricas de Tópicos ---")
    
    # Extrair Words para Gensim
    topics_words = []
    top_n = 10
    for topic_idx, topic in enumerate(H):
        top_indices = topic.argsort()[:-top_n - 1:-1]
        topics_words.append([feature_names[i] for i in top_indices])
    
    # Gensim Dictionary (com filtro como no script original)
    dictionary = Dictionary(texts)
    dictionary.filter_extremes(no_below=3, no_above=0.9, keep_n=None)
    
    # Coherence Cv
    cm_cv = CoherenceModel(topics=topics_words, texts=texts, dictionary=dictionary, coherence='c_v')
    cv_score = cm_cv.get_coherence()
    
    # Coherence UMass
    cm_umass = CoherenceModel(topics=topics_words, texts=texts, dictionary=dictionary, coherence='u_mass')
    umass_score = cm_umass.get_coherence()
    
    # Coherence NPMI
    cm_npmi = CoherenceModel(topics=topics_words, texts=texts, dictionary=dictionary, coherence='c_npmi')
    npmi_score = cm_npmi.get_coherence()
    
    print(f"Coherence (Cv): {cv_score:.4f}")
    print(f"Coherence (UMass): {umass_score:.4f}")
    print(f"Coherence (NPMI): {npmi_score:.4f}")
    
    # Per-topic coherence
    per_topic_cv = cm_cv.get_coherence_per_topic()
    per_topic_umass = cm_umass.get_coherence_per_topic()
    
    print("\n--- 3b. Coerência por Tópico ---")
    for i, (cv_t, um_t) in enumerate(zip(per_topic_cv, per_topic_umass)):
        print(f"  Tópico {i:2d}: Cv={cv_t:.4f}  UMass={um_t:.4f}")
    
    # Estatísticas de distribuição de coerência
    cv_arr = np.array(per_topic_cv)
    cv_median = np.median(cv_arr)
    cv_std = np.std(cv_arr)
    cv_min_idx = int(np.argmin(cv_arr))
    cv_max_idx = int(np.argmax(cv_arr))
    
    # Distribuição de documentos por tópico (baseado na atribuição NMF dominante)
    doc_topic_assignments = np.argmax(W, axis=1)
    topic_doc_counts = np.bincount(doc_topic_assignments, minlength=k)
    
    print("\n--- 3c. Distribuição de Documentos por Tópico ---")
    for i, count in enumerate(topic_doc_counts):
        print(f"  Tópico {i:2d}: {count} docs")
    
    doc_min = int(topic_doc_counts.min())
    doc_max = int(topic_doc_counts.max())
    doc_median = float(np.median(topic_doc_counts))
    doc_std = float(np.std(topic_doc_counts))
    
    print(f"\n  Min: {doc_min}  Max: {doc_max}  Mediana: {doc_median:.0f}  Desvio: {doc_std:.1f}")
    
    # Exclusividade
    exclusivity = calculate_exclusivity(H, top_n=10)
    print(f"Exclusivity (avg top-10): {exclusivity:.4f}")
    
    # Topic Diversity (proporção de palavras únicas entre todos os tópicos)
    all_top_words = [w for topic in topics_words for w in topic]
    unique_top_words = set(all_top_words)
    topic_diversity = len(unique_top_words) / len(all_top_words)
    print(f"Topic Diversity: {topic_diversity:.4f} ({len(unique_top_words)} únicas de {len(all_top_words)} total)")
    
    # Entropia de Documentos (Shannon Entropy of W rows)
    # Normalize W first
    W_norm = W / W.sum(axis=1, keepdims=True)
    W_norm[np.isnan(W_norm)] = 0 # Handle outliers
    # Avoid log0
    W_norm = np.maximum(W_norm, 1e-12)
    entropy = -np.sum(W_norm * np.log(W_norm), axis=1)
    mean_entropy = np.mean(entropy)
    print(f"Mean Document Entropy: {mean_entropy:.4f}")

    # Similaridade Inter-tópicos (Cosine Sim of H rows)
    H_norm = normalize(H, axis=1, norm='l2')
    sim_matrix = np.dot(H_norm, H_norm.T)
    # Mean of upper triangle excluding diagonal
    mask = np.triu_indices_from(sim_matrix, k=1)
    mean_inter_topic_sim = np.mean(sim_matrix[mask])
    print(f"Mean Inter-Topic Similarity: {mean_inter_topic_sim:.4f}")

    # =============================================
    # 3d. COMPARAÇÃO NMF vs LDA
    # =============================================
    print("\n--- 3d. Comparação NMF vs LDA (k=32) ---")
    
    # LDA precisa de contagens, não TF-IDF, mas podemos usar TF-IDF como aproximação
    # Ou usar CountVectorizer. Vamos usar a mesma TF-IDF para comparação justa.
    from sklearn.feature_extraction.text import CountVectorizer
    count_vec = CountVectorizer(max_df=0.9, min_df=12, max_features=5000, ngram_range=(1, 2), stop_words='english')
    count_matrix = count_vec.fit_transform(df['cleaned'].astype(str))
    count_feature_names = count_vec.get_feature_names_out()
    
    lda = LatentDirichletAllocation(
        n_components=k, random_state=42, max_iter=50,
        learning_method='online', n_jobs=-1
    )
    lda_W = lda.fit_transform(count_matrix)
    lda_H = lda.components_
    
    # Extrair top words do LDA
    lda_topics_words = []
    for topic in lda_H:
        top_indices = topic.argsort()[:-top_n - 1:-1]
        lda_topics_words.append([count_feature_names[i] for i in top_indices])
    
    # Coerência LDA
    cm_lda_cv = CoherenceModel(topics=lda_topics_words, texts=texts, dictionary=dictionary, coherence='c_v')
    lda_cv = cm_lda_cv.get_coherence()
    
    cm_lda_umass = CoherenceModel(topics=lda_topics_words, texts=texts, dictionary=dictionary, coherence='u_mass')
    lda_umass = cm_lda_umass.get_coherence()
    
    cm_lda_npmi = CoherenceModel(topics=lda_topics_words, texts=texts, dictionary=dictionary, coherence='c_npmi')
    lda_npmi = cm_lda_npmi.get_coherence()
    
    # Exclusividade LDA
    lda_exclusivity = calculate_exclusivity(lda_H, top_n=10)
    
    # Topic Diversity LDA
    lda_all_words = [w for topic in lda_topics_words for w in topic]
    lda_unique_words = set(lda_all_words)
    lda_topic_diversity = len(lda_unique_words) / len(lda_all_words)
    
    print(f"  LDA Cv: {lda_cv:.4f}  |  NMF Cv: {cv_score:.4f}")
    print(f"  LDA UMass: {lda_umass:.4f}  |  NMF UMass: {umass_score:.4f}")
    print(f"  LDA NPMI: {lda_npmi:.4f}  |  NMF NPMI: {npmi_score:.4f}")
    print(f"  LDA Exclusivity: {lda_exclusivity:.4f}  |  NMF Exclusivity: {exclusivity:.4f}")
    print(f"  LDA Diversity: {lda_topic_diversity:.4f}  |  NMF Diversity: {topic_diversity:.4f}")

    # 4. Métricas Manuais
    manual_metrics = calculate_manual_topics_metrics(df, texts, dictionary, vectorizer, feature_names)

    # Output Markdown
    m_cv = f"{manual_metrics['cv_score']:.4f}" if manual_metrics else 'N/A'
    m_umass = f"{manual_metrics['umass_score']:.4f}" if manual_metrics else 'N/A'
    m_excl = f"{manual_metrics['exclusivity']:.4f}" if manual_metrics else 'N/A'
    v_cv = f"{((manual_metrics['cv_score'] - cv_score)/cv_score)*100:.1f}%" if manual_metrics else '-'
    v_umass = f"{((manual_metrics['umass_score'] - umass_score)/abs(umass_score))*100:.1f}%" if manual_metrics else '-'
    v_excl = f"{((manual_metrics['exclusivity'] - exclusivity)/exclusivity)*100:.1f}%" if manual_metrics else '-'
    
    # Top 5 e Bottom 5 tópicos por coerência
    sorted_indices = cv_arr.argsort()
    bottom5 = sorted_indices[:5]
    top5 = sorted_indices[-5:][::-1]
    
    top5_lines = ""
    for idx in top5:
        words = ', '.join(topics_words[idx][:5])
        top5_lines += f"| Tópico {idx} | {cv_arr[idx]:.4f} | {int(topic_doc_counts[idx])} | {words} |\n"
    
    bottom5_lines = ""
    for idx in bottom5:
        words = ', '.join(topics_words[idx][:5])
        bottom5_lines += f"| Tópico {idx} | {cv_arr[idx]:.4f} | {int(topic_doc_counts[idx])} | {words} |\n"
    
    # Calcular vantagem NMF sobre LDA
    cv_advantage = f"+{((cv_score - lda_cv)/lda_cv)*100:.1f}%" if lda_cv > 0 else 'N/A'
    
    markdown_output = f"""
## Resultados Calculados

### Métricas Gerais (NMF k=32)
| Métrica | Valor | Observação |
| :--- | :--- | :--- |
| **Erro de Reconstrução** | {reconstruction_error:.4f} | (Resíduo relativo: {residual_pct:.1f}%) |
| **Entropia Média** | {mean_entropy:.4f} | Especialização dos docs |
| **Similaridade Inter-tópicos** | {mean_inter_topic_sim:.4f} | Distinção entre vetores latentes |
| **Tamanho do Vocabulário** | {vocab_size} | Termos considerados |
| **Esparsidade** | {sparsity:.4f} | % zeros na matriz TF-IDF |

### Comparativo: Automático (NMF) vs. Manual (Refinado)
| Métrica | Automático (NMF Puro) | Manual (Pós-Revisão) | Variação |
| :--- | :--- | :--- | :--- |
| **Coerência $C_v$** | {cv_score:.4f} | {m_cv} | {v_cv} |
| **Coerência UMass** | {umass_score:.4f} | {m_umass} | {v_umass} |
| **Coerência NPMI** | {npmi_score:.4f} | - | - |
| **Exclusividade** | {exclusivity:.4f} | {m_excl} | {v_excl} |
| **Topic Diversity** | {topic_diversity:.4f} | - | - |

### Comparativo: NMF vs. LDA (k=32)
| Métrica | NMF | LDA | Vantagem NMF |
| :--- | :--- | :--- | :--- |
| **Coerência $C_v$** | {cv_score:.4f} | {lda_cv:.4f} | {cv_advantage} |
| **Coerência UMass** | {umass_score:.4f} | {lda_umass:.4f} | {'Melhor' if umass_score > lda_umass else 'Pior'} |
| **Coerência NPMI** | {npmi_score:.4f} | {lda_npmi:.4f} | {'Melhor' if npmi_score > lda_npmi else 'Pior'} |
| **Exclusividade** | {exclusivity:.4f} | {lda_exclusivity:.4f} | {'Melhor' if exclusivity > lda_exclusivity else 'Pior'} |
| **Topic Diversity** | {topic_diversity:.4f} | {lda_topic_diversity:.4f} | {'Melhor' if topic_diversity > lda_topic_diversity else 'Pior'} |

### Distribuição de Coerência por Tópico ($C_v$)
| Estatística | Valor |
| :--- | :--- |
| **Média** | {cv_score:.4f} |
| **Mediana** | {cv_median:.4f} |
| **Desvio Padrão** | {cv_std:.4f} |
| **Mínimo** | {cv_arr.min():.4f} (Tópico {cv_min_idx}) |
| **Máximo** | {cv_arr.max():.4f} (Tópico {cv_max_idx}) |

#### Top 5 Tópicos (Maior Coerência)
| Tópico | $C_v$ | Docs | Top-5 Palavras |
| :--- | :--- | :--- | :--- |
{top5_lines}
#### Bottom 5 Tópicos (Menor Coerência)
| Tópico | $C_v$ | Docs | Top-5 Palavras |
| :--- | :--- | :--- | :--- |
{bottom5_lines}
### Distribuição de Documentos por Tópico
| Estatística | Valor |
| :--- | :--- |
| **Mínimo** | {doc_min} docs |
| **Máximo** | {doc_max} docs |
| **Mediana** | {doc_median:.0f} docs |
| **Desvio Padrão** | {doc_std:.1f} docs |

> **Nota:** As métricas manuais são calculadas agrupando os documentos pelos tópicos atribuídos após revisão humana e recalculando os centróides TF-IDF para representar cada tópico revisado.
"""
    print(markdown_output)
    
    output_md = os.path.join(base_path, 'reports', 'metrics_result.md')
    os.makedirs(os.path.dirname(output_md), exist_ok=True)
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write(markdown_output)
    
    import json
    metrics = {
        "auto": {
            "cv_score": cv_score,
            "umass_score": umass_score,
            "npmi_score": npmi_score,
            "exclusivity": exclusivity,
            "topic_diversity": topic_diversity,
            "reconstruction_error": reconstruction_error,
            "residual_pct": residual_pct,
            "mean_entropy": mean_entropy,
            "mean_inter_topic_sim": mean_inter_topic_sim,
            "vocab_size": vocab_size,
            "sparsity": sparsity,
            "cv_median": cv_median,
            "cv_std": cv_std,
            "per_topic_cv": [float(x) for x in per_topic_cv],
            "per_topic_umass": [float(x) for x in per_topic_umass],
            "doc_counts_per_topic": [int(x) for x in topic_doc_counts],
            "doc_min": doc_min,
            "doc_max": doc_max,
            "doc_median": doc_median
        },
        "manual": manual_metrics if manual_metrics else "N/A",
        "lda": {
            "cv_score": lda_cv,
            "umass_score": lda_umass,
            "npmi_score": lda_npmi,
            "exclusivity": lda_exclusivity,
            "topic_diversity": lda_topic_diversity
        }
    }
    output_json = os.path.join(base_path, 'artifacts', 'metrics.json')
    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=4)

def calculate_manual_topics_metrics(df, texts, dictionary, vectorizer, feature_names):
    print("\n--- 4. Métricas dos Tópicos Manuais (Pós-Revisão) ---")
    
    # Agrupar documentos por 'topic_id'
    # Normalizar nomes das colunas
    df.columns = df.columns.str.strip()
    
    # Tentar encontrar a coluna de tópico
    topic_col = 'topic_id'
    if topic_col not in df.columns:
        # Tentar procurar algo com topic
        # Primeiro, verifica correspondência exata de nomes comuns
        common_names = ['Topico', 'Topic', 'topic', 'topico', 'Topic_id', 'topic_name']
        found = False
        for name in common_names:
            if name in df.columns:
                topic_col = name
                found = True
                break
        
        if not found:
             # Fallback: busca substring 'topic' ou 'topico'
             candidates = [c for c in df.columns if 'topic' in c.lower() or 'tópico' in c.lower()]
             if candidates:
                 topic_col = candidates[0]
                 print(f"Usando coluna candidata '{topic_col}' para tópicos.")
             else:
                 print(f"Coluna de tópico não encontrada. Colunas: {df.columns.tolist()}")
                 return {}

    print(f"Usando coluna '{topic_col}' para tópicos.")
    manual_topics_words = []
    
    # Obter lista única de tópicos, ordenados
    unique_topics = sorted(df[topic_col].dropna().unique())
    print(f"Tópicos manuais encontrados: {len(unique_topics)}")
    
    # Reconstruir H_manual (n_topics, n_features) para Exclusividade
    H_manual_rows = []

    for t_id in unique_topics:
        # Pegar textos desse tópico
        topic_docs = df[df[topic_col] == t_id]['cleaned'].astype(str).tolist()
        
        if not topic_docs:
            manual_topics_words.append([])
            H_manual_rows.append(np.zeros(len(feature_names)))
            continue
            
        # Para achar as palavras mais representativas do grupo, podemos somar os vetores TF-IDF desses docs
        tfidf_subset = vectorizer.transform(topic_docs)
        
        # Média do vetor TF-IDF para o tópico (Centróide)
        centroid = np.asarray(tfidf_subset.mean(axis=0)).flatten()
        H_manual_rows.append(centroid)
        
        # Top 10 palavras (consistente com NMF auto)
        top_indices = centroid.argsort()[::-1][:10]
        top_words = [feature_names[i] for i in top_indices]
        manual_topics_words.append(top_words)

    # Calcular Coerência nos Tópicos Manuais
    cm_cv_manual = CoherenceModel(topics=manual_topics_words, texts=texts, dictionary=dictionary, coherence='c_v')
    cv_manual = cm_cv_manual.get_coherence()
    
    cm_umass_manual = CoherenceModel(topics=manual_topics_words, texts=texts, dictionary=dictionary, coherence='u_mass')
    umass_manual = cm_umass_manual.get_coherence()
    
    print(f"Manual Coherence (Cv): {cv_manual:.4f}")
    print(f"Manual Coherence (UMass): {umass_manual:.4f}")
    
    # Exclusividade Manual
    # Precisamos montar uma matriz Tópico x Palavra simulada
    # Vamos usar os centróides calculados acima como a matriz H "manual"
    
    # Reconstruir H_manual (n_topics, n_features)
    # Precisamos iterar de novo ou guardar os centroids
    H_manual_rows = []
    for t_id in unique_topics:
        topic_docs = df[df[topic_col] == t_id]['cleaned'].astype(str).tolist()
        if not topic_docs:
             # Vetor zerado se tópico vazio
             H_manual_rows.append(np.zeros(len(feature_names)))
             continue
        # Para achar as palavras mais representativas do grupo, podemos somar os vetores TF-IDF desses docs
        # Usar o vectorizer global
        tfidf_subset = vectorizer.transform(topic_docs)
        
        # Média do vetor TF-IDF para o tópico
        centroid = np.asarray(tfidf_subset.mean(axis=0)).flatten()
        H_manual_rows.append(centroid)
    
    H_manual = np.array(H_manual_rows)
    exclusivity_manual = calculate_exclusivity(H_manual, top_n=10)
    print(f"Manual Exclusivity: {exclusivity_manual:.4f}")
    
    return {
        "cv_score": cv_manual,
        "umass_score": umass_manual,
        "exclusivity": exclusivity_manual
    }

if __name__ == "__main__":
    main()
