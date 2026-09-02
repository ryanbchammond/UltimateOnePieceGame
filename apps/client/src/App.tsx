import { useState } from 'react';
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
  VoyagePanel,
} from './components/RunPanels';
import { PhaserCanvas } from './game/PhaserCanvas';
import { activePartyHasCapability, shouldRevealBattleIq } from './crew/capabilities';
import { isBattleEncounterLoaded } from './run/battleFlow';
import { shouldShowVoyageNavigation } from './run/navigation';
import { getStoryNode } from './run/storyContent';
import { useBattleStore } from './store/battleStore';
import { useGameSession } from './store/gameSession';
import { canManageShipAssignments, useRunStore } from './store/runStore';

type VoyageScreen = 'map' | 'roster' | 'crew';

export function App() {
  const enginePhase = useGameSession((state) => state.phase);
  const runPhase = useRunStore((state) => state.phase);
  const currentNodeId = useRunStore((state) => state.currentNodeId);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterMovePp = useRunStore((state) => state.characterMovePp);
  const pendingPack = useRunStore((state) => state.pendingPack);
  const rewardPending = useRunStore((state) => state.rewardPending ?? false);
  const resolveBattle = useRunStore((state) => state.resolveBattle);
  const encounterId = useBattleStore((state) => state.encounterId);
  const battleStatus = useBattleStore((state) => state.battle.status);
  const battlePartyIds = useBattleStore((state) => state.activePartyIds);
  const startEncounter = useBattleStore((state) => state.startEncounter);
  const resetBattle = useBattleStore((state) => state.reset);
  const abandonRun = useRunStore((state) => state.abandonRun);
  const [voyageScreen, setVoyageScreen] = useState<VoyageScreen>('map');
  const currentNode = getStoryNode(currentNodeId);
  const canAssignRoles = useRunStore(canManageShipAssignments);
  const encounterLoaded = isBattleEncounterLoaded({
    runPhase,
    currentEncounterId: currentNode?.encounterId,
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
    if (!currentNode?.encounterId) return;
    startEncounter(
      currentNode.encounterId,
      activePartyIds,
      roleAssignments,
      characterStars,
      characterMovePp,
    );
  };

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

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Development build</p>
          <h1>Ultimate One Piece Adventure</h1>
        </div>
        <div className="masthead-actions">
          <span className="app-version">v{version}</span>
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
            Restart
          </button>
        </div>
      </header>

      {runPhase === 'setup' ? (
        <RunSetup />
      ) : (
        <>
          <RunStatus />
          {showVoyageNavigation && (
            <nav className="voyage-navigation" aria-label="Voyage screens">
              {([
                ['map', 'Map'],
                ['roster', 'Battle Party'],
                ['crew', 'Ship Crew'],
              ] as Array<[VoyageScreen, string]>).map(([screen, label]) => (
                <button
                  aria-current={voyageScreen === screen ? 'page' : undefined}
                  onClick={() => setVoyageScreen(screen)}
                  type="button"
                  key={screen}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
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
              <section className="game-frame" aria-label="Ocean map">
                <PhaserCanvas view="map" />
              </section>
              <div className="workspace-context"><VoyagePanel /></div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
