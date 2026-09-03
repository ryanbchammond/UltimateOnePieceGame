import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { useRunStore } from '../store/runStore';
import { VoyageEventCard } from './RunPanels';

describe('VoyageEventPanel', () => {
  beforeEach(() => {
    useRunStore.getState().abandonRun();
    useRunStore.getState().startRun();
  });

  it('renders persisted Logbook progress, destination, choices, and wanted pressure', () => {
    useRunStore.setState({
      phase: 'voyage',
      bounty: 3000,
      pendingVoyage: {
        id: 'render-fixture',
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        eventIds: ['drifting-lockbox', 'east-blue-crosscurrent', 'news-coo-rumor'],
        currentEventIndex: 0,
      },
    });

    const markup = renderToStaticMarkup(
      <VoyageEventCard onBeginBattle={() => undefined} onChoose={() => undefined} run={useRunStore.getState()} />,
    );
    expect(markup).toContain('Logbook draw');
    expect(markup).toContain('Heading for Barrel at Sea');
    expect(markup).toContain('Wanted pressure: rising');
    expect(markup).toContain('Drifting Lockbox');
    expect(markup).toContain('Keep the brass instrument');
    expect(markup).toContain('Keep the merchant&#x27;s folio');
  });

  it('renders attack cards as preparation rather than committing combat immediately', () => {
    useRunStore.setState({
      phase: 'voyage',
      pendingVoyage: {
        id: 'attack-fixture',
        fromNodeId: 'foosha-departure',
        destinationNodeId: 'barrel-at-sea',
        eventIds: ['alvida-stragglers'],
        currentEventIndex: 0,
      },
    });

    const markup = renderToStaticMarkup(
      <VoyageEventCard onBeginBattle={() => undefined} onChoose={() => undefined} run={useRunStore.getState()} />,
    );
    expect(markup).toContain('Enemy attack');
    expect(markup).toContain('Alvida&#x27;s Stragglers');
    expect(markup).toContain('Prepare for the attack');
  });
});
