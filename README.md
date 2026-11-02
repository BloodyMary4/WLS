# Warhammer Life Simulator

Текстовый симулятор жизни во вселенной Warhammer 40,000.

## 🕹️ Играть онлайн

**[▶ Играть в браузере](https://bloodymary4.github.io/WLS/)** — веб-версия, обновляется автоматически при каждом пуше в main.

## 💻 Версия для ПК (Windows)

Скачайте portable-версию или установщик со страницы релизов: **[GitHub Releases](https://github.com/BloodyMary4/WLS/releases/latest)**

## 🎮 Особенности

- **6 рас**: Человек, Орк, Эльдар, Тёмный Эльдар, Тау, Гретчин
- **Система зависимостей**: Ваши выборы влияют на будущие события
- **Система достижений**: 50+ уникальных достижений
- **Система квестов**: 8+ квестов с наградами и целями
- **Система NPC**: Встречи с персонажами, развитие отношений
- **Система наследия**: Бонусы за предыдущие игры
- **Микро-события**: 50+ случайных событий между ходами
- **Процедурная музыка**: Динамический эмбиент (хор, шёпоты, дроны), адаптирующийся к настроению сцены
- **Тактильная отдача**: Вибрация геймпада (Gamepad API) для судьбоносных выборов, ранений и смерти
- **Летопись жизни**: Хроника событий на экране смерти с выделением судьбоносных выборов
- **Система сохранений**: Автоматическое сохранение прогресса
- **Клавиатурные сокращения**: A-D для выбора, Space для продолжения
- **Desktop-версия**: Electron-сборка (установщик и portable .exe) публикуется в релизах

## 🏗️ Архитектура проекта

```
src/
├── game/                    # Игровая логика
│   ├── events/             # События по расам
│   │   ├── humanEvents.ts
│   │   ├── orkEvents.ts
│   │   ├── eldarEvents.ts
│   │   ├── darkEldarEvents.ts
│   │   ├── tauEvents.ts
│   │   ├── gretchinEvents.ts
│   │   └── index.ts
│   ├── types.ts            # TypeScript типы
│   ├── config.ts           # Конфигурация игры
│   ├── data.ts             # Данные (планеты, имена, расы)
│   ├── utils.ts            # Утилиты
│   ├── validation.ts       # Валидация данных
│   ├── achievements.ts     # Система достижений
│   ├── microEvents.ts      # Микро-события
│   ├── legacy.ts           # Система наследия
│   ├── saveSystem.ts       # Система сохранений
│   ├── npcSystem.ts        # Система NPC
│   ├── questSystem.ts      # Система квестов
│   ├── reducer.ts          # Чистый игровой редьюсер (ход, эффекты, хроника)
│   ├── haptics.ts          # Тактильная отдача (Gamepad API)
│   ├── rng.ts              # Детерминированный генератор случайных чисел
│   └── audio.ts            # Аудио система (процедурный эмбиент)
├── hooks/
│   ├── useGameStore.ts     # Zustand-хранилище игрового состояния
│   └── useKeyboardControls.ts # Клавиатурные сокращения
├── components/
│   ├── MainMenu.tsx        # Главное меню и выбор расы
│   ├── GameScreen.tsx      # Игровой экран
│   ├── EventCard.tsx       # Карточка события с выборами
│   ├── DeathScreen.tsx     # Экран смерти и летопись жизни
│   ├── Sidebar.tsx         # Статы, хроника, квесты, NPC
│   ├── AchievementToast.tsx # Тост новых достижений
│   ├── AudioController.tsx # Компонент управления аудио
│   └── StatCard.tsx        # Компонент карточки статистики
├── __tests__/              # Юнит-тесты (vitest, 138 тестов)
├── App.tsx                 # Главный компонент
├── main.tsx                # Точка входа
└── index.css               # Глобальные стили
electron/                   # Desktop-обёртка (Electron + electron-builder)
```

## 🚀 Разработка

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

### Сборка для продакшена

```bash
npm run build
```

### Desktop-сборка (Windows, Electron)

```bash
npm run electron:build   # установщик + portable .exe (electron-builder --win nsis portable)
```

Сборка автоматически выполняется CI-воркфлоу `Desktop Build (Windows)` при пуше тега `v*` — артефакты публикуются в GitHub Releases.

### Проверка целостности проекта

```bash
npm run check
```

### Запуск тестов

```bash
npm test            # разовый прогон (vitest run)
npm run test:watch  # режим наблюдения
```

Тесты покрывают ядро игровой логики: `reducer` (ходы, эффекты, хроника, летопись), `utils` (эффекты выборов, старение), `validation`, `saveSystem`, `questSystem`, `achievements`, `haptics` (паттерны вибрации). Настройки — в `vitest.config.ts`, фабрики объектов для тестов — в `src/game/testHelpers.ts`. Текущий прогон: **138 тестов, 9 файлов**.

### Восстановление структуры

```bash
npm run restore
```

## 📊 Системы игры

### Система зависимостей

Ключевые выборы сохраняются в `character.keyChoices` и влияют на будущие события:

```typescript
if (age >= 6 && c.keyChoices && c.keyChoices.includes('found_artifact')) {
  return {
    text: 'Загадочный артефакт начинает проявлять странные свойства...',
    choices: [...]
  };
}
```

### Система достижений

Достижения проверяются после каждого хода:

```typescript
const newAchievementsList = checkAchievements(newChar, unlockedAchievements);
if (newAchievementsList.length > 0) {
  setNewAchievement(newAchievementsList[0]);
}
```

### Система наследия

Наследие сохраняется в localStorage и даёт бонусы:

```typescript
const legacy = getLegacy();
const bonuses = getLegacyBonuses(legacy);
character.credits += bonuses.startingCredits;
```

### Система сохранений

Автоматическое сохранение при каждом ходе:

```typescript
useEffect(() => {
  if (gameState && !gameState.gameOver) {
    saveGame(gameState, unlockedAchievements);
  }
}, [gameState, unlockedAchievements]);
```

### Система квестов

Квесты добавляют цели и награды для мотивации игрока:

```typescript
// Проверка квестов после каждого хода
const { updatedQuests, completedQuests } = checkQuests(newChar, activeQuests);

// Применение наград за завершённые квесты
for (const quest of newlyCompleted) {
  finalChar = applyQuestRewards(finalChar, quest);
  newHistory.push(`[Квест] Завершён: ${quest.name}! Получены награды.`);
}
```

**Доступные квесты:**
- Выживший (пережить 10 лет)
- Истинно верующий (достичь 8+ веры)
- Воин Империума (8+ силы и 5+ воли)
- Учёный (8+ хитрости и 5+ веры)
- Богач (накопить 100+ кредитов)
- Влиятельная личность (достичь 50+ влияния)
- Дипломат (5+ отношений с Империумом)
- Душа компании (встретить 10+ NPC)

### Система NPC

Встречи с персонажами добавляют глубину игровому миру:

```typescript
// 20% шанс встретить NPC при каждом ходе
if (Math.random() < 0.2) {
  const encounter = randomNPCEncounter(newChar);
  if (encounter.npc) {
    newChar = addNPC(newChar, encounter.npc);
    const eventText = generateNPCEvent(newChar, encounter.npc);
    newHistory.push(`[NPC] ${eventText}`);
  }
}
```

**Особенности системы NPC:**
- Уникальные имена для каждой расы
- 10 ролей NPC (торговец, воин, мудрец и т.д.)
- Шкала отношений от -100 до 100
- Друзья (50+), нейтралы (-30 до 30), враги (-50)
- События зависят от уровня отношений

## 🔧 Конфигурация

Все магические числа вынесены в `config.ts`:

```typescript
export const GAME_CONFIG = {
  AGE_THRESHOLDS: {
    BABY: 0,
    TODDLER: 2,
    CHILD: 6,
    TEEN: 13,
    ADULT: 18,
    MAX_EXPECTED: 80,
  },
  STAT_THRESHOLDS: {
    MAX_VALUE: 10,
    MIN_VALUE: 0,
    MUTATION_DAMAGE: 7,
    PSI_OVERLOAD: 10,
    SUSPICION_CRITICAL: 10,
  },
  // ... другие константы
};
```

## 🎨 Стилизация

Интерфейс выполнен в стиле Warhammer 40,000:

- Тёмная цветовая схема (#0a0a0a, #1a1a1a)
- Золотые акценты (#d4af37)
- Кроваво-красные элементы (#8b0000)
- Готические шрифты (Cinzel)
- Чистый шрифт (Inter)

## 🎵 Аудио и тактильная отдача

Процедурный генератор музыки на Web Audio API:

- Многослойные дроны (16 осцилляторов)
- Стерео-панорамирование
- Динамические настроения (normal, tense, danger, epic), адаптивный «хор шёпотов» — громкость слоя зависит от настроения сцены
- Звуковые эффекты для событий

Тактильная отдача через Gamepad API (`src/game/haptics.ts`):

- Чистая функция `computeHapticPattern` подбирает паттерн вибрации по типу события: `choice`, `fate` (судьбоносный выбор), `wound`, `miracle`, `death`
- Graceful degradation: без подключённого геймпада или в браузерах без поддержки (Safari/Firefox) — no-op без ошибок

Летопись жизни (`DeathScreen`):

- На экране смерти показывается сжатая хроника ключевых выборов; судьбоносные записи помечаются меткой `**судьба**` в reducer и подсвечиваются золотом в UI

## 📝 TODO

### Приоритет 1 (Критичные)
- [x] Исправить проверку keyChoices на undefined
- [x] Добавить обработку ошибок в loadSavedGame
- [x] Добавить больше событий для поздних возрастов

### Приоритет 2 (Важные)
- [x] Добавить unit-тесты (138 тестов, vitest)
- [ ] Добавить интеграционные тесты
- [ ] Оптимизировать производительность

### Приоритет 3 (Желательные)
- [x] Добавить систему репутации с NPC
- [ ] Добавить больше расовых особенностей
- [x] Добавить систему квестов
- [x] Тактильная отдача (Gamepad API) — v0.3.5
- [x] Летопись жизни на экране смерти — v0.3.4
- [ ] Новые лор-события и ветки выборов (v0.3.6+)

## 📄 Лицензия

MIT

## 👥 Авторы

Разработано с помощью AI для демонстрации возможностей современного веб-разработки.

## 🔒 Защита от потери файлов

Проект включает систему защиты от потери файлов:

1. **Проверка целостности** (`npm run check`) - проверяет наличие всех необходимых файлов
2. **Восстановление структуры** (`npm run restore`) - восстанавливает отсутствующие файлы
3. **Документация** - полное описание архитектуры и систем
4. **Валидация данных** - проверка всех входных данных

См. `INTEGRITY.md` для подробной информации.
