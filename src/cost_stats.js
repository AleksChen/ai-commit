import fs from 'fs';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import boxen from 'boxen';
import i18n from './i18n.js';

const USAGE_FILE = path.join(os.homedir(), '.ai-commit-usage.json');

/**
 * Record usage statistics
 * @param {Object} data
 * @param {string} data.model Model name
 * @param {number} data.duration Duration (seconds)
 * @param {Object} data.tokens Token usage {prompt, completion, total}
 */
export function recordUsage(data) {
  const entry = {
    timestamp: Date.now(),
    isoDate: new Date().toISOString(),
    ...data
  };
  
  const line = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(USAGE_FILE, line, 'utf8');
  } catch (error) {
    // Recording failure should not affect main flow
  }
}

export function showStats() {
  if (!fs.existsSync(USAGE_FILE)) {
    console.log(chalk.yellow(i18n.t('cost.noData')));
    return;
  }

  const content = fs.readFileSync(USAGE_FILE, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const stats = {};
  let totalTokens = 0;
  let totalCalls = 0;
  let totalDuration = 0;

  lines.forEach(line => {
    try {
      const data = JSON.parse(line);
      const model = data.model || 'unknown';
      if (!stats[model]) {
        stats[model] = { calls: 0, prompt: 0, completion: 0, total: 0, duration: 0 };
      }
      stats[model].calls++;
      stats[model].prompt += (data.tokens?.prompt || 0);
      stats[model].completion += (data.tokens?.completion || 0);
      stats[model].total += (data.tokens?.total || 0);
      stats[model].duration += (data.duration || 0);

      totalCalls++;
      totalTokens += (data.tokens?.total || 0);
      totalDuration += (data.duration || 0);
    } catch (e) {}
  });

  console.log('\n' + chalk.cyan.bold(boxen(i18n.t('cost.title'), { padding: 1, margin: 1, borderStyle: 'round', borderColor: 'cyan' })));
  
  console.log(chalk.blue(`${i18n.t('cost.totalCalls')}    ${totalCalls}`));
  console.log(chalk.blue(`${i18n.t('cost.totalTokens')}   ${totalTokens}`));
  console.log(chalk.blue(`${i18n.t('cost.totalDuration')} ${totalDuration.toFixed(1)}s`));
  console.log(chalk.gray('─'.repeat(50)));

  for (const [model, data] of Object.entries(stats)) {
    console.log(chalk.green.bold(`${i18n.t('cost.model')} ${model}`));
    console.log(`  ${i18n.t('cost.calls')}      ${data.calls}`);
    console.log(`  Tokens:     ${data.total} (P: ${data.prompt} / C: ${data.completion})`);
    console.log(`  ${i18n.t('cost.avgTime')}   ${(data.duration / data.calls).toFixed(2)}s`);
    console.log(chalk.gray('─'.repeat(50)));
  }
}
