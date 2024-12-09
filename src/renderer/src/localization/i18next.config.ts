import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Access the backend from the preload script
import backend from "i18next-electron-fs-backend";
import { LNG } from '@renderer/constants/appConstants';

const isMac = window.api.i18nextElectronBackend.clientOptions.platform === "darwin";
const isDev = window.api.i18nextElectronBackend.clientOptions.environment === "development";
const prependPath = isMac && !isDev ? window.api.i18nextElectronBackend.clientOptions.resourcesPath : ".";

import enCommon from '/src/localization/locales/en/translation.json';

if (!backend) {
  console.error('i18nextElectronBackend is not defined');
} else {
  i18n
    .use(backend)
    .use(initReactI18next)
    .init({
      fallbackLng: LNG.DEFAULT_LANGUAGE,
      debug: true,
      resources: {
        en: {
          translation: enCommon,
        }
      },
      interpolation: {
        escapeValue: false,
      },
      saveMissing: true,
      saveMissingTo: "current",
      lng: "en",
      supportedLngs: LNG.SUPPORTED_LANGUAGES
    });
}

export default i18n;
