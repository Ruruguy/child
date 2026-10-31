import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PEDS/TAPE｜小兒尺與生命徵象",
  description: "手機橫放滿版的小兒尺、器材與正常生命徵象互動速查工具。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "PEDS/TAPE｜小兒尺與生命徵象", description: "小兒尺、急救器材、劑量與年齡生命徵象速查。", images: [{ url: "/og.png", width: 1536, height: 1024 }] },
  twitter: { card: "summary_large_image", title: "PEDS/TAPE｜小兒尺與生命徵象", description: "手機橫放滿版的小兒救護速查工具。", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
