import { useState, useEffect, useRef, useMemo } from 'react';
import { RACE_INFO } from './game/data';
import { AudioController } from './components/AudioController';
import { StatCard } from './components/StatCard';
import { getAmbience } from './game/audio';
import { ACHIEVEMENTS } from './game/achievements';
import { getHealthColor, getHealthBarColor, getSanityColor, getSanityBarColor, getWarpCorruptionColor, getWarpCorruptionBarColor } from './game/utils';
import { GAME_CONFIG } from './game/config';
import { useGameState } from './hooks/useGameState';

function App() {
  const {
    gameState,
    resultText,
    showResult,
    lastChoice,
    unlockedAchievements,
    newAchievement,
    handleChoice,
    proceedToNextYear,
    startNewGame,
    loadSavedGame,
    hasSave,
  } = useGameState();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  const raceInfo = useMemo(() => gameState ? RACE_INFO[gameState.character.race] : null, [gameState]);
  const healthPercent = useMemo(() => gameState ? (gameState.character.health / gameState.character.maxHealth) * 100 : 0, [gameState]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [gameState?.history]);

  useEffect(() => {
    if (!gameState || gameState.gameOver) return;
    
    const ambience = getAmbience();
    if (!ambience.getIsPlaying()) return;

    const { health, hiddenParams } = gameState.character;
    const healthPercent = health / gameState.character.maxHealth;
    const mutation = hiddenParams.mutation;
    const suspicion = hiddenParams.suspicion;

    const { CRITICAL_PERCENT, LOW_PERCENT } = GAME_CONFIG.HEALTH;
    const { MUTATION_DAMAGE, SUSPICION_CRITICAL } = GAME_CONFIG.STAT_THRESHOLDS;

    if (healthPercent < CRITICAL_PERCENT || 
        mutation >= MUTATION_DAMAGE || 
        suspicion >= SUSPICION_CRITICAL) {
      ambience.setMood('danger');
    } else if (healthPercent < LOW_PERCENT || 
               mutation >= MUTATION_DAMAGE - 2 || 
               suspicion >= SUSPICION_CRITICAL - 2) {
      ambience.setMood('tense');
    } else if (gameState.character.age > GAME_CONFIG.AGE_THRESHOLDS.ADULT * 2.5) {
      ambience.setMood('epic');
    } else {
      ambience.setMood('normal');
    }
  }, [gameState?.character.health, gameState?.character.hiddenParams.mutation, gameState?.character.hiddenParams.suspicion, gameState?.character.age]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState || gameState.gameOver) return;
      
      if (showResult) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          proceedToNextYear();
        }
        return;
      }

      const keyMap: Record<string, number> = {
        'a': 0, 'A': 0, '1': 0,
        'b': 1, 'B': 1, '2': 1,
        'c': 2, 'C': 2, '3': 2,
        'd': 3, 'D': 3, '4': 3,
      };

      const index = keyMap[e.key];
      if (index !== undefined && index < gameState.currentEvent.choices.length) {
        e.preventDefault();
        handleChoice(gameState.currentEvent.choices[index]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, showResult, proceedToNextYear, handleChoice]);

  if (!gameState) {
    return (
      <div className="game-container">
        <AudioController />
        <div className="container">
          <div className="max-w-4xl mx-auto py-16 text-center">
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-yellow-500 mb-4">WARHAMMER LIFE</h1>
              <p className="text-lg text-gray-300 mb-2">
                Симулятор жизни в вселенной Warhammer 40,000
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
              <p className="text-base leading-relaxed text-gray-200 mb-4">
                В мрачном будущем тридцать первого тысячелетия нет мира. Есть лишь бесконечная бойня.
              </p>
              <p className="text-base leading-relaxed text-gray-200 mb-4">
                Ты можешь родиться человеком, орком, эльдар, тёмным эльдар, тау или гретчином.
                Твоё происхождение случайно. Твоя смерть — почти гарантирована.
              </p>
              <p className="text-base leading-relaxed text-yellow-400 font-semibold">
                Но пока ты дышишь — ты можешь бороться.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {Object.entries(RACE_INFO).map(([key, info]) => (
                <div 
                  key={key} 
                  className="bg-gray-900 rounded-lg p-4 border-2 border-gray-800 hover:border-yellow-600 transition-all"
                >
                  <div className="text-4xl mb-2">{info.emoji}</div>
                  <h3 className="text-lg font-bold text-yellow-500 mb-1">{info.name}</h3>
                  <p className="text-sm text-gray-400">{info.description}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 items-center">
              {hasSave && (
                <button 
                  onClick={loadSavedGame} 
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                  Продолжить игру
                </button>
              )}
              
              <button 
                onClick={startNewGame} 
                className="bg-red-800 hover:bg-red-700 text-yellow-400 font-bold py-4 px-12 rounded-lg transition-colors text-lg"
              >
                Начать новую игру
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-6">
              Каждый ход = 1 год жизни • 6 рас • Клавиши A-D для выбора
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { character, currentEvent, history, gameOver, deathMessage } = gameState;
  
  if (!raceInfo) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }
  
  if (!currentEvent || !currentEvent.text || !currentEvent.choices) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <div className="game-container">
      <AudioController />
      
      {newAchievement && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-yellow-900 border-2 border-yellow-600 rounded-lg px-6 py-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {ACHIEVEMENTS.find(a => a.id === newAchievement)?.icon}
              </div>
              <div>
                <div className="text-sm text-yellow-400 font-bold uppercase">Достижение!</div>
                <div className="text-lg font-bold text-yellow-300">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.name}
                </div>
                <div className="text-sm text-gray-300">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-950 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="text-3xl">{raceInfo.emoji}</div>
              <div>
                <div className="text-lg font-bold text-yellow-500">{character.name}</div>
                <div className="text-sm text-gray-400">{character.raceName} • {character.age} лет • {character.planet}</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Начать новую игру?')) {
                  startNewGame();
                }
              }}
              className="bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded transition-colors"
            >
              Новая игра
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <StatCard 
              label="Здоровье"
              value={`${character.health}/${character.maxHealth}`}
              valueClassName={getHealthColor(character.health, character.maxHealth)}
              showBar
              barValue={character.health}
              barMax={character.maxHealth}
              barColor={getHealthBarColor(character.health, character.maxHealth)}
            />
            
            <StatCard 
              label="Рассудок"
              value={`${character.sanity}%`}
              valueClassName={getSanityColor(character.sanity)}
              showBar
              barValue={character.sanity}
              barMax={100}
              barColor={getSanityBarColor(character.sanity)}
            />
            
            <StatCard 
              label="Порча"
              value={`${character.warpCorruption}%`}
              valueClassName={getWarpCorruptionColor(character.warpCorruption)}
              showBar
              barValue={character.warpCorruption}
              barMax={100}
              barColor={getWarpCorruptionBarColor(character.warpCorruption)}
            />
            
            <div className="bg-gray-900 rounded px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-400 font-semibold">💰 {character.credits}₡</span>
                <span className="text-green-400 font-semibold">🍖 {character.food}</span>
                <span className="text-red-400 font-semibold">🔫 {character.ammo}</span>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">⭐ Влияние:</span>
                <span className="text-orange-400 font-bold">{character.influence}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-400">🍀 Удача:</span>
                <span className="text-green-400 font-bold">{character.luck}</span>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded px-3 py-2">
              <div className="text-xs text-gray-400 mb-1">Статус</div>
              <div className="text-sm text-purple-400 font-semibold truncate">{character.status}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-48 pb-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mb-4 w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded transition-colors"
          >
            {sidebarOpen ? 'Скрыть характеристики' : 'Показать характеристики'}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <aside className={`lg:col-span-4 space-y-4 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-gray-800">
                  Характеристики
                </h3>
                <div className="space-y-2">
                  <HiddenStat label="Вера" value={character.hiddenParams.faith} icon="✝" color="bg-amber-500" />
                  <HiddenStat label="Хитрость" value={character.hiddenParams.cunning} icon="🗡" color="bg-emerald-500" />
                  <HiddenStat label="Сила" value={character.hiddenParams.strength} icon="💪" color="bg-red-500" />
                  <HiddenStat label="Воля" value={character.hiddenParams.willpower} icon="🛡" color="bg-blue-500" />
                  {character.race === 'human' && (
                    <>
                      <HiddenStat label="Мутация" value={character.hiddenParams.mutation} icon="☣" color="bg-purple-500" />
                      <HiddenStat label="Подозрение" value={character.hiddenParams.suspicion} icon="👁" color="bg-orange-500" />
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-gray-800">
                  Расовые особенности
                </h3>
                <div className="space-y-2">
                  {character.race === 'ork' && <HiddenStat label="WAAAGH!" value={character.hiddenParams.waaagh || 0} icon="⚔" color="bg-green-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Пси-сила" value={character.hiddenParams.psi || 0} icon="🔮" color="bg-purple-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Благородство" value={character.hiddenParams.nobility || 0} icon="👑" color="bg-blue-400" />}
                  {character.race === 'dark_eldar' && <HiddenStat label="Жестокость" value={character.hiddenParams.cruelty || 0} icon="🩸" color="bg-red-500" />}
                  {character.race === 'tau' && <HiddenStat label="Единство" value={character.hiddenParams.unity || 0} icon="🔷" color="bg-cyan-500" />}
                  {character.race === 'tau' && <HiddenStat label="Технологии" value={character.hiddenParams.techSkill || 0} icon="⚙" color="bg-blue-400" />}
                  {character.race === 'gretchin' && <HiddenStat label="Скрытность" value={character.hiddenParams.sneakiness || 0} icon="🐀" color="bg-yellow-600" />}
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-gray-800">
                  Снаряжение
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Инвентарь</div>
                    <div className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Черты</div>
                    <div className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-gray-800">
                  Хроника
                </h3>
                <div ref={logRef} className="max-h-48 overflow-y-auto space-y-1">
                  {history.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">Жизнь только начинается...</p>
                  ) : (
                    history.map((entry, i) => (
                      <p key={i} className="text-xs text-gray-400 border-l-2 border-gray-700 pl-2">
                        {entry}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Прогресс жизни</span>
                  <span className="text-sm text-gray-400">{character.age} / ~80 лет</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${Math.min(100, (character.age / 80) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6">
                {!gameOver ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-bold text-red-400 uppercase">
                          Событие • Год {character.age}
                        </span>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-4">
                        <p className="text-base leading-relaxed text-yellow-300">
                          {currentEvent.text}
                        </p>
                      </div>
                    </div>

                    {showResult && lastChoice ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-900/30 border-2 border-yellow-700 rounded-lg p-4">
                          <p className="text-base leading-relaxed text-yellow-300">{resultText}</p>
                        </div>
                        <button
                          onClick={proceedToNextYear}
                          className="w-full bg-red-800 hover:bg-red-700 text-yellow-400 font-bold py-3 rounded-lg transition-colors"
                        >
                          Продолжить → Год {character.age}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-yellow-500 uppercase mb-3">
                          Твоё решение:
                        </p>
                        {currentEvent.choices.map((choice) => (
                          <button
                            key={choice.letter}
                            onClick={() => handleChoice(choice)}
                            className="w-full text-left p-4 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-yellow-600 rounded-lg transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-yellow-500 font-bold text-lg">
                                [{choice.letter}]
                              </span>
                              <span className="text-base text-yellow-300 flex-1">{choice.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-6">☠</div>
                    <h2 className="text-3xl font-bold text-red-500 mb-6">СМЕРТЬ</h2>
                    <p className="text-base leading-relaxed mb-8 max-w-2xl mx-auto text-gray-300">
                      {deathMessage}
                    </p>
                    <div className="bg-gray-800 rounded-lg p-6 mb-8 text-left max-w-lg mx-auto">
                      <h3 className="text-lg font-bold text-yellow-500 mb-4">Итоги жизни</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Раса:</span>
                          <span className="font-semibold text-yellow-400">{raceInfo.emoji} {character.raceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Прожито лет:</span>
                          <span className="font-bold text-white text-lg">{character.age}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Планета:</span>
                          <span className="font-semibold text-cyan-400">{character.planet}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Сословие:</span>
                          <span className="font-semibold text-orange-400">{character.caste}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Статус:</span>
                          <span className="font-semibold text-purple-400">{character.status}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={startNewGame}
                      className="bg-red-800 hover:bg-red-700 text-yellow-400 font-bold py-3 px-8 rounded-lg transition-colors text-lg"
                    >
                      Начать новую жизнь
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-950 border-t border-gray-800 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Warhammer Life Simulator • Warhammer 40,000 • 6 рас
          </p>
          <p className="text-xs text-gray-600 mt-2">
            A-D выбор • Space продолжение • Достижения: {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </p>
        </div>
      </footer>
    </div>
  );
}

function HiddenStat({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-5 text-center">{icon}</span>
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value * 10}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-300 w-6 text-right">{value}</span>
    </div>
  );
}

export default App;
