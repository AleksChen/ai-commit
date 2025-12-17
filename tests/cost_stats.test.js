import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import boxen from 'boxen';
import { recordUsage, showStats } from '../src/cost_stats.js';
import i18n from '../src/i18n.js';

// Mock fs and console
vi.mock('fs');
vi.mock('chalk', () => {
  return {
    default: {
      yellow: vi.fn((str) => str),
      cyan: { bold: vi.fn((str) => str) },
      blue: vi.fn((str) => str),
      green: { bold: vi.fn((str) => str) },
      gray: vi.fn((str) => str),
    }
  };
});
vi.mock('boxen', () => ({ default: vi.fn((str) => str) }));
vi.mock('../src/i18n.js', () => ({
  default: {
    t: vi.fn((key) => key),
  }
}));

describe('cost_stats', () => {
  const USAGE_FILE = path.join(os.homedir(), '.ai-commit-usage.json');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordUsage', () => {
    it('should append usage data to file', () => {
      const data = {
        model: 'gpt-3.5-turbo',
        duration: 1.5,
        tokens: { prompt: 10, completion: 20, total: 30 }
      };

      recordUsage(data);

      expect(fs.appendFileSync).toHaveBeenCalledWith(
        USAGE_FILE,
        expect.stringContaining('"model":"gpt-3.5-turbo"'),
        'utf8'
      );
    });

    it('should handle errors gracefully', () => {
      fs.appendFileSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      expect(() => recordUsage({})).not.toThrow();
    });
  });

  describe('showStats', () => {
    it('should show "no data" message if file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      showStats();

      expect(fs.existsSync).toHaveBeenCalledWith(USAGE_FILE);
      expect(console.log).toHaveBeenCalledWith('cost.noData');
    });

    it('should read and display stats if file exists', () => {
      fs.existsSync.mockReturnValue(true);
      const mockContent = [
        JSON.stringify({ model: 'gpt-3.5', duration: 1, tokens: { prompt: 10, completion: 10, total: 20 } }),
        JSON.stringify({ model: 'gpt-4', duration: 2, tokens: { prompt: 20, completion: 20, total: 40 } }),
        '' // empty line
      ].join('\n');
      
      fs.readFileSync.mockReturnValue(mockContent);

      showStats();

      expect(fs.readFileSync).toHaveBeenCalledWith(USAGE_FILE, 'utf8');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('cost.title'));
      // Verify total calls
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('2')); 
      // Verify models are shown
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('gpt-3.5'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('gpt-4'));
    });

    it('should handle corrupted lines gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      const mockContent = [
        'invalid json',
        JSON.stringify({ model: 'gpt-3.5', duration: 1, tokens: { prompt: 10, completion: 10, total: 20 } })
      ].join('\n');
      
      fs.readFileSync.mockReturnValue(mockContent);

      showStats();

      // Should still process valid lines
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('cost.title'));
    });
  });
});

