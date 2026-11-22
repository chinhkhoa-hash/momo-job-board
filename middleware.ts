import { NextResponse, type NextRequest } from "next/server";

/**
 * Basic auth cho công cụ nội bộ (/relay và /api/relay) khi đặt DASHBOARD_PASSWORD.
 * Trang việc làm cho ứng viên (/jobs, /brand, /faq) luôn public.
 * Route cron dùng CRON_SECRET riêng nên không đi qua đây.
 */
export function middleware(req: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === password) return NextResponse.next();
    } catch {}
  }
  return new NextResponse("Cần đăng nhập", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="momo-jobs-internal", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/relay", "/relay/:path*", "/api/relay", "/api/relay/:path*"],
};
