import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import {
  baratieCardPack,
  createCardPackOpening,
  currentMaxStarLevel,
  firstStarUpgradeCost,
} from '../cards/packs';
import {
  getCrewCharacter,
} from '../crew/characters';
import { applyShipwrightProtection } from '../crew/roleEffects';
import {
  activeStoryContent,
  getStoryArc,
  getStoryNode,
  isNodeAvailable,
  nodeOffersService,
  storyNodeChoices,
} from '../run/storyContent';
import {
  applyStoryConsequences,
  canResolveStoryChoice,
} from '../run/storyConsequences';
import type {
  CardPackOpening,
  CharacterId,
  RewardChange,
  RewardReceipt,
  RunSnapshot,
  ShipRole,
} from '../run/types';

interface RunStoreState extends RunSnapshot {
  startRun: () => void;
  enterNode: (nodeId: string) => boolean;
  resolveNode: (choiceId: string) => boolean;
  resolveBattle: (outcome: 'victory' | 'defeat') => void;
  assignCrewRole: (characterId: CharacterId | null, role: ShipRole) => boolean;
  addActiveMember: (characterId: CharacterId) => boolean;
  removeActiveMember: (characterId: CharacterId) => boolean;
  swapActiveMember: (incomingId: CharacterId, outgoingId: CharacterId) => boolean;
  openCardPack: (random?: () => number) => CardPackOpening | null;
  revealPackCard: (cardId: string) => boolean;
  claimPackCard: (cardId: string) => boolean;
  setCharacterMovePp: (characterId: CharacterId, moveId: string, remainingPp: number) => void;
  upgradeCharacter: (characterId: CharacterId) => boolean;
  abandonRun: () => void;
}

export function canManageShipAssignments(
  run: Pick<RunSnapshot, 'currentNodeId' | 'crewAssignmentWindow'>,
): boolean {
  return (
    run.crewAssignmentWindow === 'card-pull' ||
    nodeOffersService(run.currentNodeId, 'crew-assignments')
  );
}

function initialSnapshot(): RunSnapshot {
  const arc = getStoryArc(activeStoryContent.startArcId);
  if (!arc) throw new Error(`Missing starting story arc: ${activeStoryContent.startArcId}`);
  const start = arc.start;
  return {
    phase: 'setup',
    mode: 'story',
    difficulty: 'landlubber',
    activeArcId: arc.id,
    berries: start.berries,
    bounty: 0,
    hull: start.hull,
    maxHull: start.maxHull,
    completedNodeIds: [],
    visitedNodeIds: [],
    currentNodeId: null,
    checkpointNodeId: start.nodeId,
    chosenBranches: {},
    artifacts: [],
    journal: [],
    rosterIds: [...start.rosterIds],
    guestIds: [...start.guestIds],
    activePartyIds: [...start.activePartyIds],
    roleAssignments: { ...start.roleAssignments },
    characterShards: {},
    characterStars: {},
    characterMovePp: {},
    packsOpened: 0,
    pendingPack: null,
    crewAssignmentWindow: null,
    latestReward: null,
  };
}

function newRunSnapshot(): RunSnapshot {
  const snapshot = initialSnapshot();
  const arc = getStoryArc(snapshot.activeArcId)!;
  return {
    ...snapshot,
    phase: arc.start.phase,
    completedNodeIds: arc.start.phase === 'map' ? [arc.start.nodeId] : [],
    visitedNodeIds: [arc.start.nodeId],
    currentNodeId: arc.start.nodeId,
    chosenBranches: {},
    artifacts: [],
    journal: [arc.start.journalEntry],
  };
}

const memoryValues = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memoryValues.get(name) ?? null,
  setItem: (name, value) => memoryValues.set(name, value),
  removeItem: (name) => memoryValues.delete(name),
};

export const runStorageKey = 'uopa-story-dev-v4';
export const obsoleteRunStorageKeys = [
  'uopa-east-blue-story-v1',
  'uopa-story-dev-v1',
  'uopa-story-dev-v2',
  'uopa-story-dev-v3',
];

export function clearObsoleteRunStorage(storage: StateStorage): void {
  obsoleteRunStorageKeys.forEach((key) => storage.removeItem(key));
}

function getRunStorage(): StateStorage {
  const storage = typeof window === 'undefined' ? memoryStorage : window.localStorage;
  clearObsoleteRunStorage(storage);
  return storage;
}

const runStorage = createJSONStorage(getRunStorage);

export function migrateRunState(persistedState: unknown, version: number): RunSnapshot {
  if (version >= 2) return persistedState as RunSnapshot;
  if (version < 1 || !persistedState || typeof persistedState !== 'object') {
    return initialSnapshot();
  }

  const snapshot = persistedState as RunSnapshot;
  return {
    ...snapshot,
    visitedNodeIds: [
      ...new Set([
        ...snapshot.completedNodeIds,
        ...(snapshot.currentNodeId ? [snapshot.currentNodeId] : []),
      ]),
    ],
  };
}

function createRewardReceipt(
  state: RunSnapshot,
  title: string,
  detail: string,
  changes: RewardChange[],
): RewardReceipt {
  return {
    id: `${state.currentNodeId ?? 'voyage'}-${state.journal.length + 1}-${title}`,
    title,
    detail,
    changes,
  };
}

function signed(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString()}`;
}

function completeCurrentNode(state: RunStoreState, journalEntry: string): Partial<RunStoreState> {
  const node = getStoryNode(state.currentNodeId);
  if (!node) return {};

  return {
    phase: 'map',
    completedNodeIds: [...new Set([...state.completedNodeIds, node.id])],
    visitedNodeIds: [...new Set([...state.visitedNodeIds, node.id])],
    chosenBranches: node.branch
      ? { ...state.chosenBranches, [node.branch]: node.id }
      : state.chosenBranches,
    journal: [...state.journal, journalEntry].slice(-12),
    pendingPack: null,
    crewAssignmentWindow: null,
  };
}

export const useRunStore = create<RunStoreState>()(
  persist(
    (set, get) => ({
      ...initialSnapshot(),

      startRun: () => set(newRunSnapshot()),

      enterNode: (nodeId) => {
        const state = get();
        const node = getStoryNode(nodeId);
        if (!node || node.arcId !== state.activeArcId || !isNodeAvailable(state, node)) return false;

        set({
          currentNodeId: node.id,
          visitedNodeIds: [...new Set([...state.visitedNodeIds, node.id])],
          phase: node.type === 'battle' || node.type === 'boss' ? 'battle' : 'node',
          pendingPack: null,
          crewAssignmentWindow: null,
          latestReward: null,
        });
        return true;
      },

      resolveNode: (choiceId) => {
        const state = get();
        const node = getStoryNode(state.currentNodeId);
        const choice = node
          ? storyNodeChoices[node.id]?.find((candidate) => candidate.id === choiceId)
          : null;
        if (state.phase !== 'node' || !node || !choice || state.pendingPack) return false;
        if (!canResolveStoryChoice(state, choice)) return false;

        const completed = {
          ...state,
          ...completeCurrentNode(state, choice.outcome.journalEntry),
        };
        const resolution = applyStoryConsequences(completed, node, choice);
        set({
          ...resolution.snapshot,
          latestReward: createRewardReceipt(
            state,
            choice.outcome.title,
            choice.outcome.detail,
            resolution.changes,
          ),
        });

        return true;
      },

      resolveBattle: (outcome) => {
        const state = get();
        const node = getStoryNode(state.currentNodeId);
        if (state.phase !== 'battle' || !node) return;

        if (outcome === 'defeat') {
          const hullDamage = applyShipwrightProtection(10, state.roleAssignments);
          const checkpointIsRest = getStoryNode(state.checkpointNodeId)?.type === 'rest';
          set({
            phase: 'map',
            currentNodeId: state.checkpointNodeId,
            hull: Math.max(1, state.hull - hullDamage),
            characterMovePp: checkpointIsRest ? {} : state.characterMovePp,
            journal: [...state.journal, `Defeat at ${node.name}. The crew returned to its checkpoint.`].slice(
              -12,
            ),
            latestReward: createRewardReceipt(
              state,
              `Defeat at ${node.name}`,
              'The crew returned to its latest checkpoint.',
              [
                { label: 'Hull', value: signed(-hullDamage), tone: hullDamage > 0 ? 'negative' : 'neutral' },
                { label: 'Checkpoint', value: getStoryNode(state.checkpointNodeId)?.name ?? state.checkpointNodeId, tone: 'neutral' },
                ...(checkpointIsRest
                  ? [{ label: 'Move PP', value: 'Fully restored', tone: 'positive' as const }]
                  : []),
              ],
            ),
          });
          return;
        }

        const victory = node.victory;
        if (!victory) return;
        const completed = {
          ...state,
          ...completeCurrentNode(state, victory.journalEntry),
        };
        const resolution = applyStoryConsequences(completed, node, victory);
        set({
          ...resolution.snapshot,
          phase: victory.phase ?? resolution.snapshot.phase,
          latestReward: createRewardReceipt(
            state,
            victory.title,
            victory.detail,
            resolution.changes,
          ),
        });
      },

      assignCrewRole: (characterId, role) => {
        const state = get();
        if (!canManageShipAssignments(state)) return false;
        if (characterId === null) {
          set({ roleAssignments: { ...state.roleAssignments, [role]: null } });
          return true;
        }
        if (!state.rosterIds.includes(characterId)) return false;

        const currentRole = (Object.entries(state.roleAssignments) as Array<
          [ShipRole, CharacterId | null]
        >).find(([, assignedId]) => assignedId === characterId)?.[0];
        if (currentRole === role) return true;

        const displacedCharacter = state.roleAssignments[role];
        const roleAssignments = { ...state.roleAssignments, [role]: characterId };
        if (currentRole) roleAssignments[currentRole] = displacedCharacter;

        set({ roleAssignments });
        return true;
      },

      addActiveMember: (characterId) => {
        const state = get();
        const availableIds = new Set([...state.rosterIds, ...state.guestIds]);
        if (
          !availableIds.has(characterId) ||
          state.activePartyIds.includes(characterId) ||
          state.activePartyIds.length >= 4
        ) {
          return false;
        }
        set({ activePartyIds: [...state.activePartyIds, characterId] });
        return true;
      },

      removeActiveMember: (characterId) => {
        const state = get();
        if (!state.activePartyIds.includes(characterId) || state.activePartyIds.length <= 1) {
          return false;
        }
        set({ activePartyIds: state.activePartyIds.filter((id) => id !== characterId) });
        return true;
      },

      swapActiveMember: (incomingId, outgoingId) => {
        const state = get();
        const outgoingIndex = state.activePartyIds.indexOf(outgoingId);
        const availableIds = new Set([...state.rosterIds, ...state.guestIds]);
        if (
          !availableIds.has(incomingId) ||
          state.activePartyIds.includes(incomingId) ||
          outgoingIndex === -1
        ) {
          return false;
        }

        const activePartyIds = [...state.activePartyIds];
        activePartyIds[outgoingIndex] = incomingId;
        set({ activePartyIds });
        return true;
      },

      openCardPack: (random = Math.random) => {
        const state = get();
        if (
          state.phase !== 'node' ||
          !nodeOffersService(state.currentNodeId, 'tavern') ||
          state.berries < baratieCardPack.cost ||
          state.pendingPack
        ) {
          return null;
        }

        const packNumber = state.packsOpened + 1;
        const opening = createCardPackOpening(baratieCardPack, packNumber, 'paid', random);

        set({
          berries: state.berries - baratieCardPack.cost,
          packsOpened: packNumber,
          pendingPack: opening,
          crewAssignmentWindow: null,
          journal: [...state.journal, 'The crew opened a five-card East Blue pack.'].slice(-12),
          latestReward: createRewardReceipt(
            state,
            'Pack purchased',
            'Five candidates are ready to reveal. Exactly one may be kept.',
            [{ label: 'Berries', value: signed(-baratieCardPack.cost), tone: 'negative' }],
          ),
        });
        return opening;
      },

      revealPackCard: (cardId) => {
        const state = get();
        const pack = state.pendingPack;
        const card = pack?.cards.find((candidate) => candidate.cardId === cardId);
        if (!pack || !card || card.revealed) return false;

        set({
          pendingPack: {
            ...pack,
            cards: pack.cards.map((candidate) =>
              candidate.cardId === cardId ? { ...candidate, revealed: true } : candidate,
            ),
          },
        });
        return true;
      },

      claimPackCard: (cardId) => {
        const state = get();
        const pack = state.pendingPack;
        const selected = pack?.cards.find((card) => card.cardId === cardId);
        if (!pack || !selected || pack.cards.some((card) => !card.revealed)) return false;

        const duplicate = state.rosterIds.includes(selected.characterId);
        const character = getCrewCharacter(selected.characterId);
        const rosterIds = duplicate
          ? state.rosterIds
          : [...state.rosterIds, selected.characterId];
        const characterShards = duplicate
          ? {
              ...state.characterShards,
              [selected.characterId]: (state.characterShards[selected.characterId] ?? 0) + 1,
            }
          : state.characterShards;
        const summary = duplicate
          ? `${character.name} was kept and converted into 1 duplicate shard. The other four cards were lost.`
          : `${character.name} was kept and joined the collection. The other four cards were lost.`;

        const resume = pack.resume;
        set({
          rosterIds,
          characterShards,
          pendingPack: null,
          crewAssignmentWindow: 'card-pull',
          ...(resume
            ? {
                phase: resume.phase,
                activeArcId: resume.activeArcId,
                currentNodeId: resume.currentNodeId,
                visitedNodeIds: [...new Set([...state.visitedNodeIds, resume.currentNodeId])],
              }
            : {}),
          journal: [...state.journal, summary].slice(-12),
          latestReward: createRewardReceipt(
            state,
            duplicate ? 'Duplicate card kept' : 'New card kept',
            'The other four revealed cards were lost.',
            [{
              label: duplicate ? 'Shard' : 'Roster',
              value: duplicate ? `+1 ${character.name}` : `+ ${character.name}`,
              tone: 'positive',
            }],
          ),
        });
        return true;
      },

      setCharacterMovePp: (characterId, moveId, remainingPp) => {
        if (!moveId || !Number.isFinite(remainingPp)) return;
        const state = get();
        set({
          characterMovePp: {
            ...state.characterMovePp,
            [characterId]: {
              ...state.characterMovePp[characterId],
              [moveId]: Math.max(0, Math.floor(remainingPp)),
            },
          },
        });
      },

      upgradeCharacter: (characterId) => {
        const state = get();
        if (!state.rosterIds.includes(characterId)) return false;
        const currentStars = state.characterStars[characterId] ?? 1;
        const shards = state.characterShards[characterId] ?? 0;
        if (currentStars >= currentMaxStarLevel || shards < firstStarUpgradeCost) return false;

        set({
          characterStars: { ...state.characterStars, [characterId]: currentStars + 1 },
          characterShards: {
            ...state.characterShards,
            [characterId]: shards - firstStarUpgradeCost,
          },
          journal: [
            ...state.journal,
            `${getCrewCharacter(characterId).name} reached ${currentStars + 1} stars.`,
          ].slice(-12),
          latestReward: createRewardReceipt(
            state,
            `${getCrewCharacter(characterId).name} upgraded`,
            `Star level increased to ${currentStars + 1}.`,
            [
              { label: 'Shards', value: signed(-firstStarUpgradeCost), tone: 'negative' },
              { label: 'Star level', value: `${currentStars + 1}★`, tone: 'positive' },
            ],
          ),
        });
        return true;
      },

      abandonRun: () => set(initialSnapshot()),
    }),
    {
      name: runStorageKey,
      version: 2,
      storage: runStorage,
      migrate: migrateRunState,
    },
  ),
);
