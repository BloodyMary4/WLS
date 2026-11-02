/**
 * Аугметика — лорный каталог имплантов по расам (Warhammer 40,000).
 *
 * Механика: персонаж может получить имплант через событие/выбор
 * (ChoiceEffects.addAugmentic — строка = id из AUGMETIC_CATALOG) или через
 * микро-событие «полевой хирург». Эффекты установки описаны в самом импланте
 * (effects), а пассивные бонусы (passive) применяются один раз при установке.
 *
 * Лорные ограничения (isAugmeticAllowed):
 * - Человек: только стандартная имперская аугментика (Механикус). Слишком
 *   много металла в плоти — подозрение Инквизиции («достаточно ли ты человек»).
 * - Орк: гризник-технология — импланты ставятся «потому что круче», без цены.
 * - Эльдар: био-скульптурирование Хиерархии Ремёсел (живого металла не знают).
 * - Друкхаари: «украшения» Работорговцев и искусители Змеиного Лабиринта.
 * - Тау: био-улучшения Огненного каста и гормональная привязка к Этиридам.
 * - Гретчин: подержанные трофейные протезы орочьих гризников.
 */
import { CharacterStats, ChoiceEffects, Race } from './types';

export type AugmeticFaction = 'imperium' | 'ork' | 'eldar' | 'drukhari' | 'tau' | 'gretchin';

export interface Augmetic {
  id: string;
  name: string;
  /** Краткое лорное описание для UI */
  description: string;
  faction: AugmeticFaction;
  /** Минимальный возраст установки */
  minAge: number;
  /** Стоимость в кредитах (0 — бесплатно, напр. орочья «потому что круче») */
  price: number;
  /** Пассивный эффект: применяется один раз при установке */
  passive?: Pick<ChoiceEffects, 'luck' | 'influence'> & { maxHealthBonus?: number };
  /** Эффекты самой операции установки */
  effects: ChoiceEffects;
}

/** Human — Имперская аугментика Администратума и Магос-сервиторов */
const HUMAN_AUGMETICS: Augmetic[] = [
  {
    id: 'optin_mechanicus',
    name: 'Оптикин Сервитора',
    description: 'Черепной имплант Магос-сервитора: шум машин становится понятен.',
    faction: 'imperium',
    minAge: 18,
    price: 25,
    effects: { techSkill: 2, sanity: -3, suspicion: 1, description: 'Бур сверлит кость. Когда ты приходишь в себя, гул сервиторов звучит как молитва — и ты понимаешь её.' },
  },
  {
    id: 'augmetic_arm_mk3',
    name: 'Аугметическая рука Mk.III',
    description: 'Штампель AdMech: сервоприводы сильнее любого кулака.',
    faction: 'imperium',
    minAge: 16,
    price: 40,
    passive: { maxHealthBonus: 5 },
    effects: { strength: 2, health: -5, suspicion: 1, description: 'Вместо пальца — сервоклешня. Ты сжимаешь железный лист и он складывается, как бумага. Больно смотреть на это.' },
  },
  {
    id: 'carapace_implant',
    name: 'Панцирный имплант',
    description: 'Керамитовые пластины под кожей — подарок Арбитрес ветеранам.',
    faction: 'imperium',
    minAge: 20,
    price: 30,
    passive: { maxHealthBonus: 10 },
    effects: { health: -3, influence: 2, description: 'Хирург вскрывает грудь, как консервную банку, и укладывает внутрь керамит. Шрамы затвердеют в панцирь.' },
  },
  {
    id: 'black_carapace',
    name: 'Чёрный панцирь',
    description: 'Запретная броня инквизиторов-еретиков. Ищет того, кто её носит.',
    faction: 'imperium',
    minAge: 30,
    price: 70,
    passive: { maxHealthBonus: 15 },
    effects: { health: -8, warpAttention: 1, suspicion: 3, influence: 3, description: 'Трофей с поля ереси. Панцирь шепчет тебе имена мёртвых, но пули отскакивают от него, как горох.' },
  },
  {
    id: 'machine_god_blessing',
    name: 'Благословение Культа Машин',
    description: 'Ритуальное освящение плоти металлом — цена преданности Omnissiah.',
    faction: 'imperium',
    minAge: 25,
    price: 0,
    effects: { faith: 2, techSkill: 1, sanity: -2, description: 'Магос помазует твои шрамы священным мирром и вкручивает болт в плоть. «Бог-Машина милостив к металлу твоему».' },
  },
];

/** Ork — гризник-«аугметика»: потому что круче */
const ORK_AUGMETICS: Augmetic[] = [
  {
    id: 'choppa_hand',
    name: 'Рука-чоппа',
    description: 'Заточенная клёпаная длань вместо кисти. Гризник сказал: «держись крепче».',
    faction: 'ork',
    minAge: 10,
    price: 0,
    passive: { maxHealthBonus: 5 },
    effects: { strength: 2, health: -3, waaagh: 1, description: 'Гризник прибивает к культе чоппу гвоздями. «Держится! Не отваливается!» — и ты бьёшь ей первый попавшийся череп.' },
  },
  {
    // Лор: орки поклоняются двум богам — Горг (мелкий, хитрый, злобный) и Морк (огромный, глупый).
    // «Глаз Морка»: у Горга один маленький глаз, а у Морка — огромный единственный глаз,
    // который видит всё вокруг (и почти ничего не понимает).
    id: 'mork_eye',
    name: 'Глаз Морка',
    description: 'Огромный клёпаный глаз Морка — видит всю драку сразу. Горг бы так не смог.',
    faction: 'ork',
    minAge: 12,
    price: 0,
    passive: { luck: 1 },
    effects: { cunning: 1, sanity: -2, description: 'Гризник вставляет тебе глаз, который моргает сам по себе. Ты видишь всё сразу: и драку, и того, кто ударит в спину. Морк одобряет.' },
  },
  {
    id: 'bigteeth',
    name: 'Большие зубы',
    description: 'Клёпаные челюсти. Укусы ими считаются попаданием.',
    faction: 'ork',
    minAge: 8,
    price: 0,
    passive: undefined,
    effects: { strength: 1, cruelty: 1, health: -2, description: 'Ты скалишься новыми зубами — они звенят, как подковы. Первый же кусок брони показывает, кто тут хищник.' },
  },
];

/** Eldar — био-скульптурирование Хиерархии Ремёсел; живого металла аэльдари не знают */
const ELDAR_AUGMETICS: Augmetic[] = [
  {
    id: 'biosculpted_reflexes',
    name: 'Био-скульптура рефлексов',
    description: 'Хиерархия Ремёсел переписывает твоё тело, как песнь: быстрее, тоньше, точнее.',
    faction: 'eldar',
    minAge: 30,
    price: 0,
    passive: { maxHealthBonus: 8 },
    effects: { strength: 1, psi: 1, sanity: -3, description: 'Костоправ Расы поёт над тобой три дня. Кости становятся прочнее стали без капли металла. Ты чувствуешь битву до того, как она началась.' },
  },
  {
    id: 'spirit_stone_binding',
    name: 'Закрепление камня душ',
    description: 'Камень душ, вплетённый в нервы у основания черепа. Мёртвые шепчут через него.',
    faction: 'eldar',
    minAge: 40,
    price: 0,
    passive: { luck: 1 },
    effects: { psi: 2, warpAttention: 1, sanity: -4, description: 'Прорицатель вверяет тебе камень души предка. Он говорит с тобой сквозь кристалл. Некоторые из мёртвых не хотят замолкать.' },
  },
];

/** Drukhari — «украшения» Работорговцев и искусители из Змеиного Лабиринта */
const DARK_ELDAR_AUGMETICS: Augmetic[] = [
  {
    id: 'pain_engine',
    name: 'Двигатель боли',
    description: 'Узел Работорговца, превращающий страдание других в твою силу.',
    faction: 'drukhari',
    minAge: 30,
    price: 0,
    passive: undefined,
    effects: { cruelty: 2, warpAttention: 1, sanity: -3, strength: 1, description: 'Работорговец вшивает тебе узел, который пульсирует каждый раз, когда кто-то кричит рядом. Кричи громче.' },
  },
  {
    id: 'venom_glands',
    name: 'Ядовитые железы',
    description: 'Подкожные железы из Змеиного Лабиринта. Каждый твой укус — смерть.',
    faction: 'drukhari',
    minAge: 25,
    price: 0,
    passive: { luck: 1 },
    effects: { strength: 1, sneakiness: 1, health: -4, description: 'Твои слюни теперь убивают быстрее, чем клинок. Рабы на арене перестают смеяться.' },
  },
];

/** Tau — био-улучшения каст и прото-силовая броня */
const TAU_AUGMETICS: Augmetic[] = [
  {
    id: 'fire_caste_reflexes',
    name: 'Рефлексы Огненного каста',
    description: 'Био-усиление нервов Fire Caste: реакция быстрее выстрела.',
    faction: 'tau',
    minAge: 15,
    price: 0,
    passive: undefined,
    effects: { cunning: 2, unity: 1, description: 'Этиристы переписывают твои нервы. Пули кажутся медленными. Высшее Благо всегда быстрее противника.' },
  },
  {
    id: 'ethereal_bond',
    name: 'Узы Связи с Этиридами',
    description: 'Гормональный имплант веры: сомнение химически невозможно.',
    faction: 'tau',
    minAge: 20,
    price: 0,
    passive: { influence: 2 },
    effects: { unity: 2, sanity: -2, suspicion: 1, description: 'Когда этирист говорит, ты чувствуешь тепло в крови. Вера стала ферментом. Отступничество — болезнью.' },
  },
];

/** Gretchin — подержанные трофейные протезы */
const GRETCHIN_AUGMETICS: Augmetic[] = [
  {
    id: 'grot_prosthetic',
    name: 'Подержанный протез',
    description: 'Обломок орочьей техники, приделанный гризником. Работает. Наверное.',
    faction: 'gretchin',
    minAge: 8,
    price: 0,
    passive: { maxHealthBonus: 3 },
    effects: { strength: 1, health: -2, sneakiness: 1, description: 'Гризник привинчивает тебе руку от мёртвого орка. Она скрипит, но ею можно стукнуть сильнее.' },
  },
  {
    id: 'snotling_eye',
    name: 'Глаз снотлинга',
    description: 'Ночное зрение за счёт быстрой смены сетчатки. Голодной взгляд.',
    faction: 'gretchin',
    minAge: 10,
    price: 0,
    passive: undefined,
    effects: { cunning: 1, luck: 1, sanity: -1, description: 'Теперь ты видишь в темноте туннелей — и знаешь, кто там сидит раньше, чем они видят тебя.' },
  },
];

export const AUGMETIC_CATALOG: Record<AugmeticFaction, Augmetic[]> = {
  imperium: HUMAN_AUGMETICS,
  ork: ORK_AUGMETICS,
  eldar: ELDAR_AUGMETICS,
  drukhari: DARK_ELDAR_AUGMETICS,
  tau: TAU_AUGMETICS,
  gretchin: GRETCHIN_AUGMETICS,
};

const RACE_FACTION: Record<Race, AugmeticFaction> = {
  human: 'imperium',
  ork: 'ork',
  eldar: 'eldar',
  dark_eldar: 'drukhari',
  tau: 'tau',
  gretchin: 'gretchin',
};

export function getRaceFaction(race: Race): AugmeticFaction {
  return RACE_FACTION[race];
}

export function availableAugmetics(race: Race): Augmetic[] {
  return AUGMETIC_CATALOG[RACE_FACTION[race]] ?? [];
}

export function findAugmetic(id: string): Augmetic | null {
  for (const list of Object.values(AUGMETIC_CATALOG)) {
    const found = list.find(a => a.id === id);
    if (found) return found;
  }
  return null;
}

/** Лорная проверка: чей имплант и по возрасту ли */
export function isAugmeticAllowed(character: CharacterStats, aug: Augmetic): boolean {
  return aug.faction === RACE_FACTION[character.race] && character.age >= aug.minAge;
}

/** Сколько металла уже в плоти (для подозрения Инквизиции у людей) */
export const HUMAN_SUSPICION_PER_AUGMETIC = 1;
export const HUMAN_AUGMETIC_LIMIT_SUSPICION = 3;
