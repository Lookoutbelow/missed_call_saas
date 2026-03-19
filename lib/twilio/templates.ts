const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const DEFAULT_MISSED_CALL_TEMPLATE =
  "Sorry we missed your call. Thanks for reaching out to {{business_name}}. Reply with the issue and we'll get back to you ASAP.";

export function renderTemplate(template: string, variables: Record<string, string | null | undefined>) {
  return template.replace(VARIABLE_PATTERN, (_, key: string) => variables[key] ?? "");
}
