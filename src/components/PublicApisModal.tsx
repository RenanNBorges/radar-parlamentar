import React, { useState, useMemo, useEffect } from 'react';
import { ExternalLink, Database, Globe, Landmark, Shield, BarChart3, Radio, Search, CheckCircle2, Lock, X } from 'lucide-react';

interface PublicApisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ApiCategory = 'todas' | 'congresso' | 'ibge' | 'tse' | 'imprensa' | 'geo';

interface ApiItem {
  id: string;
  categoria: ApiCategory;
  categoriaRotulo: string;
  nome: string;
  orgao: string;
  url: string;
  icone: React.ComponentType<{ className?: string }>;
  corBadge: string;
  descricao: string;
  finalidadeRadar: string;
  endpoints: string[];
  periodicidade: string;
  formato: string;
  autenticacao: string;
  status: string;
}

const APIS_DATA: ApiItem[] = [
  {
    id: 'camara',
    categoria: 'congresso',
    categoriaRotulo: 'Congresso Nacional',
    nome: 'Câmara dos Deputados — Dados Abertos v2',
    orgao: 'Poder Legislativo Federal',
    url: 'https://dadosabertos.camara.leg.br',
    icone: Landmark,
    corBadge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    descricao:
      'Fornece a lista oficial da bancada estadual de 513 deputados federais, fotos de alta resolução, informações de gabinete, contatos oficiais e o registro das votações nominais em plenário.',
    finalidadeRadar:
      'Utilizada para carregar deputados por UF, seus mandatos oficiais e o histórico integral de deliberações plenárias e votos nominais.',
    endpoints: [
      'GET https://dadosabertos.camara.leg.br/api/v2/deputados?siglaUf={UF}',
      'GET https://dadosabertos.camara.leg.br/api/v2/deputados/{id}',
      'GET https://dadosabertos.camara.leg.br/api/v2/deputados/{id}/votacoes',
      'GET https://dadosabertos.camara.leg.br/api/v2/proposicoes/{id}/temas',
    ],
    periodicidade: 'Em tempo real a cada sessão deliberativa',
    formato: 'REST JSON (UTF-8)',
    autenticacao: 'Pública, sem necessidade de chave de API',
    status: 'Operacional e Oficial',
  },
  {
    id: 'senado',
    categoria: 'congresso',
    categoriaRotulo: 'Congresso Nacional',
    nome: 'Senado Federal — Dados Abertos',
    orgao: 'Poder Legislativo Federal',
    url: 'https://legis.senado.leg.br/dadosabertos',
    icone: Landmark,
    corBadge: 'bg-blue-50 text-blue-900 border-blue-300',
    descricao:
      'Alimenta os dados dos 3 senadores de cada Unidade da Federação, incluindo filiações partidárias, períodos de mandato de 8 anos, suplências em exercício e registros de deliberação nas sessões deliberativas.',
    finalidadeRadar:
      'Responsável por alimentar os senadores em exercício do estado selecionado e suas respectivas votações e matérias legislativas associadas.',
    endpoints: [
      'GET https://legis.senado.leg.br/dadosabertos/senador/lista/atual?uf={UF}',
      'GET https://legis.senado.leg.br/dadosabertos/senador/{id}/votacoes',
      'GET https://legis.senado.leg.br/dadosabertos/materia/{id}',
    ],
    periodicidade: 'Atualização contínua a cada sessão',
    formato: 'REST JSON / XML',
    autenticacao: 'Pública, sem restrição de acesso',
    status: 'Operacional e Oficial',
  },
  {
    id: 'ibge-sidra',
    categoria: 'ibge',
    categoriaRotulo: 'Socioeconômico IBGE',
    nome: 'IBGE SIDRA — Séries Estatísticas Temporais',
    orgao: 'Instituto Brasileiro de Geografia e Estatística',
    url: 'https://sidra.ibge.gov.br',
    icone: BarChart3,
    corBadge: 'bg-amber-50 text-amber-950 border-amber-300',
    descricao:
      'Sistema IBGE de Recuperação Automática utilizado para consultar a série histórica dos indicadores socioeconômicos de cada estado durante o período de mandato legislativo.',
    finalidadeRadar:
      'Alimenta a evolução tripla de cada estado: PIB Estadual a preços correntes (Tabela 6706), População Residente Estimada (Tabela 6579) e Taxa de Desocupação PNAD Contínua (Tabela 4714).',
    endpoints: [
      'GET https://apisidra.ibge.gov.br/values/t/6706/n3/{ufId}/v/all/p/all',
      'GET https://apisidra.ibge.gov.br/values/t/6579/n3/{ufId}/v/all/p/all',
      'GET https://apisidra.ibge.gov.br/values/t/4714/n3/{ufId}/v/4099/p/all',
    ],
    periodicidade: 'Anual (PIB/População) e Trimestral (PNAD)',
    formato: 'REST JSON estruturado',
    autenticacao: 'Livre e pública para toda a sociedade',
    status: 'Operacional e Oficial',
  },
  {
    id: 'ibge-localidades',
    categoria: 'ibge',
    categoriaRotulo: 'Socioeconômico IBGE',
    nome: 'IBGE Localidades — Divisão Territorial do Brasil',
    orgao: 'Instituto Brasileiro de Geografia e Estatística',
    url: 'https://servicodados.ibge.gov.br/api/docs/localidades',
    icone: Globe,
    corBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    descricao:
      'Padronização oficial das 27 Unidades Federativas do território nacional, fornecendo identificadores geográficos, nomes oficiais e correspondência de macrorregiões.',
    finalidadeRadar:
      'Garante a padronização das siglas de estados (UF), códigos do IBGE e metadados territoriais em todos os módulos da aplicação.',
    endpoints: [
      'GET https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
    ],
    periodicidade: 'Base consolidada permanente',
    formato: 'REST JSON',
    autenticacao: 'Pública e aberta',
    status: 'Operacional e Oficial',
  },
  {
    id: 'tse',
    categoria: 'tse',
    categoriaRotulo: 'Justiça Eleitoral',
    nome: 'Tribunal Superior Eleitoral (TSE) — DivulgaCandContas & Repositório',
    orgao: 'Justiça Eleitoral do Brasil',
    url: 'https://divulgacandcontas.tse.jus.br',
    icone: Shield,
    corBadge: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    descricao:
      'Repositório oficial de candidaturas, prestação de contas e resultados eleitorais das eleições gerais de 2022 e 2018 para o Congresso Nacional.',
    finalidadeRadar:
      'Permite exibir a quantidade exata de votos nominais recebidos por cada parlamentar na urna eletrônica, seu percentual sobre os votos válidos no estado e o status dinâmico do mandato.',
    endpoints: [
      'GET https://dadosabertos.tse.jus.br/dataset/resultados-2022',
      'GET https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2022/{UF}/7/candidatos',
    ],
    periodicidade: 'Definido a cada pleito eleitoral e homologação de mandatos',
    formato: 'REST JSON / CSV aberto',
    autenticacao: 'Pública oficial',
    status: 'Operacional e Oficial',
  },
  {
    id: 'imprensa-agregador',
    categoria: 'imprensa',
    categoriaRotulo: 'Imprensa & Feeds',
    nome: 'Agregador Multi-Fonte de Imprensa Cívica',
    orgao: 'Daily Journal, FreeNewsApi, O Fator, Feeds RSS (G1, Folha, Estadão, Poder360) e World News',
    url: 'https://dailyjournal.news',
    icone: Database,
    corBadge: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    descricao:
      'Módulo de consulta concorrente que agrega notícias de múltiplos provedores e feeds RSS consolidados em língua portuguesa, com algoritmo de deduplicação semântica por similaridade de título (Jaccard).',
    finalidadeRadar:
      'Elimina a dependência de um único provedor ou chave de API, garantindo ampla pluralidade de fontes jornalísticas e cobertura política de cada parlamentar sem custo ao usuário.',
    endpoints: [
      'GET /api/news?nome={nome}&cargo={cargo}&partido={partido}&uf={uf}',
      'GET https://dailyjournal.news/api/public/news?q={termo}',
      'GET https://freenewsapi.ai/v1/search?q={termo}',
      'GET Feeds RSS: g1.globo.com, folha.uol.com.br, estadao.com.br, poder360.com.br',
    ],
    periodicidade: 'Atualização contínua a cada consulta com cache de servidor',
    formato: 'REST JSON unificado e normalizado',
    autenticacao: 'Transparente no servidor (sem requisição de chave ao cidadão)',
    status: 'Agregação Paralela Ativa',
  },
  {
    id: 'osm-nominatim',
    categoria: 'geo',
    categoriaRotulo: 'Geolocalização',
    nome: 'OpenStreetMap Nominatim — Geocodificação Reversa',
    orgao: 'OpenStreetMap Foundation',
    url: 'https://nominatim.openstreetmap.org',
    icone: Radio,
    corBadge: 'bg-teal-50 text-teal-900 border-teal-300',
    descricao:
      'Serviço livre e aberto que converte as coordenadas geográficas de latitude e longitude do dispositivo do usuário em estado brasileiro correspondente (código ISO 3166-2:BR).',
    finalidadeRadar:
      'Detecta automaticamente o estado do usuário ao autorizar a localização no primeiro acesso, selecionando imediatamente a bancada representativa correspondente.',
    endpoints: [
      'GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}',
    ],
    periodicidade: 'Sob demanda por consentimento explícito',
    formato: 'REST JSON',
    autenticacao: 'Aberta, com identificação de User-Agent',
    status: 'Operacional e Gratuito',
  },
];

const TABS_CONFIG: { id: ApiCategory; rotulo: string }[] = [
  { id: 'todas', rotulo: 'Todas as Fontes' },
  { id: 'congresso', rotulo: 'Congresso Nacional' },
  { id: 'ibge', rotulo: 'Socioeconômico IBGE' },
  { id: 'tse', rotulo: 'Justiça Eleitoral' },
  { id: 'imprensa', rotulo: 'Imprensa & Feeds' },
  { id: 'geo', rotulo: 'Geolocalização' },
];

export const PublicApisModal: React.FC<PublicApisModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<ApiCategory>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Fecha com tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reseta estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab('todas');
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filtra as APIs com useMemo (sempre chamado incondicionalmente)
  const filteredApis = useMemo(() => {
    return APIS_DATA.filter(api => {
      if (activeTab !== 'todas' && api.categoria !== activeTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = api.nome.toLowerCase().includes(query);
        const matchesOrgao = api.orgao.toLowerCase().includes(query);
        const matchesDesc = api.descricao.toLowerCase().includes(query);
        const matchesEndpoints = api.endpoints.some(ep => ep.toLowerCase().includes(query));
        return matchesName || matchesOrgao || matchesDesc || matchesEndpoints;
      }
      return true;
    });
  }, [activeTab, searchTerm]);

  const tabsWithCounts = useMemo(() => {
    return TABS_CONFIG.map(tab => ({
      ...tab,
      count: tab.id === 'todas' ? APIS_DATA.length : APIS_DATA.filter(a => a.categoria === tab.id).length,
    }));
  }, []);

  // Retorno antecipado após todos os hooks serem registrados
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-apis-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfbf9] rounded-2xl shadow-2xl border border-[#E5E0D8] max-w-4xl w-full my-6 flex flex-col overflow-hidden text-slate-900 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Friso Tricolor Institucional */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="h-full w-1/3 bg-emerald-800" />
          <div className="h-full w-1/3 bg-amber-500" />
          <div className="h-full w-1/3 bg-blue-800" />
        </div>

        {/* Topo do Modal */}
        <div className="p-6 sm:p-8 pb-4 border-b border-[#E5E0D8] bg-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                <Shield className="w-4 h-4 text-emerald-800" />
                <span>Transparência Pública e Soberania do Cidadão</span>
              </div>
              <h2 id="modal-apis-title" className="text-2xl sm:text-3xl font-bold text-slate-900 font-editorial">
                APIs Públicas e Fontes de Dados
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                O <strong>Radar Parlamentar</strong> opera com dados governamentais abertos e feeds públicos de notícias. Conheça as 7 fontes integradas, seus endpoints e sua periodicidade oficial.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela de APIs"
              className="text-slate-400 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Filtros e Busca */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Abas de Categorias */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#f5f2eb] p-1 rounded-xl border border-[#E5E0D8] overflow-x-auto">
              {tabsWithCounts.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-2xs border border-[#E5E0D8]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.rotulo}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      activeTab === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Input de Busca */}
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome ou endpoint…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E5E0D8] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-400 text-slate-900 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de APIs da Aba Selecionada */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[60vh] space-y-4">
          {filteredApis.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">Nenhuma API encontrada para "{searchTerm}"</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('todas');
                }}
                className="text-xs text-emerald-900 font-bold underline cursor-pointer"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            filteredApis.map(api => {
              const Icone = api.icone;
              return (
                <div
                  key={api.id}
                  className="bg-white rounded-xl border border-[#E5E0D8] p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0 border border-slate-200">
                        <Icone className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            {api.categoriaRotulo}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {api.orgao}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            {api.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {api.nome}
                        </h3>
                      </div>
                    </div>

                    <a
                      href={api.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors self-start shrink-0"
                    >
                      <span>Documentação Oficial</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-800" />
                    </a>
                  </div>

                  {/* Descrição e Aplicação no Radar */}
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {api.descricao}
                  </p>

                  <div className="p-3 bg-[#fbf9f5] rounded-lg border border-[#E5E0D8] text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-slate-900 block">Como o Radar utiliza:</span>
                    <p>{api.finalidadeRadar}</p>
                  </div>

                  {/* Metadados Técnicos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 block">Periodicidade:</span>
                      <span>{api.periodicidade}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 block">Formato:</span>
                      <span>{api.formato}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900 block">Acesso:</span>
                      <span>{api.autenticacao}</span>
                    </div>
                  </div>

                  {/* Endpoints Públicos Utilizados */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Endpoints integrados:
                    </span>
                    <div className="space-y-1">
                      {api.endpoints.map((ep, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100/80 text-slate-800 border border-slate-200 break-all"
                        >
                          {ep}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé com Garantia LGPD e Privacidade */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              Privacidade: O Radar Parlamentar não armazena cookies de rastreamento nem transfere seus dados pessoais a terceiros.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
          >
            Fechar Guia de APIs
          </button>
        </div>
      </div>
    </div>
  );
};
