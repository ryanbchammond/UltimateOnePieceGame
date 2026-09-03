import { describe, expect, it } from 'vitest';
import { createStartingRoleAssignments } from '../crew/characters';
import type { NodeChoice, RunSnapshot, StoryNode } from './types';
import {
  applyStoryConsequences,
  canResolveStoryChoice,
  getChoiceHullDamage,
  getVoyageRoleEffectLevel,
} from './storyConsequences';

const fixtureNode: StoryNode = {
  id: 'fixture-event',
  arcId: 'romance-dawn',
  name: 'Fixture Event',
  subtitle: 'Data boundary check',
  description: 'A test-only authored story event.',
  type: 'event',
  x: 100,
  y: 100,
  prerequisites: [],
};

function fixtureRun(overrides: Partial<RunSnapshot> = {}): RunSnapshot {
  return {
    phase: 'node',
    mode: 'story',
    difficulty: 'landlubber',
    activeArcId: 'romance-dawn',
    berries: 100,
    bounty: 0,
    hull: 80,
    maxHull: 100,
    completedNodeIds: [],
    visitedNodeIds: [fixtureNode.id],
    currentNodeId: fixtureNode.id,
    checkpointNodeId: fixtureNode.id,
    chosenBranches: {},
    artifacts: [],
    journal: [],
    rosterIds: ['luffy'],
    guestIds: [],
    activePartyIds: ['luffy'],
    roleAssignments: createStartingRoleAssignments(),
    characterShards: {},
    characterStars: {},
    characterMovePp: {},
    packsOpened: 0,
    pendingPack: null,
    crewAssignmentWindow: null,
    latestReward: null,
    ...overrides,
  };
}

describe('authored story consequences', () => {
  it('resolves an arbitrary choice without depending on its identifier', () => {
    const choice: NodeChoice = {
      id: 'any-authored-id',
      label: 'Accept help',
      detail: 'Gain supplies and a temporary ally.',
      requirements: [{ type: 'berries', amount: 20 }],
      consequences: [
        { type: 'resource', resource: 'berries', amount: -20 },
        { type: 'resource', resource: 'bounty', amount: 75 },
        { type: 'guest', action: 'add', characterId: 'coby' },
      ],
      outcome: {
        title: 'Help accepted',
        detail: 'The authored effects were applied.',
        journalEntry: 'Coby joined as a guest.',
      },
    };

    expect(canResolveStoryChoice(fixtureRun(), choice)).toBe(true);
    const result = applyStoryConsequences(fixtureRun(), fixtureNode, choice);
    expect(result.snapshot.berries).toBe(80);
    expect(result.snapshot.bounty).toBe(75);
    expect(result.snapshot.guestIds).toEqual(['coby']);
    expect(result.snapshot.activePartyIds).toEqual(['luffy']);
  });

  it('previews role-adjusted hull consequences and normalizes a departing active guest', () => {
    const choice: NodeChoice = {
      id: 'guest-departs',
      label: 'Say farewell',
      detail: 'The guest leaves after navigating safely.',
      requirements: [{ type: 'role', role: 'navigator' }],
      consequences: [
        {
          type: 'hull-damage',
          amount: 5,
          idealRole: 'navigator',
          idealRoleAmount: 0,
          protectedByShipwright: true,
        },
        { type: 'guest', action: 'remove', characterId: 'coby' },
      ],
      outcome: {
        title: 'Farewell',
        detail: 'The route is clear.',
        journalEntry: 'Coby departed.',
      },
    };
    const run = fixtureRun({ guestIds: ['coby'], activePartyIds: ['coby'] });

    expect(getChoiceHullDamage(run, choice)).toBe(0);
    const result = applyStoryConsequences(run, fixtureNode, choice);
    expect(result.snapshot.hull).toBe(80);
    expect(result.snapshot.guestIds).toEqual([]);
    expect(result.snapshot.activePartyIds).toEqual(['luffy']);
  });

  it('creates a stable deferred arc-reward pack with an authored resume destination', () => {
    const choice: NodeChoice = {
      id: 'arc-reward',
      label: 'Claim pack',
      detail: 'Open the arc reward.',
      consequences: [{
        type: 'pack',
        packId: 'baratie-east-blue',
        resume: {
          phase: 'map',
          activeArcId: 'orange-town',
          currentNodeId: 'orange-town-harbor',
        },
      }],
      outcome: {
        title: 'Arc reward',
        detail: 'Five candidates are ready.',
        journalEntry: 'The crew received an arc pack.',
      },
    };
    const result = applyStoryConsequences(fixtureRun(), fixtureNode, choice, () => 0);

    expect(result.snapshot.phase).toBe('node');
    expect(result.snapshot.packsOpened).toBe(1);
    expect(result.snapshot.pendingPack).toEqual(expect.objectContaining({
      id: 'baratie-east-blue-1',
      source: 'arc-reward',
      resume: {
        phase: 'map',
        activeArcId: 'orange-town',
        currentNodeId: 'orange-town-harbor',
      },
    }));
    expect(result.snapshot.pendingPack?.cards).toHaveLength(5);
  });

  it('uses assigned, ideal, and artifact-improved role tiers without hiding a fallback', () => {
    const choice: NodeChoice = {
      id: 'steer-hazard',
      label: 'Steer through',
      detail: 'Role-adjusted hazard.',
      consequences: [{
        type: 'hull-damage',
        amount: 9,
        roleAdjustedAmount: { role: 'helmsman', standard: 4, ideal: 0 },
      }],
      outcome: { title: 'Clear', detail: 'Clear', journalEntry: 'Clear' },
    };
    const fallback = fixtureRun();
    expect(canResolveStoryChoice(fallback, choice)).toBe(true);
    expect(getChoiceHullDamage(fallback, choice)).toBe(9);

    const standard = fixtureRun({
      roleAssignments: { ...fallback.roleAssignments, captain: null, helmsman: 'luffy' },
    });
    expect(getVoyageRoleEffectLevel(standard, 'helmsman')).toBe('standard');
    expect(getChoiceHullDamage(standard, choice)).toBe(4);

    const improved = fixtureRun({
      ...standard,
      artifacts: ['reinforced-tiller'],
    });
    expect(getVoyageRoleEffectLevel(improved, 'helmsman')).toBe('ideal');
    expect(getChoiceHullDamage(improved, choice)).toBe(0);
  });

  it('applies treasure bonuses and converts duplicate artifacts into Berries', () => {
    const choice: NodeChoice = {
      id: 'treasure-with-duplicate',
      label: 'Take treasure',
      detail: 'Treasure fixture.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 40, treasureReward: true },
        { type: 'artifact', artifactId: 'merchants-ledger' },
      ],
      outcome: { title: 'Treasure', detail: 'Treasure', journalEntry: 'Treasure' },
    };
    const result = applyStoryConsequences(
      fixtureRun({ artifacts: ['merchants-ledger'] }),
      fixtureNode,
      choice,
    );

    expect(result.snapshot.berries).toBe(215);
    expect(result.snapshot.artifacts).toEqual(['merchants-ledger']);
    expect(result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Berries', value: '+65' }),
      expect.objectContaining({ label: 'Artifact', value: "Merchant's Ledger duplicate" }),
      expect.objectContaining({ label: 'Berries', value: '+50' }),
    ]));
  });
});
