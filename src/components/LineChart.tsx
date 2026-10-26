import React, { useState } from 'react';
import { IBGEDataPoint } from '../types';

interface LineChartProps {
  points: IBGEDataPoint[];
  title: string;
  unit: string;
  color?: string;
  accentBg?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  points,
  title,
  unit,
  color = '#2563eb', // Azul Brasil padrão
  accentBg = 'rgba(37, 99, 235, 0.08)',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<IBGEDataPoint | null>(null);

  if (!points || points.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        Dados insuficientes para gerar a série temporal
      </div>
    );
  }

  // Dimensões do SVG
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 28;

  const values = points.map(p => p.valor);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // Mapeamento de coordenadas
  const coordinates = points.map((p, index) => {
    const x = paddingX + (index / (points.length - 1 || 1)) * (width - 2 * paddingX);
    // Y invertido no SVG
    const y = height - paddingY - ((p.valor - minVal) / range) * (height - 2 * paddingY);
    return { x, y, point: p };
  });

  // Caminho da linha
  const pathD = coordinates.reduce((acc, coord, idx) => {
    return idx === 0 ? `M ${coord.x} ${coord.y}` : `${acc} L ${coord.x} ${coord.y}`;
  }, '');

  // Caminho da área preenchida
  const areaD = `${pathD} L ${coordinates[coordinates.length - 1].x} ${height - paddingY} L ${coordinates[0].x} ${height - paddingY} Z`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900">{title}</h4>
          <span className="text-[11px] text-slate-500">{unit}</span>
        </div>
        {hoveredPoint ? (
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 block font-mono">
              {hoveredPoint.valorFormatado}
            </span>
            <span className="text-[10px] text-slate-400">Ano de {hoveredPoint.ano}</span>
          </div>
        ) : (
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900 block font-mono">
              {points[points.length - 1]?.valorFormatado}
            </span>
            <span className="text-[10px] text-slate-400">Último registro ({points[points.length - 1]?.ano})</span>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Linhas horizontais de grade */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#f1f5f9"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#e2e8f0"
          />

          {/* Área sombreada sob a curva */}
          <path d={areaD} fill={`url(#grad-${title})`} />

          {/* Traçado da linha */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de dados */}
          {coordinates.map(({ x, y, point }) => {
            const isHovered = hoveredPoint?.ano === point.ano;
            return (
              <g key={point.ano}>
                {/* Alvo clicável e hover ampliado */}
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Ponto visível */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : 3.5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-200 pointer-events-none"
                />
                {/* Rótulo de ano no eixo X */}
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {point.ano}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
