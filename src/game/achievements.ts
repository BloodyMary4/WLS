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
    condition: (c) => ['Провидец', 'Ученик Медика'].includes(c.status)
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
