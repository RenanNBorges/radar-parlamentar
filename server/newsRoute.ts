/**
 * Regra da rota GET /api/news (lado do servidor).
 *
 * Transforma os parâmetros da requisição em um objeto Politician e chama o
 * agregador de notícias. É compartilhada pelo servidor Express local
 * (server.ts) e pela função serverless da Vercel (api/news.ts).
 */

import { aggregateAndDeduplicateNews } from '../src/services/newsAggregator.js';
import type { Politician } from '../src/types/index.js';

export interface NewsRouteResult {
  status: number;
  body: unknown;
}

/** Busca e consolida notícias do parlamentar descrito nos parâmetros de consulta. */
export async function getNews(params: URLSearchParams): Promise<NewsRouteResult> {
  const nome = params.get('nome');
  if (!nome) {
    return { status: 400, body: { error: 'Parâmetro "nome" é obrigatório.' } };
  }

  const politician: Politician = {
    id: params.get('id') || '0',
    nome,
    cargo: (params.get('cargo') as Politician['cargo']) || 'Deputado Federal',
    partido: params.get('partido') || '',
    uf: params.get('uf') || 'SP',
    urlFoto: params.get('urlFoto') || '',
    mandatoInicioAno: 2023,
    mandatoFimAno: 2027,
    paginaOficial: params.get('paginaOficial') || undefined,
  };

  try {
    const result = await aggregateAndDeduplicateNews(politician, process.env.WORLD_NEWS_API);
    return { status: 200, body: result };
  } catch (err: any) {
    console.error('Erro na agregação de notícias:', err?.message || err);
    return { status: 500, body: { error: 'Falha ao processar agregação de notícias', details: String(err) } };
  }
}
