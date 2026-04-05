import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.5rem',
        full: '0.75rem',
      },
      colors: {
        background: 'var(--bg-primary)',
        surface: 'var(--bg-card)',
        'surface-dim': 'var(--bg-primary)',
        'surface-bright': 'var(--bg-card)',
        'surface-container-lowest': 'var(--bg-primary)',
        'surface-container-low': 'var(--bg-primary)',
        'surface-container': 'var(--bg-card)',
        'surface-container-high': 'var(--bg-card)',
        'surface-container-highest': 'var(--bg-card)',
        'surface-variant': 'var(--hover-bg)',
        'inverse-surface': 'var(--text-primary)',
        'inverse-on-surface': 'var(--bg-primary)',

        'on-surface': 'var(--text-primary)',
        'on-surface-variant': 'var(--text-muted)',
        'on-background': 'var(--text-primary)',

        primary: 'var(--accent-color)',
        'on-primary': '#ffffff',
        'primary-container': 'var(--hover-bg)',
        'on-primary-container': 'var(--accent-color)',
        'inverse-primary': 'var(--text-muted)',

        secondary: 'var(--text-muted)',
        'on-secondary': '#ffffff',
        'secondary-container': 'var(--input-bg)',
        'on-secondary-container': 'var(--text-primary)',

        outline: 'var(--border-color)',
        'outline-variant': 'var(--border-color)',

        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',

        // Optional remnants
        tertiary: '#27e0a9',
        'on-tertiary': '#003827',
        'tertiary-container': '#001f14',
        'on-tertiary-container': '#00956e',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
