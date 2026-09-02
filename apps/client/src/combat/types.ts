export type Side = 'player' | 'enemy';

export type Element =
  | 'brawler'
  | 'swordsman'
  | 'sniper'
  | 'fire'
  | 'ice'
  | 'poison'
  | 'water'
  | 'earth'
  | 'lightning'
  | 'nature'
  | 'magic'
  | 'beast';

export type FighterTypes =
  | [Element]
  | [Element, Element]
  | [Element, Element, Element];

interface BaseMove {
  id: string;
  name: string;
  element: Element;
  maxPp: number;
}

export interface DamageMove extends BaseMove {
  effect: 'damage';
  power: number;
}

export interface GuardMove extends BaseMove {
  effect: 'guard';
  damageReductionPercent: number;
}

export interface StatMove extends BaseMove {
  effect: 'stat';
  target: 'self' | 'enemy';
  stat: 'attack' | 'defense';
  modifierPercent: number;
  durationRounds: number;
  damageTypeOverride?: Element;
}

export interface MultiTargetMove extends BaseMove {
  effect: 'multi-target';
  power: number;
  maxTargets: number;
}

export type Move = DamageMove | GuardMove | StatMove | MultiTargetMove;

export interface GuardEffect {
  effect: 'guard';
  name: string;
  damageReductionPercent: number;
}

export interface StatEffect {
  effect: 'stat';
  name: string;
  stat: 'attack' | 'defense';
  modifierPercent: number;
  remainingRounds: number;
  damageTypeOverride?: Element;
}

export type ActiveEffect = GuardEffect | StatEffect;

export interface FighterDefinition {
  id: string;
  name: string;
  side: Side;
  slot: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  types: FighterTypes;
  devilFruitUser: boolean;
  battleIq?: number;
  moves: Move[];
  initialMovePp?: Record<string, number>;
}

export interface Fighter extends FighterDefinition {
  hp: number;
  activeEffects: ActiveEffect[];
  movePp: Record<string, number>;
}

export interface BattleAction {
  actorId: string;
  moveId: string;
  targetId: string;
}

export interface BattleLogEntry {
  id: number;
  message: string;
  tone: 'neutral' | 'damage' | 'effect' | 'faint' | 'round' | 'result';
}

export interface BattleState {
  fighters: Fighter[];
  round: number;
  turnOrder: string[];
  turnIndex: number;
  status: 'active' | 'victory' | 'defeat';
  winner: Side | null;
  log: BattleLogEntry[];
  nextLogId: number;
  lastAction?: {
    actorId: string;
    actorName: string;
    moveName: string;
    targetNames: string[];
    side: Side;
  };
}
