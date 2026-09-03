import type {
  CombatStat,
  DamageCondition,
  Element,
  FighterDefinition,
  Move,
  MoveEffect,
} from './types';
import {
  cleanseEffect,
  damageEffect,
  damageOverTimeEffect,
  directDamage,
  enemyStat,
  groupDamage,
  guardEffect,
  healEffect,
  move,
  removeGuardEffect,
  selfGuard,
  selfStat,
  statEffect,
} from './moves';
import { getCrewCharacter, getPlayerFighters, startingActivePartyIds } from '../crew/characters';
import { getCookMaxHpBonusPercent } from '../crew/roleEffects';
import type { CharacterHp, CharacterId, CharacterMovePp, EncounterId, RoleAssignments } from '../run/types';

const damage = (id: string, name: string, element: Element, power: number): Move =>
  directDamage(id, name, element, power);
const guard = (id: string, name: string, element: Element): Move =>
  selfGuard(id, name, element);
const stat = (
  id: string,
  name: string,
  element: Element,
  target: 'self' | 'enemy',
  affectedStat: CombatStat,
): Move => target === 'self'
  ? selfStat(id, name, element, affectedStat)
  : enemyStat(id, name, element, affectedStat);
const multiTarget = (
  id: string,
  name: string,
  element: Element,
  power: number,
  maxTargets = 2,
): Move => groupDamage(id, name, element, power, maxTargets);

const conditionalDamage = (
  id: string,
  name: string,
  element: Element,
  power: number,
  condition: DamageCondition,
  bonusPower = 8,
  maxPp = 8,
): Move => move(id, name, element, maxPp, 'enemy', [
  damageEffect(power, { condition, power: bonusPower }),
]);

const allyGuard = (id: string, name: string, element: Element, maxPp = 6): Move =>
  move(id, name, element, maxPp, 'ally', [guardEffect()]);

const allyStat = (
  id: string,
  name: string,
  element: Element,
  affectedStat: CombatStat,
  maxPp = 5,
): Move => move(id, name, element, maxPp, 'ally', [
  statEffect(id, affectedStat, 20),
]);

const guardBreakDamage = (
  id: string,
  name: string,
  element: Element,
  power: number,
  maxPp: number,
  guardedBonus = 0,
): Move => move(id, name, element, maxPp, 'enemy', [
  removeGuardEffect(),
  damageEffect(
    power,
    guardedBonus > 0 ? { condition: 'target-guarding', power: guardedBonus } : undefined,
  ),
]);

const groupMove = (
  id: string,
  name: string,
  element: Element,
  maxTargets: number,
  maxPp: number,
  effects: MoveEffect[],
): Move => move(id, name, element, maxPp, 'enemy-group', effects, { maxTargets });

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
          conditionalDamage(
            `${id}-roof-slash`,
            'Roof Slash',
            'swordsman',
            11,
            'target-negative-effect',
            6,
            6,
          ),
          selfStat(`${id}-tumble`, 'Tumble Away', 'brawler', 'speed'),
          stat(`${id}-sand-toss`, 'Sand Toss', 'poison', 'enemy', 'speed'),
          multiTarget(`${id}-crossfire`, 'Acrobat Crossfire', 'sniper', 4),
        ]
      : [
          damage(`${id}-hook-swing`, 'Hook Swing', 'beast', 11),
          allyGuard(`${id}-cage-cover`, 'Cage Cover', 'earth'),
          allyStat(`${id}-crack-whip`, 'Crack the Whip', 'beast', 'attack'),
          groupMove(`${id}-animal-rush`, 'Animal Rush', 'beast', 2, 3, [
            damageEffect(4, { condition: 'target-negative-effect', power: 4 }),
          ]),
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
      groupMove(`${id}-mob-rush`, 'Mob Rush', 'brawler', 2, 3, [
        damageEffect(3, { condition: 'target-negative-effect', power: 4 }),
      ]),
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
    guardBreakDamage('saber-rush', 'Saber Rush', 'swordsman', 17, 5, 8),
    allyGuard('marine-formation', 'Marine Formation', 'swordsman'),
    allyStat('commanding-shout', 'Commanding Shout', 'brawler', 'defense'),
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
    conditionalDamage('rifle-volley', 'Rifle Volley', 'sniper', 18, 'target-negative-effect', 8, 6),
    guard('take-cover', 'Take Cover', 'sniper'),
    stat('warning-shot', 'Warning Shot', 'sniper', 'enemy', 'speed'),
    move('powder-volley', 'Powder Volley', 'fire', 4, 'enemy', [
      damageEffect(8),
      damageOverTimeEffect('burn', 'Burn'),
    ]),
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
    allyGuard('hold-formation', 'Hold Formation', 'swordsman'),
    allyStat('steady-ranks', 'Steady Ranks', 'brawler', 'defense'),
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
    conditionalDamage('recruit-strike', 'Recruit Strike', 'brawler', 10, 'actor-below-half-hp'),
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
    moves: fighter.moves.map((move): Move => ({
      ...move,
      effects: move.effects.map((effect) =>
        effect.effect === 'damage'
          ? { ...effect, power: Math.max(1, Math.round(effect.power * powerMultiplier)) }
          : { ...effect },
      ),
    })),
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

const voyageAlvidaRaiders = tuneLineup(
  placeEnemies(
    createAlvidaPirate('voyage-raider-a', 'Alvida Raider', 0, 10),
    createAlvidaPirate('voyage-raider-b', 'Alvida Lookout', 0, 9),
  ),
  0.65,
  0.75,
  0.75,
);

const voyageMarinePatrol = tuneLineup(
  placeEnemies(marineRecruit, marineGuard),
  0.6,
  0.7,
  0.7,
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

const voyageBuggyScouts = tuneLineup(
  placeEnemies(
    createOrangePirate('voyage-acrobat', 'Buggy Scout', 0, 'acrobat'),
    createOrangePirate('voyage-beast-pirate', 'Beast Pirate', 0, 'beast'),
  ),
  0.7,
  0.75,
  0.75,
);

const voyageMarinePursuit = tuneLineup(
  placeEnemies(marineGunner, marineRecruit),
  0.65,
  0.75,
  0.75,
);

function createBlackCatRaider(
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
    maxHp: 48,
    attack: 12,
    defense: 6,
    speed,
    types: ['swordsman'],
    devilFruitUser: false,
    battleIq: 25,
    moves: [
      damage(`${id}-cat-saber`, 'Cat Saber', 'swordsman', 12),
      allyGuard(`${id}-scramble-cover`, 'Scramble for Cover', 'swordsman'),
      stat(`${id}-jeer`, 'Jeer', 'beast', 'enemy', 'defense'),
      multiTarget(`${id}-claw-rush`, 'Claw Rush', 'beast', 5),
    ],
  };
}

const jango: FighterDefinition = {
  id: 'jango',
  name: 'Jango',
  side: 'enemy',
  slot: 0,
  maxHp: 72,
  attack: 15,
  defense: 8,
  speed: 17,
  types: ['sniper'],
  devilFruitUser: false,
  battleIq: 55,
  moves: [
    conditionalDamage('jango-chakram', 'Chakram', 'sniper', 17, 'target-negative-effect', 7, 6),
    allyStat('jango-hypnotic-command', 'Hypnotic Command', 'magic', 'attack'),
    stat('jango-mesmerize', 'Mesmerize', 'magic', 'enemy', 'speed'),
    groupMove('jango-dancing-discs', 'Dancing Discs', 'sniper', 3, 3, [damageEffect(7)]),
  ],
};

const sham: FighterDefinition = {
  id: 'sham',
  name: 'Sham',
  side: 'enemy',
  slot: 0,
  maxHp: 70,
  attack: 17,
  defense: 8,
  speed: 18,
  types: ['swordsman'],
  devilFruitUser: false,
  battleIq: 45,
  moves: [
    conditionalDamage('sham-sneak-claw', 'Sneak Claw', 'swordsman', 17, 'target-negative-effect', 7, 6),
    selfStat('sham-feline-footwork', 'Feline Footwork', 'beast', 'speed'),
    stat('sham-taunting-hiss', 'Taunting Hiss', 'beast', 'enemy', 'defense'),
    multiTarget('sham-cross-claw', 'Cross Claw', 'swordsman', 7),
  ],
};

const buchi: FighterDefinition = {
  id: 'buchi',
  name: 'Buchi',
  side: 'enemy',
  slot: 0,
  maxHp: 94,
  attack: 19,
  defense: 12,
  speed: 11,
  types: ['beast'],
  devilFruitUser: false,
  battleIq: 40,
  moves: [
    guardBreakDamage('buchi-body-slam', 'Body Slam', 'brawler', 20, 6, 7),
    guard('buchi-thick-fur', 'Thick Fur', 'beast'),
    allyStat('buchi-brothers-roar', "Brothers' Roar", 'beast', 'attack'),
    multiTarget('buchi-catapult-crash', 'Catapult Crash', 'earth', 8),
  ],
};

const syrupNorthSlope = tuneLineup(
  placeEnemies(
    jango,
    createBlackCatRaider('black-cat-raider-a', 'Black Cat Raider', 0, 13),
    createBlackCatRaider('black-cat-raider-b', 'Black Cat Lookout', 0, 12),
  ),
  0.8,
  0.8,
  0.8,
);

const syrupMansionGrounds = tuneLineup(
  placeEnemies(sham, buchi),
  0.9,
  0.85,
  0.85,
);

const blackCatRaid = tuneLineup(
  placeEnemies(createCrewEnemy('kuro', 0, 75), jango, sham, buchi),
  0.78,
  0.78,
  0.78,
);

const voyageBlackCatLookouts = tuneLineup(
  placeEnemies(
    createBlackCatRaider('voyage-black-cat-a', 'Black Cat Lookout', 0, 13),
    createBlackCatRaider('voyage-black-cat-b', 'Black Cat Raider', 0, 12),
  ),
  0.7,
  0.75,
  0.75,
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
      conditionalDamage('shark-darts', 'Shark on Darts', 'water', 23, 'actor-below-half-hp', 8, 6),
      guard('shark-hide', 'Shark Hide', 'beast'),
      stat('terror-of-the-sea', 'Terror of the Sea', 'water', 'enemy', 'attack'),
      groupMove('tooth-storm', 'Tooth Storm', 'beast', 3, 3, [
        damageEffect(10),
        damageOverTimeEffect('bleed', 'Bleed'),
      ]),
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
      guardBreakDamage('fishman-karate', 'Fish-Man Karate', 'water', 20, 5, 8),
      guard('karate-stance', 'Karate Stance', 'brawler'),
      move('ocean-discipline', 'Ocean Discipline', 'water', 4, 'self', [
        cleanseEffect(),
        statEffect('ocean-discipline', 'defense', 20),
      ]),
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
      allyGuard('six-sword-guard', 'Six-Sword Guard', 'swordsman'),
      stat('octopus-focus', 'Octopus Focus', 'beast', 'self', 'attack'),
      multiTarget('six-sword-waltz', 'Six-Sword Waltz', 'swordsman', 10, 3),
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
      conditionalDamage('water-cannon', 'Water Cannon', 'water', 21, 'target-negative-effect', 8, 6),
      move('deep-breath', 'Deep Breath', 'water', 3, 'self', [healEffect()]),
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
  'syrup-north-slope': syrupNorthSlope,
  'syrup-mansion-grounds': syrupMansionGrounds,
  'black-cat-raid': blackCatRaid,
  'voyage-alvida-raiders': voyageAlvidaRaiders,
  'voyage-marine-patrol': voyageMarinePatrol,
  'voyage-buggy-scouts': voyageBuggyScouts,
  'voyage-marine-pursuit': voyageMarinePursuit,
  'voyage-black-cat-lookouts': voyageBlackCatLookouts,
  'shells-town': shellsTownMarines,
  'arlong-park': arlongPirates,
};

export function getEncounterFighters(
  encounterId: EncounterId,
  activePartyIds: CharacterId[] = startingActivePartyIds,
  roleAssignments?: RoleAssignments,
  characterStars: Partial<Record<CharacterId, number>> = {},
  characterMovePp: CharacterMovePp = {},
  characterHp: CharacterHp = {},
): FighterDefinition[] {
  const cookBonus = roleAssignments ? getCookMaxHpBonusPercent(roleAssignments) : 0;
  return [
    ...getPlayerFighters(activePartyIds, cookBonus, characterStars, characterMovePp, characterHp),
    ...encounterEnemies[encounterId],
  ].map((fighter) => ({
    ...fighter,
    moves: fighter.moves.map((move) => ({ ...move })),
  }));
}
