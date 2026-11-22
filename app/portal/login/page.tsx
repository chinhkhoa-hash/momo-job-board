import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoAccounts, getSession, isDemoAuth } from "@/lib/portal/auth";
import LoginForm from "./form";

export const metadata: Metadata = { title: "Đăng nhập quản lý tuyển dụng", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await getSession()) redirect("/portal");
  const { next } = await searchParams;
  const demo = isDemoAuth();
  const sample = demo ? demoAccounts().slice(0, 4) : [];
  return (
    <main className="p-login">
      <div className="p-login-card">
        <p className="p-login-mark" aria-hidden>M</p>
        <h1>Quản lý tuyển dụng</h1>
        <p className="p-login-sub">Dành cho nhà tuyển dụng và đội vận hành MoMo Jobs.</p>
        <LoginForm next={next ?? ""} />
        {demo && (
          <div className="p-login-demo">
            <p>Tài khoản demo, mật khẩu chung <code>demo123</code>:</p>
            <ul>
              {sample.map((a) => (
                <li key={a.username}>
                  <code>{a.username}</code> <span>{a.role === "admin" ? "MoMo vận hành, xem mọi thương hiệu" : a.name}</span>
                </li>
              ))}
              <li><span>Mỗi thương hiệu khác có tài khoản dạng <code>&lt;slug&gt;_demo</code>.</span></li>
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
