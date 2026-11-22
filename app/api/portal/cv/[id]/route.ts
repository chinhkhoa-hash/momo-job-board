import { NextResponse } from "next/server";
import { getSession } from "@/lib/portal/auth";
import { loadApp } from "@/lib/portal/service";
import { getCv } from "@/lib/store/db";

export const dynamic = "force-dynamic";

/** Tải CV: chỉ người có quyền với thương hiệu của hồ sơ. id là id hồ sơ, không phải id file. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: "Cần đăng nhập." }, { status: 401 });
  const a = await loadApp(u, (await params).id);
  if (!a?.cv) return NextResponse.json({ error: "Không tìm thấy CV." }, { status: 404 });
  const file = await getCv(a.cv.id);
  if (!file) return NextResponse.json({ error: "File CV không còn trong kho." }, { status: 404 });
  return new NextResponse(Buffer.from(file.base64, "base64"), {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
