import type { PreviewProduct } from '@invento/core';
import type { ThemeSuggestion } from '@invento/core';

export const MOCK_PREVIEW_TABS: string[] = ['Shop', 'Lookbook', 'About', 'Contact'];

export const MOCK_PREVIEW_PRODUCTS: PreviewProduct[] = [
  { name: 'Structured Overcoat', price: 380, badge: 'NEW' },
  { name: 'Technical Tee', price: 95, badge: 'BEST-SELLER' },
  { name: 'Utility Pant', price: 220, badge: 'PRE-ORDER' },
];

export const MOCK_THEMES: ThemeSuggestion[] = [
  {
    id: 'midnight-edge',
    name: 'Midnight Edge',
    description: 'Sharp, dark, and high-contrast. Built for brands that mean business.',
    radius: '0px',
    colors: {
      background: '#0a0a0a',
      foreground: '#f5f5f5',
      primary: '#e2e8f0',
      primaryForeground: '#0a0a0a',
      secondary: '#1a1a1a',
      secondaryForeground: '#f5f5f5',
      accent: '#2d2d2d',
      destructive: '#ef4444',
      border: '#2d2d2d',
      ring: '#e2e8f0',
    },
  },
  {
    id: 'eternal-love',
    name: 'Eternal Love',
    description: 'Warm rose tones with soft curves. Romance meets luxury.',
    radius: '16px',
    colors: {
      background: '#fff1f2',
      foreground: '#4c0519',
      primary: '#e11d48',
      primaryForeground: '#fff1f2',
      secondary: '#ffe4e6',
      secondaryForeground: '#9f1239',
      accent: '#fda4af',
      destructive: '#be123c',
      border: '#fecdd3',
      ring: '#e11d48',
    },
  },
  {
    id: 'solar-optimism',
    name: 'Solar Optimism',
    description: 'Energetic amber and golden tones with welcoming rounded shapes.',
    radius: '12px',
    colors: {
      background: '#fffbeb',
      foreground: '#451a03',
      primary: '#f59e0b',
      primaryForeground: '#1c1917',
      secondary: '#fef3c7',
      secondaryForeground: '#78350f',
      accent: '#fcd34d',
      destructive: '#dc2626',
      border: '#fde68a',
      ring: '#f59e0b',
    },
  },
  {
    id: 'arctic-minimal',
    name: 'Arctic Minimal',
    description: 'Ice-cold whites and steel blues. Clean, precise, no excess.',
    radius: '4px',
    colors: {
      background: '#f8fafc',
      foreground: '#0f172a',
      primary: '#0ea5e9',
      primaryForeground: '#f8fafc',
      secondary: '#e2e8f0',
      secondaryForeground: '#1e293b',
      accent: '#bae6fd',
      destructive: '#ef4444',
      border: '#cbd5e1',
      ring: '#0ea5e9',
    },
  },
];
