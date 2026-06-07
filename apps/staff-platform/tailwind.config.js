const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        brand: {
            50: '#fff5f5',
            100: '#ffdfdf', 
            200: '#ffc9c9',
            300: '#ffb3b3',
            400: '#ff9999',
            500: '#ff8080',
            600: '#cc6666',
            700: '#994d4d',
            800: '#8d472e', 
            900: '#260b02', 
            950: '#1a0701',
        },
        primary: {
            DEFAULT: 'hsl(var(--primary))',
            foreground: 'hsl(var(--primary-foreground))',
            50: '#fff5f5',
            100: '#ffdfdf',
            200: '#ffc9c9',
            300: '#b88570',
            400: '#a57460',
            500: '#8d472e',  
            600: '#7a3e28',
            700: '#663420',
            800: '#532b1a',
            900: '#260b02',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        // Enforcing classic minimalism by aggressively reducing shadow depth and spread
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.01)',
        DEFAULT: '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        md: '0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        lg: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        // Overriding modern heavily rounded defaults to a snappy classic 2px flat radius
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
};
