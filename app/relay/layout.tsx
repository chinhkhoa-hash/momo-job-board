import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chuyển hồ sơ sang iPOS",
  robots: { index: false, follow: false },
};

export default function RelayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
