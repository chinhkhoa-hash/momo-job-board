import { kv, storeKind } from "./kv";
import { buildSeed } from "./seed";
import type { Application, StoredJob } from "../portal/model";

const K = { jobs: "mj:jobs", apps: "mj:apps", seeded: "mj:seeded:v1", cv: (id: string) => `mj:cv:${id}` };

let seeding: Promise<void> | null = null;
/** Lần đầu chạy với kho trống thì nạp dữ liệu mẫu. */
async function ensureSeed() {
  seeding ??= (async () => {
    if (!(await kv().set(K.seeded, new Date().toISOString(), { nx: true }))) return;
    const { jobs, apps } = buildSeed();
    await kv().hset(K.jobs, Object.fromEntries(jobs.map((j) => [j.id, JSON.stringify(j)])));
    await kv().hset(K.apps, Object.fromEntries(apps.map((a) => [a.id, JSON.stringify(a)])));
  })().catch((e) => {
    seeding = null;
    throw e;
  });
  await seeding;
}

const parse = <T,>(raw: Record<string, string>) => Object.values(raw).map((v) => JSON.parse(v) as T);

export async function listJobs(): Promise<StoredJob[]> {
  await ensureSeed();
  return parse<StoredJob>(await kv().hgetall(K.jobs));
}
export async function getJob(id: string): Promise<StoredJob | null> {
  await ensureSeed();
  const v = await kv().hget(K.jobs, id);
  return v ? (JSON.parse(v) as StoredJob) : null;
}
export async function saveJob(j: StoredJob) {
  await kv().hset(K.jobs, { [j.id]: JSON.stringify(j) });
}

export async function listApps(): Promise<Application[]> {
  await ensureSeed();
  return parse<Application>(await kv().hgetall(K.apps));
}
export async function getApp(id: string): Promise<Application | null> {
  await ensureSeed();
  const v = await kv().hget(K.apps, id);
  return v ? (JSON.parse(v) as Application) : null;
}
export async function saveApp(a: Application) {
  await kv().hset(K.apps, { [a.id]: JSON.stringify(a) });
}

export async function saveCv(id: string, data: { name: string; type: string; base64: string }) {
  await kv().set(K.cv(id), JSON.stringify(data));
}
export async function getCv(id: string): Promise<{ name: string; type: string; base64: string } | null> {
  const v = await kv().get(K.cv(id));
  return v ? JSON.parse(v) : null;
}

/** Xoá toàn bộ và nạp lại dữ liệu mẫu (chỉ admin, chỉ chế độ demo). */
export async function resetDemo() {
  await kv().del(K.jobs);
  await kv().del(K.apps);
  await kv().del(K.seeded);
  seeding = null;
  await ensureSeed();
}

export { storeKind };
