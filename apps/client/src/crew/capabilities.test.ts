import { describe, expect, it } from 'vitest';
import { activePartyHasCapability, shouldRevealBattleIq } from './capabilities';

describe('crew capabilities', () => {
  it('keeps Observation Haki unauthored for the current East Blue party', () => {
    expect(activePartyHasCapability(['luffy', 'zoro', 'sanji', 'nami'], 'observation-haki')).toBe(false);
  });

  it('reveals Battle IQ in development or with an active Observation Haki user', () => {
    expect(shouldRevealBattleIq(true, false)).toBe(true);
    expect(shouldRevealBattleIq(false, true)).toBe(true);
    expect(shouldRevealBattleIq(false, false)).toBe(false);
  });
});
