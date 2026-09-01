import type { NodeChoice, StoryArc, StoryNode } from './types';

export const romanceDawnArc: StoryArc = {
  id: 'romance-dawn',
  name: 'Romance Dawn',
  mapTitle: 'ROMANCE DAWN · STORY ROUTE',
  mapInstruction: 'Follow Luffy and Coby toward Shells Town.',
  start: {
    nodeId: 'foosha-departure',
    phase: 'node',
    berries: 75,
    hull: 90,
    maxHull: 100,
    rosterIds: ['luffy'],
    guestIds: [],
    activePartyIds: ['luffy'],
    roleAssignments: {
      captain: 'luffy',
      'fighter-1': null,
      'fighter-2': null,
      'fighter-3': null,
      doctor: null,
      navigator: null,
      helmsman: null,
      cook: null,
      shipwright: null,
      pet: null,
    },
    journalEntry: 'Luffy prepared to leave Foosha Village alone in a tiny boat.',
  },
  nodeIds: [
    'foosha-departure',
    'barrel-at-sea',
    'alvida-deck',
    'alvida-hold',
    'alvida-hold-battle',
    'cobys-resolve',
  ],
};

export const romanceDawnNodes: StoryNode[] = [
  {
    id: 'foosha-departure',
    arcId: 'romance-dawn',
    name: 'Foosha Village',
    subtitle: 'The first voyage',
    description:
      'The morning tide is rising. Luffy has a tiny boat, a barrel of supplies, and one last chance to prepare before chasing the Grand Line.',
    type: 'start',
    x: 75,
    y: 270,
    prerequisites: [],
  },
  {
    id: 'barrel-at-sea',
    arcId: 'romance-dawn',
    name: 'Barrel at Sea',
    subtitle: 'A cabin boy in chains',
    description:
      'After surviving the whirlpool inside a barrel, Luffy meets Coby aboard Alvida\'s ship. Coby wants freedom but fears his captain.',
    type: 'event',
    x: 235,
    y: 270,
    prerequisites: ['foosha-departure'],
  },
  {
    id: 'alvida-deck',
    arcId: 'romance-dawn',
    name: 'Alvida\'s Deck',
    subtitle: 'Open rebellion',
    description:
      'Luffy and Coby charge onto the main deck, where Alvida and two pirates are ready to crush the uprising.',
    type: 'battle',
    encounterId: 'alvida-deck',
    x: 440,
    y: 145,
    prerequisites: ['barrel-at-sea'],
    branch: 'alvida-route',
    victory: {
      title: 'Alvida defeated',
      detail: 'The direct attack earned greater notoriety and freed Coby from Alvida.',
      journalEntry: 'Luffy defeated Alvida in open battle and shattered her hold over Coby.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 60 },
        { type: 'resource', resource: 'bounty', amount: 1500, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'alvida-hold',
    arcId: 'romance-dawn',
    name: 'Alvida\'s Hold',
    subtitle: 'Quiet resistance',
    description:
      'Below deck, Coby shows Luffy the supplies Alvida hoarded beside the cells of sailors who tried to resist her.',
    type: 'event',
    x: 420,
    y: 395,
    prerequisites: ['barrel-at-sea'],
    branch: 'alvida-route',
  },
  {
    id: 'alvida-hold-battle',
    arcId: 'romance-dawn',
    name: 'Break from the Hold',
    subtitle: 'The escape is discovered',
    description:
      'Alvida corners the escaping pair with one loyal pirate. The quiet route has bought Luffy room to fight.',
    type: 'battle',
    encounterId: 'alvida-hold',
    x: 625,
    y: 395,
    prerequisites: ['alvida-hold'],
    victory: {
      title: 'Alvida defeated',
      detail: 'The infiltration succeeded and Coby is finally free.',
      journalEntry: 'Luffy defeated Alvida after slipping through the ship\'s hold.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 40 },
        { type: 'resource', resource: 'bounty', amount: 900, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'cobys-resolve',
    arcId: 'romance-dawn',
    name: 'Coby\'s Resolve',
    subtitle: 'A Marine dream',
    description:
      'With Alvida behind them, Coby finally says his dream aloud: he will join the Marines, even if he must confront them beside Luffy first.',
    type: 'event',
    x: 850,
    y: 270,
    prerequisites: ['alvida-deck', 'alvida-hold-battle'],
    prerequisiteMode: 'any',
  },
];

export const romanceDawnConnections: Array<[string, string]> = [
  ['foosha-departure', 'barrel-at-sea'],
  ['barrel-at-sea', 'alvida-deck'],
  ['barrel-at-sea', 'alvida-hold'],
  ['alvida-hold', 'alvida-hold-battle'],
  ['alvida-deck', 'cobys-resolve'],
  ['alvida-hold-battle', 'cobys-resolve'],
];

export const romanceDawnChoices: Record<string, NodeChoice[]> = {
  'foosha-departure': [
    {
      id: 'pack-provisions',
      label: 'Pack extra provisions',
      detail: 'Carry 25 additional Berries worth of food and supplies, leaving the tiny boat at 90 hull.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 25 }],
      outcome: {
        title: 'Provisions secured',
        detail: 'The voyage begins with extra supplies aboard.',
        journalEntry: 'Luffy packed extra provisions before leaving Foosha Village.',
      },
    },
    {
      id: 'patch-the-boat',
      label: 'Patch the tiny boat',
      detail: 'Repair 10 hull before departure, leaving only 75 Berries aboard.',
      consequences: [{ type: 'hull-repair', amount: 10 }],
      outcome: {
        title: 'Boat repaired',
        detail: 'The tiny boat is as seaworthy as it can be.',
        journalEntry: 'Luffy reinforced the tiny boat before leaving Foosha Village.',
      },
    },
  ],
  'barrel-at-sea': [
    {
      id: 'rescue-coby-openly',
      label: 'Challenge Alvida openly',
      detail: 'Coby joins as a controllable guest. Face Alvida and two pirates for greater rewards.',
      consequences: [
        { type: 'guest', action: 'add', characterId: 'coby' },
        { type: 'route', branch: 'alvida-route', nodeId: 'alvida-deck' },
      ],
      outcome: {
        title: 'Open rebellion',
        detail: 'Coby chooses to stand beside Luffy against Alvida.',
        journalEntry: 'Luffy and Coby prepared to challenge Alvida on the open deck.',
      },
    },
    {
      id: 'infiltrate-alvidas-ship',
      label: 'Slip into Alvida\'s hold',
      detail: 'Coby joins as a controllable guest. Search below deck before a smaller battle.',
      consequences: [
        { type: 'guest', action: 'add', characterId: 'coby' },
        { type: 'route', branch: 'alvida-route', nodeId: 'alvida-hold' },
      ],
      outcome: {
        title: 'Infiltration begins',
        detail: 'Coby guides Luffy into the hold without raising the alarm.',
        journalEntry: 'Luffy and Coby slipped below deck to undermine Alvida quietly.',
      },
    },
  ],
  'alvida-hold': [
    {
      id: 'take-alvidas-supplies',
      label: 'Seize Alvida\'s supplies',
      detail: 'Gain 40 Berries before making the escape.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 40 }],
      outcome: {
        title: 'Supplies recovered',
        detail: 'Alvida\'s stolen stores will support the next voyage.',
        journalEntry: 'Luffy reclaimed supplies from Alvida\'s hold.',
      },
    },
    {
      id: 'free-alvidas-captives',
      label: 'Free the captives',
      detail: 'Gain 300 bounty as the freed sailors spread word of the uprising.',
      consequences: [{ type: 'resource', resource: 'bounty', amount: 300 }],
      outcome: {
        title: 'Captives freed',
        detail: 'The rescued sailors will remember who defied Alvida.',
        journalEntry: 'Luffy and Coby freed Alvida\'s captives before escaping the hold.',
      },
    },
  ],
  'cobys-resolve': [
    {
      id: 'support-cobys-dream',
      label: 'Sail for Shells Town',
      detail: 'Support Coby\'s Marine dream and secure this point as the latest checkpoint.',
      consequences: [{ type: 'checkpoint' }],
      outcome: {
        title: 'Course set for Shells Town',
        detail: 'Coby remains available as a guest for the next leg.',
        journalEntry: 'Luffy agreed to take Coby to the Marine base at Shells Town.',
      },
    },
  ],
};
