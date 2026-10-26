import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Building,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Newspaper,
  Clock,
  FileText,
  Compass,
  Vote,
  Award,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Politician, VoteRecord, NewsArticle, IBGESeries, VoteExplanationDetails } from '../types';
import { getPartyMeta, fetchVotacoesDeputado, fetchVotacoesSenador, fetchDeputadoDetalhes } from '../services/congressService';
import { fetchEstadoIndicadoresMandato } from '../services/ibgeService';
import { fetchPoliticianNews } from '../services/newsService';
import { calculateThematicProfile, assignPrimaryThemeToVote, THEMATIC_AREAS } from '../services/thematicAnalysis';
import { getElectoralData, ElectoralData } from '../services/electionService';
import { fetchVoteExplanation } from '../services/voteExplanationService';
import { AnimatedCounter } from './AnimatedCounter';
import { LineChart } from './LineChart';
import { PartyLogo } from './PartyLogo';
import { ThematicRadarChart } from './ThematicRadarChart';
import { VoteExplanationModal } from './VoteExplanationModal';

interface PoliticianDetailViewProps {
  politician: Politician;
  worldNewsApiKey?: string;
  onBack: () => void;
}

export const PoliticianDetailView: React.FC<PoliticianDetailViewProps> = ({
  politician,
  worldNewsApiKey,
  onBack,
}) => {
  const [details, setDetails] = useState<Partial<Politician>>({});
  const [indicadores, setIndicadores] = useState<{
    pib: IBGESeries;
    pop: IBGESeries;
    desocupacao: IBGESeries;
  } | null>(null);
  const [votacoes, setVotacoes] = useState<VoteRecord[]>([]);
  const [noticias, setNoticias] = useState<NewsArticle[]>([]);
  const [newsOutlets, setNewsOutlets] = useState<string[]>([]);
  const [usedNewsFallback, setUsedNewsFallback] = useState(false);

  const [isLoadingIBGE, setIsLoadingIBGE] = useState(true);
  const [isLoadingVotes, setIsLoadingVotes] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // Filtros de Votação
  const [voteFilter, setVoteFilter] = useState<'Todos' | 'Sim' | 'Não' | 'Abstenção'>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [visibleVotesCount, setVisibleVotesCount] = useState<number>(5);

  // Filtro de Notícias por Veículo
  const [selectedOutlet, setSelectedOutlet] = useState<string>('todos');

  // Modal de Explicação de Voto com Groq API
  const [selectedVoteForExplanation, setSelectedVoteForExplanation] = useState<VoteRecord | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [explanationDetails, setExplanationDetails] = useState<VoteExplanationDetails | undefined>(undefined);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isAiGeneratedExplanation, setIsAiGeneratedExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);

  const partyMeta = getPartyMeta(politician.partido);
  const isDeputado = politician.cargo === 'Deputado Federal';

  // Status de mandato e dados eleitorais calculados dinamicamente para cada político
  const electoralData: ElectoralData = useMemo(() => {
    return getElectoralData({
      ...politician,
      situacao: details.situacao || politician.situacao,
    });
  }, [politician, details.situacao]);

  // Votações enriquecidas com categoria temática
  const taggedVotes = useMemo(() => {
    return votacoes.map(v => assignPrimaryThemeToVote(v));
  }, [votacoes]);

  // Perfil temático calculado a partir das votações reais
  const thematicScores = useMemo(() => {
    return calculateThematicProfile(taggedVotes);
  }, [taggedVotes]);

  // Carregamento progressivo dos dados
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Detalhes biográficos adicionais (para deputados)
    if (isDeputado) {
      fetchDeputadoDetalhes(politician.id).then(d => setDetails(d));
    }

    // 2. Indicadores do Estado (IBGE SIDRA)
    setIsLoadingIBGE(true);
    fetchEstadoIndicadoresMandato(
      politician.uf,
      politician.mandatoInicioAno,
      politician.mandatoFimAno
    ).then(data => {
      setIndicadores(data);
      setIsLoadingIBGE(false);
    });

    // 3. Histórico de Votações Nominais (com temas e links oficiais)
    setIsLoadingVotes(true);
    const votePromise = isDeputado
      ? fetchVotacoesDeputado(politician.id, politician.partido)
      : fetchVotacoesSenador(politician.id, politician.partido);
    votePromise.then(votes => {
      setVotacoes(votes);
      setIsLoadingVotes(false);
    });

    // 4. Agregação  de Notícias
    setIsLoadingNews(true);
    fetchPoliticianNews(politician, worldNewsApiKey).then(res => {
      setNoticias(res.articles);
      setNewsOutlets(res.uniqueOutlets);
      setUsedNewsFallback(res.usedFallback);
      setIsLoadingNews(false);
    });
  }, [politician, worldNewsApiKey, isDeputado]);

  // Filtragem combinada das votações: tipo de voto + categoria temática
  const filteredVotes = useMemo(() => {
    return taggedVotes.filter(v => {
      // Filtro de tipo de voto
      if (voteFilter === 'Sim' && v.tipoVoto !== 'Sim') return false;
      if (voteFilter === 'Não' && v.tipoVoto !== 'Não') return false;
      if (voteFilter === 'Abstenção' && v.tipoVoto !== 'Abstenção' && v.tipoVoto !== 'Outro') return false;

      // Filtro de categoria temática
      if (selectedCategory !== 'todas' && v.temaId !== selectedCategory) return false;

      return true;
    });
  }, [taggedVotes, voteFilter, selectedCategory]);

  const visibleVotes = filteredVotes.slice(0, visibleVotesCount);

  // Filtragem de notícias por veículo
  const filteredNews = useMemo(() => {
    if (selectedOutlet === 'todos') return noticias;
    return noticias.filter(n => {
      if (n.source === selectedOutlet) return true;
      if (n.outlets && n.outlets.includes(selectedOutlet)) return true;
      return false;
    });
  }, [noticias, selectedOutlet]);

  // Disparo da explicação com Groq API e Cache
  const handleExplainVote = async (vote: VoteRecord) => {
    setSelectedVoteForExplanation(vote);
    setIsExplanationModalOpen(true);
    setIsLoadingExplanation(true);
    setExplanationError(null);
    setExplanationText(null);
    setExplanationDetails(undefined);

    try {
      const res = await fetchVoteExplanation(vote, politician);
      setExplanationText(res.explicacao);
      setExplanationDetails(res.details);
      setIsAiGeneratedExplanation(res.isAiGenerated);
    } catch {
      setExplanationError('Não conseguimos gerar a explicação agora. Tente novamente ou consulte a votação no site oficial.');
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const countSim = taggedVotes.filter(v => v.tipoVoto === 'Sim').length;
  const countNao = taggedVotes.filter(v => v.tipoVoto === 'Não').length;
  const countAbst = taggedVotes.filter(v => v.tipoVoto === 'Abstenção' || v.tipoVoto === 'Outro').length;

  const mandateStatus = electoralData.mandatoStatus;

  return (
    <motion.div
      layoutId={`politician-${politician.id}`}
      className="min-w-full bg-[#fbf9f5] text-slate-900 pb-28 font-sans"
    >
      {/* Barra de Retorno Editorial Superior */}
      <div className="sticky top-16 z-30 bg-[#fbf9f5]/95 backdrop-blur-xs border-b border-[#E5E0D8] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-800 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar aos representantes de {politician.uf}</span>
          </button>

          <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-500 font-sans">
            <a href="#dados-eleitorais" className="hover:text-slate-900">Votos e Mandato</a>
            <span>·</span>
            <a href="#perfil-tematico" className="hover:text-slate-900">Perfil Temático</a>
            <span>·</span>
            <a href="#votacoes" className="hover:text-slate-900">Como votou?</a>
            <span>·</span>
            <a href="#indicadores" className="hover:text-slate-900">Como vai o estado?</a>
            <span>·</span>
            <a href="#noticias" className="hover:text-slate-900">Notícias </a>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: ABERTURA & IDENTIFICAÇÃO DO MANDATO */}
      <section id="hero" className="relative bg-white border-b border-[#E5E0D8] overflow-hidden">
        {/* Friso Tricolor */}
        <div className="h-1.5 w-full flex">
          <div className="h-full w-1/3 bg-emerald-700" />
          <div className="h-full w-1/3 bg-amber-400" />
          <div className="h-full w-1/3 bg-blue-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-14">
            {/* Foto Oficial com motion layoutId */}
            <div className="w-full sm:w-72 lg:w-80 shrink-0 aspect-4/5 rounded-2xl overflow-hidden shadow-xs border border-[#E5E0D8] bg-slate-100 relative">
              <motion.img
                layoutId={`politician-photo-${politician.id}`}
                src={politician.urlFoto}
                alt={politician.nome}
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                }}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <PartyLogo party={politician.partido} size="md" className="shadow-md ring-2 ring-white/50" />
                <span
                  className="px-2.5 py-1 text-xs font-black rounded-lg text-white shadow-xs tracking-wider"
                  style={{ backgroundColor: partyMeta.cor }}
                >
                  {politician.partido}
                </span>
              </div>

              {/* Selo Dinâmico de Status do Mandato na Foto */}
              <div className="absolute bottom-3 left-3 right-3">
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold text-center shadow-md backdrop-blur-md flex items-center justify-center gap-1.5 border ${
                    mandateStatus.status === 'exercicio'
                      ? 'bg-emerald-800/95 text-white border-emerald-600'
                      : mandateStatus.status === 'licenciado'
                      ? 'bg-blue-700/95 text-white border-blue-500'
                      : mandateStatus.status === 'suplencia'
                      ? 'bg-amber-600/95 text-white border-amber-500'
                      : 'bg-slate-800/95 text-white border-slate-600'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>{mandateStatus.rotulo}</span>
                </div>
              </div>
            </div>

            {/* Informações de Mandato, Eleição e Contato */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="text-emerald-900 font-bold">{politician.cargo}</span>
                <span>·</span>
                <span className="text-blue-900 font-bold">Estado de {politician.uf}</span>
                <span>·</span>
                <span className="text-amber-800 font-bold">
                  {politician.mandatoInicioAno} — {politician.mandatoFimAno}
                </span>
                <span>·</span>
                <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {mandateStatus.rotulo}
                </span>
                <span>·</span>
                <span className="text-slate-600 font-medium">{partyMeta.nome}</span>
              </div>

              <motion.h1
                layoutId={`politician-name-${politician.id}`}
                className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight font-editorial leading-tight"
              >
                {politician.nome}
              </motion.h1>

              {details.nomeCivil && details.nomeCivil !== politician.nome && (
                <p className="text-xs text-slate-500 font-sans">
                  Nome Civil Completo: <span className="text-slate-700 font-medium">{details.nomeCivil}</span>
                </p>
              )}

              {/* Resumo Político Editorial */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-sans">
                Representante eleito pelos cidadãos de <strong>{politician.uf}</strong> para atuar no {isDeputado ? 'Congresso Nacional pela Câmara dos Deputados' : 'Senado Federal'}. Acompanhe seu desempenho por área temática, quantidade de votos recebidos e contexto socioeconômico.
              </p>

              {/* DESTAQUE DE VOTOS NOMINAIS DO CANDIDATO NA ÚLTIMA ELEIÇÃO */}
              <div id="dados-eleitorais" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E5E0D8]">
                <div className="p-3.5 bg-[#fbf9f5] border border-[#E5E0D8] rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold">
                    <Vote className="w-5 h-5 text-emerald-800" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Votação Nominal na Urna
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono leading-tight">
                      {electoralData.votosFormatados} votos
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">
                      Eleição Geral ({electoralData.anoEleicao})
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#fbf9f5] border border-[#E5E0D8] rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 font-bold">
                    <span className="font-mono text-sm font-black">%</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Expressão Eleitoral no Estado
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-blue-900 font-mono leading-tight">
                      {electoralData.percentualValidos}% dos válidos
                    </div>
                    <span className="text-[11px] text-slate-600 truncate block font-medium" title={electoralData.rankingPosicao}>
                      {electoralData.rankingPosicao}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações de Gabinete e Portal do Governo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs font-sans text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                  <span>Duração da Legislatura: <strong>{isDeputado ? '4 anos' : '8 anos'}</strong></span>
                </div>

                {politician.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                    <a href={`mailto:${politician.email}`} className="text-blue-800 hover:underline truncate">
                      {politician.email}
                    </a>
                  </div>
                )}

                {details.gabinete && (
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{details.gabinete}</span>
                  </div>
                )}

                {politician.paginaOficial && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <a
                      href={politician.paginaOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-800 hover:text-emerald-900 font-semibold underline"
                    >
                      Página oficial no portal do governo
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: ALINHAMENTO TEMÁTICO DE VOTAÇÕES (GRÁFICO DE RADAR COM RECHARTS) */}
      <section id="perfil-tematico" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
            02. ANÁLISE TEMÁTICA DE VOTAÇÕES RECENTES
          </span>
          <div className="flex-1 border-t border-[#E5E0D8]" />
          <Compass className="w-4 h-4 text-emerald-800 shrink-0" />
        </div>

        <ThematicRadarChart
          scores={thematicScores}
          politicianName={politician.nome}
          color={isDeputado ? '#15803d' : '#1d4ed8'}
        />
      </section>

      {/* SEÇÃO 3: HISTÓRICO DE VOTAÇÕES NOMINAIS COM ÍCONE DE AJUDA (?) E FILTROS */}
      <section id="votacoes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-[#E5E0D8]">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
            03. COMO ELE VOTOU?
          </span>
          <div className="flex-1 border-t border-[#E5E0D8]" />
          <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-editorial">
              Votações Nominais e Deliberações
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl font-sans">
              Veja a posição deste parlamentar nas matérias apreciadas em plenário. Clique no ícone de ajuda <strong>(?)</strong> ao lado de qualquer matéria para entender seu significado em linguagem simples.
            </p>
          </div>

          {/* Filtros por Tipo de Voto (Sim, Não, Abstenção, Todos) */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E5E0D8] rounded-xl shadow-2xs self-start lg:self-auto">
            <button
              type="button"
              onClick={() => { setVoteFilter('Todos'); setVisibleVotesCount(5); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                voteFilter === 'Todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({taggedVotes.length})
            </button>
            <button
              type="button"
              onClick={() => { setVoteFilter('Sim'); setVisibleVotesCount(5); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                voteFilter === 'Sim' ? 'bg-emerald-800 text-white' : 'text-emerald-900 hover:bg-emerald-50'
              }`}
            >
              Sim ({countSim})
            </button>
            <button
              type="button"
              onClick={() => { setVoteFilter('Não'); setVisibleVotesCount(5); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                voteFilter === 'Não' ? 'bg-rose-800 text-white' : 'text-rose-900 hover:bg-rose-50'
              }`}
            >
              Não ({countNao})
            </button>
            <button
              type="button"
              onClick={() => { setVoteFilter('Abstenção'); setVisibleVotesCount(5); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                voteFilter === 'Abstenção' ? 'bg-amber-700 text-white' : 'text-amber-900 hover:bg-amber-50'
              }`}
            >
              Abstenção ({countAbst})
            </button>
          </div>
        </div>

        {/* FILTRO POR CATEGORIA TEMÁTICA (Economia, Saúde, Educação, Segurança, etc.) */}
        <div className="mb-8 p-3.5 bg-white border border-[#E5E0D8] rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5 text-emerald-800" />
            <span>Filtrar matérias por Área Temática:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setSelectedCategory('todas'); setVisibleVotesCount(5); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedCategory === 'todas'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-[#f5f2eb] text-slate-700 hover:bg-[#eae5da]'
              }`}
            >
              Todas as Áreas
            </button>
            {THEMATIC_AREAS.map(theme => {
              const countInTheme = taggedVotes.filter(v => v.temaId === theme.id).length;
              const isSelected = selectedCategory === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => { setSelectedCategory(theme.id); setVisibleVotesCount(5); }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-[#f5f2eb] text-slate-700 hover:bg-[#eae5da]'
                  }`}
                >
                  <span>{theme.siglaCurta}</span>
                  <span className={`text-[10px] px-1 rounded font-mono ${isSelected ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
                    {countInTheme}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline dos Votos com links diretos garantidos e ícone de ajuda (?) */}
        {isLoadingVotes ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-[#f5f2eb] rounded-xl animate-pulse border border-[#E5E0D8]" />
            ))}
          </div>
        ) : filteredVotes.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E0D8] rounded-2xl">
            <p className="text-sm text-slate-600">
              Não encontramos deliberações com os filtros selecionados nas matérias recentes.
            </p>
            <button
              type="button"
              onClick={() => { setVoteFilter('Todos'); setSelectedCategory('todas'); }}
              className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative border-l-2 border-[#E5E0D8] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
              {visibleVotes.map((v, idx) => {
                const isSim = v.tipoVoto === 'Sim';
                const isNao = v.tipoVoto === 'Não';

                return (
                  <div
                    key={v.id || idx}
                    className="relative group bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all hover:border-slate-300"
                  >
                    {/* Pin na Linha do Tempo */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-6 w-4 h-4 rounded-full border-2 border-white shadow-2xs ${
                        isSim
                          ? 'bg-emerald-700 ring-4 ring-emerald-100'
                          : isNao
                          ? 'bg-rose-700 ring-4 ring-rose-100'
                          : 'bg-amber-600 ring-4 ring-amber-100'
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-[#f5f2eb] px-2.5 py-0.5 rounded border border-[#E5E0D8]">
                          {v.titulo}
                        </span>

                        {/* ÍCONE DE AJUDA (?) PARA EXPLICAR ESTA VOTAÇÃO */}
                        <button
                          type="button"
                          onClick={() => handleExplainVote(v)}
                          aria-label={`Explicar esta votação: ${v.titulo}`}
                          tabIndex={0}
                          title="O que é esta votação? (Explicação em linguagem simples)"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-700 group/btn"
                        >
                          <HelpCircle className="w-4 h-4 text-emerald-800 group-hover/btn:scale-110 transition-transform" strokeWidth={1.5} />
                        </button>

                        {v.temaNome && (
                          <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {v.temaNome}
                          </span>
                        )}
                        <span className="text-slate-300">/</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1 font-sans">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {v.dataHoraFormatada}
                        </span>
                        {v.ehVotoBancada && (
                          <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Orientação de Bancada
                          </span>
                        )}
                      </div>

                      {/* Voto Badge */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                            isSim
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                              : isNao
                              ? 'bg-rose-50 text-rose-900 border border-rose-300'
                              : 'bg-amber-50 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isSim && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isNao && <XCircle className="w-3.5 h-3.5" />}
                          {!isSim && !isNao && <HelpCircle className="w-3.5 h-3.5" />}
                          Voto: {v.votoOriginal}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed font-serif">
                      {v.ementa}
                    </p>

                    {/* Acesso ao Link Oficial da Votação no Governo e Ação de Explicação */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-500">
                          Deliberado no plenário da <strong>{v.orgao}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleExplainVote(v)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Explicar esta votação</span>
                        </button>
                      </div>

                      <a
                        href={v.linkOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-950 underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        Ver votação oficial no site do governo
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTÃO DE PAGINAÇÃO: VER MAIS VOTAÇÕES */}
            {filteredVotes.length > visibleVotesCount && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setVisibleVotesCount(prev => prev + 5)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-[#E5E0D8] rounded-xl text-xs font-bold text-slate-800 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-emerald-800" />
                  <span>Ver mais votações ({filteredVotes.length - visibleVotesCount} restantes)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEÇÃO 4: COMO VAI O ESTADO? (IBGE SIDRA) */}
      <section id="indicadores" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-[#E5E0D8]">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
            04. COMO VAI O ESTADO?
          </span>
          <div className="flex-1 border-t border-[#E5E0D8]" />
          <TrendingUp className="w-4 h-4 text-blue-800 shrink-0" />
        </div>

        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-editorial">
            Evolução Socioeconômica de {politician.uf} durante o Mandato
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl font-sans">
            Dados oficiais do <strong>IBGE SIDRA</strong> cobrindo o período legislativo de{' '}
            <strong>{politician.mandatoInicioAno}</strong> até o momento atual ({new Date().getFullYear()}).
          </p>
        </div>

        {/* Cards com Contadores Animados */}
        {isLoadingIBGE ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-36 bg-[#f5f2eb] rounded-2xl animate-pulse border border-[#E5E0D8]" />
            ))}
          </div>
        ) : indicadores ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* KPI 1: PIB Estadual */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  PIB Estadual a Preços Correntes
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Tabela 6706
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-900 tracking-tight">
                <AnimatedCounter
                  value={indicadores.pib.ultimoValor}
                  prefix="R$ "
                  suffix=" bi"
                  decimals={1}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Variação no Mandato:</span>
                <span
                  className={`font-semibold ${
                    (indicadores.pib.variacaoPeriodo || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {(indicadores.pib.variacaoPeriodo || 0) >= 0 ? '+' : ''}
                  {indicadores.pib.variacaoPeriodo}%
                </span>
              </div>
            </div>

            {/* KPI 2: População Residente */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs hover:border-emerald-400 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  População Residente Estimada
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Tabela 6579
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-900 tracking-tight">
                <AnimatedCounter
                  value={indicadores.pop.ultimoValor}
                  suffix=" milhões"
                  decimals={2}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Crescimento Demográfico:</span>
                <span className="font-semibold text-emerald-700">
                  +{indicadores.pop.variacaoPeriodo}%
                </span>
              </div>
            </div>

            {/* KPI 3: Taxa de Desocupação */}
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs hover:border-amber-400 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Taxa de Desocupação (PNADc)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Tabela 4714
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-amber-900 tracking-tight">
                <AnimatedCounter
                  value={indicadores.desocupacao.ultimoValor}
                  suffix="%"
                  decimals={1}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Força de Trabalho:</span>
                <span className="font-medium text-slate-700">
                  Pesquisa Nacional Contínua
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Gráficos de Evolução Histórica (Linha SVG) */}
        {indicadores && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <LineChart
              points={indicadores.pib.pontos}
              title="Evolução do PIB Estadual"
              unit="Valores em R$ bilhões correntes"
              color="#1d4ed8"
            />
            <LineChart
              points={indicadores.pop.pontos}
              title="Crescimento Populacional"
              unit="Estimativa oficial em milhões"
              color="#15803d"
            />
            <LineChart
              points={indicadores.desocupacao.pontos}
              title="Trajetória do Desemprego"
              unit="Taxa média em porcentagem (%)"
              color="#d97706"
            />
          </div>
        )}
      </section>

      {/* SEÇÃO 5: O QUE ESTÃO FALANDO? (NOTÍCIAS  COM DEDUPLICAÇÃO E CLUSTER DE VEÍCULOS) */}
      <section id="noticias" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 border-t border-[#E5E0D8]">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
            05. O QUE ESTÃO FALANDO?
          </span>
          <div className="flex-1 border-t border-[#E5E0D8]" />
          <Newspaper className="w-4 h-4 text-emerald-800 shrink-0" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-editorial">
                Notícias e Atuação de {politician.nome}
              </h2>
            </div>
            <p className="text-sm text-slate-600 max-w-2xl font-sans">
              Agregação em tempo real de múltiplas fontes públicas de imprensa, feeds RSS (G1, Folha, Estadão, Poder360) e notas oficiais do Congresso Nacional com deduplicação temática.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold self-start sm:self-auto">
            <Layers className="w-3.5 h-3.5 text-emerald-800" />
            <span>Agregação Automática</span>
          </div>
        </div>

        {/* FILTRO POR VEÍCULO / OUTLET */}
        {newsOutlets.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar veículo:</span>
            <button
              type="button"
              onClick={() => setSelectedOutlet('todos')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedOutlet === 'todos'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-white border border-[#E5E0D8] text-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos ({noticias.length})
            </button>
            {newsOutlets.map(outlet => {
              const count = noticias.filter(n => n.source === outlet || (n.outlets && n.outlets.includes(outlet))).length;
              const isSelected = selectedOutlet === outlet;
              return (
                <button
                  key={outlet}
                  type="button"
                  onClick={() => setSelectedOutlet(outlet)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-[#E5E0D8] text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{outlet}</span>
                  <span className={`text-[10px] px-1 rounded font-mono ${isSelected ? 'bg-slate-800 text-white' : 'bg-[#f5f2eb] text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grid de Notícias Agregadas */}
        {isLoadingNews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-[#f5f2eb] rounded-2xl animate-pulse border border-[#E5E0D8]" />
            ))}
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-8 text-center bg-white border border-[#E5E0D8] rounded-2xl">
            <p className="text-sm text-slate-600 font-sans">
              Nenhuma matéria encontrada com o filtro de veículo selecionado.
            </p>
            <button
              type="button"
              onClick={() => setSelectedOutlet('todos')}
              className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer"
            >
              Exibir todas as notícias
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((art, idx) => {
              const otherOutlets = (art.outlets || []).filter(o => o !== art.source);

              return (
                <div
                  key={art.id || idx}
                  className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {art.imageUrl && (
                      <div className="aspect-16/9 w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          onError={(e: any) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-sans">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {art.source}
                        </span>
                        <span>{new Date(art.publishDate).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-3 font-editorial group-hover:text-blue-900 transition-colors">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-4 leading-relaxed font-sans">
                        {art.text}
                      </p>

                      {/* Selo Multi-Veículo (Também em: [Outlets]) */}
                      {otherOutlets.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Também em:
                          </span>
                          {otherOutlets.map(o => (
                            <span
                              key={o}
                              className="text-[10px] font-semibold text-slate-700 bg-[#f5f2eb] px-1.5 py-0.5 rounded border border-[#E5E0D8]"
                            >
                              {o}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 py-3.5 bg-[#fbf9f5] border-t border-[#E5E0D8] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 font-sans">
                      {art.isOfficial ? 'Agência Oficial' : (art.sourceApi || 'Imprensa')}
                    </span>
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                    >
                      Ler matéria completa
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL DE EXPLICAÇÃO DA VOTAÇÃO EM LINGUAGEM SIMPLES (GROQ API + CACHE) */}
      <VoteExplanationModal
        isOpen={isExplanationModalOpen}
        vote={selectedVoteForExplanation}
        politician={politician}
        explanation={explanationText}
        details={explanationDetails}
        isLoading={isLoadingExplanation}
        isAiGenerated={isAiGeneratedExplanation}
        error={explanationError}
        onClose={() => setIsExplanationModalOpen(false)}
        onRetry={() => {
          if (selectedVoteForExplanation) {
            handleExplainVote(selectedVoteForExplanation);
          }
        }}
      />
    </motion.div>
  );
};
