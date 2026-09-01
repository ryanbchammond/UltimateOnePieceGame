import { useEffect, useRef, useState } from 'react';
import { getArtifactDefinition } from '../artifacts/artifacts';
import {
  baratieCardPack,
  cardRarityLabels,
  cardRarityOrder,
  cardRevealTiers,
  currentMaxStarLevel,
  firstStarUpgradeCost,
  getCardAnimationKey,
} from '../cards/packs';
import {
  getCrewCharacter,
  shipRoleLabels,
  shipRoleOrder,
} from '../crew/characters';
import {
  getRoleEffectLevel,
  getRoleEffectSummary,
} from '../crew/roleEffects';
import {
  getAvailableNodes,
  getStoryNode,
  nodeOffersService,
  storyNodeChoices,
} from '../run/storyContent';
import {
  getChoiceBerryCost,
  getChoiceHullDamage,
  getChoiceRequiredRoles,
} from '../run/storyConsequences';
import type { ArtifactId, CardPullResult, CharacterId, ShipRole, StoryNode } from '../run/types';
import { elementLabels } from '../combat/typeEffectiveness';
import { useBattleStore } from '../store/battleStore';
import { canManageShipAssignments, useRunStore } from '../store/runStore';

function nodeTypeLabel(node: StoryNode): string {
  if (node.type === 'boss') return 'Boss battle';
  if (node.type === 'battle') return 'Combat';
  if (node.type === 'treasure') return 'Treasure';
  if (node.type === 'recruit') return 'Recruitment';
  if (node.type === 'rest') return 'Safe harbor';
  return 'Story event';
}

function ArtifactIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <circle cx="24" cy="25" r="14" />
      <path d="M24 2v8M16 6h16M24 16l5 9-5 9-5-9 5-9Z" />
      <circle cx="24" cy="25" r="2.5" />
    </svg>
  );
}

function ArtifactCollection({ artifactIds }: { artifactIds: ArtifactId[] }) {
  if (artifactIds.length === 0) return <strong className="artifact-empty">None</strong>;

  return (
    <div className="artifact-list" aria-label="Collected artifacts">
      {artifactIds.map((id) => {
        const artifact = getArtifactDefinition(id);
        return (
          <details className="artifact-item" key={id}>
            <summary aria-label={`${artifact.name}. ${artifact.effect}`}>
              <ArtifactIcon />
            </summary>
            <div className="artifact-tooltip">
              <strong>{artifact.name}</strong>
              <span>{artifact.active ? 'Active artifact' : 'Inactive artifact'}</span>
              <p>{artifact.effect}</p>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function RunSetup() {
  const startRun = useRunStore((state) => state.startRun);

  return (
    <section className="setup-screen">
      <div className="setup-copy">
        <p className="eyebrow">Romance Dawn vertical slice</p>
        <h2>Set sail from Foosha Village</h2>
        <p>
          Begin Luffy's voyage, free Coby from Alvida, and choose between an open challenge or an
          infiltration through the pirate ship's hold.
        </p>
      </div>
      <div className="run-settings" aria-label="Run settings">
        <div>
          <span>Mode</span>
          <strong>Story</strong>
          <small>Detailed Romance Dawn journey</small>
        </div>
        <div>
          <span>Difficulty</span>
          <strong>Landlubber</strong>
          <small>Persistent checkpoints on defeat</small>
        </div>
      </div>
      <button className="primary-action" onClick={startRun} type="button">
        Begin voyage
      </button>
    </section>
  );
}

export function RunStatus() {
  const berries = useRunStore((state) => state.berries);
  const bounty = useRunStore((state) => state.bounty);
  const hull = useRunStore((state) => state.hull);
  const maxHull = useRunStore((state) => state.maxHull);
  const artifacts = useRunStore((state) => state.artifacts);

  return (
    <section className="run-status" aria-label="Voyage resources">
      <div>
        <span>Berries</span>
        <strong>{berries.toLocaleString()}</strong>
      </div>
      <div>
        <span>Bounty</span>
        <strong>{bounty.toLocaleString()}</strong>
      </div>
      <div>
        <span>Hull</span>
        <strong>
          {hull}/{maxHull}
        </strong>
      </div>
      <div className="artifact-status">
        <span>Artifacts</span>
        <ArtifactCollection artifactIds={artifacts} />
      </div>
    </section>
  );
}

export function RewardReceiptPanel() {
  const receipt = useRunStore((state) => state.latestReward);
  if (!receipt) return null;

  return (
    <section className="reward-receipt" aria-live="polite" aria-label="Latest voyage rewards">
      <div>
        <p className="panel-label">Latest outcome</p>
        <h2>{receipt.title}</h2>
        <p>{receipt.detail}</p>
      </div>
      <dl>
        {receipt.changes.map((change, index) => (
          <div className={change.tone} key={`${receipt.id}-${change.label}-${index}`}>
            <dt>{change.label}</dt>
            <dd>{change.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function VoyagePanel() {
  const run = useRunStore();
  const enterNode = useRunStore((state) => state.enterNode);
  const abandonRun = useRunStore((state) => state.abandonRun);
  const startEncounter = useBattleStore((state) => state.startEncounter);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterMovePp = useRunStore((state) => state.characterMovePp);
  const availableNodes = getAvailableNodes(run);

  const sailTo = (node: StoryNode) => {
    if (node.encounterId) {
      startEncounter(
        node.encounterId,
        activePartyIds,
        roleAssignments,
        characterStars,
        characterMovePp,
      );
    }
    enterNode(node.id);
  };

  const restartVoyage = () => {
    if (window.confirm('Restart this voyage? Current Story Mode progress will be erased.')) {
      abandonRun();
    }
  };

  return (
    <section className="voyage-panel">
      <div>
        <p className="panel-label">Choose your heading</p>
        <div className="destination-list">
          {availableNodes.map((node) => (
            <button onClick={() => sailTo(node)} type="button" key={node.id}>
              <span>{nodeTypeLabel(node)}</span>
              <strong>{node.name}</strong>
              <small>{node.subtitle}</small>
            </button>
          ))}
          {availableNodes.length === 0 && (
            <p className="empty-crew-note">
              Opening slice complete. Shells Town is the next development chunk.
            </p>
          )}
        </div>
      </div>
      <div className="journal-column">
        <RunJournal />
        <button className="text-action" onClick={restartVoyage} type="button">
          Restart voyage
        </button>
      </div>
    </section>
  );
}

export function NodePanel() {
  const run = useRunStore();
  const nodeId = useRunStore((state) => state.currentNodeId);
  const resolveNode = useRunStore((state) => state.resolveNode);
  const pendingPack = useRunStore((state) => state.pendingPack);
  const node = getStoryNode(nodeId);
  const choices = node ? storyNodeChoices[node.id] ?? [] : [];

  if (!node) return null;

  return (
    <section className="node-panel">
      <p className="eyebrow">{nodeTypeLabel(node)}</p>
      <h2>{node.name}</h2>
      <p>{node.description}</p>
      {nodeOffersService(node.id, 'tavern') && <TavernPanel />}
      <div className="choice-list">
        {choices.map((choice) => {
          const berryCost = getChoiceBerryCost(choice);
          const requiredRoles = getChoiceRequiredRoles(choice);
          const roleLevels = requiredRoles.map((role) => ({
            role,
            level: getRoleEffectLevel(run.roleAssignments, role),
          }));
          const missingRole = roleLevels.some(({ level }) => level === 'inactive');
          const unaffordable = run.berries < berryCost;
          const hullDamage = getChoiceHullDamage(run, choice);
          return (
            <button
              disabled={unaffordable || missingRole || Boolean(pendingPack)}
              onClick={() => resolveNode(choice.id)}
              type="button"
              key={choice.id}
            >
              <strong>{choice.label}</strong>
              <small>{choice.detail}</small>
              {roleLevels.map(({ role, level }) => (
                <span className={`role-check ${level}`} key={role}>
                  {level === 'inactive'
                    ? `${shipRoleLabels[role]} check unavailable`
                    : `${level === 'ideal' ? 'Ideal ' : ''}${shipRoleLabels[role]} check${hullDamage === null ? '' : hullDamage === 0 ? ' · no hull damage' : ` · ${hullDamage} hull damage`}`}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function CrewManager() {
  const rosterIds = useRunStore((state) => state.rosterIds);
  const guestIds = useRunStore((state) => state.guestIds);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterShards = useRunStore((state) => state.characterShards);
  const characterStars = useRunStore((state) => state.characterStars);
  const canAssignRoles = useRunStore(canManageShipAssignments);
  const assignCrewRole = useRunStore((state) => state.assignCrewRole);
  const addActiveMember = useRunStore((state) => state.addActiveMember);
  const removeActiveMember = useRunStore((state) => state.removeActiveMember);
  const swapActiveMember = useRunStore((state) => state.swapActiveMember);
  const upgradeCharacter = useRunStore((state) => state.upgradeCharacter);
  const [incomingId, setIncomingId] = useState<CharacterId | null>(null);
  const [inspectedId, setInspectedId] = useState<CharacterId | null>(null);
  const availableIds = [...new Set([...rosterIds, ...guestIds])];
  const reserves = availableIds.filter((id) => !activePartyIds.includes(id));
  const assignedCount = Object.values(roleAssignments).filter(Boolean).length;

  const assignedRole = (characterId: CharacterId): ShipRole | undefined =>
    shipRoleOrder.find((role) => roleAssignments[role] === characterId);

  const completeSwap = (outgoingId: CharacterId) => {
    if (incomingId && swapActiveMember(incomingId, outgoingId)) setIncomingId(null);
  };

  return (
    <details className="crew-manager">
      <summary>
        <span>
          <strong>Manage crew</strong>
          <small>
            {rosterIds.length} cards owned · {guestIds.length} story guests · {assignedCount}/10
            ship posts filled · {activePartyIds.length}/4 battle slots used
          </small>
        </span>
      </summary>

      <div className="crew-manager-content">
        <section aria-labelledby="roster-heading">
          <p className="panel-label" id="roster-heading">
            Roster records and battle lineup
          </p>
          <div className={`lineup-help ${incomingId ? 'selecting' : ''}`} aria-live="polite">
            <span>
              {incomingId
                ? `Choose an active roster card to replace with ${getCrewCharacter(incomingId).name}.`
                : reserves.length > 0 && activePartyIds.length < 4
                  ? 'Add any available permanent or guest character until the battle party reaches four.'
                  : reserves.length > 0
                    ? 'The party is full. Select any reserve, then choose the active fighter to replace.'
                    : 'Every currently available fighter is already in the battle party.'}
            </span>
            {incomingId && (
              <button className="text-action" onClick={() => setIncomingId(null)} type="button">
                Cancel switch
              </button>
            )}
          </div>
          <div className="roster-records">
            {availableIds.map((id) => {
              const character = getCrewCharacter(id);
              const guest = guestIds.includes(id) && !rosterIds.includes(id);
              const role = assignedRole(id);
              const shards = characterShards[id] ?? 0;
              const stars = characterStars[id] ?? 1;
              const activeIndex = activePartyIds.indexOf(id);
              const active = activeIndex !== -1;
              const selectedReserve = incomingId === id;
              return (
                <article
                  className={[
                    'roster-card',
                    `rarity-${character.rarity}`,
                    active ? 'is-active' : 'is-reserve',
                    guest ? 'is-guest' : '',
                    incomingId && active ? 'is-switch-target' : '',
                    selectedReserve ? 'is-selected-reserve' : '',
                  ].filter(Boolean).join(' ')}
                  key={id}
                >
                  <button
                    className="roster-card-open"
                    onClick={() => setInspectedId(id)}
                    type="button"
                  >
                    <span className="roster-card-rarity">{cardRarityLabels[character.rarity]}</span>
                    <span className={`roster-lineup-status ${active ? 'active' : 'reserve'}`}>
                      {active ? `Battle slot ${activeIndex + 1}` : guest ? 'Story guest' : 'Reserve'}
                    </span>
                    <span className="roster-card-avatar" aria-hidden="true">
                      {character.name.slice(0, 1)}
                    </span>
                    <strong>{character.name}</strong>
                    <small>{character.epithet}</small>
                    <span className="roster-type-list">
                      {character.fighter.types.map((type) => (
                        <span key={type}>{elementLabels[type]}</span>
                      ))}
                    </span>
                    <small>
                      {stars}★ · {role ? shipRoleLabels[role] : guest ? 'Story guest' : 'Unassigned'} · {shards} shards
                    </small>
                    <span className="inspect-hint">Examine card</span>
                  </button>
                  <div className="roster-actions">
                    {active ? (
                      incomingId ? (
                        <button
                          className="roster-lineup-action replace"
                          onClick={() => completeSwap(id)}
                          type="button"
                        >
                          Replace with {getCrewCharacter(incomingId).name}
                        </button>
                      ) : (
                        <button
                          className="roster-lineup-action"
                          disabled={activePartyIds.length <= 1}
                          onClick={() => removeActiveMember(id)}
                          type="button"
                        >
                          {activePartyIds.length <= 1 ? 'At least one fighter required' : 'Remove from battle'}
                        </button>
                      )
                    ) : (
                      <button
                        aria-pressed={selectedReserve}
                        className="roster-lineup-action"
                        onClick={() => {
                          if (activePartyIds.length < 4) addActiveMember(id);
                          else setIncomingId(selectedReserve ? null : id);
                        }}
                        type="button"
                      >
                        {activePartyIds.length < 4
                          ? 'Add to battle'
                          : selectedReserve
                            ? 'Cancel switch'
                            : 'Switch into battle'}
                      </button>
                    )}
                  {!guest && stars < currentMaxStarLevel && (
                    <button
                      className="roster-upgrade"
                      disabled={shards < firstStarUpgradeCost}
                      onClick={() => upgradeCharacter(id)}
                      type="button"
                    >
                      Raise to {stars + 1}★ · {firstStarUpgradeCost} shards
                    </button>
                  )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="ship-roles-heading">
          <p className="panel-label" id="ship-roles-heading">
            Ship assignments
          </p>
          <p className={`role-help ${canAssignRoles ? 'available' : 'locked'}`}>
            {canAssignRoles
              ? 'Assignments are open at this rest site or after a card pull.'
              : 'Ship assignments can only change after a card pull or at an approved rest site.'}{' '}
            Assignments do not restrict who can enter battle.
          </p>
          <div className="role-grid">
            {shipRoleOrder.map((role) => {
              const characterId = roleAssignments[role];
              const character = characterId ? getCrewCharacter(characterId) : null;
              const ideal = character?.idealRoles.includes(role) ?? false;
              const roleEffect = getRoleEffectSummary(roleAssignments, role);
              return (
                <label className="role-card" key={role}>
                  <span>{shipRoleLabels[role]}</span>
                  <select
                    aria-label={`Assign ${shipRoleLabels[role]}`}
                    disabled={!canAssignRoles}
                    onChange={(event) =>
                      assignCrewRole(
                        event.target.value ? (event.target.value as CharacterId) : null,
                        role,
                      )
                    }
                    value={characterId ?? ''}
                  >
                    <option value="">Unassigned</option>
                    {rosterIds.map((id) => (
                      <option value={id} key={id}>
                        {getCrewCharacter(id).name}
                      </option>
                    ))}
                  </select>
                  <small className={ideal ? 'ideal-role' : ''}>
                    {character ? (ideal ? 'Ideal assignment' : character.epithet) : 'Open crew slot'}
                  </small>
                  {roleEffect && (
                    <small className={`role-effect ${getRoleEffectLevel(roleAssignments, role)}`}>
                      {roleEffect}
                    </small>
                  )}
                </label>
              );
            })}
          </div>
        </section>
      </div>
      {inspectedId && (
        <CharacterDetailDialog
          active={activePartyIds.includes(inspectedId)}
          characterId={inspectedId}
          guest={guestIds.includes(inspectedId) && !rosterIds.includes(inspectedId)}
          onClose={() => setInspectedId(null)}
          role={assignedRole(inspectedId)}
          shards={characterShards[inspectedId] ?? 0}
          stars={characterStars[inspectedId] ?? 1}
        />
      )}
    </details>
  );
}

interface CharacterDetailDialogProps {
  characterId: CharacterId;
  stars: number;
  shards: number;
  role?: ShipRole;
  active: boolean;
  guest: boolean;
  onClose: () => void;
}

function CharacterDetailDialog({
  characterId,
  stars,
  shards,
  role,
  active,
  guest,
  onClose,
}: CharacterDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const characterMovePp = useRunStore((state) => state.characterMovePp[characterId]);
  const character = getCrewCharacter(characterId);
  const starBonusPercent = (Math.max(1, stars) - 1) * 5;
  const withStars = (value: number) => value + Math.round((value * starBonusPercent) / 100);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      aria-labelledby="character-detail-name"
      className={`character-detail rarity-${character.rarity}`}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="character-detail-heading">
        <div className="character-detail-avatar" aria-hidden="true">
          {character.name.slice(0, 1)}
        </div>
        <div>
          <span className="card-rarity">{cardRarityLabels[character.rarity]} · {stars}★</span>
          <h2 id="character-detail-name">{character.name}</h2>
          <p>{character.epithet}</p>
        </div>
        <button
          aria-label={`Close ${character.name} details`}
          className="dialog-close"
          onClick={() => dialogRef.current?.close()}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="character-detail-meta">
        <span>{active ? 'Active battle party' : 'Reserve'}</span>
        <span>{guest ? 'Story guest' : role ? shipRoleLabels[role] : 'No ship assignment'}</span>
        <span>{shards} shard{shards === 1 ? '' : 's'}</span>
        {character.fighter.devilFruitUser && <span>Devil Fruit user</span>}
      </div>

      <section aria-labelledby="character-types-heading">
        <p className="panel-label" id="character-types-heading">Combat types</p>
        <div className="detail-type-list">
          {character.fighter.types.map((type) => <span key={type}>{elementLabels[type]}</span>)}
        </div>
      </section>

      <section aria-labelledby="character-stats-heading">
        <p className="panel-label" id="character-stats-heading">Current stats</p>
        <dl className="character-stat-grid">
          <div><dt>HP</dt><dd>{withStars(character.fighter.maxHp)}</dd></div>
          <div><dt>Attack</dt><dd>{withStars(character.fighter.attack)}</dd></div>
          <div><dt>Defense</dt><dd>{withStars(character.fighter.defense)}</dd></div>
          <div><dt>Speed</dt><dd>{character.fighter.speed}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="character-moves-heading">
        <p className="panel-label" id="character-moves-heading">Move kit</p>
        <div className="character-move-grid">
          {character.fighter.moves.map((move) => {
            const remainingPp = characterMovePp?.[move.id] ?? move.maxPp;
            const effect = move.effect === 'damage'
              ? `${move.power} power · one enemy`
              : move.effect === 'multi-target'
                ? `${move.power} power · all enemies`
                : move.effect === 'guard'
                  ? `${move.damageReductionPercent}% guard · self`
                  : `${move.modifierPercent > 0 ? '+' : ''}${move.modifierPercent}% ${move.stat} · ${move.durationRounds} rounds${move.damageTypeOverride ? ` · attacks become ${elementLabels[move.damageTypeOverride]}` : ''}`;
            return (
              <div key={move.id}>
                <strong>{move.name}</strong>
                <span>{elementLabels[move.element]} · {effect}</span>
                <small>{remainingPp}/{move.maxPp} PP</small>
              </div>
            );
          })}
        </div>
      </section>
    </dialog>
  );
}

function CardReveal({ result, duplicate }: { result: CardPullResult; duplicate: boolean }) {
  const character = getCrewCharacter(result.characterId);
  const revealTier = cardRevealTiers[result.rarity];
  const animationKey = getCardAnimationKey(result.characterId);

  return (
    <article
      aria-live="polite"
      className={`card-reveal reveal-${revealTier}`}
      data-animation={animationKey}
      data-rarity={result.rarity}
      key={result.cardId}
    >
      <div className="card-reveal-aura" aria-hidden="true" />
      <div className="card-face">
        <span className="card-rarity">{cardRarityLabels[result.rarity]}</span>
        <div className="card-portrait-placeholder" aria-hidden="true">
          {character.name.slice(0, 1)}
        </div>
        <p>{character.epithet}</p>
        <h3>{character.name}</h3>
        <small>
          {duplicate ? 'Keep for 1 duplicate shard' : 'Keep to recruit this character'}
        </small>
      </div>
    </article>
  );
}

function TavernPanel() {
  const berries = useRunStore((state) => state.berries);
  const pendingPack = useRunStore((state) => state.pendingPack);
  const openCardPack = useRunStore((state) => state.openCardPack);
  const revealPackCard = useRunStore((state) => state.revealPackCard);
  const claimPackCard = useRunStore((state) => state.claimPackCard);
  const rosterIds = useRunStore((state) => state.rosterIds);
  const canAffordPack = berries >= baratieCardPack.cost;
  const allRevealed = pendingPack?.cards.every((card) => card.revealed) ?? false;
  const cardsRemaining = pendingPack?.cards.filter((card) => !card.revealed).length ?? 0;

  return (
    <section className="tavern-panel" aria-labelledby="tavern-heading">
      <div className="tavern-copy">
        <p className="panel-label">Baratie card counter</p>
        <h3 id="tavern-heading">{baratieCardPack.name}</h3>
        <p>
          Reveal five East Blue character cards, then choose one to keep. One card is guaranteed
          Rare or better, and featured characters receive three times their normal selection
          weight. The four cards you do not choose are lost.
        </p>
        <div className="rarity-odds" aria-label="Current card rarity odds">
          {cardRarityOrder.map((rarity) => (
            <span className={`rarity-${rarity}`} key={rarity}>
              {cardRarityLabels[rarity]} <strong>{baratieCardPack.rarityOdds[rarity]}%</strong>
            </span>
          ))}
        </div>
        <button
          className="primary-action"
          disabled={!canAffordPack || Boolean(pendingPack)}
          onClick={() => openCardPack()}
          type="button"
        >
          Open five-card pack · {baratieCardPack.cost} Berries
        </button>
        {!canAffordPack && !pendingPack && (
          <small className="tavern-warning">Not enough Berries for a pack.</small>
        )}
      </div>
      <div className="reveal-stage">
        {pendingPack ? (
          <div className="pack-opening" aria-label="Five-card pack opening">
            <div className="pack-card-grid">
              {pendingPack.cards.map((card, index) =>
                card.revealed ? (
                  <button
                    aria-label={`Keep ${getCrewCharacter(card.characterId).name}`}
                    className="card-choice"
                    disabled={!allRevealed}
                    key={card.cardId}
                    onClick={() => claimPackCard(card.cardId)}
                    type="button"
                  >
                    <CardReveal
                      duplicate={rosterIds.includes(card.characterId)}
                      result={card}
                    />
                  </button>
                ) : (
                  <button
                    aria-label={`Reveal face-down card ${index + 1}`}
                    className="sealed-card"
                    key={card.cardId}
                    onClick={() => revealPackCard(card.cardId)}
                    type="button"
                  >
                    <span>East Blue</span>
                    <strong>?</strong>
                    <small>Card {index + 1}</small>
                  </button>
                ),
              )}
            </div>
            <div className="pack-progress" aria-live="polite">
              <span>
                {allRevealed
                  ? 'All five cards revealed. Choose exactly one card to keep.'
                  : `${cardsRemaining} card${cardsRemaining === 1 ? '' : 's'} still hidden.`}
              </span>
            </div>
          </div>
        ) : (
          <div className="sealed-pack" aria-label="Sealed East Blue Card Pack">
            <span>East Blue</span>
            <strong>Five Character Cards</strong>
            <small>Reveal five · keep one · Rare or better guaranteed</small>
          </div>
        )}
      </div>
    </section>
  );
}

export function VictoryPanel() {
  const bounty = useRunStore((state) => state.bounty);
  const berries = useRunStore((state) => state.berries);
  const artifacts = useRunStore((state) => state.artifacts);
  const abandonRun = useRunStore((state) => state.abandonRun);

  return (
    <section className="victory-panel">
      <p className="eyebrow">East Blue cleared</p>
      <h2>Arlong Park has fallen!</h2>
      <p>
        The crew completed the alpha voyage with a {bounty.toLocaleString()} bounty and{' '}
        {berries.toLocaleString()} Berries.
      </p>
      <div className="artifact-summary">
        <span>Artifacts</span>
        <ArtifactCollection artifactIds={artifacts} />
      </div>
      <button className="primary-action" onClick={abandonRun} type="button">
        Start a new voyage
      </button>
    </section>
  );
}

function RunJournal() {
  const journal = useRunStore((state) => state.journal);

  return (
    <div className="run-journal">
      <p className="panel-label">Captain's log</p>
      <ol>
        {journal.slice(-4).map((entry, index) => (
          <li key={`${index}-${entry}`}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}
