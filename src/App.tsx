/**
 * Radar Parlamentar — Monitor Cívico do Congresso Nacional
 * Aplicação web de transparência com dados abertos da Câmara, Senado e IBGE.
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { ExternalLink, BookOpen, Shield } from 'lucide-react';
import { Header } from './components/Header';
import { StateOnboardingModal } from './components/StateOnboardingModal';
import { PoliticianSelectorView } from './components/PoliticianSelectorView';
import { PoliticiansDashboard } from './components/PoliticiansDashboard';
import { PoliticianDetailView } from './components/PoliticianDetailView';
import { PublicApisModal } from './components/PublicApisModal';
import { Politician, UFInfo, AppSelection } from './types';
import { getUFBySigla } from './services/geoService';
import { fetchDeputadosByUF, fetchSenadoresByUF } from './services/congressService';

const STORAGE_KEY = 'radar_parlamentar_selection_v1';

export default function App() {
  const [uf, setUf] = useState<string>('');
  const [currentUFInfo, setCurrentUFInfo] = useState<UFInfo | null>(null);

  const [deputados, setDeputados] = useState<Politician[]>([]);
  const [senadores, setSenadores] = useState<Politician[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  const [selectedDeputado, setSelectedDeputado] = useState<Politician | null>(null);
  const [selectedSenadores, setSelectedSenadores] = useState<Politician[]>([]);

  // Navegação de views
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isApisModalOpen, setIsApisModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activePoliticianDetail, setActivePoliticianDetail] = useState<Politician | null>(null);

  // Chave opcional da World News API
  const [worldNewsApiKey, setWorldNewsApiKey] = useState<string>('');

  // 1. Carregamento inicial do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AppSelection = JSON.parse(saved);
        if (parsed.uf) {
          setUf(parsed.uf);
          setCurrentUFInfo(getUFBySigla(parsed.uf) || null);
          if (parsed.deputado && parsed.senadores && parsed.senadores.length === 2) {
            setSelectedDeputado(parsed.deputado);
            setSelectedSenadores(parsed.senadores);
            setIsSelectionMode(false);
          } else {
            setIsSelectionMode(true);
          }
          if (parsed.worldNewsApiKey) {
            setWorldNewsApiKey(parsed.worldNewsApiKey);
          }
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao restaurar do localStorage:', e);
    }
    // Primeira visita: abre modal para definir o estado
    setIsStateModalOpen(true);
  }, []);

  // 2. Carrega lista de parlamentares quando a UF muda
  useEffect(() => {
    if (!uf) return;

    setIsLoadingRoster(true);
    setCurrentUFInfo(getUFBySigla(uf) || null);

    Promise.all([fetchDeputadosByUF(uf), fetchSenadoresByUF(uf)])
      .then(([depList, senList]) => {
        setDeputados(depList);
        setSenadores(senList);
        setIsLoadingRoster(false);
      })
      .catch(err => {
        console.error('Erro ao carregar bancada:', err);
        setIsLoadingRoster(false);
      });
  }, [uf]);

  // Salva no localStorage
  const saveToStorage = (
    newUf: string,
    dep: Politician | null,
    sens: Politician[]
  ) => {
    try {
      const payload: AppSelection = {
        uf: newUf,
        deputado: dep,
        senadores: sens,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }
  };

  // Handler de seleção de estado
  const handleSelectState = (newUf: string) => {
    setUf(newUf);
    setSelectedDeputado(null);
    setSelectedSenadores([]);
    setActivePoliticianDetail(null);
    setIsSelectionMode(true);
    setIsStateModalOpen(false);
    saveToStorage(newUf, null, []);
  };

  // Seleciona ou desmarca Deputado Federal (máximo 1)
  const handleSelectDeputado = (p: Politician) => {
    if (selectedDeputado?.id === p.id) {
      setSelectedDeputado(null);
    } else {
      setSelectedDeputado(p);
    }
  };

  // Seleciona ou desmarca Senador (máximo 2)
  const handleToggleSenador = (p: Politician) => {
    if (selectedSenadores.some(s => s.id === p.id)) {
      setSelectedSenadores(prev => prev.filter(s => s.id !== p.id));
    } else {
      if (selectedSenadores.length < 2) {
        setSelectedSenadores(prev => [...prev, p]);
      } else {
        // Substitui o segundo
        setSelectedSenadores([selectedSenadores[0], p]);
      }
    }
  };

  // Confirmação da escolha de 1 Deputado e 2 Senadores
  const handleConfirmSelection = () => {
    if (!selectedDeputado || selectedSenadores.length !== 2) return;
    setIsSelectionMode(false);
    saveToStorage(uf, selectedDeputado, selectedSenadores);
  };

  // Reset / Alterar seleção
  const handleResetToSelection = () => {
    setActivePoliticianDetail(null);
    setIsSelectionMode(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* Top Header */}
      <Header
        currentUF={currentUFInfo}
        onOpenStateSelector={() => setIsStateModalOpen(true)}
        onOpenApisModal={() => setIsApisModalOpen(true)}
        onResetSelection={() => {
          setActivePoliticianDetail(null);
          setIsSelectionMode(false);
        }}
      />

      {/* Modal de Escolha do Estado (GPS / Nominatim ou IBGE) */}
      <StateOnboardingModal
        isOpen={isStateModalOpen}
        onSelectState={handleSelectState}
        onClose={() => setIsStateModalOpen(false)}
        canClose={Boolean(uf && selectedDeputado && selectedSenadores.length === 2)}
      />

      {/* Modal Educativo das 5 APIs Públicas */}
      <PublicApisModal
        isOpen={isApisModalOpen}
        onClose={() => setIsApisModalOpen(false)}
      />

      {/* Conteúdo Principal com Transições Fluidas */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activePoliticianDetail ? (
            /* View 3: Detalhes do Parlamentar (Scrollytelling + layoutId compartilhado) */
            <PoliticianDetailView
              key={`detail-${activePoliticianDetail.id}`}
              politician={activePoliticianDetail}
              onBack={() => setActivePoliticianDetail(null)}
            />
          ) : isSelectionMode || !selectedDeputado || selectedSenadores.length < 2 ? (
            /* View 1: Seleção de 1 Deputado Federal + 2 Senadores */
            <PoliticianSelectorView
              key="selector-view"
              uf={uf || 'SP'}
              deputados={deputados}
              senadores={senadores}
              selectedDeputado={selectedDeputado}
              selectedSenadores={selectedSenadores}
              onSelectDeputado={handleSelectDeputado}
              onToggleSenador={handleToggleSenador}
              onConfirmSelection={handleConfirmSelection}
              onChangeUF={() => setIsStateModalOpen(true)}
              isLoading={isLoadingRoster}
            />
          ) : (
            /* View 2: Painel Assimétrico Principal */
            <PoliticiansDashboard
              key="dashboard-view"
              uf={uf}
              deputado={selectedDeputado}
              senadores={selectedSenadores}
              onSelectPolitician={p => setActivePoliticianDetail(p)}
              onEditSelection={handleResetToSelection}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Rodapé Editorial com Links Oficiais do Governo */}
      <footer className="bg-white border-t border-[#E5E0D8] py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 font-editorial text-sm">Radar Parlamentar</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">Monitor Cívico Independente</span>
            </div>
            <button
              type="button"
              onClick={() => setIsApisModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-emerald-800" />
              Entenda as 7 fontes e APIs públicas integradas
            </button>
          </div>

          {/* Links Oficiais para os Portais do Governo */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-700">
            <a
              href="https://www.camara.leg.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-emerald-900 hover:underline transition-colors"
              title="Portal oficial da Câmara dos Deputados"
            >
              Câmara dos Deputados
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">·</span>
            <a
              href="https://www.senado.leg.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-blue-900 hover:underline transition-colors"
              title="Portal oficial do Senado Federal"
            >
              Senado Federal
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">·</span>
            <a
              href="https://www.ibge.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-amber-900 hover:underline transition-colors"
              title="Portal oficial do IBGE"
            >
              IBGE
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">·</span>
            <a
              href="https://www.congressonacional.leg.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-900 hover:underline transition-colors"
              title="Portal do Congresso Nacional"
            >
              Congresso Nacional
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
