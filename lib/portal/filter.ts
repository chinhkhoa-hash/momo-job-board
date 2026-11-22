import type { Application, AppStatus } from "./model";
import { APP_STATUS, applyCode, isOverdue } from "./status";
import { fold } from "../jobs/format";

export type AppFilter = { q: string; status: string; job: string; brand: string; overdue: boolean };

export function parseAppFilter(p: Record<string, string | string[] | undefined>): AppFilter {
  const one = (k: string) => {
    const v = p[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  return { q: one("q").slice(0, 60), status: one("status"), job: one("job"), brand: one("brand"), overdue: one("overdue") === "1" };
}

export function filterApps(apps: Application[], f: AppFilter, now = Date.now()) {
  const needle = fold(f.q.trim());
  return apps
    .filter((a) => !f.status || (f.status in APP_STATUS && a.status === (f.status as AppStatus)))
    .filter((a) => !f.job || a.jobId === f.job)
    .filter((a) => !f.brand || a.brandSlug === f.brand)
    .filter((a) => !f.overdue || isOverdue(a, now))
    .filter((a) => !needle || fold(`${a.fullName} ${a.phone} ${applyCode(a.id)} ${a.jobTitle}`).includes(needle))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function filterQuery(f: Partial<AppFilter>) {
  const s = new URLSearchParams();
  if (f.q) s.set("q", f.q);
  if (f.status) s.set("status", f.status);
  if (f.job) s.set("job", f.job);
  if (f.brand) s.set("brand", f.brand);
  if (f.overdue) s.set("overdue", "1");
  const str = s.toString();
  return str ? `?${str}` : "";
}
