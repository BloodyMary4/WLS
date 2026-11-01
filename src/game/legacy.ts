import { LegacyData, Race } from './types';
import { validateLegacyData } from './validation';

const LEGACY_KEY = 'grimdark_legacy';

export function getLegacy(): LegacyData {
  const stored = localStorage.getItem(LEGACY_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (validateLegacyData(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse legacy ', error);
    }
  }
  return getDefaultLegacy();
}

function getDefaultLegacy(): LegacyData {
  return {
    totalGamesPlayed: 0,
    totalYearsLived: 0,
    bestAge: 0,
    achievementsEverUnlocked: [],
    racesPlayed: [],
    deathsByCause: {},
  };
}

function saveLegacy(legacy: LegacyData): void {
  localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
}

export function updateLegacyOnDeath(
  legacy: LegacyData,
  age: number,
  race: Race,
  deathCause: string,
  achievements: string[]
): LegacyData {
  const newLegacy = { ...legacy };
  
  newLegacy.totalGamesPlayed += 1;
  newLegacy.totalYearsLived += age;
  newLegacy.bestAge = Math.max(newLegacy.bestAge, age);
  
  if (!newLegacy.racesPlayed.includes(race)) {
    newLegacy.racesPlayed = [...newLegacy.racesPlayed, race];
  }
  
  const newAchievements = new Set(newLegacy.achievementsEverUnlocked);
  achievements.forEach(a => newAchievements.add(a));
  newLegacy.achievementsEverUnlocked = Array.from(newAchievements);
  
  newLegacy.deathsByCause[deathCause] = (newLegacy.deathsByCause[deathCause] || 0) + 1;
  
  saveLegacy(newLegacy);
  return newLegacy;
}

export function getLegacyBonuses(legacy: LegacyData): {
  startingCredits: number;
  startingHealthBonus: number;
  description: string;
} {
  let startingCredits = 0;
  let startingHealthBonus = 0;
  const descriptions: string[] = [];
  
  if (legacy.totalGamesPlayed >= 5) {
    startingCredits += 5;
    descriptions.push('Опыт выживания (+5₡)');
  }
  if (legacy.totalGamesPlayed >= 10) {
    startingCredits += 10;
    descriptions.push('Ветеран (+10₡)');
  }
  
  if (legacy.bestAge >= 30) {
    startingHealthBonus += 5;
    descriptions.push('Закалённый (+5 HP)');
  }
  if (legacy.bestAge >= 50) {
    startingHealthBonus += 10;
    descriptions.push('Долгожитель (+10 HP)');
  }
  
  if (legacy.racesPlayed.length >= 3) {
    startingCredits += 10;
    descriptions.push('Исследователь рас (+10₡)');
  }
  if (legacy.racesPlayed.length >= 6) {
    startingCredits += 20;
    descriptions.push('Мастер всех рас (+20₡)');
  }
  
  return {
    startingCredits,
    startingHealthBonus,
    description: descriptions.join(', ') || 'Нет бонусов',
  };
}
