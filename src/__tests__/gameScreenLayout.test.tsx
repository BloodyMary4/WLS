/**
 * Смоук-тест компоновки игрового экрана (v0.3.30):
 * все три отсека («Кодекс», событие, «Хроника жизни») рендерятся с реальным
 * содержимым — пустой экран с одной иконкой невозможен незаметно.
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameScreen } from '../components/GameScreen';
import type { GameState, Choice } from '../game/types';

// jsdom не реализует matchMedia — заглушка «широкий экран» (fit-режим активен)
window.matchMedia = ((query: string) => ({
  matches: true, media: query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;



const game = {
  character: {
    name: 'Тест', race: 'human', raceName: 'Человек', age: 12, maxAge: 90,
    health: 80, maxHealth: 100, sanity: 90, warpCorruption: 5, influence: 10, luck: 5,
    credits: 100, food: 3, ammo: 10, status: 'Рождённый', planet: 'Мундорим', caste: 'Рабочий',
    inventory: [], traits: [], npcs: [], augmentics: [],
    hiddenParams: { faith: 5, cunning: 5, strength: 5, willpower: 5, mutation: 0, suspicion: 0 },
    warpAttention: 0,
  },
  currentEvent: {
    text: 'Ты открыл глаза в мире стали.',
    choices: [
      { text: 'Плакать', effects: {}, letter: 'A' },
      { text: 'Молчать', effects: {}, letter: 'B' },
    ],
  },
  history: ['М41.000 — рождение'], gameOver: false, deathMessage: '',
  activeQuests: [], completedQuests: [],
} as unknown as GameState;

const uiState = {
  game, phase: 'event', resultText: '', lastChoice: null,
  newAchievement: null, lastDeltas: null, unlockedAchievements: [],
} as any;

describe('GameScreen layout smoke (v0.3.30)', () => {
  it('renders all three bays with real content', () => {
    render(
      <GameScreen uiState={uiState} onChoice={(_: Choice) => {}} onProceed={() => {}} onNewGame={() => {}} />
    );
    // Три окна-отсека на месте (aria-label уникальны для секций)
    expect(screen.getAllByRole('region', { name: 'Кодекс' })).toHaveLength(1);
    expect(screen.getAllByRole('region', { name: 'Хроника жизни' })).toHaveLength(1);
    expect(screen.getAllByRole('region', { name: /Событие года/ })).toHaveLength(1);
    // Досье видно сразу, без сворачиваний
    expect(screen.getByText('Досье')).toBeTruthy();
    expect(screen.getByText('Мундорим')).toBeTruthy();
    // Текст события и решения видны
    expect(screen.getByText(/открыл глаза/)).toBeTruthy();
    expect(screen.getByText('Плакать')).toBeTruthy();
    expect(screen.getByText('Молчать')).toBeTruthy();
  });
});
