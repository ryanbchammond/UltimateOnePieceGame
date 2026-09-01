import { getCrewCharacter } from '../crew/characters';
import type {
  CardPackId,
  CardPackOpening,
  CardRarity,
  CharacterId,
} from '../run/types';

export const cardRarityOrder: CardRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythical',
];

export const cardRarityLabels: Record<CardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  mythical: 'Mythical',
};

export type CardRevealTier = 'standard' | 'enhanced' | 'special';

export const cardRevealTiers: Record<CardRarity, CardRevealTier> = {
  common: 'standard',
  uncommon: 'standard',
  rare: 'enhanced',
  epic: 'special',
  legendary: 'special',
  mythical: 'special',
};

export interface CardPackDefinition {
  id: CardPackId;
  name: string;
  cost: number;
  cardCount: number;
  guaranteedRarity: CardRarity;
  rarityOdds: Record<CardRarity, number>;
  characterIds: CharacterId[];
  featuredCharacterIds: CharacterId[];
  featuredCharacterWeight: number;
}

export const cardsPerPack = 5;
export const featuredCharacterWeight = 3;

export const baratieCardPack: CardPackDefinition = {
  id: 'baratie-east-blue',
  name: 'East Blue Card Pack',
  cost: 300,
  cardCount: cardsPerPack,
  guaranteedRarity: 'rare',
  rarityOdds: {
    common: 60,
    uncommon: 0,
    rare: 35,
    epic: 0,
    legendary: 5,
    mythical: 0,
  },
  characterIds: ['coby', 'johnny', 'yosaku', 'tashigi', 'gin', 'buggy', 'smoker'],
  featuredCharacterIds: ['gin'],
  featuredCharacterWeight,
};

export const romanceDawnCardPack: CardPackDefinition = {
  id: 'romance-dawn',
  name: 'Romance Dawn Card Pack',
  cost: 0,
  cardCount: cardsPerPack,
  guaranteedRarity: 'rare',
  rarityOdds: {
    common: 48,
    uncommon: 20,
    rare: 25,
    epic: 6,
    legendary: 1,
    mythical: 0,
  },
  characterIds: [
    'coby',
    'johnny',
    'yosaku',
    'helmeppo',
    'alvida',
    'tashigi',
    'gin',
    'morgan',
    'smoker',
  ],
  featuredCharacterIds: ['coby', 'helmeppo', 'alvida', 'morgan'],
  featuredCharacterWeight,
};

export const cardPacks: Record<CardPackId, CardPackDefinition> = {
  'baratie-east-blue': baratieCardPack,
  'romance-dawn': romanceDawnCardPack,
};

export function getCardPack(packId: CardPackId): CardPackDefinition {
  return cardPacks[packId];
}

export const firstStarUpgradeCost = 3;
export const currentMaxStarLevel = 2;

function normalizedRoll(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 0.999999999999);
}

export function drawCardFromPack(
  pack: CardPackDefinition,
  random: () => number = Math.random,
  minimumRarity?: CardRarity,
): CharacterId {
  const minimumIndex = minimumRarity ? cardRarityOrder.indexOf(minimumRarity) : 0;
  const eligibleRarities = cardRarityOrder.filter((_, index) => index >= minimumIndex);
  const totalWeight = eligibleRarities.reduce((total, rarity) => total + pack.rarityOdds[rarity], 0);
  if (totalWeight <= 0) throw new Error(`${pack.name} has no positive rarity odds.`);

  let rarityRoll = normalizedRoll(random) * totalWeight;
  let selectedRarity = eligibleRarities.find((rarity) => {
    rarityRoll -= pack.rarityOdds[rarity];
    return rarityRoll < 0 && pack.rarityOdds[rarity] > 0;
  });
  selectedRarity ??= [...eligibleRarities]
    .reverse()
    .find((rarity) => pack.rarityOdds[rarity] > 0);

  const eligibleCharacters = pack.characterIds.filter(
    (characterId) => getCrewCharacter(characterId).rarity === selectedRarity,
  );
  if (eligibleCharacters.length === 0) {
    throw new Error(`${pack.name} has odds for ${selectedRarity} but no matching cards.`);
  }

  const totalCharacterWeight = eligibleCharacters.reduce(
    (total, characterId) =>
      total +
      (pack.featuredCharacterIds.includes(characterId) ? pack.featuredCharacterWeight : 1),
    0,
  );
  let characterRoll = normalizedRoll(random) * totalCharacterWeight;
  for (const characterId of eligibleCharacters) {
    characterRoll -= pack.featuredCharacterIds.includes(characterId)
      ? pack.featuredCharacterWeight
      : 1;
    if (characterRoll < 0) return characterId;
  }
  return eligibleCharacters.at(-1)!;
}

export function drawCardsFromPack(
  pack: CardPackDefinition,
  random: () => number = Math.random,
): CharacterId[] {
  if (!Number.isInteger(pack.cardCount) || pack.cardCount <= 0) {
    throw new Error(`${pack.name} must contain at least one card.`);
  }

  const guaranteedSlot = Math.floor(normalizedRoll(random) * pack.cardCount);
  return Array.from({ length: pack.cardCount }, (_, slot) =>
    drawCardFromPack(pack, random, slot === guaranteedSlot ? pack.guaranteedRarity : undefined),
  );
}

export function createCardPackOpening(
  pack: CardPackDefinition,
  packNumber: number,
  source: CardPackOpening['source'],
  random: () => number = Math.random,
  resume?: CardPackOpening['resume'],
): CardPackOpening {
  const openingId = `${pack.id}-${packNumber}`;
  return {
    id: openingId,
    packId: pack.id,
    packNumber,
    source,
    resume,
    cards: drawCardsFromPack(pack, random).map((characterId, slot) => ({
      cardId: `${openingId}-card-${slot + 1}`,
      slot,
      characterId,
      rarity: getCrewCharacter(characterId).rarity,
      revealed: false,
    })),
  };
}

export function getCardAnimationKey(characterId: CharacterId): string {
  const character = getCrewCharacter(characterId);
  if (character.cardAnimationKey) return character.cardAnimationKey;
  return character.rarity === 'legendary' || character.rarity === 'mythical'
    ? `${character.rarity}-${character.id}`
    : `rarity-${character.rarity}`;
}
