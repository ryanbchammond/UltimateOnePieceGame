import type { BattleState } from '../combat/types';
import type { CharacterId, EncounterId, RunPhase } from './types';

interface BattleEncounterView {
  runPhase: RunPhase;
  currentEncounterId?: EncounterId;
  loadedEncounterId: EncounterId | null;
  activePartyIds: CharacterId[];
  loadedPartyIds: CharacterId[];
  battleStatus: BattleState['status'];
}

export function isBattleEncounterLoaded({
  runPhase,
  currentEncounterId,
  loadedEncounterId,
  activePartyIds,
  loadedPartyIds,
  battleStatus,
}: BattleEncounterView): boolean {
  const terminalOrActive = battleStatus === 'active' ||
    battleStatus === 'victory' ||
    battleStatus === 'defeat';
  return runPhase === 'battle' &&
    terminalOrActive &&
    currentEncounterId === loadedEncounterId &&
    activePartyIds.length === loadedPartyIds.length &&
    activePartyIds.every((id, index) => id === loadedPartyIds[index]);
}
