import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, THEME_KEYS, ThemeName, ThemeConfig, setGlobalTheme, colors } from './colors';

const STORAGE_THEME_KEY = '@taskpilot_last_active_theme_v2';

interface ThemeContextValue {
  theme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES.purple,
  themeName: 'purple',
  setTheme: () => {},
  cycleTheme: () => {},
});

/**
 * Returns a theme that is guaranteed to be different from the previous one.
 */
export const getNextDifferentTheme = (prevTheme: ThemeName | null): ThemeName => {
  const candidates = THEME_KEYS.filter((name) => name !== prevTheme);
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || 'blue';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Pick an initial random theme on startup
    const initial = THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
    setGlobalTheme(initial);
    return initial;
  });

  useEffect(() => {
    const pickFreshThemeOnLaunch = async () => {
      try {
        const lastTheme = (await AsyncStorage.getItem(STORAGE_THEME_KEY)) as ThemeName | null;
        // Always pick a DIFFERENT theme every time the app opens
        const nextTheme = getNextDifferentTheme(lastTheme);
        setThemeName(nextTheme);
        setGlobalTheme(nextTheme);
        await AsyncStorage.setItem(STORAGE_THEME_KEY, nextTheme);
      } catch (err) {
        // Fallback to cycling
        setThemeName((prev) => {
          const next = getNextDifferentTheme(prev);
          setGlobalTheme(next);
          return next;
        });
      }
    };

    pickFreshThemeOnLaunch();
  }, []);

  const setTheme = (name: ThemeName) => {
    if (THEMES[name]) {
      setThemeName(name);
      setGlobalTheme(name);
      AsyncStorage.setItem(STORAGE_THEME_KEY, name).catch(() => {});
    }
  };

  const cycleTheme = () => {
    const next = getNextDifferentTheme(themeName);
    setTheme(next);
  };

  const currentThemeConfig = THEMES[themeName] || THEMES.purple;

  return (
    <ThemeContext.Provider
      value={{
        theme: currentThemeConfig,
        themeName,
        setTheme,
        cycleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
