import { describe, expect, it } from 'vitest';
import { isBattleEncounterLoaded } from './battleFlow';

const encounter = {
  runPhase: 'battle' as const,
  currentEncounterId: 'alvida-deck' as const,
  loadedEncounterId: 'alvida-deck' as const,
  activePartyIds: ['luffy', 'coby'] as const,
  loadedPartyIds: ['luffy', 'coby'] as const,
};

describe('battle presentation flow', () => {
  it.each(['active', 'victory', 'defeat'] as const)(
    'keeps the loaded encounter visible when its status is %s',
    (battleStatus) => {
      expect(isBattleEncounterLoaded({
        ...encounter,
        activePartyIds: [...encounter.activePartyIds],
        loadedPartyIds: [...encounter.loadedPartyIds],
        battleStatus,
      })).toBe(true);
    },
  );

  it('returns to preparation only when the encounter or party does not match', () => {
    expect(isBattleEncounterLoaded({
      ...encounter,
      activePartyIds: [...encounter.activePartyIds],
      loadedPartyIds: ['luffy'],
      battleStatus: 'victory',
    })).toBe(false);
  });
});
