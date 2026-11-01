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
  // Дополнительные общие события
  {
    text: 'Ты находишь старый дневник.',
    probability: 0.15,
    effects: { cunning: 1, willpower: 1, description: 'Чужие мысли... но полезные.' }
  },
  {
    text: 'Ты помогаешь раненому.',
    probability: 0.2,
    effects: { faith: 1, health: 1, description: 'Доброе дело. Ты чувствуешь себя лучше.' }
  },
  {
    text: 'Ты споришь с торговцем.',
    probability: 0.25,
    effects: { cunning: 1, credits: 2, description: 'Ты торгуешься. Получаешь лучшую цену.' }
  },
  {
    text: 'Ты видишь странный знак на стене.',
    probability: 0.1,
    effects: { suspicion: 1, faith: -1, description: 'Символ Хаоса? Или просто graffiti?' }
  },
  {
    text: 'Ты находишь заброшенное оружие.',
    probability: 0.15,
    effects: { strength: 1, addItem: 'Старый лазерган', description: 'Оно ещё работает. Повезло!' }
  },
  // Дополнительные события для людей
  {
    text: 'Ты посещаешь храм Императора.',
    probability: 0.25,
    effects: { faith: 2, willpower: 1, imperium: 1, description: 'Молитва укрепляет дух.' },
    race: 'human'
  },
  {
    text: 'Ты встречаешь Инквизитора.',
    probability: 0.1,
    effects: { suspicion: 2, willpower: 1, description: 'Он смотрит на тебя... долго. Ты нервничаешь.' },
    race: 'human'
  },
  {
    text: 'Ты участвуешь в празднике в честь Императора.',
    probability: 0.2,
    effects: { faith: 1, unity: 1, description: 'Все поют гимны. Ты чувствуешь единство.' },
    race: 'human'
  },
  // Дополнительные события для орков
  {
    text: 'Ты находишь большую пушку.',
    probability: 0.2,
    effects: { strength: 2, waaagh: 2, addItem: 'Большая пушка', description: 'Она стреляет громко! WAAAGH!' },
    race: 'ork'
  },
  {
    text: 'Ты участвуешь в великой битве.',
    probability: 0.15,
    effects: { strength: 2, waaagh: 3, health: -5, description: 'Битва была жестокой. Но ты выжил! WAAAGH!' },
    race: 'ork'
  },
  {
    text: 'Ты ешь странное мясо.',
    probability: 0.3,
    effects: { health: 3, strength: 1, description: 'Вкусно! Ты чувствуешь себя сильнее.' },
    race: 'ork'
  },
  // Дополнительные события для эльдар
  {
    text: 'Ты общаешься с древним эльдар.',
    probability: 0.2,
    effects: { nobility: 2, psi: 1, description: 'Его мудрость... бесценна.' },
    race: 'eldar'
  },
  {
    text: 'Ты создаёшь произведение искусства.',
    probability: 0.25,
    effects: { psi: 1, nobility: 1, description: 'Красота... в хаосе этого мира.' },
    race: 'eldar'
  },
  {
    text: 'Ты медитируешь на звёзды.',
    probability: 0.3,
    effects: { willpower: 2, psi: 1, description: 'Космос говорит с тобой.' },
    race: 'eldar'
  },
  // Дополнительные события для тёмных эльдар
  {
    text: 'Ты организуешь великое представление боли.',
    probability: 0.2,
    effects: { cruelty: 3, health: 3, description: 'Крики... музыка для ушей Друкхаари.' },
    race: 'dark_eldar'
  },
  {
    text: 'Ты плетёшь сложную интригу.',
    probability: 0.25,
    effects: { cunning: 2, description: 'Паутина лжи... идеально.' },
    race: 'dark_eldar'
  },
  {
    text: 'Ты находишь редкий яд.',
    probability: 0.15,
    effects: { techSkill: 1, cruelty: 1, addItem: 'Редкий яд', description: 'Он убивает медленно... и болезненно.' },
    race: 'dark_eldar'
  },
  // Дополнительные события для тау
  {
    text: 'Ты участвуешь в великом собрании.',
    probability: 0.2,
    effects: { unity: 2, faith: 1, description: 'Все касты вместе. Высшее Благо растёт.' },
    race: 'tau'
  },
  {
    text: 'Ты тестируешь новое оружие.',
    probability: 0.25,
    effects: { techSkill: 2, strength: 1, description: 'Оно работает... идеально.' },
    race: 'tau'
  },
  {
    text: 'Ты обучаешь молодых Тау.',
    probability: 0.3,
    effects: { unity: 1, cunning: 1, description: 'Знание — сила. Ты делишься им.' },
    race: 'tau'
  },
  // Дополнительные события для гретчинов
  {
    text: 'Ты находишь спрятанное оружие.',
    probability: 0.15,
    effects: { sneakiness: 1, addItem: 'Скрытый нож', description: 'Оно маленькое... но острое.' },
    race: 'gretchin'
  },
  {
    text: 'Ты помогаешь другому гретчину.',
    probability: 0.3,
    effects: { unity: 1, willpower: 1, description: 'Вместе... легче.' },
    race: 'gretchin'
  },
  {
    text: 'Ты изучаешь орков.',
    probability: 0.25,
    effects: { cunning: 2, description: 'Их слабости... очевидны, если знать, куда смотреть.' },
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
