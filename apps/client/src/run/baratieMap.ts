import type { NodeChoice, StoryArc, StoryNode } from './types';

export const baratieArc: StoryArc = {
  id: 'baratie',
  name: 'Baratie',
  mapTitle: 'BARATIE · STORY ROUTE',
  mapInstruction: 'Defend the floating restaurant, face Krieg’s armada, and ask Sanji to sail.',
  start: {
    nodeId: 'baratie-arrival',
    phase: 'map',
    berries: 0,
    hull: 100,
    maxHull: 100,
    rosterIds: ['luffy', 'zoro', 'nami', 'usopp'],
    guestIds: [],
    activePartyIds: ['luffy', 'zoro', 'nami', 'usopp'],
    roleAssignments: {
      captain: 'luffy',
      'fighter-1': 'zoro',
      'fighter-2': 'usopp',
      'fighter-3': null,
      doctor: null,
      navigator: 'nami',
      helmsman: null,
      cook: null,
      shipwright: null,
      pet: null,
    },
    journalEntry: 'The Going Merry reached the floating restaurant Baratie.',
  },
  nodeIds: [
    'baratie-arrival',
    'gin-at-the-table',
    'krieg-armada-appears',
    'protect-baratie-deck',
    'silence-krieg-cannons',
    'evacuate-the-cooks',
    'mihawks-challenge',
    'baratie-galley',
    'krieg-officers-attack',
    'krieg-last-stand',
    'all-blue-departure',
  ],
};

export const baratieNodes: StoryNode[] = [
  {
    id: 'baratie-arrival', arcId: 'baratie', name: 'Floating Restaurant Baratie',
    subtitle: 'A cannonball and an impossible debt',
    description: 'The Going Merry docks beside a restaurant shaped like a fish. One careless cannonball puts Luffy in Zeff’s debt just as a starving pirate collapses at the door.',
    type: 'start', services: ['crew-assignments', 'tavern'], x: 55, y: 270, prerequisites: [],
  },
  {
    id: 'gin-at-the-table', arcId: 'baratie', name: 'Gin at the Table',
    subtitle: 'Sanji feeds anyone who is hungry',
    description: 'Sanji serves Gin despite the cooks’ warnings. The pirate regains his strength, reveals Don Krieg’s fleet nearby, and leaves torn between loyalty and gratitude.',
    type: 'event', x: 165, y: 270, prerequisites: ['baratie-arrival'],
  },
  {
    id: 'krieg-armada-appears', arcId: 'baratie', name: 'Krieg Armada Appears',
    subtitle: 'Three thousand pirates want the restaurant',
    description: 'Don Krieg demands the Baratie as a replacement flagship. As cannon smoke closes around the dining ship, the crew must decide where its defense matters most.',
    type: 'event', x: 280, y: 270, prerequisites: ['gin-at-the-table'],
  },
  {
    id: 'protect-baratie-deck', arcId: 'baratie', name: 'Protect the Main Deck',
    subtitle: 'Pearl leads the boarding wave',
    description: 'The crew meets Pearl and Krieg’s armored boarders in the open, keeping the fighting away from Zeff’s cooks and customers.',
    type: 'battle', encounterId: 'baratie-deck-brawl', branch: 'baratie-defense-route',
    x: 425, y: 110, prerequisites: ['krieg-armada-appears'],
    victory: {
      title: 'Boarders thrown back', detail: 'Pearl’s assault breaks against the Baratie’s main deck.',
      journalEntry: 'The crew openly defended Baratie’s main deck from Pearl and Krieg’s boarders.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 90 },
        { type: 'resource', resource: 'bounty', amount: 1500, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'silence-krieg-cannons', arcId: 'baratie', name: 'Silence the Cannon Line',
    subtitle: 'Usopp takes the dangerous shot',
    description: 'A small team crosses the wreckage to destroy Krieg’s gun deck. The approach is exposed, but success will spare the Going Merry and the restaurant.',
    type: 'battle', encounterId: 'baratie-cannon-line', branch: 'baratie-defense-route',
    x: 425, y: 270, prerequisites: ['krieg-armada-appears'],
    victory: {
      title: 'Krieg’s guns fall quiet', detail: 'The cannon crews scatter and valuable powder stores are seized.',
      journalEntry: 'The crew crossed the wreckage and silenced Krieg’s cannon line.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 125 },
        { type: 'resource', resource: 'bounty', amount: 900, captainBountyBonus: true },
        { type: 'hull-damage', amount: 6, protectedByShipwright: true },
      ],
    },
  },
  {
    id: 'evacuate-the-cooks', arcId: 'baratie', name: 'Evacuate the Cooks',
    subtitle: 'Save lives while Krieg takes ground',
    description: 'Nami charts a route through the lower decks while Sanji carries wounded cooks to safety. The restaurant survives, though Krieg’s vanguard claims the upper deck.',
    type: 'event', branch: 'baratie-defense-route', x: 425, y: 420,
    prerequisites: ['krieg-armada-appears'],
  },
  {
    id: 'mihawks-challenge', arcId: 'baratie', name: "Mihawk's Challenge",
    subtitle: 'Zoro faces the world’s strongest swordsman',
    description: 'Dracule Mihawk cuts through Krieg’s fleet and accepts Zoro’s challenge. Defeat leaves Zoro wounded, but his vow to Luffy becomes stronger than ever.',
    type: 'event', services: ['crew-assignments'], x: 555, y: 270,
    prerequisites: ['protect-baratie-deck', 'silence-krieg-cannons', 'evacuate-the-cooks'], prerequisiteMode: 'any',
  },
  {
    id: 'baratie-galley', arcId: 'baratie', name: 'Baratie Galley',
    subtitle: 'One meal before the final assault',
    description: 'Zeff opens the galley stores while the cooks barricade the dining room. There is just enough time to recover and choose how to prepare for Krieg’s officers.',
    type: 'rest', services: ['crew-assignments', 'tavern'], x: 650, y: 270,
    prerequisites: ['mihawks-challenge'],
  },
  {
    id: 'krieg-officers-attack', arcId: 'baratie', name: "Krieg's Officers Attack",
    subtitle: 'Gin and Pearl make their choice',
    description: 'Pearl shields Gin’s advance while Krieg orders both men to destroy the restaurant. Sanji must confront the starving pirate he chose to save.',
    type: 'battle', encounterId: 'krieg-officers', x: 750, y: 110,
    prerequisites: ['baratie-galley'],
    victory: {
      title: 'The officers yield', detail: 'Pearl falls and Gin refuses to repay Sanji’s mercy with murder.',
      journalEntry: 'Sanji and the crew defeated Krieg’s officers, and Gin finally defied his captain.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 130 },
        { type: 'resource', resource: 'bounty', amount: 1800, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'krieg-last-stand', arcId: 'baratie', name: "Don Krieg's Last Stand",
    subtitle: 'Poison gas, steel armor, and a spear of fire',
    description: 'Don Krieg unleashes every hidden weapon in his armor. The Baratie cannot survive another barrage, so Luffy takes the fight straight through the wrecked deck.',
    type: 'boss', encounterId: 'krieg-last-stand', x: 835, y: 270,
    prerequisites: ['krieg-officers-attack'],
    victory: {
      title: 'The East Blue armada sinks', detail: 'Krieg is defeated and the Baratie remains free.',
      journalEntry: 'Luffy shattered Don Krieg’s armor and ended the assault on Baratie.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 225 },
        { type: 'resource', resource: 'bounty', amount: 6000, captainBountyBonus: true },
      ],
    },
  },
  {
    id: 'all-blue-departure', arcId: 'baratie', name: 'Toward the All Blue',
    subtitle: 'Sanji says farewell to Zeff',
    description: 'The cooks drive Sanji from the only home he has known with insults that cannot hide their tears. He bows to Zeff, then steps aboard to pursue the All Blue.',
    type: 'recruit', services: ['crew-assignments'], x: 880, y: 410,
    prerequisites: ['krieg-last-stand'],
  },
];

export const baratieConnections: Array<[string, string]> = [
  ['baratie-arrival', 'gin-at-the-table'],
  ['gin-at-the-table', 'krieg-armada-appears'],
  ['krieg-armada-appears', 'protect-baratie-deck'],
  ['krieg-armada-appears', 'silence-krieg-cannons'],
  ['krieg-armada-appears', 'evacuate-the-cooks'],
  ['protect-baratie-deck', 'mihawks-challenge'],
  ['silence-krieg-cannons', 'mihawks-challenge'],
  ['evacuate-the-cooks', 'mihawks-challenge'],
  ['mihawks-challenge', 'baratie-galley'],
  ['baratie-galley', 'krieg-officers-attack'],
  ['krieg-officers-attack', 'krieg-last-stand'],
  ['krieg-last-stand', 'all-blue-departure'],
];

const galleyRecovery = [
  { type: 'restore', target: 'move-pp' } as const,
  { type: 'heal', target: 'crew', percent: 50 } as const,
  { type: 'checkpoint' } as const,
];

export const baratieChoices: Record<string, NodeChoice[]> = {
  'baratie-arrival': [{
    id: 'work-off-the-debt', label: 'Work off the damage',
    detail: 'Repair 15 hull at Baratie’s dock, establish a checkpoint, and gain access to its card counter.',
    consequences: [{ type: 'hull-repair', amount: 15 }, { type: 'checkpoint' }],
    outcome: { title: 'Temporary chore boy', detail: 'Luffy joins the kitchen crew while the Going Merry is repaired.', journalEntry: 'Luffy agreed to work at Baratie after damaging the restaurant.' },
  }],
  'gin-at-the-table': [{
    id: 'share-sanjis-meal', label: 'Stand by Sanji’s kindness',
    detail: 'Add Sanji as a controllable story guest and gain 250 bounty when Gin carries word of the crew back to Krieg.',
    consequences: [{ type: 'guest', action: 'add', characterId: 'sanji' }, { type: 'resource', resource: 'bounty', amount: 250 }],
    outcome: { title: 'No one starves here', detail: 'Sanji joins the defense as a guest when Krieg’s fleet appears.', journalEntry: 'The crew stood with Sanji when he fed the starving Gin.' },
  }],
  'krieg-armada-appears': [
    {
      id: 'hold-the-main-deck', label: 'Hold the main deck', detail: 'Fight Pearl and two boarders for the greatest bounty reward.',
      consequences: [{ type: 'route', branch: 'baratie-defense-route', nodeId: 'protect-baratie-deck' }],
      outcome: { title: 'Meet the boarders head-on', detail: 'The crew forms a line between Krieg’s pirates and the dining room.', journalEntry: 'The crew chose to defend Baratie’s main deck in open battle.' },
    },
    {
      id: 'raid-the-cannon-line', label: 'Raid the cannon line', detail: 'Fight a smaller gun crew for more Berries, but risk 6 protected hull damage.',
      consequences: [{ type: 'route', branch: 'baratie-defense-route', nodeId: 'silence-krieg-cannons' }],
      outcome: { title: 'Cross the wreckage', detail: 'Usopp guides the crew toward the armada’s exposed powder stores.', journalEntry: 'The crew launched a raid against Krieg’s cannon line.' },
    },
    {
      id: 'save-baraties-cooks', label: 'Evacuate the wounded cooks', detail: 'Avoid a battle, heal the active party by 25%, and gain 600 bounty for protecting the restaurant.',
      consequences: [{ type: 'route', branch: 'baratie-defense-route', nodeId: 'evacuate-the-cooks' }],
      outcome: { title: 'Clear the lower decks', detail: 'Nami and Sanji lead the evacuation while Krieg takes ground above.', journalEntry: 'The crew prioritized Baratie’s wounded cooks over holding the deck.' },
    },
  ],
  'evacuate-the-cooks': [{
    id: 'carry-everyone-clear', label: 'Carry everyone clear', detail: 'Heal the active party by 25% and earn 600 bounty.',
    consequences: [{ type: 'heal', target: 'active-party', percent: 25 }, { type: 'resource', resource: 'bounty', amount: 600 }],
    outcome: { title: 'Every cook accounted for', detail: 'The wounded reach safety before the upper deck falls.', journalEntry: 'Sanji and the crew evacuated every wounded Baratie cook.' },
  }],
  'mihawks-challenge': [{
    id: 'honor-zoros-vow', label: 'Honor Zoro’s vow', detail: 'Restore Zoro and the active party by 25% after the duel and gain 750 bounty.',
    consequences: [{ type: 'heal', target: 'active-party', percent: 25 }, { type: 'resource', resource: 'bounty', amount: 750 }],
    outcome: { title: 'Never lose again', detail: 'Zoro survives Mihawk’s blade and renews his promise to Luffy.', journalEntry: 'The crew witnessed Zoro’s vow after his defeat by Dracule Mihawk.' },
  }],
  'baratie-galley': [
    {
      id: 'cook-a-victory-feast', label: 'Cook with Sanji', detail: 'Restore move PP, heal the crew by 50%, gain 60 Berries in provisions, and set a checkpoint.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 60 }, ...galleyRecovery],
      outcome: { title: 'A meal worth defending', detail: 'Sanji turns the remaining stores into strength for the final assault.', journalEntry: 'The crew recovered over a Baratie feast before facing Krieg.' },
    },
    {
      id: 'reinforce-the-fin', label: 'Reinforce the restaurant fin', detail: 'Restore move PP, heal the crew by 50%, repair 12 hull, and set a checkpoint.',
      consequences: [{ type: 'hull-repair', amount: 12 }, ...galleyRecovery],
      outcome: { title: 'The fighting fin holds', detail: 'Cooks and pirates brace the Baratie for one last impact.', journalEntry: 'The crew reinforced Baratie’s fighting fin before Krieg’s final attack.' },
    },
  ],
  'all-blue-departure': [{
    id: 'welcome-sanji-aboard', label: 'Welcome Sanji aboard',
    detail: 'Recruit Sanji permanently as the crew’s Cook and open the free Baratie pack before sailing to Cocoyasi Village.',
    consequences: [
      { type: 'guest', action: 'remove', characterId: 'sanji' },
      { type: 'recruit', characterId: 'sanji', preferredRoles: ['cook'] },
      { type: 'checkpoint' },
      { type: 'pack', packId: 'baratie', resume: { phase: 'map', activeArcId: 'arlong-park', currentNodeId: 'cocoyasi-shore' } },
    ],
    outcome: { title: 'Baratie complete', detail: 'Sanji joins the crew and the Going Merry turns toward Nami’s home.', journalEntry: 'Sanji joined the crew and set sail from Baratie in search of the All Blue.' },
  }],
};
