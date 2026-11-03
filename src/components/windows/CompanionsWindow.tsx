import { NPC } from '../../game/types';
import { WindowPane } from '../Dashboard';

interface CompanionsWindowProps {
  npcs: NPC[];
}

/**
 * Окно «Встреченные души» — NPC, чьи судьбы переплелись с твоей (v0.3.32).
 * Союзник/Нейтрал/Враг определяется тоном отношений; полоса — сила связи.
 */
export function CompanionsWindow({ npcs }: CompanionsWindowProps) {
  return (
    <WindowPane title="Встреченные души" icon="⚔️" scroll
      extra={<span className="text-[10px] text-gray-400 tabular-nums">{npcs.length}</span>}>
      <div className="space-y-1.5">
        {npcs.slice(0, 8).map((npc) => (
          <div key={npc.id} className="rounded-sm border border-gray-700/50 bg-black/25 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-gray-100 truncate">{npc.name}</span>
              <span className={`text-[10px] font-bold shrink-0 ${
                npc.relationship >= 50 ? 'text-wh-health' : npc.relationship >= 0 ? 'text-wh-caution' : 'text-wh-blood'
              }`}>
                {npc.relationship > 0 ? 'Союзник' : npc.relationship >= 0 ? 'Нейтрал' : 'Враг'}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 text-[10px] text-gray-400">
              <span className="truncate italic">{npc.role}</span>
              <span className="shrink-0" title={`Вы пересеклись с этой душой, когда тебе было ${npc.lastInteraction} лет от роду`}>
                встречены в {npc.lastInteraction} лет
              </span>
            </div>
            <div className="wh-bar w-full overflow-hidden mt-1" style={{ height: '4px' }} aria-hidden="true">
              <div className={`h-full ${npc.relationship >= 50 ? 'bg-wh-health' : npc.relationship >= 0 ? 'bg-wh-caution' : 'bg-wh-blood'}`}
                style={{ width: `${Math.abs(npc.relationship)}%` }} />
            </div>
          </div>
        ))}
        {npcs.length > 8 && (
          <div className="text-center text-[10px] text-gray-400 italic">…и ещё {npcs.length - 8} душ на твоём пути</div>
        )}
      </div>
    </WindowPane>
  );
}
