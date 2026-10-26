/**
 * Módulo de explicação de votações nominais (lado do servidor).
 *
 * Reúne toda a regra de negócio da rota POST /api/explain-vote para que ela
 * seja reaproveitada tanto pelo servidor Express local (server.ts) quanto pela
 * função serverless da Vercel (api/explain-vote.ts).
 *
 * Fluxo: cache em memória (7 dias) -> API Groq (modelo Llama 3.3) -> texto-base
 * estruturado quando a API externa não responde ou a cota é excedida.
 */

export interface VoteExplanationDetails {
  proposta: string;
  significadoSim: string;
  significadoNao: string;
  impactoCidadao: string;
  posicionamento: string;
}

interface CachedVoteExplanation {
  explanation: string;
  details?: VoteExplanationDetails;
  isAiGenerated: boolean;
  timestamp: number;
}

export interface ExplainVoteInput {
  voteId?: string | number;
  titulo?: string;
  ementa?: string;
  orgao?: string;
  tipoVoto?: string;
  votoOriginal?: string;
  tema?: string;
  data?: string;
  politicianName?: string;
  politicianCargo?: string;
}

export interface ExplainVoteResult {
  status: number;
  body: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias
const RATE_LIMIT_PER_MINUTE = 25; // respeita a camada gratuita da Groq
const REQUEST_TIMEOUT_MS = 10_000;

// Cache e controle de taxa vivem na memória da instância. Em ambiente serverless
// eles valem enquanto a instância estiver "quente"; o cache do navegador
// (localStorage) complementa essa camada.
const explanationCache = new Map<string, CachedVoteExplanation>();
const requestTimestamps: number[] = [];

/** Janela deslizante de 60 s: retorna false quando a cota por minuto acabou. */
function checkRateLimit(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 60_000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT_PER_MINUTE) return false;
  requestTimestamps.push(now);
  return true;
}

// ---------------------------------------------------------------------------
// Montagem de textos
// ---------------------------------------------------------------------------

/** Converte os cinco campos estruturados no texto em Markdown exibido na tela. */
function toMarkdown(d: VoteExplanationDetails): string {
  return (
    `### O que a matéria propõe na prática\n${d.proposta}\n\n` +
    `### O que significava votar a favor (SIM)\n${d.significadoSim}\n\n` +
    `### O que significava votar contra (NÃO)\n${d.significadoNao}\n\n` +
    `### Impacto no cotidiano do cidadão\n${d.impactoCidadao}\n\n` +
    `### Posicionamento do parlamentar\n${d.posicionamento}`
  );
}

/** Texto-base neutro usado quando a API externa não está disponível. */
export function buildFallbackExplanation(input: ExplainVoteInput) {
  const { titulo, ementa, orgao, tipoVoto, votoOriginal, tema, politicianName } = input;
  const temaStr = tema || 'Legislação e Interesse Público';
  const votoStr = votoOriginal || tipoVoto || 'Registrado';
  const nomeStr = politicianName || 'o parlamentar';
  const orgaoStr = orgao || 'Congresso Nacional';

  const details: VoteExplanationDetails = {
    proposta: `A matéria (${titulo || 'deliberação em plenário'}) tramita na área temática de ${temaStr}. Seu objetivo normativo central é regular o seguinte dispositivo federal: "${ementa || 'atualização de diretrizes legais e orçamentárias'}". Na prática, estabelece critérios formais de execução, define competências institucionais e reorganiza obrigações legais pertinentes ao setor.`,
    significadoSim: `Votar a favor (SIM) significava apoiar a promulgação ou o prosseguimento das novas medidas previstas no texto. Quem defendeu o projeto sustentava que a medida moderniza os marcos regulatórios vigentes, destina recursos com maior clareza para prioridades da pasta e confere segurança jurídica aos órgãos executores e beneficiários das políticas públicas.`,
    significadoNao: `Votar contra (NÃO) significava manter as regras e limites da legislação atual, rejeitando os dispositivos propostos nesta redação. Os parlamentares contrários argumentavam que o texto poderia onerar os cofres públicos, criar exigências burocráticas excessivas para a sociedade ou precisava de correções profundas antes de se tornar lei definitiva.`,
    impactoCidadao: `Para a população e o país, matérias deste teor afetam diretamente a qualidade da prestação de serviços públicos, o equilíbrio das contas federais e os direitos dos cidadãos. A aprovação acelera a aplicação dos novos instrumentos regulatórios, enquanto a rejeição preserva o status quo legal, evitando a criação de novos encargos ou procedimentos.`,
    posicionamento: `${nomeStr} registrou formalmente o voto "${votoStr}" no plenário da ${orgaoStr}. Esse posicionamento somou-se à bancada para a composição do quórum decisório que definiu a aprovação, rejeição ou arquivamento desta matéria na Casa legislativa.`,
  };

  return { explicacao: toMarkdown(details), details };
}

/** Monta o prompt enviado ao modelo de linguagem. */
function buildPrompt(input: ExplainVoteInput): string {
  const { titulo, ementa, orgao, tipoVoto, votoOriginal, tema, data, politicianName, politicianCargo } = input;
  const voto = votoOriginal || tipoVoto;
  return `Você é um consultor legislativo e analista cívico neutro do Congresso Nacional brasileiro.
Analise a seguinte votação nominal em linguagem clara, direta e acessível ao cidadão comum brasileiro:

- Matéria: ${titulo || 'Deliberação Legislativa'}
- Ementa oficial: ${ementa || 'Deliberação em plenário'}
- Tema: ${tema || 'Interesse Público'}
- Casa Legislativa: ${orgao || 'Congresso Nacional'}
- Data: ${data || 'Legislatura recente'}
${politicianName ? `- Parlamentar avaliado: ${politicianName} (${politicianCargo || 'Parlamentar'})\n- Voto nominal registrado: ${voto}` : ''}

Retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown de código e sem texto antes ou depois) com o seguinte esquema:
{
  "proposta": "Explicação em 2 a 3 frases claras de o que este projeto propõe na prática, qual lei ou política pública ele altera e qual problema pretende sanar.",
  "significadoSim": "O que significava votar A FAVOR (SIM): principais argumentos dos defensores, o que entra em vigor com a aprovação e quem é beneficiado.",
  "significadoNao": "O que significava votar CONTRA (NÃO): principais preocupações dos opositores (ex: custos fiscais, burocracia, riscos de normas) e por que defenderam manter a regra atual.",
  "impactoCidadao": "De que forma essa decisão mexe na vida real da população (serviços públicos, impostos, direitos, economia ou segurança).",
  "posicionamento": "O que o voto ${voto} de ${politicianName || 'o parlamentar'} representou na correlação de forças e quórum da Casa."
}`;
}

// ---------------------------------------------------------------------------
// Chamada à API Groq
// ---------------------------------------------------------------------------

/** Consulta a Groq e devolve os campos validados, ou null em qualquer falha. */
async function askGroq(input: ExplainVoteInput, apiKey: string): Promise<VoteExplanationDetails | null> {
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Você é um consultor legislativo e analista cívico institucional brasileiro. Suas análises são rigorosamente equilibradas, neutras, factuais e explicam tanto o lado favorável quanto o contrário com igual clareza. Responda em JSON válido.',
          },
          { role: 'user', content: buildPrompt(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 650,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 429) console.warn('Limite de taxa da Groq (429) excedido; usando texto-base.');
      return null;
    }

    const json: any = await response.json();
    const raw: string | undefined = json?.choices?.[0]?.message?.content;
    if (!raw || raw.trim().length < 30) return null;

    const parsed = JSON.parse(raw.trim());
    if (!parsed.proposta || !parsed.significadoSim || !parsed.significadoNao) return null;

    return {
      proposta: parsed.proposta,
      significadoSim: parsed.significadoSim,
      significadoNao: parsed.significadoNao,
      impactoCidadao: parsed.impactoCidadao || '',
      posicionamento: parsed.posicionamento || '',
    };
  } catch (err) {
    console.warn('Erro ao consultar a API Groq:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Ponto de entrada
// ---------------------------------------------------------------------------

/**
 * Gera (ou recupera do cache) a explicação de uma votação.
 * Devolve o código HTTP e o corpo JSON que o adaptador da rota deve responder.
 */
export async function explainVote(input: ExplainVoteInput | undefined | null): Promise<ExplainVoteResult> {
  const body = input || {};
  if (!body.voteId) {
    return { status: 400, body: { error: 'Parâmetro "voteId" é obrigatório.' } };
  }
  const cacheKey = String(body.voteId);

  // 1. Cache em memória
  const cached = explanationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      status: 200,
      body: {
        explicacao: cached.explanation,
        details: cached.details,
        isAiGenerated: cached.isAiGenerated,
        source: 'cache',
      },
    };
  }

  // 2. Groq (somente com chave configurada e dentro da cota por minuto)
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (apiKey && apiKey.length > 5 && checkRateLimit()) {
    const details = await askGroq(body, apiKey);
    if (details) {
      const explanation = toMarkdown(details);
      explanationCache.set(cacheKey, { explanation, details, isAiGenerated: true, timestamp: Date.now() });
      return {
        status: 200,
        body: { explicacao: explanation, details, isAiGenerated: true, source: 'groq' },
      };
    }
  }

  // 3. Texto-base neutro
  const fallback = buildFallbackExplanation(body);
  explanationCache.set(cacheKey, {
    explanation: fallback.explicacao,
    details: fallback.details,
    isAiGenerated: false,
    timestamp: Date.now(),
  });
  return {
    status: 200,
    body: { explicacao: fallback.explicacao, details: fallback.details, isAiGenerated: false, source: 'fallback' },
  };
}
