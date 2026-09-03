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
  getCardPack,
} from '../cards/packs';
import {
  getCrewCharacter,
  shipRoleLabels,
  shipRoleOrder,
} from '../crew/characters';
import { getRunCharacterHp, getRunCharacterMaxHp } from '../crew/health';
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
  getChoiceAdjustedRoles,
  getChoiceBerryCost,
  getChoiceHullDamage,
  getChoiceRequiredRoles,
  getVoyageRoleEffectLevel,
} from '../run/storyConsequences';
import {
  getCurrentVoyageEvent,
  getWantedPressure,
  voyageCategoryLabels,
} from '../run/voyageEvents';
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

function ArtifactIcon({ kind }: { kind: ReturnType<typeof getArtifactDefinition>['icon'] }) {
  if (kind === 'medical-kit') {
    return <svg aria-hidden="true" viewBox="0 0 48 48"><rect x="8" y="13" width="32" height="27" rx="5" /><path d="M18 13V8h12v5M24 20v13M17.5 26.5h13" /></svg>;
  }
  if (kind === 'tiller') {
    return <svg aria-hidden="true" viewBox="0 0 48 48"><circle cx="24" cy="24" r="10" /><circle cx="24" cy="24" r="3" /><path d="M24 3v11M24 34v11M3 24h11M34 24h11M9 9l8 8M31 31l8 8M39 9l-8 8M17 31l-8 8" /></svg>;
  }
  if (kind === 'ledger') {
    return <svg aria-hidden="true" viewBox="0 0 48 48"><path d="M11 6h25a3 3 0 0 1 3 3v33H14a5 5 0 0 1-5-5V8a2 2 0 0 1 2-2Z" /><path d="M15 6v36M20 15h13M20 22h13M20 29h9" /></svg>;
  }
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
              <ArtifactIcon kind={artifact.icon} />
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
        <p className="eyebrow">Three-arc development campaign</p>
        <h2>Set sail from Foosha Village</h2>
        <p>
          Begin Luffy's voyage, recruit Zoro and Nami, then believe Usopp and stop Captain Kuro's
          raid on Syrup Village.
        </p>
      </div>
      <div className="run-settings" aria-label="Run settings">
        <div>
          <span>Mode</span>
          <strong>Story</strong>
          <small>Romance Dawn through Syrup Village</small>
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
      <div className="resource-stat berries-stat" title="Berries">
        <span className="resource-icon" aria-hidden="true">฿</span>
        <span className="resource-copy"><small>Berries</small><strong>{berries.toLocaleString()}</strong></span>
      </div>
      <div className="resource-stat bounty-stat" title="Bounty">
        <span className="resource-icon" aria-hidden="true">★</span>
        <span className="resource-copy"><small>Bounty</small><strong>{bounty.toLocaleString()}</strong></span>
      </div>
      <div className="resource-stat hull-stat" title={`Hull ${hull} of ${maxHull}`}>
        <span className="resource-icon" aria-hidden="true">♥</span>
        <span className="resource-copy">
          <small>Hull</small><strong>{hull}<i>/{maxHull}</i></strong>
          <span className="hull-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, (hull / maxHull) * 100)}%` }} /></span>
        </span>
      </div>
      <div className="artifact-status">
        <small>Relics</small>
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

function rewardSymbol(label: string): string {
  if (label === 'Berries') return '฿';
  if (label === 'Bounty') return '★';
  if (label === 'Hull') return '◆';
  if (label === 'Move PP') return '⚡';
  if (label === 'Crew HP') return '♥';
  if (label === 'Roster' || label === 'Story guest') return '☠';
  if (label === 'Card pack' || label === 'Shard') return '✦';
  if (label === 'Checkpoint') return '⚑';
  return '•';
}

export function RewardOutcomeScreen() {
  const receipt = useRunStore((state) => state.latestReward);
  const destinationId = useRunStore((state) => state.rewardDestinationNodeId);
  const acknowledgeReward = useRunStore((state) => state.acknowledgeReward);
  const pendingVoyage = useRunStore((state) => state.pendingVoyage);
  const destination = getStoryNode(destinationId ?? null);
  const voyageComplete = Boolean(
    pendingVoyage && pendingVoyage.currentEventIndex >= pendingVoyage.eventIds.length,
  );
  if (!receipt) return null;

  return (
    <section className="reward-screen" aria-live="polite" aria-labelledby="reward-title">
      <div className="reward-screen-heading">
        <p className="eyebrow">Voyage outcome</p>
        <h2 id="reward-title">{receipt.title}</h2>
        <p>{receipt.detail}</p>
      </div>
      <div className="reward-icon-grid">
        {receipt.changes.length > 0 ? receipt.changes.map((change, index) => (
          <article className={change.tone} key={`${receipt.id}-${change.label}-${index}`}>
            <span className="reward-icon" aria-hidden="true">{rewardSymbol(change.label)}</span>
            <small>{change.label}</small>
            <strong>{change.value}</strong>
          </article>
        )) : (
          <article className="neutral">
            <span className="reward-icon" aria-hidden="true">✓</span>
            <small>Story</small>
            <strong>Updated</strong>
          </article>
        )}
      </div>
      <div className="reward-actions">
        <button className="primary-action" onClick={() => acknowledgeReward(true)} type="button">
          {destination
            ? `${voyageComplete ? 'Arrive at' : 'Set sail for'} ${destination.name}`
            : 'Continue voyage'}
        </button>
        {destination && !voyageComplete && (
          <button className="text-action" onClick={() => acknowledgeReward(false)} type="button">
            Review map first
          </button>
        )}
      </div>
    </section>
  );
}

export function VoyagePanel() {
  const run = useRunStore();
  const beginVoyage = useRunStore((state) => state.beginVoyage);
  const abandonRun = useRunStore((state) => state.abandonRun);
  const startEncounter = useBattleStore((state) => state.startEncounter);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterHp = useRunStore((state) => state.characterHp ?? {});
  const characterMovePp = useRunStore((state) => state.characterMovePp);
  const completedVoyageDestination = run.pendingVoyage &&
    run.pendingVoyage.currentEventIndex >= run.pendingVoyage.eventIds.length
    ? run.pendingVoyage.destinationNodeId
    : null;
  const availableNodes = getAvailableNodes(run).filter(
    (node) => !completedVoyageDestination || node.id === completedVoyageDestination,
  );

  const sailTo = (node: StoryNode) => {
    if (node.encounterId) {
      startEncounter(
        node.encounterId,
        activePartyIds,
        roleAssignments,
        characterStars,
        characterMovePp,
        characterHp,
      );
    }
    beginVoyage(node.id);
  };

  const restartVoyage = () => {
    if (window.confirm('Restart this voyage? Current Story Mode progress will be erased.')) {
      abandonRun();
    }
  };

  if (run.mapTravelPending && run.pendingVoyage) {
    const destination = getStoryNode(run.pendingVoyage.destinationNodeId);
    return (
      <section className="voyage-panel voyage-transit-card" aria-live="polite">
        <p className="panel-label">Course plotted</p>
        <span className="transit-kicker">Now under way</span>
        <h2>{destination?.name ?? 'Next destination'}</h2>
        <p>{destination?.subtitle ?? 'The crew is moving along the charted route.'}</p>
        <span className="transit-progress" aria-hidden="true"><span /></span>
      </section>
    );
  }

  return (
    <section className="voyage-panel">
      <div>
        <p className="panel-label">Choose your heading</p>
        <div className="destination-list">
          {availableNodes.map((node, index) => (
            <button onClick={() => sailTo(node)} type="button" key={node.id}>
              <span className="choice-number" aria-hidden="true">{index + 1}</span>
              <span className="destination-type">{nodeTypeLabel(node)}</span>
              <strong>{node.name}</strong>
              <small>{node.subtitle}</small>
            </button>
          ))}
          {availableNodes.length === 0 && (
            <p className="empty-crew-note">
              No further destinations are available in this development slice.
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

export function VoyageEventPanel() {
  const run = useRunStore();
  const resolveVoyageEvent = useRunStore((state) => state.resolveVoyageEvent);
  const startVoyageBattle = useRunStore((state) => state.startVoyageBattle);
  const resetBattle = useBattleStore((state) => state.reset);
  return (
    <VoyageEventCard
      onBeginBattle={() => {
        resetBattle();
        startVoyageBattle();
      }}
      onChoose={resolveVoyageEvent}
      run={run}
    />
  );
}

export function VoyageEventCard({
  run,
  onBeginBattle,
  onChoose,
}: {
  run: ReturnType<typeof useRunStore.getState>;
  onBeginBattle: () => void;
  onChoose: (choiceId: string) => void;
}) {
  const event = getCurrentVoyageEvent(run);
  const leg = run.pendingVoyage;
  const destination = getStoryNode(leg?.destinationNodeId ?? null);

  if (!event || !leg) return null;

  return (
    <section className={`voyage-event voyage-event-${event.category}`} aria-labelledby="voyage-event-heading">
      <div className="voyage-event-progress" aria-label="Voyage leg progress">
        <div>
          <p className="eyebrow">Logbook draw · {voyageCategoryLabels[event.category]}</p>
          <span>Heading for {destination?.name ?? 'the next story destination'}</span>
        </div>
        <ol>
          {leg.eventIds.map((eventId, index) => (
            <li
              aria-current={index === leg.currentEventIndex ? 'step' : undefined}
              className={index < leg.currentEventIndex ? 'complete' : index === leg.currentEventIndex ? 'current' : ''}
              key={`${leg.id}-${eventId}`}
            >
              <span>{index < leg.currentEventIndex ? '✓' : index + 1}</span>
            </li>
          ))}
        </ol>
        <small>Wanted pressure: {getWantedPressure(run.bounty)}</small>
      </div>

      <div className="voyage-event-copy">
        <span className={`event-category category-${event.category}`}>
          {voyageCategoryLabels[event.category]}
        </span>
        <h2 id="voyage-event-heading">{event.name}</h2>
        <h3>{event.subtitle}</h3>
        <p>{event.description}</p>
      </div>

      {event.encounterId ? (
        <button className="primary-action" onClick={onBeginBattle} type="button">
          Prepare for the attack
        </button>
      ) : (
        <div className="choice-list voyage-choice-list">
          {(event.choices ?? []).map((choice) => {
            const berryCost = getChoiceBerryCost(choice);
            const hullDamage = getChoiceHullDamage(run, choice);
            const roles = getChoiceAdjustedRoles(choice);
            const unaffordable = run.berries < berryCost;
            return (
              <button
                disabled={unaffordable}
                key={choice.id}
                onClick={() => onChoose(choice.id)}
                type="button"
              >
                <strong>{choice.label}</strong>
                <small>{choice.detail}</small>
                {roles.map((role) => {
                  const level = getVoyageRoleEffectLevel(run, role);
                  return (
                    <span className={`role-check ${level}`} key={role}>
                      {level === 'inactive' ? `No assigned ${shipRoleLabels[role]}` : `${level === 'ideal' ? 'Ideal ' : ''}${shipRoleLabels[role]} contribution`}
                      {hullDamage === null ? '' : hullDamage === 0 ? ' · no hull damage' : ` · ${hullDamage} hull damage`}
                    </span>
                  );
                })}
                {unaffordable && <em>Not enough Berries</em>}
              </button>
            );
          })}
        </div>
      )}
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
              className={choices.length === 1 ? 'narrative-continue' : undefined}
              disabled={unaffordable || missingRole || Boolean(pendingPack)}
              onClick={() => resolveNode(choice.id)}
              type="button"
              key={choice.id}
            >
              <strong>{choices.length === 1 ? 'Continue' : choice.label}</strong>
              <small>{choices.length === 1 ? `${choice.label} · ${choice.detail}` : choice.detail}</small>
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

type CrewManagerView = 'roster' | 'roles';
type RosterSort = 'status' | 'name' | 'rarity' | 'type';

export function CrewManager({ view }: { view: CrewManagerView }) {
  const rosterIds = useRunStore((state) => state.rosterIds);
  const guestIds = useRunStore((state) => state.guestIds);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterShards = useRunStore((state) => state.characterShards);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterHp = useRunStore((state) => state.characterHp ?? {});
  const canAssignRoles = useRunStore(canManageShipAssignments);
  const assignCrewRole = useRunStore((state) => state.assignCrewRole);
  const addActiveMember = useRunStore((state) => state.addActiveMember);
  const removeActiveMember = useRunStore((state) => state.removeActiveMember);
  const swapActiveMember = useRunStore((state) => state.swapActiveMember);
  const upgradeCharacter = useRunStore((state) => state.upgradeCharacter);
  const [incomingId, setIncomingId] = useState<CharacterId | null>(null);
  const [inspectedId, setInspectedId] = useState<CharacterId | null>(null);
  const [rosterSort, setRosterSort] = useState<RosterSort>('status');
  const availableIds = [...new Set([...rosterIds, ...guestIds])].sort((leftId, rightId) => {
    const leftActive = activePartyIds.includes(leftId);
    const rightActive = activePartyIds.includes(rightId);
    if (leftActive !== rightActive) return leftActive ? -1 : 1;
    const leftKo = getRunCharacterHp({ roleAssignments, characterStars, characterHp }, leftId) <= 0;
    const rightKo = getRunCharacterHp({ roleAssignments, characterStars, characterHp }, rightId) <= 0;
    if (leftKo !== rightKo) return leftKo ? 1 : -1;
    const left = getCrewCharacter(leftId);
    const right = getCrewCharacter(rightId);
    if (rosterSort === 'rarity') {
      return cardRarityOrder.indexOf(right.rarity) - cardRarityOrder.indexOf(left.rarity) ||
        left.name.localeCompare(right.name);
    }
    if (rosterSort === 'type') {
      return elementLabels[left.fighter.types[0]].localeCompare(elementLabels[right.fighter.types[0]]) ||
        left.name.localeCompare(right.name);
    }
    return left.name.localeCompare(right.name);
  });
  const reserves = availableIds.filter((id) => !activePartyIds.includes(id));
  const assignedCount = Object.values(roleAssignments).filter(Boolean).length;

  const assignedRole = (characterId: CharacterId): ShipRole | undefined =>
    shipRoleOrder.find((role) => roleAssignments[role] === characterId);

  const completeSwap = (outgoingId: CharacterId) => {
    if (incomingId && swapActiveMember(incomingId, outgoingId)) setIncomingId(null);
  };

  return (
    <section className="crew-manager management-screen">
      <header className="management-heading">
        <span>
          <p className="eyebrow">Crew management</p>
          <h2>{view === 'roster' ? 'Battle Party & Roster' : 'Ship Crew'}</h2>
          <small>
            {rosterIds.length} cards owned · {guestIds.length} story guests · {assignedCount}/10
            ship posts filled · {activePartyIds.length}/4 battle slots used
          </small>
        </span>
      </header>

      <div className="crew-manager-content">
        {view === 'roster' && <section aria-labelledby="roster-heading">
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
          <label className="roster-sort">
            <span>Sort roster</span>
            <select value={rosterSort} onChange={(event) => setRosterSort(event.target.value as RosterSort)}>
              <option value="status">Battle status</option>
              <option value="name">Name</option>
              <option value="rarity">Rarity</option>
              <option value="type">Primary type</option>
            </select>
          </label>
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
              const maxHp = getRunCharacterMaxHp({ roleAssignments, characterStars, characterHp }, id);
              const currentHp = getRunCharacterHp({ roleAssignments, characterStars, characterHp }, id);
              const knockedOut = currentHp <= 0;
              return (
                <article
                  className={[
                    'roster-card',
                    `rarity-${character.rarity}`,
                    active ? 'is-active' : 'is-reserve',
                    guest ? 'is-guest' : '',
                    incomingId && active ? 'is-switch-target' : '',
                    selectedReserve ? 'is-selected-reserve' : '',
                    knockedOut ? 'is-ko' : '',
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
                    <small className={`roster-health ${knockedOut ? 'ko' : ''}`}>
                      {knockedOut ? 'KO · Needs recovery' : `${currentHp}/${maxHp} HP`}
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
                        disabled={knockedOut}
                        onClick={() => {
                          if (activePartyIds.length < 4) addActiveMember(id);
                          else setIncomingId(selectedReserve ? null : id);
                        }}
                        type="button"
                      >
                        {knockedOut
                          ? 'Needs recovery'
                          : activePartyIds.length < 4
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
        </section>}

        {view === 'roles' && <section aria-labelledby="ship-roles-heading">
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
        </section>}
      </div>
      {inspectedId && (
        <CharacterDetailDialog
          active={activePartyIds.includes(inspectedId)}
          characterId={inspectedId}
          guest={guestIds.includes(inspectedId) && !rosterIds.includes(inspectedId)}
          currentHp={getRunCharacterHp({ roleAssignments, characterStars, characterHp }, inspectedId)}
          maxHp={getRunCharacterMaxHp({ roleAssignments, characterStars, characterHp }, inspectedId)}
          onClose={() => setInspectedId(null)}
          role={assignedRole(inspectedId)}
          shards={characterShards[inspectedId] ?? 0}
          stars={characterStars[inspectedId] ?? 1}
        />
      )}
    </section>
  );
}

interface CharacterDetailDialogProps {
  characterId: CharacterId;
  stars: number;
  shards: number;
  role?: ShipRole;
  active: boolean;
  guest: boolean;
  currentHp: number;
  maxHp: number;
  onClose: () => void;
}

function CharacterDetailDialog({
  characterId,
  stars,
  shards,
  role,
  active,
  guest,
  currentHp,
  maxHp,
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
          <div><dt>HP</dt><dd>{currentHp}/{maxHp}</dd></div>
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
            const target = move.target === 'self'
              ? 'self'
              : move.target === 'ally'
                ? 'one ally'
                : move.target === 'enemy-group'
                  ? `up to ${move.maxTargets} enemies`
                  : 'one enemy';
            const effect = move.effects.map((entry) => {
              if (entry.effect === 'damage') return `${entry.power} power`;
              if (entry.effect === 'guard') return `${entry.damageReductionPercent}% Guard`;
              if (entry.effect === 'remove-guard') return 'break Guard';
              if (entry.effect === 'heal') return `heal ${entry.maxHpPercent}% max HP`;
              if (entry.effect === 'cleanse') return 'cleanse negative effects';
              if (entry.effect === 'damage-over-time') {
                return `${entry.statusName} ${entry.maxHpPercent}% for ${entry.durationTurns} turns`;
              }
              return `${entry.modifierPercent > 0 ? '+' : ''}${entry.modifierPercent}% ${entry.stat} · ${entry.durationTurns} turns${entry.damageTypeOverride ? ` · attacks become ${elementLabels[entry.damageTypeOverride]}` : ''}`;
            }).join(' → ');
            return (
              <div key={move.id}>
                <strong>{move.name}</strong>
                <span>{elementLabels[move.element]} · {target} · {effect}</span>
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

function TavernPanel({ focused = false }: { focused?: boolean }) {
  const berries = useRunStore((state) => state.berries);
  const pendingPack = useRunStore((state) => state.pendingPack);
  const openCardPack = useRunStore((state) => state.openCardPack);
  const openPendingPack = useRunStore((state) => state.openPendingPack);
  const revealPackCard = useRunStore((state) => state.revealPackCard);
  const claimPackCard = useRunStore((state) => state.claimPackCard);
  const rosterIds = useRunStore((state) => state.rosterIds);
  const displayedPack = pendingPack ? getCardPack(pendingPack.packId) : baratieCardPack;
  const arcReward = pendingPack?.source === 'arc-reward';
  const canAffordPack = berries >= baratieCardPack.cost;
  const allRevealed = pendingPack?.cards.every((card) => card.revealed) ?? false;
  const cardsRemaining = pendingPack?.cards.filter((card) => !card.revealed).length ?? 0;

  if (focused && pendingPack && (pendingPack.stage ?? 'cards') === 'sealed') {
    return (
      <section className={`pack-screen pack-${pendingPack.packId}`} aria-labelledby="sealed-pack-heading">
        <div className="pack-screen-copy">
          <p className="eyebrow">{arcReward ? 'Arc completion reward' : 'Tavern purchase'}</p>
          <h2 id="sealed-pack-heading">{displayedPack.name}</h2>
          <p>Five hidden candidates wait inside. Reveal every card, then keep exactly one.</p>
        </div>
        <button className="illustrated-pack" onClick={openPendingPack} type="button">
          <span className="pack-sunburst" aria-hidden="true" />
          <span className="pack-jolly-roger" aria-hidden="true">☠</span>
          <small>{displayedPack.name.replace(' Card Pack', '')}</small>
          <strong>Grand Line<br />Character Pack</strong>
          <em>Five cards · Keep one</em>
        </button>
        <button className="primary-action" onClick={openPendingPack} type="button">
          Break the seal
        </button>
      </section>
    );
  }

  return (
    <section className={`tavern-panel ${focused ? 'pack-screen reveal-screen' : ''}`} aria-labelledby="tavern-heading">
      <div className="tavern-copy">
        <p className="panel-label">{arcReward ? 'Arc completion reward' : 'Baratie card counter'}</p>
        <h3 id="tavern-heading">{displayedPack.name}</h3>
        <p>
          Reveal five character cards, then choose one to keep. One card is guaranteed Rare or
          better, and featured characters receive three times their normal selection weight. The
          four cards you do not choose are lost.
        </p>
        <div className="rarity-odds" aria-label="Current card rarity odds">
          {cardRarityOrder.map((rarity) => (
            <span className={`rarity-${rarity}`} key={rarity}>
              {cardRarityLabels[rarity]} <strong>{displayedPack.rarityOdds[rarity]}%</strong>
            </span>
          ))}
        </div>
        {!arcReward && (
          <>
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
          </>
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
                    <span>{displayedPack.name.replace(' Card Pack', '')}</span>
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

export function PackOpeningScreen() {
  return <TavernPanel focused />;
}

export function BattlePreparation({ onStart }: { onStart: () => void }) {
  const currentNodeId = useRunStore((state) => state.currentNodeId);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const node = getStoryNode(currentNodeId);
  const voyageEvent = useRunStore(getCurrentVoyageEvent);
  const encounter = voyageEvent ?? node;

  return (
    <section className="battle-preparation">
      <div className="battle-preparation-heading">
        <p className="eyebrow">Prepare for battle</p>
        <h2>{encounter?.name ?? 'Next encounter'}</h2>
        <p>{encounter?.description}</p>
        <p><strong>{activePartyIds.length}/4 fighters ready.</strong> Party changes do not alter ship assignments.</p>
        <button className="primary-action" onClick={onStart} type="button">
          Begin encounter
        </button>
      </div>
      <CrewManager view="roster" />
    </section>
  );
}

export function VictoryPanel({ onRestart }: { onRestart: () => void }) {
  const bounty = useRunStore((state) => state.bounty);
  const berries = useRunStore((state) => state.berries);
  const artifacts = useRunStore((state) => state.artifacts);
  const rosterIds = useRunStore((state) => state.rosterIds);
  const journal = useRunStore((state) => state.journal);

  return (
    <section className="victory-panel">
      <p className="eyebrow">Three-arc campaign complete</p>
      <h2>Syrup Village is safe!</h2>
      <p>
        Luffy completed Romance Dawn, Orange Town, and Syrup Village with a{' '}
        {bounty.toLocaleString()} bounty, {berries.toLocaleString()} Berries, and{' '}
        {rosterIds.length} permanent crew cards.
      </p>
      <div className="campaign-summary-grid">
        <div><span>Arcs cleared</span><strong>3</strong></div>
        <div><span>Permanent roster</span><strong>{rosterIds.length}</strong></div>
        <div><span>Journal entries</span><strong>{journal.length}</strong></div>
      </div>
      <div className="artifact-summary">
        <span>Artifacts</span>
        <ArtifactCollection artifactIds={artifacts} />
      </div>
      <button className="primary-action" onClick={onRestart} type="button">
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
