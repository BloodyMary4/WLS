import { CharacterStats, GameEvent, GameState, LegacyData } from './types';

export function validateCharacter(character: CharacterStats): boolean {
  if (!character) return false;
  
  if (!character.name || !character.race || !character.planet) return false;
  
  if (character.health < 0 || character.health > character.maxHealth) return false;
  if (character.credits < 0) return false;
  if (character.age < 0) return false;
  
  if (character.sanity < 0 || character.sanity > 100) return false;
  if (character.warpCorruption < 0 || character.warpCorruption > 100) return false;
  if (character.warpAttention < 0 || character.warpAttention > 10) return false;
  if (character.luck < 1 || character.luck > 10) return false;
  if (character.food < 0) return false;
  if (character.ammo < 0) return false;
  if (character.influence < 0 || character.influence > 100) return false;
  
  const stats = ['faith', 'cunning', 'strength', 'willpower', 'mutation', 'suspicion'];
  for (const stat of stats) {
    const value = character.hiddenParams[stat as keyof typeof character.hiddenParams];
    if (value !== undefined && (value < 0 || value > 10)) return false;
  }
  
  const raceStats = ['waaagh', 'psi', 'nobility', 'cruelty', 'unity', 'techSkill', 'sneakiness'];
  for (const stat of raceStats) {
    const value = character.hiddenParams[stat as keyof typeof character.hiddenParams];
    if (value !== undefined && (value < 0 || value > 10)) return false;
  }
  
  if (!Array.isArray(character.inventory)) return false;
  if (!Array.isArray(character.augmentics)) return false;
  if (!Array.isArray(character.traits)) return false;
  if (!Array.isArray(character.keyChoices)) return false;
  
  if (!character.factionRelations) return false;
  const factions = ['imperium', 'chaos', 'xenos', 'criminals', 'nobility', 'commoners'];
  for (const faction of factions) {
    const value = character.factionRelations[faction as keyof typeof character.factionRelations];
    if (value < -10 || value > 10) return false;
  }
  
  return true;
}

export function validateEvent(event: GameEvent): boolean {
  if (!event) return false;
  if (!event.text || event.text.trim() === '') return false;
  if (!event.choices || !Array.isArray(event.choices)) return false;
  if (event.choices.length === 0) return false;
  
  for (const choice of event.choices) {
    if (!choice.letter || !choice.text || !choice.effects) return false;
    if (!choice.effects.description) return false;
  }
  
  return true;
}

export function validateGameState(gameState: GameState): boolean {
  if (!gameState) return false;
  if (!validateCharacter(gameState.character)) return false;
  if (!validateEvent(gameState.currentEvent)) return false;
  if (!Array.isArray(gameState.history)) return false;
  if (typeof gameState.gameOver !== 'boolean') return false;
  
  return true;
}

export function validateLegacyData(data: any): data is LegacyData {
  if (!data || typeof data !== 'object') return false;
  
  if (typeof data.totalGamesPlayed !== 'number') return false;
  if (typeof data.totalYearsLived !== 'number') return false;
  if (typeof data.bestAge !== 'number') return false;
  if (!Array.isArray(data.achievementsEverUnlocked)) return false;
  if (!Array.isArray(data.racesPlayed)) return false;
  if (typeof data.deathsByCause !== 'object') return false;
  
  if (data.totalGamesPlayed < 0) return false;
  if (data.totalYearsLived < 0) return false;
  if (data.bestAge < 0) return false;
  
  return true;
}

export function createDefaultEvent(): GameEvent {
  return {
    text: 'Произошло нечто странное. Продолжай свой путь.',
    choices: [
      {
        letter: 'А',
        text: 'Идти дальше',
        effects: { description: 'Ты продолжаешь свой путь.' }
      }
    ]
  };
}
