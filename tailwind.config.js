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
        'surface-bright': 'var(--surface-highest)',
        'surface-container-lowest': 'var(--input-bg)',
        'surface-container-low': 'var(--surface-low)',
        'surface-container': 'var(--surface-mid)',
        'surface-container-high': 'var(--surface-high)',
        'surface-container-highest': 'var(--surface-highest)',
        'surface-variant': 'var(--hover-bg)',
        'inverse-surface': 'var(--text-primary)',
        'inverse-on-surface': 'var(--bg-primary)',

        'on-surface': 'var(--text-primary)',
        'on-surface-variant': 'var(--text-muted)',
        'on-background': 'var(--text-primary)',

        primary: 'var(--brand-primary)',
        'on-primary': '#ffffff',
        'primary-container': 'var(--brand-accent)',
        'on-primary-container': '#ffffff',
        'inverse-primary': 'var(--text-muted)',

        secondary: 'var(--brand-primary)',
        'on-secondary': '#ffffff',
        'secondary-container': 'var(--surface-mid)',
        'on-secondary-container': 'var(--text-primary)',

        outline: 'var(--border-color)',
        'outline-variant': 'var(--border-color)',

        error: '#ffb4ab',
        'on-error': '#690005',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',

        // Premium Branded Colors
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
        },
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
