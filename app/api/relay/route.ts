import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { runRelay } from "@/lib/relay";
import { resetMock } from "@/lib/mock";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function locked() {
  return NextResponse.json(
    { error: "Đặt DASHBOARD_PASSWORD trước khi chạy với dữ liệu thật." },
    { status: 403 },
  );
}

/** GET: kiểm tra thử (không gửi gì). */
export async function GET() {
  if (getConfig().liveLocked) return locked();
  try {
    return NextResponse.json(await runRelay({ dryRun: true }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

/** POST: đẩy hồ sơ sang HRM. Body {"action":"reset"} chỉ dùng ở chế độ demo. */
export async function POST(req: Request) {
  const cfg = getConfig();
  if (cfg.liveLocked) return locked();
  const body = await req.json().catch(() => ({}));
  try {
    if (body?.action === "reset") {
      if (!cfg.mock) return NextResponse.json({ error: "Chỉ reset được ở chế độ demo." }, { status: 400 });
      resetMock();
      return NextResponse.json(await runRelay({ dryRun: true }));
    }
    return NextResponse.json(await runRelay({ dryRun: false }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
