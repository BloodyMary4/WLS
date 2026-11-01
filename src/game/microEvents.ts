import { CharacterStats, ChoiceEffects } from './types';
import { rng } from './rng';

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
];

export function triggerMicroEvent(character: CharacterStats): { event: MicroEvent; triggered: boolean } {
  const availableEvents = MICRO_EVENTS.filter(event => {
    if (!event.race) return true;
    if (Array.isArray(event.race)) return event.race.includes(character.race);
    return event.race === character.race;
  });
  
  for (const event of availableEvents) {
    if (rng().next() < event.probability) {
      return { event, triggered: true };
    }
  }
  
  return { event: availableEvents[0], triggered: false };
}
