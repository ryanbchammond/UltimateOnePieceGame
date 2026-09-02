import { damageEffect, move } from './moves';
import type {
  ActiveEffect,
  BattleAction,
  BattleLogEntry,
  BattleState,
  DamageCondition,
  DamageEffect,
  DamageOverTimeEffect,
  Fighter,
  FighterDefinition,
  Move,
  MoveEffect,
  Side,
  StatEffect,
} from './types';
import { describeMultiplier, elementLabels, getTypeMultiplier } from './typeEffectiveness';

const MAX_STAT_MODIFIER_PERCENT = 40;

export const desperateStrike = move(
  'desperate-strike',
  'Desperate Strike',
  'brawler',
  1,
  'enemy',
  [damageEffect(1)],
);

function livingFighters(state: BattleState, side?: Side): Fighter[] {
  return state.fighters.filter(
    (fighter) => fighter.hp > 0 && (side === undefined || fighter.side === side),
  );
}

function getEffectiveStat(fighter: Fighter, stat: 'attack' | 'defense' | 'speed'): number {
  const modifierPercent = fighter.activeEffects.reduce(
    (total, effect) =>
      effect.effect === 'stat' && effect.stat === stat ? total + effect.modifierPercent : total,
    0,
  );
  const clamped = Math.max(
    -MAX_STAT_MODIFIER_PERCENT,
    Math.min(MAX_STAT_MODIFIER_PERCENT, modifierPercent),
  );
  return Math.max(0, Math.round(fighter[stat] * (1 + clamped / 100)));
}

function buildTurnOrder(fighters: Fighter[]): string[] {
  return fighters
    .filter((fighter) => fighter.hp > 0)
    .sort(
      (left, right) =>
        getEffectiveStat(right, 'speed') - getEffectiveStat(left, 'speed') ||
        (left.side === right.side ? left.slot - right.slot : left.side === 'player' ? -1 : 1),
    )
    .map((fighter) => fighter.id);
}

function assertValidEffect(moveDefinition: Move, effect: MoveEffect): void {
  if (effect.effect === 'damage') {
    if (!Number.isFinite(effect.power) || effect.power <= 0) {
      throw new Error(`${moveDefinition.name} requires a positive damage power.`);
    }
    if (effect.conditionalBonus) {
      const validConditions: DamageCondition[] = [
        'target-negative-effect',
        'target-guarding',
        'actor-below-half-hp',
      ];
      if (
        !validConditions.includes(effect.conditionalBonus.condition) ||
        !Number.isFinite(effect.conditionalBonus.power) ||
        effect.conditionalBonus.power <= 0
      ) {
        throw new Error(`${moveDefinition.name} has an invalid conditional-damage payload.`);
      }
    }
    if (moveDefinition.target === 'self' || moveDefinition.target === 'ally') {
      throw new Error(`${moveDefinition.name} cannot damage a friendly target.`);
    }
    return;
  }

  if (effect.effect === 'guard') {
    if (
      !Number.isFinite(effect.damageReductionPercent) ||
      effect.damageReductionPercent <= 0 ||
      effect.damageReductionPercent >= 100
    ) {
      throw new Error(`${moveDefinition.name} requires damage reduction between 0 and 100 percent.`);
    }
    if (moveDefinition.target !== 'self' && moveDefinition.target !== 'ally') {
      throw new Error(`${moveDefinition.name} cannot Guard an opposing fighter.`);
    }
    return;
  }

  if (effect.effect === 'stat') {
    const friendlyTarget = moveDefinition.target === 'self' || moveDefinition.target === 'ally';
    const validDirection = friendlyTarget
      ? effect.modifierPercent > 0
      : effect.modifierPercent < 0;
    if (
      !effect.statusId ||
      !['attack', 'defense', 'speed'].includes(effect.stat) ||
      !Number.isFinite(effect.modifierPercent) ||
      !validDirection ||
      !Number.isInteger(effect.durationTurns) ||
      effect.durationTurns <= 0 ||
      (effect.damageTypeOverride !== undefined && moveDefinition.target !== 'self')
    ) {
      throw new Error(`${moveDefinition.name} has an invalid stat-effect payload.`);
    }
    return;
  }

  if (effect.effect === 'damage-over-time') {
    if (
      !effect.statusId ||
      !effect.statusName ||
      !Number.isFinite(effect.maxHpPercent) ||
      effect.maxHpPercent <= 0 ||
      effect.maxHpPercent >= 100 ||
      !Number.isInteger(effect.durationTurns) ||
      effect.durationTurns <= 0 ||
      (moveDefinition.target !== 'enemy' && moveDefinition.target !== 'enemy-group')
    ) {
      throw new Error(`${moveDefinition.name} has an invalid damage-over-time payload.`);
    }
    return;
  }

  if (effect.effect === 'heal') {
    if (
      !Number.isFinite(effect.maxHpPercent) ||
      effect.maxHpPercent <= 0 ||
      effect.maxHpPercent >= 100 ||
      (moveDefinition.target !== 'self' && moveDefinition.target !== 'ally')
    ) {
      throw new Error(`${moveDefinition.name} has an invalid healing payload.`);
    }
    return;
  }

  if (effect.effect === 'cleanse') {
    if (moveDefinition.target !== 'self' && moveDefinition.target !== 'ally') {
      throw new Error(`${moveDefinition.name} cannot Cleanse an opposing fighter.`);
    }
    return;
  }

  if (effect.effect === 'remove-guard') {
    if (moveDefinition.target !== 'enemy' && moveDefinition.target !== 'enemy-group') {
      throw new Error(`${moveDefinition.name} cannot break friendly Guard.`);
    }
    return;
  }

  throw new Error('Unknown move effect.');
}

function assertValidMove(moveDefinition: Move): void {
  if (!moveDefinition.id || !moveDefinition.name || !moveDefinition.element) {
    throw new Error('Every move requires an id, name, and element.');
  }
  if (!Number.isInteger(moveDefinition.maxPp) || moveDefinition.maxPp <= 0) {
    throw new Error(`${moveDefinition.name} requires a positive whole-number PP limit.`);
  }
  if (!['self', 'ally', 'enemy', 'enemy-group'].includes(moveDefinition.target)) {
    throw new Error(`${moveDefinition.name} has an invalid target mode.`);
  }
  if (moveDefinition.effects.length === 0) {
    throw new Error(`${moveDefinition.name} requires at least one effect.`);
  }
  if (moveDefinition.target === 'enemy-group') {
    if (
      !Number.isInteger(moveDefinition.maxTargets) ||
      moveDefinition.maxTargets! < 1 ||
      moveDefinition.maxTargets! > 4
    ) {
      throw new Error(`${moveDefinition.name} requires a target cap from one to four.`);
    }
  } else if (moveDefinition.maxTargets !== undefined) {
    throw new Error(`${moveDefinition.name} can only set a target cap for an enemy group.`);
  }
  moveDefinition.effects.forEach((effect) => assertValidEffect(moveDefinition, effect));
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

function settleBattleOutcome(state: BattleState): BattleState {
  const playerAlive = livingFighters(state, 'player').length > 0;
  const enemyAlive = livingFighters(state, 'enemy').length > 0;
  if (playerAlive && enemyAlive) return state;

  const winner: Side = playerAlive ? 'player' : 'enemy';
  const result = winner === 'player'
    ? 'Victory! The enemy crew is defeated.'
    : 'Defeat. Your crew has fallen.';
  return addLog(
    { ...state, status: winner === 'player' ? 'victory' : 'defeat', winner },
    result,
    'result',
  );
}

function advanceTurn(state: BattleState): BattleState {
  let nextIndex = state.turnIndex + 1;
  while (nextIndex < state.turnOrder.length) {
    const next = state.fighters.find((fighter) => fighter.id === state.turnOrder[nextIndex]);
    if (next && next.hp > 0) return { ...state, turnIndex: nextIndex };
    nextIndex += 1;
  }

  const nextRound = state.round + 1;
  return addLog(
    {
      ...state,
      round: nextRound,
      turnOrder: buildTurnOrder(state.fighters),
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
    if (new Set(fighter.moves.map((candidate) => candidate.id)).size !== fighter.moves.length) {
      throw new Error(`${fighter.name} must have unique move ids.`);
    }
    fighter.moves.forEach(assertValidMove);
  });

  const fighters: Fighter[] = definitions.map((fighter) => ({
    ...fighter,
    moves: fighter.moves.map((candidate) => ({
      ...candidate,
      effects: candidate.effects.map((effect) => ({ ...effect })),
    })),
    hp: fighter.maxHp,
    activeEffects: [],
    movePp: Object.fromEntries(
      fighter.moves.map((candidate) => [
        candidate.id,
        Math.max(0, Math.min(
          candidate.maxPp,
          fighter.initialMovePp?.[candidate.id] ?? candidate.maxPp,
        )),
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

export function getValidTargets(state: BattleState, actor: Fighter, selectedMove?: Move): Fighter[] {
  if (selectedMove?.target === 'self') return actor.hp > 0 ? [actor] : [];
  if (selectedMove?.target === 'ally') return livingFighters(state, actor.side);
  const targetSide: Side = actor.side === 'player' ? 'enemy' : 'player';
  return livingFighters(state, targetSide);
}

export function getRemainingPp(fighter: Fighter, selectedMove: Move): number {
  return fighter.movePp[selectedMove.id] ?? selectedMove.maxPp;
}

export function getUsableMoves(fighter: Fighter): Move[] {
  const usable = fighter.moves.filter((selectedMove) => getRemainingPp(fighter, selectedMove) > 0);
  return usable.length > 0 ? usable : [desperateStrike];
}

function getDamageEffect(selectedMove: Move): DamageEffect | undefined {
  return selectedMove.effects.find(
    (effect): effect is DamageEffect => effect.effect === 'damage',
  );
}

export function getEffectiveMoveElement(fighter: Fighter, selectedMove: Move): Move['element'] {
  if (!getDamageEffect(selectedMove)) return selectedMove.element;
  const override = fighter.activeEffects.find(
    (effect): effect is StatEffect =>
      effect.effect === 'stat' && effect.damageTypeOverride !== undefined,
  )?.damageTypeOverride;
  return override ?? selectedMove.element;
}

function hasNegativeEffect(fighter: Fighter): boolean {
  return fighter.activeEffects.some(
    (effect) =>
      effect.effect === 'damage-over-time' ||
      (effect.effect === 'stat' && effect.modifierPercent < 0),
  );
}

function conditionMet(condition: DamageCondition, actor: Fighter, target: Fighter): boolean {
  if (condition === 'actor-below-half-hp') return actor.hp * 2 < actor.maxHp;
  if (condition === 'target-guarding') {
    return target.activeEffects.some((effect) => effect.effect === 'guard');
  }
  return hasNegativeEffect(target);
}

function removesGuardBeforeDamage(selectedMove: Move): boolean {
  const damageIndex = selectedMove.effects.findIndex((effect) => effect.effect === 'damage');
  const removeIndex = selectedMove.effects.findIndex((effect) => effect.effect === 'remove-guard');
  return removeIndex >= 0 && damageIndex >= 0 && removeIndex < damageIndex;
}

function calculateDamageWithSnapshot(
  actor: Fighter,
  target: Fighter,
  selectedMove: Move,
  conditionTarget: Fighter,
): number {
  const effect = getDamageEffect(selectedMove);
  if (!effect) throw new Error(`${selectedMove.name} does not deal damage.`);

  const bonus = effect.conditionalBonus && conditionMet(
    effect.conditionalBonus.condition,
    actor,
    conditionTarget,
  )
    ? effect.conditionalBonus.power
    : 0;
  const baseDamage = Math.max(
    1,
    effect.power + bonus + getEffectiveStat(actor, 'attack') - getEffectiveStat(target, 'defense'),
  );
  const multiplier = getTypeMultiplier(
    getEffectiveMoveElement(actor, selectedMove),
    target.types,
    target.devilFruitUser,
  );
  const weaknessDamage = baseDamage * multiplier;
  const guardReduction = removesGuardBeforeDamage(selectedMove)
    ? 0
    : target.activeEffects.reduce(
        (largest, activeEffect) =>
          activeEffect.effect === 'guard'
            ? Math.max(largest, activeEffect.damageReductionPercent)
            : largest,
        0,
      );
  return Math.max(1, Math.round(weaknessDamage * (1 - guardReduction / 100)));
}

export function calculateDamage(actor: Fighter, target: Fighter, selectedMove: Move): number {
  return calculateDamageWithSnapshot(actor, target, selectedMove, target);
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

function getSelectedTarget(state: BattleState, actor: Fighter, selectedMove: Move, targetId: string): Fighter {
  const target = state.fighters.find((candidate) => candidate.id === targetId);
  if (!target || target.hp <= 0) throw new Error('Choose a living fighter.');
  if (selectedMove.target === 'self' && target.id !== actor.id) {
    throw new Error('That move must target the acting fighter.');
  }
  if (selectedMove.target === 'ally' && target.side !== actor.side) {
    throw new Error('Choose a living fighter on the acting crew.');
  }
  if (
    (selectedMove.target === 'enemy' || selectedMove.target === 'enemy-group') &&
    target.side === actor.side
  ) {
    throw new Error('Choose a living fighter on the opposing crew.');
  }
  return target;
}

function getMoveTargets(
  state: BattleState,
  actor: Fighter,
  selectedMove: Move,
  primaryTargetId: string,
): Fighter[] {
  const primary = getSelectedTarget(state, actor, selectedMove, primaryTargetId);
  if (selectedMove.target !== 'enemy-group') return [primary];
  return [
    primary,
    ...getValidTargets(state, actor, selectedMove).filter((target) => target.id !== primary.id),
  ].slice(0, selectedMove.maxTargets);
}

function replaceFighter(state: BattleState, updated: Fighter): BattleState {
  return {
    ...state,
    fighters: state.fighters.map((fighter) => fighter.id === updated.id ? updated : fighter),
  };
}

function applyDamage(
  state: BattleState,
  actorSnapshot: Fighter,
  targetSnapshot: Fighter,
  selectedMove: Move,
): BattleState {
  const actor = state.fighters.find((fighter) => fighter.id === actorSnapshot.id) ?? actorSnapshot;
  const target = state.fighters.find((fighter) => fighter.id === targetSnapshot.id) ?? targetSnapshot;
  if (target.hp <= 0) return state;
  const damage = calculateDamageWithSnapshot(actor, target, selectedMove, targetSnapshot);
  const targetHp = Math.max(0, target.hp - damage);
  const effectiveElement = getEffectiveMoveElement(actor, selectedMove);
  const multiplier = getTypeMultiplier(effectiveElement, target.types, target.devilFruitUser);
  const guarded = target.activeEffects.some((effect) => effect.effect === 'guard') &&
    !removesGuardBeforeDamage(selectedMove);
  let next = replaceFighter(state, { ...target, hp: targetHp });
  next = addLog(
    next,
    `${actor.name} used ${selectedMove.name}${effectiveElement !== selectedMove.element ? ` as ${elementLabels[effectiveElement]} type` : ''} on ${target.name} for ${damage} damage (${multiplier}× · ${describeMultiplier(multiplier)})${guarded ? ' through their guard.' : '.'}`,
    'damage',
  );
  if (targetHp === 0) next = addLog(next, `${target.name} was defeated.`, 'faint');
  return next;
}

function applyGuard(state: BattleState, targetId: string, selectedMove: Move, effect: MoveEffect): BattleState {
  if (effect.effect !== 'guard') return state;
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const updated: Fighter = {
    ...target,
    activeEffects: [
      ...target.activeEffects.filter((activeEffect) => activeEffect.effect !== 'guard'),
      {
        effect: 'guard',
        statusId: selectedMove.id,
        name: selectedMove.name,
        damageReductionPercent: effect.damageReductionPercent,
      },
    ],
  };
  return addLog(
    replaceFighter(state, updated),
    `${target.name} gained ${effect.damageReductionPercent}% Guard from ${selectedMove.name} until their next action.`,
    'effect',
  );
}

function applyStat(
  state: BattleState,
  actorId: string,
  targetId: string,
  selectedMove: Move,
  effect: MoveEffect,
): BattleState {
  if (effect.effect !== 'stat') return state;
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const existing = target.activeEffects.find(
    (activeEffect) => activeEffect.effect === 'stat' && activeEffect.statusId === effect.statusId,
  );
  const applied: StatEffect = {
    effect: 'stat',
    statusId: effect.statusId,
    name: selectedMove.name,
    stat: effect.stat,
    modifierPercent: effect.modifierPercent,
    remainingTurns: effect.durationTurns,
    skipNextAdvance: target.id === actorId,
    damageTypeOverride: effect.damageTypeOverride,
  };
  const updated: Fighter = {
    ...target,
    activeEffects: [
      ...target.activeEffects.filter((activeEffect) => activeEffect.statusId !== effect.statusId),
      applied,
    ],
  };
  const direction = effect.modifierPercent > 0 ? 'rose' : 'fell';
  return addLog(
    replaceFighter(state, updated),
    `${target.name}'s ${effect.stat} ${direction} by ${Math.abs(effect.modifierPercent)}% for ${effect.durationTurns} turns${effect.damageTypeOverride ? ` and damaging moves became ${elementLabels[effect.damageTypeOverride]} type` : ''}${existing ? ' (duration refreshed).' : '.'}`,
    'effect',
  );
}

function applyDamageOverTime(
  state: BattleState,
  actorId: string,
  targetId: string,
  selectedMove: Move,
  effect: MoveEffect,
): BattleState {
  if (effect.effect !== 'damage-over-time') return state;
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const existing = target.activeEffects.find(
    (activeEffect) =>
      activeEffect.effect === 'damage-over-time' && activeEffect.statusId === effect.statusId,
  );
  const updated: Fighter = {
    ...target,
    activeEffects: [
      ...target.activeEffects.filter((activeEffect) => activeEffect.statusId !== effect.statusId),
      {
        effect: 'damage-over-time',
        statusId: effect.statusId,
        name: effect.statusName,
        maxHpPercent: effect.maxHpPercent,
        remainingTurns: effect.durationTurns,
        skipNextAdvance: target.id === actorId,
      },
    ],
  };
  return addLog(
    replaceFighter(state, updated),
    `${target.name} is affected by ${effect.statusName} for ${effect.durationTurns} turns${existing ? ' (duration refreshed).' : '.'}`,
    'effect',
  );
}

function applyHeal(state: BattleState, targetId: string, selectedMove: Move, effect: MoveEffect): BattleState {
  if (effect.effect !== 'heal') return state;
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const amount = Math.min(
    target.maxHp - target.hp,
    Math.max(1, Math.round(target.maxHp * (effect.maxHpPercent / 100))),
  );
  const next = replaceFighter(state, { ...target, hp: target.hp + amount });
  return addLog(
    next,
    `${target.name} recovered ${amount} HP from ${selectedMove.name}${amount === 0 ? ' (already at full health).' : '.'}`,
    'effect',
  );
}

function applyCleanse(state: BattleState, targetId: string, selectedMove: Move): BattleState {
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const removable = target.activeEffects.filter(
    (effect) =>
      effect.effect === 'damage-over-time' ||
      (effect.effect === 'stat' && effect.modifierPercent < 0),
  );
  const updated = {
    ...target,
    activeEffects: target.activeEffects.filter((effect) => !removable.includes(effect)),
  };
  return addLog(
    replaceFighter(state, updated),
    removable.length > 0
      ? `${selectedMove.name} cleansed ${removable.length} negative effect${removable.length === 1 ? '' : 's'} from ${target.name}.`
      : `${selectedMove.name} found no negative effects on ${target.name}.`,
    'effect',
  );
}

function applyRemoveGuard(state: BattleState, targetId: string, selectedMove: Move): BattleState {
  const target = state.fighters.find((fighter) => fighter.id === targetId)!;
  const guarded = target.activeEffects.some((effect) => effect.effect === 'guard');
  if (!guarded) return state;
  const updated = {
    ...target,
    activeEffects: target.activeEffects.filter((effect) => effect.effect !== 'guard'),
  };
  return addLog(
    replaceFighter(state, updated),
    `${selectedMove.name} broke ${target.name}'s Guard.`,
    'effect',
  );
}

function applyEffect(
  state: BattleState,
  actorSnapshot: Fighter,
  targetSnapshot: Fighter,
  selectedMove: Move,
  effect: MoveEffect,
): BattleState {
  const currentTarget = state.fighters.find((fighter) => fighter.id === targetSnapshot.id);
  if (!currentTarget || currentTarget.hp <= 0) return state;
  if (effect.effect === 'damage') return applyDamage(state, actorSnapshot, targetSnapshot, selectedMove);
  if (effect.effect === 'guard') return applyGuard(state, targetSnapshot.id, selectedMove, effect);
  if (effect.effect === 'stat') {
    return applyStat(state, actorSnapshot.id, targetSnapshot.id, selectedMove, effect);
  }
  if (effect.effect === 'damage-over-time') {
    return applyDamageOverTime(state, actorSnapshot.id, targetSnapshot.id, selectedMove, effect);
  }
  if (effect.effect === 'heal') return applyHeal(state, targetSnapshot.id, selectedMove, effect);
  if (effect.effect === 'cleanse') return applyCleanse(state, targetSnapshot.id, selectedMove);
  return applyRemoveGuard(state, targetSnapshot.id, selectedMove);
}

function advanceActingTimedEffects(state: BattleState, actorId: string): BattleState {
  const actor = state.fighters.find((fighter) => fighter.id === actorId);
  if (!actor || actor.hp <= 0) return state;
  let next = state;
  const retained: ActiveEffect[] = [];

  actor.activeEffects.forEach((effect) => {
    if ((next.fighters.find((fighter) => fighter.id === actorId)?.hp ?? 0) <= 0) return;
    if (effect.effect === 'guard') {
      retained.push(effect);
      return;
    }
    if (effect.skipNextAdvance) {
      retained.push({ ...effect, skipNextAdvance: false });
      return;
    }

    if (effect.effect === 'damage-over-time') {
      const currentActor = next.fighters.find((fighter) => fighter.id === actorId)!;
      const damage = Math.max(1, Math.round(currentActor.maxHp * (effect.maxHpPercent / 100)));
      const hp = Math.max(0, currentActor.hp - damage);
      next = replaceFighter(next, { ...currentActor, hp });
      next = addLog(next, `${effect.name} dealt ${damage} damage to ${currentActor.name}.`, 'damage');
      if (hp === 0) next = addLog(next, `${currentActor.name} was defeated.`, 'faint');
    }

    if (effect.remainingTurns > 1) {
      retained.push({ ...effect, remainingTurns: effect.remainingTurns - 1 });
    } else {
      next = addLog(next, `${actor.name}'s ${effect.name} ended.`, 'effect');
    }
  });

  const currentActor = next.fighters.find((fighter) => fighter.id === actorId)!;
  return replaceFighter(next, { ...currentActor, activeEffects: retained });
}

export function resolveAction(state: BattleState, action: BattleAction): BattleState {
  if (state.status !== 'active') throw new Error('The battle is already over.');

  const actor = getCurrentFighter(state);
  if (!actor || actor.id !== action.actorId) throw new Error('That fighter cannot act now.');

  const authoredMove = actor.moves.find((candidate) => candidate.id === action.moveId);
  const canUseDesperateStrike =
    action.moveId === desperateStrike.id &&
    actor.moves.every((candidate) => getRemainingPp(actor, candidate) === 0);
  const selectedMove = authoredMove ?? (canUseDesperateStrike ? desperateStrike : undefined);
  if (!selectedMove) throw new Error('That move does not belong to the acting fighter.');
  if (authoredMove && getRemainingPp(actor, authoredMove) <= 0) {
    throw new Error(`${authoredMove.name} has no PP remaining.`);
  }

  const targets = getMoveTargets(state, actor, selectedMove, action.targetId);
  const targetSnapshots = targets.map((target) => ({
    ...target,
    activeEffects: target.activeEffects.map((effect) => ({ ...effect })),
  }));
  let next = removeActingGuard(state, actor);
  if (authoredMove) {
    const currentActor = next.fighters.find((fighter) => fighter.id === actor.id)!;
    next = replaceFighter(next, {
      ...currentActor,
      movePp: {
        ...currentActor.movePp,
        [authoredMove.id]: Math.max(0, getRemainingPp(currentActor, authoredMove) - 1),
      },
    });
  }
  const actorSnapshot = next.fighters.find((fighter) => fighter.id === actor.id) ?? actor;

  targetSnapshots.forEach((targetSnapshot) => {
    selectedMove.effects.forEach((effect) => {
      next = applyEffect(next, actorSnapshot, targetSnapshot, selectedMove, effect);
    });
  });
  next = {
    ...next,
    lastAction: {
      actorId: actor.id,
      actorName: actor.name,
      moveName: selectedMove.name,
      targetNames: targets.map((target) => target.name),
      side: actor.side,
    },
  };

  next = settleBattleOutcome(next);
  if (next.status !== 'active') return next;
  next = advanceActingTimedEffects(next, actor.id);
  next = settleBattleOutcome(next);
  return next.status === 'active' ? advanceTurn(next) : next;
}

function normalizeRandom(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999, value));
}

function getEnemyActionCandidates(state: BattleState, actor: Fighter): BattleAction[] {
  return getUsableMoves(actor).flatMap((selectedMove) => {
    const targets = getValidTargets(state, actor, selectedMove);
    const actionTargets = selectedMove.target === 'enemy-group' ? targets.slice(0, 1) : targets;
    return actionTargets.map((target) => ({
      actorId: actor.id,
      moveId: selectedMove.id,
      targetId: target.id,
    }));
  });
}

function ppConservationPenalty(actor: Fighter, selectedMove: Move): number {
  if (selectedMove.id === desperateStrike.id) return 0;
  const remaining = getRemainingPp(actor, selectedMove);
  return (1 - remaining / selectedMove.maxPp) * 8 + (remaining === 1 ? 10 : 0);
}

function strongestIncomingDamage(state: BattleState, target: Fighter): number {
  const opposingSide: Side = target.side === 'enemy' ? 'player' : 'enemy';
  return livingFighters(state, opposingSide).reduce((highest, opponent) => {
    const damage = getUsableMoves(opponent)
      .filter((selectedMove) => getDamageEffect(selectedMove))
      .reduce(
        (best, selectedMove) => Math.max(best, calculateDamage(opponent, target, selectedMove)),
        0,
      );
    return Math.max(highest, damage);
  }, 0);
}

function changesNextRoundOrder(state: BattleState, target: Fighter, modifierPercent: number): boolean {
  const before = buildTurnOrder(state.fighters);
  const simulated: Fighter[] = state.fighters.map((fighter) => fighter.id === target.id
    ? {
        ...fighter,
        activeEffects: [
          ...fighter.activeEffects,
          {
            effect: 'stat' as const,
            statusId: 'ai-speed-preview',
            name: 'Speed preview',
            stat: 'speed' as const,
            modifierPercent,
            remainingTurns: 2,
            skipNextAdvance: false,
          },
        ],
      }
    : fighter);
  const after = buildTurnOrder(simulated);
  return before.indexOf(target.id) !== after.indexOf(target.id);
}

export function scoreEnemyAction(state: BattleState, action: BattleAction): number {
  const actor = state.fighters.find((fighter) => fighter.id === action.actorId);
  const selectedMove = actor?.moves.find((candidate) => candidate.id === action.moveId) ??
    (action.moveId === desperateStrike.id ? desperateStrike : undefined);
  if (!actor || actor.side !== 'enemy' || !selectedMove) return Number.NEGATIVE_INFINITY;

  let targets: Fighter[];
  try {
    targets = getMoveTargets(state, actor, selectedMove, action.targetId);
  } catch {
    return Number.NEGATIVE_INFINITY;
  }

  let score = -ppConservationPenalty(actor, selectedMove);
  targets.forEach((target) => {
    selectedMove.effects.forEach((effect) => {
      if (effect.effect === 'damage') {
        const damage = calculateDamage(actor, target, selectedMove);
        score += Math.min(target.hp, damage) * 4 + (damage >= target.hp ? 400 : 0);
      } else if (effect.effect === 'guard') {
        const alreadyGuarded = target.activeEffects.some((active) => active.effect === 'guard');
        score += alreadyGuarded
          ? -100
          : strongestIncomingDamage(state, target) * (effect.damageReductionPercent / 100) * 3;
      } else if (effect.effect === 'stat') {
        const existing = target.activeEffects.find(
          (active): active is StatEffect =>
            active.effect === 'stat' && active.statusId === effect.statusId,
        );
        if (existing && existing.remainingTurns > 1) {
          score -= 80;
        } else if (effect.stat === 'speed') {
          score += changesNextRoundOrder(state, target, effect.modifierPercent) ? 42 : 0;
        } else if (effect.modifierPercent > 0) {
          const missingHealthRatio = 1 - target.hp / target.maxHp;
          score += effect.stat === 'attack' ? 45 : 25 + missingHealthRatio * 30;
          if (effect.damageTypeOverride) score += 25;
        } else {
          score += effect.stat === 'attack'
            ? target.attack * 2 + (target.hp / target.maxHp) * 15
            : target.defense * 2 + livingFighters(state, actor.side).length * 6;
        }
      } else if (effect.effect === 'damage-over-time') {
        const existing = target.activeEffects.find(
          (active): active is DamageOverTimeEffect =>
            active.effect === 'damage-over-time' && active.statusId === effect.statusId,
        );
        const addedTurns = Math.max(0, effect.durationTurns - (existing?.remainingTurns ?? 0));
        score += Math.round(target.maxHp * (effect.maxHpPercent / 100)) * addedTurns * 3;
      } else if (effect.effect === 'heal') {
        const healing = Math.min(
          target.maxHp - target.hp,
          Math.max(1, Math.round(target.maxHp * (effect.maxHpPercent / 100))),
        );
        score += healing * 4;
      } else if (effect.effect === 'cleanse') {
        score += target.activeEffects.reduce((value, active) => {
          if (active.effect === 'damage-over-time') {
            return value + Math.round(target.maxHp * (active.maxHpPercent / 100)) * active.remainingTurns * 3;
          }
          if (active.effect === 'stat' && active.modifierPercent < 0) return value + 25;
          return value;
        }, 0);
      } else if (target.activeEffects.some((active) => active.effect === 'guard')) {
        score += 15;
      }
    });
  });
  return score;
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
  return alternatives[Math.floor(normalizeRandom(random()) * alternatives.length)]?.action ?? best.action;
}
