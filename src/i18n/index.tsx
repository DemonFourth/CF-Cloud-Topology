import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en from './en.json';
import zh from './zh.json';

type Translations = typeof en;
type Language = 'en' | 'zh';

const translations: Record<Language, Translations> = { en, zh };

interface I18nContextValue {
  lang: Language;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(
    (localStorage.getItem('cloud-topology-lang') as Language) ?? 'zh'
  );

  const handleSetLang = useCallback((l: Language) => {
    setLang(l);
    localStorage.setItem('cloud-topology-lang', l);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const parts = key.split('.');
    let value: any = translations[lang];
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return key;
      }
    }
    if (typeof value !== 'string') return key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v)),
      value
    );
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, t, setLang: handleSetLang, toggleLang: () => handleSetLang(lang === 'en' ? 'zh' : 'en') }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}