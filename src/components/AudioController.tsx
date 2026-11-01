import { useState, useEffect, useCallback } from 'react';
import { getAmbience } from '../game/audio';

export function AudioController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [isExpanded, setIsExpanded] = useState(false);

  const ambience = getAmbience();

  // Синхронизация индикатора с реальным состоянием амбиенса.
  // resume() промис, поэтому сверяемся асинхронно (макрозадача), а не сразу.
  useEffect(() => {
    setVolume(ambience.getVolume());
    setIsPlaying(ambience.getIsPlaying());
  }, [ambience]);

  const syncStatus = useCallback(() => {
    // дожидаемся завершения resume().then(...) внутри start()
    setTimeout(() => setIsPlaying(ambience.getIsPlaying()), 0);
  }, [ambience]);

  // Звуки событий/достижений тоже требуют «разблокированного» контекста —
  // при первом жесте пользователя стартуем фоновую музыку, если она не играет.
  useEffect(() => {
    const unlock = () => {
      ambience.unlockOnUserGesture();
      syncStatus();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [ambience, syncStatus]);

  const handleToggle = useCallback(() => {
    const playing = ambience.toggle();
    setIsPlaying(playing);
    if (playing) {
      syncStatus();
    }
  }, [ambience, syncStatus]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    ambience.setVolume(newVolume);
  };

  // Если браузер так и не разрешил автозапуск — подсказываем игроку, что делать
  const showHint = !isPlaying && volume > 0;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Панель громкости с красивым дизайном */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-600/50 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <span className="text-base font-bold text-yellow-400">Громкость</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 rounded-lg bg-red-900/80 hover:bg-red-800 text-white flex items-center justify-center text-base transition-all hover:scale-110"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-yellow-400 w-12">{Math.round(volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
            />
          </div>
        </div>
      )}
      
      {/* Кнопки управления с красивым дизайном */}
      <div className="flex items-center gap-3">
        {/* Кнопка настроек */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isExpanded
              ? 'bg-gradient-to-br from-yellow-600 to-yellow-800 border-2 border-yellow-400 shadow-lg shadow-yellow-600/50'
              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-600/30'
          }`}
          title="Настройки звука"
        >
          <svg className="w-6 h-6 text-yellow-400 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {isExpanded && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          )}
        </button>

        {/* Кнопка Play/Pause */}
        <button
          onClick={handleToggle}
          className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isPlaying 
              ? 'bg-gradient-to-br from-red-700 to-red-900 border-2 border-red-500 shadow-lg shadow-red-600/50' 
              : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 hover:border-red-500 hover:shadow-lg hover:shadow-red-600/30'
          }`}
          title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
        >
          {isPlaying ? (
            <>
              <svg className="w-7 h-7 text-red-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-20"></div>
            </>
          ) : (
            <svg className="w-7 h-7 text-gray-400 group-hover:text-red-400 group-hover:scale-110 transition-all" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          )}
        </button>
      </div>
      
      {/* Индикатор статуса */}
      <div className={`px-3 py-1 rounded-full text-base font-bold transition-all ${
        isPlaying 
          ? 'bg-red-900/80 text-red-300 border border-red-600' 
          : 'bg-gray-800/80 text-gray-400 border border-gray-600'
      }`}>
        {isPlaying ? '🎵 Играет' : '🔇 Выкл'}
      </div>

      {/* Подсказка: браузеры блокируют автозапуск звука до первого действия пользователя */}
      {showHint && (
        <button
          onClick={handleToggle}
          className="max-w-[240px] px-3 py-1 rounded-lg bg-yellow-900/70 border border-yellow-600/50 text-yellow-300 text-sm font-event animate-pulse hover:bg-yellow-800/70 transition-colors"
          title="Нажмите, чтобы включить музыку"
        >
          🔈 Нажмите любую клавишу или кликните — включим музыку
        </button>
      )}
    </div>
  );
}
