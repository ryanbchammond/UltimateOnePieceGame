export type GameMode = 'story';
export type Difficulty = 'landlubber';
export type RunPhase = 'setup' | 'map' | 'node' | 'battle' | 'victory';
export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythical';
export type NodeService = 'crew-assignments' | 'tavern';
export type StoryArcId = 'east-blue-prototype' | 'romance-dawn' | 'orange-town';
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
  | 'buggys-big-top';
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
  | 'smoker';
export type CharacterCapability = 'observation-haki';
export type ArtifactId = 'weathered-log-pose';
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
export type CardPackId = 'baratie-east-blue' | 'romance-dawn' | 'orange-town';

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
  source: 'paid' | 'arc-reward';
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
  packsOpened: number;
  pendingPack: CardPackOpening | null;
  crewAssignmentWindow: 'card-pull' | null;
  latestReward: RewardReceipt | null;
  rewardPending?: boolean;
  rewardDestinationNodeId?: string | null;
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
    }
  | {
      type: 'hull-damage';
      amount: number;
      protectedByShipwright?: boolean;
      idealRole?: ShipRole;
      idealRoleAmount?: number;
    }
  | { type: 'artifact'; artifactId: ArtifactId }
  | { type: 'recruit'; characterId: CharacterId; preferredRoles?: ShipRole[] }
  | { type: 'guest'; action: 'add' | 'remove'; characterId: CharacterId }
  | { type: 'restore'; target: 'hull' | 'move-pp' }
  | { type: 'hull-repair'; amount: number }
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
