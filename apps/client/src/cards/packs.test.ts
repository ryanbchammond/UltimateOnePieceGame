import { describe, expect, it } from 'vitest';
import {
  baratieCardPack,
  baratieStoryCardPack,
  cardsPerPack,
  cardRarityOrder,
  cardRevealTiers,
  drawCardFromPack,
  drawCardsFromPack,
  eastBlueSagaCardPack,
  featuredCharacterWeight,
  getCardAnimationKey,
  arlongParkCardPack,
  loguetownCardPack,
  orangeTownCardPack,
  romanceDawnCardPack,
  syrupVillageCardPack,
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

  it('uses the approved Romance Dawn pool, rarity table, and featured characters', () => {
    expect(romanceDawnCardPack.cost).toBe(0);
    expect(romanceDawnCardPack.cardCount).toBe(5);
    expect(romanceDawnCardPack.guaranteedRarity).toBe('rare');
    expect(romanceDawnCardPack.rarityOdds).toEqual({
      common: 48,
      uncommon: 20,
      rare: 25,
      epic: 6,
      legendary: 1,
      mythical: 0,
    });
    expect(romanceDawnCardPack.characterIds).toEqual([
      'luffy',
      'coby',
      'johnny',
      'yosaku',
      'helmeppo',
      'alvida',
      'tashigi',
      'gin',
      'morgan',
      'smoker',
    ]);
    expect(romanceDawnCardPack.featuredCharacterIds)
      .toEqual(['luffy', 'coby', 'helmeppo', 'alvida', 'morgan']);

    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0, 0))).toBe('coby');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.5, 0))).toBe('helmeppo');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.7, 0))).toBe('alvida');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.95, 0))).toBe('morgan');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.995, 0))).toBe('luffy');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.995, 0.99))).toBe('smoker');
  });

  it('weights Romance Dawn featured cards within rarity and guarantees Rare or better', () => {
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.7, 0.59))).toBe('alvida');
    expect(drawCardFromPack(romanceDawnCardPack, sequenceRandom(0.7, 0.6))).toBe('tashigi');

    const cards = drawCardsFromPack(
      romanceDawnCardPack,
      sequenceRandom(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    );
    expect(cards).toEqual(['alvida', 'coby', 'coby', 'coby', 'coby']);
    expect(getCardAnimationKey('morgan')).toBe('rarity-epic');
  });

  it('uses the approved Orange Town support pool and officer weighting', () => {
    expect(orangeTownCardPack.cost).toBe(0);
    expect(orangeTownCardPack.rarityOdds).toEqual(romanceDawnCardPack.rarityOdds);
    expect(orangeTownCardPack.featuredCharacterIds).toEqual(['mohji', 'richie', 'cabaji', 'buggy']);
    expect(orangeTownCardPack.characterIds).toEqual([
      'coby', 'johnny', 'yosaku', 'mohji', 'richie',
      'helmeppo', 'cabaji',
      'alvida', 'tashigi', 'gin', 'buggy',
      'morgan', 'smoker',
    ]);
    expect(drawCardFromPack(orangeTownCardPack, sequenceRandom(0, 0.99))).toBe('richie');
    expect(drawCardFromPack(orangeTownCardPack, sequenceRandom(0.5, 0.99))).toBe('cabaji');
    expect(drawCardFromPack(orangeTownCardPack, sequenceRandom(0.7, 0.99))).toBe('buggy');
    expect(drawCardFromPack(orangeTownCardPack, sequenceRandom(0.95, 0))).toBe('morgan');
    expect(drawCardFromPack(orangeTownCardPack, sequenceRandom(0.995, 0))).toBe('smoker');
  });

  it('features Usopp and Kuro in the Syrup Village arc pack', () => {
    expect(syrupVillageCardPack.cost).toBe(0);
    expect(syrupVillageCardPack.rarityOdds).toEqual(romanceDawnCardPack.rarityOdds);
    expect(syrupVillageCardPack.featuredCharacterIds).toEqual(['usopp', 'kuro']);
    expect(syrupVillageCardPack.characterIds).toContain('usopp');
    expect(syrupVillageCardPack.characterIds).toContain('kuro');
    expect(drawCardFromPack(syrupVillageCardPack, sequenceRandom(0.7, 0.99))).toBe('buggy');
    expect(drawCardFromPack(syrupVillageCardPack, sequenceRandom(0.95, 0.99))).toBe('morgan');
    expect(drawCardsFromPack(
      syrupVillageCardPack,
      sequenceRandom(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
    )).toHaveLength(5);
  });

  it('rewards completing East Blue with every arc card and improved rare-card odds', () => {
    const arcPools = [
      romanceDawnCardPack,
      orangeTownCardPack,
      syrupVillageCardPack,
      baratieStoryCardPack,
      arlongParkCardPack,
      loguetownCardPack,
    ];
    const everyArcCard = new Set(arcPools.flatMap((pack) => pack.characterIds));

    expect(new Set(eastBlueSagaCardPack.characterIds)).toEqual(everyArcCard);
    expect(eastBlueSagaCardPack.cost).toBe(0);
    expect(eastBlueSagaCardPack.guaranteedRarity).toBe('rare');
    expect(
      eastBlueSagaCardPack.rarityOdds.rare +
      eastBlueSagaCardPack.rarityOdds.epic +
      eastBlueSagaCardPack.rarityOdds.legendary,
    ).toBeGreaterThan(
      romanceDawnCardPack.rarityOdds.rare +
      romanceDawnCardPack.rarityOdds.epic +
      romanceDawnCardPack.rarityOdds.legendary,
    );
    expect(eastBlueSagaCardPack.rarityOdds).toEqual({
      common: 25, uncommon: 15, rare: 35, epic: 15, legendary: 10, mythical: 0,
    });
  });
});

function sequenceRandom(...values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values.at(-1) ?? 0;
}
