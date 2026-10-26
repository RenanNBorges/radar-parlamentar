import { VoteRecord } from '../types';

export interface ThematicArea {
  id: string;
  nome: string;
  siglaCurta: string;
  descricao: string;
  keywords: string[];
}

export const THEMATIC_AREAS: ThematicArea[] = [
  {
    id: 'economia',
    nome: 'Economia e Finanças',
    siglaCurta: 'Economia',
    descricao: 'Tributação, orçamento público, política fiscal, créditos e sistema financeiro.',
    keywords: ['tribut', 'impost', 'fiscal', 'orçament', 'finan', 'pib', 'receita', 'despesa', 'infla', 'crédito', 'moeda', 'icms', 'reforma tributária', 'dívida', 'banco', 'subsíd'],
  },
  {
    id: 'saude',
    nome: 'Saúde e Seguridade',
    siglaCurta: 'Saúde',
    descricao: 'Sistema Único de Saúde (SUS), assistência farmacêutica, hospitais e vigilância.',
    keywords: ['saúde', 'sus', 'hospital', 'médic', 'remédio', 'medicamento', 'vacina', 'sanitár', 'epidemia', 'doença', 'enferm', 'farmác'],
  },
  {
    id: 'educacao',
    nome: 'Educação e Cultura',
    siglaCurta: 'Educação',
    descricao: 'Ensino básico e superior, universidades, Fundeb, bolsas de estudo e patrimônio cultural.',
    keywords: ['educa', 'escola', 'ensino', 'universi', 'professor', 'fundeb', 'creche', 'pedagóg', 'aluno', 'estudante', 'cultura', 'patrimônio', 'livro', 'cinema'],
  },
  {
    id: 'seguranca',
    nome: 'Segurança e Justiça',
    siglaCurta: 'Segurança',
    descricao: 'Legislação penal, segurança pública, policiamento, combate ao crime e sistema prisional.',
    keywords: ['seguran', 'crime', 'penal', 'polícia', 'presídi', 'arma', 'justiç', 'tráfico', 'violên', 'código penal', 'tribunal', 'magistr', 'delito'],
  },
  {
    id: 'meio_ambiente',
    nome: 'Meio Ambiente e Agro',
    siglaCurta: 'Meio Ambiente',
    descricao: 'Sustentabilidade, recursos hídricos, proteção florestal, agronegócio e clima.',
    keywords: ['ambient', 'floresta', 'clima', 'desmat', 'sustent', 'água', 'rio', 'fauna', 'flora', 'agro', 'agrícol', 'rural', 'safra', 'indígen', 'energia renov'],
  },
  {
    id: 'direitos_humanos',
    nome: 'Direitos Humanos',
    siglaCurta: 'Dir. Humanos',
    descricao: 'Cidadania, igualdade de gênero, combate ao racismo e proteção a vulneráveis.',
    keywords: ['direitos humanos', 'mulher', 'violência contra a mulher', 'negro', 'racismo', 'igualdade', 'criança', 'adolescent', 'idoso', 'deficiên', 'acessibil', 'cidadan', 'liberdade'],
  },
  {
    id: 'infraestrutura',
    nome: 'Infraestrutura e Transportes',
    siglaCurta: 'Infraestrutura',
    descricao: 'Obras públicas, malha rodoviária e ferroviária, saneamento básico, energia e portos.',
    keywords: ['infra', 'transporte', 'rodovi', 'ferrovi', 'porto', 'aeroporto', 'saneamento', 'energia', 'elétric', 'logística', 'concess', 'obra pública', 'telecom'],
  },
  {
    id: 'trabalho',
    nome: 'Trabalho e Previdência',
    siglaCurta: 'Trabalho',
    descricao: 'Relações trabalhistas, geração de empregos, aposentadorias e previdência social.',
    keywords: ['trabalh', 'empreg', 'salário', 'clt', 'previdên', 'inss', 'aposent', 'aposentadoria', 'benefício', 'sindic', 'estágio', 'renda'],
  },
];

export interface ThematicScore {
  areaId: string;
  areaNome: string;
  siglaCurta: string;
  totalVotos: number;
  votosSim: number;
  votosNao: number;
  votosOutros: number;
  taxaAprovacao: number | null; // % de votos Sim (0 a 100), ou null se dados insuficientes
  dadosInsuficientes: boolean;
  proposicoes: { titulo: string; voto: string; ementa: string }[];
}

/**
 * Identifica a quais áreas temáticas uma votação pertence com base no título e ementa
 */
export function identifyThemesForVote(vote: VoteRecord): ThematicArea[] {
  const text = `${vote.titulo} ${vote.ementa}`.toLowerCase();
  const matched: ThematicArea[] = [];

  for (const area of THEMATIC_AREAS) {
    const hasMatch = area.keywords.some(kw => text.includes(kw));
    if (hasMatch) {
      matched.push(area);
    }
  }

  // Se nenhuma palavra-chave pontuar, atribui à categoria de Economia ou Segurança como temas gerais se couber
  if (matched.length === 0) {
    if (text.includes('lei') || text.includes('art') || text.includes('constitui')) {
      matched.push(THEMATIC_AREAS[0]); // Economia/Geral
    } else {
      matched.push(THEMATIC_AREAS[3]); // Segurança/Institucional
    }
  }

  return matched;
}

/**
 * Atribui o tema principal a um registro de voto
 */
export function assignPrimaryThemeToVote(vote: VoteRecord): VoteRecord {
  const themes = identifyThemesForVote(vote);
  const primary = themes[0] || THEMATIC_AREAS[0];
  return {
    ...vote,
    temaId: primary.id,
    temaNome: primary.siglaCurta,
  };
}


/**
 * Calcula o perfil temático completo do parlamentar a partir do seu conjunto de votações
 */
export function calculateThematicProfile(votes: VoteRecord[]): ThematicScore[] {
  const scoresByArea: Record<string, ThematicScore> = {};

  // Inicializa áreas
  THEMATIC_AREAS.forEach(area => {
    scoresByArea[area.id] = {
      areaId: area.id,
      areaNome: area.nome,
      siglaCurta: area.siglaCurta,
      totalVotos: 0,
      votosSim: 0,
      votosNao: 0,
      votosOutros: 0,
      taxaAprovacao: null,
      dadosInsuficientes: true,
      proposicoes: [],
    };
  });

  // Agrega cada votação aos temas correspondentes
  votes.forEach(v => {
    const matchedThemes = identifyThemesForVote(v);
    const isSim = v.tipoVoto === 'Sim';
    const isNao = v.tipoVoto === 'Não';

    matchedThemes.forEach(theme => {
      const entry = scoresByArea[theme.id];
      if (entry) {
        entry.totalVotos += 1;
        if (isSim) entry.votosSim += 1;
        else if (isNao) entry.votosNao += 1;
        else entry.votosOutros += 1;

        if (entry.proposicoes.length < 5) {
          entry.proposicoes.push({
            titulo: v.titulo,
            voto: v.votoOriginal,
            ementa: v.ementa,
          });
        }
      }
    });
  });

  // Calcula taxa de aprovação final para cada área
  return THEMATIC_AREAS.map(area => {
    const item = scoresByArea[area.id];
    const votosValidos = item.votosSim + item.votosNao;

    // Regra: se tiver pelo menos 1 voto válido, calcula o percentual
    if (votosValidos >= 1) {
      const taxa = Math.round((item.votosSim / votosValidos) * 100);
      return {
        ...item,
        taxaAprovacao: taxa,
        dadosInsuficientes: votosValidos < 2,
      };
    }

    // Sem votos suficientes
    return {
      ...item,
      taxaAprovacao: null,
      dadosInsuficientes: true,
    };
  });
}
