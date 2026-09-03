import { create } from 'zustand';
import { createDemoBattle } from '../combat/demoBattle';
import { getEncounterFighters } from '../combat/eastBlueBattles';
import { createStartingRoleAssignments, startingActivePartyIds } from '../crew/characters';
import {
  chooseEnemyAction,
  createBattle,
  getCurrentFighter,
  getRemainingPp,
  getUsableMoves,
  getValidTargets,
  resolveAction,
} from '../combat/engine';
import type { BattleState } from '../combat/types';
import type { CharacterHp, CharacterId, CharacterMovePp, EncounterId, RoleAssignments } from '../run/types';
import { useRunStore } from './runStore';

interface BattleStoreState {
  battle: BattleState;
  encounterId: EncounterId | null;
  activePartyIds: CharacterId[];
  roleAssignments: RoleAssignments;
  characterStars: Partial<Record<CharacterId, number>>;
  characterMovePp: CharacterMovePp;
  characterHp: CharacterHp;
  selectedTargetId: string;
  selectTarget: (fighterId: string) => void;
  useMove: (moveId: string) => void;
  takeEnemyTurn: () => void;
  startEncounter: (
    encounterId: EncounterId,
    activePartyIds?: CharacterId[],
    roleAssignments?: RoleAssignments,
    characterStars?: Partial<Record<CharacterId, number>>,
    characterMovePp?: CharacterMovePp,
    characterHp?: CharacterHp,
  ) => void;
  restart: () => void;
  reset: () => void;
}

function firstLivingEnemy(battle: BattleState): string {
  return battle.fighters.find((fighter) => fighter.side === 'enemy' && fighter.hp > 0)?.id ?? '';
}

const initialBattle = createDemoBattle();

export const useBattleStore = create<BattleStoreState>((set, get) => ({
  battle: initialBattle,
  encounterId: null,
  activePartyIds: [...startingActivePartyIds],
  roleAssignments: createStartingRoleAssignments(),
  characterStars: {},
  characterMovePp: {},
  characterHp: {},
  selectedTargetId: firstLivingEnemy(initialBattle),

  selectTarget: (fighterId) => {
    const { battle } = get();
    const target = battle.fighters.find(
      (fighter) => fighter.id === fighterId && fighter.hp > 0,
    );
    if (target) set({ selectedTargetId: target.id });
  },

  useMove: (moveId) => {
    const { battle, selectedTargetId, encounterId, characterMovePp, characterHp } = get();
    const actor = getCurrentFighter(battle);
    if (!actor || actor.side !== 'player') return;

    const move = getUsableMoves(actor).find((candidate) => candidate.id === moveId);
    if (!move) return;
    const targets = getValidTargets(battle, actor, move);
    const selectedFighter = battle.fighters.find((fighter) => fighter.id === selectedTargetId);
    const target = move.target === 'self'
      ? actor
      : targets.find((fighter) => fighter.id === selectedTargetId) ??
        (selectedFighter?.hp === 0 ? targets[0] : undefined);
    if (!target) return;

    const nextBattle = resolveAction(battle, {
      actorId: actor.id,
      moveId,
      targetId: target.id,
    });

    const updatedActor = nextBattle.fighters.find((fighter) => fighter.id === actor.id);
    const authoredMove = actor.moves.find((candidate) => candidate.id === move.id);
    const nextCharacterMovePp = authoredMove && updatedActor
      ? {
          ...characterMovePp,
          [actor.id]: {
            ...characterMovePp[actor.id as CharacterId],
            [authoredMove.id]: getRemainingPp(updatedActor, authoredMove),
          },
        }
      : characterMovePp;
    if (encounterId && authoredMove && updatedActor) {
      useRunStore.getState().setCharacterMovePp(
        actor.id as CharacterId,
        authoredMove.id,
        getRemainingPp(updatedActor, authoredMove),
      );
    }
    const nextCharacterHp = encounterId
      ? Object.fromEntries(nextBattle.fighters
          .filter((fighter) => fighter.side === 'player')
          .map((fighter) => [fighter.id, fighter.hp])) as CharacterHp
      : characterHp;
    if (encounterId) useRunStore.getState().setCharacterHealth(nextCharacterHp);

    set({
      battle: nextBattle,
      characterMovePp: nextCharacterMovePp,
      characterHp: { ...characterHp, ...nextCharacterHp },
      selectedTargetId: nextBattle.fighters.find(
        (fighter) => fighter.id === selectedTargetId && fighter.hp > 0,
      )
        ? selectedTargetId
        : firstLivingEnemy(nextBattle),
    });
  },

  takeEnemyTurn: () => {
    const { battle, selectedTargetId, encounterId, characterHp } = get();
    const actor = getCurrentFighter(battle);
    if (!actor || actor.side !== 'enemy') return;
    const nextBattle = resolveAction(battle, chooseEnemyAction(battle));
    const nextCharacterHp = encounterId
      ? Object.fromEntries(nextBattle.fighters
          .filter((fighter) => fighter.side === 'player')
          .map((fighter) => [fighter.id, fighter.hp])) as CharacterHp
      : characterHp;
    if (encounterId) useRunStore.getState().setCharacterHealth(nextCharacterHp);
    set({
      battle: nextBattle,
      characterHp: { ...characterHp, ...nextCharacterHp },
      selectedTargetId: nextBattle.fighters.find(
        (fighter) => fighter.id === selectedTargetId && fighter.hp > 0,
      )
        ? selectedTargetId
        : firstLivingEnemy(nextBattle),
    });
  },

  startEncounter: (
    encounterId,
    activePartyIds = startingActivePartyIds,
    roleAssignments = createStartingRoleAssignments(),
    characterStars = {},
    characterMovePp = {},
    characterHp = {},
  ) => {
    const battle = createBattle(
      getEncounterFighters(
        encounterId,
        activePartyIds,
        roleAssignments,
        characterStars,
        characterMovePp,
        characterHp,
      ),
    );
    set({
      battle,
      encounterId,
      activePartyIds: [...activePartyIds],
      roleAssignments: { ...roleAssignments },
      characterStars: { ...characterStars },
      characterMovePp: { ...characterMovePp },
      characterHp: { ...characterHp },
      selectedTargetId: firstLivingEnemy(battle),
    });
  },

  restart: () => {
    const { encounterId, activePartyIds, roleAssignments, characterStars, characterMovePp, characterHp } = get();
    const battle = encounterId
      ? createBattle(
          getEncounterFighters(
            encounterId,
            activePartyIds,
            roleAssignments,
            characterStars,
            characterMovePp,
            characterHp,
          ),
        )
      : createDemoBattle();
    set({ battle, selectedTargetId: firstLivingEnemy(battle) });
  },

  reset: () => {
    const battle = createDemoBattle();
    set({
      battle,
      encounterId: null,
      activePartyIds: [...startingActivePartyIds],
      roleAssignments: createStartingRoleAssignments(),
      characterStars: {},
      characterMovePp: {},
      characterHp: {},
      selectedTargetId: firstLivingEnemy(battle),
    });
  },
}));
