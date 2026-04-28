import type { Edad } from '@src/shared/types/models';

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatEdad(edad: Edad): string {
  const parts = [
    edad.anios ? pluralize(edad.anios, 'año', 'años') : null,
    edad.meses ? pluralize(edad.meses, 'mes', 'meses') : null,
    edad.dias ? pluralize(edad.dias, 'día', 'días') : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(', ') : 'Edad no especificada';
}
