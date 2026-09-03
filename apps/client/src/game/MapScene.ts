import Phaser from 'phaser';
import {
  getStoryArc,
  getAvailableNodes,
  getStoryConnectionsForArc,
  getStoryNode,
  getStoryNodesForArc,
  getStoryTravelRule,
  isNodeAvailable,
  isNodeCompleted,
  isNodeVisited,
} from '../run/storyContent';
import type { RunSnapshot, StoryNode } from '../run/types';
import { useRunStore } from '../store/runStore';

const nodeColors = {
  start: 0x2d7b72,
  battle: 0xb94b3f,
  event: 0x536a8a,
  treasure: 0xb8842e,
  recruit: 0x2d7b72,
  rest: 0x397aa1,
  boss: 0x9d2f35,
} as const;

const mapWidth = 960;
const mapHeight = 540;
const horizontalOverscroll = mapWidth / 2;
const verticalOverscroll = mapHeight / 2;
const minimumMapZoom = 0.6;
const maximumMapZoom = 2.5;
const choiceGuideInset = mapWidth * 0.26;

export class MapScene extends Phaser.Scene {
  private renderedRun?: RunSnapshot;
  private lastAnimatedVoyageId?: string;
  private lastFocusedVoyageId?: string;
  private lastChoiceFrameKey?: string;
  private dragging = false;
  private dragPoint = new Phaser.Math.Vector2();
  private dragDistance = 0;
  private pinchDistance = 0;

  constructor() {
    super('story-map');
  }

  create(): void {
    this.setupCameraControls();
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

  private zoomAt(screenX: number, screenY: number, zoom: number): void {
    const camera = this.cameras.main;
    const nextZoom = Phaser.Math.Clamp(zoom, minimumMapZoom, maximumMapZoom);
    if (Math.abs(nextZoom - camera.zoom) < 0.001) return;

    const before = camera.getWorldPoint(screenX, screenY);
    camera.setZoom(nextZoom);
    const after = camera.getWorldPoint(screenX, screenY);
    camera.scrollX += before.x - after.x;
    camera.scrollY += before.y - after.y;
  }

  private resetCamera(): void {
    const camera = this.cameras.main;
    camera.setZoom(1);
    camera.centerOn(mapWidth / 2, mapHeight / 2);

    const run = useRunStore.getState();
    const completedVoyageDestination = run.pendingVoyage &&
      run.pendingVoyage.currentEventIndex >= run.pendingVoyage.eventIds.length
      ? run.pendingVoyage.destinationNodeId
      : null;
    const choiceNodes = getAvailableNodes(run).filter(
      (node) => !completedVoyageDestination || node.id === completedVoyageDestination,
    );
    this.lastChoiceFrameKey = undefined;
    this.frameChoiceNodes(run, choiceNodes);
  }

  private focusCameraOnNode(node: StoryNode, duration: number): void {
    const camera = this.cameras.main;
    const zoom = 1.35;
    // Phaser applies zoom around the camera midpoint, so scroll remains based on
    // the unzoomed viewport size. Dividing these offsets by zoom pushes edge
    // nodes away from the center as the camera closes in.
    const targetScrollX = node.x - camera.width / 2;
    const targetScrollY = node.y - camera.height / 2;

    if (duration === 0) {
      camera.setZoom(zoom);
      camera.setScroll(targetScrollX, targetScrollY);
      return;
    }

    this.tweens.add({
      targets: camera,
      zoom,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      duration,
      ease: 'Sine.InOut',
      onComplete: () => camera.centerOn(node.x, node.y),
    });
  }

  private frameChoiceNodes(run: RunSnapshot, nodes: StoryNode[]): void {
    if (
      run.mapTravelPending ||
      run.mapFocusPending ||
      nodes.length === 0 ||
      window.matchMedia('(max-width: 900px)').matches
    ) {
      return;
    }

    const currentNode = run.currentNodeId
      ? getStoryNode(run.currentNodeId)
      : undefined;
    const relevantNodes = currentNode
      ? [currentNode, ...nodes.filter((node) => node.id !== currentNode.id)]
      : nodes;
    const frameKey = `${run.activeArcId}:${currentNode?.id ?? 'none'}:${nodes
      .map((node) => node.id)
      .join(',')}`;
    if (this.lastChoiceFrameKey === frameKey) return;
    this.lastChoiceFrameKey = frameKey;

    const camera = this.cameras.main;
    const leftmost = Math.min(...relevantNodes.map((node) => node.x));
    const rightmost = Math.max(...relevantNodes.map((node) => node.x));
    const relevantCenterX = (leftmost + rightmost) / 2;
    const safeViewportCenterX = (camera.width - choiceGuideInset) / 2;
    const targetMidpointX = relevantCenterX +
      (camera.width / 2 - safeViewportCenterX) / camera.zoom;
    const targetScrollX = targetMidpointX - camera.width / 2;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;

    if (duration === 0) {
      camera.setScroll(targetScrollX, camera.scrollY);
      return;
    }

    this.tweens.add({
      targets: camera,
      scrollX: targetScrollX,
      duration,
      ease: 'Sine.InOut',
    });
  }

  private setupCameraControls(): void {
    const camera = this.cameras.main;
    camera.setBounds(
      -horizontalOverscroll,
      -verticalOverscroll,
      mapWidth + horizontalOverscroll * 2,
      mapHeight + verticalOverscroll * 2,
    );
    camera.setBackgroundColor('#071a24');
    camera.setRoundPixels(true);
    this.input.addPointer(1);
    this.input.setDefaultCursor('grab');

    this.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _objects: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
    ) => {
      const run = useRunStore.getState();
      if (run.mapTravelPending || run.mapFocusPending) return;
      this.zoomAt(pointer.x, pointer.y, camera.zoom - deltaY * 0.0012);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const run = useRunStore.getState();
      if (run.mapTravelPending || run.mapFocusPending) return;
      this.dragging = true;
      this.dragDistance = 0;
      this.dragPoint.set(pointer.x, pointer.y);
      this.game.canvas.style.cursor = 'grabbing';
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const first = this.input.pointer1;
      const second = this.input.pointer2;
      if (first.isDown && second.isDown) {
        this.dragDistance = Number.POSITIVE_INFINITY;
        const distance = Phaser.Math.Distance.Between(first.x, first.y, second.x, second.y);
        if (this.pinchDistance > 0) {
          this.zoomAt(
            (first.x + second.x) / 2,
            (first.y + second.y) / 2,
            camera.zoom * (distance / this.pinchDistance),
          );
        }
        this.pinchDistance = distance;
        return;
      }

      this.pinchDistance = 0;
      if (!this.dragging || !pointer.isDown) return;
      this.dragDistance += Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        this.dragPoint.x,
        this.dragPoint.y,
      );
      camera.scrollX -= (pointer.x - this.dragPoint.x) / camera.zoom;
      camera.scrollY -= (pointer.y - this.dragPoint.y) / camera.zoom;
      this.dragPoint.set(pointer.x, pointer.y);
    });

    const stopDragging = () => {
      this.dragging = false;
      this.pinchDistance = 0;
      this.game.canvas.style.cursor = 'grab';
    };
    this.input.on('pointerup', stopDragging);
    this.input.on('gameout', stopDragging);

    const handleMapCommand = (event: Event) => {
      const command = (event as CustomEvent<'zoom-in' | 'zoom-out' | 'reset'>).detail;
      if (command === 'reset') {
        this.resetCamera();
      } else {
        this.zoomAt(480, 270, camera.zoom + (command === 'zoom-in' ? 0.25 : -0.25));
      }
    };
    window.addEventListener('uopa-map-command', handleMapCommand);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('uopa-map-command', handleMapCommand);
    });

    this.input.keyboard?.on('keydown-PLUS', () => this.zoomAt(480, 270, camera.zoom + 0.25));
    this.input.keyboard?.on('keydown-MINUS', () => this.zoomAt(480, 270, camera.zoom - 0.25));
    this.input.keyboard?.on('keydown-ZERO', () => this.resetCamera());
  }

  private markerKindForNode(nodeId: string): 'ship' | 'party' {
    return nodeId === 'barrel-at-sea' ? 'ship' : 'party';
  }

  private createCrewMarker(
    x: number,
    y: number,
    kind: 'ship' | 'party',
  ): Phaser.GameObjects.Container {
    const badge = this.add.graphics();
    badge.fillStyle(0x102f3d, 0.98);
    badge.fillTriangle(-7, 18, 7, 18, 0, 29);
    badge.fillCircle(0, 0, 23);
    badge.lineStyle(3, 0xe2b84e, 1);
    badge.strokeCircle(0, 0, 22);

    const icon = this.add.graphics();
    icon.fillStyle(0xf7df87, 1);
    icon.lineStyle(2, 0xf7df87, 1);
    if (kind === 'ship') {
      icon.lineBetween(0, -13, 0, 8);
      icon.fillTriangle(1, -12, 1, 3, 13, 3);
      icon.lineBetween(-11, 8, 11, 8);
      icon.lineBetween(-8, 13, 8, 13);
      icon.lineBetween(-11, 8, -8, 13);
      icon.lineBetween(11, 8, 8, 13);
    } else {
      icon.fillCircle(-7, -6, 4);
      icon.fillCircle(7, -6, 4);
      icon.fillCircle(0, -11, 4.5);
      icon.fillRoundedRect(-13, 0, 11, 9, 4);
      icon.fillRoundedRect(2, 0, 11, 9, 4);
      icon.fillRoundedRect(-6, -3, 12, 11, 4);
    }

    return this.add.container(x, y, [badge, icon]).setDepth(50);
  }

  private addMarkerIdle(marker: Phaser.GameObjects.Container): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.tweens.add({
      targets: marker,
      y: marker.y - 3,
      duration: 850,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private renderCrewMarker(run: RunSnapshot, nodes: Map<string, StoryNode>): void {
    const currentNode = run.currentNodeId ? nodes.get(run.currentNodeId) : undefined;
    if (!currentNode) return;

    const leg = run.pendingVoyage;
    const travelPending = Boolean(
      leg &&
      run.mapTravelPending &&
      leg.destinationNodeId === currentNode.id
    );
    const origin = travelPending && leg ? nodes.get(leg.fromNodeId) : undefined;

    if (leg && origin && travelPending && this.lastAnimatedVoyageId !== leg.id) {
      this.lastAnimatedVoyageId = leg.id;
      const travelKind = getStoryTravelRule(origin.id, currentNode.id).context === 'open-sea'
        ? 'ship'
        : 'party';
      const marker = this.createCrewMarker(origin.x, origin.y - 49, travelKind);
      const distance = Phaser.Math.Distance.Between(origin.x, origin.y, currentNode.x, currentNode.y);
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = Phaser.Math.Clamp(distance * 4.2, 850, 2100);
      this.focusCameraOnNode(currentNode, reducedMotion ? 0 : duration);

      if (reducedMotion) {
        marker.destroy();
        this.addMarkerIdle(this.createCrewMarker(
          currentNode.x,
          currentNode.y - 49,
          this.markerKindForNode(currentNode.id),
        ));
        this.time.delayedCall(350, () => useRunStore.getState().completeTravelPreview());
        return;
      }

      this.tweens.add({
        targets: marker,
        x: currentNode.x,
        y: currentNode.y - 49,
        duration,
        ease: 'Sine.InOut',
        onComplete: () => {
          marker.destroy();
          this.addMarkerIdle(this.createCrewMarker(
            currentNode.x,
            currentNode.y - 49,
            this.markerKindForNode(currentNode.id),
          ));
          this.time.delayedCall(350, () => useRunStore.getState().completeTravelPreview());
        },
      });
      return;
    }

    if (
      leg &&
      run.mapFocusPending &&
      leg.destinationNodeId === currentNode.id &&
      this.lastFocusedVoyageId !== leg.id
    ) {
      this.lastFocusedVoyageId = leg.id;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reducedMotion ? 0 : 700;
      this.focusCameraOnNode(currentNode, duration);
      this.addMarkerIdle(this.createCrewMarker(
        currentNode.x,
        currentNode.y - 49,
        this.markerKindForNode(currentNode.id),
      ));
      this.time.delayedCall(duration + 350, () => useRunStore.getState().completeMapFocus());
      return;
    }

    this.addMarkerIdle(this.createCrewMarker(
      currentNode.x,
      currentNode.y - 49,
      this.markerKindForNode(currentNode.id),
    ));
  }

  private renderMap(run: RunSnapshot): void {
    this.renderedRun = run;
    this.children.removeAll(true);

    const ocean = this.add.graphics();
    ocean.fillGradientStyle(0xdcd0a6, 0xd5c697, 0xcaba87, 0xd7c99d, 1);
    ocean.fillRect(0, 0, 960, 540);

    ocean.lineStyle(2, 0x29495a, 0.09);
    for (let y = 88; y < 530; y += 58) {
      for (let x = -30; x < 990; x += 80) {
        ocean.arc(x + ((y / 58) % 2) * 35, y, 22, Math.PI, Math.PI * 2);
      }
    }

    ocean.lineStyle(2, 0x263c46, 0.22);
    ocean.strokeRoundedRect(17, 17, 926, 506, 7);
    ocean.lineStyle(1, 0x263c46, 0.13);
    ocean.strokeRoundedRect(23, 23, 914, 494, 5);

    const compass = this.add.graphics();
    compass.lineStyle(2, 0x263c46, 0.28);
    compass.strokeCircle(82, 454, 37);
    compass.strokeCircle(82, 454, 27);
    compass.lineBetween(82, 408, 82, 500);
    compass.lineBetween(36, 454, 128, 454);
    compass.fillStyle(0x263c46, 0.26);
    compass.fillTriangle(82, 414, 75, 454, 89, 454);
    compass.fillTriangle(122, 454, 82, 447, 82, 461);
    this.add.text(82, 399, 'N', {
      color: '#30434a',
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.6);

    const activeArc = getStoryArc(run.activeArcId);
    const arcNodes = getStoryNodesForArc(run.activeArcId);
    const arcConnections = getStoryConnectionsForArc(run.activeArcId);
    const completedVoyageDestination = run.pendingVoyage &&
      run.pendingVoyage.currentEventIndex >= run.pendingVoyage.eventIds.length
      ? run.pendingVoyage.destinationNodeId
      : null;
    const numberedDestinations = run.mapTravelPending || run.mapFocusPending
      ? []
      : getAvailableNodes(run).filter(
          (node) => !completedVoyageDestination || node.id === completedVoyageDestination,
        );
    const destinationNumbers = new Map(
      numberedDestinations.map((node, index) => [node.id, index + 1]),
    );
    this.add
      .text(42, 30, activeArc?.mapTitle ?? 'STORY ROUTE', {
        color: '#243840',
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setShadow(1, 1, '#f4e8bd', 1);
    this.add.text(44, 61, activeArc?.mapInstruction ?? 'Choose the next reachable destination.', {
      color: '#53646a',
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
      const distance = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      const steps = Math.max(2, Math.floor(distance / 14));
      routes.fillStyle(routeTraversed ? 0x8e5b26 : 0x34464d, routeTraversed ? 0.78 : 0.38);
      for (let step = 0; step <= steps; step += 1) {
        const progress = step / steps;
        routes.fillCircle(
          Phaser.Math.Linear(from.x, to.x, progress),
          Phaser.Math.Linear(from.y, to.y, progress),
          routeTraversed ? 2.2 : 1.7,
        );
      }
    });

    arcNodes.forEach((node) => {
      const state = this.nodeState(run, node);
      const explored = isNodeVisited(run, node.id);
      const active = run.currentNodeId === node.id;
      const destinationNumber = destinationNumbers.get(node.id);
      const alpha = !explored ? 0.46 : state === 'locked' ? 0.34 : 1;
      const marker = this.add.graphics();

      if (state === 'available') {
        marker.fillStyle(0xf6ead0, 0.78);
        marker.fillCircle(node.x, node.y, 37);
        marker.lineStyle(4, 0xb47e2e, 0.9);
        marker.strokeCircle(node.x, node.y, 35);
      }
      if (active) {
        marker.lineStyle(3, 0x233942, 0.68);
        marker.strokeCircle(node.x, node.y, 43);
      }

      marker.fillStyle(state === 'locked' ? 0xb9ae89 : 0xf2e6bd, 0.98);
      marker.fillCircle(node.x, node.y, 27);
      marker.lineStyle(5, nodeColors[node.type], alpha * 0.95);
      marker.strokeCircle(node.x, node.y, 25);

      if (!explored) {
        this.add
          .text(node.x, node.y - 1, '?', {
            color: state === 'available' ? '#8f6124' : '#746d5b',
            fontFamily: 'Georgia, serif',
            fontSize: '27px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
      } else if (state === 'complete') {
        this.add
          .text(node.x, node.y, '✓', {
            color: '#2d6d5f',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
      } else {
        this.add
          .text(node.x, node.y, node.type === 'boss' ? '☠' : '◆', {
            color: state === 'locked' ? '#776f5b' : '#263b43',
            fontFamily: 'system-ui, sans-serif',
            fontSize: node.type === 'boss' ? '20px' : '16px',
          })
          .setOrigin(0.5);
      }

      this.add
        .text(node.x, node.y + 45, explored ? node.name : 'Uncharted', {
          align: 'center',
          color: state === 'locked' ? '#817964' : '#263a42',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(node.x, node.y + 63, explored ? node.subtitle : 'Unknown waters', {
          align: 'center',
          color: state === 'locked' ? '#948a70' : '#5b696d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
        })
        .setOrigin(0.5);

      if (destinationNumber) {
        const numberBadge = this.add.graphics().setDepth(42);
        numberBadge.fillStyle(0x9d3537, 1);
        numberBadge.fillCircle(node.x + 24, node.y - 24, 13);
        numberBadge.lineStyle(2, 0xf7df87, 1);
        numberBadge.strokeCircle(node.x + 24, node.y - 24, 12);
        this.add.text(node.x + 24, node.y - 25, `${destinationNumber}`, {
          color: '#fff4c6',
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(43);
      }

      if (state === 'available' && !run.mapTravelPending && !run.mapFocusPending) {
        const hitArea = this.add
          .zone(node.x, node.y + 18, 96, 116)
          .setDepth(40)
          .setInteractive({ cursor: 'pointer' });
        hitArea.on('pointerup', () => {
          if (this.dragDistance >= 8) return;
          window.dispatchEvent(new CustomEvent('uopa-map-select-node', { detail: node.id }));
        });
      }
    });

    this.renderCrewMarker(run, byId);
    this.frameChoiceNodes(run, numberedDestinations);

    const legendText = this.add
      .text(928, 40, 'Click gold rings to travel  ·  ? = uncharted\nCrew badge = current position', {
        align: 'right',
        color: '#3d4d52',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        lineSpacing: 5,
      })
      .setOrigin(1, 0)
      .setDepth(1);
    const bounds = legendText.getBounds();
    const legend = this.add.graphics().setDepth(0);
    legend.fillStyle(0xf0e4bd, 0.82);
    legend.lineStyle(1, 0x5e5a4b, 0.28);
    legend.fillRoundedRect(bounds.x - 16, bounds.y - 17, bounds.width + 32, bounds.height + 34, 10);
    legend.strokeRoundedRect(bounds.x - 16, bounds.y - 17, bounds.width + 32, bounds.height + 34, 10);
  }
}
