import { GameState } from './types';

const SAVE_KEY = 'grimdark_save';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  timestamp: number;
  gameState: GameState;
  unlockedAchievements: string[];
}

export function saveGame(gameState: GameState, unlockedAchievements: string[]): boolean {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      gameState,
      unlockedAchievements,
    };
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(): { gameState: GameState; unlockedAchievements: string[] } | null {
  try {
    const stored = localStorage.getItem(SAVE_KEY);
    if (!stored) return null;
    
    const saveData: SaveData = JSON.parse(stored);
    
    if (saveData.version !== SAVE_VERSION) {
      console.warn('Save data version mismatch, clearing old save');
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    
    if (!saveData.gameState || !saveData.gameState.character || !saveData.gameState.currentEvent) {
      console.warn('Invalid save data, clearing');
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    
    return {
      gameState: saveData.gameState,
      unlockedAchievements: saveData.unlockedAchievements || [],
    };
  } catch (error) {
    console.error('Failed to load game:', error);
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
