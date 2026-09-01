import { describe, expect, it } from 'vitest';
import {
  elementOrder,
  getDevilFruitWaterMultiplier,
  getTypeMultiplier,
  typeEffectiveness,
} from './typeEffectiveness';

describe('type effectiveness', () => {
  it('defines a complete twelve-by-twelve directional chart', () => {
    expect(elementOrder).toHaveLength(12);
    elementOrder.forEach((attackType) => {
      expect(Object.keys(typeEffectiveness[attackType])).toHaveLength(12);
      elementOrder.forEach((defenderType) => {
        expect([0.25, 0.5, 1, 2, 4]).toContain(
          typeEffectiveness[attackType][defenderType],
        );
      });
    });
  });

  it('preserves representative directional matchups from combat_chart.md', () => {
    expect(getTypeMultiplier('brawler', ['sniper'])).toBe(2);
    expect(getTypeMultiplier('sniper', ['brawler'])).toBe(0.5);
    expect(getTypeMultiplier('fire', ['water'])).toBe(0.25);
    expect(getTypeMultiplier('water', ['fire'])).toBe(4);
    expect(getTypeMultiplier('magic', ['magic'])).toBe(2);
    expect(getTypeMultiplier('lightning', ['earth'])).toBe(0.25);
  });

  it('multiplies up to three defensive types and caps the result', () => {
    expect(getTypeMultiplier('fire', ['ice', 'nature'])).toBe(4);
    expect(getTypeMultiplier('fire', ['water', 'earth'])).toBe(0.25);
    expect(getTypeMultiplier('brawler', ['sniper', 'swordsman'])).toBe(1);
    expect(getTypeMultiplier('poison', ['brawler', 'nature', 'beast'])).toBe(4);
  });

  it('applies the approved Devil Fruit Water floor and weakness increments', () => {
    expect(getTypeMultiplier('water', ['ice'], true)).toBe(4);
    expect(getTypeMultiplier('water', ['brawler'], true)).toBe(4);
    expect(getTypeMultiplier('water', ['nature'], true)).toBe(4);
    expect(getTypeMultiplier('water', ['fire'], true)).toBe(5);
    expect(getDevilFruitWaterMultiplier(2)).toBe(4.5);

    const chart = typeEffectiveness.water;
    expect(chart.fire).toBe(4);
    expect(getTypeMultiplier('water', ['fire'], true)).toBe(5);
  });
});
