/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Grupo EMI Falck — private security & prehospital medical emergencies (Colombia)
        // Primary: corporate red (alert-grade, security sector)
        // Burgundy: deep wine-red for footer chrome and dark accents (grupoemi.com brand)
        // Accent:  controlled amber for status badges (emergency, non-gold)
        // Neutral: carbon ink + off-white
        emi: {
          red: {
            50:  '#fff0f0',
            100: '#ffe0e1',
            200: '#ffc5c7',
            300: '#ff9599',
            400: '#ff5560',
            500: '#ff1f2d',
            600: '#f50011',  // vivid
            700: '#d4001a',  // principal brand — corporate red
            800: '#aa0016',  // dark / hover
            900: '#8c0015',
            950: '#4e0009',
          },
          // emi.granate.* re-points to emi.red.* — zero churn in consumer files
          granate: {
            50:  '#fff0f0',
            100: '#ffe0e1',
            200: '#ffc5c7',
            300: '#ff9599',
            400: '#ff5560',
            500: '#ff1f2d',
            600: '#f50011',
            700: '#d4001a',
            800: '#aa0016',
            900: '#8c0015',
            950: '#4e0009',
          },
          // Controlled amber for operational status (active, alert) — never competes with brand red
          accent: {
            50:  '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',  // principal amber
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          },
          // emi.gold.* re-points to emi.accent.* — zero churn in consumer files
          gold: {
            50:  '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
          },
          ink: {
            50:  '#f6f6f7',
            100: '#e4e4e7',
            200: '#c8c8ce',
            300: '#a0a0aa',
            400: '#76767f',
            500: '#5b5b64',
            600: '#47474e',
            700: '#38383d',
            800: '#26262a',  // primary text
            900: '#18181b',
            950: '#09090b',
          },
          cream: '#f8f8f8',   // resting background — clean neutral, not warm
          // Deep wine-red for footer chrome and dark accents — grupoemi.com palette
          // DO NOT use for primary actions; that role belongs to emi.red.*
          burgundy: {
            50:  '#fdf2f3',
            100: '#fce4e6',
            200: '#f8c5ca',
            300: '#f098a0',
            400: '#e36670',
            500: '#cb3a47',
            600: '#a8252e',  // on light bg — accessible, primary burgundy text
            700: '#891f27',  // deeper text / border
            800: '#5c1822',  // footer bg — main candidate (contrast vs white ≈ 10:1)
            900: '#3a0e16',  // footer bg — deeper / gradient target
            950: '#1f060a',  // deepest shadow / overlay
          },
        },
        // Legacy alias for backward compat with any existing brand references
        brand: {
          50:  '#fff0f0',
          500: '#ff1f2d',
          600: '#f50011',
          700: '#d4001a',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xs:  '2px',
        sm:  '4px',
        md:  '6px',
        lg:  '10px',
        xl:  '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card:            '0 1px 4px 0 rgba(26,20,20,0.08), 0 4px 16px 0 rgba(26,20,20,0.06)',
        'card-hover':    '0 8px 24px 0 rgba(26,20,20,0.14), 0 2px 8px 0 rgba(26,20,20,0.08)',
        'glow-granate':  '0 0 0 3px rgba(212,0,26,0.25)',   // corporate red glow
        'glow-red':      '0 0 0 3px rgba(212,0,26,0.25)',
        'glow-gold':     '0 0 0 3px rgba(245,158,11,0.30)', // amber glow (compat)
      },
      transitionTimingFunction: {
        'emi': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '250ms',
        'slow': '400ms',
      },
      screens: {
        sm:  '640px',
        md:  '768px',
        lg:  '1024px',
        xl:  '1280px',
        '2xl':'1536px',
      },
    },
  },
  plugins: [],
};
