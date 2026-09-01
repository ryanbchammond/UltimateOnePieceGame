import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameSession } from '../store/gameSession';
import { createGame, type GameView } from './createGame';

export function PhaserCanvas({ view }: { view: GameView }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setPhase = useGameSession((state) => state.setPhase);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.replaceChildren();
    let game: Phaser.Game | undefined;
    const markReady = () => setPhase('ready');

    const animationFrame = window.requestAnimationFrame(() => {
      if (!container.isConnected) return;
      game = createGame(container, view);

      if (game.isBooted) {
        markReady();
      } else {
        game.events.once(Phaser.Core.Events.READY, markReady);
      }
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      game?.events.off(Phaser.Core.Events.READY, markReady);
      game?.destroy(true);
      container.replaceChildren();
      setPhase('booting');
    };
  }, [setPhase, view]);

  return <div className="game-canvas" ref={containerRef} />;
}
