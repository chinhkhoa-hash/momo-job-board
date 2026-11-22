import { NextResponse } from "next/server";
import { getSession } from "@/lib/portal/auth";
import { scopedApps } from "@/lib/portal/service";
import { filterApps, parseAppFilter } from "@/lib/portal/filter";
import { toCsv } from "@/lib/portal/service";
import { APP_STATUS } from "@/lib/portal/status";
import type { AppStatus } from "@/lib/portal/model";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const list = filterApps(await scopedApps(u), parseAppFilter(params));
  const labels = Object.fromEntries(Object.entries(APP_STATUS).map(([k, v]) => [k, v.label])) as Record<AppStatus, string>;
  console.log(JSON.stringify({ csvExport: u.username, rows: list.length, at: new Date().toISOString() }));
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(list, labels), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ung-vien-${day}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
