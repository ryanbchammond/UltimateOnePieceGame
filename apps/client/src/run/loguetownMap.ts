import type { NodeChoice, StoryArc, StoryNode } from './types';

export const loguetownArc: StoryArc = {
  id: 'loguetown',
  name: 'Loguetown',
  mapTitle: 'LOGUETOWN · STORY ROUTE',
  mapInstruction: 'Prepare for the Grand Line and escape the Marines at the town of beginnings and ends.',
  start: {
    nodeId: 'loguetown-harbor', phase: 'map', berries: 0, hull: 100, maxHull: 100,
    rosterIds: ['luffy', 'zoro', 'nami', 'usopp', 'sanji'], guestIds: [],
    activePartyIds: ['luffy', 'zoro', 'nami', 'sanji'],
    roleAssignments: {
      captain: 'luffy', 'fighter-1': 'zoro', 'fighter-2': 'usopp', 'fighter-3': null,
      doctor: null, navigator: 'nami', helmsman: null, cook: 'sanji', shipwright: null, pet: null,
    },
    journalEntry: 'The Going Merry entered Loguetown, the last port before the Grand Line.',
  },
  nodeIds: [
    'loguetown-harbor', 'town-of-beginnings-and-ends', 'ipponmatsu-sword-shop',
    'execution-plaza-ambush', 'smokers-marine-cordon', 'gold-rogers-platform',
    'storm-over-loguetown', 'smoker-pursuit', 'reverse-mountain-bound',
  ],
};

export const loguetownNodes: StoryNode[] = [
  {
    id: 'loguetown-harbor', arcId: 'loguetown', name: 'Loguetown Harbor',
    subtitle: 'The last stop before the Grand Line',
    description: 'The crew ties up beneath gathering storm clouds. Supplies, better swords, and Gol D. Roger’s execution platform all lie beyond a Marine checkpoint.',
    type: 'start', services: ['crew-assignments', 'tavern'], x: 65, y: 270, prerequisites: [],
  },
  {
    id: 'town-of-beginnings-and-ends', arcId: 'loguetown', name: 'Town of Beginnings and Ends',
    subtitle: 'One afternoon before the storm',
    description: 'Smoker locks down the streets as old enemies enter the city. The crew must choose between arming Zoro, protecting Luffy at the plaza, or clearing a path back to the harbor.',
    type: 'event', x: 210, y: 270, prerequisites: ['loguetown-harbor'],
  },
  {
    id: 'ipponmatsu-sword-shop', arcId: 'loguetown', name: "Ipponmatsu's Sword Shop",
    subtitle: 'Zoro tests his luck against a cursed blade',
    description: 'Zoro stakes his arm against Sandai Kitetsu’s curse. The shaken shopkeeper entrusts him with the blade and Yubashiri as Marine patrols close on the market.',
    type: 'event', branch: 'loguetown-route', x: 405, y: 110,
    prerequisites: ['town-of-beginnings-and-ends'],
  },
  {
    id: 'execution-plaza-ambush', arcId: 'loguetown', name: 'Execution Plaza Ambush',
    subtitle: 'Buggy and Alvida settle old scores',
    description: 'Buggy’s crew traps Luffy on Roger’s execution platform while Alvida seals the square. The Straw Hats must break the ambush before the Marines arrive.',
    type: 'battle', encounterId: 'loguetown-execution-plaza', branch: 'loguetown-route',
    x: 405, y: 270, prerequisites: ['town-of-beginnings-and-ends'],
    victory: {
      title: 'The execution fails', detail: 'Lightning splits the platform and the pirate alliance loses control of the square.',
      journalEntry: 'The crew broke Buggy and Alvida’s ambush at Roger’s execution plaza.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 140 }, { type: 'resource', resource: 'bounty', amount: 3000, captainBountyBonus: true }],
    },
  },
  {
    id: 'smokers-marine-cordon', arcId: 'loguetown', name: "Smoker's Marine Cordon",
    subtitle: 'Tashigi guards the road to the harbor',
    description: 'Nami identifies the Marines’ supply lane. Cutting through Tashigi’s patrol opens the escape route but puts the entire crew on Smoker’s list.',
    type: 'battle', encounterId: 'loguetown-marine-cordon', branch: 'loguetown-route',
    x: 405, y: 420, prerequisites: ['town-of-beginnings-and-ends'],
    victory: {
      title: 'The harbor road opens', detail: 'The cordon breaks and the Going Merry’s escape route is secured.',
      journalEntry: 'The crew defeated Tashigi’s cordon and opened a road through Loguetown.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 90 }, { type: 'resource', resource: 'bounty', amount: 2400, captainBountyBonus: true }, { type: 'hull-repair', amount: 10 }],
    },
  },
  {
    id: 'gold-rogers-platform', arcId: 'loguetown', name: "Gol D. Roger's Platform",
    subtitle: 'The Pirate King saw the same horizon',
    description: 'The routes meet beneath the scaffold where the Great Pirate Era began. Luffy climbs the steps as rain starts falling and every pursuing force converges.',
    type: 'event', services: ['crew-assignments'], x: 585, y: 270,
    prerequisites: ['ipponmatsu-sword-shop', 'execution-plaza-ambush', 'smokers-marine-cordon'], prerequisiteMode: 'any',
  },
  {
    id: 'storm-over-loguetown', arcId: 'loguetown', name: 'Storm over Loguetown',
    subtitle: 'Lightning, wind, and one route to sea',
    description: 'A violent squall scatters pirates and Marines alike. The crew regroups under cover long enough to restore its strength and prepare the Going Merry.',
    type: 'rest', services: ['crew-assignments'], x: 700, y: 270, prerequisites: ['gold-rogers-platform'],
  },
  {
    id: 'smoker-pursuit', arcId: 'loguetown', name: "Smoker's Pursuit",
    subtitle: 'Break through the White Hunter',
    description: 'Smoker, Tashigi, and the harbor guard trap the Straw Hats between the city and the sea. The goal is not conquest—it is reaching the Going Merry before the storm closes the port.',
    type: 'boss', encounterId: 'smoker-pursuit', x: 810, y: 135, prerequisites: ['storm-over-loguetown'],
    victory: {
      title: 'The Straw Hats escape', detail: 'The crew breaks through the Marines and reaches the Going Merry as the wind turns toward Reverse Mountain.',
      journalEntry: 'The crew escaped Smoker’s pursuit and sailed out of Loguetown together.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 200 }, { type: 'resource', resource: 'bounty', amount: 7500, captainBountyBonus: true }],
    },
  },
  {
    id: 'reverse-mountain-bound', arcId: 'loguetown', name: 'Reverse Mountain Bound',
    subtitle: 'Five dreams point toward the Grand Line',
    description: 'Beyond Loguetown, each Straw Hat places a foot on a barrel and names a dream. The East Blue falls behind as the Going Merry turns toward Reverse Mountain.',
    type: 'event', services: ['crew-assignments'], x: 880, y: 400, prerequisites: ['smoker-pursuit'],
  },
];

export const loguetownConnections: Array<[string, string]> = [
  ['loguetown-harbor', 'town-of-beginnings-and-ends'],
  ['town-of-beginnings-and-ends', 'ipponmatsu-sword-shop'],
  ['town-of-beginnings-and-ends', 'execution-plaza-ambush'],
  ['town-of-beginnings-and-ends', 'smokers-marine-cordon'],
  ['ipponmatsu-sword-shop', 'gold-rogers-platform'],
  ['execution-plaza-ambush', 'gold-rogers-platform'],
  ['smokers-marine-cordon', 'gold-rogers-platform'],
  ['gold-rogers-platform', 'storm-over-loguetown'],
  ['storm-over-loguetown', 'smoker-pursuit'],
  ['smoker-pursuit', 'reverse-mountain-bound'],
];

const stormRecovery = [
  { type: 'restore', target: 'move-pp' } as const,
  { type: 'heal', target: 'crew', percent: 50 } as const,
  { type: 'checkpoint' } as const,
];

export const loguetownChoices: Record<string, NodeChoice[]> = {
  'loguetown-harbor': [{
    id: 'prepare-for-the-grand-line', label: 'Prepare for the Grand Line', detail: 'Spend 40 Berries on supplies, repair 15 hull, and establish the harbor checkpoint.',
    requirements: [{ type: 'berries', amount: 40 }],
    consequences: [{ type: 'resource', resource: 'berries', amount: -40 }, { type: 'hull-repair', amount: 15 }, { type: 'checkpoint' }],
    outcome: { title: 'Supplies stowed', detail: 'The Going Merry is ready for Reverse Mountain if the crew can escape the city.', journalEntry: 'The crew provisioned the Going Merry for the Grand Line at Loguetown.' },
  }],
  'town-of-beginnings-and-ends': [
    {
      id: 'find-zoro-new-swords', label: 'Find Zoro new swords', detail: 'Avoid a battle, gain 500 bounty, and trust Zoro’s luck at the sword shop.',
      consequences: [{ type: 'route', branch: 'loguetown-route', nodeId: 'ipponmatsu-sword-shop' }],
      outcome: { title: 'Search the arms market', detail: 'Zoro enters Loguetown’s sword quarter while the others gather supplies.', journalEntry: 'The crew prioritized finding new swords for Zoro.' },
    },
    {
      id: 'follow-luffy-to-the-platform', label: 'Follow Luffy to the platform', detail: 'Fight Buggy and Alvida for the highest bounty reward.',
      consequences: [{ type: 'route', branch: 'loguetown-route', nodeId: 'execution-plaza-ambush' }],
      outcome: { title: 'Visit Roger’s last view', detail: 'The crew follows Luffy toward the execution square—and an old enemy’s trap.', journalEntry: 'The crew followed Luffy toward Gol D. Roger’s execution platform.' },
    },
    {
      id: 'secure-the-harbor-road', label: 'Secure the harbor road', detail: 'Fight Tashigi’s Marine patrol and repair 10 hull after opening the escape route.',
      consequences: [{ type: 'route', branch: 'loguetown-route', nodeId: 'smokers-marine-cordon' }],
      outcome: { title: 'Protect the way out', detail: 'Nami leads a strike against the cordon between the market and the Going Merry.', journalEntry: 'The crew moved to secure its escape route through Loguetown.' },
    },
  ],
  'ipponmatsu-sword-shop': [{
    id: 'test-zoros-luck', label: 'Trust Zoro’s luck', detail: 'Gain 500 bounty when word of the cursed-blade wager spreads through town.',
    consequences: [{ type: 'resource', resource: 'bounty', amount: 500 }],
    outcome: { title: 'The curse misses', detail: 'Zoro leaves with Sandai Kitetsu and Yubashiri at his side.', journalEntry: 'Zoro won Sandai Kitetsu’s respect and received Yubashiri in Loguetown.' },
  }],
  'gold-rogers-platform': [{
    id: 'declare-the-grand-line-dream', label: 'Climb the execution platform', detail: 'Gain 1,000 bounty by declaring the same dream that began the Great Pirate Era.',
    consequences: [{ type: 'resource', resource: 'bounty', amount: 1000 }],
    outcome: { title: 'The same fearless smile', detail: 'Luffy sees the Grand Line from the place where Roger faced death.', journalEntry: 'Luffy stood on Gol D. Roger’s execution platform and declared his dream.' },
  }],
  'storm-over-loguetown': [
    {
      id: 'shelter-at-the-tavern', label: 'Shelter at the tavern', detail: 'Restore move PP, heal the crew by 50%, gain 65 Berries, and set a checkpoint.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 65 }, ...stormRecovery],
      outcome: { title: 'One last East Blue meal', detail: 'Sanji feeds the crew while thunder drowns out the pursuing Marines.', journalEntry: 'The crew sheltered from the Loguetown storm and shared a final East Blue meal.' },
    },
    {
      id: 'ready-the-going-merry', label: 'Ready the Going Merry', detail: 'Restore move PP, heal the crew by 50%, repair 20 hull, and set a checkpoint.',
      consequences: [{ type: 'hull-repair', amount: 20 }, ...stormRecovery],
      outcome: { title: 'Canvas raised in the rain', detail: 'Nami prepares the ship to catch the impossible tailwind.', journalEntry: 'The crew prepared the Going Merry to escape Loguetown’s storm.' },
    },
  ],
  'reverse-mountain-bound': [{
    id: 'make-the-barrel-vow', label: 'Make the barrel vow', detail: 'Open the rarer East Blue Saga pack, containing cards from every completed arc, and finish with all five Straw Hats aboard.',
    consequences: [
      { type: 'restore', target: 'hull' }, { type: 'checkpoint' },
      { type: 'pack', packId: 'east-blue-saga', resume: { phase: 'victory', activeArcId: 'loguetown', currentNodeId: 'reverse-mountain-bound' } },
    ],
    outcome: { title: 'East Blue Saga complete', detail: 'Five dreams and one ship are bound for the Grand Line.', journalEntry: 'The Straw Hats made their barrel vow and set course for Reverse Mountain.' },
  }],
};
