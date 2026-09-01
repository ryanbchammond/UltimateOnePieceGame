import { describe, expect, it } from 'vitest';
import { createDemoBattle, demoFighters } from './demoBattle';
import {
  calculateDamage,
  chooseEnemyAction,
  createBattle,
  desperateStrike,
  getCurrentFighter,
  getEffectiveMoveElement,
  getRemainingPp,
  getUsableMoves,
  getValidTargets,
  resolveAction,
} from './engine';
import type { Fighter, Move } from './types';

describe('combat engine', () => {
  it('accepts variable-size story lineups up to 4v4', () => {
    const players = demoFighters.filter((fighter) => fighter.side === 'player').slice(0, 2);
    const enemies = demoFighters.filter((fighter) => fighter.side === 'enemy').slice(0, 3);
    const battle = createBattle([...players, ...enemies]);

    expect(battle.fighters.filter((fighter) => fighter.side === 'player')).toHaveLength(2);
    expect(battle.fighters.filter((fighter) => fighter.side === 'enemy')).toHaveLength(3);
  });

  it('rejects empty sides and lineups larger than four', () => {
    const players = demoFighters.filter((fighter) => fighter.side === 'player');
    const enemies = demoFighters.filter((fighter) => fighter.side === 'enemy');
    const fifthPlayer = { ...players[0], id: 'fifth-player', slot: 4 };

    expect(() => createBattle(players)).toThrow(/between one and four/);
    expect(() => createBattle([...players, fifthPlayer, ...enemies])).toThrow(/between one and four/);
  });

  it('orders every fighter once per round by speed', () => {
    const battle = createDemoBattle();
    expect(battle.turnOrder).toEqual([
      'kuro',
      'sanji',
      'nami',
      'luffy',
      'zoro',
      'smoker',
      'arlong',
      'buggy',
    ]);
  });

  it('applies four-times water damage to Devil Fruit users', () => {
    const battle = createDemoBattle();
    const nami = battle.fighters.find((fighter) => fighter.id === 'nami')!;
    const smoker = battle.fighters.find((fighter) => fighter.id === 'smoker')!;
    const waterMove: Move = {
      id: 'water-test',
      name: 'Water Test',
      element: 'water',
      effect: 'damage',
      power: 15,
      maxPp: 8,
    };
    expect(calculateDamage(nami, smoker, waterMove)).toBe((15 + 17 - 12) * 4);
  });

  it('lets high-Battle-IQ enemies choose the highest-scored action', () => {
    const battle = createDemoBattle();
    const action = chooseEnemyAction(battle, () => 0);
    expect(action).toEqual({ actorId: 'kuro', moveId: 'cat-claws', targetId: 'luffy' });
  });

  it('consumes move PP, rejects depleted moves, and exposes an emergency fallback', () => {
    const initial = createDemoBattle();
    let battle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'luffy'
          ? {
              ...fighter,
              movePp: Object.fromEntries(fighter.moves.map((move) => [move.id, move.id === 'pistol' ? 1 : 0])),
            }
          : fighter,
      ),
    };

    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    const luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(getRemainingPp(luffy, luffy.moves[0])).toBe(0);
    expect(getUsableMoves(luffy)).toEqual([desperateStrike]);

    battle = { ...battle, status: 'active', winner: null, turnOrder: ['luffy'], turnIndex: 0 };
    expect(() => resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    })).toThrow(/no PP remaining/);
    expect(() => resolveAction(battle, {
      actorId: 'luffy',
      moveId: desperateStrike.id,
      targetId: 'kuro',
    })).not.toThrow();
  });

  it('resolves a complete round and rebuilds initiative', () => {
    let battle = createDemoBattle();

    for (let turn = 0; turn < 8; turn += 1) {
      const actor = getCurrentFighter(battle)!;
      const move = actor.moves[0];
      const target = getValidTargets(battle, actor, move)[0];
      battle = resolveAction(battle, {
        actorId: actor.id,
        moveId: move.id,
        targetId: target.id,
      });
    }

    expect(battle.round).toBe(2);
    expect(battle.turnIndex).toBe(0);
  });

  it('ends in victory when the final enemy is defeated', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['sanji'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) => {
        if (fighter.side === 'enemy') {
          return { ...fighter, hp: fighter.id === 'kuro' ? 1 : 0 };
        }
        return fighter;
      }),
    };

    const result = resolveAction(battle, {
      actorId: 'sanji',
      moveId: 'mouton-shot',
      targetId: 'kuro',
    });

    expect(result.status).toBe('victory');
    expect(result.winner).toBe('player');
    expect(getCurrentFighter(result)).toBeNull();
    expect(result.log.at(-1)?.message).toMatch(/Victory/);
  });

  it('ends in defeat when the final player fighter is defeated', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['kuro'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) => {
        if (fighter.side === 'player') {
          return { ...fighter, hp: fighter.id === 'luffy' ? 1 : 0 };
        }
        return fighter;
      }),
    };

    const result = resolveAction(battle, {
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'luffy',
    });

    expect(result.status).toBe('defeat');
    expect(result.winner).toBe('enemy');
    expect(getCurrentFighter(result)).toBeNull();
    expect(result.log.at(-1)?.message).toMatch(/Defeat/);
  });

  it('skips a fighter knocked out before their initiative arrives', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'sanji' ? { ...fighter, hp: 1 } : fighter,
      ),
    };

    const result = resolveAction(battle, {
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'sanji',
    });

    expect(result.fighters.find((fighter) => fighter.id === 'sanji')?.hp).toBe(0);
    expect(result.turnIndex).toBe(2);
    expect(getCurrentFighter(result)?.id).toBe('nami');
  });

  it('guards against 40% of incoming damage until the fighter acts again', () => {
    const initial = createDemoBattle();
    const luffy = initial.fighters.find((fighter) => fighter.id === 'luffy')!;
    const kuro = initial.fighters.find((fighter) => fighter.id === 'kuro')!;
    const attack = kuro.moves.find((move) => move.id === 'shakushi')!;
    const unguardedDamage = calculateDamage(kuro, luffy, attack);
    let battle = { ...initial, turnOrder: ['luffy', 'kuro'], turnIndex: 0 };

    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'balloon',
      targetId: 'luffy',
    });
    const guardedLuffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(calculateDamage(kuro, guardedLuffy, attack)).toBe(Math.round(unguardedDamage * 0.6));

    battle = resolveAction(battle, {
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'luffy',
    });
    battle = { ...battle, turnOrder: ['luffy', 'kuro'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(
      battle.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects,
    ).not.toContainEqual(expect.objectContaining({ effect: 'guard' }));
  });

  it('applies stat changes for two rounds and refreshes instead of stacking', () => {
    const initial = createDemoBattle();
    let battle = { ...initial, turnOrder: ['luffy', 'kuro'], turnIndex: 0 };

    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'battle-cry',
      targetId: 'luffy',
    });
    let luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(luffy.activeEffects).toEqual([
      expect.objectContaining({
        effect: 'stat',
        stat: 'attack',
        modifierPercent: 20,
        remainingRounds: 2,
      }),
    ]);

    battle = { ...battle, turnOrder: ['luffy', 'kuro'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'battle-cry',
      targetId: 'luffy',
    });
    luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(luffy.activeEffects).toHaveLength(1);
    expect(luffy.activeEffects[0]).toEqual(expect.objectContaining({ remainingRounds: 2 }));

    const target = battle.fighters.find((fighter) => fighter.id === 'kuro')!;
    const pistol = luffy.moves.find((move) => move.id === 'pistol')!;
    const unbuffed = { ...luffy, activeEffects: [] } satisfies Fighter;
    expect(calculateDamage(luffy, target, pistol)).toBeGreaterThan(
      calculateDamage(unbuffed, target, pistol),
    );

    battle = { ...battle, turnOrder: ['kuro'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'nami',
    });
    expect(
      battle.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects[0],
    ).toEqual(expect.objectContaining({ remainingRounds: 1 }));
    battle = { ...battle, turnOrder: ['kuro'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'luffy',
    });
    expect(
      battle.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects,
    ).toHaveLength(0);
  });

  it('converts Sanji damaging moves to Fire while Diable Jambe is active', () => {
    const initial = createDemoBattle();
    let battle = { ...initial, turnOrder: ['sanji'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'sanji',
      moveId: 'diable-jambe',
      targetId: 'sanji',
    });

    const sanji = battle.fighters.find((fighter) => fighter.id === 'sanji')!;
    const moutonShot = sanji.moves.find((move) => move.id === 'mouton-shot')!;
    const concasser = sanji.moves.find((move) => move.id === 'concasser')!;
    expect(getEffectiveMoveElement(sanji, moutonShot)).toBe('fire');
    expect(getEffectiveMoveElement(sanji, concasser)).toBe('fire');
    expect(sanji.activeEffects).toContainEqual(expect.objectContaining({
      name: 'Diable Jambe',
      damageTypeOverride: 'fire',
      remainingRounds: 1,
    }));

    const iceTarget = {
      ...battle.fighters.find((fighter) => fighter.id === 'kuro')!,
      types: ['ice'] as ['ice'],
    };
    expect(calculateDamage(sanji, iceTarget, moutonShot)).toBeGreaterThan(
      calculateDamage({ ...sanji, activeEffects: [] }, iceTarget, moutonShot),
    );
  });

  it('applies enemy debuffs to the selected opponent', () => {
    const initial = createDemoBattle();
    let battle = { ...initial, turnOrder: ['nami', 'kuro'], turnIndex: 0 };

    battle = resolveAction(battle, {
      actorId: 'nami',
      moveId: 'rain-tempo',
      targetId: 'kuro',
    });
    const kuro = battle.fighters.find((fighter) => fighter.id === 'kuro')!;
    expect(kuro.activeEffects).toEqual([
      expect.objectContaining({ stat: 'defense', modifierPercent: -20, remainingRounds: 2 }),
    ]);
  });

  it('damages every living opponent with a multi-target move and settles all knockouts', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.side === 'enemy' ? { ...fighter, hp: 1 } : fighter,
      ),
    };

    const result = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'gatling',
      targetId: 'kuro',
    });

    expect(result.fighters.filter((fighter) => fighter.side === 'enemy').every((fighter) => fighter.hp === 0))
      .toBe(true);
    expect(result.status).toBe('victory');
    expect(result.log.filter((entry) => entry.tone === 'faint')).toHaveLength(4);
  });

  it('lets a failed Battle IQ roll choose another legal action and self-target it', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['kuro'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'kuro' ? { ...fighter, battleIq: 0 } : fighter,
      ),
    };
    const rolls = [0.99, 0.5];

    expect(chooseEnemyAction(battle, () => rolls.shift() ?? 0)).toEqual({
      actorId: 'kuro',
      moveId: 'silent-step',
      targetId: 'kuro',
    });
  });

  it('uses tactical targeting to secure a knockout', () => {
    const initial = createDemoBattle();
    const battle = {
      ...initial,
      turnOrder: ['kuro'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) => {
        if (fighter.id === 'kuro') {
          return { ...fighter, battleIq: 100, moves: [fighter.moves[0]] };
        }
        return fighter.id === 'zoro' ? { ...fighter, hp: 1 } : fighter;
      }),
    };

    expect(chooseEnemyAction(battle, () => 0)).toEqual({
      actorId: 'kuro',
      moveId: 'shakushi',
      targetId: 'zoro',
    });
  });

  it('rejects malformed effect payloads at battle creation', () => {
    const definitions = demoFighters.map((fighter) => ({
      ...fighter,
      moves: fighter.moves.map((move) => ({ ...move })),
    }));
    definitions[0].moves[0] = {
      id: 'broken-guard',
      name: 'Broken Guard',
      element: 'brawler',
      effect: 'guard',
      damageReductionPercent: 100,
      maxPp: 6,
    };
    expect(() => createBattle(definitions)).toThrow(/damage reduction/);

    definitions[0].moves[0] = {
      id: 'broken-buff',
      name: 'Broken Buff',
      element: 'brawler',
      effect: 'stat',
      target: 'self',
      stat: 'attack',
      modifierPercent: -20,
      durationRounds: 2,
      maxPp: 5,
    };
    expect(() => createBattle(definitions)).toThrow(/invalid stat-effect/);

    definitions[0].moves[0] = {
      ...demoFighters[0].moves[0],
      maxPp: 0,
    };
    expect(() => createBattle(definitions)).toThrow(/PP limit/);

    const invalidIq = demoFighters.map((fighter) => ({ ...fighter }));
    invalidIq.find((fighter) => fighter.side === 'enemy')!.battleIq = 101;
    expect(() => createBattle(invalidIq)).toThrow(/Battle IQ/);
  });

  it('rejects invalid actors, moves, targets, and actions after battle end', () => {
    const battle = createDemoBattle();

    expect(() =>
      resolveAction(battle, { actorId: 'sanji', moveId: 'mouton-shot', targetId: 'kuro' }),
    ).toThrow(/cannot act now/);
    expect(() =>
      resolveAction(battle, { actorId: 'kuro', moveId: 'not-a-move', targetId: 'luffy' }),
    ).toThrow(/does not belong/);
    expect(() =>
      resolveAction(battle, { actorId: 'kuro', moveId: 'shakushi', targetId: 'arlong' }),
    ).toThrow(/opposing crew/);

    const finished = { ...battle, status: 'victory' as const, winner: 'player' as const };
    expect(() =>
      resolveAction(finished, { actorId: 'kuro', moveId: 'shakushi', targetId: 'luffy' }),
    ).toThrow(/already over/);
  });
});
