"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isDemoAuth, login, logout, requireSession } from "@/lib/portal/auth";
import type { AppStatus, JobStatus } from "@/lib/portal/model";
import { PortalError, changeStatus, revealPhone, saveJobFromForm, setJobStatus } from "@/lib/portal/service";
import { resetDemo } from "@/lib/store/db";

export type FormState = { error?: string; errors?: Record<string, string>; ok?: string } | undefined;

const msg = (e: unknown) => (e instanceof PortalError ? e.message : "Có lỗi khi lưu, thử lại sau ít phút.");

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  let ok = false;
  try {
    ok = Boolean(await login(String(fd.get("username") ?? ""), String(fd.get("password") ?? "")));
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!ok) return { error: "Sai tên đăng nhập hoặc mật khẩu." };
  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/portal") ? next : "/portal");
}

export async function logoutAction() {
  await logout();
  redirect("/portal/login");
}

export async function saveJobAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireSession();
  let id: string;
  try {
    const r = await saveJobFromForm(u, fd);
    if (r.errors) return { errors: r.errors, error: "Kiểm tra lại các ô được đánh dấu." };
    id = r.job!.id;
  } catch (e) {
    return { error: msg(e) };
  }
  revalidatePath("/portal", "layout");
  revalidatePath("/jobs", "layout");
  redirect(`/portal/jobs/${id}?saved=1`);
}

export async function jobStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireSession();
  const id = String(fd.get("id"));
  const to = String(fd.get("to")) as JobStatus;
  const reason = String(fd.get("reason") ?? "").trim();
  if (!["live", "paused", "expired", "draft"].includes(to)) return { error: "Thao tác không hợp lệ." };
  if (u.role === "admin" && to === "paused" && fd.get("moderate") === "1" && reason.length < 10) {
    return { error: "Ghi lý do tạm dừng (ít nhất 10 ký tự) để merchant biết cần sửa gì." };
  }
  try {
    await setJobStatus(u, id, to, fd.get("moderate") === "1" ? reason : undefined);
  } catch (e) {
    return { error: msg(e) };
  }
  revalidatePath("/portal", "layout");
  revalidatePath("/jobs", "layout");
  const labels: Record<JobStatus, string> = { live: "Đã đăng tin.", paused: "Đã tạm dừng tin.", expired: "Đã đóng tin.", draft: "Đã chuyển về nháp." };
  return { ok: labels[to] };
}

export async function appStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const u = await requireSession();
  try {
    await changeStatus(u, String(fd.get("id")), String(fd.get("to")) as AppStatus, {
      note: String(fd.get("note") ?? ""),
      onboardDate: String(fd.get("onboardDate") ?? ""),
      rejectReason: String(fd.get("rejectReason") ?? ""),
    });
  } catch (e) {
    return { error: msg(e) };
  }
  revalidatePath("/portal", "layout");
  return { ok: "Đã cập nhật trạng thái." };
}

export async function revealPhoneAction(id: string): Promise<{ phone?: string; error?: string }> {
  const u = await requireSession();
  try {
    return { phone: await revealPhone(u, id) };
  } catch (e) {
    return { error: msg(e) };
  }
}

export async function resetDemoAction() {
  const u = await requireSession();
  if (u.role !== "admin" || !isDemoAuth()) return;
  await resetDemo();
  revalidatePath("/", "layout");
  redirect("/portal?reset=1");
}
