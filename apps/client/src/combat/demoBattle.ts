import { createBattle } from './engine';
import type { BattleState, Element, FighterDefinition, Move } from './types';
import {
  damageEffect,
  damageOverTimeEffect,
  directDamage,
  enemyStat,
  groupDamage,
  move,
  selfGuard,
  selfStat,
} from './moves';
import { getCrewCharacter, getPlayerFighters, startingActivePartyIds } from '../crew/characters';

const damage = (id: string, name: string, element: Element, power: number): Move =>
  directDamage(id, name, element, power);
const guard = (id: string, name: string, element: Element): Move =>
  selfGuard(id, name, element);
const debuff = (
  id: string,
  name: string,
  element: Element,
  affectedStat: 'attack' | 'defense',
): Move => enemyStat(id, name, element, affectedStat);
const multiTarget = (id: string, name: string, element: Element, power: number): Move =>
  groupDamage(id, name, element, power);

export const demoFighters: FighterDefinition[] = [
  ...getPlayerFighters(startingActivePartyIds),
  {
    id: 'kuro',
    name: 'Captain Kuro',
    side: 'enemy',
    slot: 0,
    maxHp: 88,
    attack: 19,
    defense: 10,
    speed: 20,
    types: ['swordsman'],
    devilFruitUser: false,
    battleIq: 75,
    moves: [
      move('shakushi', 'Shakushi', 'swordsman', 5, 'enemy', [
        damageEffect(20, { condition: 'target-negative-effect', power: 8 }),
      ]),
      selfStat('silent-step', 'Silent Step', 'swordsman', 'speed'),
      debuff('out-of-the-bag', 'Out of the Bag', 'beast', 'defense'),
      move('cat-claws', 'Cat Claws', 'beast', 3, 'enemy-group', [
        damageEffect(9),
        damageOverTimeEffect('bleed', 'Bleed'),
      ], { maxTargets: 2 }),
    ],
  },
  {
    id: 'arlong',
    name: 'Arlong',
    side: 'enemy',
    slot: 1,
    maxHp: 115,
    attack: 22,
    defense: 13,
    speed: 14,
    types: ['beast'],
    devilFruitUser: false,
    battleIq: 80,
    moves: [
      move('shark-darts', 'Shark on Darts', 'water', 6, 'enemy', [
        damageEffect(23, { condition: 'actor-below-half-hp', power: 8 }),
      ]),
      guard('shark-hide', 'Shark Hide', 'beast'),
      debuff('terror-of-the-sea', 'Terror of the Sea', 'water', 'attack'),
      move('tooth-storm', 'Tooth Storm', 'beast', 3, 'enemy-group', [
        damageEffect(10),
        damageOverTimeEffect('bleed', 'Bleed'),
      ], { maxTargets: 3 }),
    ],
  },
  {
    id: 'smoker',
    name: 'Smoker',
    side: 'enemy',
    slot: 2,
    maxHp: 102,
    attack: 20,
    defense: 12,
    speed: 15,
    types: ['nature'],
    devilFruitUser: true,
    battleIq: 85,
    moves: getCrewCharacter('smoker').fighter.moves.map((selectedMove) => ({ ...selectedMove })),
  },
  {
    id: 'buggy',
    name: 'Buggy',
    side: 'enemy',
    slot: 3,
    maxHp: 84,
    attack: 17,
    defense: 8,
    speed: 13,
    types: ['sniper'],
    devilFruitUser: true,
    battleIq: 65,
    moves: getCrewCharacter('buggy').fighter.moves.map((selectedMove) => ({ ...selectedMove })),
  },
];

export function createDemoBattle(): BattleState {
  return createBattle(demoFighters);
}
