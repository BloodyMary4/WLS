import { CharacterStats } from '../../game/types';
import { findAugmetic } from '../../game/augmetics';
import { WindowPane } from '../Dashboard';

interface InventoryWindowProps {
  character: CharacterStats;
}

/**
 * Окно «Снаряжение» — инвентарь, аугметика и черты характера (v0.3.32).
 * Аугметики раскрывают лорное описание по наведению.
 */
export function InventoryWindow({ character }: InventoryWindowProps) {
  const count = character.inventory.length + character.augmentics.length + character.traits.length;
  return (
    <WindowPane title="Снаряжение" icon="🎒" scroll
      extra={<span className="text-[10px] text-gray-400 tabular-nums">{count} поз.</span>}>
      <div className="space-y-1.5 text-xs">
        <div>
          <span className="text-[#b8a878] font-semibold">Инвентарь: </span>
          <span className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</span>
        </div>
        {character.augmentics.length > 0 && (
          <div>
            <span className="text-[#b8a878] font-semibold">Аугметика: </span>
            {character.augmentics.map((id) => {
              const aug = findAugmetic(id);
              return (
                <span key={id} title={aug?.description ?? id} className="text-[#c9a227] cursor-help mr-1.5">
                  ⚙️ {aug ? aug.name : id}
                </span>
              );
            })}
          </div>
        )}
        <div>
          <span className="text-[#b8a878] font-semibold">Черты: </span>
          <span className="text-wh-plasma">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</span>
        </div>
      </div>
    </WindowPane>
  );
}
