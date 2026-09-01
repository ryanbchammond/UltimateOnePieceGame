import { describe, expect, it } from 'vitest';
import { createStartingRoleAssignments } from './characters';
import {
  addPercentageBonus,
  applyShipwrightProtection,
  getCaptainBountyBonusPercent,
  getCookMaxHpBonusPercent,
  getNavigatorHullCost,
  getRoleEffectLevel,
} from './roleEffects';

describe('ship role effects', () => {
  it('activates stronger effects for ideal assignments', () => {
    const assignments = createStartingRoleAssignments();

    expect(getRoleEffectLevel(assignments, 'captain')).toBe('ideal');
    expect(getCaptainBountyBonusPercent(assignments)).toBe(10);
    expect(getRoleEffectLevel(assignments, 'cook')).toBe('ideal');
    expect(getCookMaxHpBonusPercent(assignments)).toBe(10);
    expect(getNavigatorHullCost(assignments)).toBe(0);
  });

  it('keeps non-ideal assignments functional at standard strength', () => {
    const assignments = {
      ...createStartingRoleAssignments(),
      captain: 'zoro' as const,
      navigator: 'luffy' as const,
      cook: 'nami' as const,
    };

    expect(getRoleEffectLevel(assignments, 'captain')).toBe('standard');
    expect(getCaptainBountyBonusPercent(assignments)).toBe(5);
    expect(getCookMaxHpBonusPercent(assignments)).toBe(5);
    expect(getNavigatorHullCost(assignments)).toBe(5);
  });

  it('leaves empty roles inactive and applies deterministic rounding', () => {
    const assignments = {
      ...createStartingRoleAssignments(),
      captain: null,
      navigator: null,
      cook: null,
    };

    expect(getCaptainBountyBonusPercent(assignments)).toBe(0);
    expect(getCookMaxHpBonusPercent(assignments)).toBe(0);
    expect(getNavigatorHullCost(assignments)).toBeNull();
    expect(addPercentageBonus(86, 5)).toBe(90);
  });

  it('reduces each hull incident when a shipwright is assigned', () => {
    const noShipwright = createStartingRoleAssignments();
    const standardShipwright = {
      ...noShipwright,
      'fighter-1': null,
      shipwright: 'zoro' as const,
    };

    expect(applyShipwrightProtection(15, noShipwright)).toBe(15);
    expect(applyShipwrightProtection(15, standardShipwright)).toBe(13);
    expect(applyShipwrightProtection(1, standardShipwright)).toBe(0);
  });
});
