import { describe, it, expect } from 'vitest';
import { checkQuests, applyQuestRewards, getAvailableQuests, createQuest, pickNextQuest, resolveNumericTarget, isObjectiveSatisfied, AVAILABLE_QUESTS, Quest } from '../game/questSystem';
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

describe('единый решатель целей (без хардкода фракций)', () => {
  it('цель по chaos выполняется при достаточных отношениях с Хаосом', () => {
    const char = makeCharacter();
    char.factionRelations.chaos = 12;
    const quest = makeQuest({ objectives: [{ id: 'o', description: 'd', completed: false, type: 'stat', target: 'chaos', targetValue: 10 }] });
    expect(checkQuests(char, [quest]).completedQuests).toHaveLength(1);
  });

  it('цель maxImperium достигается при значениях НИЖЕ порога (путь еретика)', () => {
    const char = makeCharacter();
    char.factionRelations.imperium = -15;
    expect(isObjectiveSatisfied(char, 'maxImperium', -10)).toBe(true);
    char.factionRelations.imperium = 0;
    expect(isObjectiveSatisfied(char, 'maxImperium', -10)).toBe(false);
  });

  it('resolveNumericTarget видит скрытые параметры и Верность Императору', () => {
    const char = makeCharacter({ imperialCreed: 7 });
    expect(resolveNumericTarget(char, 'imperialCreed')).toBe(7);
    expect(resolveNumericTarget(char, 'psi')).toBe(0); // hiddenParams.psi из фабрики = 0
    expect(resolveNumericTarget(char, 'nonexistent_stat')).toBeUndefined();
  });

  it('все цели шаблонов разрешаются в числа (защита от опечаток в данных)', () => {
    const char = makeCharacter();
    for (const quest of AVAILABLE_QUESTS) {
      for (const obj of quest.objectives) {
        if (obj.type !== 'stat') continue;
        const rest = obj.target.startsWith('max') ? obj.target.slice(3) : '';
        const t = obj.target.startsWith('max') ? rest[0].toLowerCase() + rest.slice(1) : obj.target;
        expect(resolveNumericTarget(char, t), `${quest.id}/${obj.id}:${obj.target}`).toBeTypeOf('number');
      }
    }
  });
});

describe('требования квестов в шаблонах (без хардкода id)', () => {
  it('quest_survivor скрыт через requirements.maxAge после 10 лет', () => {
    const tpl = AVAILABLE_QUESTS.find(q => q.id === 'quest_survivor');
    expect(tpl?.requirements?.maxAge).toBe(10);
  });

  it('квесты Инквизиции и веры не предлагают не-людям', () => {
    const orc = makeCharacter({ race: 'ork' });
    const ids = getAvailableQuests(orc, []).map(q => q.id);
    expect(ids).not.toContain('quest_inquisitor');
    expect(ids).not.toContain('quest_believer');
    expect(ids).not.toContain('quest_warrior');
    // но общие доступны
    expect(ids).toContain('quest_rich');
  });

  it('человек видит расово-подходящие квесты', () => {
    const human = makeCharacter({ race: 'human', age: 5 });
    const ids = getAvailableQuests(human, []).map(q => q.id);
    expect(ids).toContain('quest_inquisitor');
    expect(ids).toContain('quest_survivor');
  });

  it('орк получает квест WAAAGH! вместо имперских', () => {
    const orc = makeCharacter({ race: 'ork', age: 5 });
    const ids = getAvailableQuests(orc, []).map(q => q.id);
    expect(ids).toContain('quest_waaagh');
  });
});

describe('pickNextQuest — детерминированный выбор', () => {
  it('детерминирован при одинаковых входе', () => {
    const avail = getAvailableQuests(makeCharacter({ age: 5 }), []);
    const a = pickNextQuest(avail, 42, 5);
    const b = pickNextQuest(avail, 42, 5);
    expect(a?.id).toBe(b?.id);
  });

  it('разные seedOffset дают разные квесты', () => {
    const avail = getAvailableQuests(makeCharacter({ age: 5 }), []);
    const picks = new Set([0, 1, 2, 3].map(off => pickNextQuest(avail, off, 5)?.id));
    expect(picks.size).toBeGreaterThan(1);
  });

  it('пустой список возвращает undefined', () => {
    expect(pickNextQuest([], 0, 5)).toBeUndefined();
  });
});

describe('расширенные награды квестов', () => {
  it('вера в награде повышает imperialCreed у людей и faith-связь у всех', () => {
    const human = makeCharacter({ race: 'human', imperialCreed: 3 });
    const r = applyQuestRewards(human, makeQuest({ rewards: { faith: 2 } }));
    expect(r.imperialCreed).toBe(5);
    expect(r.factionRelations.faith).toBe(20);

    const eldar = makeCharacter({ race: 'eldar' });
    const r2 = applyQuestRewards(eldar, makeQuest({ rewards: { faith: 2 } }));
    expect(r2.imperialCreed ?? 0).toBe(0);
    expect(r2.factionRelations.faith).toBe(20);
  });

  it('hiddenParams в наградах клампится в [0..10]', () => {
    const char = makeCharacter();
    const r = applyQuestRewards(char, makeQuest({ rewards: { hiddenParams: { psi: 99 } } }));
    expect(r.hiddenParams.psi).toBe(10);
  });

  it('imperialCreed не превышает 10', () => {
    const char = makeCharacter({ race: 'human', imperialCreed: 9 });
    const r = applyQuestRewards(char, makeQuest({ rewards: { faith: 5 } }));
    expect(r.imperialCreed).toBe(10);
  });
});
