import type { NodeChoice, StoryArc, StoryNode } from './types';

export const romanceDawnArc: StoryArc = {
  id: 'romance-dawn',
  name: 'Romance Dawn',
  mapTitle: 'ROMANCE DAWN · STORY ROUTE',
  mapInstruction: 'Free Zoro and confront Morgan at the Marine base.',
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
    'shells-town-arrival',
    'marine-yard',
    'execution-grounds',
    'free-pirate-hunter',
    'morgan-last-stand',
    'marines-farewell',
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
    x: 60,
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
    x: 170,
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
    x: 280,
    y: 130,
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
    x: 280,
    y: 410,
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
    x: 410,
    y: 410,
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
    x: 440,
    y: 160,
    prerequisites: ['alvida-deck', 'alvida-hold-battle'],
    prerequisiteMode: 'any',
  },
  {
    id: 'shells-town-arrival',
    arcId: 'romance-dawn',
    name: 'Shells Town',
    subtitle: 'A town under Morgan',
    description:
      'Rika is punished for bringing food to the prisoner in the Marine yard. Luffy can confront Helmeppo openly or let Coby gather quieter information about the base.',
    type: 'event',
    x: 550,
    y: 270,
    prerequisites: ['cobys-resolve'],
  },
  {
    id: 'marine-yard',
    arcId: 'romance-dawn',
    name: 'Marine Yard',
    subtitle: 'Stand with Rika',
    description:
      'Luffy openly defies Helmeppo after helping Rika. Helmeppo calls two Marines into the yard to make an example of them.',
    type: 'battle',
    encounterId: 'marine-yard',
    x: 665,
    y: 130,
    prerequisites: ['shells-town-arrival'],
    branch: 'shells-route',
    victory: {
      title: 'Marine yard cleared',
      detail: 'The public stand protected Rika and exposed Morgan\'s rule to the whole town.',
      journalEntry: 'Luffy defeated Helmeppo\'s response force in the Marine yard.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 60 },
        { type: 'resource', resource: 'bounty', amount: 1200, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'execution-grounds',
    arcId: 'romance-dawn',
    name: 'Execution Grounds',
    subtitle: 'Quiet approach',
    description:
      'Coby\'s information reveals a lightly guarded route to Zoro. Helmeppo and one nervous Marine discover the escape attempt.',
    type: 'battle',
    encounterId: 'execution-grounds',
    x: 665,
    y: 410,
    prerequisites: ['shells-town-arrival'],
    branch: 'shells-route',
    victory: {
      title: 'Patrol outmaneuvered',
      detail: 'The quiet approach reached Zoro with a smaller fight and less public notoriety.',
      journalEntry: 'Luffy and Coby slipped through the execution grounds and defeated its patrol.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 30 },
        { type: 'resource', resource: 'bounty', amount: 600, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'free-pirate-hunter',
    arcId: 'romance-dawn',
    name: 'Free the Pirate Hunter',
    subtitle: 'Three swords reclaimed',
    description:
      'Zoro accepts Luffy\'s bargain: if Luffy returns his swords and they survive Morgan\'s attack, the Pirate Hunter will join his crew.',
    type: 'recruit',
    x: 775,
    y: 270,
    prerequisites: ['marine-yard', 'execution-grounds'],
    prerequisiteMode: 'any',
  },
  {
    id: 'morgan-last-stand',
    arcId: 'romance-dawn',
    name: 'Morgan\'s Last Stand',
    subtitle: 'The statue falls',
    description:
      'Morgan orders Commander Ripper and a Marine gunner to crush Luffy\'s new crew before the town can rise against him.',
    type: 'boss',
    encounterId: 'morgan-last-stand',
    x: 875,
    y: 150,
    prerequisites: ['free-pirate-hunter'],
    victory: {
      title: 'Morgan defeated',
      detail: 'Morgan\'s tyranny is broken and the Marines of Shells Town finally lower their weapons.',
      journalEntry: 'Luffy and his allies defeated Axe-Hand Morgan and liberated Shells Town.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 100 },
        { type: 'resource', resource: 'bounty', amount: 3000, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'marines-farewell',
    arcId: 'romance-dawn',
    name: 'A Marine\'s Farewell',
    subtitle: 'Dreams choose separate courses',
    description:
      'Coby remains in Shells Town to pursue his Marine dream. Zoro takes his place beside Luffy as the first permanent crewmate of the voyage.',
    type: 'event',
    x: 875,
    y: 400,
    prerequisites: ['morgan-last-stand'],
  },
];

export const romanceDawnConnections: Array<[string, string]> = [
  ['foosha-departure', 'barrel-at-sea'],
  ['barrel-at-sea', 'alvida-deck'],
  ['barrel-at-sea', 'alvida-hold'],
  ['alvida-hold', 'alvida-hold-battle'],
  ['alvida-deck', 'cobys-resolve'],
  ['alvida-hold-battle', 'cobys-resolve'],
  ['cobys-resolve', 'shells-town-arrival'],
  ['shells-town-arrival', 'marine-yard'],
  ['shells-town-arrival', 'execution-grounds'],
  ['marine-yard', 'free-pirate-hunter'],
  ['execution-grounds', 'free-pirate-hunter'],
  ['free-pirate-hunter', 'morgan-last-stand'],
  ['morgan-last-stand', 'marines-farewell'],
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
  'shells-town-arrival': [
    {
      id: 'help-rika-openly',
      label: 'Stand with Rika openly',
      detail: 'Challenge Helmeppo in public. Face him and two Marines for greater rewards.',
      consequences: [{ type: 'route', branch: 'shells-route', nodeId: 'marine-yard' }],
      outcome: {
        title: 'Open defiance',
        detail: 'Luffy protects Rika and draws Helmeppo\'s full response into the Marine yard.',
        journalEntry: 'Luffy openly stood with Rika against Helmeppo.',
      },
    },
    {
      id: 'gather-information-quietly',
      label: 'Gather information quietly',
      detail: 'Let Coby scout the base. Reach Zoro through a smaller patrol for lower rewards.',
      consequences: [{ type: 'route', branch: 'shells-route', nodeId: 'execution-grounds' }],
      outcome: {
        title: 'Quiet approach',
        detail: 'Coby learns the guard rotation and identifies a less defended path to Zoro.',
        journalEntry: 'Coby quietly gathered information about Zoro and the Marine base.',
      },
    },
  ],
  'free-pirate-hunter': [
    {
      id: 'return-zoros-swords',
      label: 'Return Zoro\'s swords',
      detail: 'Recruit Zoro permanently. You decide whether he enters the active battle lineup.',
      consequences: [
        {
          type: 'recruit',
          characterId: 'zoro',
          preferredRoles: ['fighter-1', 'fighter-2', 'fighter-3'],
        },
      ],
      outcome: {
        title: 'The Pirate Hunter joins',
        detail: 'Zoro becomes a permanent crewmate and is available for Morgan\'s Last Stand.',
        journalEntry: 'Luffy returned Zoro\'s swords, and Zoro joined the crew.',
      },
    },
  ],
  'marines-farewell': [
    {
      id: 'honor-cobys-farewell',
      label: 'Honor Coby\'s decision',
      detail: 'Coby leaves as a guest. Set a checkpoint and open the free Romance Dawn pack.',
      consequences: [
        { type: 'guest', action: 'remove', characterId: 'coby' },
        { type: 'restore', target: 'move-pp' },
        { type: 'checkpoint' },
        {
          type: 'pack',
          packId: 'romance-dawn',
          resume: {
            phase: 'map',
            activeArcId: 'orange-town',
            currentNodeId: 'orange-town-harbor',
          },
        },
      ],
      outcome: {
        title: 'Romance Dawn complete',
        detail: 'Coby begins his Marine path while Luffy and Zoro prepare for Orange Town.',
        journalEntry: 'Luffy and Zoro said farewell to Coby and set sail for Orange Town.',
      },
    },
  ],
};
