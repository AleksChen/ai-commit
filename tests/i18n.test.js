import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../src/i18n.js';

describe('i18n', () => {
  // Reset state if needed, though i18n is a singleton
  
  it('should return key if translation missing', () => {
    expect(i18n.t('non.existent.key')).toBe('non.existent.key');
  });

  it('should interpolate parameters', () => {
      // We need a known key. Let's check 'config.languageChanged' or similar if we can load one,
      // or mock the locale data. 
      // Since we can't easily inject test data into the singleton without modifying code,
      // we'll test the fallback mechanism or a known key.
      
      // Let's assume 'git.staged' exists and is simple.
      // Actually, let's just test the parameter replacement logic using a fake key if possible,
      // or rely on existing keys.
      
      // Accessing internal state for testing interpolation
      i18n.locale = {
          test: {
              hello: "Hello {name}"
          }
      };
      
      expect(i18n.t('test.hello', { name: 'World' })).toBe('Hello World');
  });

  it('should support nested keys', () => {
      i18n.locale = {
          level1: {
              level2: "Value"
          }
      };
      expect(i18n.t('level1.level2')).toBe('Value');
  });
});

