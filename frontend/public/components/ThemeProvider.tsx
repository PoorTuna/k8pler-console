import * as React from 'react';
import { useUserSettings } from '@console/shared';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v5-theme-dark';
const THEME_DARK_CLASS_LEGACY = 'pf-theme-dark'; // legacy class name needed to support PF4
const THEME_DARK = 'dark';

// Themes that are visual variants of "dark" -- they get the PF dark class (for sane
// shadow/border defaults) plus their own class carrying the accent palette override.
const DARK_FLAVOR_CLASSES: Record<string, string> = {
  'gruvbox-dark': 'co-theme-gruvbox-dark',
  'kubana-dark': 'co-theme-kubana-dark',
  matrix: 'co-theme-matrix',
  'neon-punk': 'co-theme-neon-punk',
};

// Themes that are visual variants of "light" -- no PF dark class, just their own class.
const LIGHT_FLAVOR_CLASSES: Record<string, string> = {
  orokin: 'co-theme-orokin',
  'kubana-light': 'co-theme-kubana-light',
};

// Classes toggled by updateThemeClass. Kept mutually exclusive: exactly one theme's
// classes (or none, for plain light) are present on the element at a time.
const ALL_THEME_CLASSES = [
  THEME_DARK_CLASS,
  THEME_DARK_CLASS_LEGACY,
  ...Object.values(DARK_FLAVOR_CLASSES),
  ...Object.values(LIGHT_FLAVOR_CLASSES),
];

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = THEME_DARK;
  }
  const resolvedTheme = theme === THEME_SYSTEM_DEFAULT ? systemTheme : theme;

  htmlTagElement.classList.remove(...ALL_THEME_CLASSES);
  if (resolvedTheme === THEME_DARK) {
    htmlTagElement.classList.add(THEME_DARK_CLASS, THEME_DARK_CLASS_LEGACY);
  } else if (DARK_FLAVOR_CLASSES[resolvedTheme]) {
    htmlTagElement.classList.add(
      THEME_DARK_CLASS,
      THEME_DARK_CLASS_LEGACY,
      DARK_FLAVOR_CLASSES[resolvedTheme],
    );
  } else if (LIGHT_FLAVOR_CLASSES[resolvedTheme]) {
    htmlTagElement.classList.add(LIGHT_FLAVOR_CLASSES[resolvedTheme]);
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
