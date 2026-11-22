/**
 * Lớp lưu trữ key-value tối giản.
 * - Có UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (hoặc KV_REST_API_URL + KV_REST_API_TOKEN do Vercel tạo)
 *   -> lưu bền vững trên Upstash Redis qua REST, không cần thư viện.
 * - Không có -> lưu trong bộ nhớ server: mất khi function khởi động lại, mỗi instance một bản. Chỉ để demo.
 */
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { nx?: boolean }): Promise<boolean>;
  del(key: string): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, entries: Record<string, string>): Promise<void>;
}

function upstash(url: string, token: string): KV {
  async function cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(url.replace(/\/+$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.error) throw new Error(`Upstash: ${body.error ?? res.status}`);
    return body.result as T;
  }
  return {
    get: (k) => cmd<string | null>("GET", k),
    async set(k, v, o) {
      const r = await cmd<string | null>(...(o?.nx ? ["SET", k, v, "NX"] : ["SET", k, v]));
      return r === "OK";
    },
    async del(k) {
      await cmd("DEL", k);
    },
    hget: (k, f) => cmd<string | null>("HGET", k, f),
    async hgetall(k) {
      const flat = await cmd<string[]>("HGETALL", k);
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
    async hset(k, entries) {
      const pairs = Object.entries(entries).flat();
      if (pairs.length) await cmd("HSET", k, ...pairs);
    },
  };
}

function memory(): KV {
  const g = globalThis as unknown as { __mjKV?: { s: Map<string, string>; h: Map<string, Map<string, string>> } };
  const db = (g.__mjKV ??= { s: new Map(), h: new Map() });
  const hash = (k: string) => {
    let m = db.h.get(k);
    if (!m) db.h.set(k, (m = new Map()));
    return m;
  };
  return {
    get: async (k) => db.s.get(k) ?? null,
    async set(k, v, o) {
      if (o?.nx && db.s.has(k)) return false;
      db.s.set(k, v);
      return true;
    },
    async del(k) {
      db.s.delete(k);
      db.h.delete(k);
    },
    hget: async (k, f) => db.h.get(k)?.get(f) ?? null,
    hgetall: async (k) => Object.fromEntries(db.h.get(k) ?? []),
    async hset(k, e) {
      const m = hash(k);
      for (const [f, v] of Object.entries(e)) m.set(f, v);
    },
  };
}

export function storeKind(): "upstash" | "memory" {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? "upstash" : "memory";
}

let cached: KV | null = null;
export function kv(): KV {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  cached = url && token ? upstash(url, token) : memory();
  return cached;
}
