import { CharacterStats, ChoiceEffects } from './types';

export interface MicroEvent {
  text: string;
  probability: number;
  effects: ChoiceEffects;
  race?: string | string[];
}

export const MICRO_EVENTS: MicroEvent[] = [
  {
    text: 'Ты находишь монету на дороге.',
    probability: 0.3,
    effects: { credits: 1, description: 'Мелочь, но приятно.' }
  },
  {
    text: 'Тебя останавливает патруль для проверки.',
    probability: 0.2,
    effects: { suspicion: 1, description: 'Проверка документов. Всё в порядке.' }
  },
  {
    text: 'Ты помогаешь старому человеку перейти дорогу.',
    probability: 0.15,
    effects: { faith: 1, description: 'Доброе дело. Старик благодарит.' }
  },
  {
    text: 'Ты спотыкаешься и падаешь.',
    probability: 0.1,
    effects: { health: -2, description: 'Небольшие ушибы. Ничего серьёзного.' }
  },
  {
    text: 'Ты встречаешь старого знакомого.',
    probability: 0.2,
    effects: { description: 'Приятная беседа. Время летит.' }
  },
  {
    text: 'Ты находишь забытый предмет.',
    probability: 0.15,
    effects: { credits: 3, description: 'Кто-то потерял, ты нашёл.' }
  },
  {
    text: 'Ночью тебе снится странный сон.',
    probability: 0.25,
    effects: { willpower: 1, description: 'Сон был... пророческим? Ты чувствуешь себя странно.' }
  },
  {
    text: 'Ты слышишь странные слухи о ереси.',
    probability: 0.1,
    effects: { suspicion: 1, faith: -1, description: 'Слухи тревожат. Может, это правда?' }
  },
  {
    text: 'Ты тренируешься в тайне.',
    probability: 0.2,
    effects: { strength: 1, description: 'Каждая тренировка делает тебя сильнее.' }
  },
  {
    text: 'Ты изучаешь древние тексты.',
    probability: 0.15,
    effects: { cunning: 1, faith: 1, description: 'Знание — сила. Даже запретное знание.' }
  },
  {
    text: 'Ты молишься Императору.',
    probability: 0.3,
    effects: { faith: 2, imperium: 1, description: 'Молитва укрепляет веру.' },
    race: 'human'
  },
  {
    text: 'Инквизиция проводит проверку в районе.',
    probability: 0.15,
    effects: { suspicion: 2, description: 'Все нервничают. Ты стараешься не привлекать внимания.' },
    race: 'human'
  },
  {
    text: 'Ты находишь хороший камень для жевания.',
    probability: 0.3,
    effects: { strength: 1, waaagh: 1, description: 'Камни вкусные! Зубы крепнут.' },
    race: 'ork'
  },
  {
    text: 'Ты дерёшься с другим орком за еду.',
    probability: 0.25,
    effects: { strength: 1, health: -3, waaagh: 1, description: 'Драка! Ты побеждаешь. Еда твоя!' },
    race: 'ork'
  },
  {
    text: 'Ты кричишь WAAAGH! просто так.',
    probability: 0.4,
    effects: { waaagh: 2, description: 'WAAAGH! Другие орки присоединяются.' },
    race: 'ork'
  },
  {
    text: 'Ты медитируешь у Кристаллического Лабиринта.',
    probability: 0.3,
    effects: { psi: 1, nobility: 1, description: 'Медитация проясняет разум.' },
    race: 'eldar'
  },
  {
    text: 'Ты чувствуешь отголоски прошлого через Варп.',
    probability: 0.2,
    effects: { psi: 1, willpower: -1, description: 'Воспоминания тысячелетий. Боль и мудрость.' },
    race: 'eldar'
  },
  {
    text: 'Ты причиняешь боль пленнику.',
    probability: 0.25,
    effects: { cruelty: 1, health: 2, description: 'Крики питают тебя. ГОЛОД утихает.' },
    race: 'dark_eldar'
  },
  {
    text: 'Ты планируешь интригу против rival.',
    probability: 0.2,
    effects: { cunning: 1, description: 'Шах и мат. Они даже не подозревают.' },
    race: 'dark_eldar'
  },
  {
    text: 'Ты участвуешь в групповой медитации Высшего Блага.',
    probability: 0.3,
    effects: { unity: 2, description: 'Единство с братьями. Высшее Благо растёт.' },
    race: 'tau'
  },
  {
    text: 'Ты изучаешь новую технологию.',
    probability: 0.25,
    effects: { techSkill: 1, cunning: 1, description: 'Прогресс — это путь.' },
    race: 'tau'
  },
  {
    text: 'Ты прячешься от орка.',
    probability: 0.35,
    effects: { sneakiness: 1, description: 'Ты становишься невидимым. Орк проходит мимо.' },
    race: 'gretchin'
  },
  {
    text: 'Ты крадёшь еду у орка.',
    probability: 0.2,
    effects: { sneakiness: 1, health: 2, description: 'Тихо. Быстро. Никто не заметил.' },
    race: 'gretchin'
  },
];

export function triggerMicroEvent(character: CharacterStats): { event: MicroEvent; triggered: boolean } {
  const availableEvents = MICRO_EVENTS.filter(event => {
    if (!event.race) return true;
    if (Array.isArray(event.race)) return event.race.includes(character.race);
    return event.race === character.race;
  });
  
  for (const event of availableEvents) {
    if (Math.random() < event.probability) {
      return { event, triggered: true };
    }
  }
  
  return { event: availableEvents[0], triggered: false };
}
