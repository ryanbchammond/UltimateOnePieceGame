import type { Element } from './types';

export type BaseDamageMultiplier = 0.25 | 0.5 | 1 | 2 | 4;
export type DamageMultiplier = BaseDamageMultiplier | 4.5 | 5;

export const elementOrder: Element[] = [
  'brawler',
  'swordsman',
  'sniper',
  'fire',
  'ice',
  'poison',
  'water',
  'earth',
  'nature',
  'lightning',
  'magic',
  'beast',
];

export const elementLabels: Record<Element, string> = {
  brawler: 'Brawler',
  swordsman: 'Swordsman',
  sniper: 'Sniper',
  fire: 'Fire',
  ice: 'Ice',
  poison: 'Poison',
  water: 'Water',
  earth: 'Earth',
  nature: 'Nature',
  lightning: 'Lightning',
  magic: 'Magic',
  beast: 'Beast',
};

export const typeEffectiveness: Record<Element, Record<Element, BaseDamageMultiplier>> = {
  brawler: {
    brawler: 1, swordsman: 0.5, sniper: 2, fire: 1, ice: 1, poison: 0.5,
    water: 1, earth: 0.5, nature: 1, lightning: 1, magic: 0.5, beast: 1,
  },
  swordsman: {
    brawler: 2, swordsman: 1, sniper: 0.5, fire: 1, ice: 1, poison: 1,
    water: 1, earth: 1, nature: 1, lightning: 1, magic: 0.5, beast: 1,
  },
  sniper: {
    brawler: 0.5, swordsman: 2, sniper: 1, fire: 1, ice: 1, poison: 1,
    water: 1, earth: 1, nature: 1, lightning: 1, magic: 0.5, beast: 2,
  },
  fire: {
    brawler: 1, swordsman: 1, sniper: 1, fire: 0.5, ice: 2, poison: 1,
    water: 0.25, earth: 0.5, nature: 2, lightning: 0.5, magic: 1, beast: 2,
  },
  ice: {
    brawler: 1, swordsman: 1, sniper: 1, fire: 0.5, ice: 0.5, poison: 1,
    water: 2, earth: 1, nature: 1, lightning: 1, magic: 1, beast: 1,
  },
  poison: {
    brawler: 2, swordsman: 1, sniper: 1, fire: 1, ice: 1, poison: 0.5,
    water: 1, earth: 1, nature: 2, lightning: 1, magic: 1, beast: 2,
  },
  water: {
    brawler: 1, swordsman: 1, sniper: 1, fire: 4, ice: 0.25, poison: 1,
    water: 0.5, earth: 1, nature: 0.5, lightning: 0.5, magic: 1, beast: 1,
  },
  earth: {
    brawler: 2, swordsman: 1, sniper: 1, fire: 1, ice: 1, poison: 1,
    water: 1, earth: 0.5, nature: 1, lightning: 2, magic: 1, beast: 1,
  },
  nature: {
    brawler: 1, swordsman: 1, sniper: 1, fire: 0.25, ice: 0.5, poison: 0.5,
    water: 2, earth: 2, nature: 0.5, lightning: 1, magic: 2, beast: 1,
  },
  lightning: {
    brawler: 1, swordsman: 1, sniper: 1, fire: 1, ice: 1, poison: 1,
    water: 2, earth: 0.25, nature: 0.5, lightning: 0.5, magic: 1, beast: 1,
  },
  magic: {
    brawler: 2, swordsman: 2, sniper: 2, fire: 1, ice: 1, poison: 1,
    water: 1, earth: 1, nature: 0.5, lightning: 1, magic: 2, beast: 1,
  },
  beast: {
    brawler: 1, swordsman: 1, sniper: 0.5, fire: 0.5, ice: 1, poison: 0.5,
    water: 1, earth: 1, nature: 1, lightning: 1, magic: 1, beast: 1,
  },
};

export function getTypeMultiplier(
  attackType: Element,
  defenderTypes: readonly Element[],
  defenderUsesDevilFruit = false,
): DamageMultiplier {
  const combinedMultiplier = defenderTypes.reduce<number>(
    (total, defenderType) => total * typeEffectiveness[attackType][defenderType],
    1,
  );
  const chartMultiplier = Math.max(0.25, Math.min(4, combinedMultiplier)) as BaseDamageMultiplier;
  if (attackType !== 'water' || !defenderUsesDevilFruit) return chartMultiplier;

  return getDevilFruitWaterMultiplier(chartMultiplier);
}

export function getDevilFruitWaterMultiplier(
  chartMultiplier: BaseDamageMultiplier,
): 4 | 4.5 | 5 {
  if (chartMultiplier === 4) return 5;
  if (chartMultiplier === 2) return 4.5;
  return 4;
}

export function describeMultiplier(multiplier: DamageMultiplier): string {
  if (multiplier >= 4) return multiplier === 4 ? 'Devil Fruit weakness' : 'Extreme weakness';
  if (multiplier > 1) return 'Super effective';
  if (multiplier < 1) return 'Resisted';
  return 'Neutral';
}
