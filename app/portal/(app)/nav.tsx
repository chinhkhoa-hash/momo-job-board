"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PortalNav({ admin }: { admin: boolean }) {
  const path = usePathname();
  const items = [
    { href: "/portal", label: "Tổng quan", on: path === "/portal" },
    { href: "/portal/jobs", label: "Tin tuyển dụng", on: path.startsWith("/portal/jobs") },
    { href: "/portal/applicants", label: "Ứng viên", on: path.startsWith("/portal/applicants") },
  ];
  return (
    <nav className="p-nav" aria-label="Quản lý">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={i.on ? "page" : undefined}>{i.label}</Link>
      ))}
      {admin && <Link href="/relay">Chuyển hồ sơ sang iPOS</Link>}
      <Link href="/jobs" target="_blank">Xem trang ứng viên</Link>
    </nav>
  );
}
