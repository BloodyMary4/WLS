import { describe, it, expect } from 'vitest';
import { checkQuests, applyQuestRewards, getAvailableQuests, createQuest, AVAILABLE_QUESTS, Quest } from '../game/questSystem';
import { checkAchievements, ACHIEVEMENTS } from '../game/achievements';
import { makeCharacter } from '../game/testHelpers';

function makeQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: 'q_test',
    name: 'Тестовый квест',
    description: 'opis',
    objectives: [{ id: 'o1', description: 'd', completed: false, type: 'stat', target: 'credits', targetValue: 100 }],
    rewards: { credits: 50 },
    completed: false,
    failed: false,
    startedAt: 0,
    ...overrides,
  };
}

describe('checkQuests', () => {
  it('квест завершается при выполнении всех целей', () => {
    const char = makeCharacter({ credits: 150 });
    const quest = makeQuest();
    const { updatedQuests, completedQuests } = checkQuests(char, [quest]);
    expect(completedQuests).toHaveLength(1);
    expect(updatedQuests[0].completed).toBe(true);
    expect(updatedQuests[0].objectives[0].completed).toBe(true);
  });

  it('цель не выполняется при недостатке стата', () => {
    const char = makeCharacter({ credits: 10 });
    const { completedQuests, updatedQuests } = checkQuests(char, [makeQuest()]);
    expect(completedQuests).toHaveLength(0);
    expect(updatedQuests[0].objectives[0].completed).toBe(false);
  });

  it('цель типа item проверяет инвентарь', () => {
    const char = makeCharacter({ inventory: ['Лазгун'] });
    const quest = makeQuest({
      objectives: [{ id: 'o1', description: 'd', completed: false, type: 'item', target: 'Лазгун' }],
    });
    expect(checkQuests(char, [quest]).completedQuests).toHaveLength(1);
  });

  it('цель типа npc проверяет по подстроке имени (без учёта регистра)', () => {
    const char = makeCharacter();
    char.npcs = [{ id: 'n1', name: 'Инквизитор Гримм', role: 'r', relationship: 0, met: true }];
    const quest = makeQuest({
      objectives: [{ id: 'o1', description: 'd', completed: false, type: 'npc', target: 'инквизитор' }],
    });
    expect(checkQuests(char, [quest]).completedQuests).toHaveLength(1);
  });

  it('завершённый квест остаётся завершённым', () => {
    const char = makeCharacter({ credits: 0 });
    const done = makeQuest({ completed: true });
    const { updatedQuests, completedQuests } = checkQuests(char, [done]);
    expect(updatedQuests[0].completed).toBe(true);
    expect(completedQuests).toHaveLength(0); // не переоткрыть
  });
});

describe('applyQuestRewards', () => {
  it('выдаёт credits и influence с клампом', () => {
    const char = makeCharacter({ credits: 10, influence: 95 });
    const r = applyQuestRewards(char, makeQuest({ rewards: { credits: 100, influence: 20 } }));
    expect(r.credits).toBe(110);
    expect(r.influence).toBe(100);
  });

  it('выдаёт уникальные трейты и предметы без дублей', () => {
    let char = makeCharacter({ traits: ['Ветеран'], inventory: ['Кредитный чип'] });
    char = applyQuestRewards(
      char,
      makeQuest({ rewards: { traits: ['Ветеран', 'Герой'], items: ['Кредитный чип', 'Меч'] } })
    );
    expect(char.traits).toEqual(['Ветеран', 'Герой']);
    expect(char.inventory).toEqual(['Кредитный чип', 'Меч']);
  });

  it('не мутирует исходного персонажа', () => {
    const char = makeCharacter({ credits: 10 });
    applyQuestRewards(char, makeQuest({ rewards: { credits: 100 } }));
    expect(char.credits).toBe(10);
  });
});

describe('getAvailableQuests / createQuest', () => {
  it('фильтрует уже активные квесты', () => {
    const active = createQuest(AVAILABLE_QUESTS[0], 5);
    const available = getAvailableQuests(makeCharacter(), [active]);
    expect(available.find(q => q.id === active.id)).toBeUndefined();
  });

  it('quest_survivor недоступен после 10 лет', () => {
    const old = getAvailableQuests(makeCharacter({ age: 15 }), []);
    expect(old.find(q => q.id === 'quest_survivor')).toBeUndefined();
    const young = getAvailableQuests(makeCharacter({ age: 5 }), []);
    expect(young.find(q => q.id === 'quest_survivor')).toBeDefined();
  });

  it('createQuest добавляет поля состояния', () => {
    const q = createQuest(AVAILABLE_QUESTS[1], 12);
    expect(q.completed).toBe(false);
    expect(q.failed).toBe(false);
    expect(q.startedAt).toBe(12);
  });
});

describe('checkAchievements', () => {
  it('ACHIEVEMENTS имеют уникальные id', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('не выдаёт уже разблокированные ачивки повторно', () => {
    const char = makeCharacter({ age: 60 });
    const first = checkAchievements(char, []);
    const second = checkAchievements(char, first);
    expect(second).toHaveLength(0);
  });

  it('детный персонаж не получает "долгожитель"-подобные ачивки', () => {
    const baby = makeCharacter({ age: 1, health: 100 });
    const unlocked = checkAchievements(baby, []);
    const longLived = ACHIEVEMENTS.filter(a => /survivor|long|age/i.test(a.id) && a.condition(makeCharacter({ age: 80 })));
    for (const a of longLived) {
      expect(unlocked).not.toContain(a.id);
    }
  });

  it('условия ачивок не падают на базовом персонаже', () => {
    const char = makeCharacter();
    expect(() => ACHIEVEMENTS.forEach(a => a.condition(char))).not.toThrow();
  });
});
