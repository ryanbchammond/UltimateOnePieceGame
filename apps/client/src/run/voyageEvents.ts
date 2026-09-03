import type {
  EncounterId,
  NodeChoice,
  RunSnapshot,
  StoryArcId,
  StoryOutcome,
  VoyageEventCategory,
  VoyageEventId,
  VoyageLeg,
  StoryTravelRule,
  VoyageContext,
} from './types';

export interface VoyageEventDefinition {
  id: VoyageEventId;
  arcIds: StoryArcId[];
  contexts: VoyageContext[];
  category: VoyageEventCategory;
  name: string;
  subtitle: string;
  description: string;
  weight: number;
  choices?: NodeChoice[];
  encounterId?: EncounterId;
  victory?: StoryOutcome;
}

const leaveChoice = (id: string, journalEntry: string): NodeChoice => ({
  id,
  label: 'Sail on',
  detail: 'Leave without spending supplies or risking the ship.',
  consequences: [],
  outcome: {
    title: 'Course maintained',
    detail: 'The crew leaves the opportunity behind and resumes the voyage.',
    journalEntry,
  },
});

export const voyageEventDefinitions: Record<VoyageEventId, VoyageEventDefinition> = {
  'alvida-stragglers': {
    id: 'alvida-stragglers',
    arcIds: ['romance-dawn'],
    contexts: ['open-sea'],
    category: 'battle',
    name: "Alvida's Stragglers",
    subtitle: 'A black flag closes from astern',
    description: 'Pirates scattered by Alvida mistake the tiny boat for an easy prize and swing across the waves.',
    weight: 16,
    encounterId: 'voyage-alvida-raiders',
    victory: {
      title: 'Raiders repelled',
      detail: 'The attackers abandon their loose cargo as they retreat.',
      journalEntry: "The crew drove off a band of Alvida's scattered pirates.",
      consequences: [
        { type: 'resource', resource: 'berries', amount: 25 },
        { type: 'resource', resource: 'bounty', amount: 250, captainBountyBonus: true },
      ],
    },
  },
  'marine-longboat': {
    id: 'marine-longboat',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'battle',
    name: 'Marine Longboat',
    subtitle: 'Wanted faces on the morning watch',
    description: 'A roaming Marine patrol recognizes the crew and orders them to surrender for inspection.',
    weight: 14,
    encounterId: 'voyage-marine-patrol',
    victory: {
      title: 'Patrol outsailed',
      detail: 'The Marines lose the chase, leaving seized pirate supplies behind.',
      journalEntry: 'The crew defeated a roaming Marine patrol between islands.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 30 },
        { type: 'resource', resource: 'bounty', amount: 350, captainBountyBonus: true },
      ],
    },
  },
  'drifting-lockbox': {
    id: 'drifting-lockbox',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'treasure',
    name: 'Drifting Lockbox',
    subtitle: 'Three catches in a pirate net',
    description: 'A torn cargo net holds a brass instrument case, a merchant folio, and a purse of waterlogged coins.',
    weight: 14,
    choices: [
      {
        id: 'keep-log-pose',
        label: 'Keep the brass instrument',
        detail: 'Recover a Weathered Log Pose. A duplicate is exchanged for 50 Berries.',
        consequences: [{ type: 'artifact', artifactId: 'weathered-log-pose' }],
        outcome: {
          title: 'A stubborn needle stirs',
          detail: 'The battered Log Pose still reacts to dangerous currents.',
          journalEntry: 'The crew recovered a Weathered Log Pose from a drifting lockbox.',
        },
      },
      {
        id: 'keep-ledger',
        label: "Keep the merchant's folio",
        detail: "Recover a Merchant's Ledger that improves future treasure hauls.",
        consequences: [{ type: 'artifact', artifactId: 'merchants-ledger' }],
        outcome: {
          title: 'Every crate has a buyer',
          detail: 'The ledger identifies which salvage is worth carrying.',
          journalEntry: "The crew recovered a merchant's annotated salvage ledger.",
        },
      },
      {
        id: 'take-lockbox-coins',
        label: 'Take the coin purse',
        detail: 'Gain 45 Berries immediately.',
        consequences: [{ type: 'resource', resource: 'berries', amount: 45, treasureReward: true }],
        outcome: {
          title: 'Coins dried on deck',
          detail: 'Enough currency survived the sea to fund the voyage.',
          journalEntry: 'The crew pulled a purse of Berries from a drifting cargo net.',
        },
      },
    ],
  },
  'moonlit-cove': {
    id: 'moonlit-cove',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'rest',
    name: 'Moonlit Cove',
    subtitle: 'Calm water beneath sheltering cliffs',
    description: 'A hidden beach offers a few quiet hours before the tide turns.',
    weight: 12,
    choices: [
      {
        id: 'rest-fighters',
        label: 'Rest the fighters',
        detail: 'Restore all move PP and heal the whole crew for 50% max HP.',
        consequences: [
          { type: 'restore', target: 'move-pp' },
          { type: 'heal', target: 'crew', percent: 50 },
        ],
        outcome: {
          title: 'Strength restored',
          detail: 'Food, sleep, and a little silence restore the crew for the next fight.',
          journalEntry: 'The crew rested in a moonlit cove and restored its move PP.',
        },
      },
      {
        id: 'tend-the-ship',
        label: 'Tend injuries and patch the hull',
        detail: 'Repair 5 hull, 9 with a Doctor, or 14 with an ideal or artifact-equipped Doctor.',
        consequences: [{
          type: 'hull-repair',
          amount: 5,
          roleAdjustedAmount: { role: 'doctor', standard: 9, ideal: 14 },
        }],
        outcome: {
          title: 'Makeshift treatment complete',
          detail: 'The crew and ship are made ready for open water.',
          journalEntry: 'The crew used the quiet cove to treat wounds and patch the ship.',
        },
      },
    ],
  },
  'foosha-supply-skiff': {
    id: 'foosha-supply-skiff',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'shop',
    name: 'Foosha Supply Skiff',
    subtitle: 'A familiar windmill painted on the sail',
    description: 'A village trader recognizes Luffy and offers practical supplies at sea-going prices.',
    weight: 10,
    choices: [
      {
        id: 'buy-hull-patches',
        label: 'Buy hull patches · 30 Berries',
        detail: 'Spend 30 Berries to repair 18 hull.',
        requirements: [{ type: 'berries', amount: 30 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -30 },
          { type: 'hull-repair', amount: 18 },
        ],
        outcome: {
          title: 'Fresh patches fitted',
          detail: 'Pitch and planks seal the worst damage.',
          journalEntry: 'The crew bought hull patches from a Foosha supply skiff.',
        },
      },
      {
        id: 'buy-rations',
        label: 'Buy battle rations · 25 Berries',
        detail: 'Spend 25 Berries to restore all move PP.',
        requirements: [{ type: 'berries', amount: 25 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -25 },
          { type: 'restore', target: 'move-pp' },
        ],
        outcome: {
          title: 'Rations stowed',
          detail: 'The crew is ready to fight again.',
          journalEntry: 'The crew restocked battle rations from a passing skiff.',
        },
      },
      leaveChoice('leave-foosha-skiff', 'The crew waved to the Foosha trader and kept sailing.'),
    ],
  },
  'east-blue-crosscurrent': {
    id: 'east-blue-crosscurrent',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'hazard',
    name: 'Crosscurrent Maze',
    subtitle: 'Three tides pull in different directions',
    description: 'Reefs vanish beneath white water while the current drags the ship off its heading.',
    weight: 12,
    choices: [
      {
        id: 'read-the-current',
        label: 'Read the current and hold course',
        detail: 'Risk 9 hull damage, reduced to 4 by a Navigator and 0 by an ideal or Log Pose-assisted Navigator.',
        consequences: [{
          type: 'hull-damage',
          amount: 9,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'navigator', standard: 4, ideal: 0 },
        }],
        outcome: {
          title: 'The reefs fall behind',
          detail: 'The ship escapes the crossing tides and returns to its heading.',
          journalEntry: 'The crew threaded a maze of East Blue crosscurrents.',
        },
      },
      {
        id: 'steer-around-reefs',
        label: 'Take the long steering route',
        detail: 'Risk 7 hull damage, reduced to 3 by a Helmsman and 0 by an ideal or reinforced Helmsman.',
        consequences: [{
          type: 'hull-damage',
          amount: 7,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'helmsman', standard: 3, ideal: 0 },
        }],
        outcome: {
          title: 'The long route holds',
          detail: 'Careful steering trades time for safer water.',
          journalEntry: 'The crew steered the long way around a maze of reefs.',
        },
      },
    ],
  },
  'news-coo-rumor': {
    id: 'news-coo-rumor',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'wildcard',
    name: 'A News Coo Knows Too Much',
    subtitle: 'Yesterday’s paper carries tomorrow’s rumor',
    description: 'A delivery bird circles the mast with a newspaper—and a penciled request for eyewitness stories.',
    weight: 11,
    choices: [
      {
        id: 'sell-the-story',
        label: 'Sell an outrageous account',
        detail: 'Gain 20 Berries and 150 bounty when the embellished story reaches port.',
        consequences: [
          { type: 'resource', resource: 'berries', amount: 20 },
          { type: 'resource', resource: 'bounty', amount: 150 },
        ],
        outcome: {
          title: 'The presses start rolling',
          detail: 'By sunset, the story is already bigger than the truth.',
          journalEntry: 'The crew sold a very generous version of its adventures to a News Coo.',
        },
      },
      {
        id: 'buy-the-weather-page',
        label: 'Buy the weather page · 15 Berries',
        detail: 'Spend 15 Berries and recover 6 hull by avoiding rough water.',
        requirements: [{ type: 'berries', amount: 15 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -15 },
          { type: 'hull-repair', amount: 6 },
        ],
        outcome: {
          title: 'Storm lines avoided',
          detail: 'The tiny print proves more useful than the headline.',
          journalEntry: 'A News Coo weather page guided the crew toward calmer water.',
        },
      },
    ],
  },
  'sea-king-shadow': {
    id: 'sea-king-shadow',
    arcIds: ['romance-dawn', 'baratie', 'arlong-park', 'loguetown', 'east-blue-prototype'],
    contexts: ['open-sea'],
    category: 'wildcard',
    name: 'Shadow Beneath the Hull',
    subtitle: 'Something enormous matches the ship’s speed',
    description: 'A Sea King rises just far enough for one golden eye to inspect the crew.',
    weight: 9,
    choices: [
      {
        id: 'throw-provisions',
        label: 'Throw provisions overboard',
        detail: 'Lose 20 Berries worth of supplies and leave without hull damage.',
        requirements: [{ type: 'berries', amount: 20 }],
        consequences: [{ type: 'resource', resource: 'berries', amount: -20 }],
        outcome: {
          title: 'A very expensive snack',
          detail: 'The Sea King follows the food while the ship slips away.',
          journalEntry: 'The crew distracted a curious Sea King with its provisions.',
        },
      },
      {
        id: 'outrun-sea-king',
        label: 'Run before it gets curious',
        detail: 'Risk 10 hull damage, reduced to 4 by a Helmsman and 0 by an ideal or reinforced Helmsman.',
        consequences: [{
          type: 'hull-damage',
          amount: 10,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'helmsman', standard: 4, ideal: 0 },
        }],
        outcome: {
          title: 'The shadow finally turns',
          detail: 'The hull creaks, but the Sea King loses interest.',
          journalEntry: 'The crew escaped a Sea King shadowing the ship.',
        },
      },
    ],
  },
  'alvida-deck-patrol': {
    id: 'alvida-deck-patrol',
    arcIds: ['romance-dawn'],
    contexts: ['alvida-ship'],
    category: 'battle',
    name: 'Boots Above the Hold',
    subtitle: "Alvida's pirates sweep the ship room by room",
    description: 'A wandering gang hears the crew moving between decks and blocks the next ladder.',
    weight: 18,
    encounterId: 'voyage-alvida-raiders',
    victory: {
      title: 'Patrol silenced',
      detail: 'The gang drops a pouch of stolen pay while fleeing.',
      journalEntry: "The crew slipped past one of Alvida's roaming patrols.",
      consequences: [{ type: 'resource', resource: 'berries', amount: 20 }],
    },
  },
  'alvida-stolen-rations': {
    id: 'alvida-stolen-rations',
    arcIds: ['romance-dawn'],
    contexts: ['alvida-ship'],
    category: 'rest',
    name: 'Stolen Ration Locker',
    subtitle: 'Hardtack, oranges, and one suspicious ham',
    description: "A half-open locker holds the food Alvida's crew took from its last victims.",
    weight: 17,
    choices: [{
      id: 'eat-rations',
      label: 'Share the rations',
      detail: 'Heal the active battle party for 25% max HP.',
      consequences: [{ type: 'heal', target: 'active-party', percent: 25 }],
      outcome: {
        title: 'A hurried meal',
        detail: 'The fighters regain enough strength to keep moving through the ship.',
        journalEntry: "The crew recovered and shared rations aboard Alvida's ship.",
      },
    }],
  },
  'alvida-locked-cabin': {
    id: 'alvida-locked-cabin',
    arcIds: ['romance-dawn'],
    contexts: ['alvida-ship'],
    category: 'treasure',
    name: "Quartermaster's Cabin",
    subtitle: 'A brass key still hangs in the lock',
    description: 'Inside sits a payroll purse beside cargo marked for Alvida herself.',
    weight: 14,
    choices: [{
      id: 'take-payroll',
      label: 'Pocket the pirate payroll',
      detail: 'Gain 40 Berries.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 40, treasureReward: true }],
      outcome: {
        title: 'Payday changed hands',
        detail: "Alvida's pirates will be arguing about this for weeks.",
        journalEntry: "The crew found Alvida's unattended pirate payroll.",
      },
    }],
  },
  'alvida-loose-powder': {
    id: 'alvida-loose-powder',
    arcIds: ['romance-dawn'],
    contexts: ['alvida-ship'],
    category: 'hazard',
    name: 'Rolling Powder Keg',
    subtitle: 'One broken brace, one crowded gun deck',
    description: 'A loose powder keg crashes toward a lantern as the ship heels hard.',
    weight: 11,
    choices: [{
      id: 'smother-the-sparks',
      label: 'Smother the sparks',
      detail: 'Risk 7 hull damage, reduced by the Shipwright role.',
      consequences: [{ type: 'hull-damage', amount: 7, protectedByShipwright: true }],
      outcome: {
        title: 'The magazine stays quiet',
        detail: 'The danger passes with only splintered boards and singed eyebrows.',
        journalEntry: "The crew stopped a powder accident aboard Alvida's ship.",
      },
    }],
  },
  'shells-town-patrol': {
    id: 'shells-town-patrol',
    arcIds: ['romance-dawn'],
    contexts: ['shells-town'],
    category: 'battle',
    name: "Morgan's Street Patrol",
    subtitle: 'Boots and rifle stocks echo around the corner',
    description: 'A nervous Marine squad searches the alleys for anyone helping the prisoner.',
    weight: 17,
    encounterId: 'voyage-marine-patrol',
    victory: {
      title: 'Patrol routed',
      detail: 'The Marines retreat toward the base and abandon confiscated coins.',
      journalEntry: "The crew defeated one of Morgan's Shells Town patrols.",
      consequences: [{ type: 'resource', resource: 'berries', amount: 25 }],
    },
  },
  'rika-rations': {
    id: 'rika-rations',
    arcIds: ['romance-dawn'],
    contexts: ['shells-town'],
    category: 'rest',
    name: "Rika's Hidden Lunch",
    subtitle: 'A cloth bundle tucked behind a rain barrel',
    description: 'Rice balls and clean water wait where Marine patrols will not see them.',
    weight: 16,
    choices: [{
      id: 'share-rikas-food',
      label: 'Share the food',
      detail: 'Heal the active battle party for 25% max HP.',
      consequences: [{ type: 'heal', target: 'active-party', percent: 25 }],
      outcome: {
        title: 'Kindness restores courage',
        detail: 'A small meal carries the crew through the next confrontation.',
        journalEntry: "The crew found the meal Rika hid for Morgan's prisoners.",
      },
    }],
  },
  'shells-town-storehouse': {
    id: 'shells-town-storehouse',
    arcIds: ['romance-dawn'],
    contexts: ['shells-town'],
    category: 'treasure',
    name: 'Confiscated Goods Storehouse',
    subtitle: 'Morgan labels theft as evidence',
    description: 'A cracked door reveals valuables seized from townspeople and passing sailors.',
    weight: 13,
    choices: [{
      id: 'recover-confiscated-coins',
      label: 'Take expedition funds',
      detail: 'Gain 35 Berries from unclaimed pirate loot.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 35, treasureReward: true }],
      outcome: {
        title: 'Confiscated coins recovered',
        detail: 'The crew leaves the clearly marked townsfolk property behind.',
        journalEntry: "The crew recovered pirate loot from Morgan's evidence store.",
      },
    }],
  },
  'shells-town-doctor': {
    id: 'shells-town-doctor',
    arcIds: ['romance-dawn'],
    contexts: ['shells-town'],
    category: 'rest',
    name: 'Back-Alley Clinic',
    subtitle: 'The doctor locks the shutters before opening the door',
    description: "A local physician quietly treats anyone willing to stand against Morgan.",
    weight: 12,
    choices: [{
      id: 'accept-clinic-care',
      label: 'Rest at the clinic',
      detail: 'Heal the whole crew for 50% max HP and restore all move PP.',
      consequences: [
        { type: 'heal', target: 'crew', percent: 50 },
        { type: 'restore', target: 'move-pp' },
      ],
      outcome: {
        title: 'Bandaged and ready',
        detail: 'The clinic sends the crew back into town in fighting shape.',
        journalEntry: 'A hidden Shells Town clinic treated the crew before the next clash.',
      },
    }],
  },
  'wrecked-circus-barge': {
    id: 'wrecked-circus-barge',
    arcIds: ['orange-town'],
    contexts: ['open-sea'],
    category: 'treasure',
    name: 'Wrecked Circus Barge',
    subtitle: 'Striped canvas snaps above an abandoned deck',
    description: "One of Buggy's supply barges drifts offshore with its strongbox still chained down.",
    weight: 13,
    choices: [{
      id: 'salvage-barge-strongbox',
      label: 'Salvage the strongbox',
      detail: 'Gain 55 Berries, plus any Merchant’s Ledger bonus.',
      consequences: [{ type: 'resource', resource: 'berries', amount: 55, treasureReward: true }],
      outcome: {
        title: 'The sea returns stolen coin',
        detail: 'The chain gives way before the wreck rolls beneath the waves.',
        journalEntry: "The crew salvaged a strongbox from one of Buggy's wrecked barges.",
      },
    }],
  },
  'sheltered-fishing-islet': {
    id: 'sheltered-fishing-islet',
    arcIds: ['orange-town'],
    contexts: ['open-sea'],
    category: 'rest',
    name: 'Lantern-Fisher Islet',
    subtitle: 'A ring of warm lights in quiet water',
    description: 'Fisher families shelter the crew for a tide and cook whatever the sea provided.',
    weight: 12,
    choices: [{
      id: 'rest-with-fishers',
      label: 'Rest until the tide turns',
      detail: 'Heal the whole crew for 50% max HP and restore all move PP.',
      consequences: [
        { type: 'heal', target: 'crew', percent: 50 },
        { type: 'restore', target: 'move-pp' },
      ],
      outcome: {
        title: 'Lanterns fade behind the stern',
        detail: 'A real meal and a safe watch restore the crew for Orange Town.',
        journalEntry: 'The crew rested with the lantern fishers before sailing onward.',
      },
    }],
  },
  'buggy-scout-raft': {
    id: 'buggy-scout-raft',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'battle',
    name: "Buggy's Scout Raft",
    subtitle: 'A circus flag rises through the smoke',
    description: 'A raiding party rows from shore with knives, cages, and far too much confidence.',
    weight: 16,
    encounterId: 'voyage-buggy-scouts',
    victory: {
      title: 'Scouts scattered',
      detail: "Buggy's lookouts flee and leave their collection money behind.",
      journalEntry: "The crew defeated Buggy's scouts between Orange Town landmarks.",
      consequences: [
        { type: 'resource', resource: 'berries', amount: 35 },
        { type: 'resource', resource: 'bounty', amount: 300, captainBountyBonus: true },
      ],
    },
  },
  'marine-pursuit-cutter': {
    id: 'marine-pursuit-cutter',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'battle',
    name: 'Marine Pursuit Cutter',
    subtitle: 'The wanted poster reaches Orange Town',
    description: 'A fast Marine cutter arrives hoping to catch both Buggy and the newest pirate crew.',
    weight: 14,
    encounterId: 'voyage-marine-pursuit',
    victory: {
      title: 'The cutter breaks pursuit',
      detail: 'The Marines retreat before Buggy can exploit the distraction.',
      journalEntry: 'The crew drove a Marine pursuit cutter away from Orange Town.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 40 },
        { type: 'resource', resource: 'bounty', amount: 400, captainBountyBonus: true },
      ],
    },
  },
  'abandoned-circus-cache': {
    id: 'abandoned-circus-cache',
    arcIds: ['orange-town'],
    contexts: ['orange-town'],
    category: 'treasure',
    name: 'Abandoned Circus Cache',
    subtitle: 'A striped wagon with three locked drawers',
    description: "Buggy's crew abandoned navigation gear, medical supplies, and a strongbox while fleeing the street.",
    weight: 14,
    choices: [
      {
        id: 'take-medical-kit',
        label: 'Take the medical case',
        detail: 'Recover a Field Medical Kit. A duplicate is exchanged for 50 Berries.',
        consequences: [{ type: 'artifact', artifactId: 'field-medical-kit' }],
        outcome: {
          title: 'Medical stores recovered',
          detail: 'The case contains clean bandages, splints, and hard-won practical notes.',
          journalEntry: "The crew recovered a Field Medical Kit from Buggy's cache.",
        },
      },
      {
        id: 'take-tiller',
        label: 'Take the reinforced tiller',
        detail: 'Recover a Reinforced Tiller. A duplicate is exchanged for 50 Berries.',
        consequences: [{ type: 'artifact', artifactId: 'reinforced-tiller' }],
        outcome: {
          title: 'A steadier hand at sea',
          detail: 'The compact tiller fits the crew’s battered steering assembly.',
          journalEntry: "The crew recovered a Reinforced Tiller from Buggy's cache.",
        },
      },
      {
        id: 'take-circus-coins',
        label: 'Crack the strongbox',
        detail: 'Gain 60 Berries, plus any Merchant’s Ledger bonus.',
        consequences: [{ type: 'resource', resource: 'berries', amount: 60, treasureReward: true }],
        outcome: {
          title: 'The clown pays the tab',
          detail: 'Buggy’s collection money finds a better crew.',
          journalEntry: "The crew emptied a strongbox from Buggy's abandoned cache.",
        },
      },
    ],
  },
  'orange-town-cellar': {
    id: 'orange-town-cellar',
    arcIds: ['orange-town'],
    contexts: ['orange-town'],
    category: 'rest',
    name: 'Orange Town Cellar',
    subtitle: 'A lantern glows beneath a ruined bakery',
    description: 'Townspeople sheltering below the street offer a meal and a workbench before the crew moves on.',
    weight: 12,
    choices: [
      {
        id: 'share-cellar-meal',
        label: 'Share the cellar meal',
        detail: 'Restore all move PP and heal the whole crew for 50% max HP.',
        consequences: [
          { type: 'restore', target: 'move-pp' },
          { type: 'heal', target: 'crew', percent: 50 },
        ],
        outcome: {
          title: 'A table in occupied territory',
          detail: 'For one quiet meal, the town feels alive again.',
          journalEntry: 'The crew shared a restorative meal with Orange Town survivors.',
        },
      },
      {
        id: 'repair-in-cellar',
        label: 'Use the hidden workbench',
        detail: 'Repair 8 hull, increased to 12 by a Shipwright and 16 by an ideal Shipwright.',
        consequences: [{
          type: 'hull-repair',
          amount: 8,
          roleAdjustedAmount: { role: 'shipwright', standard: 12, ideal: 16 },
        }],
        outcome: {
          title: 'Repairs made under cover',
          detail: 'The townspeople keep watch while the crew works.',
          journalEntry: 'The crew repaired its ship at a hidden Orange Town workbench.',
        },
      },
    ],
  },
  'floating-peddler': {
    id: 'floating-peddler',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'shop',
    name: 'Floating Peddler',
    subtitle: 'No refunds during a pirate occupation',
    description: 'A fearless merchant poles a shop-barge through the canals, whispering prices beneath cannon fire.',
    weight: 10,
    choices: [
      {
        id: 'buy-ledger',
        label: 'Buy a salvage ledger · 80 Berries',
        detail: "Spend 80 Berries for a Merchant's Ledger; duplicates return 50 Berries.",
        requirements: [{ type: 'berries', amount: 80 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -80 },
          { type: 'artifact', artifactId: 'merchants-ledger' },
        ],
        outcome: {
          title: 'A suspiciously useful ledger',
          detail: 'The peddler circles every profitable wreck in red ink.',
          journalEntry: "The crew bought a Merchant's Ledger from a floating peddler.",
        },
      },
      {
        id: 'buy-emergency-repairs',
        label: 'Buy emergency repairs · 35 Berries',
        detail: 'Spend 35 Berries to repair 20 hull.',
        requirements: [{ type: 'berries', amount: 35 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -35 },
          { type: 'hull-repair', amount: 20 },
        ],
        outcome: {
          title: 'Repairs delivered by barge',
          detail: 'The merchant patches the ship without ever tying up.',
          journalEntry: 'The crew paid a floating peddler for emergency hull repairs.',
        },
      },
      leaveChoice('leave-floating-peddler', 'The crew left the floating peddler to seek another customer.'),
    ],
  },
  'cannon-smoke-bank': {
    id: 'cannon-smoke-bank',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'hazard',
    name: 'Cannon-Smoke Bank',
    subtitle: 'Buggy Balls turn the harbor sky black',
    description: 'Smoke hides burning debris, stone jetties, and the next flash of Buggy’s cannons.',
    weight: 12,
    choices: [
      {
        id: 'navigate-smoke',
        label: 'Navigate by wind and echo',
        detail: 'Risk 10 hull damage, reduced to 5 by a Navigator and 0 by an ideal or Log Pose-assisted Navigator.',
        consequences: [{
          type: 'hull-damage',
          amount: 10,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'navigator', standard: 5, ideal: 0 },
        }],
        outcome: {
          title: 'The ship clears the smoke',
          detail: 'The harbor reappears just before the next cannon lands.',
          journalEntry: 'The crew navigated through a bank of Buggy Ball smoke.',
        },
      },
      {
        id: 'steer-through-wreckage',
        label: 'Steer between the wrecks',
        detail: 'Risk 8 hull damage, reduced to 3 by a Helmsman and 0 by an ideal or reinforced Helmsman.',
        consequences: [{
          type: 'hull-damage',
          amount: 8,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'helmsman', standard: 3, ideal: 0 },
        }],
        outcome: {
          title: 'A path through broken masts',
          detail: 'The ship scrapes free before the smoke closes again.',
          journalEntry: 'The crew steered through wreckage beneath Buggy’s cannon smoke.',
        },
      },
    ],
  },
  'castaway-doctor': {
    id: 'castaway-doctor',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'wildcard',
    name: 'Castaway Doctor',
    subtitle: 'A medicine chest lashed to a door',
    description: 'A town doctor escaped Buggy’s raid with one patient and half a medical kit.',
    weight: 11,
    choices: [
      {
        id: 'help-the-patient',
        label: 'Help stabilize the patient',
        detail: 'Gain 250 bounty and repair 4 hull, 8 with a Doctor, or 12 with an ideal or equipped Doctor.',
        consequences: [
          { type: 'resource', resource: 'bounty', amount: 250 },
          {
            type: 'hull-repair',
            amount: 4,
            roleAdjustedAmount: { role: 'doctor', standard: 8, ideal: 12 },
          },
        ],
        outcome: {
          title: 'A life steadied at sea',
          detail: 'The grateful doctor shares medicine and repair cloth before parting.',
          journalEntry: 'The crew helped a castaway doctor stabilize an injured townsman.',
        },
      },
      {
        id: 'trade-for-medical-kit',
        label: 'Trade supplies for the spare kit · 35 Berries',
        detail: 'Spend 35 Berries and recover a Field Medical Kit.',
        requirements: [{ type: 'berries', amount: 35 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -35 },
          { type: 'artifact', artifactId: 'field-medical-kit' },
        ],
        outcome: {
          title: 'The medicine changes hands',
          detail: 'Both boats leave better supplied for what lies ahead.',
          journalEntry: 'The crew traded supplies with a castaway doctor for a Field Medical Kit.',
        },
      },
    ],
  },
  'unmarked-den-den-mushi': {
    id: 'unmarked-den-den-mushi',
    arcIds: ['orange-town'],
    contexts: ['open-sea', 'orange-town'],
    category: 'wildcard',
    name: 'Unmarked Den Den Mushi',
    subtitle: 'The receiver rings in an empty boat',
    description: 'A tiny boat drifts past carrying only a ringing transponder snail and a red circus nose.',
    weight: 9,
    choices: [
      {
        id: 'answer-like-buggy',
        label: 'Answer with your best Buggy impression',
        detail: 'Gain 25 Berries and 200 bounty by redirecting a confused supply crew.',
        consequences: [
          { type: 'resource', resource: 'berries', amount: 25 },
          { type: 'resource', resource: 'bounty', amount: 200 },
        ],
        outcome: {
          title: 'The performance somehow works',
          detail: 'A supply crate arrives before anyone questions the voice.',
          journalEntry: 'The crew impersonated Buggy over an abandoned Den Den Mushi.',
        },
      },
      {
        id: 'follow-the-signal',
        label: 'Follow the return signal',
        detail: 'Risk 7 hull damage, reduced to 2 by a Helmsman and 0 by an ideal or reinforced Helmsman, then gain 45 Berries.',
        consequences: [
          {
            type: 'hull-damage',
            amount: 7,
            protectedByShipwright: true,
            roleAdjustedAmount: { role: 'helmsman', standard: 2, ideal: 0 },
          },
          { type: 'resource', resource: 'berries', amount: 45, treasureReward: true },
        ],
        outcome: {
          title: 'Signal traced to a supply dinghy',
          detail: 'The rough shortcut ends at an unattended Buggy Crew cache.',
          journalEntry: 'The crew traced an abandoned Den Den Mushi to a hidden supply dinghy.',
        },
      },
    ],
  },
  'black-cat-lookout-boat': {
    id: 'black-cat-lookout-boat',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'battle',
    name: 'Black Cat Lookout Boat',
    subtitle: 'Kuro’s scouts recognize the Straw Hats',
    description: 'A narrow cutter slips from behind the sheep-shaped cliffs and its raiders draw their cat-marked sabers.',
    weight: 15,
    encounterId: 'voyage-black-cat-lookouts',
    victory: {
      title: 'The lookout boat is scattered',
      detail: 'The scouts abandon a bundle of stolen village supplies as they flee.',
      journalEntry: 'The crew defeated Black Cat lookouts patrolling Syrup Village’s coast.',
      consequences: [
        { type: 'resource', resource: 'berries', amount: 35 },
        { type: 'resource', resource: 'bounty', amount: 400, captainBountyBonus: true },
      ],
    },
  },
  'kayas-relief-crate': {
    id: 'kayas-relief-crate',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'treasure',
    name: "Kaya's Relief Crate",
    subtitle: 'Medicine and coin marked for the village',
    description: 'A supply crate has broken loose from a coastal delivery, but its contents are still dry.',
    weight: 13,
    choices: [
      {
        id: 'return-relief-crate',
        label: 'Return the crate intact',
        detail: 'Gain 300 bounty and heal the active party for 25% max HP.',
        consequences: [
          { type: 'resource', resource: 'bounty', amount: 300 },
          { type: 'heal', target: 'active-party', percent: 25 },
        ],
        outcome: {
          title: 'The delivery reaches shore',
          detail: 'The villagers share a little medicine before carrying the crate uphill.',
          journalEntry: 'The crew returned Kaya’s lost relief supplies to Syrup Village.',
        },
      },
      {
        id: 'salvage-relief-coins',
        label: 'Salvage the loose coin purse',
        detail: 'Gain 55 Berries as immediate treasure.',
        consequences: [{ type: 'resource', resource: 'berries', amount: 55, treasureReward: true }],
        outcome: {
          title: 'Loose coins recovered',
          detail: 'The damaged crate yields enough coin to provision the ship.',
          journalEntry: 'The crew recovered loose Berries from a drifting relief crate.',
        },
      },
    ],
  },
  'syrup-coast-cache': {
    id: 'syrup-coast-cache',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'rest',
    name: "Usopp's Coast Cache",
    subtitle: 'Emergency rations beneath a painted stone',
    description: 'One of Usopp’s highly secret supply caches contains blankets, fresh water, and enough food for a proper rest.',
    weight: 12,
    choices: [
      {
        id: 'rest-at-coast-cache',
        label: 'Rest beside the cache',
        detail: 'Restore all move PP and heal the whole crew for 50% max HP.',
        consequences: [
          { type: 'restore', target: 'move-pp' },
          { type: 'heal', target: 'crew', percent: 50 },
        ],
        outcome: {
          title: 'The crew catches its breath',
          detail: 'Usopp’s preparations are surprisingly useful.',
          journalEntry: 'The crew rested beside one of Usopp’s hidden coast caches.',
        },
      },
      {
        id: 'patch-at-coast-cache',
        label: 'Use the spare canvas on the ship',
        detail: 'Repair 8 hull, 12 with a Shipwright, or 16 with an ideal Shipwright.',
        consequences: [{
          type: 'hull-repair',
          amount: 8,
          roleAdjustedAmount: { role: 'shipwright', standard: 12, ideal: 16 },
        }],
        outcome: {
          title: 'Canvas patches hold',
          detail: 'The cache’s spare material reinforces the battered hull.',
          journalEntry: 'The crew used Usopp’s spare canvas to patch the ship.',
        },
      },
    ],
  },
  'village-apothecary': {
    id: 'village-apothecary',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'shop',
    name: 'Village Apothecary Cart',
    subtitle: 'A cautious merchant on the coast road',
    description: 'An apothecary evacuating the lower road offers a few supplies before continuing uphill.',
    weight: 10,
    choices: [
      {
        id: 'buy-syrup-medicine',
        label: 'Buy medicine · 30 Berries',
        detail: 'Spend 30 Berries to heal the whole crew for 50% max HP.',
        requirements: [{ type: 'berries', amount: 30 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -30 },
          { type: 'heal', target: 'crew', percent: 50 },
        ],
        outcome: {
          title: 'Medicine distributed',
          detail: 'The apothecary treats the crew before taking the cart uphill.',
          journalEntry: 'The crew bought medicine from a Syrup Village apothecary.',
        },
      },
      {
        id: 'buy-syrup-pitch',
        label: 'Buy pitch and rope · 25 Berries',
        detail: 'Spend 25 Berries to repair 15 hull.',
        requirements: [{ type: 'berries', amount: 25 }],
        consequences: [
          { type: 'resource', resource: 'berries', amount: -25 },
          { type: 'hull-repair', amount: 15 },
        ],
        outcome: {
          title: 'Emergency repairs complete',
          detail: 'Fresh pitch seals the seams before the tide turns.',
          journalEntry: 'The crew bought repair materials from the village apothecary.',
        },
      },
      leaveChoice('leave-village-apothecary', 'The crew let the apothecary continue uphill.'),
    ],
  },
  'sheep-cliff-crosswind': {
    id: 'sheep-cliff-crosswind',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'hazard',
    name: 'Sheep-Cliff Crosswind',
    subtitle: 'A sudden gust drives the ship toward stone',
    description: 'Wind funnels between the pale cliffs while half-submerged rocks close off the easy route.',
    weight: 12,
    choices: [
      {
        id: 'chart-sheep-cliffs',
        label: 'Chart the submerged rocks',
        detail: 'Risk 9 hull damage, reduced to 4 by a Navigator and 0 by an ideal or Log Pose-assisted Navigator.',
        consequences: [{
          type: 'hull-damage',
          amount: 9,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'navigator', standard: 4, ideal: 0 },
        }],
        outcome: {
          title: 'The hidden rocks pass astern',
          detail: 'A narrow channel leads the ship away from the cliff face.',
          journalEntry: 'The crew navigated the submerged rocks below Syrup Village.',
        },
      },
      {
        id: 'steer-through-crosswind',
        label: 'Steer directly through the gusts',
        detail: 'Risk 7 hull damage, reduced to 3 by a Helmsman and 0 by an ideal or reinforced Helmsman.',
        consequences: [{
          type: 'hull-damage',
          amount: 7,
          protectedByShipwright: true,
          roleAdjustedAmount: { role: 'helmsman', standard: 3, ideal: 0 },
        }],
        outcome: {
          title: 'The helm holds true',
          detail: 'The ship powers through the funneling wind and reaches calm water.',
          journalEntry: 'The crew held course through Syrup Village’s cliff winds.',
        },
      },
    ],
  },
  'usopps-false-alarm': {
    id: 'usopps-false-alarm',
    arcIds: ['syrup-village'],
    contexts: ['open-sea', 'syrup-village'],
    category: 'wildcard',
    name: "Usopp's False Alarm",
    subtitle: 'Pirates are coming—this time, perhaps',
    description: 'Usopp’s shout sends villagers running before anyone can tell whether the distant sail is dangerous.',
    weight: 10,
    choices: [
      {
        id: 'help-usopp-scout',
        label: 'Help Usopp scout the sail',
        detail: 'Gain 200 bounty and 25 Berries when the “pirate ship” proves to be a grateful fishing boat.',
        consequences: [
          { type: 'resource', resource: 'bounty', amount: 200 },
          { type: 'resource', resource: 'berries', amount: 25 },
        ],
        outcome: {
          title: 'A harmless sail identified',
          detail: 'The fishermen reward the crew for clearing up the panic.',
          journalEntry: 'The crew investigated one of Usopp’s alarms and reassured the village.',
        },
      },
      {
        id: 'use-the-alarm-as-a-drill',
        label: 'Turn the alarm into a defense drill',
        detail: 'Gain 350 bounty for helping the villagers prepare for a real attack.',
        consequences: [{ type: 'resource', resource: 'bounty', amount: 350 }],
        outcome: {
          title: 'Panic becomes preparation',
          detail: 'By sunset, every family knows where to shelter.',
          journalEntry: 'The crew turned Usopp’s false alarm into a village defense drill.',
        },
      },
    ],
  },
};

export const voyageCategoryLabels: Record<VoyageEventCategory, string> = {
  battle: 'Enemy attack',
  treasure: 'Treasure',
  rest: 'Rest site',
  shop: 'Traveling shop',
  hazard: 'Sea hazard',
  wildcard: 'Strange encounter',
};

export function getVoyageEvent(eventId: VoyageEventId): VoyageEventDefinition {
  return voyageEventDefinitions[eventId];
}

export function getCurrentVoyageEvent(
  run: Pick<RunSnapshot, 'pendingVoyage'>,
): VoyageEventDefinition | null {
  const leg = run.pendingVoyage;
  const eventId = leg?.eventIds[leg.currentEventIndex];
  return eventId ? getVoyageEvent(eventId) : null;
}

export function getWantedPressure(bounty: number): 'low' | 'rising' | 'high' {
  if (bounty >= 6000) return 'high';
  if (bounty >= 2500) return 'rising';
  return 'low';
}

function safeRandom(random: () => number): number {
  const value = random();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(0.999999999, value));
}

function drawOne(
  candidates: VoyageEventDefinition[],
  bounty: number,
  random: () => number,
): VoyageEventDefinition {
  const pressure = getWantedPressure(bounty);
  const battleMultiplier = pressure === 'high' ? 1.6 : pressure === 'rising' ? 1.3 : 1;
  const weighted = candidates.map((event) => ({
    event,
    weight: event.weight * (event.category === 'battle' ? battleMultiplier : 1),
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = safeRandom(random) * total;
  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll < 0) return entry.event;
  }
  return weighted[weighted.length - 1].event;
}

export function createVoyageLeg(
  run: Pick<RunSnapshot, 'activeArcId' | 'bounty' | 'currentNodeId' | 'voyageEventHistory'>,
  destinationNodeId: string,
  random: () => number = Math.random,
  travelRule: StoryTravelRule = { context: 'open-sea', minEvents: 1, maxEvents: 3 },
): VoyageLeg {
  const history = run.voyageEventHistory ?? [];
  const range = Math.max(0, travelRule.maxEvents - travelRule.minEvents + 1);
  const count = travelRule.minEvents + Math.floor(safeRandom(random) * range);
  const arcPool = Object.values(voyageEventDefinitions)
    .filter((event) =>
      event.arcIds.includes(run.activeArcId) && event.contexts.includes(travelRule.context));
  if (count > arcPool.length) {
    throw new Error(`Not enough ${travelRule.context} events to create a voyage leg.`);
  }
  const recent = new Set(history.slice(-4));
  const freshPool = arcPool.filter((event) => !recent.has(event.id));
  let available = freshPool.length >= count ? freshPool : arcPool;
  const eventIds: VoyageEventId[] = [];

  while (eventIds.length < count) {
    const selected = drawOne(available, run.bounty, random);
    eventIds.push(selected.id);
    available = available.filter((event) => event.id !== selected.id);
  }

  const fromNodeId = run.currentNodeId ?? 'open-sea';
  return {
    id: `${run.activeArcId}:${fromNodeId}:${destinationNodeId}:${history.length + 1}`,
    fromNodeId,
    destinationNodeId,
    eventIds,
    currentEventIndex: 0,
  };
}
