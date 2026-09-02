import Phaser from 'phaser';
import { getCurrentFighter } from '../combat/engine';
import type { BattleState, Element, Fighter } from '../combat/types';
import { useBattleStore } from '../store/battleStore';

const elementColors: Record<Element, number> = {
  brawler: 0xe77945,
  swordsman: 0x9ca8b8,
  sniper: 0xd8bd58,
  fire: 0xf05245,
  ice: 0x9ce8f2,
  poison: 0xa65ad1,
  water: 0x4aaee8,
  earth: 0xa8794f,
  lightning: 0xf6dc55,
  nature: 0x65b66f,
  magic: 0xec8cff,
  beast: 0xa979d1,
};

export class BattleScene extends Phaser.Scene {
  private renderedBattle?: BattleState;

  constructor() {
    super('battle');
  }

  create(): void {
    this.renderBattle(useBattleStore.getState().battle);
  }

  update(): void {
    const battle = useBattleStore.getState().battle;
    if (battle !== this.renderedBattle) this.renderBattle(battle);
  }

  private drawFighter(fighter: Fighter, x: number, y: number, active: boolean): void {
    const graphics = this.add.graphics();
    const alpha = fighter.hp > 0 ? 1 : 0.28;

    if (active) {
      graphics.lineStyle(4, 0xf7d774, 1);
      graphics.strokeCircle(x, y, 45);
    }

    graphics.fillStyle(0x061522, 0.96 * alpha);
    graphics.fillCircle(x, y, 38);
    graphics.lineStyle(4, elementColors[fighter.types[0]], alpha);
    graphics.strokeCircle(x, y, 36);

    this.add
      .text(x, y - 5, fighter.name.slice(0, 2).toUpperCase(), {
        color: fighter.hp > 0 ? '#ffffff' : '#66737d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 53, fighter.name, {
        color: fighter.hp > 0 ? '#e9f5fc' : '#66737d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const barWidth = 112;
    const hpRatio = fighter.hp / fighter.maxHp;
    graphics.fillStyle(0x07101a, 0.95);
    graphics.fillRoundedRect(x - barWidth / 2, y + 69, barWidth, 9, 4);
    graphics.fillStyle(hpRatio > 0.45 ? 0x48c98a : hpRatio > 0.2 ? 0xf1b84b : 0xed5d62, alpha);
    graphics.fillRoundedRect(x - barWidth / 2, y + 69, barWidth * hpRatio, 9, 4);
  }

  private renderBattle(battle: BattleState): void {
    this.renderedBattle = battle;
    this.children.removeAll(true);
    const current = getCurrentFighter(battle);
    const backdrop = this.add.graphics();

    backdrop.fillGradientStyle(0x082844, 0x082844, 0x0c4968, 0x0c4968, 1);
    backdrop.fillRect(0, 0, 960, 540);
    backdrop.fillStyle(0x6dc4de, 0.12);
    for (let y = 90; y < 540; y += 70) {
      for (let x = -30; x < 990; x += 90) backdrop.fillCircle(x + (y % 140), y, 42);
    }

    this.add
      .text(480, 30, `ROUND ${battle.round}`, {
        color: '#f7d774',
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(480, 64, current ? `${current.name}'s turn` : battle.status.toUpperCase(), {
        color: '#d9edf7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5);

    if (battle.lastAction) {
      this.add
        .text(480, 88, `${battle.lastAction.actorName} · ${battle.lastAction.moveName}`, {
          color: battle.lastAction.side === 'enemy' ? '#ffb0a6' : '#9fe8c4',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    const left = battle.fighters.filter((fighter) => fighter.side === 'player');
    const right = battle.fighters.filter((fighter) => fighter.side === 'enemy');
    const positions = [
      [225, 165],
      [365, 260],
      [225, 355],
      [365, 450],
    ];

    left.forEach((fighter, index) => {
      const [x, y] = positions[index];
      this.drawFighter(fighter, x, y, fighter.id === current?.id);
    });
    right.forEach((fighter, index) => {
      const [sourceX, y] = positions[index];
      this.drawFighter(fighter, 960 - sourceX, y, fighter.id === current?.id);
    });

    backdrop.lineStyle(2, 0xe5f4fb, 0.15);
    backdrop.lineBetween(480, 100, 480, 500);
  }
}
