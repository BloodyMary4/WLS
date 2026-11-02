import { useReducer, useRef } from 'react';
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
        else if (fx.sound === 'miracle') ambience.playMiracleChime();
        else if (fx.sound === 'choice') ambience.playChoiceClick();
        else if (fx.sound === 'year') ambience.playYearTick();
        else if (fx.sound === 'wound') ambience.playWoundHit();
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

/**
 * useReducer-редьюсер обязан быть чистым (в dev React вызывает его дважды —
 * StrictMode). Поэтому переходы с RNG (seed!) исполняются ОДИН РАЗ в
 * dispatchTracked, а сюда приходит уже готовое состояние через action.state.
 */
type PreparedAction = GameAction & { state?: GameUiState };

function pureReducer(state: GameUiState, action: PreparedAction): GameUiState {
  return action.state ?? state;
}

export function useGameStore() {
  const [uiState, dispatch] = useReducer(pureReducer, initialUiState);
  const stateRef = useRef(uiState);
  stateRef.current = uiState;

  const dispatchTracked = (action: GameAction) => {
    const outcome = dispatchGameAction(stateRef.current, action);
    if (outcome.state === stateRef.current && outcome.effects.length === 0) return;
    // Синхронный ref — чтобы runEffects (save) видел новое состояние до ре-рендера.
    stateRef.current = outcome.state;
    dispatch({ ...action, state: outcome.state });
    runEffects(outcome.effects, stateRef);
    const toast = outcome.effects.find((e) => e.kind === 'achievementToast');
    if (toast) {
      setTimeout(() => dispatchTracked({ type: 'CLEAR_ACHIEVEMENT_TOAST' }), toast.durationMs);
    }
  };

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
