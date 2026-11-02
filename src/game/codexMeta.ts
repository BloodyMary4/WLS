/**
 * Общие данные окон «Кодекса» (v0.3.32): вынесены из CodexPanel, чтобы
 * каждое окно-модуль левого отсека тянуло пояснения и шкалы из одного места.
 */
import { CharacterStats } from './types';

/** Русская плюрализация: 1 чудо / 2-4 чуда / 5+ чудес */
export function declineMiracles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чудо';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'чуда';
  return 'чудес';
}

/** Пояснения к скрытым параметрам — тултипы в окне «Скрытые свойства». */
export const HIDDEN_HINTS: Record<string, string> = {
  faith: 'Вера в Императора или богов своего народа. Высокая вера смягчает ужасы войны и открывает чудеса заступничества для людей.',
  cunning: 'Хитрость и умение выкрутиться. Влияет на побег, торг и обман сильнее, чем грубая сила.',
  strength: 'Физическая мощь. Решает исход ближних боёв, работ и испытаний выносливости.',
  willpower: 'Стойкость духа. Сопротивление психической порче Варпа, пыткам и безумию.',
  mutation: 'Отметчина Хаоса в плоти. Растёт от порчи Варпа; выше 7 — Инквизиция обратит внимание, выше 9 — почти верная гибель.',
  suspicion: 'Подозрение властей. Копится от ересей и странных слухов; на пределе грозит арест или приговор Инквизиции.',
  waaagh: 'Дух орочьего культа силы: чем громче WAAAGH!, тем увереннее зелёная кожа держится в бою.',
  psi: 'Пси-потенциал. Без контроля растущая сила сожжёт разум: перегруз наступает на пределе шкалы.',
  nobility: 'Честь Дома и кровь аристократов Асул. Открывает пути при дворах Ковчегов.',
  cruelty: 'Жестокость друкхаари — валюта Коморры. Она питает Рамотеп и бережёт свою хозяйку.',
  unity: "Преданность Высшему Благу тау. Сплочённость каст и доверие манд'ва решают судьбу общины.",
  techSkill: 'Мастерство обращения с машинным духом. Нужно пилотам, техникам и огранщикам света.',
  sneakiness: 'Умение гретчина остаться незамеченным: под ногами вааagh-боссов и вождей выживает только ловкий.',
  warpAttention: 'Насколько ты ярок в Имматериуме. Каждый незакрытый пси-дар слышен демонам и Инквизиции: чем выше шкала, тем раньше придут — Ордо Малипус (псайкеры) или костер еретиков.',
  warpCorruption: 'Порча души от контакта с Варпом. Растёт вслед за вниманием Имматериума; на пределе плоть и разум начинают служить Хаосу.',
};

export interface RaceBar { label: string; value: number; icon: string; color: string; hint: string }

/** Расовые шкалы персонажа для окна «Скрытые свойства». */
export function buildRaceBars(character: CharacterStats): RaceBar[] {
  const hp = character.hiddenParams;
  const bars: RaceBar[] = [];
  if (character.race === 'ork') bars.push({ label: 'WAAAGH!', value: hp.waaagh || 0, icon: '⚔️', color: 'bg-green-500', hint: HIDDEN_HINTS.waaagh });
  if (character.race === 'eldar') bars.push({ label: 'Пси-сила', value: hp.psi || 0, icon: '🔮', color: 'bg-purple-500', hint: HIDDEN_HINTS.psi });
  if (character.race === 'eldar') bars.push({ label: 'Благородство', value: hp.nobility || 0, icon: '👑', color: 'bg-blue-400', hint: HIDDEN_HINTS.nobility });
  if (character.race === 'dark_eldar') bars.push({ label: 'Жестокость', value: hp.cruelty || 0, icon: '🩸', color: 'bg-red-500', hint: HIDDEN_HINTS.cruelty });
  if (character.race === 'tau') bars.push({ label: 'Единство', value: hp.unity || 0, icon: '🔷', color: 'bg-cyan-500', hint: HIDDEN_HINTS.unity });
  if (character.race === 'tau') bars.push({ label: 'Технологии', value: hp.techSkill || 0, icon: '⚙️', color: 'bg-blue-400', hint: HIDDEN_HINTS.techSkill });
  if (character.race === 'gretchin') bars.push({ label: 'Скрытность', value: hp.sneakiness || 0, icon: '🐀', color: 'bg-yellow-600', hint: HIDDEN_HINTS.sneakiness });
  return bars;
}
