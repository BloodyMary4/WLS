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
- Vitest — 68 тестов (src/__tests__/)
- GitHub Actions: ci.yml (typecheck+check+test+build), deploy.yml (GitHub Pages), desktop-build.yml (Windows .exe → Release по тегу v*)

## Как делать изменения (рабочий процесс)
1. Правки в /workspace (клон репозитория).
2. Проверить: `npm run typecheck && npm test && npm run build`.
3. Коммит (`feat:`/`fix:`/`docs:`/`style:`), затем push в main.
4. Push требует токен GitHub от пользователя (fine-grained, Contents: Read and write на BloodyMary4/WLS). Токены не хранятся в репо; если пуш не проходит — попросить новый токен или отдать пользователю патч/bundle.
5. Веб обновляется автоматически после push в main (Pages, ~1–2 мин). Для новой .exe — создать тег `git tag vX.Y.Z && git push origin vX.Y.Z`, дождаться Desktop Build, артефакты появятся в Releases.

## Текущее состояние кода
- Структура: src/game/ (events по расам, npcSystem, questSystem, saveSystem, achievements, audio, validation, rng.ts — детерминированный RNG с seed), src/components/, src/hooks/useGameState.ts, App.tsx (~700 строк), electron/.
- Стилистика: выполнен grimdark-редизайн (палитра, готическая типографика, пергамент) — коммит d81c1087.
- UI исправлен под 1920x1080 (шапка, уведомления, масштаб) — коммит e24f02ce.

## Открытые задачи (план по приоритету)
1. **Дизайн/визуал** (запрошен пользователем,в работе): усилить warhammer-стилистику — портреты/иконки рас, рамки событий в стиле кодексов, анимации появления текста, звуковое сопровождение фоновой атмосферы, тёмная тема по умолчанию, шрифт заголовков (например, «BattleforDorn»/gotические web-fonts).
2. Декомпозиция App.tsx на экраны: StartScreen, GameScreen, DeathScreen, EventPanel, Sidebar.
3. Единый reducer в useGameState (сейчас квесты дублируются в state.activeQuests и отдельных useState; устаревшие замыкания в handleDeath/handleChoice).
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
