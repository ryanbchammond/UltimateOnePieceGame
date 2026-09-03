import type { NodeChoice, StoryArc, StoryNode } from './types';

export const orangeTownArc: StoryArc = {
  id: 'orange-town',
  name: 'Orange Town',
  mapTitle: 'ORANGE TOWN · STORY ROUTE',
  mapInstruction: 'Break Buggy\'s hold on the town and defeat him at the Big Top.',
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
  nodeIds: [
    'orange-town-harbor',
    'chouchous-stand',
    'beast-tamers-street',
    'harbor-decoy',
    'acrobat-rooftops',
    'mayors-resolve',
    'buggys-big-top',
    'maps-and-promises',
  ],
};

export const orangeTownNodes: StoryNode[] = [
  {
    id: 'orange-town-harbor',
    arcId: 'orange-town',
    name: 'Orange Town Harbor',
    subtitle: 'A thief beneath the Jolly Roger',
    description:
      'Luffy and Zoro reach a harbor scarred by cannon fire. Nami, a thief targeting pirates, offers a temporary alliance against Buggy and a path into the occupied town.',
    type: 'start',
    services: ['crew-assignments'],
    x: 90,
    y: 270,
    prerequisites: [],
  },
  {
    id: 'chouchous-stand',
    arcId: 'orange-town',
    name: "Chouchou's Stand",
    subtitle: 'One shop against a pirate crew',
    description:
      'Chouchou refuses to abandon the pet-food shop entrusted to him. Buggy\'s officers close in while Nami spots paths through the street, harbor, and rooftops.',
    type: 'event',
    x: 230,
    y: 270,
    prerequisites: ['orange-town-harbor'],
  },
  {
    id: 'beast-tamers-street',
    arcId: 'orange-town',
    name: "Beast Tamer's Street",
    subtitle: 'Stand beside Chouchou',
    description:
      'Mohji and Richie charge straight for the shop at full strength. Defending it openly means facing the beast-tamer pair without the advantage of Nami\'s decoy.',
    type: 'battle',
    encounterId: 'beast-tamers-street',
    x: 410,
    y: 105,
    prerequisites: ['chouchous-stand'],
    branch: 'orange-officer-route',
    victory: {
      title: 'The shop still stands',
      detail: 'Mohji\'s full raiding party was driven from Chouchou\'s street.',
      journalEntry: 'The crew stood beside Chouchou and defeated Mohji and Richie at full strength.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 75 },
        { type: 'resource', resource: 'bounty', amount: 1200, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'harbor-decoy',
    arcId: 'orange-town',
    name: 'Harbor Decoy',
    subtitle: 'Trade safety for stolen stores',
    description:
      'Nami lures Mohji and Richie away from the shop and toward Buggy\'s stolen stores. The fight is smaller, but a Buggy Ball lands dangerously close to the crew\'s ship.',
    type: 'battle',
    encounterId: 'harbor-decoy',
    x: 410,
    y: 270,
    prerequisites: ['chouchous-stand'],
    branch: 'orange-officer-route',
    victory: {
      title: 'The decoy succeeds',
      detail: 'The beast tamers were defeated and Nami recovered Buggy\'s stolen supplies.',
      journalEntry: 'The crew drew Mohji and Richie to the harbor, seized their stores, and weathered Buggy\'s cannon fire.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 110 },
        { type: 'resource', resource: 'bounty', amount: 700, captainBountyBonus: true },
        { type: 'hull-damage', amount: 8, protectedByShipwright: true },
      ],
    },
  },
  {
    id: 'acrobat-rooftops',
    arcId: 'orange-town',
    name: "Acrobat's Rooftops",
    subtitle: 'Cabaji fights dirty',
    description:
      'Nami leads the crew above the occupied streets, where Cabaji and two acrobats use feints, taunts, and narrow footing to control the fight.',
    type: 'battle',
    encounterId: 'acrobat-rooftops',
    x: 410,
    y: 435,
    prerequisites: ['chouchous-stand'],
    branch: 'orange-officer-route',
    victory: {
      title: 'Rooftops cleared',
      detail: 'Cabaji\'s dirty tricks failed and the route to the town center is open.',
      journalEntry: 'The crew followed Nami over the rooftops and defeated Cabaji\'s acrobats.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 50 },
        { type: 'resource', resource: 'bounty', amount: 900, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'mayors-resolve',
    arcId: 'orange-town',
    name: "The Mayor's Resolve",
    subtitle: 'A final refuge before Buggy',
    description:
      'Mayor Boodle refuses to surrender his town. His refuge gives the crew time to recover before deciding how to help Orange Town prepare for the final confrontation.',
    type: 'rest',
    services: ['crew-assignments'],
    x: 605,
    y: 270,
    prerequisites: ['beast-tamers-street', 'harbor-decoy', 'acrobat-rooftops'],
    prerequisiteMode: 'any',
  },
  {
    id: 'buggys-big-top',
    arcId: 'orange-town',
    name: "Buggy's Big Top",
    subtitle: 'The clown captain makes his stand',
    description:
      'Buggy gathers Cabaji, Mohji, and Richie beneath the circus tent for one last cannon-lit confrontation. The crew must break his officers before the town can be free.',
    type: 'boss',
    encounterId: 'buggys-big-top',
    x: 770,
    y: 270,
    prerequisites: ['mayors-resolve'],
    victory: {
      title: 'Buggy blasted out of town',
      detail: 'The Big Top has fallen and Orange Town is free from Buggy\'s crew.',
      journalEntry: 'Luffy and his allies defeated Buggy, Cabaji, Mohji, and Richie at the Big Top.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 150 },
        { type: 'resource', resource: 'bounty', amount: 4500, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'maps-and-promises',
    arcId: 'orange-town',
    name: 'Maps and Promises',
    subtitle: 'A navigator joins the voyage',
    description:
      'With Buggy defeated, Nami chooses to keep sailing with Luffy and Zoro. Orange Town offers one final cache of cards before the crew charts its next course.',
    type: 'recruit',
    x: 910,
    y: 270,
    prerequisites: ['buggys-big-top'],
  },
];

export const orangeTownConnections: Array<[string, string]> = [
  ['orange-town-harbor', 'chouchous-stand'],
  ['chouchous-stand', 'beast-tamers-street'],
  ['chouchous-stand', 'harbor-decoy'],
  ['chouchous-stand', 'acrobat-rooftops'],
  ['beast-tamers-street', 'mayors-resolve'],
  ['harbor-decoy', 'mayors-resolve'],
  ['acrobat-rooftops', 'mayors-resolve'],
  ['mayors-resolve', 'buggys-big-top'],
  ['buggys-big-top', 'maps-and-promises'],
];

const mayorRecovery = [
  { type: 'restore', target: 'move-pp' } as const,
  { type: 'heal', target: 'crew', percent: 50 } as const,
  { type: 'checkpoint' } as const,
];

export const orangeTownChoices: Record<string, NodeChoice[]> = {
  'orange-town-harbor': [
    {
      id: 'ally-with-nami',
      label: 'Form a temporary alliance',
      detail: 'Add Nami as a controllable story guest and establish the Orange Town checkpoint.',
      consequences: [
        { type: 'guest', action: 'add', characterId: 'nami' },
        { type: 'checkpoint' },
      ],
      outcome: {
        title: 'The Cat Burglar joins the fight',
        detail: 'Nami becomes available as a guest, but the battle lineup remains your choice.',
        journalEntry: 'Luffy, Zoro, and Nami formed a temporary alliance against Buggy.',
      },
    },
  ],
  'chouchous-stand': [
    {
      id: 'defend-chouchous-shop',
      label: 'Defend the shop openly',
      detail: 'Face Mohji and Richie at full strength for 75 Berries and 1,200 base bounty, at the highest PP cost.',
      consequences: [{ type: 'route', branch: 'orange-officer-route', nodeId: 'beast-tamers-street' }],
      outcome: {
        title: 'Stand with Chouchou',
        detail: 'The crew meets Mohji\'s full raiding party in the street.',
        journalEntry: 'The crew chose to defend Chouchou\'s shop in open battle.',
      },
    },
    {
      id: 'set-harbor-decoy',
      label: 'Set Nami\'s harbor decoy',
      detail: 'Face a weakened Mohji and Richie for 110 Berries and 700 base bounty, but risk 8 hull damage from cannon fire.',
      consequences: [{ type: 'route', branch: 'orange-officer-route', nodeId: 'harbor-decoy' }],
      outcome: {
        title: 'The beast tamers take the bait',
        detail: 'Nami draws Mohji and Richie toward Buggy\'s stolen stores near the harbor.',
        journalEntry: 'Nami prepared a harbor decoy to split the beast-tamer raiding party.',
      },
    },
    {
      id: 'follow-nami-rooftops',
      label: 'Follow Nami over the rooftops',
      detail: 'Face Cabaji and two acrobats for 50 Berries and 900 base bounty; control effects can increase the PP cost.',
      consequences: [{ type: 'route', branch: 'orange-officer-route', nodeId: 'acrobat-rooftops' }],
      outcome: {
        title: 'Take the high route',
        detail: 'The crew leaves the street to Nami and finds Cabaji waiting above.',
        journalEntry: 'The crew followed Nami across Orange Town\'s rooftops.',
      },
    },
  ],
  'mayors-resolve': [
    {
      id: 'protect-orange-town-civilians',
      label: 'Protect the remaining civilians',
      detail: 'Restore all move PP, gain 900 bounty, and risk 8 hull damage while shielding the evacuation.',
      consequences: [
        { type: 'resource', resource: 'bounty', amount: 900 },
        { type: 'hull-damage', amount: 8, protectedByShipwright: true },
        ...mayorRecovery,
      ],
      outcome: {
        title: 'The civilians reach shelter',
        detail: 'The crew absorbs Buggy\'s pressure while Orange Town evacuates.',
        journalEntry: 'The crew protected Orange Town\'s civilians before confronting Buggy.',
      },
    },
    {
      id: 'rally-orange-town',
      label: 'Rally the townspeople',
      detail: 'Restore all move PP, gain 450 bounty, and repair 10 hull with the town\'s help.',
      consequences: [
        { type: 'resource', resource: 'bounty', amount: 450 },
        { type: 'hull-repair', amount: 10 },
        ...mayorRecovery,
      ],
      outcome: {
        title: 'Orange Town rallies',
        detail: 'Boodle\'s courage spreads and the townspeople help repair the crew\'s ship.',
        journalEntry: 'The crew rallied Orange Town behind Mayor Boodle.',
      },
    },
    {
      id: 'prioritize-buggy-supplies',
      label: 'Prioritize Buggy\'s supplies',
      detail: 'Restore all move PP and gain 100 Berries, but lose 300 bounty for ignoring the evacuation.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 100 },
        { type: 'resource', resource: 'bounty', amount: -300 },
        ...mayorRecovery,
      ],
      outcome: {
        title: 'Supplies secured first',
        detail: 'The crew is well stocked, though word spreads that the town came second.',
        journalEntry: 'The crew prioritized Buggy\'s supplies over Orange Town\'s evacuation.',
      },
    },
  ],
  'maps-and-promises': [
    {
      id: 'welcome-nami-aboard',
      label: 'Welcome Nami aboard',
      detail: 'Recruit Nami permanently, set the final checkpoint, and open the free Orange Town pack.',
      consequences: [
        { type: 'guest', action: 'remove', characterId: 'nami' },
        { type: 'recruit', characterId: 'nami', preferredRoles: ['navigator'] },
        { type: 'checkpoint' },
        {
          type: 'pack',
          packId: 'orange-town',
          resume: {
            phase: 'victory',
            activeArcId: 'orange-town',
            currentNodeId: 'maps-and-promises',
          },
        },
      ],
      outcome: {
        title: 'Orange Town complete',
        detail: 'Nami joins the permanent crew and the final arc pack is ready to open.',
        journalEntry: 'Nami joined the crew as its navigator after Buggy\'s defeat.',
      },
    },
  ],
};
