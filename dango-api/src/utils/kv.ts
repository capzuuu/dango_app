/*
  Upstash/Vercel KV-compatible REST API client.

  We use an INCR + TTL operation.

  If UPSTASH_REDIS_REST_URL/TOKEN are missing, we fall back to an in-memory
  store for local dev.
*/

import { env } from '../env';

type KVIncrResult = number;

const memory = new Map<string, { count: number; expiresAt: number }>();

function now() {
  return Date.now();
}

export async function kvIncrWithTTL(key: string, windowSeconds: number): Promise<KVIncrResult> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    // In-memory fallback
    const existing = memory.get(key);
    const ttlMs = windowSeconds * 1000;
    const t = now();

    if (!existing || existing.expiresAt <= t) {
      memory.set(key, { count: 1, expiresAt: t + ttlMs });
      return 1;
    }

    const nextCount = existing.count + 1;
    memory.set(key, { ...existing, count: nextCount });
    return nextCount;
  }

  // REST API for Upstash Redis supports eval scripts via /{path}.
  // We'll use a simple Lua-like eval through Upstash REST endpoint.
  // Upstash supports: POST <url> with JSON { command, args }

  const url = `${env.UPSTASH_REDIS_REST_URL}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Upstash compatible command: INCR + EXPIRE
      // We do it atomically via Lua script.
      // Upstash format: { command: 'eval', args: [script, 1, key, windowSeconds] }
      // Many deployments support this. If not, this will fail and rate limit will fail open.
      command: 'eval',
      args: [
        "local current = redis.call('incr', KEYS[1]); if current == 1 then redis.call('expire', KEYS[1], ARGV[1]); end; return current;",
        1,
        key,
        windowSeconds
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`KV request failed: ${res.status}`);
  }

  const data = (await res.json()) as { result?: unknown };
  const result = data.result;

  if (typeof result === 'number') return result;
  if (typeof result === 'string') return parseInt(result, 10);

  throw new Error('Unexpected KV response');
}

