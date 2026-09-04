/**
 * Parses a single CSS rule block's inner content (e.g. everything between
 * `:root {` and the matching `}`) into a flat object of CSS custom
 * properties, e.g. { '--background': 'oklch(0.98 0.005 270)' }.
 *
 * A naive `block.split(';')` breaks here because values like
 * `oklch(0.55 0.25 240)` contain spaces, and a regex matching
 * `--name: value;` pairs directly (rather than splitting/rejoining) keeps
 * each declaration intact regardless of what's inside the parentheses.
 */
function parseCssDeclarations(cssBlockContent: string): Record<string, string> {
  const result: Record<string, string> = {};
  const declarationPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;

  let match: RegExpExecArray | null;
  while ((match = declarationPattern.exec(cssBlockContent)) !== null) {
    const propertyName = match[1]?.trim();
    const propertyValue = match[2]?.trim();
    if (!propertyName || propertyValue === undefined) continue;
    result[propertyName] = propertyValue;
  }

  return result;
}

/**
 * Extracts the content of a specific top-level CSS selector block (e.g.
 * `:root` or `.dark`) from a larger CSS string. Walks brace depth rather
 * than using indexOf, so it's robust even if selector order changes or
 * nested rules (e.g. an @media block) are added later.
 */
function extractBlock(css: string, selector: string): string | null {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openPattern = new RegExp(`${escapedSelector}\\s*\\{`);
  const openMatch = openPattern.exec(css);
  if (!openMatch) return null;

  const contentStart = openMatch.index + openMatch[0].length;
  let depth = 1;
  let i = contentStart;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }

  return css.slice(contentStart, i - 1);
}

/**
 * Public entry point: parses both `:root {}` and `.dark {}` blocks out of
 * a rawCss string. This app only consumes `.light` (ThemeSuggestion has no
 * dark-mode variant), but `.dark` is still returned in case it's needed
 * later — extracting it costs nothing extra.
 */
export function parseThemeCss(rawCss: string): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const rootContent = extractBlock(rawCss, ':root');
  const darkContent = extractBlock(rawCss, '.dark');

  return {
    light: rootContent ? parseCssDeclarations(rootContent) : {},
    dark: darkContent ? parseCssDeclarations(darkContent) : {},
  };
}
