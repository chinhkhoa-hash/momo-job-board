import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chuyển hồ sơ MoMo Jobs → iPOS HRM",
  description: "Đẩy hồ sơ ứng viên từ Merchant Job Board sang iPOS HRM qua webhook.",
  robots: { index: false, follow: false },
};

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
