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
import type { CharacterId, CharacterMovePp, EncounterId } from '../run/types';
import { createStartingRoleAssignments, crewCharacters } from '../crew/characters';

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function playWithBasicFocusFire(
  encounterId: EncounterId,
  activePartyIds?: CharacterId[],
  characterMovePp: CharacterMovePp = {},
) {
  let battle = createBattle(
    getEncounterFighters(encounterId, activePartyIds, undefined, {}, characterMovePp),
  );
  let actions = 0;
  const enemyRandom = seededRandom(20260831);

  while (battle.status === 'active' && actions < 100) {
    const actor = getCurrentFighter(battle)!;
    if (actor.side === 'enemy') {
      battle = resolveAction(battle, chooseEnemyAction(battle, enemyRandom));
    } else {
      const focusTarget = getValidTargets(battle, actor)
        .sort((left, right) => left.hp - right.hp)[0];
      const damagingMoves = getUsableMoves(actor).filter((move) =>
        move.effects.some((effect) => effect.effect === 'damage'),
      );
      const move = [...damagingMoves].sort(
        (left, right) =>
          calculateDamage(actor, focusTarget, right) - calculateDamage(actor, focusTarget, left),
      )[0] ?? getUsableMoves(actor)[0];
      const target = getValidTargets(battle, actor, move)
        .sort((left, right) => left.hp - right.hp)[0];
      battle = resolveAction(battle, {
        actorId: actor.id,
        moveId: move.id,
        targetId: target.id,
      });
    }
    actions += 1;
  }

  const nextMovePp = Object.fromEntries(
    battle.fighters
      .filter((fighter) => fighter.side === 'player')
      .map((fighter) => [fighter.id, { ...fighter.movePp }]),
  ) as CharacterMovePp;
  return { battle, actions, characterMovePp: nextMovePp };
}

describe('Story encounters', () => {
  it('gives every accessible crew character exactly four valid, distinct moves', () => {
    const referenceEnemy = getEncounterFighters('alvida-hold', ['luffy'])
      .find((fighter) => fighter.side === 'enemy' && fighter.id !== 'alvida')!;
    Object.values(crewCharacters).forEach((character) => {
      expect(character.fighter.moves, character.name).toHaveLength(4);
      expect(new Set(character.fighter.moves.map((move) => move.id)).size, character.name).toBe(4);
      expect(() => createBattle([
        {
          ...character.fighter,
          side: 'player',
          slot: 0,
        },
        referenceEnemy,
      ]), character.name).not.toThrow();
    });

    expect(() =>
      createBattle(getEncounterFighters('shells-town', ['luffy', 'zoro', 'sanji', 'nami'])),
    ).not.toThrow();
  });

  it.each<EncounterId>(['shells-town', 'arlong-park'])('%s enemies each have four moves', (id) => {
    const enemies = getEncounterFighters(id).filter((fighter) => fighter.side === 'enemy');
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
  });

  it.each<EncounterId>([
    'voyage-alvida-raiders',
    'voyage-marine-patrol',
  ])('%s remains a light, valid solo voyage attack', (id) => {
    const definitions = getEncounterFighters(id, ['luffy']);
    expect(definitions.filter((fighter) => fighter.side === 'enemy')).toHaveLength(2);
    expect(() => createBattle(definitions)).not.toThrow();
    expect(playWithBasicFocusFire(id, ['luffy']).battle.status).toBe('victory');
  });

  it.each<EncounterId>([
    'voyage-buggy-scouts',
    'voyage-marine-pursuit',
  ])('%s remains a light, valid Orange Town voyage attack', (id) => {
    const definitions = getEncounterFighters(id, ['luffy', 'zoro']);
    expect(definitions.filter((fighter) => fighter.side === 'enemy')).toHaveLength(2);
    expect(() => createBattle(definitions)).not.toThrow();
    expect(playWithBasicFocusFire(id, ['luffy', 'zoro']).battle.status).toBe('victory');
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

  it.each<[EncounterId, number]>([
    ['marine-yard', 3],
    ['execution-grounds', 2],
  ])('%s has the approved Marine count and remains winnable with the available lineups', (
    id,
    expectedEnemies,
  ) => {
    const soloDefinitions = getEncounterFighters(id, ['luffy']);
    expect(soloDefinitions.filter((fighter) => fighter.side === 'enemy')).toHaveLength(expectedEnemies);
    expect(soloDefinitions.filter((fighter) => fighter.side === 'enemy')
      .every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(playWithBasicFocusFire(id, ['luffy']).battle.status).toBe('victory');
    expect(playWithBasicFocusFire(id, ['luffy', 'coby']).battle.status).toBe('victory');
  });

  it('makes Morgan\'s Last Stand challenging solo and reliable with Zoro or Coby', () => {
    const enemies = getEncounterFighters('morgan-last-stand', ['luffy'])
      .filter((fighter) => fighter.side === 'enemy');
    expect(enemies.map((fighter) => fighter.id)).toEqual(['morgan', 'ripper', 'marine-gunner']);
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(playWithBasicFocusFire('morgan-last-stand', ['luffy']).battle.status).toBe('victory');
    expect(playWithBasicFocusFire('morgan-last-stand', ['luffy', 'zoro']).battle.status).toBe('victory');
    expect(playWithBasicFocusFire('morgan-last-stand', ['luffy', 'zoro', 'coby']).battle.status)
      .toBe('victory');
  });

  it.each<[EncounterId, string[]]>([
    ['beast-tamers-street', ['mohji', 'richie']],
    ['harbor-decoy', ['mohji', 'richie']],
    ['acrobat-rooftops', ['cabaji', 'acrobat-pirate-a', 'acrobat-pirate-b']],
  ])('%s has its approved lineup and is reliable with the reachable Orange Town crew', (
    id,
    enemyIds,
  ) => {
    const definitions = getEncounterFighters(id, ['luffy', 'zoro']);
    const enemies = definitions.filter((fighter) => fighter.side === 'enemy');
    expect(enemies.map((fighter) => fighter.id)).toEqual(enemyIds);
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(() => createBattle(definitions)).not.toThrow();
    expect(playWithBasicFocusFire(id, ['luffy', 'zoro']).battle.status).toBe('victory');
    expect(playWithBasicFocusFire(id, ['luffy', 'zoro', 'nami']).battle.status).toBe('victory');
  });

  it('builds the four-officer Buggy climax and keeps it reliable with the reachable crew', () => {
    const enemies = getEncounterFighters('buggys-big-top', ['luffy', 'zoro', 'nami'])
      .filter((fighter) => fighter.side === 'enemy');
    expect(enemies.map((fighter) => fighter.id)).toEqual(['buggy', 'cabaji', 'mohji', 'richie']);
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(playWithBasicFocusFire('buggys-big-top', ['luffy', 'zoro']).battle.status).toBe('victory');
    expect(playWithBasicFocusFire('buggys-big-top', ['luffy', 'zoro', 'nami']).battle.status)
      .toBe('victory');
  });

  it.each<[EncounterId, string[]]>([
    ['syrup-north-slope', ['jango', 'black-cat-raider-a', 'black-cat-raider-b']],
    ['syrup-mansion-grounds', ['sham', 'buchi']],
  ])('%s has its authored lineup and is winnable by the pre-Usopp crew', (id, enemyIds) => {
    const enemies = getEncounterFighters(id, ['luffy', 'zoro', 'nami'])
      .filter((fighter) => fighter.side === 'enemy');
    expect(enemies.map((fighter) => fighter.id)).toEqual(enemyIds);
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(playWithBasicFocusFire(id, ['luffy', 'zoro', 'nami']).battle.status).toBe('victory');
  });

  it('builds Kuro’s four-unit raid and keeps it reliable with Usopp selected', () => {
    const enemies = getEncounterFighters('black-cat-raid', ['luffy', 'zoro', 'nami', 'usopp'])
      .filter((fighter) => fighter.side === 'enemy');
    expect(enemies.map((fighter) => fighter.id)).toEqual(['kuro', 'jango', 'sham', 'buchi']);
    expect(enemies.every((fighter) => fighter.moves.length === 4)).toBe(true);
    expect(playWithBasicFocusFire('black-cat-raid', ['luffy', 'zoro', 'nami']).battle.status)
      .toBe('victory');
    expect(playWithBasicFocusFire('black-cat-raid', ['luffy', 'zoro', 'nami', 'usopp']).battle.status)
      .toBe('victory');
  });

  it('keeps Black Cat voyage lookouts a light encounter for the arriving crew', () => {
    const enemies = getEncounterFighters('voyage-black-cat-lookouts', ['luffy', 'zoro', 'nami'])
      .filter((fighter) => fighter.side === 'enemy');
    expect(enemies).toHaveLength(2);
    expect(playWithBasicFocusFire('voyage-black-cat-lookouts', ['luffy', 'zoro', 'nami']).battle.status)
      .toBe('victory');
  });

  it.each<[EncounterId, EncounterId]>([
    ['alvida-deck', 'marine-yard'],
    ['alvida-deck', 'execution-grounds'],
    ['alvida-hold', 'marine-yard'],
    ['alvida-hold', 'execution-grounds'],
  ])(
    'keeps the %s and %s route completable without putting Zoro in battle',
    (alvidaEncounterId, shellsEncounterId) => {
      const party: CharacterId[] = ['luffy', 'coby'];
      const alvida = playWithBasicFocusFire(alvidaEncounterId, party);
      expect(alvida.battle.status).toBe('victory');
      const shellsTown = playWithBasicFocusFire(
        shellsEncounterId,
        party,
        alvida.characterMovePp,
      );
      expect(shellsTown.battle.status).toBe('victory');
      const morgan = playWithBasicFocusFire(
        'morgan-last-stand',
        party,
        shellsTown.characterMovePp,
      );
      expect(morgan.battle.status).toBe('victory');
    },
  );

  it.each<[EncounterId, EncounterId, EncounterId]>(
    (['alvida-deck', 'alvida-hold'] as EncounterId[]).flatMap((alvidaId) =>
      (['marine-yard', 'execution-grounds'] as EncounterId[]).flatMap((shellsId) =>
        (['beast-tamers-street', 'harbor-decoy', 'acrobat-rooftops'] as EncounterId[])
          .map((orangeId): [EncounterId, EncounterId, EncounterId] => [
            alvidaId,
            shellsId,
            orangeId,
          ]),
      ),
    ),
  )(
    'carries PP from %s through %s and Morgan into the %s route with Luffy and Zoro',
    (alvidaEncounterId, shellsEncounterId, orangeEncounterId) => {
      const romanceParty: CharacterId[] = ['luffy', 'coby'];
      const alvida = playWithBasicFocusFire(alvidaEncounterId, romanceParty);
      expect(alvida.battle.status).toBe('victory');
      const shellsTown = playWithBasicFocusFire(
        shellsEncounterId,
        romanceParty,
        alvida.characterMovePp,
      );
      expect(shellsTown.battle.status).toBe('victory');
      const morgan = playWithBasicFocusFire(
        'morgan-last-stand',
        romanceParty,
        shellsTown.characterMovePp,
      );
      expect(morgan.battle.status).toBe('victory');

      const orangeTown = playWithBasicFocusFire(
        orangeEncounterId,
        ['luffy', 'zoro'],
        morgan.characterMovePp,
      );
      expect(orangeTown.battle.status).toBe('victory');
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
