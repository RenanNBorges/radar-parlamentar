import { VoteRecord, Politician, VoteExplanationDetails } from '../types';

const CACHE_PREFIX = 'explicacao_votacao_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos

export interface ExplanationResult {
  explicacao: string;
  details?: VoteExplanationDetails;
  isAiGenerated: boolean;
  source: 'groq' | 'cache' | 'fallback';
}

interface StoredExplanationPayload {
  voteId: string;
  explicacao: string;
  details?: VoteExplanationDetails;
  isAiGenerated?: boolean;
  timestamp: number;
}

/**
 * Tenta extrair as 4 seções principais de um texto em Markdown caso venha como texto corrido
 */
export function parseSectionsFromMarkdown(text: string): VoteExplanationDetails {
  const sections: VoteExplanationDetails = {
    proposta: '',
    significadoSim: '',
    significadoNao: '',
    impactoCidadao: '',
    posicionamento: '',
  };

  if (!text) return sections;

  const lines = text.split('\n');
  let currentKey: keyof VoteExplanationDetails | null = null;
  const buffers: Record<string, string[]> = {
    proposta: [],
    significadoSim: [],
    significadoNao: [],
    impactoCidadao: [],
    posicionamento: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    if (lower.includes('propõe') || lower.includes('proposta') || lower.includes('o que é') || lower.includes('define na prática')) {
      currentKey = 'proposta';
      continue;
    } else if (lower.includes('a favor') || lower.includes('voto sim') || lower.includes('(sim)')) {
      currentKey = 'significadoSim';
      continue;
    } else if (lower.includes('contra') || lower.includes('voto não') || lower.includes('(não)')) {
      currentKey = 'significadoNao';
      continue;
    } else if (lower.includes('impacto') || lower.includes('cotidiano') || lower.includes('dia a dia') || lower.includes('população')) {
      currentKey = 'impactoCidadao';
      continue;
    } else if (lower.includes('posicionamento') || lower.includes('parlamentar') || lower.includes('político')) {
      currentKey = 'posicionamento';
      continue;
    }

    if (currentKey && trimmed) {
      buffers[currentKey].push(trimmed);
    }
  }

  sections.proposta = buffers.proposta.join(' ').trim();
  sections.significadoSim = buffers.significadoSim.join(' ').trim();
  sections.significadoNao = buffers.significadoNao.join(' ').trim();
  sections.impactoCidadao = buffers.impactoCidadao.join(' ').trim();
  sections.posicionamento = buffers.posicionamento.join(' ').trim();

  // Se o parser não capturou seções distintas, divide por parágrafos
  if (!sections.proposta && !sections.significadoSim) {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    if (paragraphs.length >= 1) sections.proposta = paragraphs[0].trim();
    if (paragraphs.length >= 2) sections.significadoSim = paragraphs[1].trim();
    if (paragraphs.length >= 3) sections.significadoNao = paragraphs[2].trim();
    if (paragraphs.length >= 4) sections.impactoCidadao = paragraphs[3].trim();
    if (paragraphs.length >= 5) sections.posicionamento = paragraphs[4].trim();
  }

  return sections;
}

/**
 * Consulta a explicação em cache local (localStorage) respeitando o TTL de 7 dias
 */
export function getCachedExplanation(voteId: string): { explicacao: string; details?: VoteExplanationDetails; isAiGenerated?: boolean } | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${voteId}`);
    if (!raw) return null;
    const parsed: StoredExplanationPayload = JSON.parse(raw);
    const now = Date.now();
    if (parsed.timestamp && now - parsed.timestamp < CACHE_TTL_MS && parsed.explicacao) {
      return {
        explicacao: parsed.explicacao,
        details: parsed.details || parseSectionsFromMarkdown(parsed.explicacao),
        isAiGenerated: parsed.isAiGenerated,
      };
    }
    // Expirou
    localStorage.removeItem(`${CACHE_PREFIX}${voteId}`);
  } catch (err) {
    console.warn('Erro ao ler cache de explicação de voto:', err);
  }
  return null;
}

/**
 * Salva a explicação no cache local com timestamp e detalhes estruturados
 */
export function setCachedExplanation(
  voteId: string,
  explicacao: string,
  details?: VoteExplanationDetails,
  isAiGenerated: boolean = false
): void {
  try {
    const payload: StoredExplanationPayload = {
      voteId,
      explicacao,
      details: details || parseSectionsFromMarkdown(explicacao),
      isAiGenerated,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_PREFIX}${voteId}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Erro ao salvar no localStorage:', err);
  }
}

/**
 * Gera explicação cívica aprofundada quando a API externa estiver offline
 */
function generateCivicFallbackExplanation(
  vote: VoteRecord,
  politician?: Politician
): { explicacao: string; details: VoteExplanationDetails } {
  const tema = vote.temaNome || 'Legislação e Interesse Público';
  const voto = vote.votoOriginal || vote.tipoVoto;
  const parlamentarNome = politician?.nome || 'o parlamentar';
  const orgao = vote.orgao || 'Congresso Nacional';

  const proposta = `A matéria (${vote.titulo}) tramita sob a área de ${tema} no ${orgao}. Na prática, o texto normativo tem o objetivo de deliberar sobre: "${vote.ementa}". O projeto estabelece parâmetros formais para a administração pública federal, fixando critérios de aplicação orçamentária ou deveres legais para os setores regulados.`;

  const significadoSim = `Votar a favor (SIM) significava apoiar a criação, consolidação ou avanço das novas diretrizes estipuladas na proposta. Defensores do projeto sustentavam que a medida atualiza regras obsoletas, confere maior previsibilidade às políticas de ${tema} e assegura instrumentos práticos para que o Poder Público atenda demandas prioritárias da sociedade.`;

  const significadoNao = `Votar contra (NÃO) significava rejeitar as obrigações ou alterações trazidas pelo texto, defendendo a manutenção da legislação atualmente em vigor. Os parlamentares que votaram contra apontaram preocupações como eventuais impactos fiscais nos cofres públicos, burocracia desnecessária ou a conveniência de aguardar uma proposta mais madura e consensual.`;

  const impactoCidadao = `Para o cotidiano dos cidadãos brasileiros, deliberações sobre ${tema} impactam a eficiência dos serviços prestados pelo Estado, o uso responsável dos tributos arrecadados e as garantias fundamentais da população. A aprovação autoriza novas condutas e investimentos, ao passo que a rejeição barra novas exigências legais ou gastos públicos correlatos.`;

  const posicionamento = `${parlamentarNome} registrou o voto nominal "${voto}" nesta votação. Esse posicionamento somou-se aos votos de sua bancada na contagem final do plenário da ${orgao}, exercendo papel ativo na definição de aprovação ou rejeição da matéria.`;

  const explicacao = `### O que a matéria propõe na prática\n${proposta}\n\n### O que significava votar a favor (SIM)\n${significadoSim}\n\n### O que significava votar contra (NÃO)\n${significadoNao}\n\n### Impacto no cotidiano do cidadão\n${impactoCidadao}\n\n### Posicionamento do parlamentar\n${posicionamento}`;

  return {
    explicacao,
    details: {
      proposta,
      significadoSim,
      significadoNao,
      impactoCidadao,
      posicionamento,
    },
  };
}

/**
 * Solicita ou recupera a explicação de uma votação nominal
 */
export async function fetchVoteExplanation(
  vote: VoteRecord,
  politician?: Politician
): Promise<ExplanationResult> {
  // 1. Verifica cache local do navegador
  const cached = getCachedExplanation(vote.id);
  if (cached) {
    return {
      explicacao: cached.explicacao,
      details: cached.details,
      isAiGenerated: Boolean(cached.isAiGenerated),
      source: 'cache',
    };
  }

  // 2. Tenta obter via backend (API Groq com fallback)
  try {
    const res = await fetch('/api/explain-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voteId: vote.id,
        titulo: vote.titulo,
        ementa: vote.ementa,
        orgao: vote.orgao,
        tipoVoto: vote.tipoVoto,
        votoOriginal: vote.votoOriginal,
        tema: vote.temaNome,
        data: vote.dataHoraFormatada,
        politicianName: politician?.nome,
        politicianCargo: politician?.cargo,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.explicacao) {
        const details = data.details || parseSectionsFromMarkdown(data.explicacao);
        setCachedExplanation(vote.id, data.explicacao, details, Boolean(data.isAiGenerated));
        return {
          explicacao: data.explicacao,
          details,
          isAiGenerated: Boolean(data.isAiGenerated),
          source: data.source || 'groq',
        };
      }
    }
  } catch (err) {
    console.warn('Chamada a /api/explain-vote falhou:', err);
  }

  // 3. Fallback cívico consistente e estruturado
  const fallback = generateCivicFallbackExplanation(vote, politician);
  setCachedExplanation(vote.id, fallback.explicacao, fallback.details, false);
  return {
    explicacao: fallback.explicacao,
    details: fallback.details,
    isAiGenerated: false,
    source: 'fallback',
  };
}
