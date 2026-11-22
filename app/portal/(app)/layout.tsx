import type { Metadata } from "next";
import Link from "next/link";
import { isDemoAuth, requireSession } from "@/lib/portal/auth";
import { storeKind } from "@/lib/store/db";
import { brandName } from "@/lib/portal/service";
import { logoutAction, resetDemoAction } from "../actions";
import PortalNav from "./nav";

export const metadata: Metadata = { title: { default: "Quản lý tuyển dụng", template: "%s · Quản lý tuyển dụng" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const u = await requireSession();
  const demo = isDemoAuth();
  const memory = storeKind() === "memory";
  return (
    <div className="p-shell">
      <aside className="p-side">
        <Link href="/portal" className="p-logo">
          <span className="s-logo-mark" aria-hidden>M</span>
          <span>Quản lý tuyển dụng</span>
        </Link>
        <p className="p-scope">{u.role === "admin" ? "MoMo vận hành · tất cả thương hiệu" : brandName(u.brandSlug ?? "")}</p>
        <PortalNav admin={u.role === "admin"} />
        <div className="p-user">
          <p>{u.name}</p>
          <form action={logoutAction}><button className="btn btn-link">Đăng xuất</button></form>
        </div>
      </aside>
      <div className="p-content">
        {(demo || memory) && (
          <div className="p-banner">
            {demo && <span>Chế độ demo: tài khoản dùng chung mật khẩu demo123.</span>}
            {memory && <span> Dữ liệu đang lưu tạm trong bộ nhớ server, có thể mất khi Vercel khởi động lại. Kết nối Upstash Redis để lưu lâu dài (xem README).</span>}
            {demo && u.role === "admin" && (
              <form action={resetDemoAction} className="p-banner-form">
                <button className="btn btn-link">Nạp lại dữ liệu mẫu</button>
              </form>
            )}
          </div>
        )}
        <main className="p-main">{children}</main>
      </div>
    </div>
  );
}
