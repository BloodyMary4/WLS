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
    CRUELTY_MINIMUM: 0,
  },
  HEALTH: {
    CRITICAL_PERCENT: 0.25,
    LOW_PERCENT: 0.5,
    MUTATION_DAMAGE_PER_YEAR: 5,
  },
  FACTION_RELATIONS: {
    MAX_VALUE: 10,
    MIN_VALUE: -10,
  },
  ACHIEVEMENTS: {
    DISPLAY_DURATION: 3000,
  },
};

export const DEATH_CAUSES = {
  HEALTH: 'health',
  MUTATION: 'mutation',
  PSI_OVERLOAD: 'psi_overload',
  HUNGER: 'hunger',
  INQUISITION: 'inquisition',
};
