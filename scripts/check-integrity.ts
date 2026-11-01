#!/usr/bin/env node

/**
 * Скрипт проверки целостности проекта
 * Проверяет наличие всех необходимых файлов
 */

import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_FILES = [
  // Основные файлы
  'src/App.tsx',
  'src/main.tsx',
  'src/index.css',
  'index.html',
  
  // Игровая логика
  'src/game/types.ts',
  'src/game/config.ts',
  'src/game/data.ts',
  'src/game/utils.ts',
  'src/game/validation.ts',
  'src/game/achievements.ts',
  'src/game/microEvents.ts',
  'src/game/legacy.ts',
  'src/game/saveSystem.ts',
  'src/game/audio.ts',
  
  // События по расам
  'src/game/events/index.ts',
  'src/game/events/humanEvents.ts',
  'src/game/events/orkEvents.ts',
  'src/game/events/eldarEvents.ts',
  'src/game/events/darkEldarEvents.ts',
  'src/game/events/tauEvents.ts',
  'src/game/events/gretchinEvents.ts',
  
  // Хуки и компоненты
  'src/hooks/useGameState.ts',
  'src/components/AudioController.tsx',

  // Тесты
  'vitest.config.ts',
  'src/game/testHelpers.ts',
  'src/__tests__/utils.test.ts',
  'src/__tests__/validation.test.ts',
  'src/__tests__/saveSystem.test.ts',
  'src/__tests__/questsAchievements.test.ts',

  // Документация
  'README.md',
  'INTEGRITY.md',
  'ARCHITECTURE.md',
];

const REQUIRED_DIRECTORIES = [
  'src',
  'src/game',
  'src/game/events',
  'src/hooks',
  'src/components',
];

function checkIntegrity() {
  const rootDir = process.cwd();
  const missingFiles: string[] = [];
  const missingDirs: string[] = [];
  
  console.log('🔍 Проверка целостности проекта...\n');
  
  // Проверка директорий
  console.log('📁 Проверка директорий:');
  for (const dir of REQUIRED_DIRECTORIES) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${dir}`);
    } else {
      console.log(`  ❌ ${dir} - ОТСУТСТВУЕТ`);
      missingDirs.push(dir);
    }
  }
  
  console.log('\n📄 Проверка файлов:');
  
  // Проверка файлов
  for (const file of REQUIRED_FILES) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const size = stats.size;
      console.log(`  ✅ ${file} (${(size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`  ❌ ${file} - ОТСУТСТВУЕТ`);
      missingFiles.push(file);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (missingFiles.length === 0 && missingDirs.length === 0) {
    console.log('✅ Все файлы и директории на месте!');
    console.log('📊 Статистика:');
    console.log(`   - Проверено файлов: ${REQUIRED_FILES.length}`);
    console.log(`   - Проверено директорий: ${REQUIRED_DIRECTORIES.length}`);
    console.log(`   - Пропущено: 0`);
    process.exit(0);
  } else {
    console.log('❌ Обнаружены проблемы:');
    console.log(`   - Пропущено файлов: ${missingFiles.length}`);
    console.log(`   - Пропущено директорий: ${missingDirs.length}`);
    
    if (missingFiles.length > 0) {
      console.log('\n📄 Отсутствующие файлы:');
      missingFiles.forEach(file => console.log(`   - ${file}`));
    }
    
    if (missingDirs.length > 0) {
      console.log('\n📁 Отсутствующие директории:');
      missingDirs.forEach(dir => console.log(`   - ${dir}`));
    }
    
    console.log('\n💡 Запустите "npm run restore" для восстановления структуры');
    process.exit(1);
  }
}

checkIntegrity();
