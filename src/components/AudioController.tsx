import { useState, useEffect, useCallback } from 'react';
import { getAmbience } from '../game/audio';

export function AudioController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.55);
  const [isExpanded, setIsExpanded] = useState(false);

  const ambience = getAmbience();

  useEffect(() => {
    setVolume(ambience.getVolume());
  }, [ambience]);

  const handleToggle = useCallback(() => {
    const playing = ambience.toggle();
    setIsPlaying(playing);
  }, [ambience]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    ambience.setVolume(newVolume);
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2">
      {isExpanded && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 min-w-[240px] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-yellow-500">Громкость</span>
            <button 
              onClick={() => setIsExpanded(false)}
              className="w-6 h-6 rounded bg-red-900 hover:bg-red-800 text-white flex items-center justify-center text-xs transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10">{Math.round(volume * 100)}%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-gray-800 rounded appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 flex items-center justify-center transition-colors"
          title="Настройки звука"
        >
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={handleToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isPlaying 
              ? 'bg-red-800 border-2 border-red-600' 
              : 'bg-gray-800 border-2 border-gray-600 hover:border-yellow-600'
          }`}
          title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
