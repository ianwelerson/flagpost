import { describe, expect, it, vi } from 'vitest';
import { resolveFlagValue } from './overrides.js';

describe('resolveFlagValue', () => {
  it('returns remote value when no overrides', () => {
    expect(resolveFlagValue('a', true, undefined, undefined)).toBe(true);
    expect(resolveFlagValue('a', false, undefined, undefined)).toBe(false);
  });

  it('defaults to false when remote is undefined', () => {
    expect(resolveFlagValue('a', undefined, undefined, undefined)).toBe(false);
  });

  it('static map overrides remote', () => {
    expect(resolveFlagValue('a', false, { a: true }, undefined)).toBe(true);
    expect(resolveFlagValue('a', true, { a: false }, undefined)).toBe(false);
  });

  it('static map only applies to listed flags', () => {
    expect(resolveFlagValue('b', true, { a: false }, undefined)).toBe(true);
  });

  it('function override takes precedence over static map', () => {
    const fn = () => false;
    expect(resolveFlagValue('a', true, { a: true }, fn)).toBe(false);
  });

  it('function returning undefined falls through to static map', () => {
    const fn = () => undefined;
    expect(resolveFlagValue('a', false, { a: true }, fn)).toBe(true);
  });

  it('function returning undefined falls through to remote', () => {
    const fn = () => undefined;
    expect(resolveFlagValue('a', true, undefined, fn)).toBe(true);
  });

  it('passes flag name and remote value to override fn', () => {
    const fn = vi.fn().mockReturnValue(undefined);
    resolveFlagValue('feature-x', true, undefined, fn);
    expect(fn).toHaveBeenCalledWith('feature-x', true);
  });
});
