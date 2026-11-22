import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/portal/auth";
import { brandsFor, storesOf } from "@/lib/portal/service";
import { todayVN } from "@/lib/jobs/format";
import JobForm from "@/components/portal/job-form";

export const metadata: Metadata = { title: "Đăng tin mới" };

export default async function NewJob() {
  const u = await requireSession();
  const brands = brandsFor(u).map((b) => ({ slug: b.slug, name: b.name }));
  const storesByBrand = Object.fromEntries(brands.map((b) => [b.slug, storesOf(b.slug)]));
  const d = new Date(Date.parse(todayVN()) + 30 * 86_400_000).toISOString().slice(0, 10);
  return (
    <>
      <header className="p-head">
        <div>
          <Link href="/portal/jobs" className="p-back">Tin tuyển dụng</Link>
          <h1>Đăng tin mới</h1>
        </div>
      </header>
      <JobForm brands={brands} storesByBrand={storesByBrand} isAdmin={u.role === "admin"} defaultDeadline={d} />
    </>
  );
}
