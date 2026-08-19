import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resources from './locales'

const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('dsa_app_lang') || 'en' : 'en'

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export const changeLanguage = (lng: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dsa_app_lang', lng)
  }
  i18n.changeLanguage(lng)
}

export default i18n
