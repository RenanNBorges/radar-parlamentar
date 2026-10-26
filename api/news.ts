/**
 * Função serverless da Vercel — GET /api/news
 * Agrega notícias de várias fontes para o parlamentar informado.
 */

import { getNews } from '../server/newsRoute.js';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const { status, body } = await getNews(searchParams);
  return Response.json(body, { status });
}
