import type { Element, FighterDefinition, Move } from './types';
import { getCrewCharacter, getPlayerFighters, startingActivePartyIds } from '../crew/characters';
import { getCookMaxHpBonusPercent } from '../crew/roleEffects';
import type { CharacterId, CharacterMovePp, EncounterId, RoleAssignments } from '../run/types';

const damage = (id: string, name: string, element: Element, power: number): Move => ({
  id, name, element, effect: 'damage', power, maxPp: 8,
});
const guard = (id: string, name: string, element: Element): Move => ({
  id, name, element, effect: 'guard', damageReductionPercent: 40, maxPp: 6,
});
const stat = (
  id: string,
  name: string,
  element: Element,
  target: 'self' | 'enemy',
  affectedStat: 'attack' | 'defense',
): Move => ({
  id,
  name,
  element,
  effect: 'stat',
  target,
  stat: affectedStat,
  modifierPercent: target === 'self' ? 20 : -20,
  durationRounds: 2,
  maxPp: 5,
});
const multiTarget = (id: string, name: string, element: Element, power: number): Move => ({
  id, name, element, effect: 'multi-target', power, maxPp: 3,
});

function createAlvida(slot: number): FighterDefinition {
  const fighter = getCrewCharacter('alvida').fighter;
  return {
    ...fighter,
    side: 'enemy',
    slot,
    battleIq: 45,
    moves: fighter.moves.map((move) => ({ ...move })),
  };
}

function createAlvidaPirate(
  id: string,
  name: string,
  slot: number,
  speed: number,
): FighterDefinition {
  return {
    id,
    name,
    side: 'enemy',
    slot,
    maxHp: 34,
    attack: 8,
    defense: 5,
    speed,
    types: ['brawler'],
    devilFruitUser: false,
    battleIq: 10,
    moves: [
      damage(`${id}-club-swing`, 'Club Swing', 'brawler', 7),
      guard(`${id}-duck`, 'Duck Behind a Crate', 'brawler'),
      stat(`${id}-bully`, 'Bully', 'brawler', 'enemy', 'defense'),
      multiTarget(`${id}-mob-rush`, 'Mob Rush', 'brawler', 3),
    ],
  };
}

const alvidaDeckPirates: FighterDefinition[] = [
  createAlvida(0),
  createAlvidaPirate('peppoko', 'Peppoko', 1, 10),
  createAlvidaPirate('poppoko', 'Poppoko', 2, 9),
];

const alvidaHoldPirates: FighterDefinition[] = [
  createAlvida(0),
  createAlvidaPirate('heppoko', 'Heppoko', 1, 10),
];

const shellsTownMarines: FighterDefinition[] = [
  {
    id: 'morgan',
    name: 'Axe-Hand Morgan',
    side: 'enemy',
    slot: 0,
    maxHp: 92,
    attack: 19,
    defense: 11,
    speed: 15,
    types: ['swordsman'],
    devilFruitUser: false,
    battleIq: 70,
    moves: [
      damage('axe-drop', 'Axe Drop', 'swordsman', 20),
      guard('iron-authority', 'Iron Authority', 'swordsman'),
      stat('tyrants-order', "Tyrant's Order", 'brawler', 'self', 'attack'),
      multiTarget('execution-sweep', 'Execution Sweep', 'swordsman', 9),
    ],
  },
  {
    id: 'ripper',
    name: 'Commander Ripper',
    side: 'enemy',
    slot: 1,
    maxHp: 72,
    attack: 16,
    defense: 9,
    speed: 13,
    types: ['swordsman'],
    devilFruitUser: false,
    battleIq: 55,
    moves: [
      damage('saber-rush', 'Saber Rush', 'swordsman', 17),
      guard('marine-formation', 'Marine Formation', 'swordsman'),
      stat('commanding-shout', 'Commanding Shout', 'brawler', 'self', 'defense'),
      multiTarget('saber-line', 'Saber Line', 'swordsman', 7),
    ],
  },
  {
    id: 'marine-gunner',
    name: 'Marine Gunner',
    side: 'enemy',
    slot: 2,
    maxHp: 66,
    attack: 16,
    defense: 8,
    speed: 14,
    types: ['sniper'],
    devilFruitUser: false,
    battleIq: 40,
    moves: [
      damage('rifle-volley', 'Rifle Volley', 'sniper', 18),
      guard('take-cover', 'Take Cover', 'sniper'),
      stat('warning-shot', 'Warning Shot', 'sniper', 'enemy', 'attack'),
      multiTarget('powder-volley', 'Powder Volley', 'fire', 7),
    ],
  },
  {
    id: 'helmeppo',
    name: 'Helmeppo',
    side: 'enemy',
    slot: 3,
    maxHp: 58,
    attack: 14,
    defense: 7,
    speed: 11,
    types: ['brawler'],
    devilFruitUser: false,
    battleIq: 20,
    moves: [
      damage('pistol-shot', 'Pistol Shot', 'sniper', 15),
      guard('human-shield', 'Human Shield', 'brawler'),
      stat('cheap-taunt', 'Cheap Taunt', 'brawler', 'enemy', 'defense'),
      multiTarget('wild-barrage', 'Wild Barrage', 'sniper', 6),
    ],
  },
];

const arlongPirates: FighterDefinition[] = [
  {
    id: 'arlong',
    name: 'Arlong',
    side: 'enemy',
    slot: 0,
    maxHp: 126,
    attack: 23,
    defense: 13,
    speed: 18,
    types: ['beast'],
    devilFruitUser: false,
    battleIq: 50,
    moves: [
      damage('shark-darts', 'Shark on Darts', 'water', 23),
      guard('shark-hide', 'Shark Hide', 'beast'),
      stat('terror-of-the-sea', 'Terror of the Sea', 'water', 'enemy', 'attack'),
      multiTarget('tooth-storm', 'Tooth Storm', 'beast', 11),
    ],
  },
  {
    id: 'kuroobi',
    name: 'Kuroobi',
    side: 'enemy',
    slot: 1,
    maxHp: 104,
    attack: 21,
    defense: 13,
    speed: 16,
    types: ['brawler'],
    devilFruitUser: false,
    battleIq: 35,
    moves: [
      damage('fishman-karate', 'Fish-Man Karate', 'water', 20),
      guard('karate-stance', 'Karate Stance', 'brawler'),
      stat('ocean-discipline', 'Ocean Discipline', 'water', 'self', 'defense'),
      multiTarget('thousand-brick-fist', 'Thousand Brick Fist', 'brawler', 10),
    ],
  },
  {
    id: 'hatchan',
    name: 'Hatchan',
    side: 'enemy',
    slot: 2,
    maxHp: 112,
    attack: 20,
    defense: 12,
    speed: 14,
    types: ['swordsman'],
    devilFruitUser: false,
    battleIq: 30,
    moves: [
      damage('octopus-punch', 'Octopus Punch', 'brawler', 18),
      guard('six-sword-guard', 'Six-Sword Guard', 'swordsman'),
      stat('octopus-focus', 'Octopus Focus', 'beast', 'self', 'attack'),
      multiTarget('six-sword-waltz', 'Six-Sword Waltz', 'swordsman', 10),
    ],
  },
  {
    id: 'chew',
    name: 'Chew',
    side: 'enemy',
    slot: 3,
    maxHp: 86,
    attack: 19,
    defense: 9,
    speed: 15,
    types: ['sniper'],
    devilFruitUser: false,
    battleIq: 25,
    moves: [
      damage('water-cannon', 'Water Cannon', 'water', 21),
      guard('deep-breath', 'Deep Breath', 'water'),
      stat('pressure-spray', 'Pressure Spray', 'water', 'enemy', 'defense'),
      multiTarget('water-shot', 'Water Shot', 'sniper', 9),
    ],
  },
];

const encounterEnemies: Record<EncounterId, FighterDefinition[]> = {
  'alvida-deck': alvidaDeckPirates,
  'alvida-hold': alvidaHoldPirates,
  'shells-town': shellsTownMarines,
  'arlong-park': arlongPirates,
};

export function getEncounterFighters(
  encounterId: EncounterId,
  activePartyIds: CharacterId[] = startingActivePartyIds,
  roleAssignments?: RoleAssignments,
  characterStars: Partial<Record<CharacterId, number>> = {},
  characterMovePp: CharacterMovePp = {},
): FighterDefinition[] {
  const cookBonus = roleAssignments ? getCookMaxHpBonusPercent(roleAssignments) : 0;
  return [
    ...getPlayerFighters(activePartyIds, cookBonus, characterStars, characterMovePp),
    ...encounterEnemies[encounterId],
  ].map((fighter) => ({
    ...fighter,
    moves: fighter.moves.map((move) => ({ ...move })),
  }));
}
