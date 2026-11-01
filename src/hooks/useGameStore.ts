import { useEffect, useReducer, useRef } from 'react';
import {
  GameUiState,
  GameEffect,
  GameAction,
  initialUiState,
  dispatchGameAction,
} from '../game/reducer';
import { getAmbience } from '../game/audio';
import { saveGame, loadGame, hasSave as checkHasSave } from '../game/saveSystem';
import { validateGameState } from '../game/validation';
import { setGlobalSeed } from '../game/rng';

function runEffects(effects: GameEffect[], stateRef: React.MutableRefObject<GameUiState>) {
  const ambience = getAmbience();
  for (const fx of effects) {
    switch (fx.kind) {
      case 'unlockAudio':
        ambience.unlockOnUserGesture();
        break;
      case 'playSound':
        if (fx.sound === 'event') ambience.playEventSound();
        else if (fx.sound === 'death') ambience.playDeathSound();
        else ambience.playAchievementSound();
        break;
      case 'save': {
        const s = stateRef.current;
        if (s.game && !s.game.gameOver) {
          saveGame(s.game, s.unlockedAchievements);
        }
        break;
      }
      case 'achievementToast':
        // тост виден из состояния (newAchievement); таймер скрытия ставится ниже
        break;
    }
  }
}

function reducerWithEffects(state: GameUiState, action: GameAction): GameUiState {
  return dispatchGameAction(state, action).state;
}

export function useGameStore() {
  const [uiState, dispatch] = useReducer(reducerWithEffects, initialUiState);
  const stateRef = useRef(uiState);
  stateRef.current = uiState;

  // Эффекты считаются один раз в обработчике и исполняются после коммита.
  const pendingEffects = useRef<GameEffect[]>([]);

  const dispatchTracked = (action: GameAction) => {
    const outcome = dispatchGameAction(stateRef.current, action);
    pendingEffects.current = outcome.effects;
    dispatch(action);
  };

  useEffect(() => {
    if (pendingEffects.current.length > 0) {
      const effects = pendingEffects.current;
      pendingEffects.current = [];
      runEffects(effects, stateRef);
      const toast = effects.find(e => e.kind === 'achievementToast');
      if (toast) {
        const timer = setTimeout(() => dispatch({ type: 'CLEAR_ACHIEVEMENT_TOAST' }), toast.durationMs);
        return () => clearTimeout(timer);
      }
    }
  }, [uiState]);

  const handleChoice = (choice: GameUiState['lastChoice'] & {}) => dispatchTracked({ type: 'CHOOSE', choice });
  const proceedToNextYear = () => dispatchTracked({ type: 'PROCEED_TO_NEXT_YEAR' });
  const startNewGame = (seedStr?: string) => dispatchTracked({ type: 'START_NEW_GAME', seedStr });

  const loadSavedGame = (): boolean => {
    try {
      const savedData = loadGame();
      if (savedData && validateGameState(savedData.gameState)) {
        if (typeof savedData.gameState.seed === 'number') {
          setGlobalSeed(savedData.gameState.seed);
        }
        dispatchTracked({
          type: 'LOAD_SAVED_GAME',
          game: savedData.gameState,
          unlockedAchievements: savedData.unlockedAchievements,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load saved game:', error);
      return false;
    }
  };

  return {
    uiState,
    // плоский API — совместим с тем, что потреблял старый useGameState
    gameState: uiState.game,
    resultText: uiState.resultText,
    showResult: uiState.phase === 'result',
    lastChoice: uiState.lastChoice,
    unlockedAchievements: uiState.unlockedAchievements,
    newAchievement: uiState.newAchievement,
    handleChoice,
    proceedToNextYear,
    startNewGame,
    loadSavedGame,
    hasSave: checkHasSave(),
  };
}
