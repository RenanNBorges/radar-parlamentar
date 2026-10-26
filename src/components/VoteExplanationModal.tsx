import React, { useEffect, useState } from 'react';
import { ExternalLink, X, FileText, Scale, ThumbsUp, ThumbsDown, AlertTriangle, Layers, BookOpen, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { VoteRecord, Politician, VoteExplanationDetails } from '../types';

interface VoteExplanationModalProps {
  isOpen: boolean;
  vote: VoteRecord | null;
  politician?: Politician;
  explanation: string | null;
  details?: VoteExplanationDetails;
  isLoading: boolean;
  isAiGenerated: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

export const VoteExplanationModal: React.FC<VoteExplanationModalProps> = ({
  isOpen,
  vote,
  politician,
  explanation,
  details,
  isLoading,
  error,
  onClose,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'comparativo' | 'parlamentar'>('geral');

  // Fecha com tecla ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reseta aba ao abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab('geral');
    }
  }, [isOpen, vote?.id]);

  if (!isOpen || !vote) return null;

  const isSim = vote.tipoVoto === 'Sim';
  const isNao = vote.tipoVoto === 'Não';
  const isAbst = vote.tipoVoto === 'Abstenção' || vote.tipoVoto === 'Outro';

  // Fallback para campos estruturados se não vierem separadamente
  const propostaText = details?.proposta || (explanation ? explanation.split('\n\n')[0] : '');
  const simText = details?.significadoSim || (explanation ? explanation.split('\n\n')[1] : '');
  const naoText = details?.significadoNao || (explanation ? explanation.split('\n\n')[2] : '');
  const impactoText = details?.impactoCidadao || (explanation ? explanation.split('\n\n')[3] : '');
  const posicionamentoText = details?.posicionamento || (explanation ? explanation.split('\n\n')[4] : '');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-vote-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfbf9] rounded-2xl shadow-2xl border border-[#E5E0D8] max-w-2xl w-full my-6 flex flex-col overflow-hidden text-slate-900 animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Friso Tricolor Brasileiro Sóbrio */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="h-full w-1/3 bg-emerald-800" />
          <div className="h-full w-1/3 bg-amber-500" />
          <div className="h-full w-1/3 bg-blue-800" />
        </div>

        {/* Cabeçalho Editorial com Identidade Institucional Cívica */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[#E5E0D8] bg-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 font-mono">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  {vote.titulo}
                </span>

                {vote.temaNome && (
                  <span className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                    {vote.temaNome}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                    isSim
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : isNao
                      ? 'bg-rose-50 text-rose-900 border-rose-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {isSim && <CheckCircle2 className="w-3 h-3 text-emerald-700" />}
                  {isNao && <XCircle className="w-3 h-3 text-rose-700" />}
                  {isAbst && <MinusCircle className="w-3 h-3 text-amber-700" />}
                  Voto registrado: {vote.votoOriginal || vote.tipoVoto}
                </span>
              </div>

              <h2 id="modal-vote-title" className="text-xl sm:text-2xl font-bold text-slate-900 font-editorial leading-tight">
                Entenda a Votação Nominal
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-sans">
                {vote.orgao} · Deliberação oficial em {vote.dataHoraFormatada}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela"
              className="text-slate-400 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Abas de Navegação Interna do Briefing */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('geral')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'geral'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              1. A Proposta &amp; Cotidiano
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comparativo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'comparativo'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              2. Voto SIM vs NÃO
            </button>
            {politician && (
              <button
                type="button"
                onClick={() => setActiveTab('parlamentar')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'parlamentar'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                3. Voto de {politician.nome.split(' ')[0]}
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[62vh] space-y-4 font-sans text-sm text-slate-700">
          {isLoading ? (
            <div className="py-8 space-y-4">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-800 bg-white p-3.5 rounded-xl border border-[#E5E0D8] shadow-2xs">
                <Scale className="w-4 h-4 text-emerald-800 animate-pulse" />
                <span>Consultando os registros da matéria e estruturando o briefing cívico…</span>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 bg-slate-200/70 rounded-md w-full animate-pulse" />
                <div className="h-4 bg-slate-200/70 rounded-md w-11/12 animate-pulse" />
                <div className="h-4 bg-slate-200/70 rounded-md w-4/5 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                <div className="h-28 bg-emerald-50/50 rounded-xl border border-emerald-100 animate-pulse" />
                <div className="h-28 bg-rose-50/50 rounded-xl border border-rose-100 animate-pulse" />
              </div>
            </div>
          ) : error ? (
            <div className="py-8 space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-700 mx-auto flex items-center justify-center border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Não foi possível carregar a análise</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {error}
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {/* Ementa Oficial da Matéria */}
              <div className="p-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-900 block mb-1">Ementa oficial no Congresso:</span>
                <p className="italic leading-relaxed text-slate-700 font-serif">
                  "{vote.ementa}"
                </p>
              </div>

              {/* ABA 1: PROPOSTA & COTIDIANO */}
              {activeTab === 'geral' && (
                <div className="space-y-4">
                  {/* Bloco: O que a proposta define */}
                  <div className="p-4 bg-white border border-[#E5E0D8] rounded-xl shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                      <FileText className="w-4 h-4 text-emerald-800" />
                      <span>O que esta matéria propõe na prática</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
                      {propostaText || 'A proposição atualiza diretrizes legais e administrativas no âmbito federal, reorganizando regras e competências para o setor.'}
                    </p>
                  </div>

                  {/* Bloco: Impacto na Vida Real */}
                  {impactoText && (
                    <div className="p-4 bg-[#f9f8f5] border border-[#E5E0D8] rounded-xl shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-[#E5E0D8] pb-2">
                        <Layers className="w-4 h-4 text-blue-800" />
                        <span>Como afeta a vida do cidadão e do país</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
                        {impactoText}
                      </p>
                    </div>
                  )}

                  {/* Prévia do Posicionamento */}
                  {politician && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Posicionamento de {politician.nome}:
                        </span>
                        <span className="text-slate-600">
                          Votou <strong className="text-slate-900">{vote.votoOriginal || vote.tipoVoto}</strong> em plenário.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('comparativo')}
                        className="text-xs font-bold text-emerald-900 hover:underline shrink-0"
                      >
                        Ver SIM vs NÃO →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: COMPARATIVO SIM vs NÃO */}
              {activeTab === 'comparativo' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-600">
                    Entenda com equilíbrio os dois lados da deliberação antes da votação:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CARD SIM */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-xs uppercase tracking-wide">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                          <span>O que significava votar a favor (SIM)</span>
                        </div>
                        {isSim && (
                          <span className="text-[10px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded">
                            Escolha do parlamentar
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                        {simText || 'Votar a favor significava apoiar a criação e implementação das novas normas ou a liberação das medidas solicitadas no texto do projeto.'}
                      </p>
                      <div className="text-[11px] text-emerald-900 font-semibold pt-1">
                        ✓ Ponto-chave: Atualização de regras, incentivo a investimentos ou resposta a demandas imediatas.
                      </div>
                    </div>

                    {/* CARD NÃO */}
                    <div className="p-4 bg-rose-50/70 border border-rose-300 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                        <div className="flex items-center gap-1.5 font-bold text-rose-950 text-xs uppercase tracking-wide">
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-700" />
                          <span>O que significava votar contra (NÃO)</span>
                        </div>
                        {isNao && (
                          <span className="text-[10px] font-bold bg-rose-800 text-white px-2 py-0.5 rounded">
                            Escolha do parlamentar
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-rose-950 leading-relaxed">
                        {naoText || 'Votar contra significava preservar as diretrizes e limites da lei atual, rejeitando a proposta por divergências com o texto ou cautela fiscal.'}
                      </p>
                      <div className="text-[11px] text-rose-900 font-semibold pt-1">
                        ✗ Ponto-chave: Preocupação com custos públicos, excesso regulatório ou necessidade de aprimoramento.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 3: POSICIONAMENTO DO PARLAMENTAR */}
              {activeTab === 'parlamentar' && politician && (
                <div className="space-y-4">
                  <div className="p-5 bg-white border border-[#E5E0D8] rounded-xl shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
                      <BookOpen className="w-4 h-4 text-emerald-800" />
                      <span>Atuação Parlamentar: {politician.nome}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 py-1">
                      <div className="text-xs">
                        <span className="text-slate-500">Cargo:</span>{' '}
                        <strong className="text-slate-900">{politician.cargo} ({politician.uf})</strong>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Partido:</span>{' '}
                        <strong className="text-slate-900">{politician.partido}</strong>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Voto:</span>{' '}
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            isSim
                              ? 'bg-emerald-100 text-emerald-900'
                              : isNao
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {vote.votoOriginal || vote.tipoVoto}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed pt-1">
                      {posicionamentoText || `${politician.nome} registrou formalmente o voto "${vote.votoOriginal || vote.tipoVoto}" na sessão deliberativa da ${vote.orgao}, compondo a maioria que deliberou sobre a matéria.`}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé Editorial com Link Oficial da Casa Legislativa */}
        <div className="p-4 sm:p-5 bg-[#f7f5f0] border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-sans">
            <Scale className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
            <span>Consultoria cívica baseada em dados abertos oficiais da Câmara e do Senado.</span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <a
              href={vote.linkOficial}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-[#E5E0D8] rounded-xl shadow-2xs hover:border-slate-400 transition-colors"
            >
              <span>Ver ata oficial no {vote.orgao === 'Senado Federal' ? 'Senado' : 'Câmara'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
