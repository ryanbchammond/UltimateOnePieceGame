import { describe, expect, it } from 'vitest';
import { getEncounterFighters } from './eastBlueBattles';
import {
  calculateDamage,
  chooseEnemyAction,
  createBattle,
  getCurrentFighter,
  getUsableMoves,
  getValidTargets,
  resolveAction,
} from './engine';
import type { EncounterId } from '../run/types';
import type { CharacterId } from '../run/types';
import { createStartingRoleAssignments, crewCharacters } from '../crew/characters';
import type { DamageMove, MultiTargetMove } from './types';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function playWithBasicFocusFire(encounterId: EncounterId, activePartyIds?: CharacterId[]) {
  let battle = createBattle(getEncounterFighters(encounterId, activePartyIds));
  let actions = 0;
  const enemyRandom = seededRandom(20260831);

  while (battle.status === 'active' && actions < 100) {
    const actor = getCurrentFighter(battle)!;
    if (actor.side === 'enemy') {
      battle = resolveAction(battle, chooseEnemyAction(battle, enemyRandom));
    } else {
      const target = getValidTargets(battle, actor).sort((left, right) => left.hp - right.hp)[0];
      const damagingMoves = getUsableMoves(actor).filter(
        (move): move is DamageMove | MultiTargetMove =>
          move.effect === 'damage' || move.effect === 'multi-target',
      );
      const move = [...damagingMoves].sort(
        (left, right) => calculateDamage(actor, target, right) - calculateDamage(actor, target, left),
      )[0];
      battle = resolveAction(battle, {
        actorId: actor.id,
        moveId: move.id,
        targetId: target.id,
      });
    }
    actions += 1;
  }

  return { battle, actions };
}

describe('East Blue encounters', () => {
  it('gives every accessible crew character exactly four valid, distinct moves', () => {
    Object.values(crewCharacters).forEach((character) => {
      expect(character.fighter.moves, character.name).toHaveLength(4);
      expect(new Set(character.fighter.moves.map((move) => move.id)).size, character.name).toBe(4);
    });

    expect(() =>
      createBattle(getEncounterFighters('shells-town', ['luffy', 'zoro', 'sanji', 'nami'])),
    ).not.toThrow();
  });

  it.each<EncounterId>(['shells-town', 'arlong-park'])('%s enemies each have four moves', (id) => {
    const enemies = getEncounterFighters(id).filter((fighter) => fighter.side === 'enemy');
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
  });

  it.each<EncounterId>(['alvida-deck', 'alvida-hold'])(
    '%s is valid and winnable with solo Luffy or Luffy and Coby',
    (id) => {
      const soloDefinitions = getEncounterFighters(id, ['luffy']);
      const expectedEnemies = id === 'alvida-deck' ? 3 : 2;
      expect(soloDefinitions.filter((fighter) => fighter.side === 'player')).toHaveLength(1);
      expect(soloDefinitions.filter((fighter) => fighter.side === 'enemy')).toHaveLength(expectedEnemies);
      expect(soloDefinitions.filter((fighter) => fighter.side === 'enemy')
        .every((fighter) => fighter.moves.length === 4)).toBe(true);
      expect(() => createBattle(soloDefinitions)).not.toThrow();

      expect(playWithBasicFocusFire(id, ['luffy']).battle.status).toBe('victory');
      expect(playWithBasicFocusFire(id, ['luffy', 'coby']).battle.status).toBe('victory');
    },
  );

  it.each<EncounterId>(['shells-town', 'arlong-park'])('%s is a valid, winnable 4v4 encounter', (id) => {
    const definitions = getEncounterFighters(id);
    expect(definitions.filter((fighter) => fighter.side === 'player')).toHaveLength(4);
    expect(definitions.filter((fighter) => fighter.side === 'enemy')).toHaveLength(4);

    const result = playWithBasicFocusFire(id);
    expect(result.actions).toBeLessThan(100);
    expect(result.battle.status).toBe('victory');
  });

  it('builds combat from the selected four-person party', () => {
    const definitions = getEncounterFighters('arlong-park', ['luffy', 'zoro', 'sanji', 'usopp']);
    const players = definitions.filter((fighter) => fighter.side === 'player');

    expect(players.map((fighter) => fighter.id)).toEqual(['luffy', 'zoro', 'sanji', 'usopp']);
    expect(players.map((fighter) => fighter.slot)).toEqual([0, 1, 2, 3]);
  });

  it('builds variable-size story parties without padding the lineup', () => {
    const definitions = getEncounterFighters('shells-town', ['luffy', 'zoro']);
    const players = definitions.filter((fighter) => fighter.side === 'player');

    expect(players.map((fighter) => fighter.id)).toEqual(['luffy', 'zoro']);
    expect(players.map((fighter) => fighter.slot)).toEqual([0, 1]);
    expect(() => createBattle(definitions)).not.toThrow();
  });

  it('keeps Arlong Park winnable after swapping Usopp into the party', () => {
    const result = playWithBasicFocusFire('arlong-park', ['luffy', 'zoro', 'sanji', 'usopp']);

    expect(result.actions).toBeLessThan(100);
    expect(result.battle.status).toBe('victory');
  });

  it('applies the Cook max-HP bonus only to the active player party', () => {
    const definitions = getEncounterFighters(
      'shells-town',
      ['luffy', 'zoro', 'sanji', 'nami'],
      createStartingRoleAssignments(),
    );
    const players = definitions.filter((fighter) => fighter.side === 'player');
    const enemies = definitions.filter((fighter) => fighter.side === 'enemy');

    expect(players.map((fighter) => fighter.maxHp)).toEqual([132, 121, 110, 90]);
    expect(enemies.find((fighter) => fighter.id === 'morgan')?.maxHp).toBe(92);
  });

  it('applies star bonuses to HP, Attack, and Defense without changing Speed', () => {
    const definitions = getEncounterFighters(
      'shells-town',
      ['luffy', 'zoro', 'sanji', 'nami'],
      undefined,
      { luffy: 2 },
    );
    const luffy = definitions.find((fighter) => fighter.id === 'luffy')!;

    expect(luffy.maxHp).toBe(126);
    expect(luffy.attack).toBe(23);
    expect(luffy.defense).toBe(13);
    expect(luffy.speed).toBe(17);
  });
});
