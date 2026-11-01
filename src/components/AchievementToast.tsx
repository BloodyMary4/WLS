import { ACHIEVEMENTS } from '../game/achievements';

interface AchievementToastProps {
  achievementId: string | null;
}

/** Всплывающее уведомление о разблокированном достижении. */
export function AchievementToast({ achievementId }: AchievementToastProps) {
  if (!achievementId) return null;
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-scale-in max-w-md">
      <div className="wh-panel wh-frame px-6 py-4 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="text-4xl animate-pulse shrink-0">
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
