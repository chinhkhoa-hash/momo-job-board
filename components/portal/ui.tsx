import type { AppStatus, JobStatus } from "@/lib/portal/model";
import { APP_STATUS, JOB_STATUS } from "@/lib/portal/status";

export function AppChip({ s }: { s: AppStatus }) {
  const v = APP_STATUS[s];
  return <span className={`p-chip p-chip-${v.tone}`}>{v.label}</span>;
}
export function JobChip({ s }: { s: JobStatus }) {
  const v = JOB_STATUS[s];
  return <span className={`p-chip p-chip-${v.tone}`}>{v.label}</span>;
}

const dt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
export function fmtDateTime(iso: string) {
  const v = Object.fromEntries(dt.formatToParts(Date.parse(iso)).map((p) => [p.type, p.value]));
  return `${v.day}/${v.month}/${v.year} ${v.hour}:${v.minute}`;
}
export function fmtDate(isoOrYmd: string) {
  const [y, m, d] = isoOrYmd.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
export const maskPhone = (p: string) => (p.length > 6 ? `${p.slice(0, 4)}***${p.slice(-3)}` : "***");
export const pct = (x: number) => `${Math.round(x * 100)}%`;
