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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <AudioController />
        
        {/* Фоновые эффекты */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Заголовок */}
            <div className="text-center mb-10 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent animate-glow">
                WARHAMMER LIFE
              </h1>
              <p className="text-base text-gray-300 mb-2 font-light">
                Симулятор жизни в вселенной Warhammer 40,000
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-3"></div>
            </div>

            {/* Описание */}
            <div className="card-modern p-5 mb-8 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-start gap-3">
                <div className="text-3xl animate-pulse">⚔️</div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-gray-200 mb-3">
                    В мрачном будущем тридцать первого тысячелетия нет мира. Есть лишь бесконечная бойня.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-200 mb-3">
                    Ты можешь родиться человеком, орком, эльдар, тёмным эльдар, тау или гретчином.
                    Твоё происхождение случайно. Твоя смерть — почти гарантирована.
                  </p>
                  <p className="text-base leading-relaxed font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    Но пока ты дышишь — ты можешь бороться.
                  </p>
                </div>
              </div>
            </div>

            {/* Расы */}
            <div className="mb-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <h2 className="text-2xl font-bold text-center mb-6 text-yellow-500">Выбери свою судьбу</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(RACE_INFO).map(([key, info], index) => (
                  <div 
                    key={key} 
                    className="card-modern hover-lift p-4 animate-scale-in"
                    style={{animationDelay: `${0.5 + index * 0.1}s`}}
                  >
                    <div className="text-4xl mb-3 transform hover:scale-110 transition-transform duration-300">
                      {info.emoji}
                    </div>
                    <h3 className="text-base font-bold text-yellow-500 mb-1">{info.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{info.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col gap-3 items-center mb-6 animate-fade-in" style={{animationDelay: '1s'}}>
              {hasSave && (
                <button 
                  onClick={loadSavedGame} 
                  className="btn-modern bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-8 rounded-xl text-base border-2 border-gray-600 hover:border-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/30"
                >
                  📜 Продолжить игру
                </button>
              )}
              
              <button 
                onClick={startNewGame} 
                className="btn-modern bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-yellow-400 font-bold py-3 px-10 rounded-xl text-lg border-2 border-yellow-600 hover:border-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/50 hover:scale-105"
              >
                ⚔️ Начать новую игру
              </button>
            </div>
            
            {/* Подсказка */}
            <div className="text-center animate-fade-in" style={{animationDelay: '1.2s'}}>
              <p className="text-xs text-gray-500 mb-2">
                Каждый ход = 1 год жизни • 6 рас • Клавиши A-D для выбора
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <kbd className="px-2 py-1 bg-gray-800 border border-yellow-600/50 rounded text-yellow-400 text-xs font-mono">A</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-yellow-600/50 rounded text-yellow-400 text-xs font-mono">B</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-yellow-600/50 rounded text-yellow-400 text-xs font-mono">C</kbd>
                <kbd className="px-2 py-1 bg-gray-800 border border-yellow-600/50 rounded text-yellow-400 text-xs font-mono">D</kbd>
              </div>
            </div>
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
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-gradient-to-br from-yellow-900/90 to-orange-900/90 border-2 border-yellow-500 rounded-xl px-6 py-4 shadow-2xl backdrop-blur-sm animate-glow">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-pulse">
                {ACHIEVEMENTS.find(a => a.id === newAchievement)?.icon}
              </div>
              <div>
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-wider mb-1">
                  🏆 Достижение разблокировано!
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.name}
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-yellow-600/20 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3 animate-slide-in-left">
            <div className="flex items-center gap-3">
              <div className="text-3xl transform hover:scale-110 transition-transform duration-300">{raceInfo.emoji}</div>
              <div>
                <div className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  {character.name}
                </div>
                <div className="text-xs text-gray-400">
                  {character.raceName} • {character.age} лет • {character.planet}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Начать новую игру?')) {
                  startNewGame();
                }
              }}
              className="btn-modern bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white text-xs py-1.5 px-4 rounded-lg border border-gray-600 hover:border-yellow-500 transition-all shadow-lg hover:shadow-yellow-500/30"
            >
              🔄 Новая игра
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
            <aside className={`lg:col-span-4 space-y-3 animate-slide-in-left ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="card-modern p-4 hover-lift">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-yellow-600/30 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Характеристики
                </h3>
                <div className="space-y-2">
                  <HiddenStat label="Вера" value={character.hiddenParams.faith} icon="✝️" color="bg-amber-500" />
                  <HiddenStat label="Хитрость" value={character.hiddenParams.cunning} icon="🗡️" color="bg-emerald-500" />
                  <HiddenStat label="Сила" value={character.hiddenParams.strength} icon="💪" color="bg-red-500" />
                  <HiddenStat label="Воля" value={character.hiddenParams.willpower} icon="🛡️" color="bg-blue-500" />
                  {character.race === 'human' && (
                    <>
                      <HiddenStat label="Мутация" value={character.hiddenParams.mutation} icon="☣️" color="bg-purple-500" />
                      <HiddenStat label="Подозрение" value={character.hiddenParams.suspicion} icon="👁️" color="bg-orange-500" />
                    </>
                  )}
                </div>
              </div>

              <div className="card-modern p-4 hover-lift">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-yellow-600/30 flex items-center gap-2">
                  <span className="text-xl">{raceInfo.emoji}</span>
                  Расовые особенности
                </h3>
                <div className="space-y-2">
                  {character.race === 'ork' && <HiddenStat label="WAAAGH!" value={character.hiddenParams.waaagh || 0} icon="⚔️" color="bg-green-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Пси-сила" value={character.hiddenParams.psi || 0} icon="🔮" color="bg-purple-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Благородство" value={character.hiddenParams.nobility || 0} icon="👑" color="bg-blue-400" />}
                  {character.race === 'dark_eldar' && <HiddenStat label="Жестокость" value={character.hiddenParams.cruelty || 0} icon="🩸" color="bg-red-500" />}
                  {character.race === 'tau' && <HiddenStat label="Единство" value={character.hiddenParams.unity || 0} icon="🔷" color="bg-cyan-500" />}
                  {character.race === 'tau' && <HiddenStat label="Технологии" value={character.hiddenParams.techSkill || 0} icon="⚙️" color="bg-blue-400" />}
                  {character.race === 'gretchin' && <HiddenStat label="Скрытность" value={character.hiddenParams.sneakiness || 0} icon="🐀" color="bg-yellow-600" />}
                </div>
              </div>

              <div className="card-modern p-4 hover-lift">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-yellow-600/30 flex items-center gap-2">
                  <span className="text-xl">🎒</span>
                  Снаряжение
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-xs text-gray-400 mb-1 font-semibold">Инвентарь</div>
                    <div className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1 font-semibold">Черты</div>
                    <div className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</div>
                  </div>
                </div>
              </div>

              <div className="card-modern p-4 hover-lift">
                <h3 className="text-sm font-bold text-yellow-500 mb-3 pb-2 border-b border-yellow-600/30 flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  Хроника
                </h3>
                <div ref={logRef} className="max-h-40 overflow-y-auto space-y-1">
                  {history.length === 0 ? (
                    <p className="text-gray-500 italic text-xs text-center py-3">Жизнь только начинается...</p>
                  ) : (
                    history.map((entry, i) => (
                      <p key={i} className="text-xs text-gray-400 border-l-2 border-yellow-600/50 pl-2 py-0.5 hover:border-yellow-500 transition-colors">
                        {entry}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8 animate-slide-in-right">
              {/* Прогресс жизни */}
              <div className="card-modern p-4 mb-3 hover-lift">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-semibold flex items-center gap-2">
                    <span className="text-base">⏳</span>
                    Прогресс жизни
                  </span>
                  <span className="text-xs text-gray-400 font-bold">{character.age} / ~80 лет</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 shimmer"
                    style={{ width: `${Math.min(100, (character.age / 80) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Основная карточка события */}
              <div className="card-modern p-5">
                {!gameOver ? (
                  <>
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        <span className="text-sm font-bold text-red-400 uppercase tracking-wide">
                          ⚡ Событие • Год {character.age}
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 border border-yellow-600/20 shadow-inner">
                        <p className="text-sm leading-relaxed text-yellow-300">
                          {currentEvent.text}
                        </p>
                      </div>
                    </div>

                    {showResult && lastChoice ? (
                      <div className="space-y-3 animate-fade-in">
                        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-600 rounded-lg p-4 shadow-lg">
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">⚔️</span>
                            <p className="text-sm leading-relaxed text-yellow-300 flex-1">{resultText}</p>
                          </div>
                        </div>
                        <button
                          onClick={proceedToNextYear}
                          className="btn-modern w-full bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-yellow-400 font-bold py-3 rounded-lg text-base border-2 border-yellow-600 hover:border-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/50 hover:scale-105"
                        >
                          Продолжить → Год {character.age}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-yellow-500 uppercase mb-3 flex items-center gap-2">
                          <span className="text-xl">⚜️</span>
                          Твоё решение:
                        </p>
                        {currentEvent.choices.map((choice, index) => (
                          <button
                            key={choice.letter}
                            onClick={() => handleChoice(choice)}
                            className="btn-modern w-full text-left p-4 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border-2 border-gray-700 hover:border-yellow-500 rounded-lg transition-all shadow-lg hover:shadow-yellow-500/30 hover:scale-102 animate-slide-in-left"
                            style={{animationDelay: `${index * 0.1}s`}}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg flex items-center justify-center shadow-lg">
                                <span className="text-yellow-100 font-bold text-sm">
                                  {choice.letter}
                                </span>
                              </div>
                              <span className="text-sm text-yellow-300 flex-1 leading-relaxed pt-0.5">{choice.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="relative inline-block mb-6">
                      <div className="text-6xl animate-pulse">☠️</div>
                      <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl animate-pulse"></div>
                    </div>
                    <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent animate-glow">
                      СМЕРТЬ
                    </h2>
                    <p className="text-sm leading-relaxed mb-8 max-w-xl mx-auto text-gray-300">
                      {deathMessage}
                    </p>
                    <div className="card-modern p-6 mb-8 text-left max-w-xl mx-auto hover-lift">
                      <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
                        <span className="text-2xl">📜</span>
                        Итоги жизни
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400">Раса:</span>
                          <span className="font-bold text-yellow-400 text-base">{raceInfo.emoji} {character.raceName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400">Прожито лет:</span>
                          <span className="font-bold text-white text-xl">{character.age}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400">Планета:</span>
                          <span className="font-semibold text-cyan-400">{character.planet}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400">Сословие:</span>
                          <span className="font-semibold text-orange-400">{character.caste}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400">Статус:</span>
                          <span className="font-semibold text-purple-400">{character.status}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={startNewGame}
                      className="btn-modern bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-yellow-400 font-bold py-3 px-10 rounded-lg text-base border-2 border-yellow-600 hover:border-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/50 hover:scale-105"
                    >
                      ⚔️ Начать новую жизнь
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="glass-effect border-t border-yellow-600/20 py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center gap-2 mb-3">
            <span className="text-xl animate-pulse">⚔️</span>
            <span className="text-xl animate-pulse" style={{animationDelay: '0.2s'}}>☠️</span>
            <span className="text-xl animate-pulse" style={{animationDelay: '0.4s'}}>⚜️</span>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            Warhammer Life Simulator • Warhammer 40,000 • 6 рас
          </p>
          <div className="flex justify-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">A-D</kbd>
              выбор
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">Space</kbd>
              продолжение
            </span>
            <span>•</span>
            <span className="text-yellow-500 font-bold">
              🏆 Достижения: {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HiddenStat({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-2 group hover:bg-gray-800/50 rounded-lg p-1.5 transition-all">
      <span className="text-base w-6 text-center transform group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs text-gray-400 w-20 font-semibold">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden shadow-inner">
        <div 
          className={`h-1.5 rounded-full ${color} transition-all duration-500 shadow-lg`}
          style={{ width: `${value * 10}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-300 w-6 text-right font-bold">{value}</span>
    </div>
  );
}

export default App;
