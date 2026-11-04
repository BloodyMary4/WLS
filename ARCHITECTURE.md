# Архитектура проекта

## 🏗️ Общая структура

Warhammer Life Simulator построен на основе модульной архитектуры с чётким разделением ответственности.

## 📦 Основные модули

### 1. Игровая логика (`src/game/`)

#### Типы данных (`types.ts`)
Определяет все TypeScript интерфейсы и типы:
- `CharacterStats` - полное состояние персонажа
- `GameState` - состояние игры
- `Choice` и `ChoiceEffects` - выборы и их эффекты
- `GameEvent` - игровые события
- `FactionRelations` - отношения с фракциями
- `LegacyData` - данные наследия

#### Конфигурация (`config.ts`)
Централизованное хранилище всех констант:
```typescript
export const GAME_CONFIG = {
  AGE_THRESHOLDS: { BABY: 0, TODDLER: 2, CHILD: 6, TEEN: 13, ADULT: 18 },
  STAT_THRESHOLDS: { MAX_VALUE: 10, MIN_VALUE: 0, MUTATION_DAMAGE: 7 },
  HEALTH: { CRITICAL_PERCENT: 0.25, LOW_PERCENT: 0.5 },
  // ... другие константы
};
```

#### Данные (`data.ts`)
Игровые данные и генерация:
- Планеты по расам
- Имена персонажей
- Сословия
- Информация о расах (`RACE_INFO`)
- Генерация персонажа (`generateCharacter`)
- Маршрутизатор событий (`getEventForAge`)
- Сообщения о смерти (`getDeathMessage`)

#### Утилиты (`utils.ts`)
Вспомогательные функции:
- `generateWorldEvent()` - генерация глобальных событий
- `applyChoiceEffects()` - применение эффектов выбора
- `updateAgeStatus()` - обновление возраста и статуса
- `applyMicroEventEffects()` - применение эффектов микро-событий
- Функции получения цветов для UI

#### Валидация (`validation.ts`)
Проверка корректности данных:
- `validateCharacter()` - валидация персонажа
- `validateEvent()` - валидация события
- `validateGameState()` - валидация состояния игры
- `validateLegacyData()` - валидация данных наследия
- `createDefaultEvent()` - создание события по умолчанию

#### Достижения (`achievements.ts`)
Система достижений:
- 25+ достижений различных категорий
- Функция `checkAchievements()` для проверки
- Условные достижения на основе характеристик

#### Микро-события (`microEvents.ts`)
Случайные события между ходами:
- 25+ микро-событий
- Фильтрация по расе персонажа
- Функция `triggerMicroEvent()` для активации

#### Наследие (`legacy.ts`)
Система наследия между играми:
- Сохранение в localStorage
- Бонусы за предыдущие игры
- Статистика смертей и достижений

#### Сохранения (`saveSystem.ts`)
Автоматическое сохранение:
- Сохранение состояния игры
- Загрузка сохранений
- Валидация данных сохранений
- Информация о сохранении

#### Аудио (`audio.ts`)
Процедурная музыкальная система:
- Класс `GrimdarkAmbience`
- Многослойные дроны (16 осцилляторов)
- Стерео-панорамирование
- Динамические настроения
- Звуковые эффекты

### 2. События по расам (`src/game/events/`)

Каждая раса имеет свой модуль событий:

#### `humanEvents.ts`
- События для человека
- Система зависимостей (артефакт, повстанцы, ксенос)
- События для всех возрастов (0-100+)

#### `orkEvents.ts`
- События для орка
- Система зависимостей (инженер, пощада)
- WAAAGH! механика

#### `eldarEvents.ts`
- События для эльдара
- Система зависимостей (изгой, пси-рост, союз с людьми)
- Псионические механики

#### `darkEldarEvents.ts`
- События для тёмного эльдара
- Система зависимостей (совесть, политика)
- ГОЛОД механика

#### `tauEvents.ts`
- События для тау
- Система зависимостей (сомнения, инновации, эмоции)
- Высшее Благо механика

#### `gretchinEvents.ts`
- События для гретчина
- Система зависимостей (лидер, технологии, контакт с людьми)
- Механика выживания

#### `index.ts`
Экспорт всех функций событий для использования в `data.ts`

### 3. React хуки (`src/hooks/`)

#### `useGameState.ts`
Центральный хук управления состоянием игры:
- Управление состоянием игры
- Обработка выбора
- Проверка условий смерти
- Переход к следующему году
- Начало новой игры
- Загрузка сохранений
- Автоматическое сохранение

**Ключевые функции:**
```typescript
const {
  gameState,
  resultText,
  showResult,
  lastChoice,
  unlockedAchievements,
  newAchievement,
  handleChoice,
  proceedToNextYear,
  startNewGame,
  loadSavedGame,
  hasSave,
} = useGameState();
```

### 4. React компоненты (`src/components/`)

#### `icons.tsx` — иконочный двор (полная гравировка)
Библиотека из ~35 векторных глифов: viewBox 24, единый штрих `currentColor`, stroke-width 1.6, скруглённые концы. Каждый знак детализован штриховыми слоями с opacity .4–.9 (светотень гравюры): оперение аквилы, зубья и ступица шестерён, языки пламени, грани кристаллов, долы клинков, сегментация червей, ляссе кодексов, заклёпки ящиков — все элементы внутри кадра 24×24, внешние контуры и габариты стабильны (перенос по keyChoice/сейвам не зависит от стиля). `GameIcon` + `resolveIcon`: старые эмодзи в пропсах icon автоматически маппятся на имена глифов; неизвестное имя — ромб-заглушка, «тофу» невозможен.

#### `AudioController.tsx`
Компонент управления аудио:
- Кнопки управления музыкой
- Регулировка громкости
- Отображение статуса воспроизведения
- Интеграция с `GrimdarkAmbience`

### 5. Главный компонент (`src/App.tsx`)

Основной компонент приложения:
- Стартовый экран
- Игровой экран
- Экран смерти
- Управление состоянием через `useGameState`
- Клавиатурные сокращения
- Адаптивный дизайн

## 🔄 Поток данных

### 1. Инициализация игры
```
App.tsx → useGameState() → startNewGame()
  ↓
generateCharacter() → создание персонажа
  ↓
getEventForAge(0) → начальное событие
  ↓
setGameState() → установка состояния
```

### 2. Обработка выбора
```
Пользователь выбирает вариант
  ↓
handleChoice(choice)
  ↓
applyChoiceEffects() → применение эффектов
  ↓
updateAgeStatus() → обновление возраста
  ↓
checkAchievements() → проверка достижений
  ↓
checkDeathConditions() → проверка смерти
  ↓
getEventForAge() → следующее событие
  ↓
setGameState() → обновление состояния
```

### 3. Переход к следующему году
```
proceedToNextYear()
  ↓
triggerMicroEvent() → проверка микро-событий
  ↓
applyMicroEventEffects() → применение эффектов
  ↓
setGameState() → обновление состояния
```

### 4. Автоматическое сохранение
```
useEffect([gameState, unlockedAchievements])
  ↓
saveGame() → сохранение в localStorage
```

## 🎯 Система зависимостей

Ключевые выборы сохраняются в `character.keyChoices`:

```typescript
// Сохранение выбора
if (effects.keyChoice) {
  newChar.keyChoices = [...newChar.keyChoices, effects.keyChoice];
}

// Проверка в событиях
if (age >= 6 && c.keyChoices && c.keyChoices.includes('found_artifact')) {
  return { /* специальное событие */ };
}
```

## 🎵 Аудио система

### Архитектура
```
GrimdarkAmbience (singleton)
  ├── createDrone() - 16 осцилляторов
  ├── createNoise() - розовый шум
  ├── createWindLayer() - слой ветра
  ├── createWhisperLayer() - слой шёпота
  ├── createLFO() - модуляция
  └── startMelodicEvents() - мелодические события
      ├── playDarkNote()
      ├── playChord()
      ├── playAtmospheric()
      ├── playBellTone()
      └── playDeepPulse()
```

### Динамические настроения
```typescript
setMood('normal' | 'tense' | 'danger' | 'epic')
```
Автоматически меняется на основе состояния персонажа.

## 📊 Состояние игры

### Структура `GameState`
```typescript
interface GameState {
  character: CharacterStats;      // Состояние персонажа
  currentEvent: GameEvent;        // Текущее событие
  history: string[];              // История событий
  gameOver: boolean;              // Флаг окончания игры
  deathMessage: string;           // Сообщение о смерти
}
```

### Структура `CharacterStats`
```typescript
interface CharacterStats {
  name: string;
  race: Race;
  age: number;
  health: number;
  maxHealth: number;
  sanity: number;
  warpCorruption: number;
  warpAttention: number;
  luck: number;
  credits: number;
  food: number;
  ammo: number;
  caste: string;
  planet: string;
  status: string;
  influence: number;
  inventory: string[];
  augmentics: string[];
  factionRelations: FactionRelations;
  hiddenParams: { /* характеристики */ };
  traits: string[];
  keyChoices: string[];
  worldEvent?: string;
}
```

## 🔒 Валидация данных

### Уровни валидации

1. **Валидация персонажа**
   - Проверка обязательных полей
   - Проверка числовых значений
   - Проверка характеристик

2. **Валидация события**
   - Проверка текста
   - Проверка выборов
   - Проверка эффектов

3. **Валидация состояния игры**
   - Проверка персонажа
   - Проверка события
   - Проверка истории

4. **Валидация наследия**
   - Проверка типов данных
   - Проверка значений
   - Проверка массивов

## 🎨 UI архитектура

### Компоненты
```
App
  ├── AudioController (fixed)
  ├── Header (fixed)
  │   ├── Character Info
  │   └── Stats Grid
  ├── Main
  │   ├── Sidebar
  │   │   ├── Characteristics
  │   │   ├── Race Features
  │   │   ├── Equipment
  │   │   └── History
  │   └── Event Card
  │       ├── Event Text
  │       └── Choices / Result
  └── Footer
```

### Адаптивность
- Mobile: одноколоночный layout
- Tablet: двухколоночный layout
- Desktop: трёхколоночный layout

## 🚀 Производительность

### Оптимизации

1. **Мемоизация**
   ```typescript
   const raceInfo = useMemo(() => RACE_INFO[character.race], [character.race]);
   ```

2. **Callback оптимизация**
   ```typescript
   const handleChoice = useCallback((choice: Choice) => {
     // ...
   }, [gameState, unlockedAchievements]);
   ```

3. **Ленивая загрузка**
   - События загружаются только при необходимости
   - Микро-события генерируются по требованию

4. **Эффективное обновление состояния**
   - Использование immutable updates
   - Минимизация перерисовок

## 📝 Стандарты кодирования

### Именование
- Компоненты: PascalCase (`AudioController`)
- Функции: camelCase (`handleChoice`)
- Константы: UPPER_SNAKE_CASE (`GAME_CONFIG`)
- Типы: PascalCase (`CharacterStats`)

### Структура файлов
- Один модуль = одна ответственность
- Максимальный размер файла: ~500 строк
- Экспорт только публичного API

### Комментарии
- JSDoc для всех публичных функций
- Комментарии для сложной логики
- Примеры использования

## 🔮 Будущие улучшения

### Планируемые функции
1. Система квестов
2. Система репутации с NPC
3. Больше событий для поздних возрастов
4. Система крафта
5. Мультиплеер (опционально)

### Технические улучшения
1. Unit-тесты
2. Integration-тесты
3. E2E-тесты
4. CI/CD pipeline
5. Code splitting

---

**Версия архитектуры**: 1.0.0  
**Последнее обновление**: 2024
