import { useEffect, type ReactNode } from 'react';
import {
  desperateStrike,
  getEffectiveMoveElement,
  getCurrentFighter,
  getRemainingPp,
  getUsableMoves,
  getValidTargets,
} from '../combat/engine';
import {
  describeMultiplier,
  elementLabels,
  elementOrder,
  getTypeMultiplier,
  typeEffectiveness,
} from '../combat/typeEffectiveness';
import type { Fighter, Move } from '../combat/types';
import { useBattleStore } from '../store/battleStore';

function HpBar({ fighter }: { fighter: Fighter }) {
  const percentage = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  return (
    <div className="hp-track" aria-hidden="true">
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

function describeMove(move: Move, fighter?: Fighter): string {
  const effectiveElement = fighter ? getEffectiveMoveElement(fighter, move) : move.element;
  const element = elementLabels[effectiveElement];
  const converted = effectiveElement !== move.element ? ' · converted' : '';
  const target = move.target === 'self'
    ? 'self'
    : move.target === 'ally'
      ? 'one ally (self allowed)'
      : move.target === 'enemy-group'
        ? `up to ${move.maxTargets} enemies`
        : 'one enemy';
  const effects = move.effects.map((effect) => {
    if (effect.effect === 'damage') {
      const condition = effect.conditionalBonus
        ? ` (+${effect.conditionalBonus.power} power when ${effect.conditionalBonus.condition.replaceAll('-', ' ')})`
        : '';
      return `${effect.power} power${condition}`;
    }
    if (effect.effect === 'guard') return `${effect.damageReductionPercent}% Guard`;
    if (effect.effect === 'remove-guard') return 'break Guard';
    if (effect.effect === 'heal') return `heal ${effect.maxHpPercent}% max HP`;
    if (effect.effect === 'cleanse') return 'cleanse negative effects';
    if (effect.effect === 'damage-over-time') {
      return `${effect.statusName}: ${effect.maxHpPercent}% max HP for ${effect.durationTurns} turns`;
    }
    const stat = effect.stat === 'attack' ? 'ATK' : effect.stat === 'defense' ? 'DEF' : 'SPD';
    const amount = `${effect.modifierPercent > 0 ? '+' : ''}${effect.modifierPercent}% ${stat}`;
    return `${amount} for ${effect.durationTurns} turns${effect.damageTypeOverride ? `; attacks become ${elementLabels[effect.damageTypeOverride]}` : ''}`;
  }).join(' → ');
  return `${element}${converted} · ${target} · ${effects}${move.id === desperateStrike.id ? ' · no PP required' : ''}`;
}

function fighterTypeLabel(fighter: Fighter): string {
  return fighter.types.map((type) => elementLabels[type]).join(' · ');
}

function TypeGuide() {
  return (
    <details className="type-guide">
      <summary>Full type guide</summary>
      <p>
        Each row is an attacking type. Defender matchups multiply and cap between 0.25× and 4×
        before Devil Fruit rules. Water attacks deal Devil Fruit users at least 4× damage, rising
        to 4.5× or 5× when their type is already weak to Water. Magic covers Haki and otherwise
        unclassified powers.
      </p>
      <div className="type-guide-grid">
        {elementOrder.map((attackType) => {
          const strong = elementOrder.filter(
            (defenderType) => typeEffectiveness[attackType][defenderType] > 1,
          );
          const resisted = elementOrder.filter(
            (defenderType) => typeEffectiveness[attackType][defenderType] < 1,
          );
          return (
            <div key={attackType}>
              <strong>{elementLabels[attackType]}</strong>
              <small>
                Strong: {strong.map((type) => `${elementLabels[type]} ${typeEffectiveness[attackType][type]}×`).join(', ') || 'none'}
              </small>
              <small>
                Resisted: {resisted.map((type) => `${elementLabels[type]} ${typeEffectiveness[attackType][type]}×`).join(', ') || 'none'}
              </small>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function TargetSelector({
  fighters,
  isPlayerTurn,
  selectedTargetId,
}: {
  fighters: Fighter[];
  isPlayerTurn: boolean;
  selectedTargetId: string;
}) {
  const selectTarget = useBattleStore((state) => state.selectTarget);

  return (
    <section className="target-selector" aria-labelledby="target-selector-heading">
      <div className="sidebar-heading">
        <p className="panel-label" id="target-selector-heading">Target</p>
        <small>{isPlayerTurn ? 'Select here or on the battlefield' : 'Locked during enemy turn'}</small>
      </div>
      <div className="target-list">
        {fighters.map((fighter) => {
          const defeated = fighter.hp === 0;
          const selected = selectedTargetId === fighter.id && !defeated;
          return (
            <button
              aria-label={`${fighter.name}, ${fighter.side === 'player' ? 'ally' : 'enemy'}, ${fighter.hp} of ${fighter.maxHp} HP, ${fighterTypeLabel(fighter)}${fighter.devilFruitUser ? ', Devil Fruit user' : ''}`}
              aria-pressed={selected}
              className={selected ? 'selected' : ''}
              disabled={!isPlayerTurn || defeated}
              key={fighter.id}
              onClick={() => selectTarget(fighter.id)}
              type="button"
            >
              <span>
                <strong>{fighter.name} <small>{fighter.side === 'player' ? 'Ally' : 'Enemy'}</small></strong>
                <b>{defeated ? 'KO' : `${fighter.hp}/${fighter.maxHp}`}</b>
              </span>
              <HpBar fighter={fighter} />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ContextualTips({ current, target }: { current: Fighter | null; target?: Fighter }) {
  const tips: string[] = [];

  if (!current) {
    tips.push('The battle is resolved. Continue to claim the outcome.');
  } else if (current.side === 'enemy') {
    tips.push(`${current.name} is choosing an action. The initiative strip shows who acts next.`);
  } else if (!target) {
    tips.push('Choose a living fighter on the battlefield or in the accessible target list.');
  } else if (target.side === current.side) {
    tips.push(`Selected ally: ${target.name} · ${target.hp}/${target.maxHp} HP.`);
    if (target.activeEffects.some((effect) =>
      effect.effect === 'damage-over-time' ||
      (effect.effect === 'stat' && effect.modifierPercent < 0))) {
      tips.push(`${target.name} has a negative effect that can be cleansed.`);
    }
  } else {
    const damagingMoves = getUsableMoves(current).filter(
      (move) => move.effects.some((effect) => effect.effect === 'damage'),
    );
    const rankedMoves = damagingMoves
      .map((move) => {
        const effectiveType = getEffectiveMoveElement(current, move);
        return {
          move,
          multiplier: getTypeMultiplier(effectiveType, target.types, target.devilFruitUser),
        };
      })
      .sort((left, right) => right.multiplier - left.multiplier);
    const best = rankedMoves[0];

    tips.push(`Current target: ${target.name} · ${fighterTypeLabel(target)}${target.devilFruitUser ? ' · Devil Fruit' : ''}.`);
    if (best) {
      tips.push(`${best.move.name} is ${describeMultiplier(best.multiplier).toLowerCase()} against this target.`);
    }
    if (target.activeEffects.some((effect) => effect.effect === 'guard')) {
      tips.push(`${target.name} is guarding and will reduce incoming damage.`);
    }
    if (current.moves.every((move) => getRemainingPp(current, move) === 0)) {
      tips.push('All authored moves are depleted. Desperate Strike remains available.');
    }
  }

  return (
    <section className="battle-tips" aria-labelledby="battle-tips-heading">
      <p className="panel-label" id="battle-tips-heading">Combat tips</p>
      <ul>
        {tips.map((tip) => <li key={tip}>{tip}</li>)}
      </ul>
    </section>
  );
}

interface BattleHudProps {
  battlefield: ReactNode;
  onVictory?: () => void;
  onDefeat?: () => void;
  revealBattleIq?: boolean;
}

export function BattleHud({
  battlefield,
  onVictory,
  onDefeat,
  revealBattleIq = false,
}: BattleHudProps) {
  const battle = useBattleStore((state) => state.battle);
  const selectedTargetId = useBattleStore((state) => state.selectedTargetId);
  const useMove = useBattleStore((state) => state.useMove);
  const takeEnemyTurn = useBattleStore((state) => state.takeEnemyTurn);
  const restart = useBattleStore((state) => state.restart);
  const current = getCurrentFighter(battle);
  const isPlayerTurn = current?.side === 'player';
  const usableMoves = current ? getUsableMoves(current) : [];
  const allAuthoredMovesDepleted = current
    ? current.moves.every((move) => getRemainingPp(current, move) === 0)
    : false;
  const enemies = battle.fighters.filter((fighter) => fighter.side === 'enemy');
  const selectedTarget = battle.fighters.find(
    (fighter) => fighter.id === selectedTargetId && fighter.hp > 0,
  );
  const remainingTurns = battle.turnOrder.slice(battle.turnIndex).map((id) =>
    battle.fighters.find((fighter) => fighter.id === id),
  );

  const finishBattle = () => {
    if (battle.status === 'victory' && onVictory) {
      onVictory();
    } else if (battle.status === 'defeat' && onDefeat) {
      onDefeat();
    } else {
      restart();
    }
  };

  useEffect(() => {
    if (current?.side !== 'enemy' || battle.status !== 'active') return;
    const timer = window.setTimeout(takeEnemyTurn, 650);
    return () => window.clearTimeout(timer);
  }, [battle.round, battle.status, battle.turnIndex, current?.id, takeEnemyTurn]);

  return (
    <section className="battle-hud" aria-label="Combat controls">
      <div className="battle-main-column">
        <div className="initiative-bar">
          <span className="round-label">Round {battle.round}</span>
          <div className="turn-order" aria-label="Remaining initiative order">
            {remainingTurns.map(
              (fighter, index) => fighter && fighter.hp > 0 && (
                <span
                  className={`${index === 0 ? 'current' : ''} ${fighter.side}`}
                  key={fighter.id}
                >
                  {fighter.name}
                </span>
              ),
            )}
          </div>
        </div>

        {battlefield}

        <section className="move-tray" aria-labelledby="move-tray-heading">
          {battle.status === 'active' && current ? (
            <>
              <div className="move-tray-heading">
                <div>
                  <p className="panel-label" id="move-tray-heading">Current turn</p>
                  <h2>{current.name}</h2>
                </div>
                <p>
                  {isPlayerTurn
                    ? selectedTarget
                      ? `Selected ${selectedTarget.name}`
                      : 'Select a living fighter'
                    : 'Enemy is choosing an action…'}
                </p>
              </div>
              {isPlayerTurn && (
                <div className="move-list">
                  {current.moves.map((move) => {
                    const remainingPp = getRemainingPp(current, move);
                    const validTargets = getValidTargets(battle, current, move);
                    const hasValidSelection = move.target === 'self' || validTargets.some(
                      (fighter) => fighter.id === selectedTargetId,
                    );
                    return (
                      <button
                        disabled={remainingPp === 0 || !hasValidSelection}
                        onClick={() => useMove(move.id)}
                        type="button"
                        key={move.id}
                      >
                        <span>
                          {move.name}
                          <b>{remainingPp}/{move.maxPp} PP</b>
                        </span>
                        <small>{describeMove(move, current)}</small>
                        {remainingPp === 0
                          ? <em>Depleted</em>
                          : !hasValidSelection && <em>Select a valid {move.target === 'ally' ? 'ally' : 'enemy'}</em>}
                      </button>
                    );
                  })}
                  {allAuthoredMovesDepleted && usableMoves[0]?.id === desperateStrike.id && (
                    <button onClick={() => useMove(desperateStrike.id)} type="button">
                      <span>{desperateStrike.name}<b>Emergency</b></span>
                      <small>{describeMove(desperateStrike, current)}</small>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`battle-result ${battle.status}`}>
              <div>
                <p className="panel-label" id="move-tray-heading">Battle complete</p>
                <h2>{battle.status === 'victory' ? 'Victory!' : 'Crew defeated'}</h2>
              </div>
              <button onClick={finishBattle} type="button">
                {battle.status === 'victory' && onVictory
                  ? 'Claim rewards'
                  : battle.status === 'defeat' && onDefeat
                    ? 'Return to checkpoint'
                    : 'Battle again'}
              </button>
            </div>
          )}
        </section>
      </div>

      <aside className="combat-sidebar" aria-label="Combat information">
        <TargetSelector
          fighters={battle.fighters}
          isPlayerTurn={Boolean(isPlayerTurn)}
          selectedTargetId={selectedTargetId}
        />

        {battle.lastAction && (
          <div className={`action-callout ${battle.lastAction.side}`} aria-live="assertive">
            <span>{battle.lastAction.actorName}</span>
            <strong>{battle.lastAction.moveName}</strong>
            <small>Target: {battle.lastAction.targetNames.join(', ')}</small>
          </div>
        )}

        <div className="battle-log" role="log" aria-live="polite" aria-relevant="additions">
          <div className="sidebar-heading">
            <p className="panel-label">Battle log</p>
            <small>{battle.log.length} recent events</small>
          </div>
          <ol>
            {[...battle.log].reverse().map((entry) => (
              <li className={entry.tone} key={entry.id}>
                {entry.message}
              </li>
            ))}
          </ol>
        </div>

        <ContextualTips current={current} target={selectedTarget} />
        {revealBattleIq && (
          <p className="battle-iq-readout">
            Enemy Battle IQ: {enemies.map((enemy) => `${enemy.name} ${enemy.battleIq}`).join(' · ')}
          </p>
        )}
        <TypeGuide />
      </aside>
    </section>
  );
}
