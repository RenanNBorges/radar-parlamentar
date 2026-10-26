import { UFInfo } from '../types';

export const ESTADOS_BRASIL: UFInfo[] = [
  { id: 11, sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { id: 12, sigla: 'AC', nome: 'Acre', regiao: 'Norte' },
  { id: 13, sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { id: 14, sigla: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { id: 15, sigla: 'PA', nome: 'Pará', regiao: 'Norte' },
  { id: 16, sigla: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { id: 17, sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' },
  { id: 21, sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { id: 22, sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { id: 23, sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { id: 24, sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { id: 25, sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { id: 26, sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { id: 27, sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { id: 28, sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  { id: 29, sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { id: 31, sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { id: 32, sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { id: 35, sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  { id: 41, sigla: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { id: 42, sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' },
  { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { id: 50, sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  { id: 51, sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { id: 52, sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { id: 53, sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
];

export async function fetchEstadosIBGE(): Promise<UFInfo[]> {
  try {
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Falha ao obter estados do IBGE');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item: any) => ({
        id: item.id,
        sigla: item.sigla,
        nome: item.nome,
        regiao: item.regiao?.nome || '',
      }));
    }
  } catch (err) {
    console.warn('Usando lista local consolidada de estados:', err);
  }
  return ESTADOS_BRASIL;
}

export function getUFBySigla(sigla: string): UFInfo | undefined {
  const upper = (sigla || '').trim().toUpperCase();
  return ESTADOS_BRASIL.find(uf => uf.sigla === upper);
}

export async function detectUserUFByGPS(): Promise<{ uf: string; stateName?: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocalização não suportada pelo navegador.'));
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
          const res = await fetch(url, {
            headers: {
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
          });
          if (!res.ok) {
            throw new Error(`Nominatim respondeu com código ${res.status}`);
          }
          const data = await res.json();
          const address = data?.address || {};

          // Extração direta de ISO3166-2-lvl4 (ex: "BR-SP" -> "SP")
          const iso = address['ISO3166-2-lvl4'];
          if (iso && typeof iso === 'string' && iso.startsWith('BR-')) {
            const sigla = iso.replace('BR-', '').toUpperCase();
            if (ESTADOS_BRASIL.some(u => u.sigla === sigla)) {
              return resolve({ uf: sigla, stateName: address.state || address.region });
            }
          }

          // Fallback por nome do estado
          const stateName = address.state || address.region || '';
          if (stateName) {
            const found = ESTADOS_BRASIL.find(
              u =>
                u.nome.toLowerCase() === stateName.toLowerCase() ||
                stateName.toLowerCase().includes(u.nome.toLowerCase())
            );
            if (found) {
              return resolve({ uf: found.sigla, stateName: found.nome });
            }
          }

          // Fallback padrão se estiver no Brasil mas sem correspondência exata
          resolve({ uf: 'DF', stateName: 'Distrito Federal' });
        } catch (err: any) {
          reject(new Error(err.message || 'Falha na resolução geográfica com Nominatim.'));
        }
      },
      error => {
        let msg = 'Permissão de localização negada ou indisponível.';
        if (error.code === error.TIMEOUT) msg = 'Tempo limite de geolocalização esgotado.';
        reject(new Error(msg));
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
}
