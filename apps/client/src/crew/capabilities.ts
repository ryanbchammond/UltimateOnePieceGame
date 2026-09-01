import type { CharacterCapability, CharacterId } from '../run/types';
import { getCrewCharacter } from './characters';

export function activePartyHasCapability(
  activePartyIds: CharacterId[],
  capability: CharacterCapability,
): boolean {
  return activePartyIds.some((id) => getCrewCharacter(id).capabilities?.includes(capability));
}

export function shouldRevealBattleIq(
  developmentBuild: boolean,
  activePartyHasObservationHaki: boolean,
): boolean {
  return developmentBuild || activePartyHasObservationHaki;
}
