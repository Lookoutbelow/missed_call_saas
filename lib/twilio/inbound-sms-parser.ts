const STOP_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END"]);
const START_KEYWORDS = new Set(["START"]);

const ISSUE_PATTERNS: Array<{ issueType: string; match: RegExp }> = [
  { issueType: "water_heater", match: /\bwater heater|hot water|tankless\b/i },
  { issueType: "drain", match: /\bdrain|clog|backup|sewer|toilet\b/i },
  { issueType: "leak", match: /\bleak|burst|dripping|pipe\b/i },
  { issueType: "fixture", match: /\bfaucet|sink|shower|garbage disposal\b/i }
];

export function getSmsKeywordIntent(body: string) {
  const normalized = body.trim().toUpperCase();
  if (STOP_KEYWORDS.has(normalized)) {
    return "stop";
  }
  if (START_KEYWORDS.has(normalized)) {
    return "start";
  }
  return null;
}

export function parseIssueType(body: string) {
  const match = ISSUE_PATTERNS.find((pattern) => pattern.match.test(body));
  return match?.issueType ?? null;
}

export function parseUrgency(body: string): "emergency" | "same_day" | "standard" | null {
  if (/\bemergency|urgent|asap|immediately|flood|burst\b/i.test(body)) {
    return "emergency";
  }
  if (/\btoday|same day|this afternoon|tonight\b/i.test(body)) {
    return "same_day";
  }
  if (body.trim()) {
    return "standard";
  }
  return null;
}
