import i18n, { Module } from 'i18next';
import { initReactI18next } from 'react-i18next';
import i18nextElectronFsBackend from 'i18next-electron-fs-backend';
import { LNG } from '@renderer/constants/appConstants';

// @ts-ignore
import enCommon from '/src/localization/locales/en/translation.json';
// @ts-ignore
import ptCommon from '/src/localization/locales/pt/translation.json';

// Fetch the initial language from the main process
const initializeI18n = async () => {
  const currentLanguage = await window.electron.getLanguage();

  i18n
    .use(i18nextElectronFsBackend as Module)
    .use(initReactI18next)
    .init({
      fallbackLng: LNG.DEFAULT_LANGUAGE,
      debug: true,
      resources: {
        en: {
          translation: enCommon,
        },
        pt: {
          translation: ptCommon,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      saveMissing: true,
      saveMissingTo: 'current',
      lng: currentLanguage, // Use the language fetched from the main process
      supportedLngs: LNG.SUPPORTED_LANGUAGES,
    });
};

initializeI18n();

export default i18n;