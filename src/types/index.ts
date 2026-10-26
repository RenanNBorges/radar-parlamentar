export type PoliticianRole = 'Deputado Federal' | 'Senador';

export interface DynamicMandateStatus {
  status: 'exercicio' | 'licenciado' | 'suplencia' | 'afastado' | 'concluido';
  rotulo: string;
  descricaoCurta: string;
  badgeCor: string;
  badgeBg: string;
  badgeBorder: string;
}

export interface ElectoralData {
  votosNominais: number;
  votosFormatados: string;
  percentualValidos: number;
  anoEleicao: number;
  rankingPosicao: string;
  totalVotosValidosUf: number;
  mandatoStatus: DynamicMandateStatus;
  fonteOficial: string;
}

export interface VoteExplanationDetails {
  proposta: string;
  significadoSim: string;
  significadoNao: string;
  impactoCidadao: string;
  posicionamento: string;
}

export interface VoteExplanation {
  voteId: string;
  titulo: string;
  proposicao?: string;
  ementa?: string;
  explicacao: string;
  details?: VoteExplanationDetails;
  isAiGenerated: boolean;
  timestamp: number;
  linkOficial: string;
}

export interface Politician {
  id: string | number;
  nome: string;
  nomeCivil?: string;
  cargo: PoliticianRole;
  partido: string;
  uf: string;
  urlFoto: string;
  email?: string;
  telefone?: string;
  gabinete?: string;
  dataPosse?: string;
  mandatoInicioAno: number;
  mandatoFimAno: number;
  situacao?: string;
  paginaOficial?: string;
  dadosEleitorais?: ElectoralData;
}

export interface UFInfo {
  id: number;
  sigla: string;
  nome: string;
  regiao: string;
}

export interface IBGEDataPoint {
  periodo: string;
  ano: number;
  valor: number;
  valorFormatado: string;
}

export interface IBGESeries {
  codigoTabela: number;
  nome: string;
  unidade: string;
  descricao: string;
  pontos: IBGEDataPoint[];
  ultimoValor: number;
  variacaoPeriodo?: number;
}

export interface VoteRecord {
  id: string;
  data: string;
  dataHoraFormatada: string;
  titulo: string;
  ementa: string;
  tipoVoto: 'Sim' | 'Não' | 'Abstenção' | 'Outro';
  votoOriginal: string;
  orgao: 'Câmara dos Deputados' | 'Senado Federal';
  linkProposicao?: string;
  linkOficial: string;
  ehVotoBancada?: boolean;
  temaId?: string;
  temaNome?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  text: string;
  url: string;
  publishDate: string;
  source: string;
  imageUrl?: string;
  isOfficial?: boolean;
  outlets?: string[];
  sourceApi?: string;
}

export interface AppSelection {
  uf: string;
  deputado: Politician | null;
  senadores: Politician[];
  worldNewsApiKey?: string;
}

