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
- Vitest — 82 теста (src/__tests__/), включая 14 юнит-тестов чистых переходов reducer
- GitHub Actions: ci.yml (typecheck+check+test+build), deploy.yml (GitHub Pages), desktop-build.yml (Windows .exe → Release по тегу v*)

## Как делать изменения (рабочий процесс)
1. Правки в /workspace (клон репозитория).
2. Проверить: `npm run typecheck && npm test && npm run build`.
3. Коммит (`feat:`/`fix:`/`docs:`/`style:`), затем push в main.
4. Push настроен (2026-11-01): origin = https://github.com/BloodyMary4/WLS.git, токен пользователя лежит в git credential store (файл `.git/credentials`, вне рабочего дерева и истории). Пуш из новой сессии в этом контейнере работает без вопросов; если файл будет потерян — попросить у пользователя новый fine-grained токен (Contents: Read and write на BloodyMary4/WLS).
5. Веб обновляется автоматически после push в main (Pages, ~1–2 мин). Для новой .exe — создать тег `git tag vX.Y.Z && git push origin vX.Y.Z`, дождаться Desktop Build, артефакты появятся в Releases.

## Текущее состояние кода
- Структура: src/game/ (events по расам, npcSystem, questSystem, saveSystem, achievements, audio, validation, rng.ts — детерминированный RNG с seed, **reducer.ts — единый чистый reducer игры**), src/components/ (MainMenu, GameScreen, Sidebar, GameHeader, EventCard, DeathScreen, AchievementToast, StatCard, HiddenStat, AudioController), src/hooks/ (useGameStore.ts — обёртка над reducer + исполнение эффектов; useKeyboardControls.ts), App.tsx (~90 строк, только роутинг фаз), electron/.
- Стилистика: выполнен grimdark-редизайн (палитра, готическая типографика, пергамент) — коммит d81c1087.
- UI исправлен под 1920x1080 (шапка, уведомления, масштаб) — коммит e24f02ce.

## Открытые задачи (план по приоритету)
1. **Дизайн/визуал** (запрошен пользователем,в работе): усилить warhammer-стилистику — портреты/иконки рас, рамки событий в стиле кодексов, анимации появления текста, звуковое сопровождение фоновой атмосферы, тёмная тема по умолчанию, шрифт заголовков (например, «BattleforDorn»/gotические web-fonts).
2. ~~Декомпозиция App.tsx~~ — **выполнено** (bc53c8fa/8b292c78): экраны в src/components/, App.tsx ~90 строк.
3. ~~Единый reducer~~ — **выполнено**: src/game/reducer.ts (чистые compute* + список GameEffect), useGameStore исполняет эффекты; StrictMode-safe (переходы с RNG считаются один раз вне useReducer); 14 юнит-тестов в reducer.test.ts.
4. Устранить противоречие диапазонов фракций: validateCharacter требует [-10,10], applyQuestRewards клампит [-100,100].
5. getAvailableQuests: убрать хардкод id quest_survivor → поле requirements в шаблоне квеста.
6. Опционально: PWA-режим (offline), автообновление README при релизах.

## Известные подводные камни
- Math.random() заменён на rng.ts с seed — новые системы тоже должны брать random из него (воспроизводимость партий).
- check-integrity.ts (npm run check) сверяет список файлов — при добавлении файлов обновлять его.
- Артефакты GitHub Actions требуют логина; пользователь скачивает через Releases (публичные ссылки).
- Пользователь играет на ноутбуке 1920x1080; проверять вёрстку под это разрешение.

## Ключевые коммиты истории
- Initial commit → .gitignore → синхронизация с GitHub → vitest (57→68 тестов) → rng с seed → CI/Pages/Electron workflows → релизы .exe → фиксы UI 1920x1080 → grimdark-редизайн → ссылки в README.
