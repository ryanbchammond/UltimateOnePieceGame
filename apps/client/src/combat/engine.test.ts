import { describe, expect, it } from 'vitest';
import { createDemoBattle, demoFighters } from './demoBattle';
import { getCrewCharacter, getPlayerFighters } from '../crew/characters';
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
import type { ActiveEffect, Fighter, Move } from './types';

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
      maxPp: 8,
      target: 'enemy',
      effects: [{ effect: 'damage', power: 15 }],
    };
    expect(calculateDamage(nami, smoker, waterMove)).toBe((15 + 17 - 12) * 4);
  });

  it('lets high-Battle-IQ enemies choose the highest-scored action', () => {
    const battle = createDemoBattle();
    const action = chooseEnemyAction(battle, () => 0);
    expect(action).toEqual({ actorId: 'kuro', moveId: 'shakushi', targetId: 'sanji' });
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

  it('applies stat changes for two affected turns and refreshes instead of stacking', () => {
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
        remainingTurns: 2,
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
    expect(luffy.activeEffects[0]).toEqual(expect.objectContaining({ remainingTurns: 2 }));

    const target = battle.fighters.find((fighter) => fighter.id === 'kuro')!;
    const pistol = luffy.moves.find((move) => move.id === 'pistol')!;
    const unbuffed = { ...luffy, activeEffects: [] } satisfies Fighter;
    expect(calculateDamage(luffy, target, pistol)).toBeGreaterThan(
      calculateDamage(unbuffed, target, pistol),
    );

    battle = { ...battle, turnOrder: ['luffy'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(
      battle.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects[0],
    ).toEqual(expect.objectContaining({ remainingTurns: 1 }));
    battle = { ...battle, turnOrder: ['luffy'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
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
      remainingTurns: 2,
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
      expect.objectContaining({ stat: 'defense', modifierPercent: -20, remainingTurns: 2 }),
    ]);
  });

  it('heals and buffs a selected living ally without reviving defeated fighters', () => {
    const enemy = demoFighters.find((fighter) => fighter.id === 'kuro')!;
    const initial = createBattle([...getPlayerFighters(['coby', 'luffy']), enemy]);
    let battle = {
      ...initial,
      turnOrder: ['coby', 'kuro', 'luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'luffy' ? { ...fighter, hp: 60 } : fighter,
      ),
    };

    battle = resolveAction(battle, {
      actorId: 'coby',
      moveId: 'rallying-resolve',
      targetId: 'luffy',
    });
    const luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(luffy.hp).toBe(84);
    expect(luffy.activeEffects).toContainEqual(expect.objectContaining({
      statusId: 'rallying-resolve',
      stat: 'defense',
      modifierPercent: 20,
      remainingTurns: 2,
    }));

    const defeated = {
      ...battle,
      status: 'active' as const,
      winner: null,
      turnOrder: ['coby'],
      turnIndex: 0,
      fighters: battle.fighters.map((fighter) =>
        fighter.id === 'luffy' ? { ...fighter, hp: 0 } : fighter,
      ),
    };
    expect(() => resolveAction(defeated, {
      actorId: 'coby',
      moveId: 'rallying-resolve',
      targetId: 'luffy',
    })).toThrow(/living fighter/);
  });

  it('applies Speed changes only when the next round order is built', () => {
    const initial = createDemoBattle();
    let battle = { ...initial, turnOrder: ['nami', 'luffy'], turnIndex: 0 };

    battle = resolveAction(battle, {
      actorId: 'nami',
      moveId: 'cyclone-tempo',
      targetId: 'kuro',
    });
    expect(battle.turnOrder).toEqual(['nami', 'luffy']);
    expect(getCurrentFighter(battle)?.id).toBe('luffy');

    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(battle.round).toBe(2);
    expect(battle.turnOrder.indexOf('kuro')).toBeGreaterThan(battle.turnOrder.indexOf('zoro'));
    expect(battle.fighters.find((fighter) => fighter.id === 'kuro')?.activeEffects)
      .toContainEqual(expect.objectContaining({ stat: 'speed', modifierPercent: -20 }));
  });

  it('ticks, refreshes, and expires damage over time after the affected fighter acts', () => {
    const initial = createDemoBattle();
    let battle = { ...initial, turnOrder: ['buggy', 'luffy'], turnIndex: 0 };

    battle = resolveAction(battle, {
      actorId: 'buggy',
      moveId: 'buggy-ball',
      targetId: 'luffy',
    });
    let luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    const hpAfterHit = luffy.hp;
    expect(luffy.activeEffects).toContainEqual(expect.objectContaining({
      statusId: 'burn',
      remainingTurns: 2,
    }));

    battle = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    luffy = battle.fighters.find((fighter) => fighter.id === 'luffy')!;
    expect(luffy.hp).toBe(hpAfterHit - 6);
    expect(luffy.activeEffects).toContainEqual(expect.objectContaining({
      statusId: 'burn',
      remainingTurns: 1,
    }));

    battle = { ...battle, status: 'active', winner: null, turnOrder: ['buggy'], turnIndex: 0 };
    battle = resolveAction(battle, {
      actorId: 'buggy',
      moveId: 'buggy-ball',
      targetId: 'luffy',
    });
    expect(battle.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects
      .filter((effect) => effect.statusId === 'burn')).toEqual([
      expect.objectContaining({ remainingTurns: 2 }),
    ]);
  });

  it('settles direct victory before an acting fighter takes a lethal DoT tick', () => {
    const player = getPlayerFighters(['luffy'])[0];
    const enemy = demoFighters.find((fighter) => fighter.id === 'kuro')!;
    const initial = createBattle([player, enemy]);
    const burn: ActiveEffect = {
      effect: 'damage-over-time',
      statusId: 'burn',
      name: 'Burn',
      maxHpPercent: 5,
      remainingTurns: 1,
      skipNextAdvance: false,
    };
    const battle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'luffy'
          ? { ...fighter, hp: 5, activeEffects: [burn] }
          : { ...fighter, hp: 1 },
      ),
    };

    const result = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(result.status).toBe('victory');
    expect(result.fighters.find((fighter) => fighter.id === 'luffy')?.hp).toBe(5);

    const survivingEnemyBattle = {
      ...battle,
      fighters: battle.fighters.map((fighter) =>
        fighter.id === 'kuro' ? { ...fighter, hp: fighter.maxHp } : fighter,
      ),
    };
    const defeated = resolveAction(survivingEnemyBattle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(defeated.status).toBe('defeat');
    expect(defeated.fighters.find((fighter) => fighter.id === 'luffy')?.hp).toBe(0);
  });

  it('allows differently named DoT statuses to coexist without stacking duplicate IDs', () => {
    const initial = createBattle([
      getPlayerFighters(['luffy'])[0],
      demoFighters.find((fighter) => fighter.id === 'kuro')!,
    ]);
    const dots: ActiveEffect[] = ['burn', 'bleed'].map((statusId) => ({
      effect: 'damage-over-time',
      statusId,
      name: statusId,
      maxHpPercent: 5,
      remainingTurns: 2,
      skipNextAdvance: false,
    }));
    const battle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'luffy' ? { ...fighter, activeEffects: dots } : fighter,
      ),
    };
    const result = resolveAction(battle, {
      actorId: 'luffy',
      moveId: 'pistol',
      targetId: 'kuro',
    });
    expect(result.fighters.find((fighter) => fighter.id === 'luffy')?.hp).toBe(108);
    expect(result.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects)
      .toEqual([
        expect.objectContaining({ statusId: 'burn', remainingTurns: 1 }),
        expect.objectContaining({ statusId: 'bleed', remainingTurns: 1 }),
      ]);
  });

  it('cleanses all negative statuses while preserving Guard and positive effects', () => {
    const enemy = demoFighters.find((fighter) => fighter.id === 'kuro')!;
    const initial = createBattle([...getPlayerFighters(['tashigi', 'luffy']), enemy]);
    const statuses: ActiveEffect[] = [
      {
        effect: 'guard',
        statusId: 'brace',
        name: 'Brace',
        damageReductionPercent: 40,
      },
      {
        effect: 'stat',
        statusId: 'positive',
        name: 'Positive',
        stat: 'attack',
        modifierPercent: 20,
        remainingTurns: 2,
        skipNextAdvance: false,
      },
      {
        effect: 'stat',
        statusId: 'negative',
        name: 'Negative',
        stat: 'defense',
        modifierPercent: -20,
        remainingTurns: 2,
        skipNextAdvance: false,
      },
      {
        effect: 'damage-over-time',
        statusId: 'burn',
        name: 'Burn',
        maxHpPercent: 5,
        remainingTurns: 2,
        skipNextAdvance: false,
      },
    ];
    const battle = {
      ...initial,
      turnOrder: ['tashigi'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'luffy' ? { ...fighter, activeEffects: statuses } : fighter,
      ),
    };

    const result = resolveAction(battle, {
      actorId: 'tashigi',
      moveId: 'sword-collector-stance',
      targetId: 'luffy',
    });
    expect(result.fighters.find((fighter) => fighter.id === 'luffy')?.activeEffects
      .map((effect) => effect.statusId)).toEqual(['brace', 'positive']);
  });

  it('removes Guard before damage and evaluates the guarding bonus from the action snapshot', () => {
    const initial = createBattle([
      getPlayerFighters(['alvida'])[0],
      demoFighters.find((fighter) => fighter.id === 'kuro')!,
    ]);
    const alvida = initial.fighters.find((fighter) => fighter.id === 'alvida')!;
    const target = initial.fighters.find((fighter) => fighter.id === 'kuro')!;
    const guarded = {
      ...target,
      activeEffects: [{
        effect: 'guard' as const,
        statusId: 'test-guard',
        name: 'Test Guard',
        damageReductionPercent: 40,
      }],
    };
    const ironMace = alvida.moves.find((selectedMove) => selectedMove.id === 'iron-mace')!;
    expect(calculateDamage(alvida, guarded, ironMace)).toBeGreaterThan(
      calculateDamage(alvida, target, ironMace),
    );

    const battle = {
      ...initial,
      turnOrder: ['alvida'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) => fighter.id === 'kuro' ? guarded : fighter),
    };
    const result = resolveAction(battle, {
      actorId: 'alvida',
      moveId: 'iron-mace',
      targetId: 'kuro',
    });
    expect(result.fighters.find((fighter) => fighter.id === 'kuro')?.activeEffects)
      .not.toContainEqual(expect.objectContaining({ effect: 'guard' }));
  });

  it('clamps combined stat modifiers to forty percent', () => {
    const initial = createDemoBattle();
    const luffy = initial.fighters.find((fighter) => fighter.id === 'luffy')!;
    const target = initial.fighters.find((fighter) => fighter.id === 'kuro')!;
    const pistol = luffy.moves.find((selectedMove) => selectedMove.id === 'pistol')!;
    const buffs = ['one', 'two', 'three'].map((statusId): ActiveEffect => ({
      effect: 'stat',
      statusId,
      name: statusId,
      stat: 'attack',
      modifierPercent: 20,
      remainingTurns: 2,
      skipNextAdvance: false,
    }));
    expect(calculateDamage({ ...luffy, activeEffects: buffs }, target, pistol)).toBe(
      calculateDamage({ ...luffy, activeEffects: buffs.slice(0, 2) }, target, pistol),
    );
  });

  it('lets Battle IQ choose meaningful healing for a wounded ally', () => {
    const players = getPlayerFighters(['luffy']);
    const coby = {
      ...getCrewCharacter('coby').fighter,
      side: 'enemy' as const,
      slot: 0,
      battleIq: 100,
    };
    const alvida = {
      ...getCrewCharacter('alvida').fighter,
      side: 'enemy' as const,
      slot: 1,
      battleIq: 45,
    };
    const initial = createBattle([...players, coby, alvida]);
    const battle = {
      ...initial,
      turnOrder: ['coby'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.id === 'alvida' ? { ...fighter, hp: 20 } : fighter,
      ),
    };
    expect(chooseEnemyAction(battle, () => 0)).toEqual({
      actorId: 'coby',
      moveId: 'rallying-resolve',
      targetId: 'alvida',
    });
  });

  it('hits up to the authored target cap, keeps the selected target primary, and works with fewer survivors', () => {
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

    expect(result.fighters.filter((fighter) => fighter.side === 'enemy' && fighter.hp === 0)
      .map((fighter) => fighter.id)).toEqual(['kuro', 'arlong']);
    expect(result.status).toBe('active');
    expect(result.lastAction).toEqual(expect.objectContaining({
      moveName: 'Gum-Gum Gatling',
      targetNames: ['Captain Kuro', 'Arlong'],
    }));

    const twoSurvivorBattle = {
      ...initial,
      turnOrder: ['luffy'],
      turnIndex: 0,
      fighters: initial.fighters.map((fighter) =>
        fighter.side === 'enemy'
          ? { ...fighter, hp: fighter.id === 'smoker' || fighter.id === 'buggy' ? 1 : 0 }
          : fighter,
      ),
    };
    const finished = resolveAction(twoSurvivorBattle, {
      actorId: 'luffy',
      moveId: 'gatling',
      targetId: 'buggy',
    });
    expect(finished.status).toBe('victory');
    expect(finished.lastAction?.targetNames).toEqual(['Buggy', 'Smoker']);
  });

  it('lets a failed Battle IQ roll choose another legal action deterministically', () => {
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
      moveId: 'out-of-the-bag',
      targetId: 'luffy',
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
      maxPp: 6,
      target: 'self',
      effects: [{ effect: 'guard', damageReductionPercent: 100 }],
    };
    expect(() => createBattle(definitions)).toThrow(/damage reduction/);

    definitions[0].moves[0] = {
      id: 'broken-buff',
      name: 'Broken Buff',
      element: 'brawler',
      target: 'self',
      maxPp: 5,
      effects: [{
        effect: 'stat',
        statusId: 'broken-buff',
        stat: 'attack',
        modifierPercent: -20,
        durationTurns: 2,
      }],
    };
    expect(() => createBattle(definitions)).toThrow(/invalid stat-effect/);

    definitions[0].moves[0] = {
      ...demoFighters[0].moves[0],
      maxPp: 0,
    };
    expect(() => createBattle(definitions)).toThrow(/PP limit/);

    definitions[0].moves[0] = {
      id: 'broken-dot',
      name: 'Broken DoT',
      element: 'fire',
      maxPp: 4,
      target: 'ally',
      effects: [{
        effect: 'damage-over-time',
        statusId: 'burn',
        statusName: 'Burn',
        maxHpPercent: 5,
        durationTurns: 2,
      }],
    };
    expect(() => createBattle(definitions)).toThrow(/damage-over-time/);

    definitions[0].moves[0] = {
      id: 'broken-group',
      name: 'Broken Group',
      element: 'brawler',
      maxPp: 3,
      target: 'enemy-group',
      effects: [{ effect: 'damage', power: 5 }],
    };
    expect(() => createBattle(definitions)).toThrow(/target cap/);

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
