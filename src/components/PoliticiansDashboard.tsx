import React from 'react';
import { motion } from 'motion/react';
import { Edit3, Shield, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Politician } from '../types';
import { getPartyMeta } from '../services/congressService';
import { PartyLogo } from './PartyLogo';

interface PoliticiansDashboardProps {
  uf: string;
  deputado: Politician;
  senadores: Politician[];
  onSelectPolitician: (p: Politician) => void;
  onEditSelection: () => void;
}

export const PoliticiansDashboard: React.FC<PoliticiansDashboardProps> = ({
  uf,
  deputado,
  senadores,
  onSelectPolitician,
  onEditSelection,
}) => {
  const sen1 = senadores[0];
  const sen2 = senadores[1];

  const partyDep = getPartyMeta(deputado.partido);
  const partySen1 = sen1 ? getPartyMeta(sen1.partido) : null;
  const partySen2 = sen2 ? getPartyMeta(sen2.partido) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 animate-fade-in">
      {/* Detalhe Editorial com linha fina e rótulo em caixa alta */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
          01. SEUS REPRESENTANTES NO CONGRESSO NACIONAL
        </span>
        <div className="flex-1 border-t border-[#E5E0D8]" />
        <span className="text-xs font-semibold text-emerald-800">
          Estado de {uf}
        </span>
      </div>

      {/* Cabeçalho com Voz Humana Direta */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#E5E0D8]">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight font-editorial leading-tight">
            Quem representa seu estado em Brasília?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 font-sans leading-relaxed">
            Acompanhe o voto e a presença de 1 deputado federal e dos 2 senadores que você escolheu. Clique em qualquer um deles para abrir o relatório de votações e temas.
          </p>
        </div>

        <button
          type="button"
          onClick={onEditSelection}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-[#f6f4ee] border border-[#E5E0D8] rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-emerald-800" />
          Escolher outros políticos
        </button>
      </div>

      {/* Grid Assimétrico: Deputado em destaque maior à esquerda, Senadores à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* CARD DO DEPUTADO FEDERAL (Destaque Principal, Maior Largura e Presença) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-900 mb-2">
            <span>Câmara dos Deputados · Mandato 4 anos</span>
            <span className="text-slate-400">Titular da UF</span>
          </div>

          <motion.div
            layoutId={`politician-${deputado.id}`}
            onClick={() => onSelectPolitician(deputado)}
            className="group relative flex-1 bg-white rounded-2xl border border-[#E5E0D8] hover:border-slate-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col min-h-[540px] shadow-2xs hover:shadow-md"
          >
            {/* Friso verde discreto no topo */}
            <div className="h-1.5 w-full bg-emerald-700" />

            {/* Foto Oficial com motion layoutId */}
            <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
              <motion.img
                layoutId={`politician-photo-${deputado.id}`}
                src={deputado.urlFoto}
                alt={deputado.nome}
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                }}
                className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

              {/* Distintivo de Cargo Superior */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider bg-slate-900/80 text-emerald-200 border border-emerald-500/30 backdrop-blur-xs">
                  Deputado Federal — {deputado.uf}
                </span>

                <span className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              {/* Informações na base da foto */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <PartyLogo party={deputado.partido} size="md" className="ring-2 ring-white/50" />
                  <span
                    className="px-2.5 py-0.5 text-xs font-black rounded-md tracking-wider shadow-xs"
                    style={{ backgroundColor: partyDep.cor, color: '#ffffff' }}
                  >
                    {deputado.partido}
                  </span>
                  <span className="text-xs text-slate-300 font-medium truncate">
                    {partyDep.nome}
                  </span>
                </div>

                <motion.h2
                  layoutId={`politician-name-${deputado.id}`}
                  className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-editorial leading-tight group-hover:text-amber-200 transition-colors"
                >
                  {deputado.nome}
                </motion.h2>

                <p className="text-xs text-slate-300 mt-1 font-sans">
                  Mandato atual: {deputado.mandatoInicioAno} — {deputado.mandatoFimAno}
                </p>
              </div>
            </div>

            {/* Ação de Entrada */}
            <div className="px-6 py-4 bg-[#fbf9f5] border-t border-[#E5E0D8] flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">
                Ver votos em plenário, radar temático e notas
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                Ver detalhes
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </motion.div>
        </div>

        {/* COLUNA DOS DOIS SENADORES (Subdivisão em Cards Menores, Quebrando a Simetria) */}
        <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-2">
            <span>Senado Federal · Mandatos de 8 anos</span>
            <span className="text-slate-400">2 Representantes da UF</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            {/* SENADOR 1 */}
            {sen1 && (
              <motion.div
                key={sen1.id}
                layoutId={`politician-${sen1.id}`}
                onClick={() => onSelectPolitician(sen1)}
                className="group relative bg-white rounded-2xl border border-[#E5E0D8] hover:border-slate-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[520px] shadow-2xs hover:shadow-md"
              >
                <div className="h-1.5 w-full bg-blue-700" />

                <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
                  <motion.img
                    layoutId={`politician-photo-${sen1.id}`}
                    src={sen1.urlFoto}
                    alt={sen1.nome}
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                    }}
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider bg-slate-900/80 text-blue-200 border border-blue-500/30 backdrop-blur-xs">
                      Senador — {sen1.uf}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PartyLogo party={sen1.partido} size="sm" className="ring-1 ring-white/40" />
                      <span
                        className="px-2 py-0.5 text-[11px] font-black rounded-md tracking-wider shadow-xs"
                        style={{ backgroundColor: partySen1?.cor || '#1d4ed8', color: '#ffffff' }}
                      >
                        {sen1.partido}
                      </span>
                    </div>

                    <motion.h2
                      layoutId={`politician-name-${sen1.id}`}
                      className="text-xl sm:text-2xl font-bold tracking-tight text-white font-editorial leading-tight group-hover:text-amber-200 transition-colors"
                    >
                      {sen1.nome}
                    </motion.h2>

                    <p className="text-[11px] text-slate-300 mt-1 font-sans">
                      Mandato: {sen1.mandatoInicioAno} — {sen1.mandatoFimAno}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#fbf9f5] border-t border-[#E5E0D8] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Ver deliberações</span>
                  <span className="text-xs font-bold text-blue-800 group-hover:translate-x-1 transition-transform">
                    Ver detalhes →
                  </span>
                </div>
              </motion.div>
            )}

            {/* SENADOR 2 */}
            {sen2 && (
              <motion.div
                key={sen2.id}
                layoutId={`politician-${sen2.id}`}
                onClick={() => onSelectPolitician(sen2)}
                className="group relative bg-white rounded-2xl border border-[#E5E0D8] hover:border-slate-400 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[520px] shadow-2xs hover:shadow-md"
              >
                <div className="h-1.5 w-full bg-amber-500" />

                <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
                  <motion.img
                    layoutId={`politician-photo-${sen2.id}`}
                    src={sen2.urlFoto}
                    alt={sen2.nome}
                    referrerPolicy="no-referrer"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-foto.png';
                    }}
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg uppercase tracking-wider bg-slate-900/80 text-amber-200 border border-amber-500/30 backdrop-blur-xs">
                      Senador — {sen2.uf}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <PartyLogo party={sen2.partido} size="sm" className="ring-1 ring-white/40" />
                      <span
                        className="px-2 py-0.5 text-[11px] font-black rounded-md tracking-wider shadow-xs"
                        style={{ backgroundColor: partySen2?.cor || '#d97706', color: '#ffffff' }}
                      >
                        {sen2.partido}
                      </span>
                    </div>

                    <motion.h2
                      layoutId={`politician-name-${sen2.id}`}
                      className="text-xl sm:text-2xl font-bold tracking-tight text-white font-editorial leading-tight group-hover:text-amber-200 transition-colors"
                    >
                      {sen2.nome}
                    </motion.h2>

                    <p className="text-[11px] text-slate-300 mt-1 font-sans">
                      Mandato: {sen2.mandatoInicioAno} — {sen2.mandatoFimAno}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 bg-[#fbf9f5] border-t border-[#E5E0D8] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600">Ver deliberações</span>
                  <span className="text-xs font-bold text-amber-800 group-hover:translate-x-1 transition-transform">
                    Ver detalhes →
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Nota Cívica de Transparência */}
      <div className="mt-14 pt-6 border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-sans">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>Informações colhidas diretamente das bases públicas da Câmara, Senado e IBGE.</span>
        </div>
        <span className="text-[11px] text-slate-400">
          Dados abertos garantidos pela Lei de Acesso à Informação (Lei 12.527/2011).
        </span>
      </div>
    </div>
  );
};
