import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import i18n from './i18n.js';

export async function handleConfigCommand() {
  // Ensure i18n is properly initialized
  if (!i18n || !i18n.t) {
    console.error(i18n.t('errors.initFailed') || 'i18n not initialized properly');
    process.exit(1);
  }
  
  console.log(
    "\n" + chalk.cyan.bold(boxen(i18n.t('config.title'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    }))
  );

  console.log(chalk.blue(i18n.t('config.currentLanguage', { 
    lang: i18n.t(`config.languageChoices.${i18n.getCurrentLanguage()}`) 
  })));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: i18n.t('config.menuPrompt'),
      choices: [
        { name: i18n.t('config.menuChoices.setKeys'), value: 'setKeys' },
        { name: i18n.t('config.menuChoices.setPrompt'), value: 'setPrompt' },
        { name: i18n.t('config.menuChoices.setAsciiArt'), value: 'setAsciiArt' },
        { name: i18n.t('config.menuChoices.changeLanguage'), value: 'language' },
        { name: i18n.t('config.menuChoices.show'), value: 'show' },
        { name: i18n.t('config.menuChoices.exit'), value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'setKeys':
      await setApiKeys();
      break;
    case 'setPrompt':
      await setPromptTemplate();
      break;
    case 'setAsciiArt':
      await setAsciiArt();
      break;
    case 'language':
      await changeLanguage();
      break;
    case 'show':
      showCurrentConfig();
      break;
    case 'exit':
      console.log(chalk.gray(i18n.t('config.goodbye')));
      process.exit(0);
      break;
  }
}

export async function setApiKeys() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'apiKey',
      message: i18n.t('config.keys.enterApiKey'),
      default: i18n.getConfig('apiKey'),
      validate: input => input.length > 0 || i18n.t('config.validation.apiKeyRequired')
    },
    {
      type: 'input',
      name: 'baseUrl',
      message: i18n.t('config.keys.enterBaseUrl'),
      default: i18n.getConfig('baseUrl') || 'https://api.openai.com/v1',
    },
    {
      type: 'input',
      name: 'model',
      message: i18n.t('config.keys.enterModel'),
      default: i18n.getConfig('model') || 'gpt-3.5-turbo',
    }
  ]);

  // Clean up input, remove potential extra spaces
  const configToSave = {
    apiKey: answers.apiKey.trim(),
    baseUrl: answers.baseUrl.trim() || undefined, // Storing undefined will delete the key or fallback to defaults at runtime
    model: answers.model.trim() || undefined
  };

  if (i18n.saveConfig(configToSave)) {
    console.log(chalk.green(i18n.t('config.keys.saved')));
  } else {
    console.log(chalk.red(i18n.t('config.configFailed')));
  }
}

async function setPromptTemplate() {
    const { templateType } = await inquirer.prompt([
        {
            type: 'list',
            name: 'templateType',
            message: i18n.t('config.prompt.selectTemplate'),
            choices: [
                { name: i18n.t('config.prompt.choices.default'), value: 'default' },
                { name: i18n.t('config.prompt.choices.emoji'), value: 'emoji' },
                { name: i18n.t('config.prompt.choices.simple'), value: 'simple' },
                { name: i18n.t('config.prompt.choices.custom'), value: 'custom' },
            ]
        }
    ]);

    if (templateType === 'custom') {
        const { customTemplate } = await inquirer.prompt([
            {
                type: 'editor',
                name: 'customTemplate',
                message: i18n.t('config.prompt.enterCustom'),
                default: i18n.getConfig('customPrompt') || '',
                waitUserInput: true,
            }
        ]);
        
        i18n.setConfig('promptType', 'custom');
        i18n.setConfig('customPrompt', customTemplate.trim());
        console.log(chalk.green(i18n.t('config.prompt.saved')));
    } else {
        i18n.setConfig('promptType', templateType);
        console.log(chalk.green(i18n.t('config.prompt.saved')));
    }
}

async function setAsciiArt() {
  const { asciiArt } = await inquirer.prompt([
    {
      type: 'list',
      name: 'asciiArt',
      message: i18n.t('config.ascii.select'),
      choices: [
        { name: i18n.t('config.ascii.choices.psyduck'), value: 'psyduck' },
        { name: i18n.t('config.ascii.choices.totoro'), value: 'totoro' },
        { name: i18n.t('config.ascii.choices.cat'), value: 'cat' },
        { name: i18n.t('config.ascii.choices.none'), value: 'none' },
      ],
      default: i18n.getConfig('asciiArt') || 'psyduck',
    }
  ]);

  if (i18n.setConfig('asciiArt', asciiArt)) {
    console.log(chalk.green(i18n.t('config.ascii.saved')));
  } else {
    console.log(chalk.red(i18n.t('config.configFailed')));
  }
}

async function changeLanguage() {
  const { newLanguage } = await inquirer.prompt([
    {
      type: 'list',
      name: 'newLanguage',
      message: i18n.t('config.languageDesc'),
      choices: i18n.getSupportedLanguages().map(lang => ({
        name: i18n.getLanguageName(lang),
        value: lang
      }))
    }
  ]);

  try {
    if (i18n.setLanguage(newLanguage)) {
      console.log(chalk.green(i18n.t('config.languageChanged', { 
        lang: i18n.t(`config.languageChoices.${newLanguage}`) 
      })));

      // Show new language info (no need to reload module)
      console.log(chalk.blue(i18n.t('config.currentLanguage', { 
        lang: i18n.t(`config.languageChoices.${i18n.getCurrentLanguage()}`) 
      })));
    } else {
      console.log(chalk.red(i18n.t('config.configFailed')));
    }
  } catch (error) {
    console.log(chalk.red(i18n.t('config.invalidLanguage')));
  }
}

function showCurrentConfig() {
  console.log(chalk.cyan('\n' + i18n.t('config.view.title')));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.blue(i18n.t('config.view.languageLabel')), i18n.t(`config.languageChoices.${i18n.getCurrentLanguage()}`));
  
  const apiKey = i18n.getConfig('apiKey');
  const baseUrl = i18n.getConfig('baseUrl') || `https://api.openai.com/v1 ${i18n.t('common.default')}`;
  const model = i18n.getConfig('model') || `gpt-3.5-turbo ${i18n.t('common.default')}`;
  const promptType = i18n.getConfig('promptType') || 'default';
  const asciiArt = i18n.getConfig('asciiArt') || `none ${i18n.t('common.default')}`;

  const maskedKey = apiKey ? apiKey.slice(0, 4) + '****' + apiKey.slice(-4) : i18n.t('common.notSet');

  console.log(chalk.blue(i18n.t('config.view.apiKeyLabel')), maskedKey);
  console.log(chalk.blue(i18n.t('config.view.baseUrlLabel')), baseUrl);
  console.log(chalk.blue(i18n.t('config.view.modelLabel')), model);
  console.log(chalk.blue(i18n.t('common.promptStyle')), promptType);
  console.log(chalk.blue(i18n.t('config.view.asciiArtLabel')), asciiArt);

  console.log(chalk.blue(i18n.t('config.view.configFileLabel')), i18n.CONFIG_FILE || '~/.ai-commit-config.json');
  console.log(chalk.gray('─'.repeat(40)));
}

export function showLanguageHelp() {
  console.log(chalk.cyan('\n' + i18n.t('config.help.title')));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(chalk.blue(i18n.t('config.help.current')), i18n.t(`config.languageChoices.${i18n.getCurrentLanguage()}`));
  console.log(chalk.blue(i18n.t('config.help.supported')), i18n.getSupportedLanguages().map(lang => 
    `${lang} (${i18n.getLanguageName(lang)})`
  ).join(', '));
  console.log(chalk.blue(i18n.t('config.help.command')), 'ai-commit config');
  console.log(chalk.gray('─'.repeat(40)));
}
