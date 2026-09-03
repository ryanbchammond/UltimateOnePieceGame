import { describe, expect, it } from 'vitest';
import {
  activeStoryContent,
  getAvailableNodes,
  getStoryConnectionsForArc,
  getStoryNodesForArc,
  getVisitedStoryNodesForArc,
  getStoryArcForNode,
  getStoryNode,
  storyConnections,
  storyNodeChoices,
  storyNodes,
} from './storyContent';
import { createStartingRoleAssignments } from '../crew/characters';
import type { RunSnapshot, StoryContent } from './types';

describe('story content registry', () => {
  it('keeps every active node in a declared arc with authored presentation copy', () => {
    const declaredNodeIds = new Set(activeStoryContent.arcs.flatMap((arc) => arc.nodeIds));

    expect(declaredNodeIds.size).toBe(activeStoryContent.nodes.length);
    for (const arc of activeStoryContent.arcs) {
      expect(arc.nodeIds).toContain(arc.start.nodeId);
      expect(arc.start.activePartyIds.length).toBeGreaterThanOrEqual(1);
      expect(arc.start.activePartyIds.length).toBeLessThanOrEqual(4);
    }

    for (const node of storyNodes) {
      expect(declaredNodeIds.has(node.id)).toBe(true);
      expect(getStoryArcForNode(node.id)?.id).toBe(node.arcId);
      expect(node.description.trim().length).toBeGreaterThan(0);
    }
  });

  it('only connects and assigns choices to registered nodes', () => {
    const nodeIds = new Set(storyNodes.map((node) => node.id));

    for (const [fromId, toId] of storyConnections) {
      expect(nodeIds.has(fromId)).toBe(true);
      expect(nodeIds.has(toId)).toBe(true);
    }
    for (const nodeId of Object.keys(storyNodeChoices)) {
      expect(nodeIds.has(nodeId)).toBe(true);
      for (const choice of storyNodeChoices[nodeId]) {
        expect(choice.consequences.length).toBeGreaterThan(0);
        expect(choice.outcome.title.trim().length).toBeGreaterThan(0);
        expect(choice.outcome.detail.trim().length).toBeGreaterThan(0);
        expect(choice.outcome.journalEntry.trim().length).toBeGreaterThan(0);
        for (const consequence of choice.consequences) {
          if (consequence.type === 'route') {
            expect(nodeIds.has(consequence.nodeId)).toBe(true);
            expect(getStoryNode(consequence.nodeId)?.branch).toBe(consequence.branch);
          }
        }
      }
    }
    for (const node of storyNodes.filter((candidate) => candidate.encounterId)) {
      expect(node.victory?.consequences.length).toBeGreaterThan(0);
    }
  });

  it('returns no node for unknown content identifiers', () => {
    expect(getStoryNode('not-authored')).toBeUndefined();
  });

  it('isolates nodes, routes, and availability to the active arc', () => {
    const content: StoryContent = {
      startArcId: 'romance-dawn',
      arcs: [
        {
          id: 'romance-dawn',
          name: 'Romance Dawn',
          mapTitle: 'ROMANCE DAWN',
          mapInstruction: 'Choose a route.',
          nodeIds: ['rd-start', 'rd-finish'],
          start: {
            nodeId: 'rd-start', phase: 'map', berries: 0, hull: 100, maxHull: 100,
            rosterIds: ['luffy'], guestIds: [], activePartyIds: ['luffy'],
            roleAssignments: createStartingRoleAssignments(), journalEntry: 'Started.',
          },
        },
        {
          id: 'orange-town',
          name: 'Orange Town',
          mapTitle: 'ORANGE TOWN',
          mapInstruction: 'Enter town.',
          nodeIds: ['ot-start'],
          start: {
            nodeId: 'ot-start', phase: 'map', berries: 0, hull: 100, maxHull: 100,
            rosterIds: ['luffy'], guestIds: [], activePartyIds: ['luffy'],
            roleAssignments: createStartingRoleAssignments(), journalEntry: 'Arrived.',
          },
        },
      ],
      nodes: [
        {
          id: 'rd-start', arcId: 'romance-dawn', name: 'Start', subtitle: 'Start',
          description: 'Start Romance Dawn.', type: 'start', x: 0, y: 0, prerequisites: [],
        },
        {
          id: 'rd-finish', arcId: 'romance-dawn', name: 'Finish', subtitle: 'Finish',
          description: 'Finish Romance Dawn.', type: 'event', x: 1, y: 1,
          prerequisites: ['rd-start'],
        },
        {
          id: 'ot-start', arcId: 'orange-town', name: 'Harbor', subtitle: 'Arrival',
          description: 'Start Orange Town.', type: 'start', x: 0, y: 0, prerequisites: [],
        },
      ],
      connections: [['rd-start', 'rd-finish']],
      choices: {},
    };
    const run: RunSnapshot = {
      phase: 'map', mode: 'story', difficulty: 'landlubber', activeArcId: 'romance-dawn',
      berries: 0, bounty: 0, hull: 100, maxHull: 100, completedNodeIds: ['rd-start'],
      visitedNodeIds: ['rd-start'],
      currentNodeId: 'rd-start', checkpointNodeId: 'rd-start', chosenBranches: {}, artifacts: [],
      journal: [], rosterIds: ['luffy'], guestIds: [], activePartyIds: ['luffy'],
      roleAssignments: createStartingRoleAssignments(), characterShards: {}, characterStars: {},
      characterMovePp: {}, packsOpened: 0, pendingPack: null, crewAssignmentWindow: null,
      latestReward: null,
    };

    expect(getStoryNodesForArc('romance-dawn', content).map((node) => node.id))
      .toEqual(['rd-start', 'rd-finish']);
    expect(getStoryConnectionsForArc('romance-dawn', content)).toEqual([['rd-start', 'rd-finish']]);
    expect(getAvailableNodes(run, content).map((node) => node.id)).toEqual(['rd-finish']);
    expect(getAvailableNodes({ ...run, activeArcId: 'orange-town' }, content).map((node) => node.id))
      .toEqual(['ot-start']);
  });

  it('reveals only persisted visited nodes on the active arc map', () => {
    const run: RunSnapshot = {
      phase: 'map', mode: 'story', difficulty: 'landlubber', activeArcId: 'romance-dawn',
      berries: 0, bounty: 0, hull: 100, maxHull: 100,
      completedNodeIds: ['foosha-departure', 'barrel-at-sea'],
      visitedNodeIds: ['foosha-departure', 'barrel-at-sea', 'alvida-deck'],
      currentNodeId: 'barrel-at-sea', checkpointNodeId: 'foosha-departure', chosenBranches: {},
      artifacts: [], journal: [], rosterIds: ['luffy'], guestIds: [], activePartyIds: ['luffy'],
      roleAssignments: createStartingRoleAssignments(), characterShards: {}, characterStars: {},
      characterMovePp: {}, packsOpened: 0, pendingPack: null, crewAssignmentWindow: null,
      latestReward: null,
    };

    expect(getVisitedStoryNodesForArc(run).map((node) => node.id))
      .toEqual(['foosha-departure', 'barrel-at-sea', 'alvida-deck']);
    expect(getAvailableNodes(run).map((node) => node.id))
      .toEqual(['alvida-deck', 'alvida-hold']);
  });

  it('scales the final East Blue maps to arc complexity and authors every story decision', () => {
    const baratie = getStoryNodesForArc('baratie');
    const arlongPark = getStoryNodesForArc('arlong-park');
    const loguetown = getStoryNodesForArc('loguetown');

    expect(arlongPark.length).toBeGreaterThan(baratie.length);
    expect(baratie.length).toBeGreaterThan(loguetown.length);
    expect(baratie.filter((node) => node.branch === 'baratie-defense-route')).toHaveLength(3);
    expect(arlongPark.filter((node) => node.branch === 'cocoyasi-investigation-route')).toHaveLength(3);
    expect(arlongPark.filter((node) => node.branch === 'arlong-assault-route')).toHaveLength(3);
    expect(loguetown.filter((node) => node.branch === 'loguetown-route')).toHaveLength(3);

    for (const node of [...baratie, ...arlongPark, ...loguetown]) {
      if (node.type !== 'battle' && node.type !== 'boss') {
        expect(storyNodeChoices[node.id]?.length, `${node.id} needs a story choice`)
          .toBeGreaterThan(0);
      }
    }
  });
});
