import fs from "fs";
import path from "path";
import en from "./locales/en.js";
import zh from "./locales/zh.js";
import ja from "./locales/ja.js";
import ko from "./locales/ko.js";
import es from "./locales/es.js";
import ar from "./locales/ar.js";

// Supported languages
const SUPPORTED_LANGUAGES = {
  en: { name: "English", locale: en },
  zh: { name: "中文", locale: zh },
  ja: { name: "日本語", locale: ja },
  ko: { name: "한국어", locale: ko },
  es: { name: "Español", locale: es },
  ar: { name: "العربية", locale: ar },
};

// Default language
const DEFAULT_LANGUAGE = "en";

class I18nManager {
  constructor() {
    this.CONFIG_FILE = path.join(
      process.env.HOME || process.env.USERPROFILE,
      ".ai-commit-config.json"
    );
    // Load full config
    this.config = this.loadConfig();
    this.currentLanguage = this.config.language || DEFAULT_LANGUAGE;

    // Check if language is supported, fallback if not
    if (!SUPPORTED_LANGUAGES[this.currentLanguage]) {
      this.currentLanguage = DEFAULT_LANGUAGE;
    }

    // Set current locale
    this.locale = SUPPORTED_LANGUAGES[this.currentLanguage].locale;
  }

  // Load full config
  loadConfig() {
    try {
      if (fs.existsSync(this.CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(this.CONFIG_FILE, "utf8"));
      }
    } catch (error) {
      // Silent fallback or use English warning if critical, but simple load failure usually means no config yet.
      // console.warn("Failed to load config file, using empty config");
    }
    return {};
  }

  // Save config
  saveConfig(newConfig) {
    try {
      // Merge existing and new config
      const configToSave = { ...this.config, ...newConfig };
      fs.writeFileSync(this.CONFIG_FILE, JSON.stringify(configToSave, null, 2));
      // Update in-memory config
      this.config = configToSave;
      return true;
    } catch (error) {
      console.error(this.t("errors.saveConfigFailed"), error.message);
      return false;
    }
  }

  // Get config item
  getConfig(key) {
    return this.config[key];
  }

  // Set config item
  setConfig(key, value) {
    return this.saveConfig({ [key]: value });
  }

  // Switch language (compatible with old API)
  setLanguage(language) {
    if (!SUPPORTED_LANGUAGES[language]) {
      throw new Error(`Unsupported language: ${language}`);
    }

    this.currentLanguage = language;
    this.locale =
      SUPPORTED_LANGUAGES[language]?.locale ||
      SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE].locale;

    return this.setConfig("language", language);
  }

  // Load language config (compatible with old API)
  loadLanguage() {
    return this.currentLanguage;
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get list of supported languages
  getSupportedLanguages() {
    return Object.keys(SUPPORTED_LANGUAGES);
  }

  // Get language name
  getLanguageName(code) {
    return SUPPORTED_LANGUAGES[code]?.name || code;
  }

  // Translate text (supports parameter substitution)
  t(key, params = {}) {
    const keys = key.split(".");
    let value = this.locale;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = this.getFallbackValue(key, params);
        break;
      }
    }

    if (typeof value === "string") {
      // Substitute parameters
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value || key;
  }

  // Get English fallback value
  getFallbackValue(key, params) {
    const keys = key.split(".");
    let value = SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE]?.locale;

    if (!value) {
      return key;
    }

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value === "string") {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }

    return value || key;
  }
}

// Create global instance
const i18n = new I18nManager();

export default i18n;
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
