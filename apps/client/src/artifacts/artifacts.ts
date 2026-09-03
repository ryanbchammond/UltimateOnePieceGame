import type { ArtifactId, ShipRole } from '../run/types';

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  effect: string;
  active: boolean;
  icon: 'log-pose' | 'medical-kit' | 'tiller' | 'ledger';
  improvesRole?: ShipRole;
  duplicateBerries: number;
}

export const artifactDefinitions: Record<ArtifactId, ArtifactDefinition> = {
  'weathered-log-pose': {
    id: 'weathered-log-pose',
    name: 'Weathered Log Pose',
    effect: 'Improves an assigned Navigator by one tier during voyage events.',
    active: true,
    icon: 'log-pose',
    improvesRole: 'navigator',
    duplicateBerries: 50,
  },
  'field-medical-kit': {
    id: 'field-medical-kit',
    name: 'Field Medical Kit',
    effect: 'Improves an assigned Doctor by one tier during voyage events.',
    active: true,
    icon: 'medical-kit',
    improvesRole: 'doctor',
    duplicateBerries: 50,
  },
  'reinforced-tiller': {
    id: 'reinforced-tiller',
    name: 'Reinforced Tiller',
    effect: 'Improves an assigned Helmsman by one tier during voyage events.',
    active: true,
    icon: 'tiller',
    improvesRole: 'helmsman',
    duplicateBerries: 50,
  },
  'merchants-ledger': {
    id: 'merchants-ledger',
    name: "Merchant's Ledger",
    effect: 'Adds 25 Berries whenever a voyage treasure awards Berries.',
    active: true,
    icon: 'ledger',
    duplicateBerries: 50,
  },
};

const legacyArtifactIds: Record<string, ArtifactId> = {
  'Weathered Log Pose': 'weathered-log-pose',
  'weathered-log-pose': 'weathered-log-pose',
  'Field Medical Kit': 'field-medical-kit',
  'field-medical-kit': 'field-medical-kit',
  'Reinforced Tiller': 'reinforced-tiller',
  'reinforced-tiller': 'reinforced-tiller',
  "Merchant's Ledger": 'merchants-ledger',
  'merchants-ledger': 'merchants-ledger',
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
