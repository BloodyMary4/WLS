import { CharacterStats } from '../game/types';

type RaceInfo = { name: string; emoji: string; description: string };

interface DeathScreenProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  deathMessage: string;
  onNewLife: () => void;
}

/** Эпитафия: итоги жизни и кнопка новой реинкарнации. */
export function DeathScreen({ character, raceInfo, deathMessage, onNewLife }: DeathScreenProps) {
  return (
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
        onClick={onNewLife}
        className="btn-wh-primary btn-modern font-bold py-4 px-14 rounded-sm text-xl transition-all hover:scale-105"
      >
        ⚔️ Начать новую жизнь
      </button>
    </div>
  );
}
