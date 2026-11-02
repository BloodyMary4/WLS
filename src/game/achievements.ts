import { CharacterStats } from './types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (character: CharacterStats) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'survivor_10',
    name: 'Выживший',
    description: 'Дожить до 10 лет',
    icon: '🎂',
    condition: (c) => c.age >= 10
  },
  {
    id: 'survivor_20',
    name: 'Закалённый',
    description: 'Дожить до 20 лет',
    icon: '⭐',
    condition: (c) => c.age >= 20
  },
  {
    id: 'survivor_50',
    name: 'Ветеран',
    description: 'Дожить до 50 лет',
    icon: '🏆',
    condition: (c) => c.age >= 50
  },
  {
    id: 'survivor_100',
    name: 'Долгожитель',
    description: 'Дожить до 100 лет',
    icon: '👑',
    condition: (c) => c.age >= 100
  },
  {
    id: 'faithful',
    name: 'Верующий',
    description: 'Достичь 8+ веры',
    icon: '✝',
    condition: (c) => c.hiddenParams.faith >= 8
  },
  {
    id: 'cunning_master',
    name: 'Хитрец',
    description: 'Достичь 8+ хитрости',
    icon: '🗡',
    condition: (c) => c.hiddenParams.cunning >= 8
  },
  {
    id: 'strong',
    name: 'Силач',
    description: 'Достичь 8+ силы',
    icon: '💪',
    condition: (c) => c.hiddenParams.strength >= 8
  },
  {
    id: 'iron_will',
    name: 'Железная воля',
    description: 'Достичь 8+ воли',
    icon: '🛡',
    condition: (c) => c.hiddenParams.willpower >= 8
  },
  {
    id: 'waaagh_master',
    name: 'WAAAGH! Мастер',
    description: 'Достичь 8+ WAAAGH! (орк)',
    icon: '⚔',
    condition: (c) => c.race === 'ork' && (c.hiddenParams.waaagh || 0) >= 8
  },
  {
    id: 'psyker',
    name: 'Псайкер',
    description: 'Достичь 8+ пси-силы (эльдар)',
    icon: '🔮',
    condition: (c) => c.race === 'eldar' && (c.hiddenParams.psi || 0) >= 8
  },
  {
    id: 'cruel_lord',
    name: 'Жестокий лорд',
    description: 'Достичь 8+ жестокости (друкхаари)',
    icon: '🩸',
    condition: (c) => c.race === 'dark_eldar' && (c.hiddenParams.cruelty || 0) >= 8
  },
  {
    id: 'united',
    name: 'Единый',
    description: 'Достичь 8+ единства (тау)',
    icon: '🔷',
    condition: (c) => c.race === 'tau' && (c.hiddenParams.unity || 0) >= 8
  },
  {
    id: 'shadow',
    name: 'Тень',
    description: 'Достичь 8+ скрытности (гретчин)',
    icon: '🐀',
    condition: (c) => c.race === 'gretchin' && (c.hiddenParams.sneakiness || 0) >= 8
  },
  {
    id: 'rich',
    name: 'Богач',
    description: 'Накопить 100+ кредитов',
    icon: '💰',
    condition: (c) => c.credits >= 100
  },
  {
    id: 'leader',
    name: 'Лидер',
    description: 'Достичь статуса лидера',
    icon: '👑',
    condition: (c) => ['Вождь', 'Архонт', 'Командир', 'Ноб-лидер', 'Революционер'].includes(c.status)
  },
  {
    id: 'warrior',
    name: 'Воин',
    description: 'Стать воином',
    icon: '⚔',
    condition: (c) => ['Воин Банд', 'Рекрут', 'Телохранитель Босса'].includes(c.status)
  },
  {
    id: 'scholar',
    name: 'Учёный',
    description: 'Стать учёным или провидцем',
    icon: '📚',
    condition: (c) => ['Провидец', 'Ученик Гризника'].includes(c.status)
  },
  {
    id: 'trait_collector',
    name: 'Коллекционер черт',
    description: 'Собрать 5+ черт характера',
    icon: '⭐',
    condition: (c) => c.traits.length >= 5
  },
  {
    id: 'bandit',
    name: 'Бандит',
    description: 'Стать бандитом',
    icon: '🗡',
    condition: (c) => c.traits.includes('Бандит')
  },
  {
    id: 'loyal_friend',
    name: 'Верный друг',
    description: 'Стать верным другом',
    icon: '🤝',
    condition: (c) => c.traits.includes('Верный друг')
  },
  {
    id: 'savior',
    name: 'Спаситель',
    description: 'Стать спасителем',
    icon: '💚',
    condition: (c) => c.traits.includes('Спаситель')
  },
  {
    id: 'mutant',
    name: 'Мутант',
    description: 'Достичь 5+ мутаций (и выжить)',
    icon: '☣',
    condition: (c) => c.hiddenParams.mutation >= 5 && c.health > 0
  },
  {
    id: 'suspected',
    name: 'Под подозрением',
    description: 'Достичь 5+ подозрения (и выжить)',
    icon: '👁',
    condition: (c) => c.hiddenParams.suspicion >= 5 && c.health > 0
  },
  {
    id: 'inventory_master',
    name: 'Собиратель',
    description: 'Собрать 5+ предметов',
    icon: '🎒',
    condition: (c) => c.inventory.length >= 5
  },
  // Новые достижения
  {
    id: 'influential',
    name: 'Влиятельный',
    description: 'Достичь 50+ влияния',
    icon: '⭐',
    condition: (c) => c.influence >= 50
  },
  {
    id: 'lucky',
    name: 'Везунчик',
    description: 'Достичь 8+ удачи',
    icon: '🍀',
    condition: (c) => c.luck >= 8
  },
  {
    id: 'sane',
    name: 'Здравомыслящий',
    description: 'Сохранить рассудок выше 80%',
    icon: '🧠',
    condition: (c) => c.sanity >= 80 && c.age >= 30
  },
  {
    id: 'corrupted',
    name: 'Развращённый',
    description: 'Достичь 50+ порчи Варпа',
    icon: '🌀',
    condition: (c) => c.warpCorruption >= 50
  },
  {
    id: 'warp_touched',
    name: 'Отмеченный Варпом',
    description: 'Достичь 5+ внимания Варпа',
    icon: '👁️',
    condition: (c) => c.warpAttention >= 5
  },
  {
    id: 'well_fed',
    name: 'Сытый',
    description: 'Иметь 20+ еды',
    icon: '🍖',
    condition: (c) => c.food >= 20
  },
  {
    id: 'armed',
    name: 'Вооружён',
    description: 'Иметь 20+ патронов',
    icon: '🔫',
    condition: (c) => c.ammo >= 20
  },
  {
    id: 'augmented',
    name: 'Аугментированный',
    description: 'Иметь 3+ импланта',
    icon: '🔧',
    condition: (c) => c.augmentics.length >= 3
  },
  {
    id: 'diplomat',
    name: 'Дипломат',
    description: 'Достичь 50+ отношений с Империумом',
    icon: '🤝',
    condition: (c) => c.factionRelations.imperium >= 50
  },
  {
    id: 'heretic',
    name: 'Еретик',
    description: 'Достичь -50 и ниже отношений с Империумом',
    icon: '😈',
    condition: (c) => c.factionRelations.imperium <= -50
  },
  {
    id: 'chaos_touched',
    name: 'Отмеченный Хаосом',
    description: 'Достичь 50+ отношений с Хаосом',
    icon: '🔥',
    condition: (c) => c.factionRelations.chaos >= 50
  },
  {
    id: 'xenos_friend',
    name: 'Друг ксеносов',
    description: 'Достичь 50+ отношений с ксеносами',
    icon: '👽',
    condition: (c) => c.factionRelations.xenos >= 50
  },
  {
    id: 'criminal_mastermind',
    name: 'Криминальный гений',
    description: 'Достичь 50+ отношений с преступниками',
    icon: '🗡️',
    condition: (c) => c.factionRelations.criminals >= 50
  },
  {
    id: 'key_choice_maker',
    name: 'Вершитель судеб',
    description: 'Сделать 5+ ключевых выборов',
    icon: '🔑',
    condition: (c) => c.keyChoices.length >= 5
  },
  {
    id: 'world_traveler',
    name: 'Путешественник',
    description: 'Увидеть 3+ глобальных события',
    icon: '🌍',
    condition: (c) => (c.worldEventsSeen?.length ?? 0) >= 3
  },
  {
    id: 'survivor_200',
    name: 'Бессмертный',
    description: 'Дожить до 200 лет',
    icon: '💀',
    condition: (c) => c.age >= 200
  },
  {
    id: 'max_health',
    name: 'Крепкий',
    description: 'Достичь максимального здоровья',
    icon: '❤️',
    condition: (c) => c.health >= c.maxHealth && c.age >= 10
  },
  {
    id: 'poor',
    name: 'Бедняк',
    description: 'Иметь 0 кредитов в возрасте 20+',
    icon: '💸',
    condition: (c) => c.credits === 0 && c.age >= 20
  },
  {
    id: 'trait_master',
    name: 'Мастер черт',
    description: 'Собрать 10+ черт характера',
    icon: '🌟',
    condition: (c) => c.traits.length >= 10
  },
  // Достижения NPC
  {
    id: 'social_butterfly',
    name: 'Душа компании',
    description: 'Встретить 10+ NPC',
    icon: '🦋',
    condition: (c) => c.npcs.length >= 10
  },
  {
    id: 'beloved',
    name: 'Любимец',
    description: 'Иметь 3+ друзей (отношения 50+)',
    icon: '❤️',
    condition: (c) => c.npcs.filter(npc => npc.relationship >= 50).length >= 3
  },
  {
    id: 'feared',
    name: 'Страшилище',
    description: 'Иметь 3+ врагов (отношения -50+)',
    icon: '💀',
    condition: (c) => c.npcs.filter(npc => npc.relationship <= -50).length >= 3
  },
  {
    id: 'networker',
    name: 'Нетворкер',
    description: 'Встретить 20+ NPC',
    icon: '🕸️',
    condition: (c) => c.npcs.length >= 20
  },
  {
    id: 'best_friend',
    name: 'Лучший друг',
    description: 'Достичь 100 отношений с NPC',
    icon: '🤝',
    condition: (c) => c.npcs.some(npc => npc.relationship >= 100)
  },
  {
    id: 'nemesis',
    name: 'Заклятый враг',
    description: 'Достичь -100 отношений с NPC',
    icon: '⚔️',
    condition: (c) => c.npcs.some(npc => npc.relationship <= -100)
  },
  // Лорные достижения: Вера, Заступничество, сословия
  {
    id: 'creed_ten',
    name: 'Император защищает',
    description: 'Достичь 10 Верности (праведная жизнь человека)',
    icon: '☦',
    condition: (c) => (c.imperialCreed ?? 0) >= 10
  },
  {
    id: 'tithe_lamb',
    name: 'Десятина',
    description: 'Вера в Господство Империума 80+',
    icon: '🕯',
    condition: (c) => c.factionRelations.faith >= 80
  },
  {
    id: 'people_champion',
    name: 'Голос низов',
    description: 'Простолины уважают тебя (80+)',
    icon: '🍞',
    condition: (c) => c.factionRelations.commoners >= 80
  },
  {
    id: 'high_born',
    name: 'Свой среди высоких лордов',
    description: 'Аристократия благоволит тебе (80+)',
    icon: '🏰',
    condition: (c) => c.factionRelations.nobility >= 80
  },
  {
    id: 'tithe_payer',
    name: 'Верная десятина',
    description: 'Платить десятину Империуму с честью: имперские отношения 60+',
    icon: '⚙️',
    condition: (c) => c.factionRelations.imperium >= 60 && c.race === 'human'
  },
  {
    id: 'inquisitors_darling',
    name: 'Любимец Инквизиции',
    description: 'Подозрение 8+ — чёрные корабли интересуются тобой лично',
    icon: '👁',
    condition: (c) => c.hiddenParams.suspicion >= 8
  },
  {
    id: 'thousand_sons',
    name: 'Тысяча сыновей',
    description: 'Пережить заступничество Императора дважды. Он упорно не хочет тебя отпускать.',
    icon: '✝️',
    condition: (c) => (c.intercessionCount ?? 0) >= 2
  }
];

export function checkAchievements(character: CharacterStats, unlockedAchievements: string[]): string[] {
  const newAchievements: string[] = [];
  
  for (const achievement of ACHIEVEMENTS) {
    if (!unlockedAchievements.includes(achievement.id) && achievement.condition(character)) {
      newAchievements.push(achievement.id);
    }
  }
  
  return newAchievements;
}
