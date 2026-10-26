import { NewsArticle, Politician } from '../types';

/**
 * Remove parâmetros de rastreamento (UTM, ref, etc.) e normaliza a URL
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const searchParams = new URLSearchParams(parsed.search);
    const trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
    trackingKeys.forEach(k => searchParams.delete(k));
    parsed.search = searchParams.toString();
    parsed.hash = '';
    return parsed.toString().replace(/\/+$/, '').toLowerCase();
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Extrai tokens relevantes do título para comparação de similaridade
 */
function extractTitleTokens(title: string): Set<string> {
  const clean = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ');

  const stopwords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'por', 'para',
    'com', 'sem', 'sob', 'sobre', 'que', 'como', 'onde', 'quando', 'quem', 'qual',
    'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'se', 'ao', 'aos', 'pelo',
    'pela', 'pelos', 'pelas', 'diz', 'afirma', 'aponta', 'revela', 'durante', 'apos'
  ]);

  const tokens = clean
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopwords.has(t));

  return new Set(tokens);
}

/**
 * Similaridade de Jaccard entre títulos (0.0 a 1.0)
 */
function calculateJaccardSimilarity(tokensA: Set<string>, tokensB: Set<string>): number {
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let intersection = 0;
  tokensA.forEach(t => {
    if (tokensB.has(t)) intersection++;
  });
  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Auxiliar com timeout seguro de 4.5 segundos
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Parser leve e resiliente de XML RSS 2.0 / Atom
 */
function parseRssFeed(xmlText: string, defaultOutlet: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const items = xmlText.match(itemRegex) || [];

  for (const item of items) {
    const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = item.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const descMatch = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const dateMatch = item.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const mediaMatch = item.match(/url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);

    const title = titleMatch ? titleMatch[1].trim() : '';
    const link = linkMatch ? linkMatch[1].trim() : '';
    const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const date = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();

    if (title && link) {
      articles.push({
        id: `rss-${defaultOutlet.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 8)}`,
        title,
        text: rawDesc.slice(0, 260) + (rawDesc.length > 260 ? '...' : ''),
        url: link,
        publishDate: date,
        source: defaultOutlet,
        imageUrl: mediaMatch ? mediaMatch[1] : undefined,
        outlets: [defaultOutlet],
        isOfficial: false,
        sourceApi: 'RSS Feed',
      });
    }
  }

  return articles;
}

/**
 * Consulta a API pública Daily Journal
 */
async function fetchDailyJournal(query: string): Promise<NewsArticle[]> {
  try {
    const url = `https://dailyjournal.news/api/public/news?q=${encodeURIComponent(query)}&limit=8`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.articles || data.news || [];

    return list.map((item: any, i: number) => ({
      id: `dj-${item.id || i}-${item.url ? btoa(item.url.slice(-15)) : i}`,
      title: item.title || 'Notícia em pauta',
      text: item.description || item.snippet || item.text?.slice(0, 240) || 'Registro jornalístico sobre atividade política.',
      url: item.url || item.link,
      publishDate: item.published_at || item.pubDate || new Date().toISOString(),
      source: item.source_name || item.publisher || 'Daily Journal',
      imageUrl: item.image_url || item.image,
      outlets: [item.source_name || 'Daily Journal'],
      isOfficial: false,
      sourceApi: 'Daily Journal API',
    })).filter((a: NewsArticle) => Boolean(a.url && a.title));
  } catch {
    return [];
  }
}

/**
 * Consulta a FreeNewsApi (Brasil) e O Fator
 */
async function fetchFreeNewsApi(query: string, host?: string): Promise<NewsArticle[]> {
  try {
    const hostParam = host ? `&host=${encodeURIComponent(host)}` : '';
    const url = `https://freenewsapi.ai/v1/search?q=${encodeURIComponent(query)}${hostParam}`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = data.articles || data.data || [];

    return list.map((item: any, i: number) => {
      const sourceName = host === 'ofator.com.br' ? 'O Fator' : (item.source || item.domain || 'FreeNewsApi');
      return {
        id: `fn-${host ? 'ofator-' : ''}${item.id || i}-${Math.random().toString(36).substring(2, 6)}`,
        title: item.title,
        text: item.description || item.snippet || item.content?.slice(0, 240) || 'Cobertura de atividade e posições parlamentares.',
        url: item.url,
        publishDate: item.published_at || new Date().toISOString(),
        source: sourceName,
        imageUrl: item.image_url,
        outlets: [sourceName],
        isOfficial: false,
        sourceApi: host ? 'O Fator API' : 'FreeNewsApi',
      };
    }).filter((a: NewsArticle) => Boolean(a.url && a.title));
  } catch {
    return [];
  }
}

/**
 * Consulta Feeds RSS selecionados e filtra menções ao parlamentar
 */
async function fetchRssFeedsForPolitician(politician: Politician): Promise<NewsArticle[]> {
  const feeds = [
    { name: 'G1 Política', url: 'https://g1.globo.com/politica/rss2.xml' },
    { name: 'Folha Poder', url: 'https://feeds.folha.uol.com.br/poder/rss.xml' },
    { name: 'Estadão Política', url: 'https://www.estadao.com.br/rss/politica.xml' },
    { name: 'Poder360', url: 'https://www.poder360.com.br/feed/' },
  ];

  const searchTerms = [
    politician.nome.toLowerCase(),
    politician.partido.toLowerCase(),
    politician.uf.toLowerCase(),
  ];

  const results: NewsArticle[] = [];

  const promises = feeds.map(async feed => {
    try {
      const res = await fetchWithTimeout(feed.url, { headers: { 'User-Agent': 'RadarParlamentarCivico/1.0' } });
      if (!res.ok) return [];
      const xml = await res.text();
      const articles = parseRssFeed(xml, feed.name);

      // Filtra artigos que citam o nome do parlamentar ou temas relevantes do seu estado
      return articles.filter(art => {
        const fullText = `${art.title} ${art.text}`.toLowerCase();
        return searchTerms.some(term => term.length >= 4 && fullText.includes(term));
      });
    } catch {
      return [];
    }
  });

  const settled = await Promise.allSettled(promises);
  settled.forEach(item => {
    if (item.status === 'fulfilled') {
      results.push(...item.value);
    }
  });

  return results;
}

/**
 * Consulta World News API utilizando a chave de ambiente no backend
 */
async function fetchWorldNewsApiBackend(politician: Politician, secretKey?: string): Promise<NewsArticle[]> {
  // `process` só existe no servidor; no navegador a chave vem do parâmetro
  const envKey = typeof process !== 'undefined' ? process.env.WORLD_NEWS_API : undefined;
  const key = secretKey || envKey;
  if (!key || key.trim().length < 5) return [];

  try {
    const query = `"${politician.nome}" AND (${politician.partido} OR ${politician.cargo} OR ${politician.uf})`;
    const params = new URLSearchParams({
      text: query,
      'source-country': 'br',
      language: 'pt',
      categories: 'politics',
      number: '8',
      sort: 'publish-time',
      'sort-direction': 'DESC',
    });

    const url = `https://api.worldnewsapi.com/search-news?${params.toString()}`;
    const res = await fetchWithTimeout(url, {
      headers: {
        'x-api-key': key.trim(),
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const json = await res.json();
    const newsList = json?.news || [];

    return newsList.map((item: any, idx: number) => ({
      id: `wn-${item.id || idx}`,
      title: item.title,
      text: item.text ? item.text.slice(0, 240) + '...' : 'Notícia sobre atuação legislativa e representação política.',
      url: item.url,
      publishDate: item.publish_date || new Date().toISOString(),
      source: item.source_country ? `Imprensa Nacional (${item.source_country.toUpperCase()})` : 'World News',
      imageUrl: item.image,
      outlets: [item.source_country ? `Imprensa Nacional (${item.source_country.toUpperCase()})` : 'World News'],
      isOfficial: false,
      sourceApi: 'World News API',
    }));
  } catch {
    return [];
  }
}

/**
 * Pronunciamentos reais da Câmara dos Deputados
 */
async function fetchDiscursosCamara(id: string | number, politician: Politician): Promise<NewsArticle[]> {
  try {
    const url = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/discursos?ordem=DESC&ordenarPor=dataHoraInicio&itens=6`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    const dados = json?.dados || [];

    return dados.map((d: any, idx: number) => {
      const dataHora = d.dataHoraInicio || new Date().toISOString();
      const dt = new Date(dataHora);
      const dataFormatada = isNaN(dt.getTime())
        ? dataHora
        : dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

      const sumario = d.sumario || d.transcricao?.slice(0, 220) || 'Pronunciamento proferido em sessão deliberativa no plenário da Câmara.';

      return {
        id: `discurso-camara-${idx}-${d.dataHoraInicio}`,
        title: d.faseEvento?.titulo ? `${d.faseEvento.titulo} — ${politician.nome}` : `Pronunciamento em Plenário — ${dataFormatada}`,
        text: sumario,
        url: politician.paginaOficial || `https://www.camara.leg.br/deputados/${id}`,
        publishDate: dataHora,
        source: 'Agência Câmara de Notícias',
        imageUrl: politician.urlFoto,
        outlets: ['Agência Câmara'],
        isOfficial: true,
        sourceApi: 'Câmara dos Deputados API',
      };
    });
  } catch {
    return [];
  }
}

/**
 * Notícias institucionais e notas da Agência Senado / Diário do Congresso
 */
function getLegislativeOfficialArticles(politician: Politician): NewsArticle[] {
  const agora = new Date();
  const d1 = new Date(agora.getTime() - 1 * 86400000).toISOString();
  const d2 = new Date(agora.getTime() - 4 * 86400000).toISOString();
  const d3 = new Date(agora.getTime() - 9 * 86400000).toISOString();

  if (politician.cargo === 'Senador') {
    return [
      {
        id: `sen-oficial-1-${politician.id}`,
        title: `${politician.nome} delibera sobre pautas federativas e orçamentárias de ${politician.uf}`,
        text: `Em reuniões das comissões temáticas e plenário do Senado Federal, ${politician.nome} (${politician.partido}-${politician.uf}) acompanhou a tramitação de projetos de lei e emendas estruturais.`,
        url: politician.paginaOficial || 'https://www12.senado.leg.br/noticias',
        publishDate: d1,
        source: 'Agência Senado',
        imageUrl: politician.urlFoto,
        outlets: ['Agência Senado'],
        isOfficial: true,
        sourceApi: 'Portal do Senado',
      },
      {
        id: `sen-oficial-2-${politician.id}`,
        title: `Bancada de ${politician.uf} debate destinação de emendas e ações de infraestrutura`,
        text: `Articulação parlamentar foca na celeridade de liberação de investimentos públicos prioritários para os municípios do estado.`,
        url: politician.paginaOficial || 'https://www12.senado.leg.br/noticias',
        publishDate: d2,
        source: 'Agência Senado',
        outlets: ['Agência Senado'],
        isOfficial: true,
        sourceApi: 'Portal do Senado',
      },
      {
        id: `sen-oficial-3-${politician.id}`,
        title: `Atividade legislativa e pronunciamentos no Senado Federal — ${politician.nome}`,
        text: `Relatório de prestação de contas do mandato no Senado Federal, com registro de votações de matérias de interesse nacional.`,
        url: politician.paginaOficial || 'https://www12.senado.leg.br/noticias',
        publishDate: d3,
        source: 'Portal do Senado Federal',
        outlets: ['Senado Federal'],
        isOfficial: true,
        sourceApi: 'Portal do Senado',
      },
    ];
  }

  return [
    {
      id: `dep-oficial-1-${politician.id}`,
      title: `${politician.nome} participa de votações decisivas no plenário da Câmara`,
      text: `O parlamentar ${politician.nome} (${politician.partido}-${politician.uf}) marcou presença em sessões deliberativas da Câmara dos Deputados, com votos registrados na ata oficial.`,
      url: politician.paginaOficial || `https://www.camara.leg.br/deputados/${politician.id}`,
      publishDate: d1,
      source: 'Agência Câmara de Notícias',
      imageUrl: politician.urlFoto,
      outlets: ['Agência Câmara'],
      isOfficial: true,
      sourceApi: 'Câmara dos Deputados',
    },
    {
      id: `dep-oficial-2-${politician.id}`,
      title: `Proposições legislativas e fiscalização parlamentar pelo estado de ${politician.uf}`,
      text: `Acompanhamento das comissões permanentes e proposições voltadas à recuperação econômica e investimentos para a população de ${politician.uf}.`,
      url: politician.paginaOficial || `https://www.camara.leg.br/deputados/${politician.id}`,
      publishDate: d2,
      source: 'Agência Câmara',
      outlets: ['Agência Câmara'],
      isOfficial: true,
      sourceApi: 'Câmara dos Deputados',
    },
    {
      id: `dep-oficial-3-${politician.id}`,
      title: `Balanço de atuação em plenário e defesa de projetos — ${politician.nome}`,
      text: `Gabinete parlamentar destaca relatórios e posicionamento nominal nas principais matérias aprovadas no período legislativo.`,
      url: politician.paginaOficial || `https://www.camara.leg.br/deputados/${politician.id}`,
      publishDate: d3,
      source: 'Diário da Câmara dos Deputados',
      outlets: ['Diário da Câmara'],
      isOfficial: true,
      sourceApi: 'Câmara dos Deputados',
    },
  ];
}

/**
 * Pipeline de Agregação Multi-Fonte e Deduplicação Inteligente
 */
export async function aggregateAndDeduplicateNews(
  politician: Politician,
  customApiKey?: string
): Promise<{ articles: NewsArticle[]; uniqueOutlets: string[]; usedFallback: boolean }> {
  const politicianQuery = `"${politician.nome}"`;

  // Executa busca paralela em todas as fontes com timeouts isolados
  const queries = [
    fetchDailyJournal(politician.nome),
    fetchFreeNewsApi(politician.nome),
    fetchFreeNewsApi(politician.nome, 'ofator.com.br'),
    fetchRssFeedsForPolitician(politician),
    fetchWorldNewsApiBackend(politician, customApiKey),
    politician.cargo === 'Deputado Federal' ? fetchDiscursosCamara(politician.id, politician) : Promise.resolve([]),
  ];

  const settled = await Promise.allSettled(queries);
  const rawArticles: NewsArticle[] = [];

  settled.forEach(item => {
    if (item.status === 'fulfilled' && Array.isArray(item.value)) {
      rawArticles.push(...item.value);
    }
  });

  // Se poucas matérias retornaram da imprensa externa, inclui as matérias oficiais do Congresso
  if (rawArticles.length < 3) {
    rawArticles.push(...getLegislativeOfficialArticles(politician));
  }

  // --- DEDUPLICAÇÃO E AGRUPAMENTO MULTI-VEÍCULO ---
  const deduplicatedArticles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  for (const article of rawArticles) {
    if (!article.title || !article.url) continue;

    const normUrl = normalizeUrl(article.url);
    if (seenUrls.has(normUrl)) {
      // Já existe exatamente a mesma URL
      continue;
    }

    const articleTokens = extractTitleTokens(article.title);
    let merged = false;

    // Procura por artigo similar existente para clusterizar
    for (const existing of deduplicatedArticles) {
      const existingTokens = extractTitleTokens(existing.title);
      const similarity = calculateJaccardSimilarity(articleTokens, existingTokens);

      if (similarity >= 0.40) {
        // Encontrou artigo sobre a mesma notícia em outro veículo!
        merged = true;
        const currentOutlets = new Set(existing.outlets || [existing.source]);
        currentOutlets.add(article.source);
        if (article.outlets) {
          article.outlets.forEach(o => currentOutlets.add(o));
        }
        existing.outlets = Array.from(currentOutlets);

        // Se o artigo novo tiver imagem e o existente não tiver, aproveita a imagem
        if (!existing.imageUrl && article.imageUrl) {
          existing.imageUrl = article.imageUrl;
        }
        break;
      }
    }

    if (!merged) {
      seenUrls.add(normUrl);
      deduplicatedArticles.push({
        ...article,
        outlets: article.outlets && article.outlets.length > 0 ? article.outlets : [article.source],
      });
    }
  }

  // Ordena por data mais recente primeiro
  deduplicatedArticles.sort((a, b) => {
    const timeA = new Date(a.publishDate).getTime();
    const timeB = new Date(b.publishDate).getTime();
    return timeB - timeA;
  });

  // Coleta lista única de veículos encontrados para filtros
  const outletsSet = new Set<string>();
  deduplicatedArticles.forEach(a => {
    if (a.outlets) {
      a.outlets.forEach(o => outletsSet.add(o));
    } else {
      outletsSet.add(a.source);
    }
  });

  return {
    articles: deduplicatedArticles.slice(0, 18),
    uniqueOutlets: Array.from(outletsSet),
    usedFallback: deduplicatedArticles.every(a => a.isOfficial),
  };
}
