export type Race = 'human' | 'ork' | 'eldar' | 'dark_eldar' | 'tau' | 'gretchin';

export interface FactionRelations {
  imperium: number;
  chaos: number;
  xenos: number;
  criminals: number;
  nobility: number;
  commoners: number;
  /** Вера в Господство Империума и божественность Императора (0..100). Конвертируется в Верность (imperialCreed) у людей */
  faith: number;
}

export interface LegacyData {
  totalGamesPlayed: number;
  totalYearsLived: number;
  bestAge: number;
  achievementsEverUnlocked: string[];
  racesPlayed: Race[];
  deathsByCause: Record<string, number>;
}

export interface NPC {
  id: string;
  name: string;
  role: string; // Торговец, Инквизитор, Культист, Солдат и т.д.
  relationship: number; // -100 до 100
  met: boolean;
  lastInteraction?: number;
  description?: string; // Краткое описание персонажа
}

export interface CharacterStats {
  name: string;
  race: Race;
  raceName: string;
  age: number;
  health: number;
  maxHealth: number;
  sanity: number;
  warpCorruption: number;
  warpAttention: number;
  luck: number;
  credits: number;
  food: number;
  ammo: number;
  caste: string;
  planet: string;
  planetType: string;
  status: string;
  influence: number;
  inventory: string[];
  augmentics: string[];
  /** Верность Императору (0–10). На 10 — шанс чудесного заступничества при смерти */
  imperialCreed?: number;
  factionRelations: FactionRelations;
  npcs: NPC[];
  hiddenParams: {
    faith: number;
    cunning: number;
    strength: number;
    willpower: number;
    mutation: number;
    suspicion: number;
    waaagh?: number;
    psi?: number;
    nobility?: number;
    cruelty?: number;
    unity?: number;
    techSkill?: number;
    sneakiness?: number;
  };
  traits: string[];
  body: string;
  gender: string;
  microEventCooldown: number;
  keyChoices: string[];
  worldEvent?: string;
  /** Уникальные глобальные события мира, увиденные за жизнь (для достижения «Путешественник») */
  worldEventsSeen?: string[];
  /** Сколько раз смерть была отвращена чудесным заступничеством («Император защищает») */
  intercessionCount?: number;
}

export interface Choice {
  letter: string;
  text: string;
  effects: ChoiceEffects;
}

export interface ChoiceEffects {
  health?: number;
  sanity?: number;
  warpCorruption?: number;
  warpAttention?: number;
  luck?: number;
  credits?: number;
  food?: number;
  ammo?: number;
  influence?: number;
  faith?: number;
  cunning?: number;
  strength?: number;
  willpower?: number;
  mutation?: number;
  suspicion?: number;
  waaagh?: number;
  psi?: number;
  nobility?: number;
  cruelty?: number;
  unity?: number;
  techSkill?: number;
  sneakiness?: number;
  imperium?: number;
  chaos?: number;
  xenos?: number;
  criminals?: number;
  /** Отношения с аристократией улья/планеты (-100..100) */
  nobilityRel?: number;
  /** Отношения с простолюдинами (-100..100) */
  commoners?: number;
  addTrait?: string;
  removeTrait?: string;
  addItem?: string;
  removeItem?: string;
  addAugmentic?: string;
  removeAugmentic?: string;
  newStatus?: string;
  keyChoice?: string;
  description: string;
}

export interface GameEvent {
  text: string;
  choices: Choice[];
}

import { Quest } from './questSystem';

export interface GameState {
  character: CharacterStats;
  currentEvent: GameEvent;
  history: string[];
  gameOver: boolean;
  deathMessage: string;
  activeQuests: Quest[];
  completedQuests: Quest[];
  /** Seed партии для воспроизводимости (опционально — старые сейвы без него валидны) */
  seed?: number;
}
