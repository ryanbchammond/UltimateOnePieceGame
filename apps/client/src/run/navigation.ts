import type { RunPhase } from './types';

export function shouldShowVoyageNavigation(
  runPhase: RunPhase,
  encounterLoaded: boolean,
): boolean {
  return runPhase !== 'setup' && !(runPhase === 'battle' && encounterLoaded);
}
