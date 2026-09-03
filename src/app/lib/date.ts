/**
 * Chave de data no fuso horário LOCAL do aparelho (YYYY-MM-DD).
 *
 * `date.toISOString().split('T')[0]` parece equivalente, mas converte pra
 * UTC antes de formatar - no Brasil (UTC-3), fazer algo à noite (depois
 * de ~21h) grava a data de amanhã, o que quebra qualquer contagem de
 * "dias seguidos" (streak, desafios diários, check-in do dia).
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
