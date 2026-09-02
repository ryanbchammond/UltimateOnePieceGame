import { useEffect } from 'react';
import {
  desperateStrike,
  getEffectiveMoveElement,
  getCurrentFighter,
  getRemainingPp,
  getUsableMoves,
} from '../combat/engine';
import {
  elementLabels,
  elementOrder,
  typeEffectiveness,
} from '../combat/typeEffectiveness';
import type { Fighter, Move } from '../combat/types';
import { useBattleStore } from '../store/battleStore';

function HpBar({ fighter }: { fighter: Fighter }) {
  const percentage = Math.max(0, (fighter.hp / fighter.maxHp) * 100);
  return (
    <div className="hp-track" aria-label={`${fighter.hp} of ${fighter.maxHp} health`}>
      <span style={{ width: `${percentage}%` }} />
    </div>
  );
}

function FighterCard({
  fighter,
  targetable,
  revealBattleIq,
}: {
  fighter: Fighter;
  targetable: boolean;
  revealBattleIq: boolean;
}) {
  const selectedTargetId = useBattleStore((state) => state.selectedTargetId);
  const selectTarget = useBattleStore((state) => state.selectTarget);
  const defeated = fighter.hp === 0;
  const className = [
    'fighter-card',
    selectedTargetId === fighter.id ? 'selected' : '',
    defeated ? 'defeated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={className}
      disabled={!targetable || defeated}
      onClick={() => selectTarget(fighter.id)}
      type="button"
    >
      <span className="fighter-name">{fighter.name}</span>
      <span className="fighter-element">
        {fighter.types.map((type) => elementLabels[type]).join(' · ')}
        {fighter.devilFruitUser ? ' · Devil Fruit' : ''}
        {revealBattleIq && fighter.side === 'enemy' && fighter.battleIq !== undefined
          ? ` · Battle IQ ${fighter.battleIq}`
          : ''}
      </span>
      <HpBar fighter={fighter} />
      <span className="hp-value">
        {fighter.hp}/{fighter.maxHp} HP
      </span>
      {fighter.activeEffects.length > 0 && (
        <span className="fighter-effects" aria-label="Active combat effects">
          {fighter.activeEffects.map((effect) => (
            <span key={`${effect.effect}-${effect.name}`}>
              {effect.effect === 'guard'
                ? `Guard ${effect.damageReductionPercent}%`
                : `${effect.stat === 'attack' ? 'ATK' : 'DEF'} ${effect.modifierPercent > 0 ? '+' : ''}${effect.modifierPercent}% · ${effect.remainingRounds}r${effect.damageTypeOverride ? ` · ${elementLabels[effect.damageTypeOverride]} attacks` : ''}`}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}

function describeMove(move: Move, fighter?: Fighter): string {
  const effectiveElement = fighter ? getEffectiveMoveElement(fighter, move) : move.element;
  const element = elementLabels[effectiveElement];
  const converted = effectiveElement !== move.element ? ' · converted' : '';
  if (move.id === desperateStrike.id) {
    return `${element}${converted} · ${desperateStrike.power} power · no PP required`;
  }
  if (move.effect === 'damage') return `${element}${converted} · ${move.power} power · one enemy`;
  if (move.effect === 'multi-target') {
    return `${element}${converted} · ${move.power} power · up to ${move.maxTargets} enemies`;
  }
  if (move.effect === 'guard') {
    return `self · ${move.damageReductionPercent}% damage guard`;
  }
  const stat = move.stat === 'attack' ? 'ATK' : 'DEF';
  const amount = `${move.modifierPercent > 0 ? '+' : ''}${move.modifierPercent}% ${stat}`;
  return `${move.target} · ${amount} · ${move.durationRounds} rounds${move.damageTypeOverride ? ` · attacks become ${elementLabels[move.damageTypeOverride]}` : ''}`;
}

function TypeGuide() {
  return (
    <details className="type-guide">
      <summary>Type effectiveness guide</summary>
      <p>
        Each row is an attacking type. Defenders may have up to three types; their matchups multiply
        and are capped between 0.25× and 4× before Devil Fruit rules. Water attacks deal at least 4× damage to Devil Fruit users,
        rising to 4.5× or 5× when their type is already weak to Water. Magic covers Haki, Light,
        Darkness, Gravity, and other powers outside the remaining eleven types.
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

interface BattleHudProps {
  onVictory?: () => void;
  onDefeat?: () => void;
  revealBattleIq?: boolean;
}

export function BattleHud({ onVictory, onDefeat, revealBattleIq = false }: BattleHudProps) {
  const battle = useBattleStore((state) => state.battle);
  const useMove = useBattleStore((state) => state.useMove);
  const takeEnemyTurn = useBattleStore((state) => state.takeEnemyTurn);
  const restart = useBattleStore((state) => state.restart);
  const current = getCurrentFighter(battle);
  const isPlayerTurn = current?.side === 'player';
  const usableMoves = current ? getUsableMoves(current) : [];
  const allAuthoredMovesDepleted = current
    ? current.moves.every((move) => getRemainingPp(current, move) === 0)
    : false;
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

  const playerCrew = battle.fighters.filter((fighter) => fighter.side === 'player');
  const enemies = battle.fighters.filter((fighter) => fighter.side === 'enemy');
  const remainingTurns = battle.turnOrder.slice(battle.turnIndex).map((id) =>
    battle.fighters.find((fighter) => fighter.id === id),
  );

  return (
    <section className="battle-hud" aria-label="Combat controls">
      <div className="initiative-bar">
        <span className="round-label">Round {battle.round}</span>
        <div className="turn-order" aria-label="Remaining initiative order">
          {remainingTurns.map(
            (fighter, index) =>
              fighter &&
              fighter.hp > 0 && (
                <span className={index === 0 ? 'current' : ''} key={fighter.id}>
                  {fighter.name}
                </span>
              ),
          )}
        </div>
      </div>

      {battle.lastAction && (
        <div className={`action-callout ${battle.lastAction.side}`} aria-live="assertive">
          <span>{battle.lastAction.actorName}</span>
          <strong>{battle.lastAction.moveName}</strong>
          <small>Target: {battle.lastAction.targetNames.join(', ')}</small>
        </div>
      )}

      <div className="crew-panels">
        <div className="crew-panel">
          <p className="panel-label">Straw Hat crew</p>
          <div className="fighter-grid">
            {playerCrew.map((fighter) => (
              <FighterCard
                fighter={fighter}
                key={fighter.id}
                revealBattleIq={false}
                targetable={false}
              />
            ))}
          </div>
        </div>

        <div className="turn-panel">
          {battle.status === 'active' && current ? (
            <>
              <p className="panel-label">Current turn</p>
              <h2>{current.name}</h2>
              {isPlayerTurn ? (
                <>
                  <p className="turn-prompt">
                    Choose an enemy for attacks or debuffs. Self moves target {current.name}.
                  </p>
                  <div className="move-list">
                    {current.moves.map((move) => (
                      <button
                        disabled={getRemainingPp(current, move) === 0}
                        onClick={() => useMove(move.id)}
                        type="button"
                        key={move.id}
                      >
                        <span>
                          {move.name}
                          <b>{getRemainingPp(current, move)}/{move.maxPp} PP</b>
                        </span>
                        <small>{describeMove(move, current)}</small>
                      </button>
                    ))}
                    {allAuthoredMovesDepleted && usableMoves[0]?.id === desperateStrike.id && (
                      <button onClick={() => useMove(desperateStrike.id)} type="button">
                        <span>{desperateStrike.name}<b>Emergency</b></span>
                        <small>{describeMove(desperateStrike, current)}</small>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="enemy-thinking">Enemy is choosing an attack…</p>
              )}
            </>
          ) : (
            <div className={`battle-result ${battle.status}`}>
              <p className="panel-label">Battle complete</p>
              <h2>{battle.status === 'victory' ? 'Victory!' : 'Crew defeated'}</h2>
              <button onClick={finishBattle} type="button">
                {battle.status === 'victory' && onVictory
                  ? 'Claim rewards'
                  : battle.status === 'defeat' && onDefeat
                    ? 'Return to checkpoint'
                    : 'Battle again'}
              </button>
            </div>
          )}
        </div>

        <div className="crew-panel enemy-panel">
          <p className="panel-label">Enemy crew · select target</p>
          <div className="fighter-grid">
            {enemies.map((fighter) => (
              <FighterCard
                fighter={fighter}
                key={fighter.id}
                revealBattleIq={revealBattleIq}
                targetable={isPlayerTurn}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="battle-log" aria-live="polite">
        <p className="panel-label">Battle log</p>
        <ol>
          {battle.log.slice(-5).map((entry) => (
            <li className={entry.tone} key={entry.id}>
              {entry.message}
            </li>
          ))}
        </ol>
      </div>
      <TypeGuide />
    </section>
  );
}
