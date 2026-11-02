import { CharacterStats } from '../../game/types';
import { WindowPane, ReadoutRow } from '../Dashboard';
import { isStarving, foodCaption } from '../../game/statMeta';

interface SuppliesWindowProps {
  character: CharacterStats;
}

/**
 * Окно «Снабжение» — кредиты, пайки, боезапас, положение (v0.3.32).
 * Дефицит подсвечен красным с ⚠ и пояснением: игрок мгновенно видит,
 * что голодает или остался без патронов/денег.
 */
export function SuppliesWindow({ character }: SuppliesWindowProps) {
  const starving = isStarving(character.food);
  return (
    <WindowPane title="Снабжение" icon="🧮">
      <ReadoutRow label="💰 Кредиты" value={character.credits}
        hint={character.credits === 0 ? 'Нет денег: торг и взятки недоступны' : 'Тронные кредиты — валюта Империума'}
        tone={character.credits === 0 ? 'bad' : 'default'} />
      <ReadoutRow label={`🍖 Пайки${starving ? ' ⚠' : ''}`} value={`${character.food} — ${foodCaption(character.food)}`}
        hint="Провизия: пайки на год. Каждый год съедается 1 порция; без еды начинается голод, ослабляющий тело."
        tone={starving ? 'bad' : 'default'} />
      <ReadoutRow label={`🔫 Боезапас${character.ammo === 0 ? ' ⚠' : ''}`} value={character.ammo === 0 ? 'оружие молчит!' : character.ammo}
        hint={character.ammo === 0 ? 'Без патронов бой против вооружённого врага почти верная смерть' : 'Заряды для стрелкового оружия'}
        tone={character.ammo === 0 ? 'bad' : 'default'} />
      <ReadoutRow label="Положение" value={character.status} hint="Твоё место в жизни меняется судьбоносными выборами." />
    </WindowPane>
  );
}