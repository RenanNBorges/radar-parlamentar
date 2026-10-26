import React, { useState, useMemo } from 'react';
import { Search, Filter, Check, UserCheck, Shield, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { Politician } from '../types';
import { calculateSimilarity } from '../utils/fuzzy';
import { getPartyMeta } from '../services/congressService';
import { PartyLogo } from './PartyLogo';

interface PoliticianSelectorViewProps {
  uf: string;
  deputados: Politician[];
  senadores: Politician[];
  selectedDeputado: Politician | null;
  selectedSenadores: Politician[];
  onSelectDeputado: (p: Politician) => void;
  onToggleSenador: (p: Politician) => void;
  onConfirmSelection: () => void;
  onChangeUF: () => void;
  isLoading: boolean;
}

export const PoliticianSelectorView: React.FC<PoliticianSelectorViewProps> = ({
  uf,
  deputados,
  senadores,
  selectedDeputado,
  selectedSenadores,
  onSelectDeputado,
  onToggleSenador,
  onConfirmSelection,
  onChangeUF,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'deputado' | 'senadores'>('deputado');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('TODOS');

  // Lista de todos os partidos presentes nesta UF
  const availableParties = useMemo(() => {
    const list = activeTab === 'deputado' ? deputados : senadores;
    const parties = new Set<string>();
    list.forEach(p => {
      if (p.partido) parties.add(p.partido);
    });
    return ['TODOS', ...Array.from(parties).sort()];
  }, [deputados, senadores, activeTab]);

  // Filtro fuzzy + partido
  const filteredPoliticians = useMemo(() => {
    const currentList = activeTab === 'deputado' ? deputados : senadores;

    return currentList.filter(p => {
      // Filtro de Partido
      if (selectedParty !== 'TODOS' && p.partido !== selectedParty) {
        return false;
      }

      // Busca por similaridade tolerante a erros
      if (!searchQuery.trim()) return true;

      const scoreNome = calculateSimilarity(p.nome, searchQuery);
      const scoreCivil = p.nomeCivil ? calculateSimilarity(p.nomeCivil, searchQuery) : 0;
      const scorePartido = calculateSimilarity(p.partido, searchQuery);

      return scoreNome > 0.4 || scoreCivil > 0.4 || scorePartido > 0.6;
    });
  }, [deputados, senadores, activeTab, selectedParty, searchQuery]);

  const isSelectionComplete = selectedDeputado !== null && selectedSenadores.length === 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in pb-28">
      {/* Top Banner de Contexto Cívico */}
      <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-emerald-900 uppercase tracking-wider font-sans">
              <span>Bancada de Brasília</span>
              <span>·</span>
              <span className="text-blue-900 font-bold">Estado de {uf}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-editorial">
              Quem representa você no Congresso Nacional?
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl font-sans">
              Escolha <strong>1 deputado federal</strong> e <strong>2 senadores</strong> do seu estado para acompanhar o voto de cada um nas votações e projetos.
            </p>
          </div>

          <button
            type="button"
            onClick={onChangeUF}
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-[#f5f2eb] hover:bg-[#ede8dc] border border-[#E5E0D8] rounded-xl transition-colors cursor-pointer font-sans"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Mudar estado ({uf})
          </button>
        </div>

        {/* Resumo dos Slots de Seleção */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100">
          {/* Slot Deputado */}
          <div
            onClick={() => setActiveTab('deputado')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedDeputado
                ? 'bg-emerald-50/70 border-emerald-300'
                : activeTab === 'deputado'
                ? 'bg-white border-emerald-600 ring-2 ring-emerald-600/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedDeputado
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedDeputado ? '1/1' : '0/1'}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  1 Deputado Federal
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {selectedDeputado ? selectedDeputado.nome : 'Aguardando seleção...'}
                </span>
              </div>
            </div>
            {selectedDeputado && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
          </div>

          {/* Slot Senador 1 */}
          <div
            onClick={() => setActiveTab('senadores')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedSenadores[0]
                ? 'bg-blue-50/70 border-blue-300'
                : activeTab === 'senadores'
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedSenadores[0]
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedSenadores[0] ? '✓' : '1º'}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Senador 1 de 2
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {selectedSenadores[0] ? selectedSenadores[0].nome : 'Aguardando seleção...'}
                </span>
              </div>
            </div>
            {selectedSenadores[0] && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
          </div>

          {/* Slot Senador 2 */}
          <div
            onClick={() => setActiveTab('senadores')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedSenadores[1]
                ? 'bg-blue-50/70 border-blue-300'
                : activeTab === 'senadores'
                ? 'bg-white border-blue-600 ring-2 ring-blue-600/10'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  selectedSenadores[1]
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {selectedSenadores[1] ? '✓' : '2º'}
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Senador 2 de 2
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {selectedSenadores[1] ? selectedSenadores[1].nome : 'Aguardando seleção...'}
                </span>
              </div>
            </div>
            {selectedSenadores[1] && <Check className="w-4 h-4 text-blue-700 shrink-0" />}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Abas de Navegação */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Abas Alternadoras */}
          <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('deputado')}
              className={`flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'deputado'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deputados Federais ({deputados.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('senadores')}
              className={`flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'senadores'
                  ? 'bg-white text-blue-900 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Senadores em Exercício ({senadores.length})
            </button>
          </div>

          {/* Campo de Busca e Filtro de Partido */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou partido (tolerante a erros)..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-48 shrink-0">
              <select
                value={selectedParty}
                onChange={e => setSelectedParty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none cursor-pointer"
              >
                {availableParties.map(p => (
                  <option key={p} value={p}>
                    {p === 'TODOS' ? 'Todos os Partidos' : p}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Políticos Disponíveis */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200/60 rounded-xl h-64 border border-slate-200" />
          ))}
        </div>
      ) : filteredPoliticians.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Nenhum parlamentar encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tente ajustar os termos da busca ou limpe o filtro de partido.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPoliticians.map(p => {
            const isDeputado = p.cargo === 'Deputado Federal';
            const isSelected = isDeputado
              ? selectedDeputado?.id === p.id
              : selectedSenadores.some(s => s.id === p.id);
            const partyMeta = getPartyMeta(p.partido);

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (isDeputado) {
                    onSelectDeputado(p);
                  } else {
                    onToggleSenador(p);
                  }
                }}
                className={`group relative bg-white rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col ${
                  isSelected
                    ? isDeputado
                      ? 'border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                      : 'border-blue-600 ring-2 ring-blue-600 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Indicador de Selecionado */}
                {isSelected && (
                  <div
                    className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm ${
                      isDeputado ? 'bg-emerald-700' : 'bg-blue-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Foto do Parlamentar */}
                <div className="relative aspect-4/5 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={p.urlFoto}
                    alt={p.nome}
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                    }}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Badge de Partido com Logo e UF na imagem */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <PartyLogo party={p.partido} size="sm" className="shadow-xs ring-1 ring-white/40" />
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: partyMeta.cor }}
                      >
                        {p.partido}
                      </span>
                    </div>
                    <span className="text-slate-200 text-[10px] drop-shadow-sm">{p.uf}</span>
                  </div>
                </div>

                {/* Dados textuais */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-emerald-800">
                      {p.nome}
                    </h3>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {p.cargo}
                    </span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {isSelected ? 'Selecionado' : 'Clique para escolher'}
                    </span>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected
                          ? isDeputado
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra Inferior Fixa com Status e Ação de Avançar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#fbf9f5]/95 backdrop-blur-xs border-t border-[#E5E0D8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-700">
            <UserCheck className="w-5 h-5 text-emerald-800 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 font-sans">Sua escolha:</span>{' '}
              <span>
                {selectedDeputado ? '1' : '0'} de 1 deputado · {selectedSenadores.length} de 2 senadores
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={!isSelectionComplete}
              onClick={onConfirmSelection}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isSelectionComplete
                  ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>{isSelectionComplete ? 'Começar agora' : 'Escolha os 3 parlamentares'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
