/**
 * Função serverless da Vercel — GET /api/health
 * Verificação simples de que o back-end está no ar.
 */

export function GET(): Response {
  return Response.json({
    status: 'ok',
    service: 'Radar Parlamentar API',
    time: new Date().toISOString(),
  });
}
