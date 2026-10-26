/**
 * Função serverless da Vercel — POST /api/explain-vote
 * Explica uma votação nominal em linguagem simples.
 */

import { explainVote } from '../server/voteExplainer.js';

export async function POST(request: Request): Promise<Response> {
  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    // corpo vazio ou inválido: explainVote responde 400
  }
  try {
    const { status, body } = await explainVote(payload as any);
    return Response.json(body, { status });
  } catch (err) {
    console.error('Erro no processamento da explicação:', err);
    return Response.json({ error: 'Falha ao gerar explicação da votação.' }, { status: 500 });
  }
}
