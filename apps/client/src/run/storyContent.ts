import {
  eastBluePrototypeArc,
  eastBluePrototypeChoices,
  eastBluePrototypeConnections,
  eastBluePrototypeNodes,
} from './eastBlueMap';
import {
  romanceDawnArc,
  romanceDawnChoices,
  romanceDawnConnections,
  romanceDawnNodes,
} from './romanceDawnMap';
import {
  orangeTownArc,
  orangeTownChoices,
  orangeTownConnections,
  orangeTownNodes,
} from './orangeTownMap';
import {
  syrupVillageArc,
  syrupVillageChoices,
  syrupVillageConnections,
  syrupVillageNodes,
} from './syrupVillageMap';
import {
  baratieArc,
  baratieChoices,
  baratieConnections,
  baratieNodes,
} from './baratieMap';
import {
  arlongParkArc,
  arlongParkChoices,
  arlongParkConnections,
  arlongParkNodes,
} from './arlongParkMap';
import {
  loguetownArc,
  loguetownChoices,
  loguetownConnections,
  loguetownNodes,
} from './loguetownMap';
import type {
  NodeService,
  RunSnapshot,
  StoryArc,
  StoryContent,
  StoryNode,
  StoryTravelRule,
  VoyageContext,
} from './types';

export function storyConnectionKey(fromNodeId: string, toNodeId: string): string {
  return `${fromNodeId}->${toNodeId}`;
}

const travelRuleEntries: Array<[[string, string], VoyageContext, number, number]> = [
  [['foosha-departure', 'barrel-at-sea'], 'open-sea', 1, 3],
  [['barrel-at-sea', 'alvida-deck'], 'alvida-ship', 0, 2],
  [['barrel-at-sea', 'alvida-hold'], 'alvida-ship', 0, 2],
  [['alvida-hold', 'alvida-hold-battle'], 'immediate', 0, 0],
  [['alvida-deck', 'cobys-resolve'], 'immediate', 0, 0],
  [['alvida-hold-battle', 'cobys-resolve'], 'immediate', 0, 0],
  [['cobys-resolve', 'shells-town-arrival'], 'open-sea', 1, 3],
  [['shells-town-arrival', 'marine-yard'], 'shells-town', 0, 2],
  [['shells-town-arrival', 'execution-grounds'], 'shells-town', 0, 2],
  [['marine-yard', 'free-pirate-hunter'], 'immediate', 0, 0],
  [['execution-grounds', 'free-pirate-hunter'], 'immediate', 0, 0],
  [['free-pirate-hunter', 'morgan-last-stand'], 'immediate', 0, 0],
  [['morgan-last-stand', 'marines-farewell'], 'immediate', 0, 0],
  [['marines-farewell', 'orange-town-harbor'], 'open-sea', 1, 3],
  [['orange-town-harbor', 'chouchous-stand'], 'orange-town', 0, 2],
  [['chouchous-stand', 'beast-tamers-street'], 'immediate', 0, 0],
  [['chouchous-stand', 'harbor-decoy'], 'immediate', 0, 0],
  [['chouchous-stand', 'acrobat-rooftops'], 'immediate', 0, 0],
  [['beast-tamers-street', 'mayors-resolve'], 'orange-town', 0, 2],
  [['harbor-decoy', 'mayors-resolve'], 'orange-town', 0, 2],
  [['acrobat-rooftops', 'mayors-resolve'], 'orange-town', 0, 2],
  [['mayors-resolve', 'buggys-big-top'], 'immediate', 0, 0],
  [['buggys-big-top', 'maps-and-promises'], 'immediate', 0, 0],
  [['maps-and-promises', 'syrup-village-shore'], 'open-sea', 1, 3],
  [['syrup-village-shore', 'usopps-warning'], 'syrup-village', 0, 2],
  [['usopps-warning', 'syrup-north-slope'], 'immediate', 0, 0],
  [['usopps-warning', 'syrup-mansion-grounds'], 'immediate', 0, 0],
  [['syrup-north-slope', 'night-before-the-raid'], 'syrup-village', 0, 2],
  [['syrup-mansion-grounds', 'night-before-the-raid'], 'syrup-village', 0, 2],
  [['night-before-the-raid', 'kuros-black-cat-raid'], 'immediate', 0, 0],
  [['kuros-black-cat-raid', 'the-going-merry'], 'immediate', 0, 0],
  [['the-going-merry', 'baratie-arrival'], 'open-sea', 1, 3],
  [['baratie-arrival', 'gin-at-the-table'], 'baratie', 0, 0],
  [['gin-at-the-table', 'krieg-armada-appears'], 'baratie', 0, 0],
  [['krieg-armada-appears', 'protect-baratie-deck'], 'immediate', 0, 0],
  [['krieg-armada-appears', 'silence-krieg-cannons'], 'immediate', 0, 0],
  [['krieg-armada-appears', 'evacuate-the-cooks'], 'immediate', 0, 0],
  [['protect-baratie-deck', 'mihawks-challenge'], 'baratie', 0, 0],
  [['silence-krieg-cannons', 'mihawks-challenge'], 'baratie', 0, 0],
  [['evacuate-the-cooks', 'mihawks-challenge'], 'baratie', 0, 0],
  [['mihawks-challenge', 'baratie-galley'], 'baratie', 0, 0],
  [['baratie-galley', 'krieg-officers-attack'], 'immediate', 0, 0],
  [['krieg-officers-attack', 'krieg-last-stand'], 'immediate', 0, 0],
  [['krieg-last-stand', 'all-blue-departure'], 'immediate', 0, 0],
  [['all-blue-departure', 'cocoyasi-shore'], 'open-sea', 1, 3],
  [['cocoyasi-shore', 'cocoyasi-under-arlong'], 'arlong-park', 0, 0],
  [['cocoyasi-under-arlong', 'break-the-fishman-patrol'], 'immediate', 0, 0],
  [['cocoyasi-under-arlong', 'expose-nezumis-cover-up'], 'immediate', 0, 0],
  [['cocoyasi-under-arlong', 'bellemere-orange-grove'], 'immediate', 0, 0],
  [['break-the-fishman-patrol', 'namis-map-room'], 'arlong-park', 0, 0],
  [['expose-nezumis-cover-up', 'namis-map-room'], 'arlong-park', 0, 0],
  [['bellemere-orange-grove', 'namis-map-room'], 'arlong-park', 0, 0],
  [['namis-map-room', 'nami-asks-for-help'], 'immediate', 0, 0],
  [['nami-asks-for-help', 'bellemere-grave'], 'arlong-park', 0, 0],
  [['bellemere-grave', 'walk-to-arlong-park'], 'arlong-park', 0, 0],
  [['walk-to-arlong-park', 'break-arlongs-front-gate'], 'immediate', 0, 0],
  [['walk-to-arlong-park', 'free-gosa-village'], 'immediate', 0, 0],
  [['walk-to-arlong-park', 'cross-the-sea-wall'], 'immediate', 0, 0],
  [['break-arlongs-front-gate', 'arlong-park-courtyard'], 'arlong-park', 0, 0],
  [['free-gosa-village', 'arlong-park-courtyard'], 'arlong-park', 0, 0],
  [['cross-the-sea-wall', 'arlong-park-courtyard'], 'arlong-park', 0, 0],
  [['arlong-park-courtyard', 'arlong-park-raid'], 'immediate', 0, 0],
  [['arlong-park-raid', 'cocoyasi-dawn'], 'immediate', 0, 0],
  [['cocoyasi-dawn', 'loguetown-harbor'], 'open-sea', 1, 3],
  [['loguetown-harbor', 'town-of-beginnings-and-ends'], 'loguetown', 0, 0],
  [['town-of-beginnings-and-ends', 'ipponmatsu-sword-shop'], 'immediate', 0, 0],
  [['town-of-beginnings-and-ends', 'execution-plaza-ambush'], 'immediate', 0, 0],
  [['town-of-beginnings-and-ends', 'smokers-marine-cordon'], 'immediate', 0, 0],
  [['ipponmatsu-sword-shop', 'gold-rogers-platform'], 'loguetown', 0, 0],
  [['execution-plaza-ambush', 'gold-rogers-platform'], 'loguetown', 0, 0],
  [['smokers-marine-cordon', 'gold-rogers-platform'], 'loguetown', 0, 0],
  [['gold-rogers-platform', 'storm-over-loguetown'], 'loguetown', 0, 0],
  [['storm-over-loguetown', 'smoker-pursuit'], 'immediate', 0, 0],
  [['smoker-pursuit', 'reverse-mountain-bound'], 'immediate', 0, 0],
];

const travelRules: Record<string, StoryTravelRule> = Object.fromEntries(
  travelRuleEntries.map(([connection, context, minEvents, maxEvents]) => [
    storyConnectionKey(connection[0], connection[1]),
    { context, minEvents, maxEvents },
  ]),
);

// Keep the legacy whole-East-Blue prototype behind the shared boundary as reference content.
export const activeStoryContent: StoryContent = {
  startArcId: 'romance-dawn',
  arcs: [
    romanceDawnArc,
    orangeTownArc,
    syrupVillageArc,
    baratieArc,
    arlongParkArc,
    loguetownArc,
    eastBluePrototypeArc,
  ],
  nodes: [
    ...romanceDawnNodes,
    ...orangeTownNodes,
    ...syrupVillageNodes,
    ...baratieNodes,
    ...arlongParkNodes,
    ...loguetownNodes,
    ...eastBluePrototypeNodes,
  ],
  connections: [
    ...romanceDawnConnections,
    ...orangeTownConnections,
    ...syrupVillageConnections,
    ...baratieConnections,
    ...arlongParkConnections,
    ...loguetownConnections,
    ...eastBluePrototypeConnections,
  ],
  travelRules,
  choices: {
    ...romanceDawnChoices,
    ...orangeTownChoices,
    ...syrupVillageChoices,
    ...baratieChoices,
    ...arlongParkChoices,
    ...loguetownChoices,
    ...eastBluePrototypeChoices,
  },
};

export const storyNodes = activeStoryContent.nodes;
export const storyConnections = activeStoryContent.connections;
export const storyNodeChoices = activeStoryContent.choices;

export function getStoryTravelRule(
  fromNodeId: string | null,
  toNodeId: string,
  content: StoryContent = activeStoryContent,
): StoryTravelRule {
  if (!fromNodeId || fromNodeId === toNodeId) {
    return { context: 'immediate', minEvents: 0, maxEvents: 0 };
  }
  return content.travelRules?.[storyConnectionKey(fromNodeId, toNodeId)] ?? {
    context: 'open-sea',
    minEvents: 1,
    maxEvents: 3,
  };
}

export function getStoryNode(
  nodeId: string | null,
  content: StoryContent = activeStoryContent,
): StoryNode | undefined {
  return content.nodes.find((node) => node.id === nodeId);
}

export function getStoryArc(
  arcId: StoryArc['id'],
  content: StoryContent = activeStoryContent,
): StoryArc | undefined {
  return content.arcs.find((arc) => arc.id === arcId);
}

export function getStoryArcForNode(
  nodeId: string | null,
  content: StoryContent = activeStoryContent,
): StoryArc | undefined {
  const node = getStoryNode(nodeId, content);
  return node ? getStoryArc(node.arcId, content) : getStoryArc(content.startArcId, content);
}

export function nodeOffersService(nodeId: string | null, service: NodeService): boolean {
  return getStoryNode(nodeId)?.services?.includes(service) ?? false;
}

export function getStoryNodesForArc(
  arcId: StoryArc['id'],
  content: StoryContent = activeStoryContent,
): StoryNode[] {
  const arc = getStoryArc(arcId, content);
  if (!arc) return [];
  const nodeIds = new Set(arc.nodeIds);
  return content.nodes.filter((node) => node.arcId === arcId && nodeIds.has(node.id));
}

export function getStoryConnectionsForArc(
  arcId: StoryArc['id'],
  content: StoryContent = activeStoryContent,
): Array<[string, string]> {
  const nodeIds = new Set(getStoryNodesForArc(arcId, content).map((node) => node.id));
  return content.connections.filter(([fromId, toId]) => nodeIds.has(fromId) && nodeIds.has(toId));
}

export function isNodeCompleted(run: RunSnapshot, nodeId: string): boolean {
  return run.completedNodeIds.includes(nodeId);
}

export function isNodeVisited(run: RunSnapshot, nodeId: string): boolean {
  return run.visitedNodeIds.includes(nodeId);
}

export function getVisitedStoryNodesForArc(
  run: RunSnapshot,
  content: StoryContent = activeStoryContent,
): StoryNode[] {
  return getStoryNodesForArc(run.activeArcId, content)
    .filter((node) => isNodeVisited(run, node.id));
}

export function isNodeLockedByBranch(run: RunSnapshot, node: StoryNode): boolean {
  if (!node.branch) return false;
  const chosenNode = run.chosenBranches[node.branch];
  return chosenNode !== undefined && chosenNode !== node.id;
}

export function isNodeAvailable(run: RunSnapshot, node: StoryNode): boolean {
  if (run.phase !== 'map' || isNodeCompleted(run, node.id) || isNodeLockedByBranch(run, node)) {
    return false;
  }

  const completed = (id: string) => isNodeCompleted(run, id);
  return node.prerequisiteMode === 'any'
    ? node.prerequisites.some(completed)
    : node.prerequisites.every(completed);
}

export function getAvailableNodes(
  run: RunSnapshot,
  content: StoryContent = activeStoryContent,
): StoryNode[] {
  return getStoryNodesForArc(run.activeArcId, content).filter((node) => isNodeAvailable(run, node));
}
