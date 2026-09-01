import Phaser from 'phaser';
import {
  getStoryArc,
  getStoryConnectionsForArc,
  getVisitedStoryNodesForArc,
  isNodeAvailable,
  isNodeCompleted,
} from '../run/storyContent';
import type { RunSnapshot, StoryNode } from '../run/types';
import { useRunStore } from '../store/runStore';

const nodeColors = {
  start: 0x74c69d,
  battle: 0xe78450,
  event: 0x9f86d9,
  treasure: 0xe7c75f,
  recruit: 0x62d7a1,
  rest: 0x62b8df,
  boss: 0xe4535d,
} as const;

export class MapScene extends Phaser.Scene {
  private renderedRun?: RunSnapshot;

  constructor() {
    super('story-map');
  }

  create(): void {
    this.renderMap(useRunStore.getState());
  }

  update(): void {
    const run = useRunStore.getState();
    if (run !== this.renderedRun) this.renderMap(run);
  }

  private nodeState(run: RunSnapshot, node: StoryNode): 'complete' | 'available' | 'locked' {
    if (isNodeCompleted(run, node.id)) return 'complete';
    if (isNodeAvailable(run, node)) return 'available';
    return 'locked';
  }

  private renderMap(run: RunSnapshot): void {
    this.renderedRun = run;
    this.children.removeAll(true);

    const ocean = this.add.graphics();
    ocean.fillGradientStyle(0x0b4265, 0x0b4265, 0x062841, 0x062841, 1);
    ocean.fillRect(0, 0, 960, 540);

    ocean.lineStyle(2, 0x8edaf0, 0.1);
    for (let y = 88; y < 530; y += 58) {
      for (let x = -30; x < 990; x += 80) {
        ocean.arc(x + ((y / 58) % 2) * 35, y, 22, Math.PI, Math.PI * 2);
      }
    }

    const activeArc = getStoryArc(run.activeArcId);
    const arcNodes = getVisitedStoryNodesForArc(run);
    const visibleNodeIds = new Set(arcNodes.map((node) => node.id));
    const arcConnections = getStoryConnectionsForArc(run.activeArcId)
      .filter(([fromId, toId]) => visibleNodeIds.has(fromId) && visibleNodeIds.has(toId));
    this.add
      .text(42, 30, activeArc?.mapTitle ?? 'STORY ROUTE', {
        color: '#f7d774',
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setShadow(0, 2, '#02121e', 4);
    this.add.text(44, 61, activeArc?.mapInstruction ?? 'Choose the next reachable destination.', {
      color: '#b5d8e8',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
    });

    const byId = new Map(arcNodes.map((node) => [node.id, node]));
    const routes = this.add.graphics();
    arcConnections.forEach(([fromId, toId]) => {
      const from = byId.get(fromId);
      const to = byId.get(toId);
      if (!from || !to) return;
      const routeTraversed = isNodeCompleted(run, from.id) && isNodeCompleted(run, to.id);
      routes.lineStyle(routeTraversed ? 5 : 3, routeTraversed ? 0xf4d36d : 0x8bb7ca, routeTraversed ? 0.78 : 0.3);
      routes.lineBetween(from.x, from.y, to.x, to.y);
    });

    arcNodes.forEach((node) => {
      const state = this.nodeState(run, node);
      const active = run.currentNodeId === node.id;
      const alpha = state === 'locked' ? 0.34 : 1;
      const marker = this.add.graphics();

      if (state === 'available') {
        marker.lineStyle(4, 0xf7d774, 0.8);
        marker.strokeCircle(node.x, node.y, 34);
      }
      if (active) {
        marker.lineStyle(2, 0xffffff, 0.9);
        marker.strokeCircle(node.x, node.y, 42);
      }

      marker.fillStyle(0x061725, 0.96);
      marker.fillCircle(node.x, node.y, 27);
      marker.lineStyle(5, nodeColors[node.type], alpha);
      marker.strokeCircle(node.x, node.y, 25);

      if (state === 'complete') {
        this.add
          .text(node.x, node.y, '✓', {
            color: '#dff9eb',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
      } else {
        this.add
          .text(node.x, node.y, node.type === 'boss' ? '☠' : '◆', {
            color: state === 'locked' ? '#68808d' : '#ffffff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: node.type === 'boss' ? '20px' : '16px',
          })
          .setOrigin(0.5);
      }

      this.add
        .text(node.x, node.y + 45, node.name, {
          align: 'center',
          color: state === 'locked' ? '#718997' : '#effaff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(node.x, node.y + 63, node.subtitle, {
          align: 'center',
          color: state === 'locked' ? '#536b78' : '#9fc1d1',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
        })
        .setOrigin(0.5);
    });

    const legendText = this.add
      .text(928, 43, 'Gold ring = reachable  ·  ✓ = cleared', {
        color: '#d5e8ef',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
      })
      .setOrigin(1, 0)
      .setDepth(1);
    const bounds = legendText.getBounds();
    const legend = this.add.graphics().setDepth(0);
    legend.fillStyle(0x031522, 0.72);
    legend.fillRoundedRect(bounds.x - 16, bounds.y - 17, bounds.width + 32, bounds.height + 34, 10);
  }
}
