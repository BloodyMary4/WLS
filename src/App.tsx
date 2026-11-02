import { useEffect, useState } from 'react';
import { GAME_CONFIG } from './game/config';
import { getAmbience } from './game/audio';
import { useGameStore } from './hooks/useGameStore';
import { useKeyboardControls } from './hooks/useKeyboardControls';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';

/**
 * Точка входа — только композиция экранов и глобальные подписки.
 * Вся игровая логика живёт в едином reducer (src/game/reducer.ts),
 * крупные куски UI вынесены в src/components (MainMenu, GameScreen,
 * GameHeader, Sidebar, EventCard, DeathScreen, AchievementToast).
 */
function App() {
  const store = useGameStore();
  const { uiState } = store;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const game = uiState.game;
  const inGame = !!game && !isInvalidEvent(game.currentEvent);

  // Горячие клавиши: выбор A–D/1–4 в фазе события, Space/Enter — продолжить год.
  useKeyboardControls({
    enabled: !!game && !game.gameOver,
    choices: game && uiState.phase === 'event' ? game.currentEvent.choices : [],
    onChoice: store.handleChoice,
    onProceed: store.proceedToNextYear,
  });

  // Динамическая атмосфера звука по состоянию персонажа.
  useEffect(() => {
    if (!game || game.gameOver) return;

    const ambience = getAmbience();
    if (!ambience.getIsPlaying()) return;

    const { health, maxHealth, hiddenParams, age } = game.character;
    const healthPercent = health / maxHealth;

    const { CRITICAL_PERCENT, LOW_PERCENT } = GAME_CONFIG.HEALTH;
    const { MUTATION_DAMAGE, SUSPICION_CRITICAL } = GAME_CONFIG.STAT_THRESHOLDS;

    if (healthPercent < CRITICAL_PERCENT ||
        hiddenParams.mutation >= MUTATION_DAMAGE ||
        hiddenParams.suspicion >= SUSPICION_CRITICAL ||
        game.character.sanity < 30) {
      ambience.setMood('danger');
    } else if (healthPercent < LOW_PERCENT ||
               hiddenParams.mutation >= MUTATION_DAMAGE - 2 ||
               hiddenParams.suspicion >= SUSPICION_CRITICAL - 2 ||
               game.character.sanity < 55) {
      ambience.setMood('tense');
    } else if (age > GAME_CONFIG.AGE_THRESHOLDS.ADULT * 2.5) {
      ambience.setMood('epic');
    } else {
      ambience.setMood('normal');
    }
  }, [game?.character.health, game?.character.sanity, game?.character.hiddenParams.mutation, game?.character.hiddenParams.suspicion, game?.character.age]);

  if (!game) {
    return (
      <MainMenu
        hasSave={store.hasSave}
        onStartNewGame={() => store.startNewGame()}
        onLoadSavedGame={store.loadSavedGame}
      />
    );
  }

  if (!inGame) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <GameScreen
      uiState={uiState}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      onChoice={store.handleChoice}
      onProceed={store.proceedToNextYear}
      onNewGame={() => store.startNewGame()}
    />
  );
}

function isInvalidEvent(event: { text?: string; choices?: unknown[] } | null | undefined): boolean {
  return !event || !event.text || !Array.isArray(event.choices);
}

export default App;
