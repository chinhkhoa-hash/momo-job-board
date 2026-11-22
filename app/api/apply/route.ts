import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs/source";
import { todayVN } from "@/lib/jobs/format";
import { CV_MAX_BYTES, PortalError, createApplication } from "@/lib/portal/service";
import { isDemoAuth } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

const PHONE_RE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CV_EXT = [".pdf", ".doc", ".docx"];

/** Nhận hồ sơ từ form ứng tuyển (multipart/form-data) và lưu vào kho để merchant xử lý trong /portal. */
export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });

  const { job } = await getJob(String(fd.get("jobId") ?? ""));
  if (!job) return NextResponse.json({ error: "Không tìm thấy tin tuyển dụng." }, { status: 404 });
  if (job.deadline < todayVN()) return NextResponse.json({ error: "Tin đã hết hạn nhận hồ sơ." }, { status: 410 });
  if (job.directUrl) return NextResponse.json({ error: "Vị trí này nhận hồ sơ trên trang của thương hiệu." }, { status: 400 });

  const fullName = String(fd.get("fullName") ?? "").trim();
  const phone = String(fd.get("phone") ?? "").replace(/[\s.-]/g, "");
  const email = String(fd.get("email") ?? "").trim();
  const contactTime = String(fd.get("contactTime") ?? "").slice(0, 60);
  const file = fd.get("cv");
  const cv = file instanceof File && file.size > 0 ? file : null;

  const problems: string[] = [];
  if (fullName.length < 2 || fullName.length > 100) problems.push("họ tên");
  if (!PHONE_RE.test(phone)) problems.push("số điện thoại");
  if ((job.requireEmail && !email) || (email && !EMAIL_RE.test(email))) problems.push("email");
  if (job.requireCv && !cv) problems.push("CV");
  if (cv && (!CV_EXT.some((e) => cv.name.toLowerCase().endsWith(e)) || cv.size > CV_MAX_BYTES)) problems.push("CV (PDF/DOC/DOCX, tối đa 2 MB)");
  if (fd.get("consent") !== "true") problems.push("đồng ý chia sẻ thông tin");
  if (problems.length) return NextResponse.json({ error: `Kiểm tra lại: ${problems.join(", ")}.` }, { status: 422 });

  try {
    const { app, duplicate } = await createApplication({
      jobId: job.id, fullName, phone, email: email || undefined, contactTime: contactTime || undefined,
      cv: cv ? { name: cv.name.slice(0, 120), type: cv.type || "application/octet-stream", bytes: await cv.arrayBuffer() } : undefined,
    });
    return NextResponse.json({ ok: true, applicationId: app.id, duplicate, demo: isDemoAuth() });
  } catch (e) {
    const status = e instanceof PortalError ? 409 : 500;
    return NextResponse.json({ error: e instanceof PortalError ? e.message : "Chưa lưu được hồ sơ." }, { status });
  }
}
