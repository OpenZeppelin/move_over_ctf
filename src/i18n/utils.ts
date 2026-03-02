/**
 * Replaces {key} placeholders in a string with values from the given object.
 * Use for SEO templates like "Level {id}: {name} | Move-over".
 */
export function replaceTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}
