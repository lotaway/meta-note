import i18next from 'i18next'
import zhCN from './locales/zh-CN'
import en from './locales/en'

export const SUPPORTED_LANGUAGES = ['zh-CN', 'en'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

const LANGUAGE_STORAGE_KEY = 'meta-note.language'

function detectInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === 'zh-CN' || stored === 'en') return stored
  } catch (err) {
    console.debug('[i18n] localStorage read unavailable:', err)
  }
  return 'zh-CN'
}

i18next.init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options ?? {}) as string
}

export function currentLanguage(): AppLanguage {
  return i18next.language === 'en' ? 'en' : 'zh-CN'
}

export function setLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  } catch (err) {
    console.debug('[i18n] localStorage write unavailable:', err)
  }
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

export default i18next
