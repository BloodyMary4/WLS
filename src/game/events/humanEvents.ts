import { CharacterStats, GameEvent } from '../types';

export function getHumanEvent(age: number, c: CharacterStats): GameEvent {
  const pt = c.planetType;
  
  if (age >= 6 && c.keyChoices && c.keyChoices.includes('found_artifact')) {
    return {
      text: 'Возраст ' + age + '. Загадочный артефакт, который ты нашёл в детстве, начинает проявлять странные свойства. Он светится ночью, шепчет... Ты чувствуешь его зов.',
      choices: [
        { letter: 'А', text: 'Изучить артефакт глубже', effects: { psi: 2, mutation: 2, suspicion: 2, description: 'Ты изучаешь его. Артефакт открывает... знания. Запретные. Но мощные.' } },
        { letter: 'Б', text: 'Уничтожить его — это слишком опасно', effects: { faith: 2, willpower: 1, description: 'Ты ломаешь артефакт. Он взрывается... но ты жив. Опасность миновала.' } },
        { letter: 'В', text: 'Продать его — избавиться от проблемы', effects: { credits: 30, cunning: 1, description: 'Ты продаёшь артефакт торговцу. Деньги... но что он сделает с ним?' } },
        { letter: 'Г', text: 'Показать Инквизиции', effects: { faith: 3, suspicion: -2, description: 'Инквизиция забирает артефакт. "Правильно, дитя." Ты в безопасности... пока.' } },
      ]
    };
  }
  
  if (age >= 10 && c.keyChoices && c.keyChoices.includes('helped_rebel')) {
    return {
      text: 'Возраст ' + age + '. Повстанцы, которым ты помог в детстве, помнят тебя. Они предлагают тебе присоединиться к ним. "Ты один из нас," — говорят они.',
      choices: [
        { letter: 'А', text: 'Присоединиться — бороться за свободу', effects: { strength: 2, willpower: 2, suspicion: 3, newStatus: 'Повстанец', description: 'Ты вступаешь в ряды повстанцев. Теперь ты враг Империума. Но ты свободен.' } },
        { letter: 'Б', text: 'Отказаться — это слишком опасно', effects: { willpower: 1, description: 'Ты отказываешься. Они понимают. "Будь осторожен." Но ты жив.' } },
        { letter: 'В', text: 'Донести на них Инквизиции', effects: { faith: 2, suspicion: -2, description: 'Инквизиция арестовывает повстанцев. Ты праведник. Но... они доверяли тебе.' } },
        { letter: 'Г', text: 'Помогать тайно — двойная игра', effects: { cunning: 3, suspicion: 2, description: 'Ты помогаешь повстанцам, но остаёшься "лояльным". Опасная игра.' } },
      ]
    };
  }
  
  if (age >= 8 && c.keyChoices && c.keyChoices.includes('saved_xenos')) {
    return {
      text: 'Возраст ' + age + '. Ксенос, которого ты спас в детстве, возвращается. Он приносит дар — странный кристалл. "Ты спас мне жизнь. Теперь я спасу твою."',
      choices: [
        { letter: 'А', text: 'Принять дар — ксенос не враг', effects: { psi: 2, mutation: 1, suspicion: 3, addItem: 'Ксенос-кристалл', description: 'Ты берёшь кристалл. Он даёт тебе... способности? Или проклятие?' } },
        { letter: 'Б', text: 'Отказаться — это ересь', effects: { faith: 2, willpower: 1, description: 'Ты отказываешься. Ксенос уходит. "Жаль. Ты мог бы стать... большим."' } },
        { letter: 'В', text: 'Донести на него', effects: { faith: 2, suspicion: -1, description: 'Инквизиция приходит. Ксенос убегает. Ты праведник. Но... он доверял тебе.' } },
        { letter: 'Г', text: 'Попросить его научить тебя', effects: { cunning: 2, psi: 2, suspicion: 2, description: 'Ксенос учит тебя. Странные знания... но полезные. Ты меняешься.' } },
      ]
    };
  }
  
  if (age === 0) {
    const events: GameEvent[] = [
      {
        text: 'Ты появляешься на свет в грязи и вони. Твоя мать кричит от боли, а повитуха шепчет молитвы Императору. Ты слаб, но дышишь. В этом мире каждый вздох — дар, за который придётся платить.',
        choices: [
          { letter: 'А', text: 'Громко заплакать — заявить о своём праве на жизнь', effects: { willpower: 1, description: 'Твой крик наполняет камеру. "Крепкий будет."' } },
          { letter: 'Б', text: 'Тихо сопеть, экономя силы', effects: { cunning: 1, description: 'Ты инстинктивно бережёшь энергию.' } },
          { letter: 'В', text: 'Схватить палец повитухи', effects: { strength: 1, description: 'Маленькая рука сжимает палец с неожиданной силой.' } },
          { letter: 'Г', text: 'Не открывать глаза, впитывая запахи', effects: { faith: 1, description: 'Ты чувствуешь присутствие чего-то большего.' } },
        ]
      },
      {
        text: 'Ты рождаешься в ' + (pt === 'Улей-мир' ? 'переполненном улье' : pt === 'Мир-крепость' ? 'казармах гарнизона' : 'трущобах') + '. Мать еле дышит после родов. Отец смотрит на тебя с надеждой и страхом. "Ещё один рот," — шепчет кто-то. Повитуха заворачивает тебя в грязную тряпку.',
        choices: [
          { letter: 'А', text: 'Кричать так, что все вздрагивают', effects: { willpower: 2, description: 'Твои лёгкие сильны. "Этот выживет," — говорит повитуха.' } },
          { letter: 'Б', text: 'Молчать и смотреть', effects: { cunning: 1, faith: 1, description: 'Твои глаза открыты. Ты наблюдаешь. Раннее сознание.' } },
          { letter: 'В', text: 'Искать грудь матери', effects: { strength: 1, willpower: 1, description: 'Инстинкт выживания. Ты находишь пищу. Мать слабеет, но ты жив.' } },
          { letter: 'Г', text: 'Заснуть сразу', effects: { faith: 1, description: 'Ты доверяешь миру. Или не понимаешь его. Сон — защита.' } },
        ]
      },
    ];
    return events[Math.floor(Math.random() * events.length)];
  }
  
  if (age === 1) {
    return {
      text: 'Первый год. Ты лежишь в тряпичной колыбели. Над тобой нависают тени. Воздух тяжёл. Ты ещё не понимаешь слов, но чувствуешь: этот мир жесток.',
      choices: [
        { letter: 'А', text: 'Тянуться к тусклому свету', effects: { willpower: 1, description: 'Свет манит тебя. Инстинкт к лучу — к надежде.' } },
        { letter: 'Б', text: 'Кусать всё, что попадает в рот', effects: { strength: 1, description: 'Зубы прорезаются. Мир горький на вкус.' } },
        { letter: 'В', text: 'Наблюдать за тенями молча', effects: { cunning: 1, description: 'Твои глаза следят. Раннее развитие наблюдательности.' } },
        { letter: 'Г', text: 'Тянуться к ржавому символу на стене', effects: { faith: 1, description: 'Аквитанский орёл. Ты тянешься к нему.' } },
      ]
    };
  }
  
  if (age >= 2 && age <= 5) {
    const events: GameEvent[] = [
      {
        text: 'Возраст ' + age + '. Ты бегаешь по коридорам. Другой ребёнок — постарше, злее — требует твою еду.',
        choices: [
          { letter: 'А', text: 'Отдать еду без сопротивления', effects: { cunning: 1, faith: -1, description: 'Ты запоминаешь. В следующий раз будет иначе.' } },
          { letter: 'Б', text: 'Укусить его и бежать', effects: { strength: 1, suspicion: 1, description: 'Кровь на губах. Ты бежишь.' } },
          { letter: 'В', text: 'Позвать взрослых', effects: { faith: 1, description: 'Старшие пришли. Обидчика отшлёпали.' } },
          { letter: 'Г', text: 'Предложить обмен — услуга за еду', effects: { cunning: 2, description: 'Первая сделка в жизни.' } },
        ]
      },
      {
        text: 'Возраст ' + age + '. Ты нашёл в мусоре странный светящийся предмет. Он тёплый и гудит.',
        choices: [
          { letter: 'А', text: 'Спрятать и оставить себе', effects: { cunning: 1, mutation: 1, addItem: 'Загадочный артефакт', keyChoice: 'found_artifact', description: 'Ты прячешь предмет. По ночам он шепчет.' } },
          { letter: 'Б', text: 'Показать родителям', effects: { faith: 2, suspicion: 1, description: '"Это ересь!" — отец забирает предмет.' } },
          { letter: 'В', text: 'Бросить подальше', effects: { faith: 1, description: 'Инстинкт опасности. Предмет летит в темноту.' } },
          { letter: 'Г', text: 'Попробовать на вкус', effects: { health: -10, mutation: 2, keyChoice: 'found_artifact', description: 'Металл обжигает язык. Видения... но ты выживаешь.' } },
        ]
      },
    ];
    return events[Math.floor(Math.random() * events.length)];
  }
  
  if (age >= 6 && age <= 12) {
    const recruiterOrg = pt === 'Мир-крепость' ? 'Имперской Гвардии' : pt === 'Улей-мир' ? 'Адептус Арбитрес' : 'местных властей';
    return {
      text: 'Возраст ' + age + '. День Отбора. Представители ' + recruiterOrg + ' пришли набирать детей.',
      choices: [
        { letter: 'А', text: 'Встать в строй, смотреть в глаза офицеру', effects: { willpower: 2, strength: 1, newStatus: 'Кандидат', description: '"Этот годен." Тебя записывают.' } },
        { letter: 'Б', text: 'Спрятаться за спинами других', effects: { cunning: 2, description: 'Ты растворяешься в толпе. Свободен... пока что.' } },
        { letter: 'В', text: 'Демонстрировать знания молитв', effects: { faith: 2, description: '"Благочестивый ребёнок." Рекомендуют в церковную школу.' } },
        { letter: 'Г', text: 'Спросить: "А что мне дадут?"', effects: { cunning: 1, suspicion: 1, description: '"Прагматик. Запомню."' } },
      ]
    };
  }
  
  if (age >= 13 && age < 50) {
    return {
      text: 'Возраст ' + age + '. Тебе предлагают вступить в ' + (pt === 'Улей-мир' ? 'банду нижних уровней' : 'молодёжный военный отряд') + '.',
      choices: [
        { letter: 'А', text: 'Принять — сила в числе', effects: { strength: 2, suspicion: 2, addTrait: 'Бандит', description: 'У тебя есть "семья". Они учат драться.' } },
        { letter: 'Б', text: 'Отказаться', effects: { willpower: 2, description: '"Ты пожалеешь." Ты уходишь гордо.' } },
        { letter: 'В', text: 'Стать информатором властей', effects: { cunning: 2, faith: 1, suspicion: -1, description: '"Я знаю, где они." Тебя принимают.' } },
        { letter: 'Г', text: 'Бросить вызов главарю', effects: { cunning: 1, strength: 1, willpower: 1, description: 'Дерёшься. Проигрываешь... но он уважает смелость.' } },
      ]
    };
  }
  
  // 50-70 лет
  if (age >= 50 && age < 70) {
    return {
      text: 'Возраст ' + age + '. Ты стар. Морщины, седина, шрамы. Молодёжь смотрит на тебя с уважением или презрением. Что ты оставишь после себя?',
      choices: [
        { letter: 'А', text: 'Стать наставником — передать знания', effects: { faith: 2, cunning: 1, description: 'Ты учишь молодых. Твоя мудрость живёт в них.' } },
        { letter: 'Б', text: 'Написать мемуары', effects: { cunning: 2, willpower: 1, description: 'Ты записываешь свою историю. Может, кто-то прочтёт?' } },
        { letter: 'В', text: 'Последний бой — уйти с честью', effects: { strength: 2, willpower: 2, health: -15, description: 'Ты идёшь на последнее задание. Слава или смерть?' } },
        { letter: 'Г', text: 'Молиться — искать покой', effects: { faith: 3, description: 'Ты проводишь дни в молитвах. Мир суетится, а ты... спокоен.' } },
      ]
    };
  }
  
  // 70-100 лет
  if (age >= 70 && age < 100) {
    return {
      text: 'Возраст ' + age + '. Ты — легенда. Твоё имя знают все. Но время нещадно. Твоё тело слабеет, но разум ясен. Что делать с оставшимся временем?',
      choices: [
        { letter: 'А', text: 'Основать династию', effects: { cunning: 3, faith: 2, influence: 5, description: 'Ты женишься/выходишь замуж. Твой род продолжится.' } },
        { letter: 'Б', text: 'Стать отшельником', effects: { willpower: 4, faith: 2, description: 'Ты уходишь от мира. Медитируешь. Ищешь истину в тишине.' } },
        { letter: 'В', text: 'Последнее великое дело', effects: { strength: 2, cunning: 2, influence: 10, health: -20, description: 'Ты совершаешь подвиг. Твоё имя войдёт в легенды.' } },
        { letter: 'Г', text: 'Передать всё наследникам', effects: { cunning: 2, faith: 1, description: 'Ты раздаёшь имущество. Молодые смотрят с благодарностью.' } },
      ]
    };
  }
  
  // 100+ лет
  return {
    text: 'Возраст ' + age + '. Ты — один из старейших людей в секторе. Твоё тело дряхлое, но дух крепок. Люди приходят к тебе за советом. Ты видел падение империй и рождение новых звёзд.',
    choices: [
      { letter: 'А', text: 'Стать живым памятником', effects: { faith: 4, influence: 15, description: 'Ты становишься символом. Твоё имя знают даже дети.' } },
      { letter: 'Б', text: 'Передать последнюю тайну', effects: { cunning: 4, psi: 2, description: 'Ты открываешь ученику великую тайну. Знание переживёт тебя.' } },
      { letter: 'В', text: 'Принять конец с достоинством', effects: { willpower: 5, faith: 3, description: 'Ты готовишься к уходу. Твоя душа спокойна.' } },
      { letter: 'Г', text: 'Попросить Императора о чуде', effects: { faith: 5, health: 20, description: 'Ты молишься. И... чудо происходит. Ты получаешь ещё годы жизни.' } },
    ]
  };
}
