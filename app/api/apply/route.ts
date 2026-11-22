import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/source";
import { todayVN } from "@/lib/jobs/format";

export const dynamic = "force-dynamic";

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Nhận hồ sơ ứng tuyển.
 * Bản demo chỉ kiểm tra dữ liệu và trả về thành công, KHÔNG lưu và KHÔNG gửi đi đâu.
 * Khi nối hệ thống thật, chuyển tiếp sang API nộp hồ sơ của Merchant Job Board (route /api/applications).
 */
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  const { job } = await getJob(String(b.jobId ?? ""));
  if (!job) return NextResponse.json({ error: "Không tìm thấy tin tuyển dụng." }, { status: 404 });
  if (job.deadline < todayVN()) return NextResponse.json({ error: "Tin đã hết hạn nhận hồ sơ." }, { status: 410 });
  if (job.directUrl) return NextResponse.json({ error: "Vị trí này nhận hồ sơ trên trang của thương hiệu." }, { status: 400 });

  const fullName = String(b.fullName ?? "").trim();
  const phone = String(b.phone ?? "").replace(/[\s.-]/g, "");
  const email = b.email ? String(b.email).trim() : "";
  const problems: string[] = [];
  if (fullName.length < 2 || fullName.length > 100) problems.push("họ tên");
  if (!PHONE_RE.test(phone)) problems.push("số điện thoại");
  if ((job.requireEmail && !email) || (email && !EMAIL_RE.test(email))) problems.push("email");
  if (job.requireCv && !b.cvFileName) problems.push("CV");
  if (b.consent !== true) problems.push("đồng ý chia sẻ thông tin");
  if (problems.length) {
    return NextResponse.json({ error: `Kiểm tra lại: ${problems.join(", ")}.` }, { status: 422 });
  }

  return NextResponse.json({ ok: true, demo: true, applicationId: `demo-${crypto.randomUUID()}` });
}
