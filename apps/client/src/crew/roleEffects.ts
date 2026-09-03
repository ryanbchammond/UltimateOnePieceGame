import type { RoleAssignments, ShipRole } from '../run/types';
import { getCrewCharacter, shipRoleLabels } from './characters';

export type RoleEffectLevel = 'inactive' | 'standard' | 'ideal';

interface RoleEffectDescription {
  standard: string;
  ideal: string;
}

export const functionalRoleEffects: Partial<Record<ShipRole, RoleEffectDescription>> = {
  captain: {
    standard: '+5% bounty from battle victories',
    ideal: '+10% bounty from battle victories',
  },
  navigator: {
    standard: 'Unlocks navigation checks; risky routes cost 5 hull',
    ideal: 'Unlocks navigation checks and avoids route damage',
  },
  doctor: {
    standard: 'Improves recovery and rescue outcomes during voyage events',
    ideal: 'Provides the best recovery and rescue event outcome',
  },
  helmsman: {
    standard: 'Reduces hull damage while steering through voyage hazards',
    ideal: 'Avoids hull damage from steerable voyage hazards',
  },
  cook: {
    standard: '+5% max HP for the active battle party',
    ideal: '+10% max HP for the active battle party',
  },
  shipwright: {
    standard: 'Prevents 2 hull damage from each incident',
    ideal: 'Prevents 4 hull damage from each incident',
  },
};

export function getRoleEffectLevel(
  roleAssignments: RoleAssignments,
  role: ShipRole,
): RoleEffectLevel {
  const characterId = roleAssignments[role];
  if (!characterId) return 'inactive';
  return getCrewCharacter(characterId).idealRoles.includes(role) ? 'ideal' : 'standard';
}

export function getRoleEffectSummary(
  roleAssignments: RoleAssignments,
  role: ShipRole,
): string | null {
  const effect = functionalRoleEffects[role];
  if (!effect) return null;

  const level = getRoleEffectLevel(roleAssignments, role);
  if (level === 'inactive') return `Inactive · Assign a ${shipRoleLabels[role]}`;
  return level === 'ideal' ? `Ideal effect · ${effect.ideal}` : `Active effect · ${effect.standard}`;
}

export function getCaptainBountyBonusPercent(roleAssignments: RoleAssignments): number {
  const level = getRoleEffectLevel(roleAssignments, 'captain');
  return level === 'ideal' ? 10 : level === 'standard' ? 5 : 0;
}

export function getCookMaxHpBonusPercent(roleAssignments: RoleAssignments): number {
  const level = getRoleEffectLevel(roleAssignments, 'cook');
  return level === 'ideal' ? 10 : level === 'standard' ? 5 : 0;
}

export function getShipwrightHullReduction(roleAssignments: RoleAssignments): number {
  const level = getRoleEffectLevel(roleAssignments, 'shipwright');
  return level === 'ideal' ? 4 : level === 'standard' ? 2 : 0;
}

export function addPercentageBonus(value: number, percent: number): number {
  return value + Math.round((value * percent) / 100);
}

export function applyShipwrightProtection(
  hullDamage: number,
  roleAssignments: RoleAssignments,
): number {
  return Math.max(0, hullDamage - getShipwrightHullReduction(roleAssignments));
}

export function getNavigatorHullCost(roleAssignments: RoleAssignments): number | null {
  const level = getRoleEffectLevel(roleAssignments, 'navigator');
  if (level === 'inactive') return null;
  return level === 'ideal' ? 0 : 5;
}
