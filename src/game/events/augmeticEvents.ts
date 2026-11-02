/**
 * События установки аугметики — лорная механика для всех рас.
 * Раз в несколько лет персонажу предлагается имплант из каталога его фракции
 * (src/game/augmetics.ts). Выбор «Согласиться» несёт addAugmentic=<id>,
 * эффекты операции и пассивные бонусы применяются через applyChoiceEffects.
 */
import { CharacterStats, GameEvent, Choice } from '../types';
import { availableAugmetics, Augmetic } from '../augmetics';

/** Детерминированный выбор импланта по возрасту (без RNG — seed-партии не смещается) */
export function pickAugmeticForEvent(character: CharacterStats): Augmetic | null {
  const candidates = availableAugmetics(character.race).filter(
    a => character.age >= a.minAge && !character.augmentics.includes(a.id)
  );
  if (candidates.length === 0) return null;
  return candidates[character.age % candidates.length];
}

export function getAugmeticEvent(age: number, character: CharacterStats): GameEvent | null {
  // Только на «пятых» годах, чтобы не перекрывать обычные события слишком часто
  if (age % 5 !== 0) return null;
  const aug = pickAugmeticForEvent(character);
  if (!aug) return null;

  const affordable = character.credits >= aug.price;
  const choices: Choice[] = [
    {
      letter: 'А',
      text: `Установить: ${aug.name}`,
      effects: {
        ...aug.effects,
        ...(aug.price > 0 ? { credits: -aug.price } : {}),
        addAugmentic: aug.id,
        keyChoice: `augmetic_${aug.id}`,
      },
    },
    {
      letter: 'Б',
      text: 'Отказаться — плоть дана богами/вождём/предками',
      effects: { willpower: 1, description: 'Ты отвергаешь металл. Тело — храм, а не машина. Жрец одобряет.' },
    },
    {
      letter: 'В',
      text: 'Спросить цену ещё раз и поторговаться',
      effects: { cunning: 1, sanity: -1, description: 'Ты торгуешься часами. В итоге тебе отказывают — время упущено.' },
    },
  ];
  if (affordable && aug.price > 0) {
    choices.splice(1, 0, {
      letter: 'Г',
      text: `Заплатить вдвое — лучшая модификация (${aug.price * 2} кр.)`,
      effects: {
        ...aug.effects,
        credits: -aug.price * 2,
        influence: 1,
        addAugmentic: aug.id,
        keyChoice: `augmetic_${aug.id}`,
      },
    });
  }

  const intro =
    aug.price > 0
      ? `Возраст ${age}. Хирург-сервитор предлагает тебе имплант: ${aug.name}. «${aug.description}» Цена — ${aug.price} кредитов.`
      : `Возраст ${age}. Тебе предлагают ${aug.name}: «${aug.description}» Для твоего народа это честь, а не покупка.`;

  return { text: intro, choices };
}
