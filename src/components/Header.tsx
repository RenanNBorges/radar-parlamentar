import React from 'react';
import { RefreshCw, BookOpen, Layers } from 'lucide-react';
import { UFInfo } from '../types';

interface HeaderProps {
  currentUF: UFInfo | null;
  onOpenStateSelector: () => void;
  onOpenApisModal: () => void;
  onResetSelection: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUF,
  onOpenStateSelector,
  onOpenApisModal,
  onResetSelection,
}) => {
  return (
    <>
      {/* Friso Tricolor Brasileiro com estética editorial */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-emerald-700" />
        <div className="h-full w-1/3 bg-amber-400" />
        <div className="h-full w-1/3 bg-blue-700" />
      </div>

      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 backdrop-blur-xs border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Zona 1: Marca Cívica com Tipografia Editorial */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/"
              onClick={e => {
                e.preventDefault();
                onResetSelection();
              }}
              className="group flex items-center gap-2.5 text-slate-900 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-bold text-sm shadow-xs ring-1 ring-emerald-900/30">
                <span className="text-amber-300 font-editorial">R</span>P
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight font-editorial">
                  Radar Parlamentar
                </span>
              </div>
            </a>
          </div>

          {/* Zona 2: Links e Navegação Editorial */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
            <span className="text-slate-300">/</span>
            <span className="uppercase tracking-wider text-slate-500 font-semibold">
              Congresso Nacional &amp; IBGE
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">
              1 Deputado Federal + 2 Senadores
            </span>
            <span className="text-slate-300">/</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded border border-emerald-200">
              <Layers className="w-3 h-3 text-emerald-700" />
              Notícias
            </span>
          </nav>

          {/* Zona 3: Ações de Estado e Guia de APIs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenApisModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-900 bg-white hover:bg-slate-50 border border-[#E5E0D8] rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Como funciona?</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200">
                7 Fontes
              </span>
            </button>

            {currentUF && (
              <button
                type="button"
                onClick={onOpenStateSelector}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title="Mudar o estado selecionado"
              >
                <span className="text-emerald-800 font-bold">{currentUF.sigla}</span>
                <span className="text-emerald-700 hidden sm:inline">— {currentUF.nome}</span>
                <RefreshCw className="w-3 h-3 text-emerald-800 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
