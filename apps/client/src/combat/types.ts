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

export type TargetMode = 'self' | 'ally' | 'enemy' | 'enemy-group';
export type CombatStat = 'attack' | 'defense' | 'speed';
export type DamageCondition = 'target-negative-effect' | 'target-guarding' | 'actor-below-half-hp';

export interface DamageEffect {
  effect: 'damage';
  power: number;
  conditionalBonus?: {
    condition: DamageCondition;
    power: number;
  };
}

export interface GuardEffectDefinition {
  effect: 'guard';
  damageReductionPercent: number;
}

export interface StatEffectDefinition {
  effect: 'stat';
  statusId: string;
  stat: CombatStat;
  modifierPercent: number;
  durationTurns: number;
  damageTypeOverride?: Element;
}

export interface DamageOverTimeEffectDefinition {
  effect: 'damage-over-time';
  statusId: string;
  statusName: string;
  maxHpPercent: number;
  durationTurns: number;
}

export interface HealEffect {
  effect: 'heal';
  maxHpPercent: number;
}

export interface CleanseEffect {
  effect: 'cleanse';
}

export interface RemoveGuardEffect {
  effect: 'remove-guard';
}

export type MoveEffect =
  | DamageEffect
  | GuardEffectDefinition
  | StatEffectDefinition
  | DamageOverTimeEffectDefinition
  | HealEffect
  | CleanseEffect
  | RemoveGuardEffect;

export interface Move {
  id: string;
  name: string;
  element: Element;
  maxPp: number;
  target: TargetMode;
  maxTargets?: number;
  effects: MoveEffect[];
}

export interface GuardEffect {
  effect: 'guard';
  statusId: string;
  name: string;
  damageReductionPercent: number;
}

export interface StatEffect {
  effect: 'stat';
  statusId: string;
  name: string;
  stat: CombatStat;
  modifierPercent: number;
  remainingTurns: number;
  skipNextAdvance: boolean;
  damageTypeOverride?: Element;
}

export interface DamageOverTimeEffect {
  effect: 'damage-over-time';
  statusId: string;
  name: string;
  maxHpPercent: number;
  remainingTurns: number;
  skipNextAdvance: boolean;
}

export type ActiveEffect = GuardEffect | StatEffect | DamageOverTimeEffect;

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
  initialHp?: number;
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
