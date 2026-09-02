import type {
  CombatStat,
  DamageCondition,
  Element,
  Move,
  MoveEffect,
  TargetMode,
} from './types';

interface MoveOptions {
  maxTargets?: number;
}

export function move(
  id: string,
  name: string,
  element: Element,
  maxPp: number,
  target: TargetMode,
  effects: MoveEffect[],
  options: MoveOptions = {},
): Move {
  return { id, name, element, maxPp, target, effects, ...options };
}

export const damageEffect = (
  power: number,
  conditionalBonus?: { condition: DamageCondition; power: number },
): MoveEffect => ({ effect: 'damage', power, conditionalBonus });

export const guardEffect = (damageReductionPercent = 40): MoveEffect => ({
  effect: 'guard',
  damageReductionPercent,
});

export const statEffect = (
  statusId: string,
  stat: CombatStat,
  modifierPercent: number,
  durationTurns = 2,
  damageTypeOverride?: Element,
): MoveEffect => ({
  effect: 'stat',
  statusId,
  stat,
  modifierPercent,
  durationTurns,
  damageTypeOverride,
});

export const damageOverTimeEffect = (
  statusId: string,
  statusName: string,
  maxHpPercent = 5,
  durationTurns = 2,
): MoveEffect => ({
  effect: 'damage-over-time',
  statusId,
  statusName,
  maxHpPercent,
  durationTurns,
});

export const healEffect = (maxHpPercent = 20): MoveEffect => ({
  effect: 'heal',
  maxHpPercent,
});

export const cleanseEffect = (): MoveEffect => ({ effect: 'cleanse' });
export const removeGuardEffect = (): MoveEffect => ({ effect: 'remove-guard' });

export const directDamage = (
  id: string,
  name: string,
  element: Element,
  power: number,
  maxPp = 8,
): Move => move(id, name, element, maxPp, 'enemy', [damageEffect(power)]);

export const selfGuard = (
  id: string,
  name: string,
  element: Element,
  maxPp = 6,
): Move => move(id, name, element, maxPp, 'self', [guardEffect()]);

export const selfStat = (
  id: string,
  name: string,
  element: Element,
  stat: CombatStat,
  modifierPercent = 20,
  maxPp = 5,
  damageTypeOverride?: Element,
): Move => move(id, name, element, maxPp, 'self', [
  statEffect(id, stat, modifierPercent, 2, damageTypeOverride),
]);

export const enemyStat = (
  id: string,
  name: string,
  element: Element,
  stat: CombatStat,
  modifierPercent = -20,
  maxPp = 5,
): Move => move(id, name, element, maxPp, 'enemy', [
  statEffect(id, stat, modifierPercent),
]);

export const groupDamage = (
  id: string,
  name: string,
  element: Element,
  power: number,
  maxTargets = 2,
  maxPp = 3,
): Move => move(id, name, element, maxPp, 'enemy-group', [damageEffect(power)], { maxTargets });
