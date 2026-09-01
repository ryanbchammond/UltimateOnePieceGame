import type { StoryArc, StoryNode } from './types';

export const orangeTownArc: StoryArc = {
  id: 'orange-town',
  name: 'Orange Town',
  mapTitle: 'ORANGE TOWN · STORY ROUTE',
  mapInstruction: 'Orange Town begins in the next development phase.',
  start: {
    nodeId: 'orange-town-harbor',
    phase: 'map',
    berries: 0,
    hull: 100,
    maxHull: 100,
    rosterIds: ['luffy', 'zoro'],
    guestIds: [],
    activePartyIds: ['luffy', 'zoro'],
    roleAssignments: {
      captain: 'luffy',
      'fighter-1': 'zoro',
      'fighter-2': null,
      'fighter-3': null,
      doctor: null,
      navigator: null,
      helmsman: null,
      cook: null,
      shipwright: null,
      pet: null,
    },
    journalEntry: 'Luffy and Zoro reached Orange Town.',
  },
  nodeIds: ['orange-town-harbor'],
};

export const orangeTownNodes: StoryNode[] = [
  {
    id: 'orange-town-harbor',
    arcId: 'orange-town',
    name: 'Orange Town Harbor',
    subtitle: 'The next adventure',
    description:
      'Luffy and Zoro have reached the harbor. The occupied town, Nami\'s arrival, and Buggy\'s conflict will open in Phase 6 after the Romance Dawn playtest.',
    type: 'start',
    x: 180,
    y: 270,
    prerequisites: [],
  },
];

export const orangeTownConnections: Array<[string, string]> = [];

export const orangeTownChoices = {};
