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
import type { NodeService, RunSnapshot, StoryArc, StoryContent, StoryNode } from './types';

// The approved alpha remains active while Romance Dawn and Orange Town are authored. Keeping the
// legacy content behind this boundary lets the UI and stores stop depending on a specific saga.
export const activeStoryContent: StoryContent = {
  startArcId: 'romance-dawn',
  arcs: [romanceDawnArc, eastBluePrototypeArc],
  nodes: [...romanceDawnNodes, ...eastBluePrototypeNodes],
  connections: [...romanceDawnConnections, ...eastBluePrototypeConnections],
  choices: { ...romanceDawnChoices, ...eastBluePrototypeChoices },
};

export const storyNodes = activeStoryContent.nodes;
export const storyConnections = activeStoryContent.connections;
export const storyNodeChoices = activeStoryContent.choices;

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
