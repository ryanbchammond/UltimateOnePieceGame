import Phaser from 'phaser';
import { BattleScene } from './BattleScene';
import { MapScene } from './MapScene';

export type GameView = 'map' | 'battle';

export function createGame(parent: HTMLElement, view: GameView): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 540,
    backgroundColor: '#0b3558',
    scene: view === 'battle' ? [BattleScene] : [MapScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
