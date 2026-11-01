import { CharacterStats, GameState } from './types';

/**
 * Фабрика персонажа для тестов. Переопределяйте поля через overrides.
 */
export function makeCharacter(overrides: Partial<CharacterStats> = {}): CharacterStats {
  return {
    name: 'Тест',
    race: 'human',
    raceName: 'Человек',
    age: 20,
    health: 80,
    maxHealth: 100,
    sanity: 70,
    warpCorruption: 0,
    warpAttention: 0,
    luck: 5,
    credits: 50,
    food: 10,
    ammo: 0,
    caste: 'Рабочий',
    planet: 'Терра',
    planetType: 'Улей-мир',
    status: 'Взрослый',
    influence: 10,
    inventory: [],
    augmentics: [],
    factionRelations: {
      imperium: 0,
      chaos: 0,
      xenos: 0,
      criminals: 0,
      faith: 0,
      nobility: 0,
      commoners: 0,
    },
    npcs: [],
    hiddenParams: {
      faith: 5,
      cunning: 5,
      strength: 5,
      willpower: 5,
      mutation: 0,
      suspicion: 0,
      waaagh: 0,
      psi: 0,
      nobility: 0,
      cruelty: 0,
      unity: 0,
      techSkill: 0,
      sneakiness: 0,
    },
    traits: [],
    body: 'обычное тело',
    gender: 'мужской',
    // Кулдаун >1 намеренно: в тестах микро-события не должны случайно
    // двигать suspicion/sanity и ломать предпосылки про условия смерти.
    microEventCooldown: 3,
    keyChoices: [],
    ...overrides,
  };
}

export function makeGameState(characterOverrides: Partial<CharacterStats> = {}): GameState {
  return {
    character: makeCharacter(characterOverrides),
    currentEvent: {
      text: 'Тестовое событие.',
      choices: [
        { letter: 'А', text: 'Действовать', effects: { description: 'Ничего не происходит.' } },
      ],
    },
    history: [],
    gameOver: false,
    deathMessage: '',
    activeQuests: [],
    completedQuests: [],
  };
}
