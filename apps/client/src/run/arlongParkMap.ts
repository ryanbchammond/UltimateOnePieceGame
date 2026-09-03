import type { NodeChoice, StoryArc, StoryNode } from './types';

export const arlongParkArc: StoryArc = {
  id: 'arlong-park',
  name: 'Arlong Park',
  mapTitle: 'ARLONG PARK · STORY ROUTE',
  mapInstruction: 'Uncover Nami’s past, rally Cocoyasi, and break Arlong’s rule.',
  start: {
    nodeId: 'cocoyasi-shore', phase: 'map', berries: 0, hull: 100, maxHull: 100,
    rosterIds: ['luffy', 'zoro', 'nami', 'usopp', 'sanji'], guestIds: [],
    activePartyIds: ['luffy', 'zoro', 'usopp', 'sanji'],
    roleAssignments: {
      captain: 'luffy', 'fighter-1': 'zoro', 'fighter-2': 'usopp', 'fighter-3': null,
      doctor: null, navigator: 'nami', helmsman: null, cook: 'sanji', shipwright: null, pet: null,
    },
    journalEntry: 'The crew followed Nami to the occupied shores of Cocoyasi Village.',
  },
  nodeIds: [
    'cocoyasi-shore', 'cocoyasi-under-arlong', 'break-the-fishman-patrol',
    'expose-nezumis-cover-up', 'bellemere-orange-grove', 'namis-map-room',
    'nami-asks-for-help', 'bellemere-grave', 'walk-to-arlong-park',
    'break-arlongs-front-gate', 'free-gosa-village', 'cross-the-sea-wall',
    'arlong-park-courtyard', 'arlong-park-raid', 'cocoyasi-dawn',
  ],
};

export const arlongParkNodes: StoryNode[] = [
  {
    id: 'cocoyasi-shore', arcId: 'arlong-park', name: 'Cocoyasi Shore',
    subtitle: 'Nami disappears beyond the orange groves',
    description: 'The Going Merry reaches Nami’s home island, but she leaves before anyone can question her. Johnny and Yosaku warn that Arlong’s fish-men own every village on the coast.',
    type: 'start', services: ['crew-assignments'], x: 45, y: 270, prerequisites: [],
  },
  {
    id: 'cocoyasi-under-arlong', arcId: 'arlong-park', name: 'Cocoyasi Under Arlong',
    subtitle: 'Eight years of tribute and fear',
    description: 'Nojiko explains that every life on the island has a price. The crew can strike at a patrol, follow the corrupt Marines taking Arlong’s payment, or investigate Nami’s orange grove.',
    type: 'event', x: 150, y: 270, prerequisites: ['cocoyasi-shore'],
  },
  {
    id: 'break-the-fishman-patrol', arcId: 'arlong-park', name: 'Break the Fish-Man Patrol',
    subtitle: 'Hatchan guards the village road',
    description: 'Hatchan and two fish-man raiders collect Arlong’s tribute in broad daylight. An open attack will inspire the village and alert the entire park.',
    type: 'battle', encounterId: 'arlong-coast-patrol', branch: 'cocoyasi-investigation-route',
    x: 285, y: 110, prerequisites: ['cocoyasi-under-arlong'],
    victory: {
      title: 'The tribute patrol breaks', detail: 'Cocoyasi sees Arlong’s officers driven from its road.',
      journalEntry: 'The crew defeated Hatchan’s tribute patrol outside Cocoyasi Village.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 100 }, { type: 'resource', resource: 'bounty', amount: 1800, captainBountyBonus: true }],
    },
  },
  {
    id: 'expose-nezumis-cover-up', arcId: 'arlong-park', name: "Expose Nezumi's Cover-Up",
    subtitle: 'Marine uniforms hide pirate money',
    description: 'Nezumi’s squad carries confiscated treasure toward a waiting Marine ship. Stopping them recovers evidence of the deal between Arlong and the law.',
    type: 'battle', encounterId: 'nezumi-cover-up', branch: 'cocoyasi-investigation-route',
    x: 285, y: 270, prerequisites: ['cocoyasi-under-arlong'],
    victory: {
      title: 'The bribe ledger recovered', detail: 'Nezumi flees without the proof or Nami’s stolen savings.',
      journalEntry: 'The crew exposed Nezumi’s arrangement with Arlong and recovered his bribe ledger.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 150 }, { type: 'resource', resource: 'bounty', amount: 1200, captainBountyBonus: true }],
    },
  },
  {
    id: 'bellemere-orange-grove', arcId: 'arlong-park', name: "Bell-mère's Orange Grove",
    subtitle: 'A home preserved through occupation',
    description: 'Nojiko leads the crew through Nami’s carefully tended trees and reveals the truth behind her bargain with Arlong.',
    type: 'event', branch: 'cocoyasi-investigation-route', x: 285, y: 430,
    prerequisites: ['cocoyasi-under-arlong'],
  },
  {
    id: 'namis-map-room', arcId: 'arlong-park', name: "Nami's Map Room",
    subtitle: 'The prison behind the promise',
    description: 'Every route reveals another piece of the same truth: Arlong forced Nami to chart the seas while promising she could someday buy the village back.',
    type: 'event', x: 410, y: 270,
    prerequisites: ['break-the-fishman-patrol', 'expose-nezumis-cover-up', 'bellemere-orange-grove'], prerequisiteMode: 'any',
  },
  {
    id: 'nami-asks-for-help', arcId: 'arlong-park', name: 'Nami Asks for Help',
    subtitle: 'The crew was waiting all along',
    description: 'Nezumi steals Nami’s savings on Arlong’s orders and the village marches toward certain death. At last, Nami turns to Luffy and asks for help.',
    type: 'event', services: ['crew-assignments'], x: 505, y: 100, prerequisites: ['namis-map-room'],
  },
  {
    id: 'bellemere-grave', arcId: 'arlong-park', name: "Bell-mère's Grave",
    subtitle: 'Rest before the march',
    description: 'Nojiko and Genzo gather food, bandages, and the village’s courage beneath the orange trees. The crew has one quiet moment before attacking Arlong Park.',
    type: 'rest', services: ['crew-assignments'], x: 505, y: 400, prerequisites: ['nami-asks-for-help'],
  },
  {
    id: 'walk-to-arlong-park', arcId: 'arlong-park', name: 'Walk to Arlong Park',
    subtitle: 'Five pirates against an empire',
    description: 'The crew advances together. They can smash through the front gate, liberate Gosa Village to split Arlong’s force, or approach across the exposed sea wall.',
    type: 'event', x: 610, y: 270, prerequisites: ['bellemere-grave'],
  },
  {
    id: 'break-arlongs-front-gate', arcId: 'arlong-park', name: "Break Arlong's Front Gate",
    subtitle: 'Kuroobi holds the direct route',
    description: 'The crew tears down Arlong’s symbol of power and meets Kuroobi with a full fish-man guard in the shattered gateway.',
    type: 'battle', encounterId: 'arlong-front-gate', branch: 'arlong-assault-route',
    x: 715, y: 110, prerequisites: ['walk-to-arlong-park'],
    victory: {
      title: 'The gate comes down', detail: 'Cocoyasi hears the crash as Arlong’s front line collapses.',
      journalEntry: 'The crew smashed through Arlong Park’s front gate and defeated Kuroobi’s guard.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 120 }, { type: 'resource', resource: 'bounty', amount: 2400, captainBountyBonus: true }],
    },
  },
  {
    id: 'free-gosa-village', arcId: 'arlong-park', name: 'Free Gosa Village',
    subtitle: 'Chew silences the ruined streets',
    description: 'Usopp draws Chew and his shooters away from the park by raising rebellion in Gosa’s ruins. Victory will bring more villagers into the fight.',
    type: 'battle', encounterId: 'gosa-road', branch: 'arlong-assault-route',
    x: 715, y: 270, prerequisites: ['walk-to-arlong-park'],
    victory: {
      title: 'Gosa rises again', detail: 'Chew’s shooters are scattered and the survivors join Cocoyasi’s march.',
      journalEntry: 'Usopp and the crew defeated Chew in Gosa Village and rallied its survivors.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 80 }, { type: 'resource', resource: 'bounty', amount: 2100, captainBountyBonus: true }, { type: 'hull-repair', amount: 8 }],
    },
  },
  {
    id: 'cross-the-sea-wall', arcId: 'arlong-park', name: 'Cross the Sea Wall',
    subtitle: 'Hatchan commands the flooded approach',
    description: 'Nami guides the crew across a reef beneath Arlong’s guns. The route avoids the army outside but leaves the Going Merry exposed to the tide.',
    type: 'battle', encounterId: 'arlong-sea-wall', branch: 'arlong-assault-route',
    x: 715, y: 430, prerequisites: ['walk-to-arlong-park'],
    victory: {
      title: 'The sea wall is breached', detail: 'Hatchan’s defenders fall and the crew enters beside the map tower.',
      journalEntry: 'The crew crossed the reef and breached Arlong Park’s sea wall.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 160 }, { type: 'resource', resource: 'bounty', amount: 1600, captainBountyBonus: true }, { type: 'hull-damage', amount: 8, protectedByShipwright: true }],
    },
  },
  {
    id: 'arlong-park-courtyard', arcId: 'arlong-park', name: 'Arlong Park Courtyard',
    subtitle: 'The officers regroup beneath the map tower',
    description: 'The assault routes meet inside the walls. Cocoyasi’s people hold the exits while the crew catches its breath beneath the room where Nami spent eight years drawing maps.',
    type: 'rest', services: ['crew-assignments'], x: 805, y: 270,
    prerequisites: ['break-arlongs-front-gate', 'free-gosa-village', 'cross-the-sea-wall'], prerequisiteMode: 'any',
  },
  {
    id: 'arlong-park-raid', arcId: 'arlong-park', name: 'Arlong Park Raid',
    subtitle: 'Destroy the room that imprisoned Nami',
    description: 'Arlong, Kuroobi, Hatchan, and Chew make their final stand. Luffy must break both the fish-man officers and the map room above them.',
    type: 'boss', encounterId: 'arlong-park-raid', x: 880, y: 110,
    prerequisites: ['arlong-park-courtyard'],
    victory: {
      title: 'Arlong Park falls', detail: 'The map tower collapses and eight years of occupation end.',
      journalEntry: 'Luffy defeated Arlong and destroyed the map room that had imprisoned Nami.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 300 }, { type: 'resource', resource: 'bounty', amount: 10_000, captainBountyBonus: true }],
    },
  },
  {
    id: 'cocoyasi-dawn', arcId: 'arlong-park', name: 'Cocoyasi at Dawn',
    subtitle: 'Nami chooses her own course',
    description: 'The villages celebrate beneath a free sky. Nami leaves her old charts behind, tattoos a new pinwheel and orange over the scar, and returns to the Going Merry.',
    type: 'event', services: ['crew-assignments'], x: 880, y: 410, prerequisites: ['arlong-park-raid'],
  },
];

export const arlongParkConnections: Array<[string, string]> = [
  ['cocoyasi-shore', 'cocoyasi-under-arlong'],
  ['cocoyasi-under-arlong', 'break-the-fishman-patrol'],
  ['cocoyasi-under-arlong', 'expose-nezumis-cover-up'],
  ['cocoyasi-under-arlong', 'bellemere-orange-grove'],
  ['break-the-fishman-patrol', 'namis-map-room'],
  ['expose-nezumis-cover-up', 'namis-map-room'],
  ['bellemere-orange-grove', 'namis-map-room'],
  ['namis-map-room', 'nami-asks-for-help'],
  ['nami-asks-for-help', 'bellemere-grave'],
  ['bellemere-grave', 'walk-to-arlong-park'],
  ['walk-to-arlong-park', 'break-arlongs-front-gate'],
  ['walk-to-arlong-park', 'free-gosa-village'],
  ['walk-to-arlong-park', 'cross-the-sea-wall'],
  ['break-arlongs-front-gate', 'arlong-park-courtyard'],
  ['free-gosa-village', 'arlong-park-courtyard'],
  ['cross-the-sea-wall', 'arlong-park-courtyard'],
  ['arlong-park-courtyard', 'arlong-park-raid'],
  ['arlong-park-raid', 'cocoyasi-dawn'],
];

const villageRecovery = [
  { type: 'restore', target: 'move-pp' } as const,
  { type: 'heal', target: 'crew', percent: 50 } as const,
  { type: 'checkpoint' } as const,
];

export const arlongParkChoices: Record<string, NodeChoice[]> = {
  'cocoyasi-shore': [{
    id: 'follow-nami-home', label: 'Follow Nami into Cocoyasi', detail: 'Establish the occupied village as a checkpoint and prepare the crew.',
    consequences: [{ type: 'checkpoint' }],
    outcome: { title: 'The truth lies inland', detail: 'The crew refuses to leave without hearing Nami’s story.', journalEntry: 'The crew entered Cocoyasi Village to learn why Nami had returned to Arlong.' },
  }],
  'cocoyasi-under-arlong': [
    {
      id: 'attack-the-tribute-patrol', label: 'Attack the tribute patrol', detail: 'Fight Hatchan and two raiders for high bounty and village morale.',
      consequences: [{ type: 'route', branch: 'cocoyasi-investigation-route', nodeId: 'break-the-fishman-patrol' }],
      outcome: { title: 'Open resistance', detail: 'The crew challenges Arlong’s authority on Cocoyasi’s main road.', journalEntry: 'The crew chose to attack Arlong’s tribute patrol openly.' },
    },
    {
      id: 'follow-captain-nezumi', label: 'Follow Captain Nezumi', detail: 'Fight the corrupt Marine squad for more Berries and evidence of Arlong’s bargain.',
      consequences: [{ type: 'route', branch: 'cocoyasi-investigation-route', nodeId: 'expose-nezumis-cover-up' }],
      outcome: { title: 'Shadow the Marines', detail: 'Nami’s missing savings lead toward Nezumi’s ship.', journalEntry: 'The crew followed Nezumi to expose his arrangement with Arlong.' },
    },
    {
      id: 'listen-to-nojiko', label: 'Listen to Nojiko', detail: 'Avoid a battle and learn Nami’s history in the orange grove.',
      consequences: [{ type: 'route', branch: 'cocoyasi-investigation-route', nodeId: 'bellemere-orange-grove' }],
      outcome: { title: 'Walk through the orange grove', detail: 'Nojiko agrees to explain the bargain Nami never wanted the crew to know.', journalEntry: 'The crew followed Nojiko to Bell-mère’s orange grove.' },
    },
  ],
  'bellemere-orange-grove': [{
    id: 'protect-namis-savings', label: 'Protect what remains', detail: 'Recover 100 Berries Nezumi’s men overlooked and gain 500 bounty for preserving the grove.',
    consequences: [{ type: 'resource', resource: 'berries', amount: 100 }, { type: 'resource', resource: 'bounty', amount: 500 }],
    outcome: { title: 'The grove remembers', detail: 'The crew understands what Nami endured to keep this home alive.', journalEntry: 'Nojiko told the crew how Nami sacrificed eight years to save Cocoyasi.' },
  }],
  'namis-map-room': [{
    id: 'refuse-arlongs-bargain', label: 'Refuse Arlong’s bargain', detail: 'Gain 750 bounty by declaring the crew will free Nami without accepting her as property.',
    consequences: [{ type: 'resource', resource: 'bounty', amount: 750 }],
    outcome: { title: 'A crewmate is not property', detail: 'Luffy waits for Nami to choose help for herself.', journalEntry: 'The crew rejected Arlong’s claim over Nami and her maps.' },
  }],
  'nami-asks-for-help': [{
    id: 'place-the-straw-hat', label: 'Place the straw hat on Nami', detail: 'Restore the active party by 25% and gain 1,000 bounty as Cocoyasi witnesses the promise.',
    consequences: [{ type: 'heal', target: 'active-party', percent: 25 }, { type: 'resource', resource: 'bounty', amount: 1000 }],
    outcome: { title: 'Of course I will', detail: 'Nami entrusts her village to the crew and rejoins the fight.', journalEntry: 'Nami asked Luffy for help, and the crew answered together.' },
  }],
  'bellemere-grave': [
    {
      id: 'share-sanjis-rations', label: 'Share Sanji’s rations', detail: 'Restore move PP, heal the crew by 50%, gain 75 Berries in supplies, and set a checkpoint.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 75 }, ...villageRecovery],
      outcome: { title: 'The village sets the table', detail: 'A meal shared in defiance restores the crew before the march.', journalEntry: 'Cocoyasi shared its remaining food with the crew before the attack.' },
    },
    {
      id: 'fortify-the-going-merry', label: 'Fortify the Going Merry', detail: 'Restore move PP, heal the crew by 50%, repair 15 hull, and set a checkpoint.',
      consequences: [{ type: 'hull-repair', amount: 15 }, ...villageRecovery],
      outcome: { title: 'The escape route is secure', detail: 'Genzo’s carpenters brace the Going Merry against Arlong’s attack.', journalEntry: 'The villagers reinforced the Going Merry before the march on Arlong Park.' },
    },
  ],
  'walk-to-arlong-park': [
    {
      id: 'smash-the-front-gate', label: 'Smash the front gate', detail: 'Fight Kuroobi and a full guard for the highest bounty.',
      consequences: [{ type: 'route', branch: 'arlong-assault-route', nodeId: 'break-arlongs-front-gate' }],
      outcome: { title: 'Take the direct road', detail: 'Luffy leads the crew straight toward Arlong’s symbol of power.', journalEntry: 'The crew marched openly on Arlong Park’s front gate.' },
    },
    {
      id: 'rally-gosa-village', label: 'Rally Gosa Village', detail: 'Fight Chew’s shooters, earn balanced rewards, and repair 8 hull with the survivors’ help.',
      consequences: [{ type: 'route', branch: 'arlong-assault-route', nodeId: 'free-gosa-village' }],
      outcome: { title: 'Spread the rebellion', detail: 'Usopp carries the fight through Gosa’s ruined streets.', journalEntry: 'The crew detoured through Gosa Village to widen the rebellion.' },
    },
    {
      id: 'cross-namis-reef', label: 'Cross Nami’s reef', detail: 'Fight Hatchan’s smaller sea-wall force for more Berries, but risk 8 hull damage.',
      consequences: [{ type: 'route', branch: 'arlong-assault-route', nodeId: 'cross-the-sea-wall' }],
      outcome: { title: 'Approach from the sea', detail: 'Nami charts a hidden line across the reef toward the map tower.', journalEntry: 'Nami guided the crew toward Arlong Park’s sea wall.' },
    },
  ],
  'arlong-park-courtyard': [
    {
      id: 'free-the-cartographers', label: 'Free the captive cartographers', detail: 'Restore move PP, heal the crew by 50%, gain 900 bounty, and set a checkpoint.',
      consequences: [{ type: 'resource', resource: 'bounty', amount: 900 }, ...villageRecovery],
      outcome: { title: 'The map room opens', detail: 'Arlong’s prisoners escape while the crew prepares for his last stand.', journalEntry: 'The crew freed Arlong’s captive cartographers before the final battle.' },
    },
    {
      id: 'seize-arlongs-tribute', label: 'Seize Arlong’s tribute', detail: 'Restore move PP, heal the crew by 50%, gain 175 Berries, and set a checkpoint.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 175 }, ...villageRecovery],
      outcome: { title: 'The villages reclaim their tribute', detail: 'Arlong’s hoard will fund the coast he ruined.', journalEntry: 'The crew seized Arlong’s tribute stores for the occupied villages.' },
    },
  ],
  'cocoyasi-dawn': [{
    id: 'sail-with-nami-again', label: 'Sail with Nami again', detail: 'Confirm Nami as Navigator, open the free Arlong Park pack, and set course for Loguetown.',
    consequences: [
      { type: 'recruit', characterId: 'nami', preferredRoles: ['navigator'] },
      { type: 'restore', target: 'hull' }, { type: 'checkpoint' },
      { type: 'pack', packId: 'arlong-park', resume: { phase: 'map', activeArcId: 'loguetown', currentNodeId: 'loguetown-harbor' } },
    ],
    outcome: { title: 'Arlong Park complete', detail: 'Nami returns by choice and the crew sails toward the Grand Line’s gateway.', journalEntry: 'Nami left Cocoyasi as a free navigator aboard the Going Merry.' },
  }],
};
