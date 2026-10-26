/**
 * Utilitários de busca tolerante a erros e normalização de texto
 */

export function normalizeString(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Calcula distância de Levenshtein entre duas strings curtas
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substituição
          matrix[i][j - 1] + 1,     // inserção
          matrix[i - 1][j] + 1      // deleção
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Score de similaridade entre 0 e 1, combinando correspondência de prefixo,
 * substring, tokens e distância de edição.
 */
export function calculateSimilarity(candidate: string, query: string): number {
  const normCandidate = normalizeString(candidate);
  const normQuery = normalizeString(query);

  if (!normQuery) return 1;
  if (!normCandidate) return 0;

  // Match exato
  if (normCandidate === normQuery) return 1;

  // Match por substring completo
  if (normCandidate.includes(normQuery)) {
    return 0.85 + (normQuery.length / normCandidate.length) * 0.15;
  }

  // Token match (ex: "ciro" em "ciro nogueira")
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const candidateTokens = normCandidate.split(/\s+/).filter(Boolean);

  let tokensMatched = 0;
  for (const qToken of queryTokens) {
    const foundToken = candidateTokens.some(cToken => {
      if (cToken.startsWith(qToken)) return true;
      if (cToken.includes(qToken)) return true;
      // Tolerância Levenshtein para pequenos erros (ex: "eduardo" vs "eduadro")
      if (qToken.length >= 4 && levenshteinDistance(qToken, cToken) <= 2) return true;
      return false;
    });
    if (foundToken) tokensMatched++;
  }

  if (tokensMatched > 0) {
    return 0.6 + (tokensMatched / queryTokens.length) * 0.35;
  }

  // Fallback geral Levenshtein se a query tiver tamanho razoável
  if (normQuery.length >= 3) {
    const dist = levenshteinDistance(normCandidate.slice(0, normQuery.length + 2), normQuery);
    if (dist <= 2) return 0.5;
  }

  return 0;
}
