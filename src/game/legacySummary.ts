import type { LegacyData, Race } from './types';

/** Русские названия рас для отображения в сводке legacy. */
export const RACE_LABELS_RU: Record<Race, string> = {
  human: 'Человек',
  ork: 'Орк',
  eldar: 'Аэльдар',
  dark_eldar: 'Друкхаари',
  tau: 'Тау',
  gretchin: 'Гретчин',
};

/** Сводка прошлых жизней для стартового экрана (пункт 2 дорожной карты UI/UX). */
export interface LegacySummary {
  totalGamesPlayed: number;
  bestAge: number;
  /** «до 47 лет» или null, если ещё никто не умирал. */
  bestLifeText: string | null;
  racesPlayedText: string | null;
  achievementsCount: number;
}

/**
 * Чистая функция: превращает сырые данные legacy в готовые строки для UI.
 * Никакого localStorage — компонент сам решает, откуда брать данные.
 */
export function buildLegacySummary(legacy: LegacyData): LegacySummary {
  const bestLifeText = legacy.bestAge > 0 ? `до ${legacy.bestAge} лет` : null;
  const racesPlayedText =
    legacy.racesPlayed.length > 0
      ? legacy.racesPlayed.map((r) => RACE_LABELS_RU[r]).join(', ')
      : null;
  return {
    totalGamesPlayed: legacy.totalGamesPlayed,
    bestAge: legacy.bestAge,
    bestLifeText,
    racesPlayedText,
    achievementsCount: legacy.achievementsEverUnlocked.length,
  };
}
