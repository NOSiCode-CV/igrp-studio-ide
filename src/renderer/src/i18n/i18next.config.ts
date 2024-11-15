import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { LNG } from '@renderer/constants/appConstants'

// Access the backend from the preload script
import backend from 'i18next-electron-fs-backend'

const isMac = window.api.i18nextElectronBackend.clientOptions.platform === 'darwin'
const isDev = window.api.i18nextElectronBackend.clientOptions.environment === 'development'
const prependPath =
  isMac && !isDev ? window.api.i18nextElectronBackend.clientOptions.resourcesPath : '.'

const path = isDev ? prependPath + '/src/renderer/src/i18n/locales' : 'locales'

if (!backend) {
  console.error('i18nextElectronBackend is not defined')
} else {
  i18n
    .use(backend)
    .use(initReactI18next)
    .init({
      fallbackLng: LNG.DEFAULT_LANGUAGE,
      debug: true,
      backend: {
        loadPath: path + '/{{lng}}/{{ns}}.json',
        addPath: path + '/{{lng}}/{{ns}}.missing.json'
      },
      interpolation: {
        escapeValue: false
      },
      saveMissing: true,
      saveMissingTo: 'current',
      lng: 'en',
      supportedLngs: LNG.SUPPORTED_LANGUAGES
    })
}

export default i18n
