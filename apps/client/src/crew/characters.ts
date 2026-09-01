import type { Element, FighterDefinition, Move } from '../combat/types';
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

const damage = (id: string, name: string, element: Element, power: number, maxPp = 8): Move => ({
  id,
  name,
  element,
  effect: 'damage',
  power,
  maxPp,
});

const guard = (id: string, name: string, element: Element): Move => ({
  id,
  name,
  element,
  effect: 'guard',
  damageReductionPercent: 40,
  maxPp: 6,
});

const buff = (
  id: string,
  name: string,
  element: Element,
  stat: 'attack' | 'defense',
  damageTypeOverride?: Element,
): Move => ({
  id,
  name,
  element,
  effect: 'stat',
  target: 'self',
  stat,
  modifierPercent: 20,
  durationRounds: 2,
  damageTypeOverride,
  maxPp: 5,
});

const debuff = (
  id: string,
  name: string,
  element: Element,
  stat: 'attack' | 'defense',
): Move => ({
  id,
  name,
  element,
  effect: 'stat',
  target: 'enemy',
  stat,
  modifierPercent: -20,
  durationRounds: 2,
  maxPp: 5,
});

const multiTarget = (id: string, name: string, element: Element, power: number): Move => ({
  id,
  name,
  element,
  effect: 'multi-target',
  power,
  maxPp: 3,
});

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
        damage('pistol', 'Gum-Gum Pistol', 'brawler', 22),
        guard('balloon', 'Gum-Gum Balloon', 'brawler'),
        buff('battle-cry', 'Battle Cry', 'brawler', 'attack'),
        multiTarget('gatling', 'Gum-Gum Gatling', 'brawler', 11),
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
        damage('iron-mace', 'Iron Mace', 'brawler', 16),
        guard('iron-skin', 'Iron Skin', 'brawler'),
        debuff('captains-threat', "Captain's Threat", 'brawler', 'attack'),
        multiTarget('mace-sweep', 'Mace Sweep', 'brawler', 7),
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
        buff('lions-song-setup', "Lion's Song Setup", 'swordsman', 'attack'),
        multiTarget('tatsumaki', 'Tatsumaki', 'swordsman', 12),
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
        damage('mouton-shot', 'Mouton Shot', 'brawler', 22),
        guard('party-table-guard', 'Party Table Guard', 'brawler'),
        buff('diable-jambe', 'Diable Jambe', 'fire', 'attack', 'fire'),
        multiTarget('concasser', 'Concasser', 'brawler', 11),
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
        damage('thunderbolt-tempo', 'Thunderbolt Tempo', 'lightning', 24),
        guard('mirage-tempo', 'Mirage Tempo', 'lightning'),
        debuff('rain-tempo', 'Rain Tempo', 'water', 'defense'),
        multiTarget('cyclone-tempo', 'Cyclone Tempo', 'nature', 10),
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
        damage('lead-star', 'Lead Star', 'sniper', 20),
        guard('usopp-hammer', 'Usopp Hammer Guard', 'brawler'),
        debuff('smoke-star', 'Smoke Star', 'sniper', 'attack'),
        multiTarget('exploding-star', 'Exploding Star', 'fire', 11),
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
        damage('honest-impact', 'Honest Impact', 'brawler', 18),
        guard('brace', 'Brace', 'brawler'),
        buff('rallying-resolve', 'Rallying Resolve', 'brawler', 'defense'),
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
        guard('hunter-parry', 'Hunter Parry', 'swordsman'),
        buff('hunter-focus', 'Hunter Focus', 'swordsman', 'attack'),
        multiTarget('bounty-charge', 'Bounty Charge', 'brawler', 9),
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
        damage('cross-cut', 'Cross Cut', 'swordsman', 19),
        guard('crossed-blades', 'Crossed Blades', 'swordsman'),
        buff('bounty-hunter-grit', 'Bounty Hunter Grit', 'brawler', 'defense'),
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
        damage('shigure-slash', 'Shigure Slash', 'swordsman', 21),
        guard('sword-collector-stance', 'Sword Collector Stance', 'swordsman'),
        buff('quick-draw', 'Quick Draw', 'swordsman', 'attack'),
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
        damage('tonfa-crush', 'Tonfa Crush', 'brawler', 22),
        guard('crossed-tonfas', 'Crossed Tonfas', 'brawler'),
        debuff('demon-glare', 'Demon Glare', 'beast', 'defense'),
        multiTarget('battle-spin', 'Battle Spin', 'beast', 11),
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
        damage('chop-cannon', 'Chop-Chop Cannon', 'brawler', 18),
        guard('chop-escape', 'Chop-Chop Escape', 'sniper'),
        debuff('flashy-taunt', 'Flashy Taunt', 'sniper', 'attack'),
        multiTarget('buggy-ball', 'Buggy Ball', 'fire', 12),
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
        damage('white-blow', 'White Blow', 'brawler', 21),
        guard('white-out', 'White Out', 'nature'),
        debuff('nanashaku-jitte', 'Nanashaku Jitte', 'nature', 'defense'),
        multiTarget('smoke-snare', 'Smoke Snare', 'nature', 10),
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
