import type { ArtifactId } from '../run/types';

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  effect: string;
  active: boolean;
  icon: 'log-pose';
}

export const artifactDefinitions: Record<ArtifactId, ArtifactDefinition> = {
  'weathered-log-pose': {
    id: 'weathered-log-pose',
    name: 'Weathered Log Pose',
    effect: 'No active effect in this development build.',
    active: false,
    icon: 'log-pose',
  },
};

const legacyArtifactIds: Record<string, ArtifactId> = {
  'Weathered Log Pose': 'weathered-log-pose',
  'weathered-log-pose': 'weathered-log-pose',
};

export function getArtifactDefinition(id: ArtifactId): ArtifactDefinition {
  return artifactDefinitions[id];
}

export function migrateArtifactIds(value: unknown): ArtifactId[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((entry) => {
    if (typeof entry !== 'string') return [];
    const artifactId = legacyArtifactIds[entry];
    return artifactId ? [artifactId] : [];
  }))];
}
