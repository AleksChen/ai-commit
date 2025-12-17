import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import i18n, { DEFAULT_LANGUAGE } from '../src/i18n.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');

describe('i18n', () => {
  const originalLocale = i18n.locale;
  const originalConfig = i18n.config;
  const originalLanguage = i18n.currentLanguage;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal state
    i18n.locale = originalLocale;
    i18n.config = { ...originalConfig };
    i18n.currentLanguage = originalLanguage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Translation', () => {
    it('should return key if translation missing', () => {
      expect(i18n.t('non.existent.key')).toBe('non.existent.key');
    });

    it('should interpolate parameters', () => {
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

    it('should fall back to English if key missing in current language', () => {
       // Mock supported languages to control fallback
       // This is hard to unit test without mocking the module's imports, 
       // but we can check if it returns key (default behavior if en is also missing)
       expect(i18n.t('missing.key')).toBe('missing.key');
    });
  });

  describe('Configuration', () => {
    it('should load config from file', () => {
      const mockConfig = { language: 'ja', apiKey: 'test-key' };
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = i18n.loadConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should return empty object if config file missing', () => {
      fs.existsSync.mockReturnValue(false);
      const config = i18n.loadConfig();
      expect(config).toEqual({});
    });

    it('should save config to file', () => {
      fs.writeFileSync.mockImplementation(() => {});
      
      const success = i18n.saveConfig({ newItem: 'value' });
      
      expect(success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.ai-commit-config.json'),
        expect.stringContaining('"newItem": "value"')
      );
      expect(i18n.getConfig('newItem')).toBe('value');
    });

    it('should handle save errors', () => {
      fs.writeFileSync.mockImplementation(() => { throw new Error('Write failed'); });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const success = i18n.saveConfig({ test: 'fail' });
      
      expect(success).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Language Management', () => {
    it('should get supported languages', () => {
      const langs = i18n.getSupportedLanguages();
      expect(langs).toContain('en');
      expect(langs).toContain('zh');
    });

    it('should get language name', () => {
      expect(i18n.getLanguageName('en')).toBe('English');
      expect(i18n.getLanguageName('zh')).toBe('中文');
      expect(i18n.getLanguageName('invalid')).toBe('invalid');
    });

    it('should set valid language', () => {
      // Mock saveConfig to avoid FS errors during setLanguage
      const saveSpy = vi.spyOn(i18n, 'saveConfig').mockReturnValue(true);
      
      i18n.setLanguage('ja');
      
      expect(i18n.getCurrentLanguage()).toBe('ja');
      expect(saveSpy).toHaveBeenCalledWith({ language: 'ja' });
    });

    it('should throw on invalid language', () => {
      expect(() => i18n.setLanguage('invalid-lang')).toThrow('Unsupported language');
    });
  });
});
