import { describe, expect, it } from 'vitest';
import { buildLocalTitleVariants, extractQuality, normalizeTitle, parseInputList, parseMediaName, similarity } from './media';

describe('media parsing', () => {
  it('parses lists separated by new lines and semicolons', () => {
    expect(parseInputList('Avatar; Breaking Bad S01\nDune')).toEqual([
      'Avatar',
      'Breaking Bad S01',
      'Dune'
    ]);
  });

  it('detects movies, years and qualities from release names', () => {
    const parsed = parseMediaName('Avatar.2009.1080p.BluRay.mkv');

    expect(parsed.title).toBe('Avatar');
    expect(parsed.year).toBe(2009);
    expect(parsed.mediaType).toBe('movie');
    expect(extractQuality('Avatar.2009.1080p.BluRay.mkv')).toEqual(['1080p', 'BluRay']);
  });

  it('detects series seasons and episodes', () => {
    const parsed = parseMediaName('Breaking.Bad.S03E05.720p.WEB-DL.mkv');

    expect(parsed.title).toBe('Breaking Bad');
    expect(parsed.mediaType).toBe('series');
    expect(parsed.season).toBe(3);
    expect(parsed.episode).toBe(5);
  });

  it('fuzzy matches common title variants', () => {
    expect(similarity('avatar', 'avatar 2009 bluray')).toBeGreaterThan(0.7);
  });

  it('normalizes common movie aliases for tolerant matching', () => {
    expect(normalizeTitle('Captain Amerika The Winter Soldier')).toBe('captain america winter soldier');
    expect(normalizeTitle('Frozen II')).toBe('frozen 2');
    expect(buildLocalTitleVariants('Frozen II')).toContain('die eiskonigin 2');
    expect(buildLocalTitleVariants('Thor 1')).toContain('thor');
  });
});
