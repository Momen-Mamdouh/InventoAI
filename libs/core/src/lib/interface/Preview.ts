export interface PreviewProduct {
  readonly name: string;
  readonly price: number;
  readonly badge: string;
}

export interface ThemeSuggestion {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    destructive: string;
    border: string;
    ring: string;
  };
  radius: string;
}

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';
export type PreviewSize = 'S' | 'M' | 'L' | 'XL';

export interface Viewport {
  readonly id: PreviewViewport;
  readonly icon: string;
  readonly label: string;
  readonly width: string;
}
