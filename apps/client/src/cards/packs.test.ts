import { describe, expect, it } from 'vitest';
import {
  baratieCardPack,
  cardsPerPack,
  cardRarityOrder,
  cardRevealTiers,
  drawCardFromPack,
  drawCardsFromPack,
  featuredCharacterWeight,
  getCardAnimationKey,
} from './packs';

describe('card packs', () => {
  it('defines all six rarities and reserves special reveals for Epic and above', () => {
    expect(cardRarityOrder).toEqual([
      'common',
      'uncommon',
      'rare',
      'epic',
      'legendary',
      'mythical',
    ]);
    expect(cardRevealTiers.epic).toBe('special');
    expect(cardRevealTiers.legendary).toBe('special');
    expect(cardRevealTiers.mythical).toBe('special');
  });

  it('uses the temporary 60/35/5 rarity table for a 300-Berry five-card pack', () => {
    expect(baratieCardPack.cost).toBe(300);
    expect(baratieCardPack.cardCount).toBe(cardsPerPack);
    expect(baratieCardPack.guaranteedRarity).toBe('rare');
    expect(baratieCardPack.rarityOdds).toEqual({
      common: 60,
      uncommon: 0,
      rare: 35,
      epic: 0,
      legendary: 5,
      mythical: 0,
    });
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0, 0))).toBe('coby');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.6, 0))).toBe('tashigi');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.95, 0))).toBe('smoker');
  });

  it('gives featured characters three times the selection weight within their rarity', () => {
    expect(baratieCardPack.featuredCharacterIds).toEqual(['gin']);
    expect(baratieCardPack.featuredCharacterWeight).toBe(featuredCharacterWeight);
    expect(featuredCharacterWeight).toBe(3);

    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.7, 0.19))).toBe('tashigi');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.7, 0.2))).toBe('gin');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.7, 0.79))).toBe('gin');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.7, 0.8))).toBe('buggy');
  });

  it('draws exactly five cards and guarantees one Rare-or-higher slot', () => {
    const cards = drawCardsFromPack(
      baratieCardPack,
      sequenceRandom(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    );

    expect(cards).toHaveLength(5);
    expect(cards[0]).toBe('tashigi');
    expect(cards.slice(1)).toEqual(['coby', 'coby', 'coby', 'coby']);
  });

  it('supports rarity and per-character animation hooks', () => {
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.1, 0.99))).toBe('yosaku');
    expect(drawCardFromPack(baratieCardPack, sequenceRandom(0.7, 0.99))).toBe('buggy');
    expect(getCardAnimationKey('coby')).toBe('rarity-common');
    expect(getCardAnimationKey('buggy')).toBe('buggy-bomb');
    expect(getCardAnimationKey('smoker')).toBe('white-out');
    expect(getCardAnimationKey('luffy')).toBe('legendary-luffy');
  });
});

function sequenceRandom(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}
