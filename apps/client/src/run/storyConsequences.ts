import { createCardPackOpening, getCardPack } from '../cards/packs';
import { getArtifactDefinition } from '../artifacts/artifacts';
import { getCrewCharacter, shipRoleOrder } from '../crew/characters';
import { getRunCharacterHp, healCharacters } from '../crew/health';
import {
  addPercentageBonus,
  applyShipwrightProtection,
  getCaptainBountyBonusPercent,
  getRoleEffectLevel,
} from '../crew/roleEffects';
import type {
  CharacterId,
  NodeChoice,
  RoleAdjustedAmount,
  RewardChange,
  RunSnapshot,
  ShipRole,
} from './types';

export interface StoryChoiceResolution {
  snapshot: RunSnapshot;
  changes: RewardChange[];
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
}

function availableCharacterIds(run: RunSnapshot): CharacterId[] {
  return [...new Set([...run.rosterIds, ...run.guestIds])];
}

function normalizeActiveParty(run: RunSnapshot): CharacterId[] {
  const available = availableCharacterIds(run);
  const living = available.filter((id) => getRunCharacterHp(run, id) > 0);
  const active = run.activePartyIds.filter((id) => living.includes(id)).slice(0, 4);
  return active.length > 0 ? active : living.slice(0, 1);
}

export function getVoyageRoleEffectLevel(
  run: Pick<RunSnapshot, 'roleAssignments' | 'artifacts'>,
  role: ShipRole,
) {
  const assignedLevel = getRoleEffectLevel(run.roleAssignments, role);
  if (assignedLevel === 'inactive' || assignedLevel === 'ideal') return assignedLevel;
  const improved = run.artifacts.some(
    (artifactId) => getArtifactDefinition(artifactId).improvesRole === role,
  );
  return improved ? 'ideal' : 'standard';
}

export function getRoleAdjustedAmount(
  run: Pick<RunSnapshot, 'roleAssignments' | 'artifacts'>,
  amount: number,
  adjustment?: RoleAdjustedAmount,
): number {
  if (!adjustment) return amount;
  const level = getVoyageRoleEffectLevel(run, adjustment.role);
  if (level === 'ideal') return adjustment.ideal;
  if (level === 'standard') return adjustment.standard;
  return amount;
}

export function getChoiceBerryCost(choice: NodeChoice): number {
  return choice.requirements?.find((requirement) => requirement.type === 'berries')?.amount ?? 0;
}

export function getChoiceRequiredRoles(choice: NodeChoice): ShipRole[] {
  return choice.requirements
    ?.filter((requirement): requirement is Extract<typeof requirement, { type: 'role' }> =>
      requirement.type === 'role')
    .map((requirement) => requirement.role) ?? [];
}

export function getChoiceAdjustedRoles(choice: NodeChoice): ShipRole[] {
  return [...new Set(choice.consequences.flatMap((consequence) =>
    'roleAdjustedAmount' in consequence && consequence.roleAdjustedAmount
      ? [consequence.roleAdjustedAmount.role]
      : [],
  ))];
}

export function canResolveStoryChoice(run: RunSnapshot, choice: NodeChoice): boolean {
  return (choice.requirements ?? []).every((requirement) => {
    if (requirement.type === 'berries') return run.berries >= requirement.amount;
    return getRoleEffectLevel(run.roleAssignments, requirement.role) !== 'inactive';
  });
}

export function getChoiceHullDamage(
  run: RunSnapshot,
  choice: Pick<NodeChoice, 'consequences'>,
): number | null {
  const consequences = choice.consequences.filter(
    (candidate): candidate is Extract<typeof candidate, { type: 'hull-damage' }> =>
      candidate.type === 'hull-damage',
  );
  if (consequences.length === 0) return null;
  return consequences.reduce((total, consequence) =>
    total + getHullDamage(run, consequence), 0);
}

function getHullDamage(
  run: RunSnapshot,
  consequence: Extract<NodeChoice['consequences'][number], { type: 'hull-damage' }>,
): number {
  const eventAdjustedAmount = getRoleAdjustedAmount(
    run,
    consequence.amount,
    consequence.roleAdjustedAmount,
  );
  const roleAdjustedAmount = consequence.idealRole &&
    getRoleEffectLevel(run.roleAssignments, consequence.idealRole) === 'ideal'
    ? consequence.idealRoleAmount ?? eventAdjustedAmount
    : eventAdjustedAmount;
  return consequence.protectedByShipwright
    ? applyShipwrightProtection(roleAdjustedAmount, run.roleAssignments)
    : roleAdjustedAmount;
}

function assignRecruitToOpenRole(
  run: RunSnapshot,
  characterId: CharacterId,
  preferredRoles: ShipRole[] = [],
): RunSnapshot['roleAssignments'] {
  const roles = [...new Set([...preferredRoles, ...shipRoleOrder])];
  const openRole = roles.find((role) => run.roleAssignments[role] === null);
  return openRole
    ? { ...run.roleAssignments, [openRole]: characterId }
    : run.roleAssignments;
}

export function applyStoryConsequences(
  run: RunSnapshot,
  node: { id: string; name: string },
  choice: Pick<NodeChoice, 'consequences'>,
  random: () => number = Math.random,
): StoryChoiceResolution {
  let snapshot: RunSnapshot = {
    ...run,
    artifacts: [...run.artifacts],
    rosterIds: [...run.rosterIds],
    guestIds: [...run.guestIds],
    activePartyIds: [...run.activePartyIds],
    roleAssignments: { ...run.roleAssignments },
    characterMovePp: { ...run.characterMovePp },
    characterHp: { ...run.characterHp },
  };
  const changes: RewardChange[] = [];

  for (const consequence of choice.consequences) {
    if (consequence.type === 'resource') {
      const before = snapshot[consequence.resource];
      const adjustedAmount = getRoleAdjustedAmount(
        snapshot,
        consequence.amount,
        consequence.roleAdjustedAmount,
      );
      const treasureBonus = consequence.resource === 'berries' &&
        consequence.treasureReward &&
        adjustedAmount > 0 &&
        snapshot.artifacts.includes('merchants-ledger')
        ? 25
        : 0;
      const authoredAmount = consequence.captainBountyBonus
        ? addPercentageBonus(
            adjustedAmount,
            getCaptainBountyBonusPercent(snapshot.roleAssignments),
          )
        : adjustedAmount + treasureBonus;
      const after = Math.max(0, before + authoredAmount);
      const applied = after - before;
      snapshot = { ...snapshot, [consequence.resource]: after };
      changes.push({
        label: consequence.resource === 'berries' ? 'Berries' : 'Bounty',
        value: signed(applied),
        tone: applied > 0 ? 'positive' : applied < 0 ? 'negative' : 'neutral',
      });
      continue;
    }

    if (consequence.type === 'hull-damage') {
      const damage = getHullDamage(snapshot, consequence);
      const hull = Math.max(1, snapshot.hull - damage);
      const applied = snapshot.hull - hull;
      snapshot = { ...snapshot, hull };
      changes.push({
        label: 'Hull',
        value: signed(-applied),
        tone: applied > 0 ? 'negative' : 'neutral',
      });
      continue;
    }

    if (consequence.type === 'artifact') {
      const artifactAdded = !snapshot.artifacts.includes(consequence.artifactId);
      const artifact = getArtifactDefinition(consequence.artifactId);
      snapshot = {
        ...snapshot,
        artifacts: artifactAdded
          ? [...snapshot.artifacts, consequence.artifactId]
          : snapshot.artifacts,
        berries: artifactAdded
          ? snapshot.berries
          : snapshot.berries + artifact.duplicateBerries,
      };
      changes.push({
        label: 'Artifact',
        value: artifactAdded ? artifact.name : `${artifact.name} duplicate`,
        tone: artifactAdded ? 'positive' : 'neutral',
      });
      if (!artifactAdded) {
        changes.push({
          label: 'Berries',
          value: signed(artifact.duplicateBerries),
          tone: 'positive',
        });
      }
      continue;
    }

    if (consequence.type === 'recruit') {
      const alreadyRecruited = snapshot.rosterIds.includes(consequence.characterId);
      const character = getCrewCharacter(consequence.characterId);
      snapshot = {
        ...snapshot,
        rosterIds: alreadyRecruited
          ? snapshot.rosterIds
          : [...snapshot.rosterIds, consequence.characterId],
        guestIds: snapshot.guestIds.filter((id) => id !== consequence.characterId),
        roleAssignments: alreadyRecruited
          ? snapshot.roleAssignments
          : assignRecruitToOpenRole(snapshot, consequence.characterId, consequence.preferredRoles),
      };
      changes.push({
        label: 'Roster',
        value: alreadyRecruited ? 'No change' : `+ ${character.name}`,
        tone: alreadyRecruited ? 'neutral' : 'positive',
      });
      continue;
    }

    if (consequence.type === 'guest') {
      const character = getCrewCharacter(consequence.characterId);
      const adding = consequence.action === 'add';
      const characterHp = { ...snapshot.characterHp };
      if (!adding) delete characterHp[consequence.characterId];
      snapshot = {
        ...snapshot,
        characterHp,
        guestIds: adding && !snapshot.rosterIds.includes(consequence.characterId)
          ? [...new Set([...snapshot.guestIds, consequence.characterId])]
          : snapshot.guestIds.filter((id) => id !== consequence.characterId),
      };
      changes.push({
        label: 'Story guest',
        value: `${adding ? '+' : '−'} ${character.name}`,
        tone: adding ? 'positive' : 'neutral',
      });
      continue;
    }

    if (consequence.type === 'heal') {
      const targetIds = consequence.target === 'active-party'
        ? snapshot.activePartyIds
        : availableCharacterIds(snapshot);
      const result = healCharacters(snapshot, targetIds, consequence.percent);
      snapshot = { ...snapshot, characterHp: result.characterHp };
      changes.push({
        label: 'Crew HP',
        value: result.healed > 0 ? signed(result.healed) : 'Already healthy',
        tone: result.healed > 0 ? 'positive' : 'neutral',
      });
      continue;
    }

    if (consequence.type === 'restore') {
      if (consequence.target === 'hull') {
        const restored = snapshot.maxHull - snapshot.hull;
        snapshot = { ...snapshot, hull: snapshot.maxHull };
        changes.push({
          label: 'Hull',
          value: signed(restored),
          tone: restored > 0 ? 'positive' : 'neutral',
        });
      } else {
        snapshot = { ...snapshot, characterMovePp: {} };
        changes.push({ label: 'Move PP', value: 'Fully restored', tone: 'positive' });
      }
      continue;
    }

    if (consequence.type === 'hull-repair') {
      const repairAmount = getRoleAdjustedAmount(
        snapshot,
        consequence.amount,
        consequence.roleAdjustedAmount,
      );
      const hull = Math.min(snapshot.maxHull, snapshot.hull + repairAmount);
      const repaired = hull - snapshot.hull;
      snapshot = { ...snapshot, hull };
      changes.push({
        label: 'Hull',
        value: signed(repaired),
        tone: repaired > 0 ? 'positive' : 'neutral',
      });
      continue;
    }

    if (consequence.type === 'checkpoint') {
      snapshot = { ...snapshot, checkpointNodeId: node.id };
      changes.push({ label: 'Checkpoint', value: node.name, tone: 'positive' });
      continue;
    }

    if (consequence.type === 'route') {
      snapshot = {
        ...snapshot,
        chosenBranches: {
          ...snapshot.chosenBranches,
          [consequence.branch]: consequence.nodeId,
        },
      };
      continue;
    }

    const pack = getCardPack(consequence.packId);
    const packNumber = snapshot.packsOpened + 1;
    snapshot = {
      ...snapshot,
      phase: 'node',
      packsOpened: packNumber,
      pendingPack: createCardPackOpening(
        pack,
        packNumber,
        'arc-reward',
        random,
        consequence.resume,
      ),
    };
    changes.push({ label: 'Card pack', value: `+ ${pack.name}`, tone: 'positive' });
  }

  snapshot = { ...snapshot, activePartyIds: normalizeActiveParty(snapshot) };
  return { snapshot, changes };
}
