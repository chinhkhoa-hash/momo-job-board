import Link from "next/link";
import type { Brand } from "@/lib/jobs/types";
import { initials } from "@/lib/jobs/format";

export function SiteHeader({ active }: { active?: "jobs" | "faq" }) {
  return (
    <header className="s-header">
      <div className="s-wrap s-header-row">
        <Link href="/jobs" className="s-logo" aria-label="MoMo Jobs – trang việc làm">
          <span className="s-logo-mark" aria-hidden>M</span>
          <span>MoMo Jobs</span>
        </Link>
        <nav className="s-nav" aria-label="Điều hướng chính">
          <Link href="/jobs" aria-current={active === "jobs" ? "page" : undefined}>Việc làm</Link>
          <Link href="/faq" aria-current={active === "faq" ? "page" : undefined}>Câu hỏi thường gặp</Link>
        </nav>
      </div>
    </header>
  );
}

export function DemoNotice({ note }: { note?: string }) {
  return (
    <div className="s-demo" role="note">
      <div className="s-wrap">
        {note ?? "Bản demo: tin tuyển dụng là dữ liệu minh hoạ, hồ sơ gửi đi không chuyển tới nhà tuyển dụng."}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="s-footer">
      <div className="s-wrap">
        <p>Tìm việc và ứng tuyển trên MoMo Jobs hoàn toàn miễn phí.</p>
        <p>
          Gặp lỗi khi ứng tuyển? Liên hệ MoMo qua mục Trợ giúp trong ứng dụng. <Link href="/faq">Xem câu hỏi thường gặp</Link>
        </p>
      </div>
    </footer>
  );
}

export function BrandMark({ brand, size = 48 }: { brand: Brand; size?: number }) {
  if (brand.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="s-mark" src={brand.logoUrl} alt="" width={size} height={size} />;
  }
  return (
    <span
      className="s-mark s-mark-text"
      style={{ width: size, height: size, background: brand.color, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {initials(brand.name)}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span className="s-verified" title="Thông tin cửa hàng được xác thực qua hệ thống iPOS">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path d="M8 1l1.8 1.3 2.2-.1.7 2.1 1.8 1.3-.7 2.1.7 2.1-1.8 1.3-.7 2.1-2.2-.1L8 15l-1.8-1.3-2.2.1-.7-2.1L1.5 10.4l.7-2.1-.7-2.1 1.8-1.3.7-2.1 2.2.1z" fill="currentColor" />
        <path d="M5.2 8.2l1.9 1.9 3.7-3.9" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Đã xác thực iPOS
    </span>
  );
}
