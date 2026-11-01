import { CharacterStats, GameEvent } from '../types';

export function getDarkEldarEvent(age: number, c: CharacterStats): GameEvent {
  if (age >= 50 && c.keyChoices && c.keyChoices.includes('dark_eldar_conscience')) {
    return {
      text: 'Возраст ' + age + '. Ты чувствуешь... что-то странное. Совесть? Слабость? ГОЛОД усиливается, но ты не можешь причинять боль как раньше. Что-то изменилось внутри.',
      choices: [
        { letter: 'А', text: 'Принять это — искать искупление', effects: { willpower: 4, cruelty: -3, health: -15, description: 'Ты пытаешься измениться. ГОЛОД кричит. Но ты... находишь покой? Или это конец?' } },
        { letter: 'Б', text: 'Подавить это — вернуться к жестокости', effects: { cruelty: 3, willpower: -2, description: 'Ты заставляешь себя. Боль... возвращается. Но ты чувствуешь пустоту.' } },
        { letter: 'В', text: 'Найти других таких, как ты', effects: { cunning: 3, cruelty: -1, description: 'Ты ищешь... других Друкхаари с совестью. Их мало. Но они есть.' } },
        { letter: 'Г', text: 'Использовать это как оружие', effects: { cunning: 4, cruelty: 1, description: 'Ты притворяешься... добрым. Враги доверяют. Ты наносишь удар. Гениально.' } },
      ]
    };
  }
  
  if (age >= 30 && c.keyChoices && c.keyChoices.includes('dark_eldar_politics')) {
    return {
      text: 'Возраст ' + age + '. Твои политические интриги принесли плоды. Ты стоишь на пороге власти. Архонт предлагает тебе стать его наследником. "Прими... или умри."',
      choices: [
        { letter: 'А', text: 'Принять — стать Архонтом', effects: { cunning: 3, cruelty: 2, newStatus: 'Архонт', description: 'Ты принимаешь. Теперь ты — Архонт. Власть... и бесконечный ГОЛОД.' } },
        { letter: 'Б', text: 'Отказаться — это ловушка', effects: { willpower: 3, suspicion: 2, description: 'Ты отказываешься. Архонт смотрит... холодно. "Ты пожалеешь."' } },
        { letter: 'В', text: 'Убить Архонта и занять его место', effects: { strength: 2, cunning: 3, cruelty: 3, newStatus: 'Архонт', description: 'Ты убиваешь его. Быстро. Тихо. Теперь ты — Архонт. Но кто следующий?' } },
        { letter: 'Г', text: 'Предложить разделить власть', effects: { cunning: 4, description: 'Ты предлагаешь... партнёрство. Архонт смеётся. "Дерзко. Мне нравится."' } },
      ]
    };
  }
  
  if (age === 0) {
    return {
      text: 'Ты рождаешься в Комморхе — городе, построенном на боли и удовольствии. Твоя мать — Суккуба, отец — Архонт. Здесь слабость — смертный грех.',
      choices: [
        { letter: 'А', text: 'Чувствовать голод с рождения', effects: { cruelty: 2, description: 'Ты уже знаешь, что такое ГОЛОД. Это движет тобой.' } },
        { letter: 'Б', text: 'Наблюдать за страданиями', effects: { cunning: 1, cruelty: 1, description: 'Ты учишься с самого начала. Боль — это искусство.' } },
        { letter: 'В', text: 'Плакать от ужаса', effects: { willpower: 1, description: 'Даже тьма может испугать. Но ты выживёшь.' } },
        { letter: 'Г', text: 'Смеяться', effects: { cruelty: 2, suspicion: 1, description: 'Ты уже понимаешь игру. Смех — лучшее оружие.' } },
      ]
    };
  }
  
  if (age >= 1 && age <= 10) {
    return {
      text: 'Возраст ' + age + '. Тебя учат искусству причинения боли. Наставник говорит: "Мы не жестоки. Мы — художники. Каждая слеза — мазок на холсте вечности."',
      choices: [
        { letter: 'А', text: 'Учиться с энтузиазмом', effects: { cruelty: 3, techSkill: 1, description: 'Ты становишься мастером. Боль — твоя страсть.' } },
        { letter: 'Б', text: 'Изучать психологию жертв', effects: { cunning: 3, description: 'Ты понимаешь, что ломает разум. Это эффективнее.' } },
        { letter: 'В', text: 'Создавать новые методы', effects: { techSkill: 3, cruelty: 1, description: 'Ты инноватор. Твои методы... уникальны.' } },
        { letter: 'Г', text: 'Чувствовать отвращение', effects: { willpower: 2, cruelty: -1, description: 'Что-то внутри протестует. Это слабость... или сила?' } },
      ]
    };
  }
  
  if (age >= 11 && age <= 100) {
    return {
      text: 'Возраст ' + age + '. ГОЛОД усиливается. Тебе нужно больше, сильнее, изощрённее. Архонт смотрит на тебя: "Покажи, на что ты способен."',
      choices: [
        { letter: 'А', text: 'Организовать великий рейд', effects: { strength: 2, cunning: 2, cruelty: 2, description: 'Ты ведёшь Кабал в реальный мир. Жатва богата.' } },
        { letter: 'Б', text: 'Создать новое устройство пыток', effects: { techSkill: 3, cruelty: 3, description: 'Твоё творение... шедевр. Архонт впечатлён.' } },
        { letter: 'В', text: 'Интриговать против rival', effects: { cunning: 4, description: 'Ты плетёшь сети. Враг падёт, даже не узнав почему.' } },
        { letter: 'Г', text: 'Искать запрещённые удовольствия', effects: { cruelty: 2, mutation: 2, description: 'Ты идёшь туда, где другие боятся. Но ГОЛОД... не утихает.' } },
      ]
    };
  }
  
  return {
    text: 'Возраст ' + age + '. Столетия в Комморхе. Ты — легенда. Но ГОЛОД никогда не уходит. Ты видишь, как другие Друкхаари угасают. Ты тоже чувствуешь... пустоту.',
    choices: [
      { letter: 'А', text: 'Стать Архонтом', effects: { cruelty: 3, cunning: 2, newStatus: 'Архонт', description: 'Ты берёшь власть. Теперь ты правишь Кабалом.' } },
      { letter: 'Б', text: 'Создать шедевр страданий', effects: { techSkill: 4, cruelty: 3, description: 'Твоё великое творение. Оно переживёт века.' } },
      { letter: 'В', text: 'Исследовать запретное', effects: { psi: 3, mutation: 3, description: 'Ты идёшь в Варп. Там... что-то ждёт. Опасно, но манит.' } },
      { letter: 'Г', text: 'Принять угасание', effects: { willpower: 4, description: 'Ты принимаешь конец. Это... странно peacefully для Друкхаари.' } },
    ]
  };
}
