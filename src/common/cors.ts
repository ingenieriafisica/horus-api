const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4200',
];

/**
 * Normaliza la variable de entorno ALLOWED_ORIGINS para `app.enableCors({ credentials: true })`.
 *
 * - Si contiene `*` o `0.0.0.0`, retorna `true` para reflejar el header `Origin` entrante
 *   (con `credentials: true`, Express/CORS no permite literal `Access-Control-Allow-Origin: *`
 *   y `['0.0.0.0']` nunca coincide con orígenes reales de navegador).
 * - Para listas separadas por coma, elimina espacios y barras finales `/`.
 */
export function resolveCorsOrigin(rawOrigins?: string): boolean | string[] {
  const list = (rawOrigins ?? '')
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (list.length === 0) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  if (list.includes('*') || list.includes('0.0.0.0')) {
    return true;
  }

  return list;
}
