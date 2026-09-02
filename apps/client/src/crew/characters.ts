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
} from '../combat/moves';
import type {
  CombatStat,
  DamageCondition,
  Element,
  FighterDefinition,
  Move,
  MoveEffect,
} from '../combat/types';
import type {
  CardRarity,
  CharacterCapability,
  CharacterId,
  CharacterMovePp,
  RoleAssignments,
  ShipRole,
} from '../run/types';

export interface CrewCharacter {
  id: CharacterId;
  name: string;
  epithet: string;
  idealRoles: ShipRole[];
  rarity: CardRarity;
  capabilities?: CharacterCapability[];
  cardAnimationKey?: string;
  fighter: Omit<FighterDefinition, 'side' | 'slot'>;
}

const damage = (id: string, name: string, element: Element, power: number, maxPp = 8): Move =>
  directDamage(id, name, element, power, maxPp);

const guard = (id: string, name: string, element: Element): Move =>
  selfGuard(id, name, element);

const buff = (
  id: string,
  name: string,
  element: Element,
  stat: 'attack' | 'defense',
  damageTypeOverride?: Element,
): Move => selfStat(id, name, element, stat, 20, 5, damageTypeOverride);

const debuff = (
  id: string,
  name: string,
  element: Element,
  stat: CombatStat,
): Move => enemyStat(id, name, element, stat);

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
  stat: CombatStat,
  maxPp = 5,
): Move => move(id, name, element, maxPp, 'ally', [statEffect(id, stat, 20)]);

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
    guardedBonus > 0
      ? { condition: 'target-guarding', power: guardedBonus }
      : undefined,
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

export const shipRoleOrder: ShipRole[] = [
  'captain',
  'fighter-1',
  'fighter-2',
  'fighter-3',
  'doctor',
  'navigator',
  'helmsman',
  'cook',
  'shipwright',
  'pet',
];

export const shipRoleLabels: Record<ShipRole, string> = {
  captain: 'Captain',
  'fighter-1': 'Fighter I',
  'fighter-2': 'Fighter II',
  'fighter-3': 'Fighter III',
  doctor: 'Doctor',
  navigator: 'Navigator',
  helmsman: 'Helmsman',
  cook: 'Cook',
  shipwright: 'Shipwright',
  pet: 'Pet',
};

export const startingRosterIds: CharacterId[] = ['luffy', 'zoro', 'sanji', 'nami'];
export const startingActivePartyIds: CharacterId[] = ['luffy', 'zoro', 'sanji', 'nami'];

export function createStartingRoleAssignments(): RoleAssignments {
  return {
    captain: 'luffy',
    'fighter-1': 'zoro',
    'fighter-2': null,
    'fighter-3': null,
    doctor: null,
    navigator: 'nami',
    helmsman: null,
    cook: 'sanji',
    shipwright: null,
    pet: null,
  };
}

export const crewCharacters: Record<CharacterId, CrewCharacter> = {
  luffy: {
    id: 'luffy',
    name: 'Luffy',
    epithet: 'Straw Hat',
    idealRoles: ['captain'],
    rarity: 'legendary',
    fighter: {
      id: 'luffy',
      name: 'Luffy',
      maxHp: 120,
      attack: 22,
      defense: 12,
      speed: 17,
      types: ['brawler'],
      devilFruitUser: true,
      moves: [
        conditionalDamage('pistol', 'Gum-Gum Pistol', 'brawler', 22, 'actor-below-half-hp'),
        guard('balloon', 'Gum-Gum Balloon', 'brawler'),
        allyStat('battle-cry', 'Battle Cry', 'brawler', 'attack'),
        groupMove('gatling', 'Gum-Gum Gatling', 'brawler', 2, 3, [
          removeGuardEffect(),
          damageEffect(11),
        ]),
      ],
    },
  },
  alvida: {
    id: 'alvida',
    name: 'Alvida',
    epithet: 'Iron Mace',
    idealRoles: ['captain', 'fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'rare',
    fighter: {
      id: 'alvida',
      name: 'Alvida',
      maxHp: 82,
      attack: 15,
      defense: 10,
      speed: 12,
      types: ['brawler'],
      devilFruitUser: false,
      moves: [
        guardBreakDamage('iron-mace', 'Iron Mace', 'brawler', 18, 6, 8),
        guard('iron-skin', 'Iron Skin', 'brawler'),
        debuff('captains-threat', "Captain's Threat", 'brawler', 'attack'),
        multiTarget('mace-sweep', 'Mace Sweep', 'brawler', 7),
      ],
    },
  },
  morgan: {
    id: 'morgan',
    name: 'Axe-Hand Morgan',
    epithet: 'Tyrant of Shells Town',
    idealRoles: ['captain', 'fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'epic',
    fighter: {
      id: 'morgan',
      name: 'Axe-Hand Morgan',
      maxHp: 92,
      attack: 19,
      defense: 11,
      speed: 15,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        guardBreakDamage('axe-drop', 'Axe Drop', 'swordsman', 20, 6),
        allyStat('iron-authority', 'Iron Authority', 'swordsman', 'defense'),
        allyStat('tyrants-order', "Tyrant's Order", 'brawler', 'attack'),
        groupMove('execution-sweep', 'Execution Sweep', 'swordsman', 3, 2, [damageEffect(9)]),
      ],
    },
  },
  helmeppo: {
    id: 'helmeppo',
    name: 'Helmeppo',
    epithet: "Morgan's Spoiled Son",
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'uncommon',
    fighter: {
      id: 'helmeppo',
      name: 'Helmeppo',
      maxHp: 58,
      attack: 14,
      defense: 7,
      speed: 11,
      types: ['brawler'],
      devilFruitUser: false,
      moves: [
        damage('pistol-shot', 'Pistol Shot', 'sniper', 15),
        allyGuard('human-shield', 'Human Shield', 'brawler', 5),
        debuff('cheap-taunt', 'Cheap Taunt', 'brawler', 'defense'),
        conditionalDamage(
          'wild-barrage',
          'Wild Barrage',
          'sniper',
          14,
          'target-negative-effect',
          8,
          4,
        ),
      ],
    },
  },
  zoro: {
    id: 'zoro',
    name: 'Zoro',
    epithet: 'Pirate Hunter',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'legendary',
    fighter: {
      id: 'zoro',
      name: 'Zoro',
      maxHp: 110,
      attack: 24,
      defense: 14,
      speed: 16,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        damage('onigiri', 'Oni Giri', 'swordsman', 24),
        guard('two-sword-guard', 'Two-Sword Guard', 'swordsman'),
        guardBreakDamage('lions-song-setup', "Lion's Song", 'swordsman', 30, 3, 8),
        multiTarget('tatsumaki', 'Tatsumaki', 'swordsman', 12, 3),
      ],
    },
  },
  sanji: {
    id: 'sanji',
    name: 'Sanji',
    epithet: 'Black Leg',
    idealRoles: ['cook'],
    rarity: 'legendary',
    fighter: {
      id: 'sanji',
      name: 'Sanji',
      maxHp: 100,
      attack: 22,
      defense: 11,
      speed: 19,
      types: ['brawler'],
      devilFruitUser: false,
      moves: [
        conditionalDamage('mouton-shot', 'Mouton Shot', 'brawler', 22, 'actor-below-half-hp'),
        groupMove('party-table-guard', 'Party Table Kick Course', 'brawler', 2, 3, [
          damageEffect(10),
        ]),
        buff('diable-jambe', 'Diable Jambe', 'fire', 'attack', 'fire'),
        guardBreakDamage('concasser', 'Concasser', 'brawler', 26, 3, 8),
      ],
    },
  },
  nami: {
    id: 'nami',
    name: 'Nami',
    epithet: 'Cat Burglar',
    idealRoles: ['navigator'],
    rarity: 'rare',
    fighter: {
      id: 'nami',
      name: 'Nami',
      maxHp: 82,
      attack: 17,
      defense: 9,
      speed: 18,
      types: ['lightning'],
      devilFruitUser: false,
      moves: [
        conditionalDamage(
          'thunderbolt-tempo',
          'Thunderbolt Tempo',
          'lightning',
          24,
          'target-negative-effect',
          8,
          5,
        ),
        allyGuard('mirage-tempo', 'Mirage Tempo', 'lightning'),
        debuff('rain-tempo', 'Rain Tempo', 'water', 'defense'),
        groupMove('cyclone-tempo', 'Cyclone Tempo', 'nature', 2, 3, [
          damageEffect(9),
          statEffect('cyclone-tempo', 'speed', -20),
        ]),
      ],
    },
  },
  usopp: {
    id: 'usopp',
    name: 'Usopp',
    epithet: 'Brave Warrior of the Sea',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'rare',
    fighter: {
      id: 'usopp',
      name: 'Usopp',
      maxHp: 86,
      attack: 18,
      defense: 8,
      speed: 15,
      types: ['sniper'],
      devilFruitUser: false,
      moves: [
        conditionalDamage('lead-star', 'Lead Star', 'sniper', 20, 'target-negative-effect', 8, 6),
        guardBreakDamage('usopp-hammer', 'Usopp Hammer', 'brawler', 12, 4, 8),
        debuff('smoke-star', 'Smoke Star', 'sniper', 'speed'),
        move('exploding-star', 'Exploding Star', 'fire', 4, 'enemy', [
          damageEffect(12),
          damageOverTimeEffect('burn', 'Burn'),
        ]),
      ],
    },
  },
  coby: {
    id: 'coby',
    name: 'Coby',
    epithet: 'Determined Cabin Boy',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'common',
    fighter: {
      id: 'coby',
      name: 'Coby',
      maxHp: 78,
      attack: 16,
      defense: 9,
      speed: 14,
      types: ['brawler'],
      devilFruitUser: false,
      moves: [
        conditionalDamage('honest-impact', 'Honest Impact', 'brawler', 18, 'actor-below-half-hp'),
        allyGuard('brace', 'Brace', 'brawler'),
        move('rallying-resolve', 'Rallying Resolve', 'brawler', 3, 'ally', [
          healEffect(),
          statEffect('rallying-resolve', 'defense', 20),
        ]),
        multiTarget('marine-drill', 'Marine Drill', 'brawler', 8),
      ],
    },
  },
  johnny: {
    id: 'johnny',
    name: 'Johnny',
    epithet: 'Bounty Hunter',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'common',
    fighter: {
      id: 'johnny',
      name: 'Johnny',
      maxHp: 84,
      attack: 18,
      defense: 9,
      speed: 14,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        damage('sword-rush', 'Sword Rush', 'swordsman', 19),
        allyGuard('hunter-parry', 'Hunter Parry', 'swordsman'),
        selfStat('hunter-focus', 'Hunter Focus', 'swordsman', 'speed'),
        conditionalDamage(
          'bounty-charge',
          'Bounty Charge',
          'brawler',
          18,
          'target-negative-effect',
          8,
          4,
        ),
      ],
    },
  },
  yosaku: {
    id: 'yosaku',
    name: 'Yosaku',
    epithet: 'Bounty Hunter',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'common',
    fighter: {
      id: 'yosaku',
      name: 'Yosaku',
      maxHp: 82,
      attack: 18,
      defense: 8,
      speed: 15,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        conditionalDamage('cross-cut', 'Cross Cut', 'swordsman', 19, 'actor-below-half-hp'),
        guard('crossed-blades', 'Crossed Blades', 'swordsman'),
        move('bounty-hunter-grit', 'Bounty Hunter Grit', 'brawler', 4, 'self', [
          cleanseEffect(),
          statEffect('bounty-hunter-grit', 'defense', 20),
        ]),
        multiTarget('hunter-rush', 'Hunter Rush', 'swordsman', 9),
      ],
    },
  },
  tashigi: {
    id: 'tashigi',
    name: 'Tashigi',
    epithet: 'Sword Collector',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'rare',
    fighter: {
      id: 'tashigi',
      name: 'Tashigi',
      maxHp: 94,
      attack: 21,
      defense: 11,
      speed: 17,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        guardBreakDamage('shigure-slash', 'Shigure Slash', 'swordsman', 21, 5, 8),
        move('sword-collector-stance', 'Sword Collector Stance', 'swordsman', 4, 'ally', [
          cleanseEffect(),
        ]),
        allyStat('quick-draw', 'Quick Draw', 'swordsman', 'speed'),
        multiTarget('shigure-sweep', 'Shigure Sweep', 'swordsman', 10),
      ],
    },
  },
  gin: {
    id: 'gin',
    name: 'Gin',
    epithet: 'Man-Demon',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'rare',
    fighter: {
      id: 'gin',
      name: 'Gin',
      maxHp: 100,
      attack: 21,
      defense: 12,
      speed: 16,
      types: ['brawler'],
      devilFruitUser: false,
      moves: [
        move('tonfa-crush', 'Tonfa Crush', 'brawler', 5, 'enemy', [
          damageEffect(16),
          damageOverTimeEffect('bruised', 'Bruised'),
        ]),
        guard('crossed-tonfas', 'Crossed Tonfas', 'brawler'),
        debuff('demon-glare', 'Demon Glare', 'beast', 'defense'),
        groupMove('battle-spin', 'Battle Spin', 'beast', 2, 3, [
          damageEffect(10, { condition: 'target-negative-effect', power: 6 }),
        ]),
      ],
    },
  },
  buggy: {
    id: 'buggy',
    name: 'Buggy',
    epithet: 'The Clown',
    idealRoles: ['captain'],
    rarity: 'rare',
    cardAnimationKey: 'buggy-bomb',
    fighter: {
      id: 'buggy',
      name: 'Buggy',
      maxHp: 88,
      attack: 18,
      defense: 9,
      speed: 13,
      types: ['sniper'],
      devilFruitUser: true,
      moves: [
        conditionalDamage('chop-cannon', 'Chop-Chop Cannon', 'brawler', 18, 'actor-below-half-hp'),
        guard('chop-escape', 'Chop-Chop Escape', 'sniper'),
        debuff('flashy-taunt', 'Flashy Taunt', 'sniper', 'attack'),
        groupMove('buggy-ball', 'Buggy Ball', 'fire', 3, 2, [
          damageEffect(10),
          damageOverTimeEffect('burn', 'Burn'),
        ]),
      ],
    },
  },
  mohji: {
    id: 'mohji',
    name: 'Mohji',
    epithet: 'Beast Tamer',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'common',
    fighter: {
      id: 'mohji',
      name: 'Mohji',
      maxHp: 72,
      attack: 15,
      defense: 9,
      speed: 12,
      types: ['beast'],
      devilFruitUser: false,
      moves: [
        damage('beast-whip', 'Beast Whip', 'beast', 16),
        allyGuard('tamers-guard', "Tamer's Guard", 'beast'),
        allyStat('sic-em', "Sic 'Em", 'beast', 'attack'),
        groupMove('lion-stampede', 'Lion Stampede', 'beast', 2, 3, [
          damageEffect(7, { condition: 'target-negative-effect', power: 6 }),
        ]),
      ],
    },
  },
  richie: {
    id: 'richie',
    name: 'Richie',
    epithet: 'Mohji\'s Lion',
    idealRoles: ['pet', 'fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'common',
    fighter: {
      id: 'richie',
      name: 'Richie',
      maxHp: 68,
      attack: 17,
      defense: 7,
      speed: 15,
      types: ['beast'],
      devilFruitUser: false,
      moves: [
        conditionalDamage('claw-swipe', 'Claw Swipe', 'beast', 18, 'actor-below-half-hp'),
        guard('thick-hide', 'Thick Hide', 'beast'),
        debuff('predators-roar', "Predator's Roar", 'beast', 'speed'),
        guardBreakDamage('pounce-through', 'Pounce Through', 'beast', 22, 3, 8),
      ],
    },
  },
  cabaji: {
    id: 'cabaji',
    name: 'Cabaji',
    epithet: 'The Acrobat',
    idealRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'uncommon',
    fighter: {
      id: 'cabaji',
      name: 'Cabaji',
      maxHp: 76,
      attack: 17,
      defense: 9,
      speed: 16,
      types: ['swordsman'],
      devilFruitUser: false,
      moves: [
        conditionalDamage(
          'acrobat-slash',
          'Acrobat Slash',
          'swordsman',
          18,
          'target-negative-effect',
          8,
          6,
        ),
        selfStat('unicycle-evade', 'Unicycle Evade', 'swordsman', 'speed'),
        move('dirty-trick', 'Dirty Trick', 'poison', 4, 'enemy', [
          damageEffect(8),
          damageOverTimeEffect('bleed', 'Bleed'),
        ]),
        groupMove('carnival-storm', 'Carnival Storm', 'swordsman', 2, 3, [
          damageEffect(8),
          statEffect('carnival-storm', 'speed', -20),
        ]),
      ],
    },
  },
  smoker: {
    id: 'smoker',
    name: 'Smoker',
    epithet: 'White Hunter',
    idealRoles: ['captain', 'fighter-1', 'fighter-2', 'fighter-3'],
    rarity: 'legendary',
    cardAnimationKey: 'white-out',
    fighter: {
      id: 'smoker',
      name: 'Smoker',
      maxHp: 108,
      attack: 21,
      defense: 13,
      speed: 16,
      types: ['nature'],
      devilFruitUser: true,
      moves: [
        conditionalDamage('white-blow', 'White Blow', 'brawler', 21, 'target-negative-effect'),
        allyGuard('white-out', 'White Out', 'nature'),
        guardBreakDamage('nanashaku-jitte', 'Nanashaku Jitte', 'nature', 18, 4, 8),
        groupMove('smoke-snare', 'Smoke Snare', 'nature', 2, 3, [
          damageEffect(8),
          statEffect('smoke-snare', 'speed', -20),
        ]),
      ],
    },
  },
};

export function getCrewCharacter(id: CharacterId): CrewCharacter {
  return crewCharacters[id];
}

export function getPlayerFighters(
  ids: CharacterId[],
  maxHpBonusPercent = 0,
  characterStars: Partial<Record<CharacterId, number>> = {},
  characterMovePp: CharacterMovePp = {},
): FighterDefinition[] {
  if (ids.length < 1 || ids.length > 4 || new Set(ids).size !== ids.length) {
    throw new Error('A story battle party must contain between one and four unique crew members.');
  }

  return ids.map((id, slot) => {
    const character = getCrewCharacter(id);
    const starLevel = Math.max(1, characterStars[id] ?? 1);
    const starBonusPercent = (starLevel - 1) * 5;
    const starredMaxHp = character.fighter.maxHp + Math.round(
      (character.fighter.maxHp * starBonusPercent) / 100,
    );
    const maxHp = starredMaxHp + Math.round((starredMaxHp * maxHpBonusPercent) / 100);
    const attack = character.fighter.attack + Math.round(
      (character.fighter.attack * starBonusPercent) / 100,
    );
    const defense = character.fighter.defense + Math.round(
      (character.fighter.defense * starBonusPercent) / 100,
    );
    return {
      ...character.fighter,
      maxHp,
      attack,
      defense,
      side: 'player',
      slot,
      moves: character.fighter.moves.map((move) => ({ ...move })),
      initialMovePp: characterMovePp[id] ? { ...characterMovePp[id] } : undefined,
    };
  });
}
