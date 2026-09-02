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
  private renderedTargetId = '';

  constructor() {
    super('battle');
  }

  create(): void {
    this.renderBattle(useBattleStore.getState().battle);
  }

  update(): void {
    const { battle, selectedTargetId } = useBattleStore.getState();
    if (battle !== this.renderedBattle || selectedTargetId !== this.renderedTargetId) {
      this.renderBattle(battle);
    }
  }

  private drawFighter(
    fighter: Fighter,
    x: number,
    y: number,
    active: boolean,
    selected: boolean,
    targetable: boolean,
  ): void {
    const graphics = this.add.graphics();
    const alpha = fighter.hp > 0 ? 1 : 0.28;

    if (selected || active) {
      graphics.lineStyle(selected ? 5 : 3, selected ? 0xf7d774 : 0x8edafa, 1);
      graphics.strokeCircle(x, y, selected ? 48 : 45);
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

    if (selected) {
      this.add
        .text(x, y - 57, 'TARGET', {
          color: '#f7d774',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    this.add
      .text(x, y + 47, `${fighter.name}  ${fighter.hp}/${fighter.maxHp} HP`, {
        color: fighter.hp > 0 ? '#e9f5fc' : '#66737d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        x,
        y + 63,
        `${fighter.types.map((type) => type[0].toUpperCase() + type.slice(1)).join(' · ')}${fighter.devilFruitUser ? ' · Devil Fruit' : ''}`,
        {
          color: fighter.hp > 0 ? '#9fc1d3' : '#66737d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
        },
      )
      .setOrigin(0.5);

    const barWidth = 116;
    const hpRatio = fighter.hp / fighter.maxHp;
    graphics.fillStyle(0x07101a, 0.95);
    graphics.fillRoundedRect(x - barWidth / 2, y + 74, barWidth, 8, 4);
    graphics.fillStyle(hpRatio > 0.45 ? 0x48c98a : hpRatio > 0.2 ? 0xf1b84b : 0xed5d62, alpha);
    graphics.fillRoundedRect(x - barWidth / 2, y + 74, barWidth * hpRatio, 8, 4);

    if (fighter.activeEffects.length > 0) {
      const effects = fighter.activeEffects.map((effect) =>
        effect.effect === 'guard'
          ? `Guard ${effect.damageReductionPercent}%`
          : `${effect.stat === 'attack' ? 'ATK' : 'DEF'} ${effect.modifierPercent > 0 ? '+' : ''}${effect.modifierPercent}% ${effect.remainingRounds}r`,
      );
      this.add
        .text(x, y + 91, effects.join(' · '), {
          color: '#f7d774',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
    }

    if (targetable) {
      this.add
        .zone(x, y, 86, 86)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => useBattleStore.getState().selectTarget(fighter.id));
    }
  }

  private renderBattle(battle: BattleState): void {
    this.renderedBattle = battle;
    const { selectedTargetId } = useBattleStore.getState();
    this.renderedTargetId = selectedTargetId;
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
      .text(210, 35, 'STRAW HAT CREW', {
        color: '#9fe8c4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(750, 35, 'ENEMY CREW', {
        color: '#ffb0a6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const left = battle.fighters.filter((fighter) => fighter.side === 'player');
    const right = battle.fighters.filter((fighter) => fighter.side === 'enemy');
    const positions = [
      [180, 125],
      [340, 225],
      [180, 330],
      [340, 435],
    ];

    left.forEach((fighter, index) => {
      const [x, y] = positions[index];
      this.drawFighter(fighter, x, y, fighter.id === current?.id, false, false);
    });
    right.forEach((fighter, index) => {
      const [sourceX, y] = positions[index];
      this.drawFighter(
        fighter,
        960 - sourceX,
        y,
        fighter.id === current?.id,
        fighter.id === selectedTargetId && fighter.hp > 0,
        current?.side === 'player' && fighter.hp > 0,
      );
    });

    backdrop.lineStyle(2, 0xe5f4fb, 0.15);
    backdrop.lineBetween(480, 60, 480, 510);
  }
}
