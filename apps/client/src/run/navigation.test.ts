import { describe, expect, it } from 'vitest';
import { shouldShowVoyageNavigation } from './navigation';

describe('voyage navigation visibility', () => {
  it('shows navigation throughout active non-combat screens', () => {
    expect(shouldShowVoyageNavigation('map', false)).toBe(true);
    expect(shouldShowVoyageNavigation('voyage', false)).toBe(true);
    expect(shouldShowVoyageNavigation('node', false)).toBe(true);
    expect(shouldShowVoyageNavigation('battle', false)).toBe(true);
    expect(shouldShowVoyageNavigation('victory', false)).toBe(true);
  });

  it('hides navigation only before a run and on a loaded combat screen', () => {
    expect(shouldShowVoyageNavigation('setup', false)).toBe(false);
    expect(shouldShowVoyageNavigation('battle', true)).toBe(false);
  });
});
