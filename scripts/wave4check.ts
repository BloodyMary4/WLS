import { getHumanLoreEvent, stripLoreMarker } from '../src/game/events/humanLoreEvents';
import { getHumanEvent } from '../src/game/events/humanEvents';
const mk = (over: any = {}): any => ({ name:'Тест', age:0, planet:'Хив', planetType:'Улей-мир', health:70, sanity:80, warpCorruption:0, warpAttention:0, luck:5, credits:10, food:10, ammo:5, influence:0, status:'', inventory:[], factionRelations:{}, npcs:[], hiddenParams:{faith:1,cunning:1,strength:1,willpower:1,mutation:0,suspicion:0}, traits:[], body:'', gender:'м', microEventCooldown:0, keyChoices:[], ...over });

// 1) Эхо «Хроники» в main-событиях: срабатывает при chronicler_path и гаснет после chronicle_claimed
const c1 = mk({ keyChoices: ['chronicler_path'] });
const e1 = getHumanEvent(60, c1);
console.log('Эхо хроники:', e1.text.includes('Ордена писцов') ? 'ДА' : 'НЕТ');
const c1b = mk({ keyChoices: ['chronicler_path', 'chronicle_claimed'] });
console.log('Эхо гасится после прохождения:', !getHumanEvent(60, c1b).text.includes('Ордена писцов'));

// 2) Эхо поручительства по трейту «Заступник»
const c2 = mk({ traits: ['Заступник'] });
console.log('Эхо заступника:', getHumanEvent(30, c2).text.includes('поручился') ? 'ДА' : 'НЕТ');
const c2b = mk({ traits: ['Заступник'], keyChoices: ['ward_paid'] });
console.log('Эхо заступника гасится:', !getHumanEvent(30, c2b).text.includes('поручился'));

// 3) Целостность: старые события не сломались — обычная жизнь идёт как раньше
console.log('Обычная жизнь (age 20, без ключей):', getHumanEvent(20, mk()).text.slice(0, 30));
console.log('Возврат повстанцев не потерян:', getHumanEvent(15, mk({ keyChoices: ['helped_rebel'] })).text.includes('Повстанцы'));

// 4) Валидация всех новых событий: 4 варианта, %AGE%, корректные эффекты
import { LORE_POOL_WAVE4 } from '../src/game/events/humanLoreEventsWave4';
let bad = 0;
for (const p of LORE_POOL_WAVE4) {
  if (!p.ev.text.includes('%AGE%')) { console.log('Нет %AGE%:', p.ev.text.slice(0,40)); bad++; }
  if (p.ev.choices.length !== 4) { console.log('Не 4 выбора'); bad++; }
  for (const ch of p.ev.choices) {
    if (!ch.effects || !ch.effects.description) { console.log('Нет description'); bad++; }
    if (/[а-яa-z]{0}[A-Za-zА-Я]{0}(闻到|passing|accounting|absolution|Conditions|квартal)/.test(ch.text + (ch.effects?.description||'') + p.ev.text)) { console.log('Мусорный токен в:', p.ev.text.slice(0,40)); bad++; }
  }
}
console.log('Новых лорных событий:', LORE_POOL_WAVE4.length, '| ошибок:', bad);
