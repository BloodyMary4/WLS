import { CharacterStats, GameEvent } from '../types';

/**
 * Лорная ветвка «Служба Инквизиции» (v0.3.6).
 * Открывается человеком с ключевым выбором `found_artifact`, который позже
 * передал артефакт Инквизиции (`keyChoice: 'inquisition_contact'`).
 * Тексты используют формат 'Возраст N. ...' — совместим с фильтрацией летописи.
 */

export function getInquisitionBranchEvent(age: number, c: CharacterStats): GameEvent | null {
  // Шаг 3: ересь внутри — испытание лояльности
  if (age >= 45 && c.keyChoices.includes('inquisition_heresity')) {
    return {
      text: 'Возраст ' + age + '. В подвалах крепости-архива ты ведёшь допрос: твой бывший наставник обвинён в ереси. Он смотрит на тебя спокойно. "Я учил тебя сомневаться, — шепчет он. — Сомневайся сейчас."',
      choices: [
        { letter: '1', text: 'Провести обряд очищения лично', effects: { faith: 4, willpower: -2, suspicion: -2, keyChoice: 'inquisition_heresity', description: 'Костёр вспыхивает синим. Наставник не кричит. Ты не забудешь его глаза. Инквизитор кивает: "Теперь ты один из нас."' } },
        { letter: '2', text: 'Помочь ему бежать — предать Ордо', effects: { cunning: 4, faith: -3, suspicion: 5, newStatus: 'Беглец Инквизиции', keyChoice: 'inquisition_heresity', description: 'Ты оставляешь дверь открытой. Наутро — пустая камера и твоя исчезнувшая карьера. За тобой начата охота.' } },
        { letter: '3', text: 'Отказаться от дела и потребовать суда', effects: { willpower: 3, suspicion: 1, description: 'Ты требуешь формального суда. Коллеги переглядываются. Дело затягивается — а ересь тем временем пустила корни.' } },
        { letter: '4', text: 'Выведать у него тайны перед приговором', effects: { cunning: 3, psi: 2, mutation: 1, suspicion: 2, description: 'Ночь напролёт — вопросы без протокола. Он рассказывает такое, что ты перестанешь спать неделями.' } },
      ]
    };
  }

  // Шаг 2: первое задание — расстановка приоритетов
  if (age >= 35 && c.keyChoices.includes('inquisition_first_case')) {
    return {
      text: 'Возраст ' + age + '. Твоё первое самостоятельное дело: планета-улей просит помощи. Три версии — еретическая секта, скрытый генокрад или просто бунт из-за голода. Ресурсов хватает на одну операцию.',
      choices: [
        { letter: '1', text: 'Начать с секты — вера важнее всего', effects: { faith: 3, suspicion: -1, keyChoice: 'inquisition_first_case', description: 'Секта выжжена дотла. Голод на улье никто не отменил — но Ересь Молчания довольна.' } },
        { letter: '2', text: 'Искать генокрада — угроза должна быть доказана', effects: { cunning: 3, willpower: 1, keyChoice: 'inquisition_first_case', description: 'Недели анализа. Генокрада нет — был голод. Ты узнал это раньше всех, и это знание дороже улики.' } },
        { letter: '3', text: 'Доставить продовольствие сначала', effects: { influence: 2, faith: -1, keyChoice: 'inquisition_first_case', description: 'Улей накормлен, бунт угас. Начальство недовольно "мягкотелостью" — но планета лояльна.' } },
        { letter: '4', text: 'Оставить малый отряд, уйти самому', effects: { techSkill: 2, suspicion: 2, keyChoice: 'inquisition_first_case', description: 'Ты забираешь архивы и уходишь. Отряд гибнет. Протокол умалчивает о причине.' } },
      ]
    };
  }

  // Шаг 1: вербовка после контакта с Инквизицией
  if (age >= 25 && c.keyChoices.includes('inquisition_contact')) {
    return {
      text: 'Возраст ' + age + '. Человек в сером плаще ждёт тебя у жилища. "Тот предмет в детстве, — говорит он. — Ты поступил правильно. Мы наблюдаем за правильными." Он протягивает жетон с двуглавым орлом.',
      choices: [
        { letter: '1', text: 'Принять жетон — служить Императору в тени', effects: { willpower: 2, cunning: 2, suspicion: 1, newStatus: 'Адепт Ордо', keyChoice: 'inquisition_first_case', description: 'Жетон холодный и тяжелее, чем кажется. "Завтра начинается твоя настоящая жизнь."' } },
        { letter: '2', text: 'Принять, но задать вопрос: что было в предмете?', effects: { cunning: 3, faith: 1, keyChoice: 'inquisition_first_case', description: 'Инквизитор впервые улыбается. "Хороший вопрос. Плохой ответ. Именно поэтому ты нам нужен."' } },
        { letter: '3', text: 'Отказаться — обычная жизнь спокойнее', effects: { faith: 2, willpower: 1, description: 'Серый плащ разворачивается. "Запомни этот день. Мы вернёмся к правильным."' } },
        { letter: '4', text: 'Выкупить артефакт назад — он твой', effects: { cunning: 2, credits: -20, addItem: 'Загадочный артефакт', suspicion: 1, keyChoice: 'inquisition_first_case', description: 'Инквизитор возвращает предмет за «символически малую» сумму. "Он выбирал вас обоих." Артефакт снова шепчет по ночам.' } },
      ]
    };
  }

  return null;
}
