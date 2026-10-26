import { NewsArticle, Politician } from '../types';
import { aggregateAndDeduplicateNews } from './newsAggregator';

export interface FetchNewsResponse {
  articles: NewsArticle[];
  uniqueOutlets: string[];
  usedFallback: boolean;
}

/**
 * Busca notícias agregadas e deduplicadas para o parlamentar selecionado.
 * Consulta o backend Express (/api/news) que já injeta a chave WORLD_NEWS_API de ambiente,
 * ou executa a agregação diretamente se a rota da API estiver indisponível.
 */
export async function fetchPoliticianNews(
  politician: Politician,
  customApiKey?: string
): Promise<FetchNewsResponse> {
  // 1. Tenta a rota de agregação do backend
  try {
    const params = new URLSearchParams({
      id: String(politician.id),
      nome: politician.nome,
      cargo: politician.cargo,
      partido: politician.partido,
      uf: politician.uf,
      urlFoto: politician.urlFoto || '',
      paginaOficial: politician.paginaOficial || '',
    });

    const res = await fetch(`/api/news?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.articles) && data.articles.length > 0) {
        return {
          articles: data.articles,
          uniqueOutlets: data.uniqueOutlets || [],
          usedFallback: Boolean(data.usedFallback),
        };
      }
    }
  } catch (err) {
    console.warn('Backend /api/news não respondeu ou erro de rede, executando agregação direta no cliente:', err);
  }

  // 2. Agregação direta no cliente com timeout resiliente
  try {
    return await aggregateAndDeduplicateNews(politician, customApiKey);
  } catch (err) {
    console.error('Falha geral ao colher notícias:', err);
    return {
      articles: [],
      uniqueOutlets: [],
      usedFallback: true,
    };
  }
}
