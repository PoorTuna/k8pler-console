import * as React from 'react';
import { useUserSettings } from '@console/shared';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v5-theme-dark';
const THEME_DARK_CLASS_LEGACY = 'pf-theme-dark'; // legacy class name needed to support PF4
const THEME_OROKIN_CLASS = 'co-theme-orokin';
const THEME_DARK = 'dark';
const THEME_OROKIN = 'orokin';

// Classes toggled by updateThemeClass. Kept mutually exclusive: exactly one theme's
// classes (or none, for plain light) are present on the element at a time.
const ALL_THEME_CLASSES = [THEME_DARK_CLASS, THEME_DARK_CLASS_LEGACY, THEME_OROKIN_CLASS];

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = THEME_DARK;
  }
  const resolvedTheme = theme === THEME_SYSTEM_DEFAULT ? systemTheme : theme;

  htmlTagElement.classList.remove(...ALL_THEME_CLASSES);
  if (resolvedTheme === THEME_DARK) {
    htmlTagElement.classList.add(THEME_DARK_CLASS, THEME_DARK_CLASS_LEGACY);
  } else if (resolvedTheme === THEME_OROKIN) {
    htmlTagElement.classList.add(THEME_OROKIN_CLASS);
  }
};

export const ThemeContext = React.createContext<string>('');

export const ThemeProvider: React.FC<{}> = ({ children }) => {
  const htmlTagElement = document.documentElement;
  const localTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);
  const [theme, , themeLoaded] = useUserSettings(
    THEME_USER_SETTING_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const mqListener = React.useCallback(() => {
    updateThemeClass(htmlTagElement, theme);
  }, [htmlTagElement, theme]);
  React.useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme === THEME_SYSTEM_DEFAULT) {
      darkThemeMq.addEventListener('change', mqListener);
    }
    if (themeLoaded) {
      updateThemeClass(htmlTagElement, theme);
    }
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, [htmlTagElement, mqListener, theme, themeLoaded]);

  React.useEffect(() => {
    themeLoaded && localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
  }, [theme, themeLoaded]);

  const value = themeLoaded ? theme : localTheme;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
