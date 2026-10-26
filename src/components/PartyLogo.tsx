import React from 'react';

interface PartyLogoProps {
  party: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PartyLogo: React.FC<PartyLogoProps> = ({
  party,
  className = '',
  size = 'md',
}) => {
  const cleanParty = (party || '').toUpperCase().trim();

  // Dimensões conforme o tamanho
  const sizeMap = {
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-8 h-8 text-[11px]',
    lg: 'w-10 h-10 text-xs',
  };

  const currentSize = sizeMap[size];

  switch (cleanParty) {
    case 'PT':
      return (
        <div
          title="Partido dos Trabalhadores"
          className={`shrink-0 rounded-full bg-[#cc0000] flex items-center justify-center text-white font-black shadow-xs ring-1 ring-red-700/30 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1" fill="none">
            {/* Estrela de 5 pontas central */}
            <polygon
              points="20,5 24,15 35,15 26,22 29,33 20,26 11,33 14,22 5,15 16,15"
              fill="#ffffff"
            />
            <text
              x="20"
              y="22.5"
              textAnchor="middle"
              fill="#cc0000"
              fontWeight="900"
              fontSize="10"
              fontFamily="sans-serif"
            >
              PT
            </text>
          </svg>
        </div>
      );

    case 'PL':
      return (
        <div
          title="Partido Liberal"
          className={`shrink-0 rounded-lg bg-gradient-to-br from-[#1e3a8a] to-[#0f2459] flex items-center justify-center text-white font-extrabold shadow-xs border border-blue-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <path
              d="M6 26C12 20 22 28 34 22"
              stroke="#facc15"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M8 30C14 24 24 32 34 26"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <text
              x="20"
              y="18"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="12"
              fontFamily="sans-serif"
            >
              PL
            </text>
          </svg>
        </div>
      );

    case 'UNIÃO':
    case 'UNIAO':
      return (
        <div
          title="União Brasil"
          className={`shrink-0 rounded-lg bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center text-white font-extrabold shadow-xs border border-sky-400/30 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-0.5">
            <polygon points="12,8 28,8 20,20" fill="#f59e0b" />
            <polygon points="12,32 28,32 20,20" fill="#ffffff" />
            <text
              x="20"
              y="23"
              textAnchor="middle"
              fill="#0369a1"
              fontWeight="900"
              fontSize="8"
              fontFamily="sans-serif"
            >
              UNIÃO
            </text>
          </svg>
        </div>
      );

    case 'MDB':
      return (
        <div
          title="Movimento Democrático Brasileiro"
          className={`shrink-0 rounded-lg bg-[#15803d] flex items-center justify-center text-white font-black shadow-xs border border-emerald-500/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            {/* Chama tricolor com ponta vermelha e verde */}
            <path
              d="M10 24C10 16 16 12 20 6C22 10 24 13 24 16C26 14 27 12 27 9C30 14 31 18 31 24C31 29.5 26.5 34 20.5 34C14.5 34 10 29.5 10 24Z"
              fill="#ffffff"
            />
            <path
              d="M20 6C22 10 24 13 24 16C26 14 27 12 27 9C29 13 29.5 16 29 19C28 17 26.5 15.5 25 15C25 18 24 20 22 22C21 18 20 14 20 6Z"
              fill="#dc2626"
            />
            <text
              x="20.5"
              y="28"
              textAnchor="middle"
              fill="#15803d"
              fontWeight="900"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              MDB
            </text>
          </svg>
        </div>
      );

    case 'PSD':
      return (
        <div
          title="Partido Social Democrático"
          className={`shrink-0 rounded-lg bg-gradient-to-br from-[#ea580c] to-[#c2410c] flex items-center justify-center text-white font-black shadow-xs border border-orange-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <circle cx="20" cy="20" r="16" fill="#ffffff" fillOpacity="0.15" />
            <path d="M12 28L20 12L28 28Z" fill="#1d4ed8" fillOpacity="0.8" />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="10"
              fontFamily="sans-serif"
            >
              PSD
            </text>
          </svg>
        </div>
      );

    case 'PP':
      return (
        <div
          title="Progressistas"
          className={`shrink-0 rounded-lg bg-[#0284c7] flex items-center justify-center text-white font-black shadow-xs border border-sky-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <rect x="7" y="11" width="26" height="18" rx="4" fill="#ffffff" />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="#0284c7"
              fontWeight="900"
              fontSize="13"
              fontFamily="sans-serif"
            >
              PP
            </text>
          </svg>
        </div>
      );

    case 'REPUBLICANOS':
      return (
        <div
          title="Republicanos"
          className={`shrink-0 rounded-lg bg-[#1e40af] flex items-center justify-center text-white font-black shadow-xs border border-blue-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <circle cx="20" cy="20" r="15" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
            <text
              x="20"
              y="25"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="14"
              fontFamily="sans-serif"
            >
              R
            </text>
          </svg>
        </div>
      );

    case 'PODE':
    case 'PODEMOS':
      return (
        <div
          title="Podemos"
          className={`shrink-0 rounded-full bg-[#0d9488] flex items-center justify-center text-white font-black shadow-xs border border-teal-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <circle cx="20" cy="20" r="14" fill="#ffffff" fillOpacity="0.2" />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="8"
              fontFamily="sans-serif"
            >
              PODE
            </text>
          </svg>
        </div>
      );

    case 'PSB':
      return (
        <div
          title="Partido Socialista Brasileiro"
          className={`shrink-0 rounded-lg bg-[#e11d48] flex items-center justify-center text-white font-black shadow-xs border border-rose-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <circle cx="20" cy="20" r="15" fill="#facc15" />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="#e11d48"
              fontWeight="900"
              fontSize="9"
              fontFamily="sans-serif"
            >
              PSB
            </text>
          </svg>
        </div>
      );

    case 'PDT':
      return (
        <div
          title="Partido Democrático Trabalhista"
          className={`shrink-0 rounded-lg bg-[#b91c1c] flex items-center justify-center text-white font-black shadow-xs border border-red-500/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            {/* Flor / símbolo clássico do trabalhismo */}
            <circle cx="20" cy="14" r="5" fill="#f59e0b" />
            <path d="M20 19V32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <text
              x="20"
              y="30"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              PDT
            </text>
          </svg>
        </div>
      );

    case 'PSDB':
      return (
        <div
          title="Partido da Social Democracia Brasileira"
          className={`shrink-0 rounded-lg bg-[#0284c7] flex items-center justify-center text-white font-black shadow-xs border border-blue-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <polygon points="10,12 30,12 25,24 15,24" fill="#facc15" />
            <text
              x="20"
              y="32"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              PSDB
            </text>
          </svg>
        </div>
      );

    case 'PSOL':
      return (
        <div
          title="Partido Socialismo e Liberdade"
          className={`shrink-0 rounded-full bg-[#f59e0b] flex items-center justify-center text-white font-black shadow-xs border border-amber-500/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            {/* Sol radiante */}
            <circle cx="20" cy="20" r="10" fill="#dc2626" />
            <text
              x="20"
              y="23.5"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              PSOL
            </text>
          </svg>
        </div>
      );

    case 'NOVO':
      return (
        <div
          title="Partido Novo"
          className={`shrink-0 rounded-lg bg-[#ea580c] flex items-center justify-center text-white font-black shadow-xs border border-orange-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-extrabold tracking-tighter text-[9px] text-white">
            NOVO
          </span>
        </div>
      );

    case 'PCdoB':
    case 'PCDOB':
      return (
        <div
          title="Partido Comunista do Brasil"
          className={`shrink-0 rounded-lg bg-[#991b1b] flex items-center justify-center text-white font-black shadow-xs border border-red-800/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <polygon points="20,8 23,16 31,16 25,21 27,29 20,24 13,29 15,21 9,16 17,16" fill="#facc15" />
            <text
              x="20"
              y="33"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="6"
              fontFamily="sans-serif"
            >
              PCdoB
            </text>
          </svg>
        </div>
      );

    case 'REDE':
      return (
        <div
          title="Rede Sustentabilidade"
          className={`shrink-0 rounded-lg bg-[#059669] flex items-center justify-center text-white font-black shadow-xs border border-emerald-400/40 select-none ${currentSize} ${className}`}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full p-1">
            <circle cx="20" cy="20" r="12" fill="#34d399" fillOpacity="0.4" />
            <text
              x="20"
              y="24"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="7"
              fontFamily="sans-serif"
            >
              REDE
            </text>
          </svg>
        </div>
      );

    case 'SOLIDARIEDADE':
      return (
        <div
          title="Solidariedade"
          className={`shrink-0 rounded-lg bg-[#d97706] flex items-center justify-center text-white font-black shadow-xs border border-amber-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[9px] text-white">77</span>
        </div>
      );

    case 'PV':
      return (
        <div
          title="Partido Verde"
          className={`shrink-0 rounded-lg bg-[#16a34a] flex items-center justify-center text-white font-black shadow-xs border border-green-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[10px] text-white">PV</span>
        </div>
      );

    case 'CIDADANIA':
      return (
        <div
          title="Cidadania"
          className={`shrink-0 rounded-lg bg-[#db2777] flex items-center justify-center text-white font-black shadow-xs border border-pink-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[9px] text-white">23</span>
        </div>
      );

    case 'AVANTE':
      return (
        <div
          title="Avante"
          className={`shrink-0 rounded-lg bg-[#0284c7] flex items-center justify-center text-white font-black shadow-xs border border-sky-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[8px] text-white">70</span>
        </div>
      );

    case 'PRD':
      return (
        <div
          title="Partido Renovação Democrática"
          className={`shrink-0 rounded-lg bg-[#1e3a8a] flex items-center justify-center text-white font-black shadow-xs border border-blue-400/40 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[9px] text-white">PRD</span>
        </div>
      );

    default:
      return (
        <div
          title={cleanParty || 'Partido'}
          className={`shrink-0 rounded-lg bg-slate-800 flex items-center justify-center text-white font-black shadow-xs border border-slate-600 select-none ${currentSize} ${className}`}
        >
          <span className="font-black text-[8.5px] truncate px-0.5">
            {cleanParty.slice(0, 4) || 'P'}
          </span>
        </div>
      );
  }
};
