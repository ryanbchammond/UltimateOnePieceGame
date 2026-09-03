import { describe, expect, it } from 'vitest';
import {
  createVoyageLeg,
  getVoyageEvent,
  getWantedPressure,
  voyageEventDefinitions,
} from './voyageEvents';
import { getStoryTravelRule } from './storyContent';

function sequenceRandom(values: number[]): () => number {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe('voyage event deck', () => {
  it('authors open-sea, local, and immediate travel profiles between story nodes', () => {
    expect(getStoryTravelRule('foosha-departure', 'barrel-at-sea'))
      .toEqual({ context: 'open-sea', minEvents: 1, maxEvents: 3 });
    expect(getStoryTravelRule('barrel-at-sea', 'alvida-deck'))
      .toEqual({ context: 'alvida-ship', minEvents: 0, maxEvents: 2 });
    expect(getStoryTravelRule('alvida-deck', 'cobys-resolve'))
      .toEqual({ context: 'immediate', minEvents: 0, maxEvents: 0 });
    expect(getStoryTravelRule('maps-and-promises', 'syrup-village-shore'))
      .toEqual({ context: 'open-sea', minEvents: 1, maxEvents: 3 });
    expect(getStoryTravelRule('syrup-village-shore', 'usopps-warning'))
      .toEqual({ context: 'syrup-village', minEvents: 0, maxEvents: 2 });
  });
  it('draws and persists a random one-to-three unique events for a leg', () => {
    const one = createVoyageLeg({
      activeArcId: 'romance-dawn',
      bounty: 0,
      currentNodeId: 'foosha-departure',
      voyageEventHistory: [],
    }, 'barrel-at-sea', sequenceRandom([0, 0]));
    expect(one.eventIds).toHaveLength(1);

    const three = createVoyageLeg({
      activeArcId: 'romance-dawn',
      bounty: 0,
      currentNodeId: 'foosha-departure',
      voyageEventHistory: [],
    }, 'barrel-at-sea', sequenceRandom([0.999, 0, 0, 0]));
    expect(three.eventIds).toHaveLength(3);
    expect(new Set(three.eventIds)).toHaveLength(3);
    expect(three).toEqual(expect.objectContaining({
      fromNodeId: 'foosha-departure',
      destinationNodeId: 'barrel-at-sea',
      currentEventIndex: 0,
    }));
  });

  it('draws zero-to-two contextual interruptions for local travel and none for immediate links', () => {
    const run = {
      activeArcId: 'romance-dawn' as const,
      bounty: 0,
      currentNodeId: 'barrel-at-sea',
      voyageEventHistory: [],
    };
    const skipped = createVoyageLeg(run, 'alvida-deck', sequenceRandom([0]), {
      context: 'alvida-ship', minEvents: 0, maxEvents: 2,
    });
    expect(skipped.eventIds).toEqual([]);

    const local = createVoyageLeg(run, 'alvida-deck', sequenceRandom([0.999, 0, 0]), {
      context: 'alvida-ship', minEvents: 0, maxEvents: 2,
    });
    expect(local.eventIds).toHaveLength(2);
    expect(local.eventIds.every((id) => getVoyageEvent(id).contexts.includes('alvida-ship'))).toBe(true);
    expect(local.eventIds).not.toContain('marine-longboat');
    expect(local.eventIds).not.toContain('foosha-supply-skiff');

    const immediate = createVoyageLeg(run, 'cobys-resolve', sequenceRandom([0.999]), {
      context: 'immediate', minEvents: 0, maxEvents: 0,
    });
    expect(immediate.eventIds).toEqual([]);
  });

  it('uses arc-themed pools and avoids recently drawn cards when enough remain', () => {
    const leg = createVoyageLeg({
      activeArcId: 'orange-town',
      bounty: 3000,
      currentNodeId: 'orange-town-harbor',
      voyageEventHistory: ['buggy-scout-raft', 'marine-pursuit-cutter'],
    }, 'chouchous-stand', sequenceRandom([0.5, 0, 0]));

    expect(leg.eventIds).not.toContain('buggy-scout-raft');
    expect(leg.eventIds).not.toContain('marine-pursuit-cutter');
    expect(leg.eventIds.every((id) => getVoyageEvent(id).arcIds.includes('orange-town'))).toBe(true);
  });

  it('raises wanted pressure at authored bounty thresholds', () => {
    expect(getWantedPressure(0)).toBe('low');
    expect(getWantedPressure(2500)).toBe('rising');
    expect(getWantedPressure(6000)).toBe('high');
  });

  it.each(['romance-dawn', 'orange-town', 'syrup-village', 'east-blue-prototype'] as const)(
    'gives %s every voyage family and a no-cost fallback for non-battles',
    (arcId) => {
      const events = Object.values(voyageEventDefinitions)
        .filter((event) => event.arcIds.includes(arcId) && event.contexts.includes('open-sea'));
      expect(new Set(events.map((event) => event.category))).toEqual(new Set([
        'battle', 'treasure', 'rest', 'shop', 'hazard', 'wildcard',
      ]));
      events.forEach((event) => {
        if (event.category === 'battle') {
          expect(event.encounterId).toBeTruthy();
          expect(event.victory?.consequences.length).toBeGreaterThan(0);
        } else {
          expect(event.choices?.some((choice) => !choice.requirements?.length)).toBe(true);
        }
      });
    },
  );

  it('draws only Syrup Village-themed local interruptions', () => {
    const leg = createVoyageLeg({
      activeArcId: 'syrup-village',
      bounty: 12_000,
      currentNodeId: 'syrup-village-shore',
      voyageEventHistory: [],
    }, 'usopps-warning', sequenceRandom([0.999, 0, 0]), {
      context: 'syrup-village', minEvents: 0, maxEvents: 2,
    });
    expect(leg.eventIds).toHaveLength(2);
    expect(leg.eventIds.every((id) => {
      const event = getVoyageEvent(id);
      return event.arcIds.includes('syrup-village') && event.contexts.includes('syrup-village');
    })).toBe(true);
  });
});
