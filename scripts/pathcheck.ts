import { getEventForAge } from '../src/game/data';
import { applyChoiceEffects, updateAgeStatus } from '../src/game/utils';

const mk = (over: any = {}): any => ({ race:'human', name:'Иван', age:0, planet:'Хив', planetType:'Улей-мир', health:70, maxHealth:100, sanity:80, warpCorruption:0, warpAttention:0, luck:5, credits:10, food:10, ammo:5, influence:0, status:'', inventory:[], factionRelations:{}, npcs:[], hiddenParams:{faith:1,cunning:1,strength:1,willpower:1,mutation:0,suspicion:0}, traits:[], body:'', augmentics:[], microEventCooldown:0, keyChoices:[], ...over });

function simulate(label: string, start: any, preferAugment: boolean) {
  let c = mk(start);
  const texts: string[] = [];
  for (let age = 0; age <= 100; age++) {
    c.age = age;
    const ev = getEventForAge(age, c);
    texts.push(ev.text.replace(/\u200B\d+\u200B/,'').slice(0, 34));
    let idx = 0;
    const pickers = preferAugment
      ? [(ch:any)=>ch.effects.addAugmentic, (ch:any)=>ch.effects.keyChoice, ()=>true]
      : [(ch:any)=>ch.effects.keyChoice, ()=>true];
    for (const p of pickers) { const i = ev.choices.findIndex(p); if (i >= 0) { idx = i; break; } }
    c = applyChoiceEffects(c, ev.choices[idx].effects);
    c = updateAgeStatus(c).character;
    if (c.health <= 0) { console.log(`${label}: умер в ${c.age}`); break; }
  }
  const dup = texts.length - new Set(texts).size;
  console.log(`--- ${label} ---`);
  console.log('лет пройдено:', texts.length, '| повторов событий:', dup);
  console.log('ключи пути:', c.keyChoices.filter(k=>!k.startsWith('lore')).join(','));
  console.log('импланты:', (c.augmentics||[]).join(','), '| creed:', c.imperialCreed ?? 0);
  return { c, texts };
}

simulate('Улей-мир, аугметации', { planetType:'Улей-мир', planet:'Хив', credits:200 }, true);
simulate('Мир-кузница, аугметации', { planetType:'Мир-кузница (Адептус Механикус)', planet:'Феррус Примус', credits:300 }, true);
simulate('Мир-ферма, без имплантов', { planetType:'Мир-ферма', planet:'Агриппина Секунда' }, false);
simulate('Тюрьма-мир, ключевые выборы', { planetType:'Тюрьма-мир', planet:'Голготх' }, false);
