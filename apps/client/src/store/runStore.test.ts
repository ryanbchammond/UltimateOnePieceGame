import { beforeEach, describe, expect, it } from 'vitest';
import { getAvailableNodes } from '../run/storyContent';
import type { RunSnapshot } from '../run/types';
import {
  clearObsoleteRunStorage,
  migrateRunState,
  obsoleteRunStorageKeys,
  runStorageKey,
  useRunStore,
} from './runStore';

describe('Story run store', () => {
  beforeEach(() => {
    useRunStore.getState().abandonRun();
  });

  it('starts Romance Dawn at the authored Foosha Village event', () => {
    useRunStore.getState().startRun();
    const run = useRunStore.getState();

    expect(run.phase).toBe('node');
    expect(run.mode).toBe('story');
    expect(run.difficulty).toBe('landlubber');
    expect(run.activeArcId).toBe('romance-dawn');
    expect(run.currentNodeId).toBe('foosha-departure');
    expect(run.completedNodeIds).toEqual([]);
    expect(run.visitedNodeIds).toEqual(['foosha-departure']);
    expect(run.berries).toBe(75);
    expect(run.hull).toBe(90);
    expect(run.rosterIds).toEqual(['luffy']);
    expect(run.guestIds).toEqual([]);
    expect(run.activePartyIds).toEqual(['luffy']);
    expect(run.roleAssignments.captain).toBe('luffy');
    expect(run.roleAssignments.navigator).toBeNull();
    expect(run.latestReward).toBeNull();
  });

  it('applies either approved Foosha preparation and opens the Barrel at Sea', () => {
    useRunStore.getState().startRun();
    expect(useRunStore.getState().resolveNode('pack-provisions')).toBe(true);
    expect(useRunStore.getState().berries).toBe(100);
    expect(useRunStore.getState().hull).toBe(90);
    useRunStore.getState().startRun();
    expect(useRunStore.getState().resolveNode('patch-the-boat')).toBe(true);
    expect(useRunStore.getState().berries).toBe(75);
    expect(useRunStore.getState().hull).toBe(100);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['barrel-at-sea']);
  });

  it('persists the direct route, adds Coby as a guest, and recovers defeat at Foosha', () => {
    reachBarrel();
    expect(useRunStore.getState().resolveNode('rescue-coby-openly')).toBe(true);
    expect(useRunStore.getState().guestIds).toEqual(['coby']);
    expect(useRunStore.getState().activePartyIds).toEqual(['luffy']);
    expect(useRunStore.getState().chosenBranches['alvida-route']).toBe('alvida-deck');
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual(['alvida-deck']);
    expect(useRunStore.getState().enterNode('alvida-hold')).toBe(false);
    expect(useRunStore.getState().enterNode('alvida-deck')).toBe(true);
    useRunStore.getState().resolveBattle('defeat');

    expect(useRunStore.getState().phase).toBe('map');
    expect(useRunStore.getState().currentNodeId).toBe('foosha-departure');
    expect(useRunStore.getState().visitedNodeIds).toContain('alvida-deck');
    expect(useRunStore.getState().hull).toBe(80);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual(['alvida-deck']);
  });

  it('reloads the selected Alvida route and battle phase without losing guest availability', async () => {
    reachBarrel();
    useRunStore.getState().resolveNode('rescue-coby-openly');
    useRunStore.getState().addActiveMember('coby');
    useRunStore.getState().enterNode('alvida-deck');

    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    const snapshot = saved?.state as RunSnapshot;
    expect(snapshot).toEqual(expect.objectContaining({
      phase: 'battle',
      currentNodeId: 'alvida-deck',
      guestIds: ['coby'],
      activePartyIds: ['luffy', 'coby'],
      chosenBranches: { 'alvida-route': 'alvida-deck' },
    }));

    useRunStore.setState(snapshot);
    expect(useRunStore.getState().enterNode('alvida-hold')).toBe(false);
    expect(useRunStore.getState().guestIds).toEqual(['coby']);
  });

  it('completes the direct route with the approved base rewards', () => {
    reachBarrel();
    useRunStore.getState().resolveNode('rescue-coby-openly');
    useRunStore.getState().addActiveMember('coby');
    useRunStore.getState().enterNode('alvida-deck');
    useRunStore.getState().resolveBattle('victory');

    expect(useRunStore.getState().berries).toBe(160);
    expect(useRunStore.getState().bounty).toBe(1650);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual(['cobys-resolve']);
    expect(useRunStore.getState().latestReward).toEqual(expect.objectContaining({
      title: 'Alvida defeated',
      changes: expect.arrayContaining([
        expect.objectContaining({ label: 'Berries', value: '+60' }),
        expect.objectContaining({ label: 'Bounty', value: '+1,650' }),
      ]),
    }));
  });

  it('completes either hold choice and the smaller infiltration battle', () => {
    reachBarrel('patch-the-boat');
    useRunStore.getState().resolveNode('infiltrate-alvidas-ship');
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual(['alvida-hold']);
    useRunStore.getState().enterNode('alvida-hold');
    useRunStore.getState().resolveNode('take-alvidas-supplies');
    expect(useRunStore.getState().berries).toBe(115);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['alvida-hold-battle']);
    useRunStore.getState().enterNode('alvida-hold-battle');
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState().berries).toBe(155);
    expect(useRunStore.getState().bounty).toBe(990);

    reachBarrel('patch-the-boat');
    useRunStore.getState().resolveNode('infiltrate-alvidas-ship');
    useRunStore.getState().enterNode('alvida-hold');
    useRunStore.getState().resolveNode('free-alvidas-captives');
    useRunStore.getState().enterNode('alvida-hold-battle');
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState().berries).toBe(115);
    expect(useRunStore.getState().bounty).toBe(1290);
  });

  it('persists Coby\'s checkpoint and opens the approved Shells Town continuation', async () => {
    reachBarrel();
    useRunStore.getState().resolveNode('rescue-coby-openly');
    useRunStore.getState().enterNode('alvida-deck');
    useRunStore.getState().resolveBattle('victory');
    useRunStore.getState().enterNode('cobys-resolve');
    expect(useRunStore.getState().resolveNode('support-cobys-dream')).toBe(true);

    expect(useRunStore.getState().checkpointNodeId).toBe('cobys-resolve');
    expect(useRunStore.getState().guestIds).toEqual(['coby']);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['shells-town-arrival']);
    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    expect(saved?.state).toEqual(expect.objectContaining({
      activeArcId: 'romance-dawn',
      checkpointNodeId: 'cobys-resolve',
      guestIds: ['coby'],
    }));
  });

  it('locks the Shells Town route and applies its distinct approved rewards', () => {
    reachShellsTown();
    expect(useRunStore.getState().resolveNode('help-rika-openly')).toBe(true);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual(['marine-yard']);
    expect(useRunStore.getState().enterNode('execution-grounds')).toBe(false);
    expect(useRunStore.getState().enterNode('marine-yard')).toBe(true);
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState().berries).toBe(220);
    expect(useRunStore.getState().bounty).toBe(2970);

    reachShellsTown();
    expect(useRunStore.getState().resolveNode('gather-information-quietly')).toBe(true);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['execution-grounds']);
    expect(useRunStore.getState().enterNode('marine-yard')).toBe(false);
    expect(useRunStore.getState().enterNode('execution-grounds')).toBe(true);
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState().berries).toBe(190);
    expect(useRunStore.getState().bounty).toBe(2310);
  });

  it('reconverges at Zoro, recruits him permanently, and leaves lineup control to the player', () => {
    reachZoro('help-rika-openly');
    expect(useRunStore.getState().resolveNode('return-zoros-swords')).toBe(true);

    const run = useRunStore.getState();
    expect(run.rosterIds).toEqual(['luffy', 'zoro']);
    expect(run.guestIds).toEqual(['coby']);
    expect(run.activePartyIds).toEqual(['luffy']);
    expect(run.roleAssignments['fighter-1']).toBe('zoro');
    expect(getAvailableNodes(run).map((node) => node.id)).toEqual(['morgan-last-stand']);
  });

  it('awards the Morgan climax and persists Coby\'s farewell arc pack', async () => {
    reachZoro('gather-information-quietly');
    useRunStore.getState().resolveNode('return-zoros-swords');
    useRunStore.getState().addActiveMember('zoro');
    useRunStore.getState().addActiveMember('coby');
    useRunStore.getState().enterNode('morgan-last-stand');
    useRunStore.getState().resolveBattle('victory');

    expect(useRunStore.getState().berries).toBe(290);
    expect(useRunStore.getState().bounty).toBe(5610);
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['marines-farewell']);
    useRunStore.getState().enterNode('marines-farewell');
    expect(useRunStore.getState().resolveNode('honor-cobys-farewell')).toBe(true);

    const run = useRunStore.getState();
    expect(run.phase).toBe('node');
    expect(run.checkpointNodeId).toBe('marines-farewell');
    expect(run.guestIds).toEqual([]);
    expect(run.activePartyIds).toEqual(['luffy', 'zoro']);
    expect(run.pendingPack).toEqual(expect.objectContaining({
      packId: 'romance-dawn',
      source: 'arc-reward',
      resume: {
        phase: 'map',
        activeArcId: 'orange-town',
        currentNodeId: 'orange-town-harbor',
      },
    }));
    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    expect((saved?.state as RunSnapshot | undefined)?.pendingPack?.packId).toBe('romance-dawn');
  });

  it('transitions to the separate Orange Town map only after one arc card is kept', () => {
    reachZoro('help-rika-openly');
    useRunStore.getState().resolveNode('return-zoros-swords');
    useRunStore.getState().enterNode('morgan-last-stand');
    useRunStore.getState().resolveBattle('victory');
    useRunStore.getState().enterNode('marines-farewell');
    useRunStore.getState().resolveNode('honor-cobys-farewell');

    const pack = useRunStore.getState().pendingPack!;
    expect(useRunStore.getState().activeArcId).toBe('romance-dawn');
    for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);

    const run = useRunStore.getState();
    expect(run).toEqual(expect.objectContaining({
      phase: 'map',
      activeArcId: 'orange-town',
      currentNodeId: 'orange-town-harbor',
      visitedNodeIds: expect.arrayContaining(['marines-farewell', 'orange-town-harbor']),
      pendingPack: null,
      crewAssignmentWindow: 'card-pull',
    }));
    expect(getAvailableNodes(run).map((node) => node.id)).toEqual(['orange-town-harbor']);
  });

  it('uses a clean dev-build save and removes obsolete alpha storage', () => {
    const removed: string[] = [];
    clearObsoleteRunStorage({
      getItem: () => null,
      setItem: () => undefined,
      removeItem: (name) => removed.push(name),
    });

    expect(removed).toEqual(obsoleteRunStorageKeys);
    expect(obsoleteRunStorageKeys).toContain('uopa-story-dev-v2');
    expect(obsoleteRunStorageKeys).toContain('uopa-story-dev-v3');
    expect(obsoleteRunStorageKeys).not.toContain(runStorageKey);
  });

  it('migrates version-1 saves with completed and current nodes revealed', () => {
    useRunStore.getState().startRun();
    const current = useRunStore.getState();
    const { visitedNodeIds: _visitedNodeIds, ...versionOne } = current;
    const migrated = migrateRunState({
      ...versionOne,
      completedNodeIds: ['foosha-departure', 'barrel-at-sea'],
      currentNodeId: 'alvida-deck',
    }, 1);

    expect(migrated.visitedNodeIds)
      .toEqual(['foosha-departure', 'barrel-at-sea', 'alvida-deck']);
  });

  it('allows unrestricted one-to-four fighter parties from permanent and guest characters', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({ guestIds: ['coby'] });

    expect(useRunStore.getState().removeActiveMember('luffy')).toBe(false);
    expect(useRunStore.getState().addActiveMember('coby')).toBe(true);
    expect(useRunStore.getState().activePartyIds).toEqual(['luffy', 'coby']);
    expect(useRunStore.getState().removeActiveMember('luffy')).toBe(true);
    expect(useRunStore.getState().activePartyIds).toEqual(['coby']);
    expect(useRunStore.getState().addActiveMember('luffy')).toBe(true);
    expect(useRunStore.getState().assignCrewRole('coby', 'fighter-1')).toBe(false);
    expect(useRunStore.getState().addActiveMember('smoker')).toBe(false);
  });

  it('only changes ship assignments after a pull or at an approved rest site', () => {
    useRunStore.getState().startRun();

    expect(useRunStore.getState().assignCrewRole('luffy', 'navigator')).toBe(false);
    expect(useRunStore.getState().roleAssignments.navigator).toBeNull();

    useRunStore.setState({ crewAssignmentWindow: 'card-pull' });
    expect(useRunStore.getState().assignCrewRole('luffy', 'navigator')).toBe(true);
    expect(useRunStore.getState().roleAssignments.navigator).toBe('luffy');
    expect(useRunStore.getState().roleAssignments.captain).toBeNull();

    useRunStore.setState({
      crewAssignmentWindow: null,
      currentNodeId: 'baratie',
      phase: 'node',
    });
    expect(useRunStore.getState().assignCrewRole('luffy', 'captain')).toBe(true);
    expect(useRunStore.getState().roleAssignments.captain).toBe('luffy');
    expect(useRunStore.getState().roleAssignments.navigator).toBeNull();
  });

  it('opens an atomic five-card pack without awarding any candidate yet', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node', berries: 600 });

    const result = useRunStore.getState().openCardPack(sequenceRandom(0));
    const run = useRunStore.getState();

    expect(result?.cards).toHaveLength(5);
    expect(result?.cards.map((card) => card.characterId)).toEqual([
      'tashigi',
      'coby',
      'coby',
      'coby',
      'coby',
    ]);
    expect(result?.cards.every((card) => !card.revealed)).toBe(true);
    expect(run.berries).toBe(300);
    expect(run.packsOpened).toBe(1);
    expect(run.pendingPack?.id).toBe('baratie-east-blue-1');
    expect(run.rosterIds).not.toContain('coby');
    expect(run.rosterIds).not.toContain('tashigi');
    expect(run.characterShards.coby).toBeUndefined();
    expect(Object.values(run.roleAssignments)).not.toContain('coby');
    expect(run.crewAssignmentWindow).toBeNull();
    expect(run.latestReward).toEqual(expect.objectContaining({
      title: 'Pack purchased',
      changes: [expect.objectContaining({ label: 'Berries', value: '-300' })],
    }));
  });

  it('reveals cards in any order and gates completion and departure', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({
      currentNodeId: 'baratie',
      phase: 'node',
      berries: 600,
    });
    const pack = useRunStore.getState().openCardPack(sequenceRandom(0))!;

    expect(useRunStore.getState().resolveNode('dock-and-repair')).toBe(false);
    expect(useRunStore.getState().openCardPack(sequenceRandom(0))).toBeNull();
    expect(useRunStore.getState().revealPackCard(pack.cards[3].cardId)).toBe(true);
    expect(useRunStore.getState().revealPackCard(pack.cards[0].cardId)).toBe(true);
    expect(useRunStore.getState().revealPackCard(pack.cards[3].cardId)).toBe(false);
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(false);

    for (const card of pack.cards) {
      useRunStore.getState().revealPackCard(card.cardId);
    }
    expect(useRunStore.getState().pendingPack?.cards.every((card) => card.revealed)).toBe(true);
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);
    expect(useRunStore.getState().pendingPack).toBeNull();
    expect(useRunStore.getState().rosterIds).toContain('tashigi');
    expect(useRunStore.getState().rosterIds).not.toContain('coby');
    expect(useRunStore.getState().crewAssignmentWindow).toBe('card-pull');
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(false);
    expect(useRunStore.getState().resolveNode('dock-and-repair')).toBe(true);
  });

  it('persists stable card ids and partial reveal progress', async () => {
    useRunStore.getState().startRun();
    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node', berries: 600 });
    const pack = useRunStore.getState().openCardPack(sequenceRandom(0))!;
    useRunStore.getState().revealPackCard(pack.cards[2].cardId);

    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    const pendingPack = (saved?.state as RunSnapshot | undefined)?.pendingPack;

    expect(pendingPack?.id).toBe('baratie-east-blue-1');
    expect(pendingPack?.cards.map((card) => card.cardId)).toEqual(pack.cards.map((card) => card.cardId));
    expect(pendingPack?.cards.map((card) => card.revealed)).toEqual([false, false, true, false, false]);
  });

  it('resumes an authored arc transition only after an arc-reward card is kept', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node', berries: 600 });
    const pack = useRunStore.getState().openCardPack(sequenceRandom(0))!;
    useRunStore.setState({
      pendingPack: {
        ...pack,
        source: 'arc-reward',
        resume: {
          phase: 'map',
          activeArcId: 'orange-town',
          currentNodeId: 'orange-town-harbor',
        },
      },
    });

    for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      activeArcId: 'orange-town',
      currentNodeId: 'orange-town-harbor',
      pendingPack: null,
    }));
  });

  it('awards only the selected duplicate and can spend its shard on a star upgrade', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({
      currentNodeId: 'baratie',
      phase: 'node',
      berries: 300,
      rosterIds: [...useRunStore.getState().rosterIds, 'coby', 'tashigi'],
      characterShards: { coby: 2 },
    });

    const pack = useRunStore.getState().openCardPack(sequenceRandom(0))!;
    for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
    expect(useRunStore.getState().claimPackCard(pack.cards[1].cardId)).toBe(true);

    expect(useRunStore.getState().berries).toBe(0);
    expect(useRunStore.getState().characterShards.tashigi).toBeUndefined();
    expect(useRunStore.getState().characterShards.coby).toBe(3);
    expect(useRunStore.getState().latestReward).toEqual(expect.objectContaining({
      title: 'Duplicate card kept',
      changes: [expect.objectContaining({ label: 'Shard', value: '+1 Coby' })],
    }));
    expect(useRunStore.getState().upgradeCharacter('coby')).toBe(true);
    expect(useRunStore.getState().characterStars.coby).toBe(2);
    expect(useRunStore.getState().characterShards.coby).toBe(0);
    expect(useRunStore.getState().latestReward).toEqual(expect.objectContaining({
      title: 'Coby upgraded',
    }));
    expect(useRunStore.getState().upgradeCharacter('coby')).toBe(false);
  });

  it('rejects pack purchases outside Taverns or without enough Berries', () => {
    useRunStore.getState().startRun();
    expect(useRunStore.getState().openCardPack(sequenceRandom(0))).toBeNull();

    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node', berries: 299 });
    expect(useRunStore.getState().openCardPack(sequenceRandom(0))).toBeNull();
    expect(useRunStore.getState().berries).toBe(299);
  });

  it('persists spent PP and fully restores it when resting at the Baratie', () => {
    useRunStore.getState().startRun();
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 2);
    useRunStore.getState().setCharacterMovePp('nami', 'thunderbolt-tempo', 0);

    expect(useRunStore.getState().characterMovePp.luffy?.pistol).toBe(2);
    expect(useRunStore.getState().characterMovePp.nami?.['thunderbolt-tempo']).toBe(0);

    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node' });
    expect(useRunStore.getState().resolveNode('dock-and-repair')).toBe(true);
    expect(useRunStore.getState().characterMovePp).toEqual({});
  });

  it('restores PP after defeat only when the saved checkpoint is a rest site', () => {
    useRunStore.getState().startRun();
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 1);
    useRunStore.setState({
      phase: 'battle',
      currentNodeId: 'arlong-park',
      checkpointNodeId: 'baratie',
    });
    useRunStore.getState().resolveBattle('defeat');
    expect(useRunStore.getState().characterMovePp).toEqual({});

    useRunStore.getState().startRun();
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 1);
    useRunStore.setState({ phase: 'battle', currentNodeId: 'shells-town' });
    useRunStore.getState().resolveBattle('defeat');
    expect(useRunStore.getState().characterMovePp.luffy?.pistol).toBe(1);
  });

  it('persists a reward receipt until the next node begins', async () => {
    reachBarrel();
    useRunStore.getState().resolveNode('rescue-coby-openly');
    useRunStore.getState().enterNode('alvida-deck');
    useRunStore.getState().resolveBattle('victory');

    expect(useRunStore.getState().latestReward?.title).toBe('Alvida defeated');
    const storage = useRunStore.persist.getOptions().storage!;
    const saved = await storage.getItem(runStorageKey);
    expect((saved?.state as RunSnapshot | undefined)?.latestReward?.title).toBe('Alvida defeated');

    expect(useRunStore.getState().enterNode('cobys-resolve')).toBe(true);
    expect(useRunStore.getState().latestReward).toBeNull();
  });

});

function sequenceRandom(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}

function reachBarrel(fooshaChoice = 'pack-provisions'): void {
  useRunStore.getState().startRun();
  expect(useRunStore.getState().resolveNode(fooshaChoice)).toBe(true);
  expect(useRunStore.getState().enterNode('barrel-at-sea')).toBe(true);
}

function reachShellsTown(): void {
  reachBarrel();
  expect(useRunStore.getState().resolveNode('rescue-coby-openly')).toBe(true);
  expect(useRunStore.getState().enterNode('alvida-deck')).toBe(true);
  useRunStore.getState().resolveBattle('victory');
  expect(useRunStore.getState().enterNode('cobys-resolve')).toBe(true);
  expect(useRunStore.getState().resolveNode('support-cobys-dream')).toBe(true);
  expect(useRunStore.getState().enterNode('shells-town-arrival')).toBe(true);
}

function reachZoro(shellsChoice: 'help-rika-openly' | 'gather-information-quietly'): void {
  reachShellsTown();
  expect(useRunStore.getState().resolveNode(shellsChoice)).toBe(true);
  const encounterId = shellsChoice === 'help-rika-openly' ? 'marine-yard' : 'execution-grounds';
  expect(useRunStore.getState().enterNode(encounterId)).toBe(true);
  useRunStore.getState().resolveBattle('victory');
  expect(useRunStore.getState().enterNode('free-pirate-hunter')).toBe(true);
}
