export const GAME_CONFIG = {
  AGE_THRESHOLDS: {
    BABY: 0,
    TODDLER: 2,
    CHILD: 6,
    TEEN: 13,
    ADULT: 18,
    MAX_EXPECTED: 80,
    /**
     * Средний ожидаемый предел жизни по расам (лор 40K):
     * эльдар живут столетиями, орки — десятилетия в вечной войне,
     * тау короткоживущи. До этого возраста старческая хрупкость не наступает.
     */
    MAX_EXPECTED_BY_RACE: {
      human: 80,
      gretchin: 50,
      ork: 70,
      tau: 60,
      eldar: 500,
      dark_eldar: 500,
    } as Record<string, number>,
  },
  STAT_THRESHOLDS: {
    MAX_VALUE: 10,
    MIN_VALUE: 0,
    MUTATION_DAMAGE: 7,
    PSI_OVERLOAD: 10,
    SUSPICION_CRITICAL: 10,
    // Порог «маяка»: psi >= 5 — псайкер светится в Имматериуме (Ордо Малипус)
    PSI_BEACON: 5,
    CRUELTY_MINIMUM: 0,
  },
  HEALTH: {
    CRITICAL_PERCENT: 0.25,
    LOW_PERCENT: 0.5,
    MUTATION_DAMAGE_PER_YEAR: 5,
  },
  FACTION_RELATIONS: {
    // Единый диапазон отношений с фракциями: [-100, 100]
    // (совпадает с клампингом в applyQuestRewards, npcSystem и validation)
    MAX_VALUE: 100,
    MIN_VALUE: -100,
  },
  ACHIEVEMENTS: {
    DISPLAY_DURATION: 3000,
  },
  SUPPLY: {
    /** Годовое содержание: едок в Империуме дорог — паёк списывается каждый год. */
    FOOD_CONSUMPTION_PER_YEAR: 1,
    /** Цена одного пайка на военном рынке (кредиты). */
    RATION_PRICE: 2,
    /** Максимум пайков, покупаемых авторазвёртыванием за год. */
    MAX_AUTO_BUY_PER_YEAR: 5,
    /** Порог голода: ниже него здоровье тает и включается авторацион. */
    STARVATION_THRESHOLD: 1,
    /** Ниже этого запаса включается авторазвёртывание продовольствия. */
    AUTO_RATION_TARGET: 2,
    /** Минимальный запас патронов для автозакупки боеприпасов. */
    AMMO_MIN_STOCK: 3,
    /** Цена одной пачки патронов (10 шт.) на военном рынке. */
    AMMO_PACK_PRICE: 6,
    /** Сколько патронов даёт одна пачка. */
    AMMO_PACK_SIZE: 10,
    /** Резерв кредитов: автопокупка патронов не тратит последние деньги. */
    AMMO_RESERVE_MIN: 10,
    /** Патроны тратятся в бою: каждый патрон гасит 1 единицу урона (макс. 4). */
    AMMO_SHIELD_MAX: 4,
  },
  MICRO_EVENTS: {
    /** Максимум микро-событий за один переход года */
    MAX_PER_YEAR: 2,
    /** Кулдаун (в годах) после срабатывания микро-события */
    COOLDOWN_YEARS: 1,
    /** Делитель шанса срабатывания: шанс = вес события / TRIGGER_DIVISOR */
    TRIGGER_DIVISOR: 2,
  },
};

export const DEATH_CAUSES = {
  HEALTH: 'health',
  MUTATION: 'mutation',
  PSI_OVERLOAD: 'psi_overload',
  HUNGER: 'hunger',
  INQUISITION: 'inquisition',
  STARVATION: 'starvation',
};
