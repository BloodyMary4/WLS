import { useState, useCallback, useEffect, useMemo } from 'react';
import { GameState, Choice, CharacterStats } from '../game/types';
import { generateCharacter, getEventForAge, getDeathMessage } from '../game/data';
import { getAmbience } from '../game/audio';
import { checkAchievements } from '../game/achievements';
import { triggerMicroEvent } from '../game/microEvents';
import { getLegacy, updateLegacyOnDeath, getLegacyBonuses } from '../game/legacy';
import { applyChoiceEffects, updateAgeStatus, applyMicroEventEffects } from '../game/utils';
import { GAME_CONFIG, DEATH_CAUSES } from '../game/config';
import { validateEvent, validateGameState, createDefaultEvent } from '../game/validation';
import { saveGame, loadGame, hasSave } from '../game/saveSystem';
import { randomNPCEncounter, addNPC, generateNPCEvent, updateNPCRelationship } from '../game/npcSystem';
import { checkQuests, applyQuestRewards, getAvailableQuests, createQuest } from '../game/questSystem';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<string | null>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [completedQuests, setCompletedQuests] = useState<any[]>([]);

  const deathConditions = useMemo(() => [
    {
      check: (c: CharacterStats) => c.health <= 0,
      getMessage: (c: CharacterStats) => getDeathMessage(c),
      cause: DEATH_CAUSES.HEALTH
    },
    {
      check: (c: CharacterStats) => c.sanity <= 0,
      getMessage: (c: CharacterStats) => `Разум ${c.name} не выдержал ужасов этого мира. Безумие поглотило его. Теперь он бродит по ${c.planet} как пустая оболочка, бормоча проклятия на забытых языках.`,
      cause: 'sanity'
    },
    {
      check: (c: CharacterStats) => c.warpCorruption >= 100,
      getMessage: (c: CharacterStats) => `Порча Варпа полностью поглотила ${c.name}. Его тело изменилось до неузнаваемости, а душа стала игрушкой для демонов. Инквизиция нашла лишь груду мяса, шепчущую имена богов Хаоса.`,
      cause: 'warp_corruption'
    },
    {
      check: (c: CharacterStats) => c.warpAttention >= 10,
      getMessage: (c: CharacterStats) => `Внимание Варпа привлекло демонов к ${c.name}. Разрыв в реальности поглотил его, утащив в Имматериум. Его крики echoing в Варпе будут вечны.`,
      cause: 'warp_attention'
    },
    {
      check: (c: CharacterStats) => c.hiddenParams.mutation >= GAME_CONFIG.STAT_THRESHOLDS.PSI_OVERLOAD && c.race === 'human',
      getMessage: (c: CharacterStats) => `Мутации ${c.name} стали очевидны. Инквизиция пришла ночью. Очищающее пламя — последний дар Императора.`,
      cause: DEATH_CAUSES.MUTATION
    },
    {
      check: (c: CharacterStats) => c.race === 'eldar' && (c.hiddenParams.psi || 0) >= GAME_CONFIG.STAT_THRESHOLDS.PSI_OVERLOAD,
      getMessage: (c: CharacterStats) => `Разум ${c.name} не выдержал мощи Варпа. Псионический шторм поглотил его душу. Теперь он — часть бесконечного крика.`,
      cause: DEATH_CAUSES.PSI_OVERLOAD
    },
    {
      check: (c: CharacterStats) => c.race === 'dark_eldar' && (c.hiddenParams.cruelty || 0) <= GAME_CONFIG.STAT_THRESHOLDS.CRUELTY_MINIMUM && c.age > 5,
      getMessage: (c: CharacterStats) => `ГОЛОД поглотил ${c.name}. Без боли и страданий Друкхаари угасает. Тело рассыпается в прах Коммагота.`,
      cause: DEATH_CAUSES.HUNGER
    },
    {
      check: (c: CharacterStats) => c.hiddenParams.suspicion >= GAME_CONFIG.STAT_THRESHOLDS.SUSPICION_CRITICAL && c.age > 10 && c.race === 'human',
      getMessage: (c: CharacterStats) => `Подозрения Инквизиции пали на ${c.name}. Чёрные корабли прибыли. Сопротивление бесполезно.`,
      cause: DEATH_CAUSES.INQUISITION
    }
  ], []);

  const handleDeath = useCallback((
    character: CharacterStats,
    message: string,
    cause: string,
    history: string[]
  ) => {
    if (!gameState) return;
    
    const ambience = getAmbience();
    if (ambience.getIsPlaying()) ambience.playDeathSound();
    
    const legacy = getLegacy();
    updateLegacyOnDeath(legacy, character.age, character.race, cause, unlockedAchievements);
    
    setGameState({
      ...gameState,
      character,
      history,
      gameOver: true,
      deathMessage: message,
      activeQuests,
      completedQuests,
    });
  }, [gameState, unlockedAchievements]);

  const checkDeathConditions = useCallback((character: CharacterStats, history: string[]) => {
    if (!gameState) return false;
    
    for (const condition of deathConditions) {
      if (condition.check(character)) {
        handleDeath(character, condition.getMessage(character), condition.cause, history);
        return true;
      }
    }
    
    return false;
  }, [gameState, handleDeath, deathConditions]);

  const handleChoice = useCallback((choice: Choice) => {
    if (!gameState || gameState.gameOver) return;

    const ambience = getAmbience();
    if (ambience.getIsPlaying()) {
      ambience.playEventSound();
    }

    setLastChoice(choice);
    setResultText(choice.effects.description);
    setShowResult(true);

    let newChar = applyChoiceEffects(gameState.character, choice.effects);
    newChar = updateAgeStatus(newChar);

    const newAchievementsList = checkAchievements(newChar, unlockedAchievements);
    if (newAchievementsList.length > 0) {
      setUnlockedAchievements([...unlockedAchievements, ...newAchievementsList]);
      setNewAchievement(newAchievementsList[0]);
      
      if (ambience.getIsPlaying()) {
        ambience.playAchievementSound();
      }
      
      setTimeout(() => setNewAchievement(null), GAME_CONFIG.ACHIEVEMENTS.DISPLAY_DURATION);
    }

    const historyEntry = `[Год ${newChar.age - 1}] ${gameState.currentEvent.text.substring(0, 60)}... → ${choice.text}`;
    const newHistory = [...gameState.history, historyEntry];

    if (checkDeathConditions(newChar, newHistory)) {
      return;
    }

    let nextEvent = getEventForAge(newChar.age, newChar);
    if (!validateEvent(nextEvent)) {
      nextEvent = createDefaultEvent();
    }

    setGameState({
      character: newChar,
      currentEvent: nextEvent,
      history: newHistory,
      gameOver: false,
      deathMessage: '',
      activeQuests,
      completedQuests,
    });
  }, [gameState, unlockedAchievements, checkDeathConditions]);

  const proceedToNextYear = useCallback(() => {
    if (!gameState) return;
    
    let newChar = gameState.character;
    const newHistory = [...gameState.history];
    
    // Микро-события
    const microEventResult = triggerMicroEvent(newChar);
    if (microEventResult.triggered) {
      const microEvent = microEventResult.event;
      newChar = applyMicroEventEffects(newChar, microEvent.effects);
      newHistory.push(`[Микро] ${microEvent.text} → ${microEvent.effects.description}`);
    }
    
    // Встреча с NPC (20% шанс)
    if (Math.random() < 0.2) {
      const encounter = randomNPCEncounter(newChar);
      if (encounter.npc) {
        if (encounter.type === 'new') {
          // Новая встреча
          newChar = addNPC(newChar, encounter.npc);
          const eventText = generateNPCEvent(newChar, encounter.npc);
          newHistory.push(`[NPC] ${eventText}`);
          
          // Случайное изменение отношений
          const relationshipChange = Math.floor(Math.random() * 20) - 10;
          newChar = updateNPCRelationship(newChar, encounter.npc.id, relationshipChange);
        } else {
          // Встреча с известным NPC
          const eventText = generateNPCEvent(newChar, encounter.npc);
          newHistory.push(`[NPC] ${eventText}`);
          
          // Случайное изменение отношений
          const relationshipChange = Math.floor(Math.random() * 10) - 5;
          newChar = updateNPCRelationship(newChar, encounter.npc.id, relationshipChange);
        }
      }
    }
    
    // Проверка квестов
    const { updatedQuests, completedQuests: newlyCompleted } = checkQuests(newChar, activeQuests);
    
    // Применяем награды за завершённые квесты
    let finalChar = newChar;
    const finalCompletedQuests = [...completedQuests];
    
    for (const quest of newlyCompleted) {
      finalChar = applyQuestRewards(finalChar, quest);
      finalCompletedQuests.push(quest);
      
      // Мрачное уведомление в духе Warhammer 40,000
      const completionMessages = [
        `[ИСПЫТАНИЕ] ${quest.name} завершено. Судьба отметила тебя.`,
        `[СУДЬБА] ${quest.name} - твоё имя теперь выжжено в хрониках.`,
        `[РОК] ${quest.name} - ты прошёл через тьму и вышел... изменённым.`,
        `[ЛЕГЕНДА] ${quest.name} - твои деяния будут помнить, даже когда звёзды погаснут.`
      ];
      const message = completionMessages[Math.floor(Math.random() * completionMessages.length)];
      newHistory.push(message);
    }
    
    // Добавляем новые доступные квесты
    const availableQuests = getAvailableQuests(finalChar, updatedQuests);
    const newActiveQuests = [...updatedQuests.filter(q => !q.completed)];
    
    // Автоматически добавляем первый доступный квест, если нет активных
    if (newActiveQuests.length === 0 && availableQuests.length > 0) {
      const newQuest = createQuest(availableQuests[0], finalChar.age);
      newActiveQuests.push(newQuest);
      
      // Мрачное уведомление о новом испытании
      const questMessages = [
        `[СУДЬБА] Новое испытание: ${newQuest.name}. ${newQuest.description}`,
        `[РОК] ${newQuest.name} - путь, который ты должен пройти.`,
        `[ИСПЫТАНИЕ] ${newQuest.name} - тьма ждёт тебя.`
      ];
      const message = questMessages[Math.floor(Math.random() * questMessages.length)];
      newHistory.push(message);
    }
    
    setActiveQuests(newActiveQuests);
    setCompletedQuests(finalCompletedQuests);
    
    setGameState({
      ...gameState,
      character: finalChar,
      history: newHistory,
      activeQuests: newActiveQuests,
      completedQuests: finalCompletedQuests,
    });
    
    setShowResult(false);
    setResultText('');
    setLastChoice(null);
  }, [gameState, activeQuests, completedQuests]);

  const startNewGame = useCallback(() => {
    try {
      const character = generateCharacter();
      
      if (!character) {
        console.error('Failed to generate character');
        return;
      }
      
      const legacy = getLegacy();
      const bonuses = getLegacyBonuses(legacy);
      
      character.credits += bonuses.startingCredits;
      character.health = Math.min(character.maxHealth, character.health + bonuses.startingHealthBonus);
      
      let event = getEventForAge(GAME_CONFIG.AGE_THRESHOLDS.BABY, character);
      
      if (!validateEvent(event)) {
        console.warn('Invalid event generated, using default event');
        event = createDefaultEvent();
      }
      
      const initialHistory: string[] = [];
      if (bonuses.startingCredits > 0 || bonuses.startingHealthBonus > 0) {
        initialHistory.push(`[Наследие] ${bonuses.description}`);
      }
      
      const newGameState: GameState = {
        character,
        currentEvent: event,
        history: initialHistory,
        gameOver: false,
        deathMessage: '',
        activeQuests: [],
        completedQuests: [],
      };
      
      if (!validateGameState(newGameState)) {
        console.error('Invalid game state created');
        return;
      }
      
      setGameState(newGameState);
      setResultText('');
      setShowResult(false);
      setLastChoice(null);
      setUnlockedAchievements([]);
      setNewAchievement(null);
    } catch (error) {
      console.error('Error in startNewGame:', error);
    }
  }, []);

  const loadSavedGame = useCallback(() => {
    try {
      const savedData = loadGame();
      if (savedData && validateGameState(savedData.gameState)) {
        setGameState(savedData.gameState);
        setUnlockedAchievements(savedData.unlockedAchievements);
        setResultText('');
        setShowResult(false);
        setLastChoice(null);
        setNewAchievement(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load saved game:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (gameState && !gameState.gameOver) {
      saveGame(gameState, unlockedAchievements);
    }
  }, [gameState, unlockedAchievements]);

  return {
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
    hasSave: hasSave(),
  };
}
