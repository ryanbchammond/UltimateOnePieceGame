import { createBattle } from './engine';
import type { BattleState, Element, FighterDefinition, Move } from './types';
import { getPlayerFighters, startingActivePartyIds } from '../crew/characters';

const damage = (id: string, name: string, element: Element, power: number): Move => ({
  id, name, element, effect: 'damage', power, maxPp: 8,
});
const guard = (id: string, name: string, element: Element): Move => ({
  id, name, element, effect: 'guard', damageReductionPercent: 40, maxPp: 6,
});
const debuff = (
  id: string,
  name: string,
  element: Element,
  affectedStat: 'attack' | 'defense',
): Move => ({
  id,
  name,
  element,
  effect: 'stat',
  target: 'enemy',
  stat: affectedStat,
  modifierPercent: -20,
  durationRounds: 2,
  maxPp: 5,
});
const multiTarget = (id: string, name: string, element: Element, power: number): Move => ({
  id, name, element, effect: 'multi-target', power, maxTargets: 2, maxPp: 3,
});

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
      damage('shakushi', 'Shakushi', 'swordsman', 20),
      guard('silent-step', 'Silent Step', 'swordsman'),
      debuff('out-of-the-bag', 'Out of the Bag', 'beast', 'defense'),
      multiTarget('cat-claws', 'Cat Claws', 'beast', 9),
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
      damage('shark-darts', 'Shark on Darts', 'water', 22),
      guard('shark-hide', 'Shark Hide', 'beast'),
      debuff('terror-of-the-sea', 'Terror of the Sea', 'water', 'attack'),
      multiTarget('tooth-attack', 'Tooth Attack', 'beast', 10),
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
    moves: [
      damage('white-blow', 'White Blow', 'brawler', 21),
      guard('white-out', 'White Out', 'nature'),
      debuff('nanashaku-jitte', 'Nanashaku Jitte', 'nature', 'defense'),
      multiTarget('smoke-snare', 'Smoke Snare', 'nature', 10),
    ],
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
    moves: [
      damage('chop-cannon', 'Chop-Chop Cannon', 'brawler', 18),
      guard('chop-escape', 'Chop-Chop Escape', 'sniper'),
      debuff('flashy-taunt', 'Flashy Taunt', 'sniper', 'attack'),
      multiTarget('buggy-ball', 'Buggy Ball', 'fire', 12),
    ],
  },
];

export function createDemoBattle(): BattleState {
  return createBattle(demoFighters);
}
