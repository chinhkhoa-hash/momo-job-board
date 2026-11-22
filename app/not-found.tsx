import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="s-wrap nf">
        <h1>Không tìm thấy trang này</h1>
        <p>Tin tuyển dụng có thể đã đóng hoặc đường dẫn bị sai.</p>
        <Link href="/jobs" className="btn btn-primary">Xem việc làm đang tuyển</Link>
      </main>
      <SiteFooter />
    </>
  );
}
