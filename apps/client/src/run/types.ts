export type GameMode = 'story';
export type Difficulty = 'landlubber';
export type RunPhase = 'setup' | 'map' | 'voyage' | 'node' | 'battle' | 'victory';
export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythical';
export type NodeService = 'crew-assignments' | 'tavern';
export type StoryArcId =
  | 'east-blue-prototype'
  | 'romance-dawn'
  | 'orange-town'
  | 'syrup-village'
  | 'baratie'
  | 'arlong-park'
  | 'loguetown';
export type MapNodeType =
  | 'start'
  | 'battle'
  | 'event'
  | 'treasure'
  | 'recruit'
  | 'rest'
  | 'boss';
export type EncounterId =
  | 'shells-town'
  | 'arlong-park'
  | 'alvida-deck'
  | 'alvida-hold'
  | 'marine-yard'
  | 'execution-grounds'
  | 'morgan-last-stand'
  | 'beast-tamers-street'
  | 'harbor-decoy'
  | 'acrobat-rooftops'
  | 'buggys-big-top'
  | 'syrup-north-slope'
  | 'syrup-mansion-grounds'
  | 'black-cat-raid'
  | 'baratie-deck-brawl'
  | 'baratie-cannon-line'
  | 'krieg-officers'
  | 'krieg-last-stand'
  | 'arlong-coast-patrol'
  | 'nezumi-cover-up'
  | 'arlong-front-gate'
  | 'gosa-road'
  | 'arlong-sea-wall'
  | 'arlong-park-raid'
  | 'loguetown-execution-plaza'
  | 'loguetown-marine-cordon'
  | 'smoker-pursuit'
  | 'voyage-alvida-raiders'
  | 'voyage-marine-patrol'
  | 'voyage-buggy-scouts'
  | 'voyage-marine-pursuit'
  | 'voyage-black-cat-lookouts';
export type CharacterId =
  | 'luffy'
  | 'alvida'
  | 'morgan'
  | 'helmeppo'
  | 'zoro'
  | 'sanji'
  | 'nami'
  | 'usopp'
  | 'coby'
  | 'johnny'
  | 'yosaku'
  | 'tashigi'
  | 'gin'
  | 'buggy'
  | 'mohji'
  | 'richie'
  | 'cabaji'
  | 'smoker'
  | 'kuro';
export type CharacterCapability = 'observation-haki';
export type ArtifactId =
  | 'weathered-log-pose'
  | 'field-medical-kit'
  | 'reinforced-tiller'
  | 'merchants-ledger';
export type ShipRole =
  | 'captain'
  | 'fighter-1'
  | 'fighter-2'
  | 'fighter-3'
  | 'doctor'
  | 'navigator'
  | 'helmsman'
  | 'cook'
  | 'shipwright'
  | 'pet';

export type RoleAssignments = Record<ShipRole, CharacterId | null>;
export type CharacterMovePp = Partial<Record<CharacterId, Record<string, number>>>;
export type CharacterHp = Partial<Record<CharacterId, number>>;
export type CardPackId =
  | 'baratie-east-blue'
  | 'romance-dawn'
  | 'orange-town'
  | 'syrup-village'
  | 'baratie'
  | 'arlong-park'
  | 'loguetown'
  | 'east-blue-saga';

export interface RewardChange {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral';
}

export interface RewardReceipt {
  id: string;
  title: string;
  detail: string;
  changes: RewardChange[];
}

export interface StoryNode {
  id: string;
  arcId: StoryArcId;
  name: string;
  subtitle: string;
  description: string;
  type: MapNodeType;
  x: number;
  y: number;
  prerequisites: string[];
  prerequisiteMode?: 'all' | 'any';
  branch?: string;
  encounterId?: EncounterId;
  services?: NodeService[];
  victory?: StoryOutcome;
}

export interface StoryArc {
  id: StoryArcId;
  name: string;
  mapTitle: string;
  mapInstruction: string;
  nodeIds: string[];
  start: {
    nodeId: string;
    phase: 'map' | 'node';
    berries: number;
    hull: number;
    maxHull: number;
    rosterIds: CharacterId[];
    guestIds: CharacterId[];
    activePartyIds: CharacterId[];
    roleAssignments: RoleAssignments;
    journalEntry: string;
  };
}

export interface StoryContent {
  startArcId: StoryArcId;
  arcs: StoryArc[];
  nodes: StoryNode[];
  connections: Array<[string, string]>;
  travelRules?: Record<string, StoryTravelRule>;
  choices: Record<string, NodeChoice[]>;
}

export interface CardPullResult {
  cardId: string;
  slot: number;
  characterId: CharacterId;
  rarity: CardRarity;
  revealed: boolean;
}

export interface CardPackOpening {
  id: string;
  packId: CardPackId;
  packNumber: number;
  source: 'paid' | 'arc-reward' | 'saga-reward';
  stage?: 'sealed' | 'cards';
  cards: CardPullResult[];
  resume?: {
    phase: RunPhase;
    activeArcId: StoryArcId;
    currentNodeId: string;
  };
}

export interface RunSnapshot {
  phase: RunPhase;
  mode: GameMode;
  difficulty: Difficulty;
  activeArcId: StoryArcId;
  berries: number;
  bounty: number;
  hull: number;
  maxHull: number;
  completedNodeIds: string[];
  visitedNodeIds: string[];
  currentNodeId: string | null;
  checkpointNodeId: string;
  chosenBranches: Record<string, string>;
  artifacts: ArtifactId[];
  journal: string[];
  rosterIds: CharacterId[];
  guestIds: CharacterId[];
  activePartyIds: CharacterId[];
  roleAssignments: RoleAssignments;
  characterShards: Partial<Record<CharacterId, number>>;
  characterStars: Partial<Record<CharacterId, number>>;
  characterMovePp: CharacterMovePp;
  characterHp?: CharacterHp;
  packsOpened: number;
  pendingPack: CardPackOpening | null;
  crewAssignmentWindow: 'card-pull' | null;
  latestReward: RewardReceipt | null;
  rewardPending?: boolean;
  rewardDestinationNodeId?: string | null;
  rewardOriginNodeId?: string | null;
  pendingVoyage?: VoyageLeg | null;
  mapTravelPending?: boolean;
  mapFocusPending?: boolean;
  voyageEventHistory?: VoyageEventId[];
}

export type VoyageEventCategory =
  | 'battle'
  | 'treasure'
  | 'rest'
  | 'shop'
  | 'hazard'
  | 'wildcard';

export type VoyageEventId =
  | 'alvida-stragglers'
  | 'marine-longboat'
  | 'drifting-lockbox'
  | 'moonlit-cove'
  | 'foosha-supply-skiff'
  | 'east-blue-crosscurrent'
  | 'news-coo-rumor'
  | 'sea-king-shadow'
  | 'alvida-deck-patrol'
  | 'alvida-stolen-rations'
  | 'alvida-locked-cabin'
  | 'alvida-loose-powder'
  | 'shells-town-patrol'
  | 'rika-rations'
  | 'shells-town-storehouse'
  | 'shells-town-doctor'
  | 'buggy-scout-raft'
  | 'marine-pursuit-cutter'
  | 'abandoned-circus-cache'
  | 'orange-town-cellar'
  | 'floating-peddler'
  | 'cannon-smoke-bank'
  | 'castaway-doctor'
  | 'unmarked-den-den-mushi'
  | 'wrecked-circus-barge'
  | 'sheltered-fishing-islet'
  | 'black-cat-lookout-boat'
  | 'kayas-relief-crate'
  | 'syrup-coast-cache'
  | 'village-apothecary'
  | 'sheep-cliff-crosswind'
  | 'usopps-false-alarm';

export interface VoyageLeg {
  id: string;
  fromNodeId: string;
  destinationNodeId: string;
  eventIds: VoyageEventId[];
  currentEventIndex: number;
}

export type VoyageContext =
  | 'open-sea'
  | 'alvida-ship'
  | 'shells-town'
  | 'orange-town'
  | 'syrup-village'
  | 'baratie'
  | 'arlong-park'
  | 'loguetown'
  | 'immediate';

export interface StoryTravelRule {
  context: VoyageContext;
  minEvents: number;
  maxEvents: number;
}

export interface NodeChoice {
  id: string;
  label: string;
  detail: string;
  requirements?: NodeChoiceRequirement[];
  consequences: StoryConsequence[];
  outcome: StoryOutcomePresentation;
}

export interface StoryOutcomePresentation {
  title: string;
  detail: string;
  journalEntry: string;
}

export interface StoryOutcome extends StoryOutcomePresentation {
  consequences: StoryConsequence[];
  phase?: RunPhase;
}

export type NodeChoiceRequirement =
  | { type: 'berries'; amount: number }
  | { type: 'role'; role: ShipRole };

export type StoryConsequence =
  | {
      type: 'resource';
      resource: 'berries' | 'bounty';
      amount: number;
      captainBountyBonus?: boolean;
      treasureReward?: boolean;
      roleAdjustedAmount?: RoleAdjustedAmount;
    }
  | {
      type: 'hull-damage';
      amount: number;
      protectedByShipwright?: boolean;
      idealRole?: ShipRole;
      idealRoleAmount?: number;
      roleAdjustedAmount?: RoleAdjustedAmount;
    }
  | { type: 'artifact'; artifactId: ArtifactId }
  | { type: 'recruit'; characterId: CharacterId; preferredRoles?: ShipRole[] }
  | { type: 'guest'; action: 'add' | 'remove'; characterId: CharacterId }
  | { type: 'restore'; target: 'hull' | 'move-pp' }
  | { type: 'heal'; target: 'active-party' | 'crew'; percent: number }
  | { type: 'hull-repair'; amount: number; roleAdjustedAmount?: RoleAdjustedAmount }
  | { type: 'checkpoint' }
  | { type: 'route'; branch: string; nodeId: string }
  | {
      type: 'pack';
      packId: CardPackId;
      resume?: {
        phase: RunPhase;
        activeArcId: StoryArcId;
        currentNodeId: string;
      };
    };

export interface RoleAdjustedAmount {
  role: ShipRole;
  standard: number;
  ideal: number;
}
