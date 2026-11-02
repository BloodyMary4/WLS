import { CharacterStats, NPC } from './types';
import { rng } from './rng';

// Имена NPC для разных рас
const NPC_NAMES = {
  human: ['Иван', 'Мария', 'Алексей', 'Елена', 'Дмитрий', 'Анна', 'Сергей', 'Ольга', 'Николай', 'Татьяна'],
  ork: ['Грумм', 'Снагга', 'Зог', 'Крак', 'Блог', 'Снорри', 'Горбаг', 'Угрук', 'Муг', 'Траз'],
  eldar: ['Элронд', 'Галадриэль', 'Арвен', 'Леголас', 'Тариэль', 'Фаэрон', 'Сильвана', 'Аэрин', 'Тирион', 'Лиэра'],
  dark_eldar: ['Вектор', 'Крул', 'Мандрейк', 'Суккуба', 'Хемонкул', 'Рейзор', 'Талаос', 'ИNCUBUS', 'Врайт', 'Нокс'],
  tau: ['Ш\'ас', 'Ш\'мон', 'Ш\'вас', 'Ш\'орел', 'Ш\'кай', 'Ш\'весо', 'Ау\'н\'эл', 'Ау\'н\'ва', 'Ш\'дэли', 'Ш\'уй'],
  gretchin: ['Снивик', 'Гринки', 'Снэгл', 'Прок', 'Вимпл', 'Нагг', 'Скрич', 'Флип', 'Блинк', 'Сквит'],
};

// Роли NPC в духе Warhammer 40,000
const NPC_ROLES = {
  human: [
    'Торговец Гильдии', 'Солдат Имперской Гвардии', 'Служитель Адептус', 
    'Инквизитор', 'Техножрец', 'Астартес', 'Санитар', 'Проповедник',
    'Рабочий улья', 'Беглец из нижних уровней', 'Культист (скрытый)',
    'Арбитр', 'Ассоциированный учёный', 'Наёмник'
  ],
  ork: [
    'Бой', 'Ноб', 'Мегабосс', 'Варбосс', 'Медик', 'ШоЙбозз',
    'Гретчин-раб', 'Скуиг-наездник', 'Деффролл', 'Танковый босс'
  ],
  eldar: [
    'Воин Банд', 'Провидец', 'Изгой', 'Рейнджер', 'Ткач Теней',
    'Жрец Феникса', 'Мастер Меча', 'Древний Эльдар'
  ],
  dark_eldar: [
    'Архонт', 'Суккуба', 'Хаэмонкул', 'Кабалит', 'Веном-пилот',
    'Раб', 'Гладиатор', 'Информатор'
  ],
  tau: [
    'Воин Огненной касты', 'Учёный Земляной касты', 'Дипломат Водной касты',
    'Пилот Воздушной касты', 'Этирид', 'Кристаллический вид',
    'Путь Огня', 'Путь Воды'
  ],
  gretchin: [
    'Раб-работник', 'Повар', 'Чистильщик оружия', 'Беглец',
    'Лидер сопротивления', 'Шпион', 'Торговец'
  ]
};

/**
 * Генерирует случайного NPC
 */
export function generateNPC(race: string, age: number): NPC {
  const names = NPC_NAMES[race as keyof typeof NPC_NAMES] || NPC_NAMES.human;
  const roles = NPC_ROLES[race as keyof typeof NPC_ROLES] || NPC_ROLES.human;
  const name = names[Math.floor(rng().next() * names.length)];
  const role = roles[Math.floor(rng().next() * roles.length)];
  
  // Генерируем описание в духе Warhammer 40,000
  const descriptions = [
    'Его глаза хранят тайны тысячелетий',
    'Шрамы на его лице рассказывают истории бесчисленных битв',
    'Его вера непоколебима, как сталь Адамантия',
    'Тень сомнения скрывается в глубине его взгляда',
    'Его руки покрыты маслом и кровью',
    'Он носит знак Инквизиции с гордостью',
    'Его доспехи покрыты рунами защиты',
    'Он шепчет молитвы Императору',
    'Его разум затуманен видениями Варпа',
    'Он несёт бремя своих грехов'
  ];
  
  return {
    id: `npc_${Date.now()}_${rng().next().toString(36).substr(2, 9)}`,
    name: name,
    role: role,
    relationship: Math.floor(rng().next() * 40) - 20, // от -20 до 20
    met: true,
    lastInteraction: age,
    description: descriptions[Math.floor(rng().next() * descriptions.length)]
  };
}

/**
 * Обновляет отношения с NPC
 */
export function updateNPCRelationship(character: CharacterStats, npcId: string, change: number): CharacterStats {
  const newChar = { ...character };
  const npcIndex = newChar.npcs.findIndex(npc => npc.id === npcId);
  
  if (npcIndex !== -1) {
    newChar.npcs[npcIndex] = {
      ...newChar.npcs[npcIndex],
      relationship: Math.max(-100, Math.min(100, newChar.npcs[npcIndex].relationship + change)),
      lastInteraction: newChar.age,
    };
  }
  
  return newChar;
}

/**
 * Добавляет нового NPC
 */
export function addNPC(character: CharacterStats, npc: NPC): CharacterStats {
  const newChar = { ...character };
  newChar.npcs = [...newChar.npcs, npc];
  return newChar;
}

/**
 * Получает NPC по имени
 */
export function getNPCByName(character: CharacterStats, name: string): NPC | undefined {
  return character.npcs.find(npc => npc.name.toLowerCase().includes(name.toLowerCase()));
}

/**
 * Получает друзей (relationship >= 50)
 */
export function getFriends(character: CharacterStats): NPC[] {
  return character.npcs.filter(npc => npc.relationship >= 50);
}

/**
 * Получает врагов (relationship <= -50)
 */
export function getEnemies(character: CharacterStats): NPC[] {
  return character.npcs.filter(npc => npc.relationship <= -50);
}

/**
 * Случайно встречает NPC
 */
export function randomNPCEncounter(character: CharacterStats): { type: 'new' | 'old'; npc?: NPC } {
  // 30% шанс встретить нового NPC
  if (rng().next() < 0.3) {
    return { type: 'new', npc: generateNPC(character.race, character.age) };
  }
  
  // 70% шанс встретить старого NPC (если есть)
  if (character.npcs.length > 0 && rng().next() < 0.7) {
    const randomNpc = character.npcs[Math.floor(rng().next() * character.npcs.length)];
    return { type: 'old', npc: randomNpc };
  }
  
  return { type: 'new' };
}

/**
 * Генерирует событие с NPC
 */
export function generateNPCEvent(character: CharacterStats, npc: NPC): string {
  const relationship = npc.relationship;
  
  if (relationship >= 70) {
    // Очень хорошие отношения
    const events = [
      `${npc.name} предлагает вам помощь в трудную минуту.`,
      `${npc.name} делится с вами ценной информацией.`,
      `${npc.name} приглашает вас на празднество.`,
      `${npc.name} дарит вам редкий предмет.`,
    ];
    return events[Math.floor(rng().next() * events.length)];
  } else if (relationship >= 30) {
    // Хорошие отношения
    const events = [
      `${npc.name} приветствует вас дружески.`,
      `${npc.name} предлагает торговлю.`,
      `${npc.name} рассказывает интересные слухи.`,
      `${npc.name} просит о небольшой услуге.`,
    ];
    return events[Math.floor(rng().next() * events.length)];
  } else if (relationship >= -30) {
    // Нейтральные отношения
    const events = [
      `${npc.name} проходит мимо, не обращая внимания.`,
      `${npc.name} кивает вам, но не останавливается.`,
      `Вы видите ${npc.name} вдали.`,
      `${npc.name} занят своими делами.`,
    ];
    return events[Math.floor(rng().next() * events.length)];
  } else if (relationship >= -70) {
    // Плохие отношения
    const events = [
      `${npc.name} смотрит на вас с подозрением.`,
      `${npc.name} избегает вашего взгляда.`,
      `${npc.name} шепчется с другими о вас.`,
      `${npc.name} открыто выражает недовольство.`,
    ];
    return events[Math.floor(rng().next() * events.length)];
  } else {
    // Очень плохие отношения
    const events = [
      `${npc.name} открыто угрожает вам.`,
      `${npc.name} пытается напасть на вас.`,
      `${npc.name} плетёт заговор против вас.`,
      `${npc.name} нанимает убийц для вас.`,
    ];
    return events[Math.floor(rng().next() * events.length)];
  }
}
