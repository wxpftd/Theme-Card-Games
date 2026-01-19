import {
  RandomEventDefinition,
  PlayerState,
  GameState,
  ResolvedEffect,
  RandomEventCustomHandler,
  EffectContext,
} from '@theme-card-games/core';

/**
 * Custom handler for the health report random event
 * Effects vary based on current health value:
 * - Health > 80: Great health! +10 happiness, +5 energy
 * - Health 50-80: Normal, +5 health
 * - Health 30-50: Mild warning, -3 happiness, +10 health (forced rest)
 * - Health < 30: Serious warning, -10 happiness, +20 health (mandatory leave)
 */
export const healthReportHandler: RandomEventCustomHandler = (
  _event: RandomEventDefinition,
  player: PlayerState,
  _gameState: GameState,
  _context: EffectContext
): ResolvedEffect[] => {
  const health = player.stats.health ?? 50;
  const results: ResolvedEffect[] = [];

  if (health > 80) {
    // Great health
    const happinessBefore = player.stats.happiness ?? 0;
    player.stats.happiness = happinessBefore + 10;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: happinessBefore,
      after: player.stats.happiness,
    });

    const energyBefore = player.resources.energy ?? 0;
    player.resources.energy = energyBefore + 2;
    results.push({
      type: 'gain_resource',
      target: player.id,
      before: energyBefore,
      after: player.resources.energy,
    });
  } else if (health >= 50) {
    // Normal health
    const healthBefore = player.stats.health ?? 0;
    player.stats.health = healthBefore + 5;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: healthBefore,
      after: player.stats.health,
    });
  } else if (health >= 30) {
    // Mild warning
    const happinessBefore = player.stats.happiness ?? 0;
    player.stats.happiness = happinessBefore - 3;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: happinessBefore,
      after: player.stats.happiness,
    });

    const healthBefore = player.stats.health ?? 0;
    player.stats.health = healthBefore + 10;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: healthBefore,
      after: player.stats.health,
    });
  } else {
    // Serious warning - health < 30
    const happinessBefore = player.stats.happiness ?? 0;
    player.stats.happiness = happinessBefore - 10;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: happinessBefore,
      after: player.stats.happiness,
    });

    const healthBefore = player.stats.health ?? 0;
    player.stats.health = healthBefore + 20;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: healthBefore,
      after: player.stats.health,
    });

    // Also lose some performance due to forced leave
    const perfBefore = player.stats.performance ?? 0;
    player.stats.performance = perfBefore - 5;
    results.push({
      type: 'modify_stat',
      target: player.id,
      before: perfBefore,
      after: player.stats.performance,
    });
  }

  return results;
};

/**
 * All custom random event handlers for the bigtech-worker theme
 */
export const randomEventCustomHandlers: Record<string, RandomEventCustomHandler> = {
  health_report_handler: healthReportHandler,
};

export default randomEventCustomHandlers;
