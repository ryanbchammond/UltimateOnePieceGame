import type {
  ActiveEffect,
  BattleAction,
  BattleLogEntry,
  BattleState,
  Fighter,
  FighterDefinition,
  Move,
  Side,
  StatEffect,
} from './types';
import { describeMultiplier, elementLabels, getTypeMultiplier } from './typeEffectiveness';

export const desperateStrike = {
  id: 'desperate-strike',
  name: 'Desperate Strike',
  element: 'brawler',
  effect: 'damage',
  power: 1,
  maxPp: 1,
} satisfies Move;

function livingFighters(state: BattleState, side?: Side): Fighter[] {
  return state.fighters.filter(
    (fighter) => fighter.hp > 0 && (side === undefined || fighter.side === side),
  );
}

function buildTurnOrder(fighters: Fighter[]): string[] {
  return fighters
    .filter((fighter) => fighter.hp > 0)
    .sort(
      (left, right) =>
        right.speed - left.speed ||
        (left.side === right.side ? left.slot - right.slot : left.side === 'player' ? -1 : 1),
    )
    .map((fighter) => fighter.id);
}

function assertValidMove(move: Move): void {
  if (!move.id || !move.name || !move.element) throw new Error('Every move requires an id, name, and element.');
  if (!Number.isInteger(move.maxPp) || move.maxPp <= 0) {
    throw new Error(`${move.name} requires a positive whole-number PP limit.`);
  }

  if (move.effect === 'damage' || move.effect === 'multi-target') {
    if (!Number.isFinite(move.power) || move.power <= 0) {
      throw new Error(`${move.name} requires a positive damage power.`);
    }
    return;
  }

  if (move.effect === 'guard') {
    if (
      !Number.isFinite(move.damageReductionPercent) ||
      move.damageReductionPercent <= 0 ||
      move.damageReductionPercent >= 100
    ) {
      throw new Error(`${move.name} requires damage reduction between 0 and 100 percent.`);
    }
    return;
  }

  if (move.effect === 'stat') {
    const validDirection =
      (move.target === 'self' && move.modifierPercent > 0) ||
      (move.target === 'enemy' && move.modifierPercent < 0);
    if (
      !['attack', 'defense'].includes(move.stat) ||
      !Number.isFinite(move.modifierPercent) ||
      !validDirection ||
      !Number.isInteger(move.durationRounds) ||
      move.durationRounds <= 0 ||
      (move.damageTypeOverride !== undefined && move.target !== 'self')
    ) {
      throw new Error(`${move.name} has an invalid stat-effect payload.`);
    }
    return;
  }

  throw new Error('Unknown move effect.');
}

function addLog(
  state: BattleState,
  message: string,
  tone: BattleLogEntry['tone'],
): BattleState {
  return {
    ...state,
    log: [...state.log, { id: state.nextLogId, message, tone }].slice(-24),
    nextLogId: state.nextLogId + 1,
  };
}

function advanceRoundEffects(state: BattleState): BattleState {
  const expired: string[] = [];
  const fighters = state.fighters.map((fighter) => {
    const activeEffects: ActiveEffect[] = [];
    fighter.activeEffects.forEach((effect) => {
      if (effect.effect !== 'stat') {
        activeEffects.push(effect);
      } else if (effect.remainingRounds <= 1) {
        expired.push(`${fighter.name}'s ${effect.name} ended.`);
      } else {
        activeEffects.push({ ...effect, remainingRounds: effect.remainingRounds - 1 });
      }
    });
    return { ...fighter, activeEffects };
  });

  return expired.reduce(
    (next, message) => addLog(next, message, 'effect'),
    { ...state, fighters },
  );
}

function settleTurn(state: BattleState): BattleState {
  const playerAlive = livingFighters(state, 'player').length > 0;
  const enemyAlive = livingFighters(state, 'enemy').length > 0;

  if (!playerAlive || !enemyAlive) {
    const winner: Side = playerAlive ? 'player' : 'enemy';
    const result = winner === 'player' ? 'Victory! The enemy crew is defeated.' : 'Defeat. Your crew has fallen.';
    return addLog(
      { ...state, status: winner === 'player' ? 'victory' : 'defeat', winner },
      result,
      'result',
    );
  }

  let nextIndex = state.turnIndex + 1;
  while (nextIndex < state.turnOrder.length) {
    const next = state.fighters.find((fighter) => fighter.id === state.turnOrder[nextIndex]);
    if (next && next.hp > 0) return { ...state, turnIndex: nextIndex };
    nextIndex += 1;
  }

  const nextRound = state.round + 1;
  const advanced = advanceRoundEffects(state);
  return addLog(
    {
      ...advanced,
      round: nextRound,
      turnOrder: buildTurnOrder(advanced.fighters),
      turnIndex: 0,
    },
    `Round ${nextRound} begins.`,
    'round',
  );
}

export function createBattle(definitions: FighterDefinition[]): BattleState {
  const playerCount = definitions.filter((fighter) => fighter.side === 'player').length;
  const enemyCount = definitions.filter((fighter) => fighter.side === 'enemy').length;

  if (playerCount < 1 || playerCount > 4 || enemyCount < 1 || enemyCount > 4) {
    throw new Error('A battle requires between one and four fighters on each side.');
  }

  const ids = new Set(definitions.map((fighter) => fighter.id));
  if (ids.size !== definitions.length) throw new Error('Every fighter must have a unique id.');
  if (definitions.some((fighter) => fighter.moves.length === 0)) {
    throw new Error('Every fighter must have at least one move.');
  }
  definitions.forEach((fighter) => {
    if (
      fighter.types.length < 1 ||
      fighter.types.length > 3 ||
      new Set(fighter.types).size !== fighter.types.length
    ) {
      throw new Error(`${fighter.name} must have between one and three unique types.`);
    }
    if (
      fighter.side === 'enemy' &&
      (!Number.isInteger(fighter.battleIq) || fighter.battleIq! < 0 || fighter.battleIq! > 100)
    ) {
      throw new Error(`${fighter.name} requires a whole-number Battle IQ from 0 to 100.`);
    }
    if (new Set(fighter.moves.map((move) => move.id)).size !== fighter.moves.length) {
      throw new Error(`${fighter.name} must have unique move ids.`);
    }
    fighter.moves.forEach(assertValidMove);
  });

  const fighters = definitions.map((fighter) => ({
    ...fighter,
    hp: fighter.maxHp,
    activeEffects: [],
    movePp: Object.fromEntries(
      fighter.moves.map((move) => [
        move.id,
        Math.max(0, Math.min(move.maxPp, fighter.initialMovePp?.[move.id] ?? move.maxPp)),
      ]),
    ),
  }));
  const state: BattleState = {
    fighters,
    round: 1,
    turnOrder: buildTurnOrder(fighters),
    turnIndex: 0,
    status: 'active',
    winner: null,
    log: [],
    nextLogId: 1,
  };

  return addLog(state, 'Round 1 begins.', 'round');
}

export function getCurrentFighter(state: BattleState): Fighter | null {
  if (state.status !== 'active') return null;
  const id = state.turnOrder[state.turnIndex];
  return state.fighters.find((fighter) => fighter.id === id && fighter.hp > 0) ?? null;
}

export function getValidTargets(state: BattleState, actor: Fighter, move?: Move): Fighter[] {
  if (move?.effect === 'guard' || (move?.effect === 'stat' && move.target === 'self')) {
    return actor.hp > 0 ? [actor] : [];
  }
  const targetSide: Side = actor.side === 'player' ? 'enemy' : 'player';
  return livingFighters(state, targetSide);
}

export function getRemainingPp(fighter: Fighter, move: Move): number {
  return fighter.movePp[move.id] ?? move.maxPp;
}

export function getUsableMoves(fighter: Fighter): Move[] {
  const usable = fighter.moves.filter((move) => getRemainingPp(fighter, move) > 0);
  return usable.length > 0 ? usable : [desperateStrike];
}

export function getEffectiveMoveElement(fighter: Fighter, move: Move): Move['element'] {
  if (move.effect !== 'damage' && move.effect !== 'multi-target') return move.element;
  const override = fighter.activeEffects.find(
    (effect): effect is StatEffect =>
      effect.effect === 'stat' && effect.damageTypeOverride !== undefined,
  )?.damageTypeOverride;
  return override ?? move.element;
}

function getEffectiveStat(fighter: Fighter, stat: 'attack' | 'defense'): number {
  const modifierPercent = fighter.activeEffects.reduce(
    (total, effect) =>
      effect.effect === 'stat' && effect.stat === stat ? total + effect.modifierPercent : total,
    0,
  );
  return Math.max(0, Math.round(fighter[stat] * (1 + modifierPercent / 100)));
}

export function calculateDamage(actor: Fighter, target: Fighter, move: Move): number {
  if (move.effect !== 'damage' && move.effect !== 'multi-target') {
    throw new Error(`${move.name} does not deal damage.`);
  }

  const baseDamage = Math.max(
    1,
    move.power + getEffectiveStat(actor, 'attack') - getEffectiveStat(target, 'defense'),
  );
  const multiplier = getTypeMultiplier(
    getEffectiveMoveElement(actor, move),
    target.types,
    target.devilFruitUser,
  );
  const weaknessDamage = baseDamage * multiplier;
  const guardReduction = target.activeEffects.reduce(
    (largest, effect) =>
      effect.effect === 'guard' ? Math.max(largest, effect.damageReductionPercent) : largest,
    0,
  );
  return Math.max(1, Math.round(weaknessDamage * (1 - guardReduction / 100)));
}

function removeActingGuard(state: BattleState, actor: Fighter): BattleState {
  const guarded = actor.activeEffects.some((effect) => effect.effect === 'guard');
  if (!guarded) return state;

  return addLog(
    {
      ...state,
      fighters: state.fighters.map((fighter) =>
        fighter.id === actor.id
          ? {
              ...fighter,
              activeEffects: fighter.activeEffects.filter((effect) => effect.effect !== 'guard'),
            }
          : fighter,
      ),
    },
    `${actor.name}'s guard ended as their next action began.`,
    'effect',
  );
}

function getEnemyTarget(state: BattleState, actor: Fighter, targetId: string): Fighter {
  const target = state.fighters.find((candidate) => candidate.id === targetId);
  if (!target || target.hp <= 0 || target.side === actor.side) {
    throw new Error('Choose a living fighter on the opposing crew.');
  }
  return target;
}

function applyStatEffect(
  state: BattleState,
  target: Fighter,
  move: Extract<Move, { effect: 'stat' }>,
): BattleState {
  const matches = (effect: StatEffect) =>
    effect.stat === move.stat && effect.modifierPercent === move.modifierPercent;
  const existing = target.activeEffects.find(
    (effect): effect is StatEffect => effect.effect === 'stat' && matches(effect),
  );
  const applied: StatEffect = {
    effect: 'stat',
    name: move.name,
    stat: move.stat,
    modifierPercent: move.modifierPercent,
    remainingRounds: move.durationRounds,
    damageTypeOverride: move.damageTypeOverride,
  };
  const fighters = state.fighters.map((fighter) =>
    fighter.id === target.id
      ? {
          ...fighter,
          activeEffects: [
            ...fighter.activeEffects.filter(
              (effect) => effect.effect !== 'stat' || !matches(effect),
            ),
            applied,
          ],
        }
      : fighter,
  );
  const direction = move.modifierPercent > 0 ? 'rose' : 'fell';
  return addLog(
    { ...state, fighters },
    `${target.name}'s ${move.stat} ${direction} by ${Math.abs(move.modifierPercent)}% for ${move.durationRounds} rounds${move.damageTypeOverride ? ` and damaging moves became ${elementLabels[move.damageTypeOverride]} type` : ''}${existing ? ' (duration refreshed).' : '.'}`,
    'effect',
  );
}

function applyDamage(
  state: BattleState,
  actor: Fighter,
  target: Fighter,
  move: Extract<Move, { effect: 'damage' | 'multi-target' }>,
): BattleState {
  const currentActor = state.fighters.find((fighter) => fighter.id === actor.id) ?? actor;
  const currentTarget = state.fighters.find((fighter) => fighter.id === target.id) ?? target;
  const damage = calculateDamage(currentActor, currentTarget, move);
  const targetHp = Math.max(0, currentTarget.hp - damage);
  const effectiveElement = getEffectiveMoveElement(currentActor, move);
  const multiplier = getTypeMultiplier(
    effectiveElement,
    currentTarget.types,
    currentTarget.devilFruitUser,
  );
  const guarded = currentTarget.activeEffects.some((effect) => effect.effect === 'guard');
  let next = {
    ...state,
    fighters: state.fighters.map((fighter) =>
      fighter.id === currentTarget.id ? { ...fighter, hp: targetHp } : fighter,
    ),
  };

  next = addLog(
    next,
    `${actor.name} used ${move.name}${effectiveElement !== move.element ? ` as ${effectiveElement} type` : ''} on ${target.name} for ${damage} damage (${multiplier}× · ${describeMultiplier(multiplier)})${guarded ? ' through their guard.' : '.'}`,
    'damage',
  );
  if (targetHp === 0) next = addLog(next, `${target.name} was defeated.`, 'faint');
  return next;
}

export function resolveAction(state: BattleState, action: BattleAction): BattleState {
  if (state.status !== 'active') throw new Error('The battle is already over.');

  const actor = getCurrentFighter(state);
  if (!actor || actor.id !== action.actorId) throw new Error('That fighter cannot act now.');

  const authoredMove = actor.moves.find((candidate) => candidate.id === action.moveId);
  const canUseDesperateStrike =
    action.moveId === desperateStrike.id &&
    actor.moves.every((candidate) => getRemainingPp(actor, candidate) === 0);
  const move = authoredMove ?? (canUseDesperateStrike ? desperateStrike : undefined);
  if (!move) throw new Error('That move does not belong to the acting fighter.');
  if (authoredMove && getRemainingPp(actor, authoredMove) <= 0) {
    throw new Error(`${authoredMove.name} has no PP remaining.`);
  }

  let next = removeActingGuard(state, actor);
  if (authoredMove) {
    next = {
      ...next,
      fighters: next.fighters.map((fighter) =>
        fighter.id === actor.id
          ? {
              ...fighter,
              movePp: {
                ...fighter.movePp,
                [authoredMove.id]: Math.max(0, getRemainingPp(fighter, authoredMove) - 1),
              },
            }
          : fighter,
      ),
    };
  }
  const actingFighter = next.fighters.find((fighter) => fighter.id === actor.id) ?? actor;

  if (move.effect === 'guard') {
    if (action.targetId !== actor.id) throw new Error('Guard must target the acting fighter.');
    next = {
      ...next,
      fighters: next.fighters.map((fighter) =>
        fighter.id === actor.id
          ? {
              ...fighter,
              activeEffects: [
                ...fighter.activeEffects.filter((effect) => effect.effect !== 'guard'),
                {
                  effect: 'guard' as const,
                  name: move.name,
                  damageReductionPercent: move.damageReductionPercent,
                },
              ],
            }
          : fighter,
      ),
    };
    next = addLog(
      next,
      `${actor.name} used ${move.name} and will reduce incoming damage by ${move.damageReductionPercent}% until their next action.`,
      'effect',
    );
  } else if (move.effect === 'stat') {
    const target =
      move.target === 'self'
        ? actingFighter
        : getEnemyTarget(next, actingFighter, action.targetId);
    if (move.target === 'self' && action.targetId !== actor.id) {
      throw new Error('That buff must target the acting fighter.');
    }
    next = applyStatEffect(next, target, move);
  } else if (move.effect === 'multi-target') {
    getEnemyTarget(next, actingFighter, action.targetId);
    const targets = getValidTargets(next, actingFighter, move);
    targets.forEach((target) => {
      next = applyDamage(next, actingFighter, target, move);
    });
  } else {
    const target = getEnemyTarget(next, actingFighter, action.targetId);
    next = applyDamage(next, actingFighter, target, move);
  }
  return settleTurn(next);
}

export function chooseEnemyAction(
  state: BattleState,
  random: () => number = Math.random,
): BattleAction {
  const actor = getCurrentFighter(state);
  if (!actor || actor.side !== 'enemy') throw new Error('It is not an enemy turn.');

  const actions = getEnemyActionCandidates(state, actor);
  const scored = actions.map((action, index) => ({
    action,
    index,
    score: scoreEnemyAction(state, action),
  }));
  const best = scored.reduce((highest, candidate) =>
    candidate.score > highest.score ? candidate : highest,
  );
  const tacticalRoll = normalizeRandom(random()) * 100;
  if (tacticalRoll < (actor.battleIq ?? 0) || scored.length === 1) return best.action;

  const alternatives = scored.filter((candidate) => candidate.index !== best.index);
  const selected = alternatives[
    Math.floor(normalizeRandom(random()) * alternatives.length)
  ] ?? best;
  return selected.action;
}

function normalizeRandom(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999, value));
}

function getEnemyActionCandidates(state: BattleState, actor: Fighter): BattleAction[] {
  return getUsableMoves(actor).flatMap((move) => {
    const targets = getValidTargets(state, actor, move);
    const actionTargets = move.effect === 'multi-target' ? targets.slice(0, 1) : targets;
    return actionTargets.map((target) => ({
      actorId: actor.id,
      moveId: move.id,
      targetId: target.id,
    }));
  });
}

function ppConservationPenalty(actor: Fighter, move: Move): number {
  if (move.id === desperateStrike.id) return 0;
  const remaining = getRemainingPp(actor, move);
  return (1 - remaining / move.maxPp) * 8 + (remaining === 1 ? 10 : 0);
}

function strongestIncomingDamage(state: BattleState, actor: Fighter): number {
  return livingFighters(state, actor.side === 'enemy' ? 'player' : 'enemy').reduce(
    (highest, opponent) => {
      const damage = getUsableMoves(opponent)
        .filter((move) => move.effect === 'damage' || move.effect === 'multi-target')
        .reduce((best, move) => Math.max(best, calculateDamage(opponent, actor, move)), 0);
      return Math.max(highest, damage);
    },
    0,
  );
}

export function scoreEnemyAction(state: BattleState, action: BattleAction): number {
  const actor = state.fighters.find((fighter) => fighter.id === action.actorId);
  const move = actor?.moves.find((candidate) => candidate.id === action.moveId) ??
    (action.moveId === desperateStrike.id ? desperateStrike : undefined);
  const target = state.fighters.find((fighter) => fighter.id === action.targetId);
  if (!actor || actor.side !== 'enemy' || !move || !target) return Number.NEGATIVE_INFINITY;

  const ppPenalty = ppConservationPenalty(actor, move);
  if (move.effect === 'damage' || move.effect === 'multi-target') {
    const targets = move.effect === 'multi-target'
      ? getValidTargets(state, actor, move)
      : [target];
    const outcome = targets.reduce(
      (total, candidate) => {
        const damage = calculateDamage(actor, candidate, move);
        return {
          usefulDamage: total.usefulDamage + Math.min(candidate.hp, damage),
          knockouts: total.knockouts + (damage >= candidate.hp ? 1 : 0),
        };
      },
      { usefulDamage: 0, knockouts: 0 },
    );
    return outcome.usefulDamage * 4 + outcome.knockouts * 400 - ppPenalty;
  }

  const missingHealthRatio = 1 - actor.hp / actor.maxHp;
  if (move.effect === 'guard') {
    if (actor.activeEffects.some((effect) => effect.effect === 'guard')) return -100 - ppPenalty;
    const prevented = strongestIncomingDamage(state, actor) * (move.damageReductionPercent / 100);
    return prevented * 3 + missingHealthRatio * 35 - ppPenalty;
  }

  const existing = target.activeEffects.find(
    (effect): effect is StatEffect =>
      effect.effect === 'stat' &&
      effect.stat === move.stat &&
      effect.modifierPercent === move.modifierPercent,
  );
  const refreshPenalty = existing && existing.remainingRounds > 1 ? 80 : 0;
  if (move.target === 'self') {
    const attackValue = move.stat === 'attack' ? 45 : 25 + missingHealthRatio * 30;
    const conversionValue = move.damageTypeOverride
      ? livingFighters(state, 'player').reduce((best, enemy) => {
          const damagingMove = actor.moves.find(
            (candidate) => candidate.effect === 'damage' || candidate.effect === 'multi-target',
          );
          if (!damagingMove) return best;
          const base = calculateDamage({ ...actor, activeEffects: [] }, enemy, damagingMove);
          const converted = calculateDamage(
            {
              ...actor,
              activeEffects: [{
                effect: 'stat',
                name: move.name,
                stat: move.stat,
                modifierPercent: move.modifierPercent,
                remainingRounds: move.durationRounds,
                damageTypeOverride: move.damageTypeOverride,
              }],
            },
            enemy,
            damagingMove,
          );
          return Math.max(best, converted - base);
        }, 0)
      : 0;
    return attackValue + conversionValue * 2 - refreshPenalty - ppPenalty;
  }

  const debuffValue = move.stat === 'attack'
    ? target.attack * 2 + (target.hp / target.maxHp) * 15
    : target.defense * 2 + livingFighters(state, 'enemy').length * 6;
  return debuffValue - refreshPenalty - ppPenalty;
}
