import { beforeEach, describe, expect, it } from 'vitest';
import { getAvailableNodes, storyNodeChoices } from '../run/storyContent';
import { orangeTownArc } from '../run/orangeTownMap';
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

  it('preserves the selected Shells Town route, visited fog state, and PP after defeat', () => {
    reachShellsTown();
    expect(useRunStore.getState().resolveNode('help-rika-openly')).toBe(true);
    expect(useRunStore.getState().enterNode('marine-yard')).toBe(true);
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 3);
    useRunStore.getState().resolveBattle('defeat');

    const run = useRunStore.getState();
    expect(run).toEqual(expect.objectContaining({
      phase: 'map',
      currentNodeId: 'cobys-resolve',
      checkpointNodeId: 'cobys-resolve',
      chosenBranches: expect.objectContaining({ 'shells-route': 'marine-yard' }),
      characterMovePp: expect.objectContaining({ luffy: expect.objectContaining({ pistol: 3 }) }),
    }));
    expect(run.visitedNodeIds).toContain('marine-yard');
    expect(run.visitedNodeIds).not.toContain('execution-grounds');
    expect(getAvailableNodes(run).map((node) => node.id)).toEqual(['marine-yard']);
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
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 1);
    useRunStore.getState().setCharacterMovePp('zoro', 'onigiri', 0);
    expect(useRunStore.getState().resolveNode('honor-cobys-farewell')).toBe(true);

    const run = useRunStore.getState();
    expect(run.phase).toBe('node');
    expect(run.checkpointNodeId).toBe('marines-farewell');
    expect(run.guestIds).toEqual([]);
    expect(run.activePartyIds).toEqual(['luffy', 'zoro']);
    expect(run.characterMovePp).toEqual({});
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

  it.each([
    { foosha: 'pack-provisions', alvida: 'direct', hold: null, shells: 'open', berries: 320, bounty: 6270 },
    { foosha: 'pack-provisions', alvida: 'direct', hold: null, shells: 'quiet', berries: 290, bounty: 5610 },
    { foosha: 'patch-the-boat', alvida: 'direct', hold: null, shells: 'open', berries: 295, bounty: 6270 },
    { foosha: 'patch-the-boat', alvida: 'direct', hold: null, shells: 'quiet', berries: 265, bounty: 5610 },
    { foosha: 'pack-provisions', alvida: 'infiltrate', hold: 'supplies', shells: 'open', berries: 340, bounty: 5610 },
    { foosha: 'pack-provisions', alvida: 'infiltrate', hold: 'supplies', shells: 'quiet', berries: 310, bounty: 4950 },
    { foosha: 'patch-the-boat', alvida: 'infiltrate', hold: 'supplies', shells: 'open', berries: 315, bounty: 5610 },
    { foosha: 'patch-the-boat', alvida: 'infiltrate', hold: 'supplies', shells: 'quiet', berries: 285, bounty: 4950 },
    { foosha: 'pack-provisions', alvida: 'infiltrate', hold: 'captives', shells: 'open', berries: 300, bounty: 5910 },
    { foosha: 'pack-provisions', alvida: 'infiltrate', hold: 'captives', shells: 'quiet', berries: 270, bounty: 5250 },
    { foosha: 'patch-the-boat', alvida: 'infiltrate', hold: 'captives', shells: 'open', berries: 275, bounty: 5910 },
    { foosha: 'patch-the-boat', alvida: 'infiltrate', hold: 'captives', shells: 'quiet', berries: 245, bounty: 5250 },
  ] as const)(
    'completes the full $foosha/$alvida/$hold/$shells route with exact progression',
    ({ foosha, alvida, hold, shells, berries, bounty }) => {
      completeRomanceDawnRoute({ foosha, alvida, hold, shells });

      const farewell = useRunStore.getState();
      expect(farewell).toEqual(expect.objectContaining({
        phase: 'node',
        activeArcId: 'romance-dawn',
        currentNodeId: 'marines-farewell',
        checkpointNodeId: 'marines-farewell',
        berries,
        bounty,
        rosterIds: ['luffy', 'zoro'],
        guestIds: [],
      }));
      expect(farewell.pendingPack?.packId).toBe('romance-dawn');
      expect(farewell.completedNodeIds).toContain('morgan-last-stand');
      expect(farewell.visitedNodeIds).not.toContain(
        alvida === 'direct' ? 'alvida-hold' : 'alvida-deck',
      );
      expect(farewell.visitedNodeIds).not.toContain(
        shells === 'open' ? 'execution-grounds' : 'marine-yard',
      );

      const pack = farewell.pendingPack!;
      for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
      expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);
      expect(useRunStore.getState()).toEqual(expect.objectContaining({
        phase: 'map',
        activeArcId: 'orange-town',
        currentNodeId: 'orange-town-harbor',
        pendingPack: null,
      }));
    },
  );

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

  it('migrates a version-2 pack into the sealed stage without replaying an old reward', () => {
    useRunStore.getState().startRun();
    useRunStore.setState({ currentNodeId: 'baratie', phase: 'node', berries: 600 });
    const opening = useRunStore.getState().openCardPack(sequenceRandom(0))!;
    const { stage: _stage, ...versionTwoOpening } = opening;

    const migrated = migrateRunState({
      ...useRunStore.getState(),
      pendingPack: versionTwoOpening,
      rewardPending: true,
    }, 2);

    expect(migrated.pendingPack?.stage).toBe('sealed');
    expect(migrated.rewardPending).toBe(false);
    expect(migrated.rewardDestinationNodeId).toBeNull();
  });

  it('adds empty voyage state to pre-Milestone-9 saves', () => {
    useRunStore.getState().startRun();
    const {
      pendingVoyage: _pendingVoyage,
      voyageEventHistory: _history,
      characterHp: _characterHp,
      ...versionThree
    } =
      useRunStore.getState();
    const migrated = migrateRunState(versionThree, 3);

    expect(migrated.pendingVoyage).toBeNull();
    expect(migrated.voyageEventHistory).toEqual([]);
    expect(migrated.characterHp).toEqual({});
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
    expect(result?.stage).toBe('sealed');
    expect(useRunStore.getState().openPendingPack()).toBe(true);
    expect(useRunStore.getState().pendingPack?.stage).toBe('cards');
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

  it('starts Orange Town locally, adds Nami as an optional guest, and opens three officer routes', () => {
    beginOrangeTown();

    expect(useRunStore.getState().enterNode('orange-town-harbor')).toBe(true);
    expect(useRunStore.getState().resolveNode('ally-with-nami')).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      checkpointNodeId: 'orange-town-harbor',
      guestIds: ['nami'],
      activePartyIds: ['luffy', 'zoro'],
    }));
    expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
      .toEqual(['chouchous-stand']);

    expect(useRunStore.getState().enterNode('chouchous-stand')).toBe(true);
    expect(Object.keys(useRunStore.getState().chosenBranches)).not.toContain('orange-officer-route');
    expect(storyNodeChoices['chouchous-stand']).toHaveLength(3);
  });

  it.each([
    {
      routeChoice: 'defend-chouchous-shop', encounterId: 'beast-tamers-street',
      routeBerries: 75, routeBounty: 1320, routeHullDamage: 0,
      mayorChoice: 'protect-orange-town-civilians', mayorBerries: 0, mayorBounty: 900,
      mayorHull: (hull: number) => hull - 8,
    },
    {
      routeChoice: 'defend-chouchous-shop', encounterId: 'beast-tamers-street',
      routeBerries: 75, routeBounty: 1320, routeHullDamage: 0,
      mayorChoice: 'rally-orange-town', mayorBerries: 0, mayorBounty: 450,
      mayorHull: (hull: number) => Math.min(100, hull + 10),
    },
    {
      routeChoice: 'defend-chouchous-shop', encounterId: 'beast-tamers-street',
      routeBerries: 75, routeBounty: 1320, routeHullDamage: 0,
      mayorChoice: 'prioritize-buggy-supplies', mayorBerries: 100, mayorBounty: -300,
      mayorHull: (hull: number) => hull,
    },
    {
      routeChoice: 'set-harbor-decoy', encounterId: 'harbor-decoy',
      routeBerries: 110, routeBounty: 770, routeHullDamage: 8,
      mayorChoice: 'protect-orange-town-civilians', mayorBerries: 0, mayorBounty: 900,
      mayorHull: (hull: number) => hull - 8,
    },
    {
      routeChoice: 'set-harbor-decoy', encounterId: 'harbor-decoy',
      routeBerries: 110, routeBounty: 770, routeHullDamage: 8,
      mayorChoice: 'rally-orange-town', mayorBerries: 0, mayorBounty: 450,
      mayorHull: (hull: number) => Math.min(100, hull + 10),
    },
    {
      routeChoice: 'set-harbor-decoy', encounterId: 'harbor-decoy',
      routeBerries: 110, routeBounty: 770, routeHullDamage: 8,
      mayorChoice: 'prioritize-buggy-supplies', mayorBerries: 100, mayorBounty: -300,
      mayorHull: (hull: number) => hull,
    },
    {
      routeChoice: 'follow-nami-rooftops', encounterId: 'acrobat-rooftops',
      routeBerries: 50, routeBounty: 990, routeHullDamage: 0,
      mayorChoice: 'protect-orange-town-civilians', mayorBerries: 0, mayorBounty: 900,
      mayorHull: (hull: number) => hull - 8,
    },
    {
      routeChoice: 'follow-nami-rooftops', encounterId: 'acrobat-rooftops',
      routeBerries: 50, routeBounty: 990, routeHullDamage: 0,
      mayorChoice: 'rally-orange-town', mayorBerries: 0, mayorBounty: 450,
      mayorHull: (hull: number) => Math.min(100, hull + 10),
    },
    {
      routeChoice: 'follow-nami-rooftops', encounterId: 'acrobat-rooftops',
      routeBerries: 50, routeBounty: 990, routeHullDamage: 0,
      mayorChoice: 'prioritize-buggy-supplies', mayorBerries: 100, mayorBounty: -300,
      mayorHull: (hull: number) => hull,
    },
  ])(
    'completes $encounterId into $mayorChoice with exact consequences and a PP-restoring checkpoint',
    ({
      routeChoice,
      encounterId,
      routeBerries,
      routeBounty,
      routeHullDamage,
      mayorChoice,
      mayorBerries,
      mayorBounty,
      mayorHull,
    }) => {
      reachOrangeOfficerChoice();
      expect(useRunStore.getState().resolveNode(routeChoice)).toBe(true);
      expect(useRunStore.getState().chosenBranches['orange-officer-route']).toBe(encounterId);
      expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual([encounterId]);
      expect(useRunStore.getState().enterNode(encounterId)).toBe(true);
      useRunStore.getState().resolveBattle('victory');

      const afterRouteHull = 90 - routeHullDamage;
      expect(useRunStore.getState()).toEqual(expect.objectContaining({
        berries: 300 + routeBerries,
        bounty: 6000 + routeBounty,
        hull: afterRouteHull,
      }));
      expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
        .toEqual(['mayors-resolve']);

      expect(useRunStore.getState().enterNode('mayors-resolve')).toBe(true);
      useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 1);
      useRunStore.getState().setCharacterMovePp('zoro', 'onigiri', 0);
      expect(useRunStore.getState().resolveNode(mayorChoice)).toBe(true);

      expect(useRunStore.getState()).toEqual(expect.objectContaining({
        phase: 'map',
        berries: 300 + routeBerries + mayorBerries,
        bounty: 6000 + routeBounty + mayorBounty,
        hull: mayorHull(afterRouteHull),
        checkpointNodeId: 'mayors-resolve',
        characterMovePp: {},
      }));
      expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id))
        .toEqual(['buggys-big-top']);
    },
  );

  it('recovers an Orange Town route defeat at Harbor without revealing the unchosen branches', () => {
    reachOrangeOfficerChoice();
    expect(useRunStore.getState().resolveNode('follow-nami-rooftops')).toBe(true);
    expect(useRunStore.getState().enterNode('acrobat-rooftops')).toBe(true);
    useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 2);
    useRunStore.getState().resolveBattle('defeat');

    const run = useRunStore.getState();
    expect(run).toEqual(expect.objectContaining({
      phase: 'map',
      activeArcId: 'orange-town',
      currentNodeId: 'orange-town-harbor',
      checkpointNodeId: 'orange-town-harbor',
      hull: 80,
      guestIds: ['nami'],
      chosenBranches: expect.objectContaining({ 'orange-officer-route': 'acrobat-rooftops' }),
      characterMovePp: expect.objectContaining({ luffy: expect.objectContaining({ pistol: 2 }) }),
    }));
    expect(run.visitedNodeIds).toContain('acrobat-rooftops');
    expect(run.visitedNodeIds).not.toContain('beast-tamers-street');
    expect(run.visitedNodeIds).not.toContain('harbor-decoy');
    expect(getAvailableNodes(run).map((node) => node.id)).toEqual(['acrobat-rooftops']);
  });

  it('acknowledges a story outcome and begins a persisted voyage to its sole destination', () => {
    useRunStore.getState().startRun();
    expect(useRunStore.getState().resolveNode('pack-provisions')).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      rewardPending: true,
      rewardDestinationNodeId: 'barrel-at-sea',
    }));

    useRunStore.getState().acknowledgeReward();
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'voyage',
      currentNodeId: 'foosha-departure',
      rewardPending: false,
      rewardDestinationNodeId: null,
      pendingVoyage: expect.objectContaining({
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        currentEventIndex: 0,
      }),
    }));
    expect(useRunStore.getState().pendingVoyage?.eventIds.length).toBeGreaterThanOrEqual(1);
    expect(useRunStore.getState().pendingVoyage?.eventIds.length).toBeLessThanOrEqual(3);
  });

  it('completes Buggy, permanently recruits Nami, and continues to Syrup Village after the Orange Town pack', () => {
    reachOrangeOfficerChoice();
    expect(useRunStore.getState().resolveNode('set-harbor-decoy')).toBe(true);
    expect(useRunStore.getState().enterNode('harbor-decoy')).toBe(true);
    useRunStore.getState().resolveBattle('victory');
    expect(useRunStore.getState().enterNode('mayors-resolve')).toBe(true);
    expect(useRunStore.getState().resolveNode('rally-orange-town')).toBe(true);
    expect(useRunStore.getState().enterNode('buggys-big-top')).toBe(true);
    useRunStore.getState().resolveBattle('victory');

    expect(useRunStore.getState().berries).toBe(560);
    expect(useRunStore.getState().bounty).toBe(12_170);
    expect(useRunStore.getState().enterNode('maps-and-promises')).toBe(true);
    expect(useRunStore.getState().resolveNode('welcome-nami-aboard')).toBe(true);

    const beforePack = useRunStore.getState();
    expect(beforePack.rosterIds).toContain('nami');
    expect(beforePack.guestIds).not.toContain('nami');
    expect(beforePack.roleAssignments.navigator).toBe('nami');
    expect(beforePack.pendingPack).toEqual(expect.objectContaining({
      packId: 'orange-town',
      stage: 'sealed',
      source: 'arc-reward',
    }));

    const pack = beforePack.pendingPack!;
    expect(useRunStore.getState().openPendingPack()).toBe(true);
    for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
    expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);
    expect(useRunStore.getState()).toEqual(expect.objectContaining({
      phase: 'map',
      activeArcId: 'syrup-village',
      currentNodeId: 'syrup-village-shore',
      pendingPack: null,
      rewardPending: true,
      rewardDestinationNodeId: 'syrup-village-shore',
      rewardOriginNodeId: 'maps-and-promises',
      crewAssignmentWindow: 'card-pull',
    }));
  });

  it.each([
    ['believe-usopp', 'syrup-north-slope', 'fortify-the-slope', 535, 17_900],
    ['follow-the-money', 'syrup-mansion-grounds', 'guard-kayas-household', 640, 17_170],
  ] as const)(
    'completes the Syrup Village %s route, recruits Usopp, and closes the third arc',
    (warningChoice, encounterId, restChoice, expectedBerries, expectedBounty) => {
      beginSyrupVillage();
      expect(useRunStore.getState().resolveNode('hear-usopp-out')).toBe(true);
      expect(useRunStore.getState().guestIds).toContain('usopp');
      expect(useRunStore.getState().activePartyIds).not.toContain('usopp');
      expect(useRunStore.getState().checkpointNodeId).toBe('syrup-village-shore');

      expect(useRunStore.getState().enterNode('usopps-warning')).toBe(true);
      expect(useRunStore.getState().resolveNode(warningChoice)).toBe(true);
      expect(getAvailableNodes(useRunStore.getState()).map((node) => node.id)).toEqual([encounterId]);
      expect(useRunStore.getState().enterNode(encounterId)).toBe(true);
      useRunStore.getState().resolveBattle('victory');

      expect(useRunStore.getState().enterNode('night-before-the-raid')).toBe(true);
      useRunStore.getState().setCharacterMovePp('luffy', 'pistol', 1);
      expect(useRunStore.getState().resolveNode(restChoice)).toBe(true);
      expect(useRunStore.getState().characterMovePp).toEqual({});
      expect(useRunStore.getState().checkpointNodeId).toBe('night-before-the-raid');

      expect(useRunStore.getState().enterNode('kuros-black-cat-raid')).toBe(true);
      useRunStore.getState().resolveBattle('victory');
      expect(useRunStore.getState().berries).toBe(expectedBerries);
      expect(useRunStore.getState().bounty).toBe(expectedBounty);

      expect(useRunStore.getState().enterNode('the-going-merry')).toBe(true);
      expect(useRunStore.getState().resolveNode('welcome-usopp-aboard')).toBe(true);
      const beforePack = useRunStore.getState();
      expect(beforePack.rosterIds).toContain('usopp');
      expect(beforePack.guestIds).not.toContain('usopp');
      expect(beforePack.hull).toBe(100);
      expect(beforePack.pendingPack).toEqual(expect.objectContaining({
        packId: 'syrup-village',
        source: 'arc-reward',
      }));

      const pack = beforePack.pendingPack!;
      useRunStore.getState().openPendingPack();
      for (const card of pack.cards) useRunStore.getState().revealPackCard(card.cardId);
      expect(useRunStore.getState().claimPackCard(pack.cards[0].cardId)).toBe(true);
      expect(useRunStore.getState()).toEqual(expect.objectContaining({
        phase: 'victory',
        activeArcId: 'syrup-village',
        currentNodeId: 'the-going-merry',
        pendingPack: null,
        rewardPending: true,
      }));
    },
  );

  it('migrates completed Orange Town saves and pending packs into the Syrup Village continuation', () => {
    useRunStore.getState().startRun();
    const base = useRunStore.getState();
    const completed = migrateRunState({
      ...base,
      phase: 'victory',
      activeArcId: 'orange-town',
      currentNodeId: 'maps-and-promises',
      visitedNodeIds: ['maps-and-promises'],
    }, 5);
    expect(completed).toEqual(expect.objectContaining({
      phase: 'node',
      activeArcId: 'syrup-village',
      currentNodeId: 'syrup-village-shore',
      rewardPending: false,
    }));
    expect(completed.visitedNodeIds).toContain('syrup-village-shore');

    const pending = migrateRunState({
      ...base,
      pendingPack: {
        id: 'orange-town-1',
        packId: 'orange-town',
        packNumber: 1,
        source: 'arc-reward',
        stage: 'sealed',
        cards: [],
        resume: {
          phase: 'victory',
          activeArcId: 'orange-town',
          currentNodeId: 'maps-and-promises',
        },
      },
    }, 5);
    expect(pending.pendingPack?.resume).toEqual({
      phase: 'map',
      activeArcId: 'syrup-village',
      currentNodeId: 'syrup-village-shore',
    });
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

function beginOrangeTown(): void {
  useRunStore.getState().startRun();
  useRunStore.setState({
    phase: 'map',
    activeArcId: 'orange-town',
    berries: 300,
    bounty: 6000,
    hull: 90,
    maxHull: 100,
    completedNodeIds: ['marines-farewell'],
    visitedNodeIds: ['marines-farewell', 'orange-town-harbor'],
    currentNodeId: 'orange-town-harbor',
    checkpointNodeId: 'marines-farewell',
    chosenBranches: {},
    journal: ['Luffy and Zoro reached Orange Town.'],
    rosterIds: ['luffy', 'zoro'],
    guestIds: [],
    activePartyIds: ['luffy', 'zoro'],
    roleAssignments: { ...orangeTownArc.start.roleAssignments },
    characterMovePp: {},
    pendingPack: null,
    latestReward: null,
  });
}

function beginSyrupVillage(): void {
  useRunStore.getState().startRun();
  useRunStore.setState({
    phase: 'node',
    activeArcId: 'syrup-village',
    berries: 300,
    bounty: 12_000,
    hull: 90,
    currentNodeId: 'syrup-village-shore',
    checkpointNodeId: 'maps-and-promises',
    completedNodeIds: ['maps-and-promises'],
    visitedNodeIds: ['maps-and-promises', 'syrup-village-shore'],
    rosterIds: ['luffy', 'zoro', 'nami'],
    guestIds: [],
    activePartyIds: ['luffy', 'zoro', 'nami'],
    roleAssignments: {
      ...orangeTownArc.start.roleAssignments,
      navigator: 'nami',
    },
    characterMovePp: {},
    characterHp: {},
    pendingPack: null,
    rewardPending: false,
    latestReward: null,
  });
}

function reachOrangeOfficerChoice(): void {
  beginOrangeTown();
  expect(useRunStore.getState().enterNode('orange-town-harbor')).toBe(true);
  expect(useRunStore.getState().resolveNode('ally-with-nami')).toBe(true);
  expect(useRunStore.getState().enterNode('chouchous-stand')).toBe(true);
}

interface RomanceDawnRoute {
  foosha: 'pack-provisions' | 'patch-the-boat';
  alvida: 'direct' | 'infiltrate';
  hold: 'supplies' | 'captives' | null;
  shells: 'open' | 'quiet';
}

function completeRomanceDawnRoute(route: RomanceDawnRoute): void {
  reachBarrel(route.foosha);
  if (route.alvida === 'direct') {
    expect(route.hold).toBeNull();
    expect(useRunStore.getState().resolveNode('rescue-coby-openly')).toBe(true);
    expect(useRunStore.getState().enterNode('alvida-deck')).toBe(true);
  } else {
    expect(route.hold).not.toBeNull();
    expect(useRunStore.getState().resolveNode('infiltrate-alvidas-ship')).toBe(true);
    expect(useRunStore.getState().enterNode('alvida-hold')).toBe(true);
    const holdChoice = route.hold === 'supplies'
      ? 'take-alvidas-supplies'
      : 'free-alvidas-captives';
    expect(useRunStore.getState().resolveNode(holdChoice)).toBe(true);
    expect(useRunStore.getState().enterNode('alvida-hold-battle')).toBe(true);
  }
  useRunStore.getState().resolveBattle('victory');

  expect(useRunStore.getState().enterNode('cobys-resolve')).toBe(true);
  expect(useRunStore.getState().resolveNode('support-cobys-dream')).toBe(true);
  expect(useRunStore.getState().enterNode('shells-town-arrival')).toBe(true);
  const shellsChoice = route.shells === 'open'
    ? 'help-rika-openly'
    : 'gather-information-quietly';
  const shellsEncounter = route.shells === 'open' ? 'marine-yard' : 'execution-grounds';
  expect(useRunStore.getState().resolveNode(shellsChoice)).toBe(true);
  expect(useRunStore.getState().enterNode(shellsEncounter)).toBe(true);
  useRunStore.getState().resolveBattle('victory');

  expect(useRunStore.getState().enterNode('free-pirate-hunter')).toBe(true);
  expect(useRunStore.getState().resolveNode('return-zoros-swords')).toBe(true);
  expect(useRunStore.getState().enterNode('morgan-last-stand')).toBe(true);
  useRunStore.getState().resolveBattle('victory');
  expect(useRunStore.getState().enterNode('marines-farewell')).toBe(true);
  expect(useRunStore.getState().resolveNode('honor-cobys-farewell')).toBe(true);
}
