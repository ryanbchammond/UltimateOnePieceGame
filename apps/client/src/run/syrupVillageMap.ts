import type { NodeChoice, StoryArc, StoryNode } from './types';

export const syrupVillageArc: StoryArc = {
  id: 'syrup-village',
  name: 'Syrup Village',
  mapTitle: 'SYRUP VILLAGE · STORY ROUTE',
  mapInstruction: 'Believe Usopp, expose Klahadore, and stop the Black Cat Pirates.',
  start: {
    nodeId: 'syrup-village-shore',
    phase: 'map',
    berries: 0,
    hull: 100,
    maxHull: 100,
    rosterIds: ['luffy', 'zoro', 'nami'],
    guestIds: [],
    activePartyIds: ['luffy', 'zoro', 'nami'],
    roleAssignments: {
      captain: 'luffy',
      'fighter-1': 'zoro',
      'fighter-2': null,
      'fighter-3': null,
      doctor: null,
      navigator: 'nami',
      helmsman: null,
      cook: null,
      shipwright: null,
      pet: null,
    },
    journalEntry: 'The crew reached the quiet coast below Syrup Village.',
  },
  nodeIds: [
    'syrup-village-shore',
    'usopps-warning',
    'syrup-north-slope',
    'syrup-mansion-grounds',
    'night-before-the-raid',
    'kuros-black-cat-raid',
    'the-going-merry',
  ],
};

export const syrupVillageNodes: StoryNode[] = [
  {
    id: 'syrup-village-shore',
    arcId: 'syrup-village',
    name: 'Syrup Village Shore',
    subtitle: 'The great Captain Usopp appears',
    description:
      'A self-proclaimed pirate captain confronts the crew from the cliffs. Behind Usopp’s bluster is a fierce determination to protect his peaceful village and his friend Kaya.',
    type: 'start',
    services: ['crew-assignments'],
    x: 70,
    y: 270,
    prerequisites: [],
  },
  {
    id: 'usopps-warning',
    arcId: 'syrup-village',
    name: "Usopp's Warning",
    subtitle: 'A lie no one will believe',
    description:
      'Usopp overhears Kaya’s butler Klahadore reveal himself as Captain Kuro. With the Black Cat Pirates approaching before dawn, the crew must decide where to seek proof.',
    type: 'event',
    x: 220,
    y: 270,
    prerequisites: ['syrup-village-shore'],
  },
  {
    id: 'syrup-north-slope',
    arcId: 'syrup-village',
    name: 'North Slope Alarm',
    subtitle: 'Jango brings the raiders ashore',
    description:
      'The crew trusts Usopp and races to the coast. Jango and two Black Cat raiders are already climbing the wrong slope, giving the defenders a narrow chance to stop the landing.',
    type: 'battle',
    encounterId: 'syrup-north-slope',
    x: 405,
    y: 120,
    prerequisites: ['usopps-warning'],
    branch: 'syrup-investigation-route',
    victory: {
      title: 'The landing party breaks',
      detail: 'Jango’s first wave is driven from the slope before it can reach the village.',
      journalEntry: 'The crew believed Usopp and intercepted Jango on Syrup Village’s north slope.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 60 },
        { type: 'resource', resource: 'bounty', amount: 1000, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'syrup-mansion-grounds',
    arcId: 'syrup-village',
    name: 'Mansion Grounds',
    subtitle: 'The Meowban Brothers pounce',
    description:
      'Nami follows the money trail around Kaya’s estate and discovers Sham and Buchi searching for Kuro’s hidden orders. The evidence is valuable, but the brothers refuse to surrender it.',
    type: 'battle',
    encounterId: 'syrup-mansion-grounds',
    x: 405,
    y: 420,
    prerequisites: ['usopps-warning'],
    branch: 'syrup-investigation-route',
    victory: {
      title: 'Kuro’s orders recovered',
      detail: 'The Meowban Brothers retreat, leaving the raid orders and stolen funds behind.',
      journalEntry: 'The crew exposed Kuro’s plan by defeating Sham and Buchi outside Kaya’s mansion.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 90 },
        { type: 'resource', resource: 'bounty', amount: 700, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'night-before-the-raid',
    arcId: 'syrup-village',
    name: 'Night Before the Raid',
    subtitle: 'Dig in before dawn',
    description:
      'The routes reconverge above the village. Usopp’s young crew brings food and tools while Kaya’s household prepares for Kuro’s final attack.',
    type: 'rest',
    services: ['crew-assignments'],
    x: 590,
    y: 270,
    prerequisites: ['syrup-north-slope', 'syrup-mansion-grounds'],
    prerequisiteMode: 'any',
  },
  {
    id: 'kuros-black-cat-raid',
    arcId: 'syrup-village',
    name: "Kuro's Black Cat Raid",
    subtitle: 'Three years of deception end here',
    description:
      'Captain Kuro abandons the name Klahadore and attacks beside Jango, Sham, and Buchi. If the crew falls, Kaya and the entire village will be left defenseless.',
    type: 'boss',
    encounterId: 'black-cat-raid',
    x: 755,
    y: 150,
    prerequisites: ['night-before-the-raid'],
    victory: {
      title: 'Kuro’s perfect plan shattered',
      detail: 'The Black Cat Pirates are defeated and Syrup Village remains safe.',
      journalEntry: 'Luffy, Usopp, and the crew defeated Captain Kuro and the Black Cat Pirates.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 175 },
        { type: 'resource', resource: 'bounty', amount: 4000, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'the-going-merry',
    arcId: 'syrup-village',
    name: 'The Going Merry',
    subtitle: 'A brave warrior sets sail',
    description:
      'Kaya entrusts the crew with the Going Merry. Usopp leaves the village to chase his own dream and asks to sail as a true member of Luffy’s crew.',
    type: 'recruit',
    services: ['crew-assignments'],
    x: 880,
    y: 350,
    prerequisites: ['kuros-black-cat-raid'],
  },
];

export const syrupVillageConnections: Array<[string, string]> = [
  ['syrup-village-shore', 'usopps-warning'],
  ['usopps-warning', 'syrup-north-slope'],
  ['usopps-warning', 'syrup-mansion-grounds'],
  ['syrup-north-slope', 'night-before-the-raid'],
  ['syrup-mansion-grounds', 'night-before-the-raid'],
  ['night-before-the-raid', 'kuros-black-cat-raid'],
  ['kuros-black-cat-raid', 'the-going-merry'],
];

const villageRecovery = [
  { type: 'restore', target: 'move-pp' } as const,
  { type: 'heal', target: 'crew', percent: 50 } as const,
  { type: 'checkpoint' } as const,
];

export const syrupVillageChoices: Record<string, NodeChoice[]> = {
  'syrup-village-shore': [
    {
      id: 'hear-usopp-out',
      label: 'Hear Captain Usopp out',
      detail: 'Add Usopp as a controllable story guest and establish the Syrup Village checkpoint.',
      consequences: [
        { type: 'guest', action: 'add', characterId: 'usopp' },
        { type: 'checkpoint' },
      ],
      outcome: {
        title: 'A boastful guide joins the crew',
        detail: 'Usopp becomes available as a guest, but the battle lineup remains your choice.',
        journalEntry: 'The crew followed Usopp into Syrup Village and listened to his warning.',
      },
    },
  ],
  'usopps-warning': [
    {
      id: 'believe-usopp',
      label: 'Believe Usopp and guard the coast',
      detail: 'Intercept Jango and two raiders for 60 Berries and 1,000 base bounty.',
      consequences: [{
        type: 'route',
        branch: 'syrup-investigation-route',
        nodeId: 'syrup-north-slope',
      }],
      outcome: {
        title: 'Race for the north slope',
        detail: 'The crew treats Usopp’s warning as truth and moves to stop the landing party.',
        journalEntry: 'The crew believed Usopp and prepared to defend Syrup Village’s coast.',
      },
    },
    {
      id: 'follow-the-money',
      label: 'Follow Nami to the mansion',
      detail: 'Fight Sham and Buchi for 90 Berries and 700 base bounty while securing proof of Kuro’s plot.',
      consequences: [{
        type: 'route',
        branch: 'syrup-investigation-route',
        nodeId: 'syrup-mansion-grounds',
      }],
      outcome: {
        title: 'Search for proof',
        detail: 'Nami leads the crew toward Kaya’s estate and Kuro’s hidden preparations.',
        journalEntry: 'The crew followed Nami’s money trail toward Kaya’s mansion.',
      },
    },
  ],
  'night-before-the-raid': [
    {
      id: 'fortify-the-slope',
      label: 'Fortify the village slope',
      detail: 'Restore all move PP, heal the crew for 50%, gain 400 bounty, and risk 6 protected hull damage hauling barricades into place.',
      consequences: [
        { type: 'resource', resource: 'bounty', amount: 400 },
        { type: 'hull-damage', amount: 6, protectedByShipwright: true },
        ...villageRecovery,
      ],
      outcome: {
        title: 'The slope is barricaded',
        detail: 'Usopp’s improvised defenses buy the village time before Kuro attacks.',
        journalEntry: 'The crew fortified Syrup Village’s slope beside Usopp.',
      },
    },
    {
      id: 'guard-kayas-household',
      label: 'Guard Kaya’s household',
      detail: 'Restore all move PP, heal the crew for 50%, and receive 75 Berries in supplies.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 75 },
        ...villageRecovery,
      ],
      outcome: {
        title: 'Kaya’s household is secured',
        detail: 'Food and supplies are shared while the crew keeps watch through the night.',
        journalEntry: 'The crew guarded Kaya’s household and rested before Kuro’s raid.',
      },
    },
  ],
  'the-going-merry': [
    {
      id: 'welcome-usopp-aboard',
      label: 'Welcome Usopp aboard the Going Merry',
      detail: 'Recruit Usopp permanently, restore the new ship’s hull, and open the free Syrup Village pack.',
      consequences: [
        { type: 'guest', action: 'remove', characterId: 'usopp' },
        {
          type: 'recruit',
          characterId: 'usopp',
          preferredRoles: ['fighter-2', 'fighter-3', 'fighter-1'],
        },
        { type: 'restore', target: 'hull' },
        { type: 'checkpoint' },
        {
          type: 'pack',
          packId: 'syrup-village',
          resume: {
            phase: 'victory',
            activeArcId: 'syrup-village',
            currentNodeId: 'the-going-merry',
          },
        },
      ],
      outcome: {
        title: 'Syrup Village complete',
        detail: 'Usopp joins the permanent crew and the Going Merry is ready to sail.',
        journalEntry: 'Usopp joined the crew and Kaya gifted them the Going Merry.',
      },
    },
  ],
};
