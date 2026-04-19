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
        // AIEXPENSER Design System
        bg: 'var(--bg)',
        bg2: 'var(--bg2)',
        bg3: 'var(--bg3)',
        bg4: 'var(--bg4)',
        bg5: 'var(--bg5)',
        text: 'var(--text)',
        text2: 'var(--text2)',
        text3: 'var(--text3)',
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        green: 'var(--green)',
        'green-bg': 'var(--green-bg)',
        red: 'var(--red)',
        'red-bg': 'var(--red-bg)',
        amber: 'var(--amber)',
        'amber-bg': 'var(--amber-bg)',
        purple: 'var(--purple)',
        'purple-bg': 'var(--purple-bg)',
        border: 'var(--border)',
        border2: 'var(--border2)',
        border3: 'var(--border3)',
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
