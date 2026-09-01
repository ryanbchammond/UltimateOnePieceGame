import { useEffect } from 'react';
import { BattleHud } from './components/BattleHud';
import {
  CrewManager,
  NodePanel,
  RewardReceiptPanel,
  RunSetup,
  RunStatus,
  VictoryPanel,
  VoyagePanel,
} from './components/RunPanels';
import { PhaserCanvas } from './game/PhaserCanvas';
import { activePartyHasCapability, shouldRevealBattleIq } from './crew/capabilities';
import { getStoryNode } from './run/storyContent';
import { useBattleStore } from './store/battleStore';
import { useGameSession } from './store/gameSession';
import { canManageShipAssignments, useRunStore } from './store/runStore';

export function App() {
  const enginePhase = useGameSession((state) => state.phase);
  const runPhase = useRunStore((state) => state.phase);
  const currentNodeId = useRunStore((state) => state.currentNodeId);
  const activePartyIds = useRunStore((state) => state.activePartyIds);
  const roleAssignments = useRunStore((state) => state.roleAssignments);
  const characterStars = useRunStore((state) => state.characterStars);
  const characterMovePp = useRunStore((state) => state.characterMovePp);
  const pendingPack = useRunStore((state) => state.pendingPack);
  const resolveBattle = useRunStore((state) => state.resolveBattle);
  const encounterId = useBattleStore((state) => state.encounterId);
  const battlePartyIds = useBattleStore((state) => state.activePartyIds);
  const startEncounter = useBattleStore((state) => state.startEncounter);
  const currentNode = getStoryNode(currentNodeId);
  const canManageCrewAtNode = useRunStore(canManageShipAssignments);
  const gameView = runPhase === 'battle' ? 'battle' : 'map';
  const revealBattleIq = shouldRevealBattleIq(
    import.meta.env.DEV,
    activePartyHasCapability(activePartyIds, 'observation-haki'),
  );

  useEffect(() => {
    if (
      runPhase === 'battle' &&
      currentNode?.encounterId &&
      (currentNode.encounterId !== encounterId ||
        activePartyIds.length !== battlePartyIds.length ||
        activePartyIds.some((id, index) => id !== battlePartyIds[index]))
    ) {
      startEncounter(
        currentNode.encounterId,
        activePartyIds,
        roleAssignments,
        characterStars,
        characterMovePp,
      );
    }
  }, [
    activePartyIds,
    battlePartyIds,
    currentNode?.encounterId,
    encounterId,
    runPhase,
    startEncounter,
    roleAssignments,
    characterStars,
    characterMovePp,
  ]);

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Development build</p>
          <h1>Ultimate One Piece Adventure</h1>
        </div>
        <span className="status" data-ready={runPhase === 'setup' || enginePhase === 'ready'}>
          {runPhase === 'setup'
            ? 'Alpha ready'
            : enginePhase === 'ready'
              ? runPhase === 'battle'
                ? 'Combat ready'
                : 'Map ready'
              : 'Starting engine'}
        </span>
      </header>

      {runPhase === 'setup' ? (
        <RunSetup />
      ) : (
        <>
          <RunStatus />
          <RewardReceiptPanel />
          <section className={`play-workspace ${runPhase}-workspace`}>
            <section
              className="game-frame"
              aria-label={gameView === 'battle' ? 'Battlefield' : 'Ocean map'}
            >
              <PhaserCanvas view={gameView} />
            </section>
            <div className="workspace-context">
              {runPhase === 'map' && <VoyagePanel />}
              {runPhase === 'node' && <NodePanel />}
              {runPhase === 'battle' && (
                <BattleHud
                  onDefeat={() => resolveBattle('defeat')}
                  onVictory={() => resolveBattle('victory')}
                  revealBattleIq={revealBattleIq}
                />
              )}
              {runPhase === 'victory' && <VictoryPanel />}
            </div>
          </section>
          {runPhase === 'map' && (
            <CrewManager />
          )}
          {runPhase === 'node' && (
            canManageCrewAtNode && !pendingPack && <CrewManager />
          )}
        </>
      )}
    </main>
  );
}
