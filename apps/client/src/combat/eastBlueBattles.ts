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
const multiTarget = (
  id: string,
  name: string,
  element: Element,
  power: number,
  maxTargets = 2,
): Move => ({
  id, name, element, effect: 'multi-target', power, maxTargets, maxPp: 3,
});

function createCrewEnemy(
  characterId: CharacterId,
  slot: number,
  battleIq: number,
): FighterDefinition {
  const fighter = getCrewCharacter(characterId).fighter;
  return {
    ...fighter,
    side: 'enemy',
    slot,
    battleIq,
    moves: fighter.moves.map((move) => ({ ...move })),
  };
}

function createOrangePirate(
  id: string,
  name: string,
  slot: number,
  style: 'beast' | 'acrobat',
): FighterDefinition {
  const acrobat = style === 'acrobat';
  return {
    id,
    name,
    side: 'enemy',
    slot,
    maxHp: acrobat ? 40 : 42,
    attack: 11,
    defense: acrobat ? 5 : 6,
    speed: acrobat ? 14 : 11,
    types: [acrobat ? 'swordsman' : 'beast'],
    devilFruitUser: false,
    battleIq: 20,
    moves: acrobat
      ? [
          damage(`${id}-roof-slash`, 'Roof Slash', 'swordsman', 11),
          guard(`${id}-tumble`, 'Tumble Away', 'brawler'),
          stat(`${id}-sand-toss`, 'Sand Toss', 'poison', 'enemy', 'attack'),
          multiTarget(`${id}-crossfire`, 'Acrobat Crossfire', 'sniper', 4),
        ]
      : [
          damage(`${id}-hook-swing`, 'Hook Swing', 'beast', 11),
          guard(`${id}-cage-cover`, 'Cage Cover', 'earth'),
          stat(`${id}-crack-whip`, 'Crack the Whip', 'beast', 'self', 'attack'),
          multiTarget(`${id}-animal-rush`, 'Animal Rush', 'beast', 4),
        ],
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
  createCrewEnemy('alvida', 0, 45),
  createAlvidaPirate('peppoko', 'Peppoko', 1, 10),
  createAlvidaPirate('poppoko', 'Poppoko', 2, 9),
];

const alvidaHoldPirates: FighterDefinition[] = [
  createCrewEnemy('alvida', 0, 45),
  createAlvidaPirate('heppoko', 'Heppoko', 1, 10),
];

const commanderRipper: FighterDefinition = {
  id: 'ripper',
  name: 'Commander Ripper',
  side: 'enemy',
  slot: 0,
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
};

const marineGunner: FighterDefinition = {
  id: 'marine-gunner',
  name: 'Marine Gunner',
  side: 'enemy',
  slot: 0,
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
};

const marineGuard: FighterDefinition = {
  id: 'marine-guard',
  name: 'Marine Guard',
  side: 'enemy',
  slot: 0,
  maxHp: 48,
  attack: 11,
  defense: 6,
  speed: 12,
  types: ['swordsman'],
  devilFruitUser: false,
  battleIq: 30,
  moves: [
    damage('guard-saber', 'Guard Saber', 'swordsman', 12),
    guard('hold-formation', 'Hold Formation', 'swordsman'),
    stat('steady-ranks', 'Steady Ranks', 'brawler', 'self', 'defense'),
    multiTarget('crossing-slash', 'Crossing Slash', 'swordsman', 4),
  ],
};

const marineRecruit: FighterDefinition = {
  id: 'marine-recruit',
  name: 'Marine Recruit',
  side: 'enemy',
  slot: 0,
  maxHp: 42,
  attack: 10,
  defense: 5,
  speed: 10,
  types: ['brawler'],
  devilFruitUser: false,
  battleIq: 20,
  moves: [
    damage('recruit-strike', 'Recruit Strike', 'brawler', 10),
    guard('nervous-guard', 'Nervous Guard', 'brawler'),
    stat('shouted-warning', 'Shouted Warning', 'brawler', 'enemy', 'defense'),
    multiTarget('rushed-volley', 'Rushed Volley', 'sniper', 3),
  ],
};

function placeEnemies(...fighters: FighterDefinition[]): FighterDefinition[] {
  return fighters.map((fighter, slot) => ({
    ...fighter,
    slot,
    moves: fighter.moves.map((move) => ({ ...move })),
  }));
}

function tuneLineup(
  fighters: FighterDefinition[],
  hpMultiplier: number,
  attackMultiplier: number,
  powerMultiplier: number,
): FighterDefinition[] {
  return fighters.map((fighter) => ({
    ...fighter,
    maxHp: Math.round(fighter.maxHp * hpMultiplier),
    attack: Math.round(fighter.attack * attackMultiplier),
    moves: fighter.moves.map((move): Move =>
      move.effect === 'damage' || move.effect === 'multi-target'
        ? { ...move, power: Math.max(1, Math.round(move.power * powerMultiplier)) }
        : { ...move }),
  }));
}

const shellsTownMarines = placeEnemies(
  createCrewEnemy('morgan', 0, 70),
  commanderRipper,
  marineGunner,
  createCrewEnemy('helmeppo', 0, 20),
);

const marineYardResponse = placeEnemies(
  createCrewEnemy('helmeppo', 0, 20),
  marineGuard,
  marineRecruit,
);

const executionGroundsPatrol = placeEnemies(
  createCrewEnemy('helmeppo', 0, 20),
  marineRecruit,
);

const morganLastStand = tuneLineup(
  placeEnemies(
    createCrewEnemy('morgan', 0, 70),
    commanderRipper,
    marineGunner,
  ),
  0.6,
  0.5,
  0.5,
);

const beastTamersStreet = placeEnemies(
  createCrewEnemy('mohji', 0, 35),
  createCrewEnemy('richie', 0, 25),
);

const harborDecoy = tuneLineup(
  placeEnemies(
    createCrewEnemy('mohji', 0, 35),
    createCrewEnemy('richie', 0, 25),
  ),
  0.75,
  0.8,
  0.8,
);

const acrobatRooftops = placeEnemies(
  createCrewEnemy('cabaji', 0, 55),
  createOrangePirate('acrobat-pirate-a', 'Acrobat Pirate', 0, 'acrobat'),
  createOrangePirate('acrobat-pirate-b', 'Knife-Juggling Pirate', 0, 'acrobat'),
);

const buggysBigTop = tuneLineup(
  placeEnemies(
    createCrewEnemy('buggy', 0, 70),
    createCrewEnemy('cabaji', 0, 60),
    createCrewEnemy('mohji', 0, 45),
    createCrewEnemy('richie', 0, 35),
  ),
  0.85,
  0.85,
  0.85,
);

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
  'marine-yard': marineYardResponse,
  'execution-grounds': executionGroundsPatrol,
  'morgan-last-stand': morganLastStand,
  'beast-tamers-street': beastTamersStreet,
  'harbor-decoy': harborDecoy,
  'acrobat-rooftops': acrobatRooftops,
  'buggys-big-top': buggysBigTop,
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
