import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoBattle } from '../combat/demoBattle';
import { createStartingRoleAssignments } from '../crew/characters';
import { useBattleStore } from './battleStore';
import { useRunStore } from './runStore';

describe('battle store', () => {
  beforeEach(() => {
    useRunStore.getState().abandonRun();
    useBattleStore.getState().reset();
  });

  it('falls back to the first living enemy when the selected target is defeated', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['sanji'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'kuro' ? { ...fighter, hp: 0 } : fighter,
      ),
    };
    const arlongBefore = battle.fighters.find((fighter) => fighter.id === 'arlong')!.hp;

    useBattleStore.setState({ battle, selectedTargetId: 'kuro' });
    useBattleStore.getState().useMove('mouton-shot');

    const state = useBattleStore.getState();
    expect(state.battle.fighters.find((fighter) => fighter.id === 'arlong')!.hp).toBeLessThan(
      arlongBefore,
    );
    expect(state.selectedTargetId).toBe('arlong');
  });

  it('selects only living enemies through the shared battlefield target action', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'kuro' ? { ...fighter, hp: 0 } : fighter,
      ),
    };
    useBattleStore.setState({ battle, selectedTargetId: 'arlong' });

    useBattleStore.getState().selectTarget('smoker');
    expect(useBattleStore.getState().selectedTargetId).toBe('smoker');

    useBattleStore.getState().selectTarget('kuro');
    expect(useBattleStore.getState().selectedTargetId).toBe('smoker');

    useBattleStore.getState().selectTarget('luffy');
    expect(useBattleStore.getState().selectedTargetId).toBe('smoker');

    useBattleStore.getState().selectTarget('missing');
    expect(useBattleStore.getState().selectedTargetId).toBe('smoker');
  });

  it('falls back after a multi-target move defeats the selected enemy', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'kuro' ? { ...fighter, hp: 1 } : fighter,
      ),
    };
    const arlongBefore = battle.fighters.find((fighter) => fighter.id === 'arlong')!.hp;

    useBattleStore.setState({ battle, selectedTargetId: 'kuro' });
    useBattleStore.getState().useMove('gatling');

    const state = useBattleStore.getState();
    expect(state.battle.fighters.find((fighter) => fighter.id === 'kuro')?.hp).toBe(0);
    expect(state.battle.fighters.find((fighter) => fighter.id === 'arlong')!.hp).toBeLessThan(
      arlongBefore,
    );
    expect(state.selectedTargetId).toBe('arlong');
  });

  it('restarts a completed battle with full health and initial targeting', () => {
    const initial = createDemoBattle();
    const completed = {
      ...initial,
      status: 'defeat' as const,
      winner: 'enemy' as const,
      round: 7,
      fighters: initial.fighters.map((fighter) =>
        fighter.side === 'player' ? { ...fighter, hp: 0 } : fighter,
      ),
    };
    useBattleStore.setState({ battle: completed, selectedTargetId: '' });

    useBattleStore.getState().restart();

    const state = useBattleStore.getState();
    expect(state.battle.status).toBe('active');
    expect(state.battle.winner).toBeNull();
    expect(state.battle.round).toBe(1);
    expect(state.battle.fighters.every((fighter) => fighter.hp === fighter.maxHp)).toBe(true);
    expect(state.selectedTargetId).toBe('kuro');
  });

  it('starts and restarts encounters with the selected active party', () => {
    useBattleStore
      .getState()
      .startEncounter(
        'shells-town',
        ['luffy', 'zoro', 'sanji', 'usopp'],
        createStartingRoleAssignments(),
      );

    let state = useBattleStore.getState();
    expect(state.battle.fighters.filter((fighter) => fighter.side === 'player').map((fighter) => fighter.id))
      .toEqual(['luffy', 'zoro', 'sanji', 'usopp']);
    expect(state.battle.fighters.find((fighter) => fighter.id === 'luffy')?.maxHp).toBe(132);

    useBattleStore.setState({
      battle: {
        ...state.battle,
        status: 'defeat',
        winner: 'enemy',
      },
    });
    useBattleStore.getState().restart();

    state = useBattleStore.getState();
    expect(state.battle.status).toBe('active');
    expect(state.battle.fighters.filter((fighter) => fighter.side === 'player').map((fighter) => fighter.id))
      .toEqual(['luffy', 'zoro', 'sanji', 'usopp']);
    expect(state.battle.fighters.find((fighter) => fighter.id === 'luffy')?.maxHp).toBe(132);
  });

  it('clears the loaded encounter when restarting the voyage', () => {
    useBattleStore.getState().startEncounter('alvida-deck', ['luffy']);
    useBattleStore.setState((state) => ({
      battle: { ...state.battle, status: 'victory', winner: 'player' },
    }));

    useBattleStore.getState().reset();

    const state = useBattleStore.getState();
    expect(state.encounterId).toBeNull();
    expect(state.battle.status).toBe('active');
    expect(state.activePartyIds).not.toEqual(['luffy']);
    expect(state.characterMovePp).toEqual({});
  });

  it('persists player PP immediately and does not refill it on battle restart', () => {
    useRunStore.getState().startRun();
    useBattleStore
      .getState()
      .startEncounter(
        'shells-town',
        ['luffy'],
        createStartingRoleAssignments(),
        {},
        useRunStore.getState().characterMovePp,
      );
    const initial = useBattleStore.getState().battle;
    useBattleStore.setState({
      battle: { ...initial, turnOrder: ['luffy'], turnIndex: 0 },
    });

    useBattleStore.getState().useMove('pistol');
    expect(useRunStore.getState().characterMovePp.luffy?.pistol).toBe(7);

    useBattleStore.getState().restart();
    const luffy = useBattleStore.getState().battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(luffy.movePp.pistol).toBe(7);
  });
});
