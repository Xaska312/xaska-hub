/** Pesos colombianos sin decimales y con punto de miles: 13800 → "$13.800". */
export function formatPesos(value: number): string {
  const digits = Math.round(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}$${digits}`;
}
