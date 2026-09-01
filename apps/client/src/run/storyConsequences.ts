import { createCardPackOpening, getCardPack } from '../cards/packs';
import { getArtifactDefinition } from '../artifacts/artifacts';
import { getCrewCharacter, shipRoleOrder } from '../crew/characters';
import {
  addPercentageBonus,
  applyShipwrightProtection,
  getCaptainBountyBonusPercent,
  getRoleEffectLevel,
} from '../crew/roleEffects';
import type {
  CharacterId,
  NodeChoice,
  RewardChange,
  RunSnapshot,
  ShipRole,
  StoryNode,
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
  const active = run.activePartyIds.filter((id) => available.includes(id)).slice(0, 4);
  return active.length > 0 ? active : available.slice(0, 1);
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
  const roleAdjustedAmount = consequence.idealRole &&
    getRoleEffectLevel(run.roleAssignments, consequence.idealRole) === 'ideal'
    ? consequence.idealRoleAmount ?? consequence.amount
    : consequence.amount;
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
  node: StoryNode,
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
  };
  const changes: RewardChange[] = [];

  for (const consequence of choice.consequences) {
    if (consequence.type === 'resource') {
      const before = snapshot[consequence.resource];
      const authoredAmount = consequence.captainBountyBonus
        ? addPercentageBonus(
            consequence.amount,
            getCaptainBountyBonusPercent(snapshot.roleAssignments),
          )
        : consequence.amount;
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
      };
      changes.push({
        label: 'Artifact',
        value: artifactAdded ? artifact.name : 'Already owned',
        tone: artifactAdded ? 'positive' : 'neutral',
      });
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
      snapshot = {
        ...snapshot,
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
      const hull = Math.min(snapshot.maxHull, snapshot.hull + consequence.amount);
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
