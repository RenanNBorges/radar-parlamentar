/**
 * Servidor Express para execução LOCAL do Radar Parlamentar.
 *
 * Em desenvolvimento: serve o front-end via middleware do Vite.
 * Em produção local (NODE_ENV=production): serve a pasta dist/ gerada por `npm run build`.
 *
 * Na hospedagem (Vercel) este arquivo não é usado: as rotas /api/* ficam na
 * pasta api/ e o front-end estático é servido pela própria plataforma.
 * A regra de negócio das rotas está em server/, compartilhada pelos dois modos.
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getNews } from './server/newsRoute.js';
import { explainVote } from './server/voteExplainer.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

/** GET /api/news — agregação de notícias multi-fonte com deduplicação. */
app.get('/api/news', async (req, res) => {
  const params = new URL(req.originalUrl, 'http://localhost').searchParams;
  const { status, body } = await getNews(params);
  res.status(status).json(body);
});

/** POST /api/explain-vote — explicação de votação em linguagem simples. */
app.post('/api/explain-vote', async (req, res) => {
  try {
    const { status, body } = await explainVote(req.body);
    res.status(status).json(body);
  } catch (err) {
    console.error('Erro no processamento da explicação:', err);
    res.status(500).json({ error: 'Falha ao gerar explicação da votação.' });
  }
});

/** GET /api/health — verificação de disponibilidade. */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Radar Parlamentar API', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Radar Parlamentar] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Erro fatal ao iniciar servidor:', err);
  process.exit(1);
});
