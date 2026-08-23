export type SelectedAttributes = Record<string, string[]>;

/**
 * Parses the attributes string from the URL/API into an object.
 * Example: 'size:xl,l;color:black' -> { size: ['xl', 'l'], color: ['black'] }
 */
export function parseAttributes(attributesString: string | null | undefined): SelectedAttributes {
  if (!attributesString) {
    return {};
  }

  const result: SelectedAttributes = {};
  const facets = attributesString.split(';');

  for (const facet of facets) {
    if (!facet) continue;
    const [key, valuesStr] = facet.split(':');
    if (key && valuesStr) {
      result[key] = valuesStr.split(',').filter(Boolean);
    }
  }

  return result;
}

/**
 * Stringifies a SelectedAttributes object into the format required by the API and URL.
 * Example: { size: ['xl', 'l'], color: ['black'] } -> 'size:xl,l;color:black'
 */
export function stringifyAttributes(attributes: SelectedAttributes): string {
  const facets: string[] = [];

  for (const [key, values] of Object.entries(attributes)) {
    if (values && values.length > 0) {
      facets.push(`${key}:${values.join(',')}`);
    }
  }

  return facets.join(';');
}
