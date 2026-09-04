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
  darkColors?: {
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
