import { beforeEach, describe, expect, it } from 'vitest';
import { getCurrentVoyageEvent } from '../run/voyageEvents';
import { runStorageKey, useRunStore } from './runStore';

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe('persisted voyage flow', () => {
  beforeEach(() => {
    useRunStore.getState().abandonRun();
    useRunStore.getState().startRun();
    useRunStore.getState().resolveNode('pack-provisions');
    useRunStore.getState().acknowledgeReward(false);
  });

  it('resolves a drawn treasure, previews arrival on the map, then enters the destination', () => {
    expect(useRunStore.getState().beginVoyage(
      'barrel-at-sea',
      sequenceRandom([0, 0.31]),
    )).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      currentNodeId: 'barrel-at-sea',
      mapTravelPending: true,
    }));
    expect(useRunStore.getState().completeTravelPreview()).toBe(true);
    expect(getCurrentVoyageEvent(useRunStore.getState())?.id).toBe('drifting-lockbox');
    expect(useRunStore.getState().resolveVoyageEvent('keep-ledger')).toBe(true);

    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      artifacts: ['merchants-ledger'],
      rewardPending: true,
      rewardDestinationNodeId: 'barrel-at-sea',
      pendingVoyage: expect.objectContaining({ currentEventIndex: 1 }),
    }));

    useRunStore.getState().acknowledgeReward();
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      currentNodeId: 'barrel-at-sea',
      pendingVoyage: expect.objectContaining({
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        currentEventIndex: 1,
      }),
    }));

    expect(useRunStore.getState().beginVoyage('barrel-at-sea')).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'node',
      currentNodeId: 'barrel-at-sea',
      pendingVoyage: null,
    }));
  });

  it('writes the complete draw before presenting the first encounter', async () => {
    expect(useRunStore.getState().beginVoyage(
      'barrel-at-sea',
      sequenceRandom([0.999, 0.31, 0.45, 0.6]),
    )).toBe(true);
    const drawn = useRunStore.getState().pendingVoyage;
    expect(drawn?.eventIds).toHaveLength(3);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      mapTravelPending: true,
    }));
    expect(useRunStore.getState().completeTravelPreview()).toBe(true);

    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    expect(saved?.state).toEqual(expect.objectContaining({
      phase: 'voyage',
      mapTravelPending: false,
      pendingVoyage: drawn,
      voyageEventHistory: expect.arrayContaining(drawn?.eventIds ?? []),
    }));
  });

  it('previews movement on the map even when a route has no voyage events', () => {
    useRunStore.setState({
      phase: 'map',
      currentNodeId: 'alvida-deck',
      completedNodeIds: ['foosha-departure', 'barrel-at-sea', 'alvida-deck'],
      visitedNodeIds: ['foosha-departure', 'barrel-at-sea', 'alvida-deck'],
      chosenBranches: { 'alvida-route': 'alvida-deck' },
      pendingVoyage: null,
      mapTravelPending: false,
    });

    expect(useRunStore.getState().beginVoyage('cobys-resolve', () => 0)).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      currentNodeId: 'cobys-resolve',
      mapTravelPending: true,
      pendingVoyage: expect.objectContaining({ eventIds: [] }),
    }));

    expect(useRunStore.getState().completeTravelPreview()).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'node',
      currentNodeId: 'cobys-resolve',
      pendingVoyage: null,
      mapTravelPending: false,
    }));
  });

  it('advances a random attack on victory and preserves its authored rewards', () => {
    useRunStore.setState({
      phase: 'voyage',
      pendingVoyage: {
        id: 'test-attack',
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        eventIds: ['alvida-stragglers'],
        currentEventIndex: 0,
      },
    });

    expect(useRunStore.getState().startVoyageBattle()).toBe(true);
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      berries: 125,
      bounty: 275,
      rewardDestinationNodeId: 'barrel-at-sea',
      pendingVoyage: expect.objectContaining({ currentEventIndex: 1 }),
    }));
  });

  it('abandons an unfinished voyage leg after defeat without rerolling on reload', () => {
    useRunStore.setState({
      phase: 'voyage',
      pendingVoyage: {
        id: 'test-defeat',
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        eventIds: ['alvida-stragglers', 'moonlit-cove'],
        currentEventIndex: 0,
      },
      voyageEventHistory: ['alvida-stragglers', 'moonlit-cove'],
    });
    useRunStore.getState().startVoyageBattle();
    useRunStore.getState().resolveBattle('defeat');

    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      currentNodeId: 'foosha-departure',
      hull: 80,
      pendingVoyage: null,
      voyageEventHistory: ['alvida-stragglers', 'moonlit-cove'],
      characterHp: expect.objectContaining({ luffy: 60 }),
    }));
  });

  it('uses found rations on the active squad while leaving reserves unchanged', () => {
    useRunStore.setState({
      phase: 'voyage',
      rosterIds: ['luffy', 'zoro'],
      activePartyIds: ['luffy'],
      characterHp: { luffy: 30, zoro: 20 },
      pendingVoyage: {
        id: 'test-rations',
        fromNodeId: 'barrel-at-sea',
        destinationNodeId: 'alvida-deck',
        eventIds: ['alvida-stolen-rations'],
        currentEventIndex: 0,
      },
    });

    expect(useRunStore.getState().resolveVoyageEvent('eat-rations')).toBe(true);
    expect(useRunStore.getState().characterHp).toEqual(expect.objectContaining({
      luffy: 60,
      zoro: 20,
    }));
  });

  it('prevents knocked-out reserves from joining the next battle', () => {
    useRunStore.setState({
      rosterIds: ['luffy', 'zoro'],
      activePartyIds: ['luffy'],
      characterHp: { zoro: 0 },
    });
    expect(useRunStore.getState().addActiveMember('zoro')).toBe(false);
    expect(useRunStore.getState().activePartyIds).toEqual(['luffy']);
  });
});
