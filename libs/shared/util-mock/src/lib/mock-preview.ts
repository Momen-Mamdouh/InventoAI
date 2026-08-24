import type { PreviewProduct } from '@invento/core';
import type { ThemeSuggestion } from '@invento/core';

export const MOCK_PREVIEW_TABS: string[] = [
  'preview_tab_1',
  'preview_tab_2',
  'preview_tab_3',
  'preview_tab_4',
];

export const MOCK_PREVIEW_PRODUCTS: PreviewProduct[] = [
  { name: 'preview_product_1', price: 380, badge: 'preview_badge_new' },
  { name: 'preview_product_2', price: 95, badge: 'preview_badge_bestseller' },
  { name: 'preview_product_3', price: 220, badge: 'preview_badge_preorder' },
];

export const MOCK_THEMES: ThemeSuggestion[] = [
  {
    id: 'midnight-edge',
    name: 'theme_midnight_edge',
    description: 'theme_midnight_edge_desc',
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
    name: 'theme_eternal_love',
    description: 'theme_eternal_love_desc',
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
    name: 'theme_solar_optimism',
    description: 'theme_solar_optimism_desc',
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
    name: 'theme_arctic_minimal',
    description: 'theme_arctic_minimal_desc',
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
