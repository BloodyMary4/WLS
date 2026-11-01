import { CharacterStats, GameEvent, Race } from './types';
import { 
  getHumanEvent, 
  getOrkEvent, 
  getEldarEvent, 
  getDarkEldarEvent, 
  getTauEvent, 
  getGretchinEvent 
} from './events';
import { generateWorldEvent } from './utils';

// ============ ПЛАНЕТЫ ПО РАСАМ ============

interface PlanetData {
  name: string;
  type: string;
  race: Race;
}

const HUMAN_PLANETS: PlanetData[] = [
  { name: 'Кадия', type: 'Мир-крепость', race: 'human' },
  { name: 'Хив', type: 'Улей-мир', race: 'human' },
  { name: 'Мориа', type: 'Рудный мир', race: 'human' },
  { name: 'Катачан', type: 'Мир джунглей', race: 'human' },
  { name: 'Армагеддон', type: 'Промышленный мир', race: 'human' },
  { name: 'Медленг', type: 'Улей-мир', race: 'human' },
  { name: 'Голготх', type: 'Тюрьма-мир', race: 'human' },
  { name: 'Тартарус Прайм', type: 'Мир-ферма', race: 'human' },
];

const ORK_PLANETS: PlanetData[] = [
  { name: 'Морской Дьявол', type: 'Мир-Флот орков', race: 'ork' },
  { name: 'Горбань Гора', type: 'Племенная территория', race: 'ork' },
  { name: 'Кровавый Кулак', type: 'Корабль-Мир орков', race: 'ork' },
  { name: 'Разрушитель', type: 'Захваченный мир', race: 'ork' },
];

const ELDAR_PLANETS: PlanetData[] = [
  { name: 'Ультвэ (Миро-Корабль)', type: 'Миро-Корабль', race: 'eldar' },
  { name: 'Бьель-Тан', type: 'Миро-Корабль', race: 'eldar' },
  { name: 'Сайм-Хан', type: 'Миро-Корабль', race: 'eldar' },
  { name: 'Ийанден', type: 'Миро-Корабль', race: 'eldar' },
];

const DARK_ELDAR_PLANETS: PlanetData[] = [
  { name: 'Коммагот', type: 'Город-мир Друкхаари', race: 'dark_eldar' },
  { name: 'Кабал Талаос', type: 'Корабль-Кабал', race: 'dark_eldar' },
  { name: 'Дворец Страд', type: 'Ковчег Мандрагоры', race: 'dark_eldar' },
];

const TAU_PLANETS: PlanetData[] = [
  { name: 'Тау (Мир-Улей)', type: 'Столичный мир Тау', race: 'tau' },
  { name: 'Вел\'н', type: 'Колония Тау', race: 'tau' },
  { name: 'Дл\'неч', type: 'Мир-кузница Тау', race: 'tau' },
  { name: 'Т\'олку', type: 'Аграрный мир Тау', race: 'tau' },
];

const GRETCHIN_PLANETS: PlanetData[] = [
  { name: 'Лагерь Красного Глаза', type: 'Рабочий лагерь орков', race: 'gretchin' },
  { name: 'Рудники Горбана', type: 'Шахты гретчинов', race: 'gretchin' },
  { name: 'Свалка Босса Гругра', type: 'Мусорная территория', race: 'gretchin' },
];

// ============ ИМЕНА ПО РАСАМ ============

const HUMAN_MALE_NAMES = ['Кайус', 'Варек', 'Доминус', 'Титус', 'Гай', 'Кассиан', 'Ремус', 'Валерий', 'Деклан', 'Морвен', 'Корвус', 'Брант', 'Себастиан', 'Виктор', 'Август'];
const HUMAN_FEMALE_NAMES = ['Селестин', 'Валерия', 'Морвана', 'Лилит', 'Аврелия', 'Катарина', 'Изабель', 'Ровена', 'Веста', 'Элира', 'Сибилла', 'Доминика', 'Астра', 'Рейна', 'Октавия'];

const ORK_NAMES = ['Грукгаш', 'Кроогар', 'Зог', 'Угрук', 'Могдур', 'Снаггат', 'Бладгрин', 'Краз', 'Трактус', 'Варбосс Грым', 'Наздред', 'Хрудр', 'Башкалом', 'Горкус', 'Риппер'];

const ELDAR_MALE_NAMES = ['Дженай', 'Мача', 'Эльдра', 'Тандр', 'Лиэлен', 'Фаэон', 'Каэлен', 'Риэль', 'Ариэль', 'Солан'];
const ELDAR_FEMALE_NAMES = ['Джайра', 'Элен', 'Тиани', 'Мираэль', 'Вэйн', 'Иллиан', 'Саэли', 'Фаэла', 'Нимриэль', 'Аэрис'];

const DARK_ELDAR_MALE_NAMES = ['Врайт', 'Крул', 'Зинкар', 'Хаэмонкулус', 'Драхир', 'Маладор', 'Скир\'ра', 'Век\'тани', 'Рейзор', 'Нок\'тил'];
const DARK_ELDAR_FEMALE_NAMES = ['Суккуба Нирея', 'Врэй', 'Кризаэлис', 'Малис', 'Шай\'рен', 'Токсис', 'Вен\'дра', 'Лилит\'ра', 'Нок\'турна', 'Шэдоу'];

const TAU_NAMES_EARTH = ['Ш\'о\'рес', 'Ш\'кай', 'Ш\'вас', 'Ш\'дор', 'Ш\'мун', 'Ш\'кор', 'Ш\'вас', 'Ш\'тен'];
const TAU_NAMES_FIRE = ['Ш\'аса', 'Ш\'мон\'ти', 'Ш\'весо', 'Ш\'орел', 'Ш\'васу', 'Ш\'кайре'];
const TAU_NAMES_AIR = ['Ш\'ор\'вас', 'Ш\'кай\'лун', 'Ш\'вэо', 'Ш\'дэли'];
const TAU_NAMES_WATER = ['Ш\'уй\'тау', 'Ш\'вас\'ри', 'Ш\'дэ\'нел'];
const TAU_NAMES_ETHEREAL = ['Ау\'н\'эл', 'Ау\'н\'ва', 'Ау\'н\'ши', 'Ау\'н\'ра'];

const GRETCHIN_NAMES = ['Снивик', 'Гринки', 'Снэгл', 'Прок', 'Вимпл', 'Нагг', 'Скрич', 'Флип', 'Блинк', 'Сквит', 'Низзл', 'Дрип'];

// ============ СОСЛОВИЯ ПО РАСАМ ============

interface CasteData {
  name: string;
  startCredits: number;
  race: Race;
}

const HUMAN_CASTES: CasteData[] = [
  { name: 'Раб-шахтёр', startCredits: 0, race: 'human' },
  { name: 'Уль-обитатель', startCredits: 0, race: 'human' },
  { name: 'Сын рабочих', startCredits: 5, race: 'human' },
  { name: 'Беспризорник', startCredits: 0, race: 'human' },
  { name: 'Отброс', startCredits: 0, race: 'human' },
  { name: 'Дитя культа', startCredits: 0, race: 'human' },
  { name: 'Ребёнок солдат', startCredits: 10, race: 'human' },
  { name: 'Мутант-скрытник', startCredits: 0, race: 'human' },
  { name: 'Сын паломников', startCredits: 2, race: 'human' },
  { name: 'Крепостной', startCredits: 3, race: 'human' },
];

const ORK_CASTES: CasteData[] = [
  { name: 'Бой (рядовой воин)', startCredits: 0, race: 'ork' },
  { name: 'Отпрыск вождя', startCredits: 0, race: 'ork' },
  { name: 'Малыш-рант', startCredits: 0, race: 'ork' },
  { name: 'Ученик Мегабосса', startCredits: 0, race: 'ork' },
  { name: 'Питомец Медика', startCredits: 0, race: 'ork' },
];

const ELDAR_CASTES: CasteData[] = [
  { name: 'Отрок Миро-Корабля', startCredits: 0, race: 'eldar' },
  { name: 'Дитя Банд', startCredits: 0, race: 'eldar' },
  { name: 'Наследник Феникса', startCredits: 5, race: 'eldar' },
  { name: 'Юный Провидец', startCredits: 0, race: 'eldar' },
  { name: 'Отрок-изгой', startCredits: 0, race: 'eldar' },
];

const DARK_ELDAR_CASTES: CasteData[] = [
  { name: 'Дитя Кабала', startCredits: 0, race: 'dark_eldar' },
  { name: 'Отпрыск Архонта', startCredits: 10, race: 'dark_eldar' },
  { name: 'Юный Хаэмонкул', startCredits: 5, race: 'dark_eldar' },
  { name: 'Раблинг', startCredits: 0, race: 'dark_eldar' },
  { name: 'Дитя Суккубы', startCredits: 0, race: 'dark_eldar' },
];

const TAU_CASTES: CasteData[] = [
  { name: 'Огненная каста', startCredits: 5, race: 'tau' },
  { name: 'Водная каста', startCredits: 8, race: 'tau' },
  { name: 'Воздушная каста', startCredits: 5, race: 'tau' },
  { name: 'Земляная каста', startCredits: 3, race: 'tau' },
  { name: 'Эфирная каста', startCredits: 10, race: 'tau' },
];

const GRETCHIN_CASTES: CasteData[] = [
  { name: 'Раб-шахтёр', startCredits: 0, race: 'gretchin' },
  { name: 'Питомец орка', startCredits: 0, race: 'gretchin' },
  { name: 'Повар бойз', startCredits: 0, race: 'gretchin' },
  { name: 'Мусорщик', startCredits: 0, race: 'gretchin' },
  { name: 'Бунтарь-визионер', startCredits: 0, race: 'gretchin' },
];

// ============ РАСОВАЯ ИНФОРМАЦИЯ ============

export const RACE_INFO: Record<Race, { name: string; emoji: string; description: string }> = {
  human: { name: 'Человек', emoji: '👤', description: 'Империум Человечества — бесконечная машина войны и веры' },
  ork: { name: 'Орк', emoji: '💚', description: 'Зелёные воители — живут ради драки и WAAAGH!' },
  eldar: { name: 'Эльдар', emoji: '✨', description: 'Древняя угасающая раса — психокинетические потомки звёзд' },
  dark_eldar: { name: 'Друкхаари', emoji: '🦇', description: 'Тёмные эльдар — садисты Коммагота, питающиеся болью' },
  tau: { name: 'Тау', emoji: '🔷', description: 'Молодая раса — философия Высшего Блага и технологический прогресс' },
  gretchin: { name: 'Гретчин', emoji: '🐀', description: 'Маленькие рабы орков — униженные, но хитрые' },
};

// ============ ГЛАВНЫЙ МАРШРУТИЗАТОР ============

export function getEventForAge(age: number, character: CharacterStats): GameEvent {
  switch (character.race) {
    case 'human': return getHumanEvent(age, character);
    case 'ork': return getOrkEvent(age, character);
    case 'eldar': return getEldarEvent(age, character);
    case 'dark_eldar': return getDarkEldarEvent(age, character);
    case 'tau': return getTauEvent(age, character);
    case 'gretchin': return getGretchinEvent(age, character);
    default: return getHumanEvent(age, character);
  }
}

// ============ ГЕНЕРАЦИЯ ПЕРСОНАЖА ============

export function generateCharacter(): CharacterStats {
  const raceRoll = Math.random();
  let race: Race;
  if (raceRoll < 0.50) race = 'human';
  else if (raceRoll < 0.65) race = 'ork';
  else if (raceRoll < 0.78) race = 'eldar';
  else if (raceRoll < 0.88) race = 'dark_eldar';
  else if (raceRoll < 0.95) race = 'tau';
  else race = 'gretchin';

  return generateCharacterByRace(race);
}

export function generateCharacterByRace(race: Race): CharacterStats {
  const raceInfo = RACE_INFO[race];
  let planet: PlanetData;
  let caste: CasteData;
  let name: string;
  let gender: string;
  let body: string;
  let maxHealth = 100;

  switch (race) {
    case 'human': {
      const planets = HUMAN_PLANETS;
      planet = planets[Math.floor(Math.random() * planets.length)];
      const castes = HUMAN_CASTES;
      caste = castes[Math.floor(Math.random() * castes.length)];
      gender = Math.random() > 0.5 ? 'М' : 'Ж';
      name = gender === 'М'
        ? HUMAN_MALE_NAMES[Math.floor(Math.random() * HUMAN_MALE_NAMES.length)]
        : HUMAN_FEMALE_NAMES[Math.floor(Math.random() * HUMAN_FEMALE_NAMES.length)];
      body = gender === 'М' ? 'Человек, хрупкое' : 'Человек, хрупкое';
      break;
    }
    case 'ork': {
      planet = ORK_PLANETS[Math.floor(Math.random() * ORK_PLANETS.length)];
      caste = ORK_CASTES[Math.floor(Math.random() * ORK_CASTES.length)];
      name = ORK_NAMES[Math.floor(Math.random() * ORK_NAMES.length)];
      gender = 'М';
      body = 'Зелёный, мускулистый';
      maxHealth = 130;
      break;
    }
    case 'eldar': {
      planet = ELDAR_PLANETS[Math.floor(Math.random() * ELDAR_PLANETS.length)];
      caste = ELDAR_CASTES[Math.floor(Math.random() * ELDAR_CASTES.length)];
      gender = Math.random() > 0.5 ? 'М' : 'Ж';
      name = gender === 'М'
        ? ELDAR_MALE_NAMES[Math.floor(Math.random() * ELDAR_MALE_NAMES.length)]
        : ELDAR_FEMALE_NAMES[Math.floor(Math.random() * ELDAR_FEMALE_NAMES.length)];
      body = gender === 'М' ? 'Эльдар, грациозное' : 'Эльдар, грациозное';
      maxHealth = 80;
      break;
    }
    case 'dark_eldar': {
      planet = DARK_ELDAR_PLANETS[Math.floor(Math.random() * DARK_ELDAR_PLANETS.length)];
      caste = DARK_ELDAR_CASTES[Math.floor(Math.random() * DARK_ELDAR_CASTES.length)];
      gender = Math.random() > 0.5 ? 'М' : 'Ж';
      name = gender === 'М'
        ? DARK_ELDAR_MALE_NAMES[Math.floor(Math.random() * DARK_ELDAR_MALE_NAMES.length)]
        : DARK_ELDAR_FEMALE_NAMES[Math.floor(Math.random() * DARK_ELDAR_FEMALE_NAMES.length)];
      body = gender === 'М' ? 'Друкхаари, изящное' : 'Друкхаари, изящное';
      maxHealth = 90;
      break;
    }
    case 'tau': {
      planet = TAU_PLANETS[Math.floor(Math.random() * TAU_PLANETS.length)];
      caste = TAU_CASTES[Math.floor(Math.random() * TAU_CASTES.length)];
      const allTauNames = [...TAU_NAMES_EARTH, ...TAU_NAMES_FIRE, ...TAU_NAMES_AIR, ...TAU_NAMES_WATER, ...TAU_NAMES_ETHEREAL];
      name = allTauNames[Math.floor(Math.random() * allTauNames.length)];
      gender = 'Бесполый';
      body = 'Тау, стройное';
      maxHealth = 85;
      break;
    }
    case 'gretchin': {
      planet = GRETCHIN_PLANETS[Math.floor(Math.random() * GRETCHIN_PLANETS.length)];
      caste = GRETCHIN_CASTES[Math.floor(Math.random() * GRETCHIN_CASTES.length)];
      name = GRETCHIN_NAMES[Math.floor(Math.random() * GRETCHIN_NAMES.length)];
      gender = 'М';
      body = 'Маленькое, зелёное, хилое';
      maxHealth = 50;
      break;
    }
    default: {
      planet = HUMAN_PLANETS[0];
      caste = HUMAN_CASTES[0];
      name = 'Неизвестный';
      gender = 'М';
      body = 'Неизвестно';
    }
  }

  const hiddenParams: CharacterStats['hiddenParams'] = {
    faith: Math.floor(Math.random() * 3),
    cunning: Math.floor(Math.random() * 3),
    strength: Math.floor(Math.random() * 3),
    willpower: Math.floor(Math.random() * 3),
    mutation: Math.floor(Math.random() * 2),
    suspicion: 0,
  };

  switch (race) {
    case 'ork':
      hiddenParams.waaagh = Math.floor(Math.random() * 3) + 1;
      hiddenParams.strength += 2;
      break;
    case 'eldar':
      hiddenParams.psi = Math.floor(Math.random() * 3) + 1;
      hiddenParams.nobility = Math.floor(Math.random() * 3);
      break;
    case 'dark_eldar':
      hiddenParams.cruelty = Math.floor(Math.random() * 3) + 1;
      hiddenParams.psi = Math.floor(Math.random() * 2);
      hiddenParams.cunning += 1;
      break;
    case 'tau':
      hiddenParams.unity = Math.floor(Math.random() * 3) + 2;
      hiddenParams.techSkill = Math.floor(Math.random() * 3) + 1;
      break;
    case 'gretchin':
      hiddenParams.sneakiness = Math.floor(Math.random() * 3) + 2;
      hiddenParams.techSkill = Math.floor(Math.random() * 2);
      hiddenParams.cunning += 1;
      break;
  }

  return {
    name,
    race,
    raceName: raceInfo.name,
    age: 0,
    health: maxHealth,
    maxHealth,
    sanity: 100,
    warpCorruption: 0,
    warpAttention: 0,
    luck: Math.floor(Math.random() * 5) + 3,
    credits: caste.startCredits,
    food: 10,
    ammo: 0,
    caste: caste.name,
    planet: planet.name,
    planetType: planet.type,
    status: 'Младенец',
    influence: 0,
    inventory: ['Базовое снаряжение'],
    augmentics: [],
    factionRelations: {
      imperium: 0,
      chaos: 0,
      xenos: 0,
      criminals: 0,
      nobility: 0,
      commoners: 0,
    },
    hiddenParams,
    traits: [],
    body,
    gender,
    microEventCooldown: 0,
    keyChoices: [],
    worldEvent: generateWorldEvent(),
  };
}

export function getDeathMessage(character: CharacterStats): string {
  const { name, race, planet, age, gender } = character;
  const g = gender === 'М' ? '' : 'а';

  switch (race) {
    case 'human':
      return `${name} погиб${g} в возрасте ${age} лет на планете ${planet}. Ещё одна безымянная жертва бесконечной машины Империума. Император забрал${g} душу.`;
    case 'ork':
      return `${name} пал в бою в возрасте ${age} лет! Даже смерть не остановила WAAAGH! Другие орки поют о ${name} — хорошем бое, что он дал.`;
    case 'eldar':
      return `${name} угас${g} в возрасте ${age} лет. Ещё один свет древней расы погас. Кристаллический Лабиринт хранит память о нём вечно.`;
    case 'dark_eldar':
      return `${name} не выдержал${g} ГОЛОДа в возрасте ${age} лет. Коммагот поглотил его, как и всех. Без боли — нет жизни для Друкхаари.`;
    case 'tau':
      return `${name} пало за Высшее Блага в возрасте ${age} лет. Жертва — высшая форма служения. Эфирные поют о его вкладе в Великий Узор.`;
    case 'gretchin':
      return `${name} не выдержал${g} в возрасте ${age} лет. Ещё один гретчин погиб. Орки даже не заметили. Но где-то другие гретчины помнят...`;
    default:
      return `${name} погиб${g} в возрасте ${age} лет.`;
  }
}
