import { describe, expect, it } from 'vitest';
import { getArtifactDefinition, migrateArtifactIds } from './artifacts';

describe('artifacts', () => {
  it('authors four active, typed voyage artifacts', () => {
    expect(getArtifactDefinition('weathered-log-pose')).toEqual(expect.objectContaining({
      name: 'Weathered Log Pose',
      active: true,
      improvesRole: 'navigator',
      icon: 'log-pose',
    }));
    expect(getArtifactDefinition('field-medical-kit').improvesRole).toBe('doctor');
    expect(getArtifactDefinition('reinforced-tiller').improvesRole).toBe('helmsman');
    expect(getArtifactDefinition('merchants-ledger')).toEqual(expect.objectContaining({
      active: true,
      duplicateBerries: 50,
      icon: 'ledger',
    }));
  });

  it('migrates legacy names and drops invalid artifact values', () => {
    expect(migrateArtifactIds([
      'Weathered Log Pose',
      'weathered-log-pose',
      'Field Medical Kit',
      'Unknown Artifact',
      null,
    ])).toEqual(['weathered-log-pose', 'field-medical-kit']);
    expect(migrateArtifactIds(null)).toEqual([]);
  });
});
