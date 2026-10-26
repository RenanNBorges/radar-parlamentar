import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { ThematicScore } from '../services/thematicAnalysis';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ThematicRadarChartProps {
  scores: ThematicScore[];
  politicianName: string;
  color?: string;
}

export const ThematicRadarChart: React.FC<ThematicRadarChartProps> = ({
  scores,
  politicianName,
  color = '#15803d', // Verde cívico por padrão
}) => {
  // Prepara dados formatados para o Recharts, garantindo valores válidos entre 0 e 100 (sem NaN)
  const chartData = scores.map(s => {
    const hasData = s.taxaAprovacao !== null && !isNaN(s.taxaAprovacao);
    return {
      area: s.siglaCurta,
      nomeCompleto: s.areaNome,
      // Se tiver dados, plota a taxa real (0 a 100); caso contrário, 0 para não distorcer o polígono
      taxa: hasData ? s.taxaAprovacao : 0,
      taxaReal: hasData ? s.taxaAprovacao : null,
      totalVotos: s.totalVotos || 0,
      votosSim: s.votosSim || 0,
      votosNao: s.votosNao || 0,
      dadosInsuficientes: s.dadosInsuficientes,
    };
  });

  const totalVotacoesAvaliadas = scores.reduce((acc, s) => acc + s.totalVotos, 0);
  const areasComVoto = scores.filter(s => s.taxaAprovacao !== null).length;

  // Detecção de prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-xs">
      {/* Cabeçalho Editorial com Esclarecimento de Escopo */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Votações Recentes
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                · Legislatura Atual (2023–2027)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-editorial">
              Alinhamento Temático de {politicianName}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold px-3 py-1.5 bg-[#fbf9f5] border border-[#E5E0D8] rounded-xl text-slate-700">
            <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: color }} />
            <span>% de votos favoráveis ("Sim")</span>
          </div>
        </div>

        {/* Notificação Clara sobre o Escopo Recente */}
        <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Atenção ao escopo:</strong> Este gráfico retrata o posicionamento do parlamentar nas <strong>votações nominais recentes</strong> apreciadas no plenário da Casa Legislativa. Os eixos com valor zero ou sem marcação indicam áreas onde ainda não houve matérias nominais suficientes votadas no período.
          </p>
        </div>
      </div>

      {/* Gráfico de Radar Responsivo */}
      <div className="w-full h-80 sm:h-96 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#E5E0D8" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="area"
              tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              stroke="#cbd5e1"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#E5E0D8] p-3.5 rounded-xl shadow-lg text-xs text-slate-800 max-w-xs z-50">
                      <span className="font-bold text-slate-900 block font-editorial text-sm border-b border-slate-100 pb-1 mb-1.5">
                        {data.nomeCompleto}
                      </span>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500 font-medium">Aprovação ("Sim"):</span>
                          <span className="font-mono font-bold text-emerald-800 text-sm">
                            {data.taxaReal !== null ? `${data.taxaReal}%` : 'Sem votos suficientes'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span>Votos Favoráveis:</span>
                          <span className="font-mono font-semibold text-slate-700">{data.votosSim} matéria(s)</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500">
                          <span>Votos Contrários:</span>
                          <span className="font-mono font-semibold text-slate-700">{data.votosNao} matéria(s)</span>
                        </div>
                        {data.dadosInsuficientes && (
                          <div className="pt-1 mt-1 border-t border-slate-100 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Poucas deliberações registradas neste tema recente.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name={politicianName}
              dataKey="taxa"
              stroke={color}
              strokeWidth={2.5}
              fill={color}
              fillOpacity={0.25}
              isAnimationActive={!prefersReducedMotion}
              animationDuration={600}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumo de Cobertura */}
      <div className="mt-4 pt-3 border-t border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            <strong>{areasComVoto} de {scores.length} áreas</strong> com votações nominais registradas recentemente ({totalVotacoesAvaliadas} votos computados no perfil).
          </span>
        </div>
        <span className="text-slate-500">
          Escala: 0% (voto contrário sistemático) a 100% (voto integralmente favorável).
        </span>
      </div>
    </div>
  );
};
