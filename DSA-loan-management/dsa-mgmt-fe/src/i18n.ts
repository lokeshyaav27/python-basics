import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from './locales'

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng)
}

export default i18n
