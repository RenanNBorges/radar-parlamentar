import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import { UFInfo } from '../types';
import { detectUserUFByGPS, fetchEstadosIBGE } from '../services/geoService';

interface StateOnboardingModalProps {
  isOpen: boolean;
  onSelectState: (uf: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const StateOnboardingModal: React.FC<StateOnboardingModalProps> = ({
  isOpen,
  onSelectState,
  onClose,
  canClose = false,
}) => {
  const [estados, setEstados] = useState<UFInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    fetchEstadosIBGE().then(list => setEstados(list));
  }, []);

  if (!isOpen) return null;

  const handleGPSDetect = async () => {
    setIsDetectingGPS(true);
    setGpsError(null);
    try {
      const result = await detectUserUFByGPS();
      setIsDetectingGPS(false);
      onSelectState(result.uf);
    } catch (err: any) {
      setIsDetectingGPS(false);
      setGpsError(err.message || 'Não foi possível detectar a localização automaticamente.');
    }
  };

  const filteredEstados = estados.filter(
    e =>
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Banner com a tríade cívica */}
        <div className="h-2 w-full flex">
          <div className="h-full w-1/3 bg-emerald-600" />
          <div className="h-full w-1/3 bg-amber-400" />
          <div className="h-full w-1/3 bg-blue-700" />
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Selecione seu Estado (UF)</h2>
                <p className="text-xs text-slate-500">Defina sua Unidade Federativa para carregar seus representantes</p>
              </div>
            </div>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            )}
          </div>

          {/* Opção 1: Detecção Automática por GPS */}
          <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Recomendado
                </span>
                <h4 className="text-sm font-semibold text-slate-900">
                  Localização Automática via GPS
                </h4>
                <p className="text-xs text-slate-500">
                  Resolução rápida usando Nominatim OpenStreetMap
                </p>
              </div>

              <button
                type="button"
                onClick={handleGPSDetect}
                disabled={isDetectingGPS}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-medium text-xs rounded-lg shadow-sm transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isDetectingGPS ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Detectando...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 text-amber-300" />
                    Detectar meu Estado
                  </>
                )}
              </button>
            </div>

            {gpsError && (
              <div className="mt-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span>{gpsError}</span>
                  <span className="block text-slate-600 mt-0.5">Por favor, escolha manualmente na lista abaixo.</span>
                </div>
              </div>
            )}
          </div>

          {/* Divisor */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400 uppercase tracking-widest font-semibold">
              Ou escolha manualmente (IBGE)
            </span>
          </div>

          {/* Opção 2: Busca e Lista de Estados */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome ou sigla (ex: São Paulo, SP, Ceará...)"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 pr-2">
              {filteredEstados.map(e => (
                <button
                  key={e.sigla}
                  type="button"
                  onClick={() => onSelectState(e.sigla)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/60 transition-all text-left group cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                      {e.sigla}
                    </span>
                    <span className="block text-xs text-slate-500 truncate max-w-[110px]">
                      {e.nome}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-emerald-700">
                    {e.regiao}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
