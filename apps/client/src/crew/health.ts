import type { CharacterHp, CharacterId, RunSnapshot } from '../run/types';
import { getCharacterMaxHp } from './characters';
import { getCookMaxHpBonusPercent } from './roleEffects';

type HealthRun = Pick<RunSnapshot, 'roleAssignments' | 'characterStars' | 'characterHp'>;

export function getRunCharacterMaxHp(run: HealthRun, characterId: CharacterId): number {
  return getCharacterMaxHp(
    characterId,
    getCookMaxHpBonusPercent(run.roleAssignments),
    run.characterStars,
  );
}

export function getRunCharacterHp(run: HealthRun, characterId: CharacterId): number {
  const maxHp = getRunCharacterMaxHp(run, characterId);
  return Math.max(0, Math.min(maxHp, run.characterHp?.[characterId] ?? maxHp));
}

export function healCharacters(
  run: HealthRun,
  characterIds: CharacterId[],
  percent: number,
): { characterHp: CharacterHp; healed: number } {
  const characterHp: CharacterHp = { ...run.characterHp };
  let healed = 0;
  for (const characterId of new Set(characterIds)) {
    const maxHp = getRunCharacterMaxHp(run, characterId);
    const before = getRunCharacterHp(run, characterId);
    const after = Math.min(maxHp, before + Math.ceil((maxHp * percent) / 100));
    characterHp[characterId] = after;
    healed += after - before;
  }
  return { characterHp, healed };
}

export function setCrewHealthPercent(
  run: HealthRun,
  characterIds: CharacterId[],
  percent: number,
): CharacterHp {
  const characterHp: CharacterHp = { ...run.characterHp };
  for (const characterId of new Set(characterIds)) {
    characterHp[characterId] = Math.max(
      1,
      Math.ceil((getRunCharacterMaxHp(run, characterId) * percent) / 100),
    );
  }
  return characterHp;
}
