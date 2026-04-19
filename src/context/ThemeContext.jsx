import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import i18n from 'i18next';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user?.user);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aiexpenser-theme') || 'dark';
  });
  
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('aiexpenser-accent') || 'lightblue';
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('i18nextLng') || 'en';
  });

  // Hydrate from DB when user logs in or preferences are updated
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.theme && user.preferences.theme !== theme) {
        setTheme(user.preferences.theme);
      }
      if (user.preferences.accentColor && user.preferences.accentColor !== accentColor) {
        setAccentColor(user.preferences.accentColor);
      }
      if (user.preferences.language && user.preferences.language !== language) {
        setLanguage(user.preferences.language);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferences?.theme, user?.preferences?.accentColor, user?.preferences?.language]);

  useEffect(() => {
    const root = document.documentElement;
    // Check if we are on a public auth route
    const isAuthRoute = location.pathname === '/' || location.pathname === '/signup';

    if (isAuthRoute) {
      // Force 'dark' theme on auth routes to match redesign
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      // Apply user preference
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
          root.classList.remove('light');
        } else {
          root.classList.remove('dark');
          root.classList.add('light');
        }
      }
    }
  }, [theme, location.pathname]);

  useEffect(() => {
    // Only save to localStorage when theme updates
    localStorage.setItem('aiexpenser-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', accentColor);
    localStorage.setItem('aiexpenser-accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
      localStorage.setItem('i18nextLng', language);
    }
  }, [language]);

  return (
    <ThemeContext.Provider value={{ 
      theme, setTheme, 
      accentColor, setAccentColor, 
      language, setLanguage 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
