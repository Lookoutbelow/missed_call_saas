type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60 * 1000;
const LIMIT = 60;

export function checkWebhookRateLimit(key: string) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS
    });

    return {
      allowed: true,
      remaining: LIMIT - 1
    };
  }

  if (existing.count >= LIMIT) {
    return {
      allowed: false,
      remaining: 0
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: LIMIT - existing.count
  };
}
