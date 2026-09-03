import { useEffect, useState } from 'react';
import { version } from '../package.json';
import { BattleHud } from './components/BattleHud';
import {
  BattlePreparation,
  CrewManager,
  NodePanel,
  PackOpeningScreen,
  RewardOutcomeScreen,
  RunSetup,
  RunStatus,
  VictoryPanel,
  VoyageEventPanel,
  VoyagePanel,
} from './components/RunPanels';
import { PhaserCanvas } from './game/PhaserCanvas';
import { activePartyHasCapability, shouldRevealBattleIq } from './crew/capabilities';
import { isBattleEncounterLoaded } from './run/battleFlow';
import { shouldShowVoyageNavigation } from './run/navigation';
import { getStoryNode } from './run/storyContent';
import { getCurrentVoyageEvent } from './run/voyageEvents';
import { useBattleStore } from './store/battleStore';
import { useGameSession } from './store/gameSession';
import { canManageShipAssignments, useRunStore } from './store/runStore';

type VoyageScreen = 'map' | 'roster' | 'crew';

function HelmMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3" />
      <path d="M24 3v12M24 33v12M3 24h12M33 24h12M9 9l8.5 8.5M30.5 30.5 39 39M39 9l-8.5 8.5M17.5 30.5 9 39" />
    </svg>
  );
}

function NavigationMark({ screen }: { screen: VoyageScreen }) {
  if (screen === 'map') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <path d="m5 11 11-5 16 5 11-5v31l-11 5-16-5-11 5Z" />
        <path d="M16 6v31M32 11v31" />
        <circle cx="24" cy="23" r="5" />
        <path d="m24 15 2.5 5.5L33 23l-6.5 2.5L24 31l-2.5-5.5L15 23l6.5-2.5Z" />
      </svg>
    );
  }
  if (screen === 'roster') {
    return (
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <path d="M16 8h24v30H16zM10 14h6M10 23h6M10 32h6" />
        <circle cx="28" cy="20" r="5" />
        <path d="M20.5 33c1.5-5 13.5-5 15 0" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48">
      <path d="M8 35h32l-4 7H13Z" />
      <path d="M24 6v29M24 8l12 14H24M21 13 11 27h10" />
      <path d="M5 42h38" />
    </svg>
  );
}

function MapControls() {
  const command = (detail: 'zoom-in' | 'zoom-out' | 'reset') => {
    window.dispatchEvent(new CustomEvent('uopa-map-command', { detail }));
  };

  return (
    <div className="map-controls" aria-label="Map view controls">
      <span>Drag to pan · Scroll to zoom</span>
      <div>
        <button aria-label="Zoom map out" onClick={() => command('zoom-out')} type="button">−</button>
        <button aria-label="Reset map view" onClick={() => command('reset')} type="button">⌖</button>
        <button aria-label="Zoom map in" onClick={() => command('zoom-in')} type="button">+</button>
      </div>
    </div>
  );
}

export function App() {
  const enginePhase = useGameSession((state) => state.phase);
  const runPhase = useRunStore((state) => state.phase);
  const currentNodeId = useRunStore((state) => state.currentNodeId);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterMovePp = useRunStore((state) => state.characterMovePp);
  const characterHp = useRunStore((state) => state.characterHp ?? {});
  const pendingPack = useRunStore((state) => state.pendingPack);
  const rewardPending = useRunStore((state) => state.rewardPending ?? false);
  const resolveBattle = useRunStore((state) => state.resolveBattle);
  const encounterId = useBattleStore((state) => state.encounterId);
  const battleStatus = useBattleStore((state) => state.battle.status);
  const battlePartyIds = useBattleStore((state) => state.activePartyIds);
  const startEncounter = useBattleStore((state) => state.startEncounter);
  const beginVoyage = useRunStore((state) => state.beginVoyage);
  const resetBattle = useBattleStore((state) => state.reset);
  const abandonRun = useRunStore((state) => state.abandonRun);
  const [voyageScreen, setVoyageScreen] = useState<VoyageScreen>('map');
  const currentNode = getStoryNode(currentNodeId);
  const voyageEvent = useRunStore(getCurrentVoyageEvent);
  const currentEncounterId = voyageEvent?.encounterId ?? currentNode?.encounterId;
  const canAssignRoles = useRunStore(canManageShipAssignments);
  const encounterLoaded = isBattleEncounterLoaded({
    runPhase,
    currentEncounterId,
    loadedEncounterId: encounterId,
    activePartyIds,
    loadedPartyIds: battlePartyIds,
    battleStatus,
  });
  const revealBattleIq = shouldRevealBattleIq(
    import.meta.env.DEV,
    activePartyHasCapability(activePartyIds, 'observation-haki'),
  );
  const combatScreenVisible = runPhase === 'battle' && encounterLoaded;
  const showVoyageNavigation = shouldShowVoyageNavigation(runPhase, encounterLoaded);

  const beginEncounter = () => {
    if (!currentEncounterId) return;
    startEncounter(
      currentEncounterId,
      activePartyIds,
      roleAssignments,
      characterStars,
      characterMovePp,
      characterHp,
    );
  };

  useEffect(() => {
    const handleMapDestination = (event: Event) => {
      const nodeId = (event as CustomEvent<string>).detail;
      const node = getStoryNode(nodeId);
      if (!node) return;
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

    window.addEventListener('uopa-map-select-node', handleMapDestination);
    return () => window.removeEventListener('uopa-map-select-node', handleMapDestination);
  }, [
    activePartyIds,
    beginVoyage,
    characterHp,
    characterMovePp,
    characterStars,
    roleAssignments,
    startEncounter,
  ]);

  const restartVoyage = () => {
    if (runPhase !== 'setup' && !window.confirm('Restart the voyage? All current run progress will be lost.')) {
      return;
    }
    resetBattle();
    abandonRun();
    setVoyageScreen('map');
  };

  const statusText = runPhase === 'setup'
    ? 'Alpha ready'
    : runPhase === 'battle'
      ? encounterLoaded
        ? battleStatus === 'active' ? 'Combat ready' : 'Battle resolved'
        : 'Choose your party'
      : enginePhase === 'ready' ? 'Voyage ready' : 'Starting engine';

  const activeScreenLabel = combatScreenVisible
    ? 'Battle stations'
    : voyageScreen === 'roster'
      ? 'Battle party'
      : voyageScreen === 'crew'
        ? 'Ship crew'
        : currentNode?.name ?? 'East Blue chart';

  return (
    <main className={`app-shell phase-${runPhase} ${combatScreenVisible ? 'combat-active' : ''}`}>
      <header className="masthead" aria-label="Voyage HUD">
        <div className="masthead-brand">
          <span className="brand-crest"><HelmMark /></span>
          <div>
            <p className="eyebrow">East Blue Chronicle</p>
            <h1>Grand Line Voyage</h1>
          </div>
        </div>
        {runPhase !== 'setup' && <RunStatus />}
        <div className="masthead-actions">
          <span className="status" data-ready={runPhase === 'setup' || enginePhase === 'ready'}>
            {statusText}
          </span>
          <button
            className="quick-restart"
            disabled={runPhase === 'setup'}
            onClick={restartVoyage}
            title={runPhase === 'setup' ? 'No active voyage' : 'Restart the current voyage'}
            type="button"
          >
            <span aria-hidden="true">↻</span>
            Restart
          </button>
          <span className="app-version">v{version}</span>
        </div>
      </header>

      {runPhase === 'setup' ? (
        <section className="voyage-stage setup-stage">
          <RunSetup />
        </section>
      ) : (
        <div className="voyage-shell">
          {showVoyageNavigation && (
            <nav className="voyage-navigation" aria-label="Voyage screens">
              {([
                ['map', 'Chart'],
                ['roster', 'Party'],
                ['crew', 'Crew'],
              ] as Array<[VoyageScreen, string]>).map(([screen, label]) => (
                <button
                  aria-current={voyageScreen === screen ? 'page' : undefined}
                  aria-label={screen === 'map' ? 'Open voyage chart' : screen === 'roster' ? 'Manage battle party' : 'Manage ship crew'}
                  onClick={() => setVoyageScreen(screen)}
                  type="button"
                  key={screen}
                >
                  <NavigationMark screen={screen} />
                  {label}
                </button>
              ))}
            </nav>
          )}
          <section className="voyage-stage" aria-label={activeScreenLabel}>
            <div className="stage-tab" aria-hidden="true">
              <span>{combatScreenVisible ? '⚔' : voyageScreen === 'map' ? '⌖' : voyageScreen === 'roster' ? '☠' : '⚓'}</span>
              {activeScreenLabel}
            </div>
            {combatScreenVisible ? (
              <BattleHud
                battlefield={(
                  <section className="game-frame battle-frame" aria-label="Battlefield">
                    <PhaserCanvas view="battle" />
                  </section>
                )}
                onDefeat={() => resolveBattle('defeat')}
                onVictory={() => resolveBattle('victory')}
                revealBattleIq={revealBattleIq}
              />
            ) : voyageScreen === 'roster' ? (
              <CrewManager view="roster" />
            ) : voyageScreen === 'crew' ? (
              <CrewManager view="roles" />
            ) : rewardPending ? (
              <RewardOutcomeScreen />
            ) : pendingPack ? (
              <PackOpeningScreen />
            ) : runPhase === 'voyage' ? (
              <VoyageEventPanel />
            ) : runPhase === 'node' ? (
              <>
                <NodePanel />
                {canAssignRoles && <CrewManager view="roles" />}
              </>
            ) : runPhase === 'battle' ? (
              <BattlePreparation onStart={beginEncounter} />
            ) : runPhase === 'victory' ? (
              <>
                <VictoryPanel onRestart={restartVoyage} />
                {canAssignRoles && <CrewManager view="roles" />}
              </>
            ) : (
              <section className="play-workspace map-workspace">
                <section className="game-frame chart-frame" aria-label="Ocean map">
                  <PhaserCanvas view="map" />
                  <MapControls />
                </section>
                <div className="workspace-context"><VoyagePanel /></div>
              </section>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
