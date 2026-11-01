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
      <div className="wh-grain wh-vignette min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
        <AudioController />
        
        {/* Фоновые эффекты */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-700/10 rounded-full blur-3xl animate-candle"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-900/15 rounded-full blur-3xl animate-candle" style={{animationDelay: '1.3s'}}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="max-w-[1600px] mx-auto">
            {/* Заголовок */}
            <div className="text-center mb-16 animate-fade-in">
              <h1 className="font-gothic text-5xl xl:text-6xl font-bold mb-4 tracking-[0.15em] uppercase bg-gradient-to-b from-[#f0d878] via-[#c9a227] to-[#7a5c10] bg-clip-text text-transparent">
                WARHAMMER LIFE
              </h1>
              <p className="font-event text-xl text-[#b8a878] mb-3 italic">
                Симулятор жизни в вселенной Warhammer 40,000
              </p>
              <p className="font-event text-sm text-gray-500 uppercase tracking-[0.3em] mb-4">
                Во тьме далёкого будущего есть только война
              </p>
              <div className="wh-divider max-w-md mx-auto mt-4"></div>
            </div>

            {/* Описание */}
            <div className="wh-panel wh-frame p-8 mb-12 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-start gap-4">
                <div className="text-5xl animate-pulse">⚔️</div>
                <div className="flex-1">
                  <p className="text-lg leading-relaxed text-gray-200 mb-4">
                    В мрачном будущем тридцать первого тысячелетия нет мира. Есть лишь бесконечная бойня.
                  </p>
                  <p className="text-lg leading-relaxed text-gray-200 mb-4">
                    Ты можешь родиться человеком, орком, эльдар, тёмным эльдар, тау или гретчином.
                    Твоё происхождение случайно. Твоя смерть — почти гарантирована.
                  </p>
                  <p className="text-xl leading-relaxed font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                    Но пока ты дышишь — ты можешь бороться.
                  </p>
                </div>
              </div>
            </div>

            {/* Расы */}
            <div className="mb-12 animate-fade-in" style={{animationDelay: '0.4s'}}>
              <h2 className="font-gothic text-3xl font-bold text-center mb-8 uppercase tracking-[0.15em] text-[#e8c85a]">Выбери свою судьбу</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(RACE_INFO).map(([key, info], index) => (
                  <div 
                    key={key} 
                    className="wh-panel hover-lift p-6 animate-scale-in cursor-pointer"
                    style={{animationDelay: `${0.5 + index * 0.1}s`}}
                  >
                    <div className="text-6xl mb-4 transform hover:scale-110 transition-transform duration-300">
                      {info.emoji}
                    </div>
                    <h3 className="font-gothic text-xl font-bold text-[#e8c85a] mb-2 uppercase tracking-wide">{info.name}</h3>
                    <p className="font-event text-base text-[#a89870] leading-relaxed">{info.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex flex-col gap-4 items-center mb-8 animate-fade-in" style={{animationDelay: '1s'}}>
              {hasSave && (
                <button 
                  onClick={loadSavedGame} 
                  className="btn-modern bg-gradient-to-r from-[#1c1913] to-[#2a2517] hover:from-[#2a2517] hover:to-[#38301e] text-[#c9a227] font-gothic font-bold py-4 px-12 rounded-sm text-xl border border-[#c9a227]/50 hover:border-[#e8c85a] transition-all shadow-lg"
                >
                  📜 Продолжить игру
                </button>
              )}
              
              <button 
                onClick={() => startNewGame()} 
                className="btn-wh-primary btn-modern font-bold py-5 px-16 rounded-sm text-2xl hover:scale-105"
              >
                ⚔️ Начать новую игру
              </button>
            </div>
            
            {/* Подсказка */}
            <div className="text-center animate-fade-in" style={{animationDelay: '1.2s'}}>
              <p className="text-base text-gray-500 mb-3">
                Каждый ход = 1 год жизни • 6 рас • Клавиши A-D для выбора
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">A</kbd>
                <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">B</kbd>
                <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">C</kbd>
                <kbd className="px-4 py-2 bg-gray-800 border border-[#c9a227]/50 rounded-sm text-[#e8c85a] text-base font-mono">D</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { character, currentEvent, history, gameOver, deathMessage, activeQuests, completedQuests } = gameState;
  
  if (!raceInfo) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }
  
  if (!currentEvent || !currentEvent.text || !currentEvent.choices) {
    return <div className="text-white p-8">Error: Invalid game state</div>;
  }

  return (
    <div className="game-container wh-grain wh-vignette" style={{ background: 'radial-gradient(ellipse at 50% -10%, #241d10 0%, #0b0a08 45%, #060504 100%)' }}>
      <AudioController />
      
      {newAchievement && (
        <div className="fixed bottom-6 right-6 z-50 animate-scale-in max-w-md">
          <div className="wh-panel wh-frame px-6 py-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="text-4xl animate-pulse shrink-0">
                {ACHIEVEMENTS.find(a => a.id === newAchievement)?.icon}
              </div>
              <div>
                <div className="font-gothic text-base text-[#e8c85a] font-bold uppercase tracking-widest mb-2">
                  🏆 Достижение разблокировано!
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.name}
                </div>
                <div className="text-base text-gray-300 mt-2">
                  {ACHIEVEMENTS.find(a => a.id === newAchievement)?.description}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <header className="sticky top-0 z-40 border-b border-[#c9a227]/30 shadow-lg" style={{ background: 'linear-gradient(180deg, rgba(28,24,14,0.95) 0%, rgba(11,10,8,0.95) 100%)', backdropFilter: 'blur(8px)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-4 xl:px-6 py-3">
          <div className="flex items-center justify-between mb-3 animate-slide-in-left">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-3xl shrink-0">{raceInfo.emoji}</div>
              <div className="min-w-0">
                <div className="font-gothic text-xl font-bold uppercase tracking-wide bg-gradient-to-b from-[#f0d878] to-[#a8821a] bg-clip-text text-transparent truncate">
                  {character.name}
                </div>
                <div className="text-sm text-gray-400 truncate">
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
              className="btn-modern bg-gradient-to-r from-[#1c1913] to-[#2a2517] hover:from-[#2a2517] hover:to-[#38301e] text-[#c9a227] font-gothic text-sm py-1.5 px-4 rounded-sm border border-[#c9a227]/50 hover:border-[#e8c85a] transition-all shadow-lg shrink-0"
            >
              🔄 Новая игра
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-3">
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
            
            <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-400 font-semibold">💰 {character.credits}₡</span>
                <span className="text-green-400 font-semibold">🍖 {character.food}</span>
                <span className="text-red-400 font-semibold">🔫 {character.ammo}</span>
              </div>
            </div>
            
            <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">⭐ Влияние:</span>
                <span className="text-orange-400 font-bold">{character.influence}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-gray-400">🍀 Удача:</span>
                <span className="text-green-400 font-bold">{character.luck}</span>
              </div>
            </div>
            
            <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
              <div className="text-xs text-gray-400 mb-1">Статус</div>
              <div className="text-sm text-purple-400 font-semibold truncate">{character.status}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="mx-auto w-full max-w-[1700px] px-4 xl:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mb-4 w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded transition-colors"
          >
            {sidebarOpen ? 'Скрыть характеристики' : 'Показать характеристики'}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <aside className={`lg:col-span-3 space-y-4 animate-slide-in-left ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              <div className="wh-panel p-6">
                <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  Характеристики
                </h3>
                <div className="space-y-3">
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

              <div className="wh-panel p-6">
                <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                  <span className="text-2xl">{raceInfo.emoji}</span>
                  Расовые особенности
                </h3>
                <div className="space-y-3">
                  {character.race === 'ork' && <HiddenStat label="WAAAGH!" value={character.hiddenParams.waaagh || 0} icon="⚔️" color="bg-green-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Пси-сила" value={character.hiddenParams.psi || 0} icon="🔮" color="bg-purple-500" />}
                  {character.race === 'eldar' && <HiddenStat label="Благородство" value={character.hiddenParams.nobility || 0} icon="👑" color="bg-blue-400" />}
                  {character.race === 'dark_eldar' && <HiddenStat label="Жестокость" value={character.hiddenParams.cruelty || 0} icon="🩸" color="bg-red-500" />}
                  {character.race === 'tau' && <HiddenStat label="Единство" value={character.hiddenParams.unity || 0} icon="🔷" color="bg-cyan-500" />}
                  {character.race === 'tau' && <HiddenStat label="Технологии" value={character.hiddenParams.techSkill || 0} icon="⚙️" color="bg-blue-400" />}
                  {character.race === 'gretchin' && <HiddenStat label="Скрытность" value={character.hiddenParams.sneakiness || 0} icon="🐀" color="bg-yellow-600" />}
                </div>
              </div>

              <div className="wh-panel p-6">
                <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                  <span className="text-2xl">🎒</span>
                  Снаряжение
                </h3>
                <div className="space-y-3 text-base">
                  <div>
                    <div className="text-sm text-gray-400 mb-2 font-semibold">Инвентарь</div>
                    <div className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2 font-semibold">Черты</div>
                    <div className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</div>
                  </div>
                </div>
              </div>

              {/* NPC Relations - в мрачном стиле Warhammer 40,000 */}
              {character.npcs.length > 0 && (
                <div className="wh-panel p-6">
                  <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                    <span className="text-2xl">⚔️</span>
                    Встреченные души ({character.npcs.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {character.npcs.slice(0, 5).map((npc) => (
                      <div key={npc.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-yellow-600/30 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-bold text-gray-100">{npc.name}</div>
                            <div className="text-xs text-yellow-600/80 italic">{npc.role}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-bold ${
                              npc.relationship >= 50 ? 'text-green-400' :
                              npc.relationship >= 0 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {npc.relationship > 0 ? 'Союзник' :
                               npc.relationship >= 0 ? 'Нейтрал' : 'Враг'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {npc.lastInteraction} лет назад
                            </div>
                          </div>
                        </div>
                        {npc.description && (
                          <div className="text-xs text-gray-400 italic mb-2">{npc.description}</div>
                        )}
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              npc.relationship >= 50 ? 'bg-green-500' :
                              npc.relationship >= 0 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.abs(npc.relationship)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {character.npcs.length > 5 && (
                      <div className="text-center text-xs text-gray-500 pt-2 italic">
                        ...и ещё {character.npcs.length - 5} душ на твоём пути
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Active Quests - в мрачном стиле Warhammer 40,000 */}
              {gameState.activeQuests.length > 0 && (
                <div className="wh-panel p-6">
                  <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                    <span className="text-2xl">📜</span>
                    Испытания судьбы ({gameState.activeQuests.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {gameState.activeQuests.map((quest) => (
                      <div key={quest.id} className="p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30 hover:border-yellow-500/50 transition-all">
                        <div className="text-base font-bold text-yellow-400 mb-2">{quest.name}</div>
                        <div className="text-xs text-gray-400 italic mb-3 leading-relaxed">{quest.description}</div>
                        <div className="space-y-2 mb-3">
                          {quest.objectives.map((obj) => (
                            <div key={obj.id} className="flex items-start gap-2 text-xs">
                              <span className={`text-sm ${obj.completed ? 'text-green-400' : 'text-gray-600'}`}>
                                {obj.completed ? '☠' : '○'}
                              </span>
                              <span className={`flex-1 ${obj.completed ? 'text-green-300 line-through' : 'text-gray-400'}`}>
                                {obj.description}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t border-gray-700">
                          <div className="text-xs text-yellow-600/80 font-semibold mb-2">⚔️ Награды:</div>
                          <div className="flex flex-wrap gap-2">
                            {quest.rewards.credits && (
                              <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-600/30">
                                💰 {quest.rewards.credits} кредитов
                              </span>
                            )}
                            {quest.rewards.influence && (
                              <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-600/30">
                                ⭐ {quest.rewards.influence} влияния
                              </span>
                            )}
                            {quest.rewards.traits?.map((trait, i) => (
                              <span key={i} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-600/30">
                                🎭 {trait}
                              </span>
                            ))}
                            {quest.rewards.items?.map((item, i) => (
                              <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                                🗡️ {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="wh-panel p-6">
                <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
                  <span className="text-2xl">📜</span>
                  Хроника
                </h3>
                <div ref={logRef} className="max-h-[30vh] lg:max-h-64 overflow-y-auto space-y-2">
                  {history.length === 0 ? (
                    <p className="text-gray-500 italic text-sm text-center py-4">Жизнь только начинается...</p>
                  ) : (
                    history.map((entry, i) => (
                      <p key={i} className="text-sm text-gray-400 border-l-2 border-yellow-600/50 pl-3 py-1 hover:border-yellow-500 transition-colors">
                        {entry}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-9 animate-slide-in-right">
              {/* Прогресс жизни */}
              <div className="wh-panel p-6 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-base text-gray-400 font-semibold flex items-center gap-2">
                    <span className="text-2xl">⏳</span>
                    Прогресс жизни
                  </span>
                  <span className="text-base text-gray-400 font-bold">{character.age} / ~80 лет</span>
                </div>
                <div className="wh-bar w-full overflow-hidden" style={{ height: '10px' }}>
                  <div
                    className="wh-bar-fill bg-gradient-to-r from-[#6e5a12] via-[#c9a227] to-[#a30000] shimmer"
                    style={{ width: `${Math.min(100, (character.age / 80) * 100)}%`, height: '100%' }}
                  ></div>
                </div>
              </div>

              {/* Основная карточка события */}
              <div className="wh-panel wh-frame p-8">
                {!gameOver ? (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                        <span className="font-gothic text-lg font-bold text-[#c0392b] uppercase tracking-[0.2em]">
                          Событие &bull; М41.{String(character.age).padStart(3,'0')}
                        </span>
                      </div>
                      <div className="wh-parchment rounded-sm p-6 pt-7">
                        <p className="font-event text-lg leading-relaxed text-[#d8c9a3]">
                          {currentEvent.text}
                        </p>
                      </div>
                    </div>

                    {showResult && lastChoice ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="wh-parchment rounded-sm p-6" style={{ borderColor: 'rgba(201,162,39,0.7)' }}>
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">⚔️</span>
                            <p className="font-event text-lg leading-relaxed text-[#e8d9b0] flex-1 italic">{resultText}</p>
                          </div>
                        </div>
                        <button
                          onClick={proceedToNextYear}
                          className="btn-wh-primary btn-modern w-full font-bold py-4 rounded-sm text-xl transition-all hover:scale-[1.02]"
                        >
                          Продолжить → Год {character.age}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="font-gothic text-lg font-bold text-[#e8c85a] uppercase tracking-[0.15em] mb-4 flex items-center gap-3">
                          Твоё решение:
                        </p>
                        {currentEvent.choices.map((choice, index) => (
                          <button
                            key={choice.letter}
                            onClick={() => handleChoice(choice)}
                            className="btn-modern w-full text-left p-4 bg-gradient-to-br from-[#1c1913] to-[#12100b] hover:from-[#2a2517] hover:to-[#1c1913] border border-[#c9a227]/40 hover:border-[#e8c85a] rounded-sm transition-all shadow-lg hover:shadow-[0_0_18px_rgba(201,162,39,0.3)] hover:scale-[1.01] animate-slide-in-left"
                            style={{animationDelay: `${index * 0.1}s`}}
                          >
                            <div className="flex items-start gap-4">
                              <div className="wh-choice-letter flex-shrink-0 w-10 h-10 flex items-center justify-center shadow-lg">
                                <span className="font-bold text-lg">
                                  {choice.letter}
                                </span>
                              </div>
                              <span className="font-event text-lg text-[#d8c9a3] flex-1 leading-relaxed pt-1">{choice.text}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="relative inline-block mb-8">
                      <div className="text-8xl animate-pulse">☠️</div>
                      <div className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
                    </div>
                    <h2 className="font-gothic text-5xl font-bold mb-6 uppercase tracking-[0.25em] bg-gradient-to-b from-[#e74c3c] via-[#a30000] to-[#5c0000] bg-clip-text text-transparent">
                      СМЕРТЬ
                    </h2>
                    <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-gray-300">
                      {deathMessage}
                    </p>
                    <div className="wh-panel wh-frame p-8 mb-10 text-left max-w-2xl mx-auto">
                      <h3 className="font-gothic text-2xl font-bold text-[#e8c85a] mb-6 uppercase tracking-[0.15em] flex items-center gap-3">
                        <span className="text-3xl">📜</span>
                        Итоги жизни
                      </h3>
                      <div className="space-y-4 text-lg">
                        <div className="flex justify-between items-center py-3 border-b border-gray-700">
                          <span className="text-gray-400">Раса:</span>
                          <span className="font-bold text-yellow-400 text-xl">{raceInfo.emoji} {character.raceName}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-700">
                          <span className="text-gray-400">Прожито лет:</span>
                          <span className="font-bold text-white text-3xl">{character.age}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-700">
                          <span className="text-gray-400">Планета:</span>
                          <span className="font-semibold text-cyan-400 text-lg">{character.planet}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-700">
                          <span className="text-gray-400">Сословие:</span>
                          <span className="font-semibold text-orange-400 text-lg">{character.caste}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-gray-400">Статус:</span>
                          <span className="font-semibold text-purple-400 text-lg">{character.status}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => startNewGame()}
                      className="btn-wh-primary btn-modern font-bold py-4 px-14 rounded-sm text-xl transition-all hover:scale-105"
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

      <footer className="border-t border-[#c9a227]/30 py-4 mt-8" style={{ background: 'rgba(11,10,8,0.9)' }}>
        <div className="mx-auto w-full max-w-[1700px] px-6 text-center">
          <div className="flex justify-center gap-3 mb-3">
            <span className="text-xl animate-pulse">⚔️</span>
            <span className="text-xl animate-pulse" style={{animationDelay: '0.2s'}}>☠️</span>
            <span className="text-xl animate-pulse" style={{animationDelay: '0.4s'}}>⚜️</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            Warhammer Life Simulator • Warhammer 40,000 • 6 рас
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">A-D</kbd>
              выбор
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <kbd className="px-2.5 py-1 bg-gray-800 border border-yellow-600/30 rounded text-yellow-400 font-mono">Space</kbd>
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
    <div className="flex items-center gap-3 group hover:bg-[#c9a227]/5 rounded-sm p-2 transition-all">
      <span className="text-xl w-8 text-center transform group-hover:scale-110 transition-transform">{icon}</span>
      <span className="font-gothic text-sm text-[#b8a878] w-28 tracking-wide">{label}</span>
      <div className="wh-bar flex-1 overflow-hidden" style={{ height: '8px' }}>
        <div
          className={`wh-bar-fill ${color}`}
          style={{ width: `${value * 10}%`, height: '100%' }}
        ></div>
      </div>
      <span className="text-base text-[#d8c9a3] w-10 text-right font-bold">{value}</span>
    </div>
  );
}

export default App;
