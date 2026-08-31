export interface TimeBreakdown {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function parseStartDate(startDate: string): Date {
  return new Date(`${startDate}T00:00:00`);
}

export function getTimeTogether(startDate: Date, now: Date = new Date()): TimeBreakdown {
  const diff = Math.max(0, now.getTime() - startDate.getTime());

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.44);
  const years = Math.floor(days / 365.25);

  return {
    years,
    months: months % 12,
    days: Math.floor((days % 365.25) % 30.44),
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

/**
 * Sempre retorna o próximo aniversário de namoro no futuro - se o aniversário
 * deste ano já passou, avança automaticamente para o do ano seguinte.
 * É assim que o app "se corrige sozinho" quando um ano se completa.
 */
export function getNextAnniversary(startDate: Date, now: Date = new Date()): { date: Date; yearNumber: number } {
  const candidate = new Date(startDate);
  candidate.setFullYear(now.getFullYear());
  candidate.setHours(0, 0, 0, 0);

  if (candidate.getTime() <= now.getTime()) {
    candidate.setFullYear(candidate.getFullYear() + 1);
  }

  const yearNumber = candidate.getFullYear() - startDate.getFullYear();
  return { date: candidate, yearNumber };
}

export function getCountdownTo(target: Date, now: Date = new Date()): TimeBreakdown {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30.44);

  return {
    years: 0,
    months,
    days: days % 30,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
  };
}

export function formatAnniversaryLabel(yearNumber: number): string {
  return yearNumber === 1 ? '1 ano' : `${yearNumber} anos`;
}

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function formatDatePt(date: Date): string {
  return `${date.getDate()} de ${MONTH_NAMES_PT[date.getMonth()]} de ${date.getFullYear()}`;
}
