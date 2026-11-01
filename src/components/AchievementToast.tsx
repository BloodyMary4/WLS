import { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../game/achievements';

interface AchievementToastProps {
  achievementId: string | null;
}

/** Всплывающее уведомление о разблокированном достижении. */
export function AchievementToast({ achievementId }: AchievementToastProps) {
  // Держим последний non-null id, чтобы анимация ухода (fade-out) была видна:
  // при сбросе newAchievement в null компонент ещё секунду показывает тост.
  const [shownId, setShownId] = useState<string | null>(achievementId);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (achievementId) {
      setShownId(achievementId);
      setLeaving(false);
      const hideTimer = setTimeout(() => setLeaving(true), 3800);
      const clearTimer = setTimeout(() => setShownId(null), 4700);
      return () => { clearTimeout(hideTimer); clearTimeout(clearTimer); };
    }
    if (shownId && !leaving) setLeaving(true);
    return undefined;
  }, [achievementId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shownId) return null;
  const achievement = ACHIEVEMENTS.find(a => a.id === shownId);
  if (!achievement) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-md transition-all duration-900 ${
        leaving ? 'opacity-0 translate-y-4' : 'animate-scale-in opacity-100'
      }`}
    >
      <div className="wh-panel wh-frame px-6 py-4 shadow-2xl backdrop-blur-sm border !border-[#c9a227]/70">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-pulse shrink-0 drop-shadow-[0_0_12px_rgba(201,162,39,0.6)]">
            {achievement.icon}
          </div>
          <div>
            <div className="font-gothic text-base text-[#e8c85a] font-bold uppercase tracking-widest mb-2">
              🏆 Достижение разблокировано!
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              {achievement.name}
            </div>
            <div className="text-base text-gray-300 mt-2">
              {achievement.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
