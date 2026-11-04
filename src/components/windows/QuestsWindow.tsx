import { WindowPane } from '../Dashboard';

interface QuestObjective { id: string; description: string; completed: boolean }
interface Quest {
  id: string; name: string; description: string;
  objectives: QuestObjective[];
  rewards: { credits?: number; influence?: number; traits?: string[]; items?: string[] };
}

interface QuestsWindowProps {
  quests: Quest[];
}

/**
 * Окно «Испытания судьбы» — активные квесты и их награды (v0.3.32).
 * ☠ = цель достигнута, ○ = ещё нет; награды подписаны иконками.
 */
export function QuestsWindow({ quests }: QuestsWindowProps) {
  return (
    <WindowPane title="Испытания судьбы" icon="⚔️" scroll
      extra={<span className="text-[10px] text-gray-400 tabular-nums">{quests.length}</span>}>
      <div className="space-y-1.5">
        {quests.length === 0 && (
          <div className="text-[10px] text-gray-400 italic leading-snug">
            Судьба молчит — активных испытаний пока нет.
          </div>
        )}
        {quests.map((quest) => (
          <div key={quest.id} className="rounded-sm border border-yellow-600/30 bg-black/25 px-2 py-1.5">
            <div className="text-xs font-bold text-wh-caution">{quest.name}</div>
            <div className="text-[10px] text-gray-400 italic leading-snug my-1">{quest.description}</div>
            <div className="space-y-0.5">
              {quest.objectives.map((obj) => (
                <div key={obj.id} className="flex items-start gap-1.5 text-[10px]">
                  <span className={obj.completed ? 'text-wh-health' : 'text-gray-400'}>{obj.completed ? '☠' : '○'}</span>
                  <span className={`flex-1 ${obj.completed ? 'text-green-300 line-through' : 'text-gray-400'}`}>{obj.description}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-gray-700/60 text-[10px]">
              {quest.rewards.credits && <span className="text-wh-caution">💰 {quest.rewards.credits}</span>}
              {quest.rewards.influence && <span className="text-wh-warp-low">⭐ {quest.rewards.influence}</span>}
              {quest.rewards.traits?.map((trait, i) => <span key={i} className="text-wh-blood">🎭 {trait}</span>)}
              {quest.rewards.items?.map((item, i) => <span key={i} className="text-wh-plasma">🗡️ {item}</span>)}
            </div>
          </div>
        ))}
      </div>
    </WindowPane>
  );
}
