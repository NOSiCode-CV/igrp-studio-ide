import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

let currentLanguage = 'en';

// Load the language configuration from the config file
export function loadConfig() {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    currentLanguage = config.language || 'en';
  } catch (error) {
    console.error('Failed to load config:', error);
  }
}

// Save the current language to the config file
export function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ language: currentLanguage }));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// Get the current language
export function getCurrentLanguage() {
  return currentLanguage;
}

// Set the current language and save it to the config file
export function setCurrentLanguage(lang: string) {
  currentLanguage = lang;
  saveConfig();
}