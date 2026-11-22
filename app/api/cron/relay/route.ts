import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { runRelay } from "@/lib/relay";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Vercel Cron gọi route này kèm header Authorization: Bearer <CRON_SECRET>. */
export async function GET(req: Request) {
  const cfg = getConfig();
  if (!cfg.cronSecret || req.headers.get("authorization") !== `Bearer ${cfg.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (cfg.liveLocked) {
    return NextResponse.json({ error: "Đặt DASHBOARD_PASSWORD trước khi chạy với dữ liệu thật." }, { status: 403 });
  }
  const report = await runRelay({ dryRun: false });
  // Log gọn để xem trong Vercel Logs, không in thông tin ứng viên.
  console.log(JSON.stringify({ relay: report.mode, ranAt: report.ranAt, counts: report.counts,
    jobErrors: report.jobs.filter((j) => j.error).map((j) => ({ job: j.jobExternalId, error: j.error })) }));
  return NextResponse.json({ ranAt: report.ranAt, counts: report.counts });
}
