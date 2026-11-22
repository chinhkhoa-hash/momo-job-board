import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./site.css";
import "./portal.css";

export const metadata: Metadata = {
  title: { default: "MoMo Jobs – Tìm việc làm gần bạn", template: "%s · MoMo Jobs" },
  description: "Tìm việc bán thời gian, toàn thời gian, theo ca tại các thương hiệu F&B và bán lẻ. Ứng tuyển nhanh, không mất phí.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#a50064" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
