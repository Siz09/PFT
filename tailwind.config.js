/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{ts,tsx}',
    './screens/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './navigation/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Design system colours from CLAUDE.md
        income: {
          light: '#16A34A',
          dark: '#22C55E',
        },
        expense: {
          light: '#DC2626',
          dark: '#EF4444',
        },
        budget: {
          green: '#16A34A',
          amber: '#D97706',
          red: '#DC2626',
        },
      },
      spacing: {
        // Base unit: 4px — all spacing multiples of 4
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      fontFamily: {
        mono: ['Courier', 'monospace'], // tabular numbers for currency
      },
    },
  },
  plugins: [],
};
