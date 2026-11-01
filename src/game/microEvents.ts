import { CharacterStats, ChoiceEffects } from './types';
import { rng } from './rng';
import { GAME_CONFIG } from './config';

export interface MicroEvent {
  text: string;
  probability: number;
  effects: ChoiceEffects;
  race?: string | string[];
}

export const MICRO_EVENTS: MicroEvent[] = [
  // Мрачные события в духе Warhammer 40,000
  {
    text: 'Ты находишь окровавленный труп с кошельком.',
    probability: 0.3,
    effects: { credits: 2, suspicion: 1, description: 'Ты берёшь деньги. Кровь ещё тёплая. В этом мире выживают те, кто не брезгует мертвыми.' }
  },
  {
    text: 'Патруль Арбитрес останавливает тебя для проверки.',
    probability: 0.2,
    effects: { suspicion: 2, description: 'Их взгляды тяжелы, как приговор. Ты чувствуешь, как они оценивают, стоит ли ты жизни.' }
  },
  {
    text: 'Ты видишь публичную казнь еретика.',
    probability: 0.15,
    effects: { faith: 1, willpower: 1, description: 'Пламя пожирает его плоть, но не душу. Толпа ликует. Ты чувствуешь... страх? Или восхищение?' }
  },
  {
    text: 'Крыса пробегает по твоей ноге в тёмном переулке.',
    probability: 0.1,
    effects: { health: -1, description: 'Её зубы оставляют след. Инфекция... в этом мире это приговор.' }
  },
  {
    text: 'Ты слышишь шёпот в стенах.',
    probability: 0.25,
    effects: { warpAttention: 1, description: 'Голоса... они зовут тебя. Или это просто ветер? В Варпе нет случайностей.' }
  },
  {
    text: 'Ты находишь запрещённый гримуар.',
    probability: 0.1,
    effects: { cunning: 2, warpCorruption: 3, addItem: 'Запретный гримуар', description: 'Страницы шепчут на мёртвых языках. Знание... и проклятие.' }
  },
  {
    text: 'Инквизитор задаёт тебе вопросы о соседях.',
    probability: 0.15,
    effects: { suspicion: 2, faith: 1, description: 'Его глаза - как бездны. Ты отвечаешь... но знаешь, что один неверный ответ - и ты следующий.' }
  },
  {
    text: 'Ты видишь мутанта, прячущегося в тени.',
    probability: 0.1,
    effects: { faith: 1, suspicion: 1, description: 'Его тело - искажённое, чужое. Долг велит донести. Но его глаза... полны такой человеческой боли.' }
  },
  {
    text: 'Культист предлагает тебе "истинное знание".',
    probability: 0.08,
    effects: { warpCorruption: 5, suspicion: 3, description: 'Его слова сладки, как яд. Ты отказываешься... или нет? Варп ждёт.' }
  },
  {
    text: 'Ты находишь раненого солдата Имперской Гвардии.',
    probability: 0.2,
    effects: { faith: 2, health: -2, description: 'Он шепчет молитвы. Ты помогаешь... или добиваешь? В этом мире милосердие - роскошь.' }
  },
  // События для людей
  {
    text: 'Ты молишься в соборе Святого Креста.',
    probability: 0.3,
    effects: { faith: 2, imperium: 1, description: 'Литании наполняют воздух. Ты чувствуешь... присутствие? Или это просто эхо?' }
  },
  {
    text: 'Техножрец осматривает твоё оборудование.',
    probability: 0.15,
    effects: { techSkill: 1, credits: -5, description: 'Его механические глаза сканируют каждую деталь. "Оно не соответствует спецификациям." Штраф.' }
  },
  {
    text: 'Ты становишься свидетелем экстерминатуса соседней планеты.',
    probability: 0.05,
    effects: { willpower: 2, faith: 1, description: 'Целый мир... стёрт. Миллиарды жизней. Во имя Императора. Ты чувствуешь... ужас? Или одобрение?' }
  },
  // События для орков
  {
    text: 'Ты находишь гигантского скуига.',
    probability: 0.2,
    effects: { strength: 2, waaagh: 2, description: 'Он огромен! Ты оседлал его! WAAAGH! Теперь ты ещё страшнее!' }
  },
  {
    text: 'Ты участвуешь в кровавом турнире.',
    probability: 0.15,
    effects: { strength: 3, health: -8, waaagh: 3, description: 'Ты дерёшься до последней крови. Побеждаешь! Или почти... WAAAGH!' }
  },
  {
    text: 'Ты ешь что-то подозрительное.',
    probability: 0.3,
    effects: { health: -3, strength: 1, description: 'Живот крутит... но ты стал сильнее! Орский желудок всё переварит!' }
  },
  // События для эльдар
  {
    text: 'Ты чувствуешь присутствие Слаанеш.',
    probability: 0.1,
    effects: { warpCorruption: 3, psi: 1, description: 'Шёпот... обещания... экстаз. Ты отступаешь... но часть тебя хочет большего.' }
  },
  {
    text: 'Ты создаёшь произведение искусства из чистого псай-энергии.',
    probability: 0.2,
    effects: { psi: 2, nobility: 2, description: 'Красота... хрупкая, как память. Она переживёт тебя на тысячелетия.' }
  },
  {
    text: 'Древний эльдар делится воспоминаниями о Падении.',
    probability: 0.15,
    effects: { willpower: 2, psi: 1, description: 'Боль тысячелетий... ты чувствуешь её. И понимаешь, почему вы должны выжить.' }
  },
  // События для тёмных эльдар
  {
    text: 'Ты организуешь великое представление боли.',
    probability: 0.2,
    effects: { cruelty: 3, health: 3, description: 'Крики... музыка для ушей Друкхаари. ГОЛОД утихает... но ненадолго.' }
  },
  {
    text: 'Ты находишь раба с редкой способностью.',
    probability: 0.15,
    effects: { cunning: 2, credits: 10, description: 'Его боль... экзотична. Ты знаешь, как её использовать.' }
  },
  {
    text: 'Архонт бросает тебе вызов.',
    probability: 0.1,
    effects: { strength: 2, cruelty: 2, health: -5, description: 'Ты принимаешь вызов. Побеждаешь... или почти. В Коммаготе нет вторых мест.' }
  },
  // События для тау
  {
    text: 'Ты участвуешь в ритуале Высшего Блага.',
    probability: 0.3,
    effects: { unity: 2, faith: 1, description: 'Все касты вместе. Эфирные ведут церемонию. Ты чувствуешь... цель.' }
  },
  {
    text: 'Ты тестируешь новое оружие на пленниках.',
    probability: 0.15,
    effects: { techSkill: 2, unity: -1, description: 'Оно работает... эффективно. Но что-то внутри протестует. Или это слабость?' }
  },
  {
    text: 'Ты встречаешь человека, который хочет присоединиться к Тау.',
    probability: 0.2,
    effects: { cunning: 1, unity: 1, description: 'Его глаза полны надежды. Ты видишь в нём... потенциал. Или угрозу?' }
  },
  // События для гретчинов
  {
    text: 'Ты прячешься от орка, который ищет рабов.',
    probability: 0.35,
    effects: { sneakiness: 2, description: 'Ты становишься тенью. Орк проходит мимо... но в следующий раз повезёт?' }
  },
  {
    text: 'Ты крадёшь оружие у орка.',
    probability: 0.2,
    effects: { sneakiness: 2, addItem: 'Украденный бластер', description: 'Тихо. Быстро. Оружие теперь твоё. Но орки ищут вора...' }
  },
  {
    text: 'Ты находишь другого гретчина, который хочет сбежать.',
    probability: 0.15,
    effects: { unity: 2, willpower: 1, description: 'Вместе... есть шанс. Или безумие? Но лучше безумие, чем рабство.' }
  },
  // Позорные механики: поражение в бою / поимка (кто побеждает — получает эффект на стороне)
  {
    race: ['human', 'eldar', 'dark_eldar', 'tau'],
    text: 'Ты проигрываешь поединок — противник валит тебя в грязь и отбирает всё ценное.',
    probability: 0.05,
    effects: { credits: -8, health: -6, suspicion: 1, description: 'Позор. Ты поднимаешься, сплёвывая кровью. Долг чести придётся возвращать.' }
  },
  {
    race: 'ork',
    text: 'Босс побил тебя перед всей бандой — орки ревут, топая ногами. Обидно до скрежета зубов.',
    probability: 0.08,
    effects: { waaagh: -2, health: -5, strength: 1, description: 'Больно! Но злость — хорошее топливо. В следующий раз башка треснет первой.' }
  },
  {
    race: 'gretchin',
    text: 'Тебя поймали на краже. Орк подбрасывает тебя вверх и ловит за шкирку.',
    probability: 0.1,
    effects: { health: -4, sneakiness: 1, food: -2, description: 'Почти прикончил... но ты выжил. Завтра украдёшь ещё хитрее.' }
  },
  {
    race: 'dark_eldar',
    text: 'Тебя настиг Ковчег Инцизаров — твой план провалился, жертва ускользнула.',
    probability: 0.06,
    effects: { cruelty: -1, sanity: -3, suspicion: 2, description: 'ГОЛОД не утолен. В Коммаготе неудачников ждёт участь рабов. Беги, пока можешь.' }
  },
  // Глобальные события в духе Вечной Ереси — отношения с сословиями и фракциями
  {
    text: 'Слухи о вторжении флота Хаоса сеют панику в улье.',
    probability: 0.08,
    effects: { sanity: -3, suspicion: 1, commoners: -2, nobilityRel: -1, description: 'Толпа кричит, лорды запирают двери. Каждый ждёт, что следующим пойдёт на заклание он.' }
  },
  {
    text: 'Гильдия торговцев повышает цены на питание для бедных секторов.',
    probability: 0.1,
    effects: { food: -2, commoners: -3, nobilityRel: 1, description: 'Простолины голодают, аристократия удовлетворённо кивает. Порядок сохранён ценой тысяч жизней.' }
  },
  {
    text: 'Планетарный губернатор объявляет день благодарения Императору.',
    probability: 0.08,
    effects: { faith: 1, commoners: 2, nobilityRel: 1, imperium: 1, description: 'Милости сверху, ликование снизу. Хотя бы один год все делают вид, что живут нормально.' }
  },
  {
    text: 'Ксено-артефакт всплывает на чёрном рынке.',
    probability: 0.06,
    effects: { credits: 3, xenos: 1, criminals: 1, suspicion: 1, description: 'Кто-то платит золотом за ересь. Имя покупателя не называется. Цена ошибки — экстерминатус.' }
  },
];

/**
 * Кулдаун микро-событий: событие может сработать не чаще,
 * чем раз в COOLDOWN_YEARS лет (см. GAME_CONFIG.MICRO_EVENTS).
 */
export function canTriggerMicroEvent(character: CharacterStats): boolean {
  return (character.microEventCooldown ?? 0) <= 0;
}

/**
 * Расово-нейтральные «вкрапления» Империи — срабатывают у всех рас,
 * если персонаж живёт в пределах Империума человека (люди, гретчины,
 * а также орки/эльдар/тау на оккупированных/торговых мирах).
 */
const IMPERIUM_FLAVOR_RACES: string[] = ['human', 'gretchin'];

export interface MicroEventResult {
  event: MicroEvent;
  triggered: boolean;
  /** Значение microEventCooldown на следующий год */
  nextCooldown: number;
}

/**
 * Выбор следующего микро-события. Детерминирован по seed партии:
 * события выбираются через rng().weighted по вероятности — это даёт
 * естественную вариативность вместо «первое подходящее всегда».
 * MAX_PER_YEAR учитывается вызывающей стороной (reducer может звать
 * функцию повторно в пределах года, пока cooldown позволяет).
 */
export function pickMicroEvent(character: CharacterStats): MicroEvent | null {
  const inImperium = IMPERIUM_FLAVOR_RACES.includes(character.race) ||
    (character.planetType ?? '').includes('Улей') ||
    (character.planetType ?? '').includes('Мир-крепость');

  const availableEvents = MICRO_EVENTS.filter(event => {
    if (event.race) {
      if (Array.isArray(event.race)) return event.race.includes(character.race);
      return event.race === character.race;
    }
    // События без race-фильтра доступны всем, но имперские «сплетни»
    // не должны сыпаться на тау с родного мира.
    if (!inImperium && (event.effects.imperium !== undefined || event.effects.faith !== undefined)) {
      return false;
    }
    return true;
  });

  if (availableEvents.length === 0) return null;
  return rng().weighted(availableEvents, e => e.probability);
}

export function triggerMicroEvent(character: CharacterStats): MicroEventResult {
  const prevCooldown = Math.max(0, (character.microEventCooldown ?? 0) - 1);

  if (prevCooldown > 0) {
    return { event: MICRO_EVENTS[0], triggered: false, nextCooldown: prevCooldown };
  }

  const picked = pickMicroEvent(character);
  if (picked && rng().next() < picked.probability * 2) {
    return { event: picked, triggered: true, nextCooldown: GAME_CONFIG.MICRO_EVENTS.COOLDOWN_YEARS };
  }

  return { event: picked ?? MICRO_EVENTS[0], triggered: false, nextCooldown: 0 };
}
