export type Race = 'human' | 'ork' | 'eldar' | 'dark_eldar' | 'tau' | 'gretchin';

export interface FactionRelations {
  imperium: number;
  chaos: number;
  xenos: number;
  criminals: number;
  nobility: number;
  commoners: number;
}

export interface LegacyData {
  totalGamesPlayed: number;
  totalYearsLived: number;
  bestAge: number;
  achievementsEverUnlocked: string[];
  racesPlayed: Race[];
  deathsByCause: Record<string, number>;
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
  factionRelations: FactionRelations;
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

export interface GameState {
  character: CharacterStats;
  currentEvent: GameEvent;
  history: string[];
  gameOver: boolean;
  deathMessage: string;
}
