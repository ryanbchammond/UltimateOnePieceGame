import { describe, expect, it } from 'vitest';
import { getArtifactDefinition, migrateArtifactIds } from './artifacts';

describe('artifacts', () => {
  it('authors an explicitly inactive Weathered Log Pose', () => {
    expect(getArtifactDefinition('weathered-log-pose')).toEqual(expect.objectContaining({
      name: 'Weathered Log Pose',
      active: false,
      effect: 'No active effect in this development build.',
      icon: 'log-pose',
    }));
  });

  it('migrates legacy names and drops invalid artifact values', () => {
    expect(migrateArtifactIds([
      'Weathered Log Pose',
      'weathered-log-pose',
      'Unknown Artifact',
      null,
    ])).toEqual(['weathered-log-pose']);
    expect(migrateArtifactIds(null)).toEqual([]);
  });
});
