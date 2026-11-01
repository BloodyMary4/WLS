# WLS — Warhammer Life Simulator: состояние проекта и план работ

> Этот файл — «память» проекта для новых чатов с Qwen Coder. Начни работу с его чтения.
> Последний обновление: 2026-11-01.

## Что это
Текстовый симулятор жизни во вселенной Warhammer 40k. Игрок проживает жизнь персонажа (расы: человек, орк, гretchin, эльдар, тёмные эльдар, тау), выбирая действия в случайных событиях; есть квесты, NPC, ачивки, сохранения.

## Ссылки
- Игра (веб): https://bloodymary4.github.io/WLS/
- Репозиторий: https://github.com/BloodyMary4/WLS (ветка main)
- Релизы (.exe для ПК): https://github.com/BloodyMary4/WLS/releases/latest

## Стек
- React + TypeScript + Vite
- Electron-обёртка для ПК-версии (portable/setup .exe, сборка через CI)
- Vitest — 108 тестов (src/__tests__/), включая юнит-тесты reducer, системы квестов и микро-событий
- GitHub Actions: ci.yml (typecheck+check+test+build), deploy.yml (GitHub Pages), desktop-build.yml (Windows .exe → Release по тегу v*)

## Как делать изменения (рабочий процесс)
1. Правки в /workspace (клон репозитория).
2. Проверить: `npm run typecheck && npm test && npm run build`.
3. Коммит (`feat:`/`fix:`/`docs:`/`style:`), затем push в main.
4. Push настроен (2026-11-01): origin = https://github.com/BloodyMary4/WLS.git, токен пользователя лежит в git credential store (файл `.git/credentials`, вне рабочего дерева и истории). Пуш из новой сессии в этом контейнере работает без вопросов; если файл будет потерян — попросить у пользователя новый fine-grained токен (Contents: Read and write на BloodyMary4/WLS).
5. Веб обновляется автоматически после push в main (Pages, ~1–2 мин). Для новой .exe — создать тег `git tag vX.Y.Z && git push origin vX.Y.Z`, дождаться Desktop Build, артефакты появятся в Releases.

## Текущее состояние кода
- Структура: src/game/ (events по расам, npcSystem, questSystem, saveSystem, achievements, audio, validation, rng.ts — детерминированный RNG с seed, **reducer.ts — единый чистый reducer игры**), src/components/ (MainMenu, GameScreen, Sidebar, GameHeader, EventCard, DeathScreen, AchievementToast, StatCard, HiddenStat, AudioController), src/hooks/ (useGameStore.ts — обёртка над reducer + исполнение эффектов; useKeyboardControls.ts), App.tsx (~90 строк, только роутинг фаз), electron/.
- Стилистика: выполнен grimdark-редизайн (палитра, готическая типографика IM Fell English/Cinzel/Spectral, пергамент, зерно/виньетка) — коммит d81c1087. Добавлены анимации: разворот пергамента события (animate-parchment), золотая вспышка чуда «Император защищает» (wh-miracle), тревожное свечение критических полос (wh-bar-fill-danger), мерцание свечи и золотое сияние заголовков; favicon — Имперский Аквила (public/aquila.svg); поддержка prefers-reduced-motion.
- UI исправлен под 1920x1080 (шапка, уведомления, масштаб) — коммит e24f02ce.
- Лор-механики: «Император защищает» (imperialCreed + чудо заступничества) расширено — чудом отвратимы смерть от ран, голод, порча Варпа (≤95), внимание Варпа (≤9) и приговор Инквизиции; безумие и экстремальные мутации не отводятся. Микро-события выбираются детерминированно по весам (rng().weighted), имперские сплетни фильтруются по расе/типу мира, добавлены позорные события (поражение в поединке, кража у гретчинов, голод Ковчега тёмных эльдар). Тесты: microEvents.test.ts (5), reducer.test.ts (17).

## Открытые задачи (план по приоритету)
1. ~~Дизайн/визуал~~ — **выполнено**: готические web-шрифты (IM Fell English + Cinzel + Spectral), рамки-кодексы (wh-frame/wh-parchment с аквилами), анимации появления текста (разворот пергамента, fade/slide), амбиент-звук с разблокировкой по жесту пользователя, тёмная тема по умолчанию, favicon-Аквила, экран смерти показывает счётчик чудес заступничества. Опционально усиление: SVG-портреты рас вместо emoji.
2. ~~Декомпозиция App.tsx~~ — **выполнено** (bc53c8fa/8b292c78): экраны в src/components/, App.tsx ~90 строк.
3. ~~Единый reducer~~ — **выполнено**: src/game/reducer.ts (чистые compute* + список GameEffect), useGameStore исполняет эффекты; StrictMode-safe (переходы с RNG считаются один раз вне useReducer); 14 юнит-тестов в reducer.test.ts.
4. ~~Устранить противоречие диапазонов фракций~~ — **выполнено**: единый диапазон [-100,100] в config/validation/utils; решатель целей квестов (`resolveNumericTarget`) видит все фракции, скрытые параметры и imperialCreed; исправлен баг разбора префикса `max` (`maxImperium` давал `imperiumM` → цель «Путь Ереси» была недостижима).
5. ~~getAvailableQuests: убрать хардкод~~ — **выполнено**: поле `requirements { races?, maxAge? }` в шаблонах квестов, фильтр без id-хардкода; тесты на расовые ограничения и скрытие quest_survivor после 10 лет.
6. Опционально: PWA-режим (offline), автообновление README при релизах.

## Известные подводные камни
- Math.random() заменён на rng.ts с seed — новые системы тоже должны брать random из него (воспроизводимость партий).
- check-integrity.ts (npm run check) сверяет список файлов — при добавлении файлов обновлять его.
- Артефакты GitHub Actions требуют логина; пользователь скачивает через Releases (публичные ссылки).
- Пользователь играет на ноутбуке 1920x1080; проверять вёрстку под это разрешение.

## Ключевые коммиты истории
- Initial commit → .gitignore → синхронизация с GitHub → vitest (57→68 тестов) → rng с seed → CI/Pages/Electron workflows → релизы .exe → фиксы UI 1920x1080 → grimdark-редизайн → ссылки в README.

## Релиз v0.3.0 (2026-11-01)
- Исправлены ошибки типов и тестов после рефакторинга reducer (tsc ✅, 110/110 vitest ✅).
- Расовые пределы жизни: эльдар/тёмные эльдар 500, орки 70, тау 60, гретчины 50, человек 80 (GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED_BY_RACE).
- Мировые события (каждые 5 лет) теперь видны: блок «Мир» в Sidebar + запись [МИР] в хронику; счётчик уникальных событий → достижение «Путешественник» (≥3).
- Убран двойной декремент microEventCooldown (остался только в triggerMicroEvent).
- Шанс микро-событий: вес / MICRO_EVENTS.TRIGGER_DIVISOR (без магического *2).
- Достижение за 2+ чуда «Император защищает» (intercessionCount).
- Тег v0.3.0 → GitHub Actions Desktop Build собирает Windows setup.exe + portable.exe и публикует GitHub Release.
