import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SAMPLE_BRANDS } from "../jobs/sample";
import type { Role, SessionUser } from "./model";

/**
 * Tài khoản:
 * - PORTAL_USERS (JSON) có giá trị -> chỉ dùng các tài khoản này, bắt buộc có SESSION_SECRET.
 *   Ví dụ: [{"username":"momo_ops","password":"...","role":"admin","name":"MoMo Vận hành"},
 *           {"username":"katinat_hr","password":"...","role":"merchant","brand":"katinat","name":"Katinat HR"}]
 * - Không có -> tài khoản demo (mật khẩu demo123), hiển thị ngay trên trang đăng nhập.
 */
type Account = SessionUser & { password: string };

const DEMO_PASSWORD = "demo123";
const COOKIE = "mj_session";
const TTL_S = 8 * 3600;

export function demoAccounts(): Account[] {
  return [
    { username: "momo_admin", name: "MoMo Vận hành", role: "admin", password: DEMO_PASSWORD },
    ...SAMPLE_BRANDS.map((b) => ({
      username: `${b.slug}_demo`, name: `${b.name} HR`, role: "merchant" as Role, brandSlug: b.slug, password: DEMO_PASSWORD,
    })),
  ];
}

export function isDemoAuth() {
  return !process.env.PORTAL_USERS;
}

function accounts(): Account[] {
  const raw = process.env.PORTAL_USERS;
  if (!raw) return demoAccounts();
  try {
    const list = JSON.parse(raw) as { username: string; password: string; role: Role; brand?: string; name?: string }[];
    return list.map((u) => ({ username: u.username, password: u.password, role: u.role, brandSlug: u.brand, name: u.name ?? u.username }));
  } catch {
    throw new Error("PORTAL_USERS không phải JSON hợp lệ.");
  }
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (isDemoAuth()) return "demo-session-secret-not-for-production";
  throw new Error("Thiếu SESSION_SECRET (ít nhất 16 ký tự) khi dùng PORTAL_USERS.");
}

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  Buffer.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).toString("base64url");

async function hmac(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function login(username: string, password: string): Promise<SessionUser | null> {
  const acc = accounts().find((a) => a.username === username.trim());
  if (!acc || !safeEqual(acc.password, password)) return null;
  const user: SessionUser = { username: acc.username, name: acc.name, role: acc.role, brandSlug: acc.brandSlug };
  const payload = b64url(enc.encode(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + TTL_S })));
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${await hmac(payload)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: TTL_S,
  });
  return user;
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  try {
    if (!safeEqual(await hmac(payload), sig)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    // Tài khoản bị xoá khỏi PORTAL_USERS thì phiên cũ hết hiệu lực.
    if (!accounts().some((a) => a.username === data.username && a.role === data.role)) return null;
    return { username: data.username, name: data.name, role: data.role, brandSlug: data.brandSlug };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) redirect("/portal/login");
  return s;
}

/** Merchant chỉ được đụng tới dữ liệu của thương hiệu mình. */
export function canAccessBrand(user: SessionUser, brandSlug: string) {
  return user.role === "admin" || user.brandSlug === brandSlug;
}
